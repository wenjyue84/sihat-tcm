/**
 * health_checks.mjs - the wearable / phone health-data checks of the `health` suite (regress/suites/health.mjs).
 *
 * Covers (hermetic stacks only - they create accounts and rows):
 *   - auth gate of every /api/health/* route, ingest-token lifecycle (create, shown once, rotate, revoke, only a SHA-256 stored)
 *   - POST /api/health/ingest: bearer auth, validation, plausible ranges, unit conversion, Health Auto Export shape, dedupe, caps
 *   - Apple Health export upload (export.xml and export.zip built from a tiny SYNTHETIC fixture), dedupe, header gate, garbage
 *   - Google Health OAuth 2.0 + PKCE against regress/fake-google.mjs (connect -> consent -> callback -> sync -> revoke -> disconnect),
 *     or - when the stack runs with ACI_GOOGLE=off - the honest "not configured" paths
 *   - readings are own-rows-only; no secret (token, refresh token, Apple XML) is returned or stored in clear
 *
 * It is deliberately NOT a browser test: Web Bluetooth parsing is covered by regress/health-connect.test.mjs (node --test)
 * and the UI wiring by the page checks in the `pages` suite + scripts/*_browser_test.py.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const isoAgo = (ms) => new Date(Date.now() - ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/* ------------------------------ fixtures ------------------------------ */
export function appleFixture(now = new Date()) {
  let s = readFileSync(join(HERE, "fixtures", "health", "export.template.xml"), "utf8");
  for (const n of [0, 1, 2, 3, 45]) s = s.replaceAll(`{{d${n}}}`, new Date(now.getTime() - n * 86400e3).toISOString().slice(0, 10));
  return s;
}

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

/** A single-entry ZIP (method 0 "stored"), enough for the server's archive/zip reader. */
export function storedZip(name, text) {
  const data = Buffer.from(text, "utf8"), nm = Buffer.from(name, "utf8"), crc = crc32(data);
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(0, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12);
  lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26); lh.writeUInt16LE(0, 28);
  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0, 8); cd.writeUInt16LE(0, 10); cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0x21, 14);
  cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(data.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(nm.length, 28);
  cd.writeUInt32LE(0, 42); // local header offset
  const localLen = lh.length + nm.length + data.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10); eocd.writeUInt32LE(cd.length + nm.length, 12); eocd.writeUInt32LE(localLen, 16);
  return Buffer.concat([lh, nm, data, cd, nm, eocd]);
}

