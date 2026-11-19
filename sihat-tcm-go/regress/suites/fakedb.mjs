/**
 * fakedb — self-test of the hermetic DB every other suite trusts: regress/fake-supabase.mjs by default, or the Go
 * SQLite backend (internal/localdb) when FAKEDB_BASE=<url> is set (see regress/localdb-contract.mjs, which boots
 * `sihat-tcm-go --localdb-only` and sets FAKEDB_BASE/FAKEDB_KEY/FAKEDB_ANON_KEY). Same checks, two implementations:
 * where the JS fake was wrong vs real Postgres (neq with NULLs, NULLS ordering, limit=0, PATCH without Prefer, duplicate
 * PKs, apikey/RLS) the Go backend follows Postgres and the fake-mode skip-notes become real checks.
 * Part 1: GoTrue behaviours internal/supabase/client.go depends on.
 * Part 2: PostgREST semantics (insert/upsert/select/filters/order/paging/patch/delete/numeric ids).
 * Part 3: FIDELITY GUARD — scan the app's Go source for every PostgREST feature it uses and assert
 *         the fake implements each; if the app starts using something the fake lacks, this goes red
 *         instead of the fake silently lying.
 */
import { createFakeSupabase } from "../fake-supabase.mjs";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(here, "..", "..");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPS = "eq|neq|gt|gte|lt|lte|in|is|cs|cd|like|ilike|match|imatch|fts|plfts|phfts|wfts|ov|sl|sr|nxr|nxl|adj|isdistinct";

function goFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...goFiles(p));
    else if (e.name.endsWith(".go") && !e.name.endsWith("_test.go")) out.push(p);
  }
  return out;
}

export default {
  name: "fakedb", needs: "none", mutating: false, costly: false,
  doc: "self-test of the hermetic DB (GoTrue + PostgREST semantics) + fidelity guard: every PostgREST feature the Go app uses must be implemented. Default: JS fake-supabase; FAKEDB_BASE=<url> runs the same checks against the Go SQLite backend (regress/localdb-contract.mjs)",
  async run(t) {
    if (process.env.FAKEDB_BASE) {
      await body(t, process.env.FAKEDB_BASE.replace(/\/+$/, ""), true);
      return;
    }
    const { server } = createFakeSupabase();
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const B = `http://127.0.0.1:${server.address().port}`;
    try { await body(t, B, false); } finally { await new Promise((r) => server.close(r)); }
  },
};