/* -------------------------------- checks -------------------------------- */
export async function runDeviceChecks(t) {
  const u = t.uniq();
  const api = (path, o = {}) => t.api(path, { ...o, headers: { "X-Forwarded-For": t.ip(), ...(o.headers || {}) } });
  const mk = async (tag) => {
    const r = await t.signup(`hd-${tag}-${u}@example.com`, `HD ${tag}`, "patient", {}, t.ip());
    return { token: r.token, id: r.id };
  };
  const A = await mk("a"), B = await mk("b");
  t.check("setup.accounts", !!(A.token && B.token && A.id && B.id), "could not create two patient accounts");
  if (!A.token || !B.token) return;
  const dbRows = async (table) => (t.hasDb ? await t.dbTable(table) : null);
  const arr = (x) => (Array.isArray(x) ? x : []);

  /* ---- 1. auth gate on every route ---- */
  {
    const bad = [];
    const BAD = { raw: true, body: "{x", headers: { "Content-Type": "application/json" } };
    for (const [m, p, o] of [["GET", "/api/health/summary"], ["GET", "/api/health/readings"], ["POST", "/api/health/readings", BAD], ["DELETE", "/api/health/readings", BAD],
      ["POST", "/api/health/ingest-token", BAD], ["DELETE", "/api/health/ingest-token", BAD], ["POST", "/api/health/apple/import", BAD], ["GET", "/api/health/google/connect"],
      ["POST", "/api/health/google/sync", BAD], ["DELETE", "/api/health/google", BAD]]) {
      const r = await api(p, { method: m, ...(o || {}) });
      if (r.status !== 401) bad.push(`${m} ${p}=${r.status}`);
    }
    t.check("auth.every_route_requires_login", bad.length === 0, bad.join("; "));
    const garbage = await api("/api/health/summary", { token: "not-a-real-token" });
    t.check("auth.garbage_session_token_rejected", garbage.status === 401, `status=${garbage.status}`);
  }

  /* ---- 2. ingest token lifecycle ---- */
  const sumA0 = await api("/api/health/summary", { token: A.token });
  t.check("summary.shape", sumA0.status === 200 && sumA0.json?.ingest?.has_token === false && !!sumA0.json?.metrics?.heart_rate && sumA0.json?.server?.google && typeof sumA0.json.server.google.configured === "boolean",
    `status=${sumA0.status} ${sumA0.text.slice(0, 160)}`);
  const googleOn = sumA0.json?.server?.google?.configured === true;
  const c1 = await api("/api/health/ingest-token", { method: "POST", token: A.token });
  const tok1 = c1.json?.token || "";
  t.check("token.create_returns_secret_once", c1.status === 201 && /^shi_[A-Za-z0-9_-]{40,}$/.test(tok1) && typeof c1.json?.url === "string", `status=${c1.status} ${c1.text.slice(0, 120)}`);
  const sumA1 = await api("/api/health/summary", { token: A.token });
  t.check("token.summary_exposes_only_hint", sumA1.json?.ingest?.has_token === true && sumA1.json.ingest.hint === tok1.slice(-4) && !sumA1.text.includes(tok1), `ingest=${JSON.stringify(sumA1.json?.ingest)}`);
  if (t.hasDb) {
    const rows = arr(await dbRows("health_ingest_tokens")).filter((r) => r.user_id === A.id);
    t.check("token.only_sha256_stored", rows.length === 1 && rows[0].token_hash === sha256(tok1) && !JSON.stringify(rows).includes(tok1), `rows=${JSON.stringify(rows).slice(0, 200)}`);
  } else t.skip("token.only_sha256_stored", "no DB handle");
  const ing = (token, payload, o = {}) => api("/api/health/ingest", { method: "POST", token, body: payload, ...o });
  const reading = (over = {}) => ({ metric: "heart_rate", value: 72, unit: "bpm", measured_at: isoAgo(3600e3), source: "ACI", device: "Test Strap", ...over });

  /* ---- 3. ingest: auth, validation, ranges, units, dedupe ---- */
  {
    const noAuth = await ing("", [reading()]);
    const wrong = await ing("shi_" + "a".repeat(43), [reading()]);
    const jwt = await ing(A.token, [reading()]);   // a session token is not an ingest token
    t.check("ingest.auth_required", noAuth.status === 401 && wrong.status === 401 && jwt.status === 401, `none=${noAuth.status} wrong=${wrong.status} sessionJWT=${jwt.status}`);
    const t1 = isoAgo(5400e3), t2 = isoAgo(1800e3);
    const body = [reading({ measured_at: t1 }), reading({ metric: "spo2", value: 0.96, unit: "%", measured_at: t2 }), reading({ value: 400, measured_at: t2 }), reading({ metric: "blood_sugar", value: 5 }),
      reading({ metric: "body_temperature", value: 98.6, unit: "degF", measured_at: isoAgo(900e3) })];
    const r1 = await ing(tok1, body);
    t.check("ingest.accepts_valid_rejects_invalid", r1.status === 200 && r1.json?.accepted === 3 && r1.json?.inserted === 3 && arr(r1.json?.rejected).length === 2,
      `status=${r1.status} ${r1.text.slice(0, 260)}`);
    const r2 = await ing(tok1, body);
    t.check("ingest.replay_is_deduped", r2.status === 200 && r2.json?.inserted === 0 && r2.json?.duplicates === 3, `status=${r2.status} ${r2.text.slice(0, 200)}`);
    const list = await api("/api/health/readings?days=2&limit=50", { token: A.token });
    const byM = Object.fromEntries(arr(list.json?.readings).map((x) => [x.metric, x]));
    t.check("ingest.units_converted", Math.abs((byM.body_temperature?.value ?? 0) - 37) < 0.01 && byM.spo2?.value === 96 && byM.heart_rate?.value === 72, `readings=${JSON.stringify(byM).slice(0, 300)}`);
    t.check("ingest.out_of_range_not_stored", !arr(list.json?.readings).some((x) => x.value === 400), "a 400 bpm reading was stored");
    t.check("ingest.source_and_device_recorded", byM.heart_rate?.source === "ingest" && byM.heart_rate?.device === "Test Strap / ACI", `got ${JSON.stringify(byM.heart_rate)}`);
    // payload shapes
    const hae = { data: { metrics: [{ name: "heart_rate", units: "count/min", data: [{ date: new Date(Date.now() - 7200e3).toISOString().replace("T", " ").replace(/\.\d+Z/, " +0000"), qty: 66, source: "Apple Watch" }] },
      { name: "blood_pressure", units: "mmHg", data: [{ date: new Date(Date.now() - 7300e3).toISOString().replace("T", " ").replace(/\.\d+Z/, " +0000"), systolic: 121, diastolic: 79 }] },
      { name: "dietary_water", units: "mL", data: [{ date: "2026-01-01 10:00:00 +0000", qty: 250 }] }] } };
    const rh = await ing(tok1, hae);
    t.check("ingest.health_auto_export_shape", rh.status === 200 && rh.json?.inserted === 3 && rh.json?.skipped_unknown_metrics === 1, `status=${rh.status} ${rh.text.slice(0, 200)}`);
    const rw = await ing(tok1, { readings: [reading({ measured_at: isoAgo(2 * 3600e3 + 11e3) })] });
    const rs = await ing(tok1, reading({ measured_at: isoAgo(2 * 3600e3 + 22e3) }));
    t.check("ingest.wrapper_and_single_shapes", rw.status === 200 && rw.json?.inserted === 1 && rs.status === 200 && rs.json?.inserted === 1, `wrapper=${rw.status} single=${rs.status}`);
    const none = await ing(tok1, [reading({ value: 999 })]);
    t.check("ingest.nothing_valid_is_400", none.status === 400, `status=${none.status}`);
    const empty = await ing(tok1, []);
    const junk = await api("/api/health/ingest", { method: "POST", token: tok1, raw: true, body: "{nope", headers: { "Content-Type": "application/json" } });
    t.check("ingest.malformed_bodies_4xx", empty.status === 400 && junk.status === 400, `empty=${empty.status} junk=${junk.status}`);
    const many = await ing(tok1, Array.from({ length: 501 }, (_, i) => reading({ measured_at: isoAgo((i + 100) * 60e3) })));
    t.check("ingest.batch_cap", many.status === 400, `501 readings -> ${many.status}`);
    const huge = await ing(tok1, [reading({ device: "x".repeat(600 * 1024) })]);
    t.check("ingest.body_cap_413", huge.status === 413, `600 KB body -> ${huge.status}`);
    const text = await api("/api/health/ingest", { method: "POST", token: tok1, raw: true, body: JSON.stringify([reading()]), headers: { "Content-Type": "text/plain" } });
    t.check("ingest.requires_json_content_type", text.status === 415, `text/plain -> ${text.status}`);
    const spoof = await ing(tok1, [{ ...reading({ measured_at: isoAgo(77 * 60e3) }), user_id: B.id }]);
    const bList = await api("/api/health/readings?limit=200", { token: B.token });
    t.check("ingest.cannot_write_to_another_user", spoof.status === 200 && arr(bList.json?.readings).length === 0, `spoof=${spoof.status} B sees ${arr(bList.json?.readings).length}`);
    // rate limit: 60 requests / minute / token
    let limited = 0;
    for (let i = 0; i < 70 && !limited; i++) if ((await ing(tok1, [reading({ measured_at: isoAgo((i + 200) * 60e3) })])).status === 429) limited++;
    t.check("ingest.per_token_rate_limit", limited > 0, "70 requests in a row never hit the per-token limit (60/min)");
  }

  /* ---- 4. rotate + revoke ---- */
  {
    const c2 = await api("/api/health/ingest-token", { method: "POST", token: A.token });
    const tok2 = c2.json?.token || "";
    const old = await ing(tok1, [reading({ measured_at: isoAgo(88 * 60e3) })]);
    const fresh = await ing(tok2, [reading({ measured_at: isoAgo(89 * 60e3) })]);
    t.check("token.rotate_kills_old_token", c2.status === 201 && tok2 && tok2 !== tok1 && old.status === 401 && fresh.status === 200, `new=${c2.status} old=${old.status} fresh=${fresh.status}`);
    if (t.hasDb) {
      const rows = arr(await dbRows("health_ingest_tokens")).filter((r) => r.user_id === A.id);
      t.check("token.rotate_keeps_one_row", rows.length === 1 && rows[0].token_hash === sha256(tok2), `rows=${rows.length}`);
    }
    const del = await api("/api/health/ingest-token", { method: "DELETE", token: A.token });
    const after = await ing(tok2, [reading({ measured_at: isoAgo(90 * 60e3) })]);
    const sum = await api("/api/health/summary", { token: A.token });
    t.check("token.revoke", del.status === 200 && after.status === 401 && sum.json?.ingest?.has_token === false, `del=${del.status} after=${after.status} has_token=${sum.json?.ingest?.has_token}`);
    const bTok = (await api("/api/health/ingest-token", { method: "POST", token: B.token })).json?.token || "";
    const aTokAgain = (await api("/api/health/ingest-token", { method: "POST", token: A.token })).json?.token || "";
    t.check("token.one_users_token_never_acts_for_another", !!bTok && !!aTokAgain && (await ing(bTok, [reading({ metric: "weight_kg", value: 80, unit: "kg", measured_at: isoAgo(3 * 3600e3) })])).status === 200
      && arr((await api("/api/health/readings?metric=weight_kg", { token: A.token })).json?.readings).length === 0, "B's token wrote into A's data (or setup failed)");
  }

  /* ---- 5. manual / Bluetooth entry + own-rows-only ---- */
  {
    const add = await api("/api/health/readings", { method: "POST", token: A.token, body: { source: "bluetooth", readings: [{ metric: "heart_rate", value: 61, unit: "bpm", device: "Polar H10" }, { metric: "systolic_bp", value: 119, unit: "mmHg" }, { metric: "heart_rate", value: 9000 }] } });
    t.check("readings.add_bluetooth_batch", add.status === 200 && add.json?.inserted === 2 && arr(add.json?.rejected).length === 1, `status=${add.status} ${add.text.slice(0, 200)}`);
    const forged = await api("/api/health/readings", { method: "POST", token: A.token, body: { source: "google_health", readings: [{ metric: "heart_rate", value: 60 }] } });
    t.check("readings.client_cannot_claim_server_channels", forged.status === 400, `source=google_health -> ${forged.status}`);
    const aList = await api("/api/health/readings?metric=heart_rate&source=bluetooth", { token: A.token });
    const id = aList.json?.readings?.[0]?.id;
    t.check("readings.list_filters", aList.status === 200 && aList.json?.count >= 1 && !!id, `status=${aList.status} ${aList.text.slice(0, 160)}`);
    const bList = await api("/api/health/readings?limit=1000", { token: B.token });
    t.check("readings.own_rows_only", bList.status === 200 && !arr(bList.json?.readings).some((r) => r.id === id) && arr(bList.json?.readings).every((r) => r.metric === "weight_kg"), `B sees ${arr(bList.json?.readings).map((r) => r.metric).join(",")}`);
    await api("/api/health/readings", { method: "DELETE", token: B.token, body: { ids: [id] } });
    await api("/api/health/readings", { method: "DELETE", token: B.token, body: { source: "bluetooth" } });
    await api("/api/health/readings", { method: "DELETE", token: B.token, body: { all: true } });
    const still = await api("/api/health/readings?source=bluetooth", { token: A.token });
    t.check("readings.other_user_cannot_delete", still.json?.count >= 1 && arr(still.json?.readings).some((r) => r.id === id), "B's delete calls removed A's reading");
    t.check("readings.delete_validation", (await api("/api/health/readings", { method: "DELETE", token: A.token, body: { ids: ["x' or '1'='1"] } })).status === 400
      && (await api("/api/health/readings", { method: "DELETE", token: A.token, body: {} })).status === 400, "bad delete bodies must be 400");
    t.check("readings.query_validation", (await api("/api/health/readings?metric=nope", { token: A.token })).status === 400 && (await api("/api/health/readings?limit=99999", { token: A.token })).status === 400, "bad query params must be 400");
    const del = await api("/api/health/readings", { method: "DELETE", token: A.token, body: { ids: [id] } });
    const gone = await api("/api/health/readings?source=bluetooth&metric=heart_rate", { token: A.token });
    t.check("readings.owner_can_delete", del.status === 200 && !arr(gone.json?.readings).some((r) => r.id === id), `del=${del.status}`);
  }

  /* ---- 6. Apple Health export ---- */
  {
    const xml = appleFixture();
    const up = (token, body, ct, hdr = true) => api("/api/health/apple/import", { method: "POST", token, body, raw: true, headers: { "Content-Type": ct, ...(hdr ? { "X-Sihat-Upload": "1" } : {}) } });
    t.check("apple.requires_upload_header", (await up(B.token, xml, "application/xml", false)).status === 400, "raw upload without X-Sihat-Upload was accepted");
    const rx = await up(B.token, xml, "application/xml");
    t.check("apple.xml_import", rx.status === 200 && rx.json?.inserted === 12 && rx.json?.stats?.records_scanned === 21 && rx.json?.stats?.records_matched === 19 && rx.json?.stats?.rejected_values === 1 && rx.json?.file_stored === false,
      `status=${rx.status} ${rx.text.slice(0, 300)}`);
    const rx2 = await up(B.token, xml, "application/xml");
    t.check("apple.reimport_is_deduped", rx2.status === 200 && rx2.json?.inserted === 0 && rx2.json?.duplicates === 12, `status=${rx2.status} ${rx2.text.slice(0, 200)}`);
    const rz = await up(A.token, storedZip("apple_health_export/export.xml", xml), "application/zip");
    t.check("apple.zip_import", rz.status === 200 && rz.json?.inserted === 12, `status=${rz.status} ${rz.text.slice(0, 200)}`);
    const aRows = arr((await api("/api/health/readings?source=apple_export&limit=200", { token: A.token })).json?.readings);
    const m = {}; for (const r of aRows) (m[r.metric] ||= []).push(r.value);
    t.check("apple.values_normalised", (m.steps || [])[0] === 5000 && (m.sleep_hours || [])[0] === 6.5 && (m.spo2 || [])[0] === 97 && Math.abs((m.body_temperature || [0])[0] - 37) < 0.01
      && [...(m.heart_rate || [])].sort().join() === "75,90" && (m.resting_heart_rate || [])[0] === 58, `A apple readings: ${JSON.stringify(m)}`);
    t.check("apple.window_30_days_and_whitelist", aRows.length === 12 && !aRows.some((r) => r.value === 99) && !JSON.stringify(aRows).includes("Water"), `rows=${aRows.length}`);
    t.check("apple.garbage_rejected", (await up(A.token, "hello", "application/octet-stream")).status === 400 && (await up(A.token, storedZip("notes.txt", "x"), "application/zip")).status === 400
      && (await up(A.token, "<HealthData><Record type=", "application/xml")).status === 400, "non-export uploads must be 400");
    const none = await up(A.token, "<HealthData></HealthData>", "application/xml");
    t.check("apple.empty_export_ok", none.status === 200 && none.json?.inserted === 0 && !!none.json?.message, `status=${none.status}`);
    if (t.hasDb) {
      const all = JSON.stringify([await dbRows("health_readings"), await dbRows("health_connections"), await dbRows("health_ingest_tokens")]);
      t.check("apple.file_content_never_stored", !all.includes("<Record") && !all.includes("HealthData") && !all.includes("MetadataEntry"), "export XML found in the database");
    }
  }

  /* ---- 7. Google Health ---- */
  if (!googleOn) {
    const j = await api("/api/health/google/connect?format=json", { token: A.token });
    const nav = await api("/api/health/google/connect", { token: A.token });
    const sy = await api("/api/health/google/sync", { method: "POST", token: A.token, body: {} });
    const cb = await api("/api/health/google/callback?state=a&code=b");
    t.check("google.not_configured_is_honest", j.status === 503 && j.json?.code === "google_not_configured" && nav.status === 302 && /health=google_not_configured/.test(nav.headers.get("location") || "")
      && sy.status === 503 && cb.status === 302 && /google_not_configured/.test(cb.headers.get("location") || ""), `json=${j.status}/${j.json?.code} nav=${nav.status} sync=${sy.status} cb=${cb.status}`);
    t.skip("google.oauth_flow", "this stack runs without Google (ACI_GOOGLE=off or --db=real): the OAuth flow is covered by the default run");
  } else {
    const gb = t.stack.googleBase;
    const cj = await api("/api/health/google/connect?format=json", { token: A.token });
    let au = null; try { au = new URL(cj.json?.url); } catch { /* checked below */ }
    const q = au?.searchParams;
    t.check("google.connect_builds_pkce_url", cj.status === 200 && au && au.origin === gb && q.get("code_challenge_method") === "S256" && !!q.get("code_challenge") && !!q.get("state")
      && q.get("response_type") === "code" && q.get("access_type") === "offline" && q.get("client_id") === "aci-client" && /\/api\/health\/google\/callback$/.test(q.get("redirect_uri") || ""),
      `status=${cj.status} ${cj.text.slice(0, 200)}`);
    t.check("google.scopes_are_read_only_health", !!au && q.get("scope").split(" ").every((s) => /^https:\/\/www\.googleapis\.com\/auth\/googlehealth\.[a-z_]+\.readonly$/.test(s)), `scope=${q?.get("scope")}`);
    const nav = await api("/api/health/google/connect", { token: A.token });
    t.check("google.connect_redirects_the_browser", nav.status === 302 && (nav.headers.get("location") || "").startsWith(gb + "/auth?"), `status=${nav.status} location=${nav.headers.get("location")}`);
    const cookieMatch = (cj.setCookie || "").match(/sihat-health-oauth=([^;]+)/);
    const cookie = cookieMatch?.[1] || "";
    t.check("google.state_cookie_sealed_and_httponly", !!cookie && !cookie.includes(q?.get("state") || "~") && /HttpOnly/i.test(cj.setCookie) && /SameSite=Lax/i.test(cj.setCookie), `set-cookie=${cj.setCookie.slice(0, 160)}`);
    const consent = async (challenge) => (await (await fetch(gb + "/__fake/authorize", { method: "POST", body: JSON.stringify({ challenge }) })).json()).code;
    const code = au ? await consent(q.get("challenge") || q.get("code_challenge")) : "";
    const cb = (state, c, ck, extra = {}) => api(`/api/health/google/callback?state=${encodeURIComponent(state)}&code=${encodeURIComponent(c)}`, { headers: ck ? { Cookie: "sihat-health-oauth=" + ck } : {}, ...extra });
    const bads = [["forged_state", await cb("forged", code, cookie)], ["no_cookie", await cb(q?.get("state") || "x", code, "")], ["tampered_cookie", await cb(q?.get("state") || "x", code, cookie.slice(0, -4) + "AAAA")],
      ["other_users_session", await cb(q?.get("state") || "x", code, cookie, { token: B.token })]];
    t.check("google.callback_rejects_forged_requests", bads.every(([, r]) => r.status === 302 && /health=google_state/.test(r.headers.get("location") || "")), bads.map(([n, r]) => `${n}=${r.status} ${r.headers.get("location")}`).join("; "));
    t.check("google.nothing_stored_by_rejected_callbacks", !t.hasDb || arr(await dbRows("health_connections")).filter((r) => r.user_id === A.id).length === 0, "a rejected callback created a connection");
    const den = await api("/api/health/google/callback?error=access_denied");
    t.check("google.user_denial_handled", den.status === 302 && /google_denied/.test(den.headers.get("location") || ""), `status=${den.status} ${den.headers.get("location")}`);
    const ok = await cb(q?.get("state") || "x", code, cookie);
    t.check("google.callback_connects", ok.status === 302 && /health=google_connected/.test(ok.headers.get("location") || ""), `status=${ok.status} location=${ok.headers.get("location")}`);
    const replay = await cb(q?.get("state") || "x", code, cookie);
    t.check("google.auth_code_is_single_use", replay.status === 302 && !/google_connected/.test(replay.headers.get("location") || ""), `replay -> ${replay.headers.get("location")}`);
    const gs = await (await fetch(gb + "/__fake/state")).json();
    const refresh = (gs.refreshTokens || [])[0] || "";
    if (t.hasDb) {
      const conns = arr(await dbRows("health_connections")).filter((r) => r.user_id === A.id);
      t.check("google.refresh_token_stored_encrypted", conns.length === 1 && !!conns[0].refresh_token_enc && !!refresh && !JSON.stringify(conns).includes(refresh) && conns[0].status === "connected", `rows=${JSON.stringify(conns).slice(0, 200)}`);
    } else t.skip("google.refresh_token_stored_encrypted", "no DB handle");
    const sum = await api("/api/health/summary", { token: A.token });
    t.check("google.summary_has_no_secrets", sum.json?.connections?.google_health?.status === "connected" && !sum.text.includes(refresh) && !/refresh_token/.test(sum.text), `conn=${JSON.stringify(sum.json?.connections)}`);
    const sy = await api("/api/health/google/sync", { method: "POST", token: A.token, body: { days: 3 } });
    t.check("google.sync_stores_readings", sy.status === 200 && sy.json?.inserted === 7 && sy.json?.duplicates === 0, `status=${sy.status} ${sy.text.slice(0, 260)}`);
    const gl = arr((await api("/api/health/readings?source=google_health&limit=100", { token: A.token })).json?.readings);
    const gm = Object.fromEntries(gl.map((r) => [r.metric, r.value]));
    t.check("google.values_mapped", gm.resting_heart_rate === 61 && gm.hrv_rmssd === 33.4 && gm.spo2 === 95.5 && gm.respiratory_rate === 13.2 && gm.weight_kg === 71.2 && gm.heart_rate === 77 && gm.steps === 5500,
      `got ${JSON.stringify(gm)} (steps must come from one platform: 5500, not 14500)`);
    t.check("google.second_sync_throttled", (await api("/api/health/google/sync", { method: "POST", token: A.token, body: {} })).status === 429, "back-to-back syncs must be throttled");
    const C = await mk("c");
    t.check("google.sync_without_connection_409", (await api("/api/health/google/sync", { method: "POST", token: C.token, body: {} })).status === 409, "C has no Google connection");
    const dc = await api("/api/health/google?delete_data=1", { method: "DELETE", token: A.token });
    const gs2 = await (await fetch(gb + "/__fake/state")).json();
    t.check("google.disconnect_revokes_and_deletes", dc.status === 200 && dc.json?.revoked_at_google === true && dc.json?.readings_deleted === true && (gs2.revoked || []).includes(refresh)
      && !arr((await api("/api/health/readings?source=google_health", { token: A.token })).json?.readings).length, `status=${dc.status} ${dc.text.slice(0, 160)}`);
    if (t.hasDb) t.check("google.disconnect_removes_connection_row", arr(await dbRows("health_connections")).filter((r) => r.user_id === A.id).length === 0, "connection row still present");

    // revoked at Google: the refresh grant fails with invalid_grant -> connection marked revoked, user told to reconnect (account B)
    const cjB = await api("/api/health/google/connect?format=json", { token: B.token });
    const qB = new URL(cjB.json?.url || gb).searchParams;
    const ckB = ((cjB.setCookie || "").match(/sihat-health-oauth=([^;]+)/) || [])[1] || "";
    const okB = await cb(qB.get("state") || "x", await consent(qB.get("code_challenge")), ckB);
    t.check("google.second_account_connects", okB.status === 302 && /health=google_connected/.test(okB.headers.get("location") || ""), `status=${okB.status} ${okB.headers.get("location")}`);
    await fetch(gb + "/__fake/config", { method: "POST", body: JSON.stringify({ failGrant: true }) });
    const rv = await api("/api/health/google/sync", { method: "POST", token: B.token, body: {} });
    const sumB = await api("/api/health/summary", { token: B.token });
    await fetch(gb + "/__fake/config", { method: "POST", body: JSON.stringify({ failGrant: false }) });
    t.check("google.revoked_access_marked_for_reconnect", rv.status === 409 && sumB.json?.connections?.google_health?.status === "revoked", `sync=${rv.status} status=${sumB.json?.connections?.google_health?.status}`);
    // a data type Google refuses does not sink the others
    const cjB2 = await api("/api/health/google/connect?format=json", { token: B.token });
    const qB2 = new URL(cjB2.json?.url || gb).searchParams;
    const ckB2 = ((cjB2.setCookie || "").match(/sihat-health-oauth=([^;]+)/) || [])[1] || "";
    await cb(qB2.get("state") || "x", await consent(qB2.get("code_challenge")), ckB2);
    await fetch(gb + "/__fake/config", { method: "POST", body: JSON.stringify({ failType: "weight" }) });
    const part = await api("/api/health/google/sync", { method: "POST", token: B.token, body: {} });
    await fetch(gb + "/__fake/config", { method: "POST", body: JSON.stringify({ failType: "" }) });
    t.check("google.partial_failure_keeps_other_metrics", part.status === 200 && part.json?.inserted === 6 && !!part.json?.errors?.weight, `status=${part.status} ${part.text.slice(0, 220)}`);
    await api("/api/health/google", { method: "DELETE", token: B.token });
  }

  /* ---- 7b. a report saved with device vitals keeps them (wizard sends pulse_data) ---- */
  {
    const pulse = { bpm: "67", qualities: ["thready"], device_vitals: [{ metric: "heart_rate", value: 67, unit: "bpm", measured_at: isoAgo(60e3), device: "Test Strap", source: "bluetooth" }] };
    const save = await api("/api/patient/sessions", { method: "POST", token: A.token, body: { full_report: { diagnosis: { primary_pattern: "Qi deficiency" } }, primary_diagnosis: "Qi deficiency", symptoms: "fatigue", pulse_data: pulse } });
    t.check("session.saves_pulse_data_with_device_vitals", save.status === 200 || save.status === 201, `status=${save.status} ${save.text.slice(0, 160)}`);
    if (t.hasDb) {
      const row = arr(await dbRows("diagnosis_sessions")).find((r) => r.user_id === A.id);
      t.check("session.pulse_data_round_trips", JSON.stringify(row?.pulse_data || {}).includes("Test Strap"), `row=${JSON.stringify(row || {}).slice(0, 200)}`);
    } else t.skip("session.pulse_data_round_trips", "no DB handle");
  }

  /* ---- 8. whole-run secret sweep over what the API returned ---- */
  t.check("secrets.no_token_material_in_summaries", !JSON.stringify((await api("/api/health/summary", { token: A.token })).json).match(/shi_[A-Za-z0-9_-]{20,}|refresh_token|token_hash/), "summary exposes token material");
}