async function body(t, B, GO) {
  const KEY = GO ? process.env.FAKEDB_KEY || "" : "fake";           // service-role key of the Go backend
  const ANON = GO ? process.env.FAKEDB_ANON_KEY || "" : "fake";
  const call = async (path, { method = "GET", body, token, headers = {}, raw } = {}) => {
    const h = { apikey: KEY, ...headers };
    if (body !== undefined || raw !== undefined) h["Content-Type"] = "application/json";
    if (token) h.Authorization = "Bearer " + token;
    const res = await fetch(B + path, { method, headers: h, body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* */ }
    return { status: res.status, text, json };
  };
  // real GoTrue needs ?grant_type=password on /token (the JS fake never checked)
  const auth = (p, body, o) => call("/auth/v1/" + (GO && p === "token" ? "token?grant_type=password" : p), { method: "POST", body, ...o });
  const table = async (n) => (await call("/__fake/table/" + n)).json;
  const R = (tbl, qs = "") => call(`/rest/v1/${tbl}${qs ? "?" + qs : ""}`);
  const ins = (tbl, rows, prefer) => call(`/rest/v1/${tbl}`, { method: "POST", body: rows, headers: { Prefer: prefer || "return=representation" } });
  const keys = async (tbl, qs, col = "k") => { const r = await R(tbl, qs); return Array.isArray(r.json) ? r.json.map((x) => x[col]) : `HTTP ${r.status} ${r.text.slice(0, 80)}`; };
  const sameSet = (got, want) => Array.isArray(got) && got.length === want.length && [...got].sort().join("|") === [...want].sort().join("|");
  const sameSeq = (got, want) => Array.isArray(got) && JSON.stringify(got) === JSON.stringify(want);
  const show = (x) => JSON.stringify(x);
  const u = t.uniq();

  /* ============================== health / hooks ============================== */
  const h = await call("/__fake/health");
  const seedUsers = h.json?.users;   // fake: 4 demo accounts; Go backend: 4 demo accounts + the 6 demo doctors
  t.check("hook.health", h.status === 200 && h.json?.ok === true && (GO ? seedUsers >= 4 : seedUsers === 4), `status=${h.status} body=${h.text}`);
  const nr = await call("/nope");
  t.check("route.unknown_404", nr.status === 404, `status=${nr.status}`);

  /* ================================== GoTrue ================================== */
  const email = `fd-${u}@example.com`;
  const su = await auth("signup", { email, password: "secret123", data: { role: "doctor", full_name: "Dr Fake" } });
  const sess = su.json || {};
  t.check("signup.200_session", su.status === 200 && typeof sess.access_token === "string" && sess.access_token.length > 20 && typeof sess.refresh_token === "string", `status=${su.status} ${su.text.slice(0, 150)}`);
  t.check("signup.user_id_uuid", UUID.test(sess.user?.id || ""), `user.id=${sess.user?.id}`);
  t.check("signup.user_email_meta", sess.user?.email === email && sess.user?.user_metadata?.role === "doctor", `user=${show(sess.user)}`);
  t.check("signup.expires_in", Number(sess.expires_in) > 0, `expires_in=${sess.expires_in}`);
  const jp = (sess.access_token || "").split(".");
  let claims = {}; try { claims = JSON.parse(Buffer.from(jp[1] || "", "base64url").toString()); } catch { /* */ }
  t.check("signup.token_jwt_shape", jp.length === 3 && claims.sub === sess.user?.id && claims.email === email && claims.exp > Date.now() / 1000, `parts=${jp.length} claims=${show(claims)}`);
  const prof = ((await table("profiles")) || []).find((p) => p.id === sess.user?.id);
  t.check("signup.creates_profile_row", !!prof && prof.email === email && prof.role === "doctor" && prof.full_name === "Dr Fake", `profile=${show(prof)}`);

  const su2 = await auth("signup", { email: `fd2-${u}@example.com`, password: "secret123" });
  const prof2 = ((await table("profiles")) || []).find((p) => p.id === su2.json?.user?.id);
  t.check("signup.profile_defaults_patient", su2.status === 200 && prof2?.role === "patient", `status=${su2.status} profile=${show(prof2)}`);

  const dup = await auth("signup", { email, password: "secret123" });
  t.check("signup.duplicate_422", dup.status === 422 && dup.json?.error_code === "user_already_exists" && !!dup.json?.msg, `status=${dup.status} ${dup.text}`);
  const dupCase = await auth("signup", { email: email.toUpperCase(), password: "secret123" });
  t.check("signup.duplicate_case_insensitive", dupCase.status === 422, `status=${dupCase.status} (email must be case-insensitive)`);
  const weak = await auth("signup", { email: `fd3-${u}@example.com`, password: "123" });
  t.check("signup.weak_password_422", weak.status === 422 && weak.json?.error_code === "weak_password", `status=${weak.status} ${weak.text}`);
  const weakNoUser = ((await table("profiles")) || []).some((p) => p.email === `fd3-${u}@example.com`);
  t.check("signup.weak_creates_nothing", !weakNoUser, "weak-password signup must not create a profile");
  const bad = await auth("signup", { email: "not-an-email", password: "secret123" });
  t.check("signup.invalid_email_400", bad.status === 400 && bad.json?.error_code === "validation_failed", `status=${bad.status} ${bad.text}`);
  const noPw = await auth("signup", { email: `fd4-${u}@example.com` });
  t.check("signup.missing_password_400", noPw.status === 400, `status=${noPw.status}`);

  // token (password grant) — the Go client posts to /token?grant_type=password
  const tk = await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password: "secret123" } });
  t.check("token.ok", tk.status === 200 && !!tk.json?.access_token && tk.json?.user?.id === sess.user?.id, `status=${tk.status} ${tk.text.slice(0, 120)}`);
  t.check("token.distinct_per_login", tk.json?.access_token !== sess.access_token, "each login must mint a new token");
  const tkCase = await auth("token", { email: email.toUpperCase(), password: "secret123" });
  t.check("token.email_case_insensitive", tkCase.status === 200, `status=${tkCase.status}`);
  const tkBad = await auth("token", { email, password: "wrong-pass" });
  t.check("token.bad_password_400", tkBad.status === 400 && tkBad.json?.error_code === "invalid_credentials" && !!tkBad.json?.msg, `status=${tkBad.status} ${tkBad.text}`);
  const tkUnknown = await auth("token", { email: `ghost-${u}@example.com`, password: "secret123" });
  t.check("token.unknown_same_as_bad_password", tkUnknown.status === 400 && tkUnknown.json?.msg === tkBad.json?.msg, `unknown=${tkUnknown.text} vs bad=${tkBad.text} (must be indistinguishable)`);
  for (const role of ["patient", "doctor", "admin", "developer"]) {
    const r = await auth("token", { email: `${role}@sihat.com`, password: "password123" });
    const pr = ((await table("profiles")) || []).find((p) => p.id === r.json?.user?.id);
    t.check(`seed.${role}`, r.status === 200 && r.json?.user?.user_metadata?.role === role && pr?.role === role, `status=${r.status} meta=${show(r.json?.user?.user_metadata)} profile=${show(pr)}`);
  }

  // /user
  const me = await call("/auth/v1/user", { token: sess.access_token });
  t.check("user.get_with_token", me.status === 200 && me.json?.id === sess.user?.id && me.json?.email === email, `status=${me.status} ${me.text.slice(0, 100)}`);
  t.check("user.get_no_token_401", (await call("/auth/v1/user")).status === 401, "no token must be 401");
  t.check("user.get_garbage_token_401", (await call("/auth/v1/user", { token: "garbage.token.value" })).status === 401, "garbage token must be 401");

  // password change via PUT /user
  const put = await call("/auth/v1/user", { method: "PUT", token: sess.access_token, body: { password: "newsecret456" } });
  t.check("user.put_password_200", put.status === 200 && put.json?.id === sess.user?.id, `status=${put.status} ${put.text.slice(0, 100)}`);
  t.check("user.old_password_rejected", (await auth("token", { email, password: "secret123" })).status === 400, "old password must stop working");
  t.check("user.new_password_works", (await auth("token", { email, password: "newsecret456" })).status === 200, "new password must log in");
  t.check("user.put_no_token_401", (await call("/auth/v1/user", { method: "PUT", body: { password: "hijack12345" } })).status === 401, "PUT /user without a token must be 401");
  t.check("user.put_no_token_changes_nothing", (await auth("token", { email, password: "newsecret456" })).status === 200, "unauthenticated PUT must not alter password");

  // recover + verify roundtrip
  const recGhost = await auth("recover", { email: `ghost-${u}@example.com` });
  t.check("recover.unknown_200", recGhost.status === 200, `status=${recGhost.status} (GoTrue returns 200 even for unknown emails)`);
  t.check("recover.unknown_no_token", (await call(`/__fake/recovery?email=ghost-${u}@example.com`)).json?.token_hash === null, "no token may be minted for unknown email");
  const rec = await auth("recover?redirect_to=" + encodeURIComponent("http://x/reset"), { email });
  const th = (await call(`/__fake/recovery?email=${encodeURIComponent(email)}`)).json?.token_hash;
  t.check("recover.known_mints_token", rec.status === 200 && typeof th === "string" && th.length >= 16, `status=${rec.status} token_hash=${th}`);
  const badVerify = await auth("verify", { type: "recovery", token_hash: "deadbeef" + u });
  t.check("verify.bad_hash_400", badVerify.status === 400 && !!badVerify.json?.msg && !badVerify.json?.access_token, `status=${badVerify.status} ${badVerify.text}`);
  const noHash = await auth("verify", { type: "recovery" });
  t.check("verify.missing_hash_400", noHash.status === 400, `status=${noHash.status}`);
  const ver = await auth("verify", { type: "recovery", token_hash: th });
  t.check("verify.good_hash_session", ver.status === 200 && !!ver.json?.access_token && ver.json?.user?.email === email, `status=${ver.status} ${ver.text.slice(0, 120)}`);
  t.check("verify.single_use", (await auth("verify", { type: "recovery", token_hash: th })).status === 400, "a recovery token must not be reusable");
  const put2 = await call("/auth/v1/user", { method: "PUT", token: ver.json?.access_token, body: { password: "recovered789" } });
  t.check("recover.reset_flow_end_to_end", put2.status === 200 && (await auth("token", { email, password: "recovered789" })).status === 200, `put=${put2.status}`);

  /* ================================= PostgREST ================================= */
  // insert
  const i1 = await ins("ins", { a: 1 });
  t.check("insert.201_representation", i1.status === 201 && Array.isArray(i1.json) && i1.json.length === 1 && i1.json[0].a === 1, `status=${i1.status} ${i1.text}`);
  t.check("insert.generated_uuid_id", UUID.test(i1.json?.[0]?.id || ""), `id=${i1.json?.[0]?.id}`);
  t.check("insert.generated_created_at", !Number.isNaN(Date.parse(i1.json?.[0]?.created_at)), `created_at=${i1.json?.[0]?.created_at}`);
  const i2 = await ins("ins", { id: "fixed-1", created_at: "2020-01-02T03:04:05.000Z", a: 2 });
  t.check("insert.keeps_explicit_id_and_created_at", i2.json?.[0]?.id === "fixed-1" && Date.parse(i2.json?.[0]?.created_at) === Date.parse("2020-01-02T03:04:05.000Z"), show(i2.json));
  const i3 = await ins("ins", [{ a: 3 }, { a: 4 }, { a: 5 }]);
  t.check("insert.array_returns_all", i3.status === 201 && i3.json?.length === 3 && new Set(i3.json.map((r) => r.id)).size === 3, `status=${i3.status} ${i3.text.slice(0, 120)}`);
  t.check("insert.persisted", (await table("ins"))?.length === 5, `rows=${(await table("ins"))?.length} (want 5)`);
  const iBad = await call("/rest/v1/ins", { method: "POST", raw: "{not json" });
  t.check("insert.invalid_json_400", iBad.status === 400, `status=${iBad.status}`);
  t.check("insert.invalid_json_stores_nothing", (await table("ins"))?.length === 5, "bad JSON must not create rows");

  // upsert merge-duplicates on id
  await ins("ups", { id: "u1", a: 1, b: 2 });
  const up = await ins("ups", { id: "u1", b: 3, c: 9 }, "resolution=merge-duplicates,return=representation");
  const upRows = await table("ups");
  t.check("upsert.merges_one_row", upRows?.length === 1 && upRows[0].a === 1 && upRows[0].b === 3 && upRows[0].c === 9, `rows=${show(upRows)}`);
  t.check("upsert.returns_merged_row", up.json?.length === 1 && up.json[0].id === "u1" && up.json[0].a === 1 && up.json[0].b === 3, show(up.json));
  const up2 = await ins("ups", [{ id: "u1", b: 4 }, { id: "u2", a: 7 }], "resolution=merge-duplicates,return=representation");
  t.check("upsert.mixed_update_and_insert", (await table("ups"))?.length === 2 && up2.json?.length === 2, `rows=${show(await table("ups"))}`);
  t.check("upsert.no_id_inserts_new", (await ins("ups", { a: 1 }, "resolution=merge-duplicates,return=representation")).json?.[0]?.id !== undefined && (await table("ups")).length === 3, "row without id gets generated id");

  // select + filters
  await ins("ops", [
    { k: "a", n: 1, s: "alpha", flag: true, opt: null, tags: ["x", "y"] },
    { k: "b", n: 2, s: "Beta", flag: false, opt: "v", tags: ["y"] },
    { k: "c", n: 3, s: "gamma", flag: true, opt: "w", tags: [] },
    { k: "d", n: 10, s: "delta x", flag: true, opt: "v", tags: ["z"] },
  ]);
  const all = await R("ops");
  t.check("select.all_rows", all.status === 200 && all.json?.length === 4, `status=${all.status} len=${all.json?.length}`);
  const cols = await R("ops", "select=k,n&limit=1");
  t.check("select.columns_only", sameSeq(Object.keys(cols.json?.[0] || {}).sort(), ["k", "n"]), `keys=${show(Object.keys(cols.json?.[0] || {}))}`);
  t.check("select.star_all_columns", Object.keys((await R("ops", "select=*&limit=1")).json?.[0] || {}).length >= 7, "select=* must return every column");
  t.check("select.empty_table_is_empty_array", sameSeq((await R("never_written")).json, []), "unknown table reads as []");

  const eqNum = await keys("ops", "n=eq.2");
  t.check("op.eq_number", sameSeq(eqNum, ["b"]), `got ${show(eqNum)}`);
  t.check("op.eq_string", sameSeq(await keys("ops", "s=eq.alpha"), ["a"]), "s=eq.alpha");
  t.check("op.eq_string_case_sensitive", sameSeq(await keys("ops", "s=eq.beta"), []), "eq on text is case-sensitive");
  t.check("op.eq_boolean", sameSeq(await keys("ops", "flag=eq.false"), ["b"]), "flag=eq.false");
  const neq = await keys("ops", "n=neq.2");
  t.check("op.neq", sameSet(neq, ["a", "c", "d"]), `got ${show(neq)}`);
  t.check("op.gt_numeric_not_lexical", sameSeq(await keys("ops", "n=gt.3"), ["d"]), `n=gt.3 -> ${show(await keys("ops", "n=gt.3"))} (10 > 3 numerically)`);
  t.check("op.gte", sameSet(await keys("ops", "n=gte.3"), ["c", "d"]), "n=gte.3");
  t.check("op.lt", sameSet(await keys("ops", "n=lt.3"), ["a", "b"]), "n=lt.3");
  t.check("op.lte", sameSet(await keys("ops", "n=lte.3"), ["a", "b", "c"]), "n=lte.3");
  t.check("op.in_numbers", sameSet(await keys("ops", "n=in.(1,3)"), ["a", "c"]), "n=in.(1,3)");
  t.check("op.in_quoted_strings", sameSet(await keys("ops", 's=in.("alpha","Beta")'), ["a", "b"]), "s=in.(\"alpha\",\"Beta\")");
  t.check("op.in_bare_strings", sameSet(await keys("ops", "s=in.(alpha,gamma)"), ["a", "c"]), "s=in.(alpha,gamma)");
  t.check("op.in_no_match", sameSeq(await keys("ops", "n=in.(99)"), []), "n=in.(99)");
  t.check("op.is_null", sameSeq(await keys("ops", "opt=is.null"), ["a"]), "opt=is.null");
  t.check("op.is_true", sameSet(await keys("ops", "flag=is.true"), ["a", "c", "d"]), "flag=is.true");
  t.check("op.cs_array_single", sameSet(await keys("ops", "tags=cs.{y}"), ["a", "b"]), "tags=cs.{y}");
  t.check("op.cs_array_multi", sameSeq(await keys("ops", "tags=cs.{x,y}"), ["a"]), "tags=cs.{x,y}");
  t.check("op.like_prefix", sameSeq(await keys("ops", "s=like.al*"), ["a"]), "s=like.al*");
  t.check("op.like_case_sensitive", sameSeq(await keys("ops", "s=like.*ETA*"), []), "like must be case-sensitive");
  t.check("op.ilike_case_insensitive", sameSeq(await keys("ops", "s=ilike.*ETA*"), ["b"]), "s=ilike.*ETA*");
  t.check("op.ilike_percent", sameSeq(await keys("ops", "s=ilike.%25ETA%25"), ["b"]), "s=ilike.%eta%");
  t.check("op.and_of_filters", sameSet(await keys("ops", "n=gte.2&flag=eq.true"), ["c", "d"]), "n=gte.2&flag=eq.true");
  t.check("op.same_column_range", sameSeq(await keys("ops", "n=gt.1&n=lt.3"), ["b"]), "n=gt.1&n=lt.3 must AND on one column");
  t.check("op.no_match_empty_array", sameSeq(await keys("ops", "n=eq.404"), []), "no match -> []");
  await ins("ops", { k: "e", n: 11, s: "a&b=c,d" });
  t.check("op.url_decoded_values", sameSeq(await keys("ops", "s=eq." + encodeURIComponent("a&b=c,d")), ["e"]), "percent-encoded value");
  // timestamps (the app filters created_at/timestamp with ISO strings)
  await ins("dates", [{ k: "old", created_at: "2026-01-01T00:00:00.000Z", timestamp: "2026-01-01T00:00:00.000Z" }, { k: "mid", created_at: "2026-02-01T00:00:00.000Z", timestamp: "2026-02-01T00:00:00.000Z" }, { k: "new", created_at: "2026-03-01T00:00:00.000Z", timestamp: "2026-03-01T00:00:00.000Z" }]);
  t.check("op.timestamp_gte", sameSet(await keys("dates", "created_at=gte." + encodeURIComponent("2026-02-01T00:00:00.000Z")), ["mid", "new"]), "created_at=gte.");
  t.check("op.timestamp_gt_lte_window", sameSeq(await keys("dates", "timestamp=gt.2026-01-01T00:00:00.000Z&timestamp=lte.2026-02-01T00:00:00.000Z"), ["mid"]), "timestamp window");

  // unsupported syntax must fail LOUDLY
  for (const [lbl, qs] of [["or", "or=(n.eq.1,n.eq.2)"], ["and", "and=(n.gt.1,n.lt.5)"], ["not_prefix", "n=not.eq.1"], ["unknown_operator", "n=wat.1"]]) {
    const r = await R("ops", qs);
    t.check(`unsupported.${lbl}_is_explicit_error`, r.status === 400 && /unsupported|fake/i.test(r.text) && !Array.isArray(r.json), `status=${r.status} body=${r.text.slice(0, 100)} (must not be a silent []/rows)`);
  }
  const pOr = await call("/rest/v1/ops?or=(n.eq.1)", { method: "PATCH", body: { zz: 1 } });
  const dOr = await call("/rest/v1/ops?or=(n.eq.1)", { method: "DELETE" });
  t.check("unsupported.or_on_patch_delete_errors_and_changes_nothing", pOr.status === 400 && dOr.status === 400 && (await table("ops")).length === 5 && !(await table("ops")).some((r) => r.zz), `patch=${pOr.status} delete=${dOr.status} rows=${(await table("ops")).length}`);

  // order
  await ins("ord", [{ k: 1, g: "a", n: 1, o: "p" }, { k: 2, g: "a", n: 2, o: null }, { k: 3, g: "b", n: 3, o: "q" }, { k: 4, g: "b", n: 4, o: "p" }]);
  t.check("order.desc", sameSeq(await keys("ord", "order=n.desc"), [4, 3, 2, 1]), `got ${show(await keys("ord", "order=n.desc"))}`);
  t.check("order.asc", sameSeq(await keys("ord", "order=n.asc"), [1, 2, 3, 4]), "order=n.asc");
  t.check("order.default_is_asc", sameSeq(await keys("ord", "order=n"), [1, 2, 3, 4]), "order=n");
  t.check("order.multi_key_asc_desc", sameSeq(await keys("ord", "order=g.asc,n.desc"), [2, 1, 4, 3]), `got ${show(await keys("ord", "order=g.asc,n.desc"))}`);
  t.check("order.multi_key_desc_asc", sameSeq(await keys("ord", "order=g.desc,n.asc"), [3, 4, 1, 2]), `got ${show(await keys("ord", "order=g.desc,n.asc"))}`);
  t.check("order.numeric_not_lexical", sameSeq((await keys("ops", "order=n.desc&limit=2")), ["e", "d"]), `got ${show(await keys("ops", "order=n.desc&limit=2"))} (11,10 before 3)`);
  t.check("order.asc_nulls_last", sameSeq(await keys("ord", "order=o.asc", "o"), ["p", "p", "q", null]), `got ${show(await keys("ord", "order=o.asc", "o"))}`);
  t.check("order.desc_nullslast_explicit", sameSeq(await keys("ord", "order=o.desc.nullslast", "o"), ["q", "p", "p", null]), `got ${show(await keys("ord", "order=o.desc.nullslast", "o"))}`);
  t.check("order.desc_nonnull_values_sorted", sameSeq((await keys("ord", "order=o.desc", "o")).filter((x) => x !== null), ["q", "p", "p"]), "non-null part of order=o.desc");
  t.check("order.then_limit", sameSeq(await keys("ord", "order=n.desc&limit=2"), [4, 3]), "sort before limit");
  t.check("order.then_offset_limit", sameSeq(await keys("ord", "order=n.desc&offset=1&limit=2"), [3, 2]), "offset=1&limit=2");
  t.check("page.limit", (await keys("ord", "limit=3")).length === 3, "limit=3");
  t.check("page.limit_exceeds_rows", (await keys("ord", "limit=100")).length === 4, "limit>rows");
  t.check("page.offset_only", sameSeq(await keys("ord", "order=n.asc&offset=3"), [4]), "offset=3");
  t.check("page.offset_past_end_empty", sameSeq(await keys("ord", "offset=50"), []), "offset past end");
  t.check("page.filter_then_page", sameSeq(await keys("ord", "g=eq.b&order=n.asc&limit=1"), [3]), "filter, order, limit compose");

  // PATCH / DELETE
  await ins("mut", [{ k: "m1", grp: "g1", v: "x", keep: 1 }, { k: "m2", grp: "g1", v: "x", keep: 2 }, { k: "m3", grp: "g2", v: "x", keep: 3 }, { k: "m4", grp: "g2", v: "x", keep: 4 }]);
  const p1 = await call("/rest/v1/mut?k=eq.m2", { method: "PATCH", body: { v: "new" }, headers: { Prefer: "return=representation" } });
  t.check("patch.returns_updated_rows", p1.status === 200 && p1.json?.length === 1 && p1.json[0].k === "m2" && p1.json[0].v === "new" && p1.json[0].keep === 2 && !!p1.json[0].id, `status=${p1.status} ${p1.text}`);
  const afterP1 = (await table("mut")).map((r) => r.v).join(",");
  t.check("patch.only_matching_rows_changed", afterP1 === "x,new,x,x", `v column = ${afterP1}`);
  const p2 = await call("/rest/v1/mut?grp=eq.g2", { method: "PATCH", body: { v: "grp2" }, headers: { Prefer: "return=representation" } });
  t.check("patch.multi_match_all_updated", p2.status === 200 && p2.json?.length === 2 && p2.json.every((r) => r.v === "grp2"), `status=${p2.status} ${p2.text.slice(0, 100)}`);
  const p3 = await call("/rest/v1/mut?k=eq.nobody", { method: "PATCH", body: { v: "zzz" }, headers: { Prefer: "return=representation" } });
  t.check("patch.no_match_200_empty", p3.status === 200 && sameSeq(p3.json, []) && !(await table("mut")).some((r) => r.v === "zzz"), `status=${p3.status} ${p3.text}`);
  const p4 = await call("/rest/v1/mut?k=eq.m1", { method: "PATCH", body: { v: null }, headers: { Prefer: "return=representation" } });
  t.check("patch.set_null", p4.json?.[0]?.v === null && (await table("mut")).find((r) => r.k === "m1").v === null, show(p4.json));
  const d1 = await call("/rest/v1/mut?k=eq.m3", { method: "DELETE" });
  t.check("delete.204_empty_body", d1.status === 204 && d1.text === "", `status=${d1.status} body=${d1.text}`);
  t.check("delete.only_matching", sameSet((await table("mut")).map((r) => r.k), ["m1", "m2", "m4"]), `left ${show((await table("mut")).map((r) => r.k))}`);
  const d2 = await call("/rest/v1/mut?k=eq.nobody", { method: "DELETE" });
  t.check("delete.no_match_204_nothing_removed", d2.status === 204 && (await table("mut")).length === 3, `status=${d2.status} rows=${(await table("mut")).length}`);
  await call("/rest/v1/mut?k=in.(m1,m2)", { method: "DELETE" });
  t.check("delete.in_filter", sameSet((await table("mut")).map((r) => r.k), ["m4"]), `left ${show((await table("mut")).map((r) => r.k))}`);

  // numeric ids (admin_settings 'id=gt.0')
  if (!GO) {
    for (const tn of ["admin_settings", "system_logs", "system_errors", "system_metrics", "notification_history", "system_prompts"]) {
      const a = await ins(tn, { x: 1 }), b = await ins(tn, { x: 2 });
      t.check(`numeric_id.${tn}`, typeof a.json?.[0]?.id === "number" && b.json?.[0]?.id === a.json[0].id + 1 && a.json[0].id > 0, `ids=${a.json?.[0]?.id},${b.json?.[0]?.id}`);
    }
    t.check("numeric_id.gt0_select", (await keys("admin_settings", "id=gt.0", "x")).length === 2, "admin_settings id=gt.0 must match numeric ids");
    const pg = await call("/rest/v1/admin_settings?id=gt.0", { method: "PATCH", body: { x: 9 }, headers: { Prefer: "return=representation" } });
    t.check("numeric_id.gt0_patch_updates", pg.status === 200 && pg.json?.length === 2 && pg.json.every((r) => r.x === 9), `status=${pg.status} ${pg.text.slice(0, 100)}`);
    t.check("numeric_id.other_tables_use_uuid", UUID.test((await ins("inquiries", { x: 1 })).json?.[0]?.id || ""), "non-numeric tables use uuid");
  } else {
    // typed tables: id kinds come from db/schema.sql (identity bigint vs uuid); admin_settings is the single seeded row id=1
    const sch = (await call("/__fake/schema")).json?.tables || {};
    const suid = sess.user.id;
    const MIN = {
      system_logs: () => ({ level: "info", category: "t", message: "m" }),
      system_errors: () => ({ error_type: "t", message: "m" }),
      system_metrics: () => ({ type: "t", name: "n", value: "1" }),
      system_prompts: () => ({ role: "r-" + t.uniq() + Math.random(), prompt_text: "x" }),
      notification_history: () => ({ user_id: suid, notification_type: "t", title: "T", body: "B", category: "c", priority: "normal" }),
    };
    for (const [tn, mk] of Object.entries(MIN)) {
      const a = await ins(tn, mk()), b = await ins(tn, mk());
      const kind = sch[tn]?.id;
      if (kind === "int") t.check(`numeric_id.${tn}`, typeof a.json?.[0]?.id === "number" && b.json?.[0]?.id === a.json[0].id + 1 && a.json[0].id > 0, `ids=${a.json?.[0]?.id},${b.json?.[0]?.id} status=${a.status} ${a.text.slice(0, 120)}`);
      else t.check(`uuid_id.${tn}`, kind === "uuid" && UUID.test(a.json?.[0]?.id || "") && UUID.test(b.json?.[0]?.id || "") && a.json[0].id !== b.json[0].id, `kind=${kind} ids=${a.json?.[0]?.id},${b.json?.[0]?.id} status=${a.status} ${a.text.slice(0, 120)}`);
    }
    const as = await R("admin_settings", "id=gt.0");
    t.check("numeric_id.admin_settings_seeded_single_row", as.json?.length === 1 && as.json[0].id === 1, `rows=${show(as.json)}`);
    t.check("numeric_id.gt0_select", (await keys("admin_settings", "id=gt.0", "id")).length === 1, "admin_settings id=gt.0 must match the numeric id");
    const pg = await call("/rest/v1/admin_settings?id=gt.0", { method: "PATCH", body: { music_url: "http://m" }, headers: { Prefer: "return=representation" } });
    t.check("numeric_id.gt0_patch_updates", pg.status === 200 && pg.json?.length === 1 && pg.json[0].music_url === "http://m", `status=${pg.status} ${pg.text.slice(0, 100)}`);
    t.check("constraint.admin_settings_single_row", (await ins("admin_settings", { music_url: "x" })).status === 409 && (await ins("admin_settings", { id: 2 })).status === 400, "a second admin_settings row must be rejected");
    t.check("numeric_id.other_tables_use_uuid", UUID.test((await ins("inquiries", { user_id: suid, symptoms: "s" })).json?.[0]?.id || ""), "non-numeric tables use uuid");
  }

  // reset hook
  const rs = await call("/__fake/reset", { method: "POST" });
  const profAfter = await table("profiles");
  t.check("reset.restores_seed", rs.status === 200 && profAfter.length === seedUsers && sameSeq((await table("ops")), []), `status=${rs.status} profiles=${profAfter.length} want ${seedUsers}`);
  t.check("reset.drops_signed_up_users", (await auth("token", { email, password: "recovered789" })).status === 400, "user created before reset must be gone");
  t.check("reset.invalidates_old_tokens", (await call("/auth/v1/user", { token: sess.access_token })).status === 401, "old token must die");
  t.check("reset.seed_login_still_works", (await auth("token", { email: "admin@sihat.com", password: "password123" })).status === 200, "seeded admin");

  if (!GO) {
    // known blind spots of the JS fake (documented, not failures) — the Go SQLite backend implements all of them
    t.skip("blindspot.no_rls", "fake has no Row-Level-Security: user-token vs service-key scoping cannot be tested here (the Go SQLite backend is checked by FAKEDB_BASE runs)");
    t.skip("blindspot.apikey_unchecked", "fake never validates apikey/Authorization on /rest/v1 (requests with no key succeed)");
    t.skip("blindspot.no_pk_unique_constraints", "fake allows duplicate primary keys on plain insert; real PostgREST returns 409");
    t.skip("blindspot.desc_nulls_first", "order=col.desc puts NULLs last in the fake; Postgres default is NULLS FIRST (the app only sorts created_at/timestamp)");
    t.skip("blindspot.limit_zero", "limit=0 means 'no limit' in the fake; PostgREST returns []");
    t.skip("blindspot.patch_without_prefer", "fake answers PATCH without Prefer with 200+rows; PostgREST answers 204 with no body");
  } else {
    // --- Postgres-faithful behaviour, now real checks ---
    await ins("pk", { id: "dup-1", a: 1 });
    const dupPk = await ins("pk", { id: "dup-1", a: 2 });
    t.check("constraint.duplicate_pk_409", dupPk.status === 409 && dupPk.json?.code === "23505", `status=${dupPk.status} ${dupPk.text.slice(0, 120)}`);
    t.check("constraint.duplicate_pk_changes_nothing", (await table("pk")).length === 1 && (await table("pk"))[0].a === 1, "a rejected insert must not alter the existing row");
    await ins("nul", [{ k: 1, o: "p" }, { k: 2, o: null }, { k: 3, o: "q" }]);
    t.check("order.desc_nulls_first", sameSeq(await keys("nul", "order=o.desc", "o"), [null, "q", "p"]), `got ${show(await keys("nul", "order=o.desc", "o"))} (Postgres: DESC => NULLS FIRST)`);
    t.check("order.asc_nullsfirst_explicit", sameSeq(await keys("nul", "order=o.asc.nullsfirst", "o"), [null, "p", "q"]), `got ${show(await keys("nul", "order=o.asc.nullsfirst", "o"))}`);
    t.check("page.limit_zero_is_empty", sameSeq((await R("nul", "limit=0")).json, []), "limit=0 => []");
    const nn = await keys("nul", "o=neq.p", "k");
    t.check("op.neq_excludes_null_rows", sameSeq(nn, [3]), `got ${show(nn)} (NULL <> 'p' is NULL => excluded)`);
    const pNoPrefer = await call("/rest/v1/nul?k=eq.1", { method: "PATCH", body: { o: "pp" } });
    t.check("patch.without_prefer_204_empty", pNoPrefer.status === 204 && pNoPrefer.text === "", `status=${pNoPrefer.status} body=${pNoPrefer.text}`);
    const insNoPrefer = await call("/rest/v1/nul", { method: "POST", body: { k: 9 } });
    t.check("insert.without_prefer_201_empty", insNoPrefer.status === 201 && insNoPrefer.text === "", `status=${insNoPrefer.status} body=${insNoPrefer.text}`);

    // apikey handling (Supabase gateway)
    const noKey = await fetch(B + "/rest/v1/profiles?limit=1"), badKey = await fetch(B + "/rest/v1/profiles?limit=1", { headers: { apikey: "not-a-key" } });
    t.check("apikey.missing_401", noKey.status === 401, `status=${noKey.status}`);
    t.check("apikey.invalid_401", badKey.status === 401, `status=${badKey.status}`);
    const noKeyAuth = await fetch(B + "/auth/v1/token?grant_type=password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "x" }) });
    t.check("apikey.auth_endpoints_need_key_too", noKeyAuth.status === 401, `status=${noKeyAuth.status}`);
    t.check("auth.token_without_grant_type_400", (await call("/auth/v1/token", { method: "POST", body: { email, password: "recovered789" } })).status === 400, "POST /token without grant_type must be rejected like GoTrue");
    t.check("auth.anon_key_works_for_auth", (await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email: "admin@sihat.com", password: "password123" }, headers: { apikey: ANON } })).status === 200, "anon key must be accepted on /auth/v1");

    // RLS (db/schema.sql policies) over the wire: apikey = service key, bearer = user JWT, exactly like the Go app
    const mkUser = async (tag) => { const r = await auth("signup", { email: `rls-${tag}-${u}@example.com`, password: "secret123" }); return { id: r.json.user.id, token: r.json.access_token }; };
    const ua = await mkUser("a"), ub = await mkUser("b");
    const mkSession = (usr, d) => call("/rest/v1/diagnosis_sessions", { method: "POST", token: usr.token, headers: { Prefer: "return=representation" }, body: { user_id: usr.id, primary_diagnosis: d, full_report: {} } });
    const sa = await mkSession(ua, "A-diag"), sb = await mkSession(ub, "B-diag");
    t.check("rls.owner_insert_ok", sa.status === 201 && sb.status === 201, `a=${sa.status} b=${sb.status}`);
    const aSees = await call("/rest/v1/diagnosis_sessions?select=primary_diagnosis", { token: ua.token });
    t.check("rls.user_sees_only_own_rows", sameSeq((aSees.json || []).map((r) => r.primary_diagnosis), ["A-diag"]), `got ${aSees.text.slice(0, 120)}`);
    t.check("rls.user_cannot_read_others_by_filter", sameSeq((await call(`/rest/v1/diagnosis_sessions?user_id=eq.${ub.id}`, { token: ua.token })).json, []), "filtering by another user_id must still return nothing");
    t.check("rls.service_key_sees_all", ((await R("diagnosis_sessions", "select=id")).json || []).length >= 2, "service role bypasses RLS");
    const forged = await call("/rest/v1/diagnosis_sessions", { method: "POST", token: ua.token, body: { user_id: ub.id, primary_diagnosis: "forged", full_report: {} } });
    t.check("rls.insert_for_another_user_403", forged.status === 403 && forged.json?.code === "42501", `status=${forged.status} ${forged.text.slice(0, 120)}`);
    const hit = await call(`/rest/v1/diagnosis_sessions?id=eq.${sb.json[0].id}`, { method: "PATCH", token: ua.token, body: { primary_diagnosis: "hacked" }, headers: { Prefer: "return=representation" } });
    t.check("rls.update_others_row_matches_nothing", hit.status === 200 && sameSeq(hit.json, []), `status=${hit.status} ${hit.text.slice(0, 100)}`);
    t.check("rls.others_row_untouched", (await R("diagnosis_sessions", `id=eq.${sb.json[0].id}`)).json?.[0]?.primary_diagnosis === "B-diag", "B's row must be unchanged");
    await call(`/rest/v1/diagnosis_sessions?id=eq.${sb.json[0].id}`, { method: "DELETE", token: ua.token });
    t.check("rls.delete_others_row_matches_nothing", ((await R("diagnosis_sessions", `id=eq.${sb.json[0].id}`)).json || []).length === 1, "B's row must survive A's DELETE");
    const inqAsUser = await call("/rest/v1/inquiries", { token: ua.token });
    t.check("rls.no_grant_table_403", inqAsUser.status === 403 && inqAsUser.json?.code === "42501", `status=${inqAsUser.status} ${inqAsUser.text.slice(0, 100)}`);
    const promote = await call(`/rest/v1/profiles?id=eq.${ua.id}`, { method: "PATCH", token: ua.token, body: { role: "admin" } });
    t.check("rls.profiles_not_writable_by_user_403", promote.status === 403 && (await R("profiles", `id=eq.${ua.id}&select=role`)).json?.[0]?.role === "patient", `status=${promote.status}; a user must not be able to promote themself`);
    t.check("rls.profiles_select_own_only", sameSeq(((await call("/rest/v1/profiles?select=id", { token: ua.token })).json || []).map((r) => r.id), [ua.id]), "authenticated users read only their own profile row");
    const anonRead = await call("/rest/v1/profiles?select=id", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } });
    t.check("rls.anon_key_reads_nothing_401", anonRead.status === 401 && anonRead.json?.code === "42501", `status=${anonRead.status} ${anonRead.text.slice(0, 100)}`);
    t.check("rls.forged_jwt_401", (await call("/rest/v1/diagnosis_sessions", { token: sess.access_token.split(".").slice(0, 2).join(".") + "." + "A".repeat(43) })).status === 401, "a JWT with a bad signature must be rejected");
  }

  /* ============================== FIDELITY GUARD ============================== */
  const files = [...goFiles(join(APP_ROOT, "internal", "server")), ...goFiles(join(APP_ROOT, "internal", "supabase"))];
  const rel = (f) => f.slice(APP_ROOT.length + 1).replace(/\\/g, "/");
  const used = new Map(), orAnd = [], orders = [], selects = [], prefers = [], misc = [], tablesLit = new Map(), tablesVar = [];
  const addUse = (m, k, loc) => { if (!m.has(k)) m.set(k, []); m.get(k).push(loc); };
  const opRe = new RegExp(`=(not\\.)?(${OPS})\\.`, "g");
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//")) return;
      const loc = `${rel(f)}:${i + 1}`;
      for (const m of line.matchAll(opRe)) addUse(used, (m[1] ? "not." : "") + m[2], loc);
      for (const m of line.matchAll(/(?:^|[^\w])(or|and)=\(/g)) orAnd.push(`${m[1]}= @ ${loc}`);
      for (const m of line.matchAll(/order=([^&"`\s]+)/g)) orders.push([m[1], loc]);
      for (const m of line.matchAll(/select=([^&"`\s]+)/g)) selects.push([m[1], loc]);
      if (/on_conflict=/.test(line)) misc.push(`on_conflict @ ${loc}`);
      if (/vnd\.pgrst/.test(line)) misc.push(`vnd.pgrst Accept header @ ${loc}`);
      if (/"Range(-Unit)?"/.test(line)) misc.push(`Range header @ ${loc}`);
      if (/"Prefer"/.test(line)) for (const w of lines.slice(i, i + 3).join(" ").matchAll(/\b(return|resolution|count|missing|handling|tx)=([\w-]+)/g)) prefers.push([`${w[1]}=${w[2]}`, loc]);
    });
    for (const m of text.matchAll(/\.(Select|Insert|Update|Upsert|Delete)\(\s*[\w.]+\s*,\s*(?:"(\w+)"|([A-Za-z_][\w.]*))/g)) {
      const line = text.slice(0, m.index).split("\n").length;
      if (m[2]) { const e = tablesLit.get(m[2]) || { locs: [], idGt: false }; e.locs.push(`${rel(f)}:${line}`); if (/^\s*,\s*"id=gt\./.test(text.slice(m.index + m[0].length, m.index + m[0].length + 20))) e.idGt = true; tablesLit.set(m[2], e); }
      else tablesVar.push(`${rel(f)}:${line} (${m[1]} on variable '${m[3]}')`);
    }
  }
  // the scan itself must have found things, or the guard is vacuous
  t.check("guard.scanned_go_files", files.length >= 8, `only ${files.length} non-test .go files found under internal/server + internal/supabase`);
  t.check("guard.scan_finds_tables", tablesLit.size >= 10, `only ${tablesLit.size} literal tables found (${[...tablesLit.keys()].join(",")})`);
  t.check("guard.scan_finds_core_operators", ["eq", "gt", "gte", "in"].every((o) => used.has(o)), `operators seen: ${[...used.keys()].join(",")}`);

  // what the fake can do, probed live (not assumed)
  const opProbe = { eq: "n=eq.2", neq: "n=neq.2", gt: "n=gt.3", gte: "n=gte.3", lt: "n=lt.3", lte: "n=lte.3", in: "n=in.(1,3)", is: "opt=is.null", cs: "tags=cs.{y}", like: "s=like.al*", ilike: "s=ilike.*ETA*" };
  await ins("ops", [{ k: "a", n: 1, s: "alpha", flag: true, opt: null, tags: ["x", "y"] }, { k: "b", n: 2, s: "Beta", opt: "v", tags: ["y"] }, { k: "c", n: 3, s: "gamma", opt: "w", tags: [] }, { k: "d", n: 10, s: "delta" }]);
  const want = { eq: ["b"], neq: ["a", "c", "d"], gt: ["d"], gte: ["c", "d"], lt: ["a", "b"], lte: ["a", "b", "c"], in: ["a", "c"], is: ["a", "d"], cs: ["a", "b"], like: ["a"], ilike: ["b"] };
  const supported = new Set();
  for (const [op, qs] of Object.entries(opProbe)) if (sameSet(await keys("ops", qs), want[op])) supported.add(op);
  for (const [op, locs] of [...used.entries()].sort()) {
    t.check(`guard.op_${op.replace(/\./g, "_")}_implemented`, supported.has(op), `app uses '${op}' (${locs.slice(0, 3).join(", ")}${locs.length > 3 ? ` +${locs.length - 3}` : ""}) but fake-supabase does not implement it correctly`);
  }
  // fidelity gaps that only matter once the app exercises them
  const neqProbe = await keys("ops", "opt=neq.v");
  const neqOK = sameSet(neqProbe, ["c"]); // SQL: NULL <> 'v' is NULL -> row excluded
  if (used.has("neq") || GO) t.check("guard.neq_excludes_nulls", neqOK, `${used.has("neq") ? `app uses neq (${used.get("neq")[0]}) but ` : ""}backend returns ${show(neqProbe)} for opt=neq.v; Postgres excludes NULL rows (want ["c"])`);
  else t.skip("guard.neq_excludes_nulls", `app does not use neq; known fake gap: opt=neq.v returned ${show(neqProbe)} (SQL would exclude NULL rows)`);

  t.check("guard.no_or_and_filters", orAnd.length === 0, `app uses ${orAnd.join("; ")} but the fake rejects or=/and= (add support to the fake or it cannot test those paths)`);
  const notUsed = [...used.keys()].filter((k) => k.startsWith("not."));
  t.check("guard.no_not_negation", notUsed.length === 0, `app uses negated operators ${notUsed.join(",")}; fake does not implement 'not.'`);

  const badOrders = [];
  for (const [v, loc] of orders) for (const part of v.split(",")) if (!/^[\w%]+(\.(asc|desc))?(\.nullslast)?$/.test(part)) badOrders.push(`${v} @ ${loc}`);
  t.check("guard.order_clauses_supported", badOrders.length === 0, `unsupported order clause(s): ${badOrders.join("; ")} (fake handles col[.asc|.desc][.nullslast]; nullsfirst/json paths are not implemented)`);
  const badSel = selects.filter(([v]) => /[(:>!]/.test(v));
  t.check("guard.select_plain_columns_only", badSel.length === 0, `select uses embedded resources / aliases / casts the fake cannot do: ${badSel.map(([v, l]) => `${v} @ ${l}`).join("; ")}`);
  // on_conflict + resolution=ignore-duplicates (health_readings dedupe): probe the fake live, only allow it if it really works
  await ins("oc", { k: "a", d: "1", v: 1 });
  const ocIgn = await call("/rest/v1/oc?on_conflict=k,d", { method: "POST", body: [{ k: "a", d: "1", v: 2 }, { k: "a", d: "2", v: 3 }], headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
  const ocRows = await table("oc");
  // JS fake: the probe table is schemaless, so on_conflict works on any columns. Go SQLite backend: it follows Postgres and
  // answers 42P10 for an on_conflict target with no declared UNIQUE key, and a scratch table has none; the real dedupe path
  // (health_readings has UNIQUE(user_id, metric, measured_at, source)) is pinned by the ACI "health" suite (ingest/Apple/Google dedupe).
  const ocOK = GO
    ? ocIgn.status === 400 && ocIgn.json?.code === "42P10"
    : ocIgn.json?.length === 1 && ocIgn.json[0].d === "2" && ocRows?.length === 2 && ocRows.find((r) => r.d === "1")?.v === 1;
  t.check(GO ? "upsert.on_conflict_needs_unique_key" : "upsert.on_conflict_ignore_duplicates", ocOK,
    GO ? `expected 400/42P10 for an on_conflict target without a UNIQUE key, got ${ocIgn.status} ${ocIgn.text.slice(0, 160)}`
       : `returned=${show(ocIgn.json)} rows=${show(ocRows)} (skipped duplicates must not be returned or overwritten)`);
  const miscBad = ocOK ? misc.filter((x) => !x.startsWith("on_conflict")) : misc;
  const supPrefer = new Set(["return=representation", "resolution=merge-duplicates", ...(ocOK ? ["resolution=ignore-duplicates"] : [])]);
  const badPrefer = prefers.filter(([v]) => !supPrefer.has(v));
  t.check("guard.prefer_headers_supported", badPrefer.length === 0, `Prefer directives the fake ignores: ${badPrefer.map(([v, l]) => `${v} @ ${l}`).join("; ")}`);
  t.check("guard.scan_finds_prefer", prefers.length >= 2, `expected to find the client's Prefer headers, found ${prefers.length}`);
  t.check("guard.no_other_postgrest_features", miscBad.length === 0, `features the fake lacks: ${miscBad.join("; ")}`);

  // tables: every literal table must round-trip; id=gt.0 tables need numeric ids
  const seeded = new Set(["profiles"]);
  const generic = [];
  // Go backend: the tables are typed (db/schema.sql), so each round-trip uses a minimal VALID row (NOT NULL columns, FKs).
  // (the reset hook above dropped every earlier user: make fresh ones for the FK columns)
  const gA = GO ? await auth("signup", { email: `guard-a-${u}@example.com`, password: "secret123" }) : null;
  const gB = GO ? await auth("signup", { email: `guard-b-${u}@example.com`, password: "secret123" }) : null;
  const suid = gA?.json?.user?.id, suid2 = gB?.json?.user?.id;
  const iso = new Date().toISOString();
  const ROUND = {
    admin_settings: { patchOnly: true, col: "music_url" },
    profiles: { patchOnly: true, col: "bio", id: suid },
    system_prompts: { col: "prompt_text", mk: (m) => ({ role: "probe-" + m, prompt_text: m }) },
    system_logs: { col: "message", mk: (m) => ({ level: "info", category: "probe", message: m }) },
    system_errors: { col: "message", mk: (m) => ({ error_type: "probe", message: m }) },
    system_metrics: { col: "value", mk: (m) => ({ type: "probe", name: "probe", value: m }) },
    patients: { col: "first_name", mk: (m) => ({ first_name: m }) },
    inquiries: { col: "symptoms", mk: (m) => ({ user_id: suid, symptoms: m }) },
    diagnosis_sessions: { col: "primary_diagnosis", mk: (m) => ({ user_id: suid, primary_diagnosis: m, full_report: {} }) },
    guest_diagnosis_sessions: { col: "session_token", mk: (m) => ({ session_token: m, primary_diagnosis: "x", full_report: {} }) },
    user_notification_preferences: { col: "user_id", mk: () => ({ user_id: suid2 }), val: () => suid2 },
    user_devices: { col: "device_token", mk: (m) => ({ user_id: suid, device_token: m, device_type: "web" }) },
    scheduled_notifications: { col: "title", mk: (m) => ({ user_id: suid, notification_type: "t", title: m, body: "b", category: "c", scheduled_for: iso }) },
    notification_history: { col: "title", mk: (m) => ({ user_id: suid, notification_type: "t", title: m, body: "b", category: "c", priority: "normal" }) },
  };
  for (const [tn, e] of [...tablesLit.entries()].sort()) {
    const probe = `guardprobe_${u}`;
    let okRound, gone, w = { status: "n/a" };
    if (GO) {
      const spec = ROUND[tn];
      if (!spec) { t.check(`guard.table_${tn}_roundtrip`, false, `no minimal valid row defined for app table '${tn}' (${e.locs[0]}) — add it to ROUND in regress/suites/fakedb.mjs`); continue; }
      if (spec.patchOnly) {
        const where = tn === "profiles" ? `id=eq.${spec.id}` : "id=gt.0";
        w = await call(`/rest/v1/${tn}?${where}`, { method: "PATCH", body: { [spec.col]: probe }, headers: { Prefer: "return=representation" } });
        const r = await R(tn, `${spec.col}=eq.${probe}`);
        okRound = w.status === 200 && w.json?.length === 1 && r.json?.length === 1 && r.json[0][spec.col] === probe;
        await call(`/rest/v1/${tn}?${where}`, { method: "PATCH", body: { [spec.col]: null } });
        gone = (await R(tn, `${spec.col}=eq.${probe}`)).json?.length === 0;
      } else {
        const val = spec.val ? spec.val() : probe;
        w = await ins(tn, spec.mk(probe));
        const r = await R(tn, `${spec.col}=eq.${val}`);
        okRound = w.status === 201 && r.json?.length === 1 && String(r.json[0][spec.col]) === String(val);
        await call(`/rest/v1/${tn}?${spec.col}=eq.${val}`, { method: "DELETE" });
        gone = (await R(tn, `${spec.col}=eq.${val}`)).json?.length === 0;
      }
    } else {
      w = await ins(tn, { probe_marker: probe });
      const r = await R(tn, `probe_marker=eq.${probe}`);
      okRound = w.status === 201 && r.json?.length === 1 && r.json[0].probe_marker === probe;
      await call(`/rest/v1/${tn}?probe_marker=eq.${probe}`, { method: "DELETE" });
      gone = (await R(tn, `probe_marker=eq.${probe}`)).json?.length === 0;
    }
    t.check(`guard.table_${tn}_roundtrip`, okRound && gone, `${GO ? "valid-row " : ""}insert|patch/select/delete on '${tn}' (${e.locs[0]}) status=${w.status} ${String(w.text || "").slice(0, 120)}`);
    if (e.idGt) {
      let idv = w.json?.[0]?.id;
      if (GO && ROUND[tn]?.patchOnly) idv = (await R(tn, "id=gt.0")).json?.[0]?.id;
      t.check(`guard.table_${tn}_numeric_id_for_gt0`, typeof idv === "number", `app filters '${tn}' with id=gt.0 (${e.locs[0]}) but the backend assigns id=${show(idv)} (not numeric -> filter never matches)`);
    }
    if (!seeded.has(tn)) generic.push(tn);
  }
  if (GO) {
    const sch = (await call("/__fake/schema")).json?.tables || {};
    const missing = [...tablesLit.keys()].filter((tn) => !sch[tn]);
    t.check("guard.every_app_table_is_in_the_schema", missing.length === 0, `app tables missing from the SQLite backend's schema (db/schema.sql): ${missing.join(", ")}`);
  } else if (generic.length) t.skip("guard.tables_handled_generically", `${generic.length} app tables have no seed data and rely on the fake's schemaless handling: ${generic.join(", ")}`);
  if (tablesVar.length) t.skip("guard.tables_via_variable", `table name is a variable, cannot be statically checked: ${tablesVar.join("; ")}`);
}
