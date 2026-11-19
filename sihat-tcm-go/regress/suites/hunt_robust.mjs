/**
 * hunt_robust — robustness hunt (lens "robust"): server + SQLite backend under concurrency, abuse and failure.
 * Every check asserts the CORRECT behaviour, so it is RED while the defect exists and green once fixed.
 *
 * The suite boots its OWN private app instances (fresh SQLite file, own free ports, own PIDs - it never touches the
 * shared stack, so the destructive probes below cannot poison other suites) from the stack's freshly built binary:
 *   A  functional/concurrency probes (lost updates, double claim, races, validation, flooding, inbox poisoning)
 *   B  rate-limiter memory growth (RSS measured from the OS)
 *   C  slow-client handling (http.Server timeouts)
 *   D  database unreachable (error mapping) + log-line integrity
 * Only PIDs this suite started are ever killed.
 *
 *   ACI_PORT_OFFSET=4400 node aci.mjs test --suite=hunt_robust --db=sqlite --ai=fake
 */
import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exePath } from "../stack.mjs";

const PW = "password123";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hist = (rs) => rs.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}

function rssMB(pid) {
  if (process.platform === "win32") {
    const out = execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], { encoding: "utf8" });
    const last = out.trim().split('","').pop().replace(/[^0-9]/g, "");
    return Number(last) / 1024;
  }
  const m = readFileSync(`/proc/${pid}/status`, "utf8").match(/VmRSS:\s+(\d+)\s+kB/);
  return Number(m[1]) / 1024;
}

/** Boot a private app instance. mode "sqlite" = fresh SQLite file with the demo seed; "dbdown" = Supabase URL nobody listens on. */
async function boot(mode) {
  const dir = mkdtempSync(join(tmpdir(), "hunt-robust-"));
  const port = await freePort();
  const env = {
    ...process.env, PORT: String(port), APP_ENV: "development", PUBLIC_BASE_URL: `http://127.0.0.1:${port}`,
    AI_BASE_URL: "", GEMINI_API_KEY: "", TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "", MEDIA_DIR: "",
  };
  const inst = { dir, port, base: `http://127.0.0.1:${port}`, svcKey: "", dbUrl: "" };
  if (mode === "sqlite") {
    const dbport = await freePort();
    inst.svcKey = "svc-" + randomBytes(12).toString("hex");
    inst.dbUrl = `http://127.0.0.1:${dbport}`;
    Object.assign(env, {
      DB_BACKEND: "sqlite", SQLITE_PATH: join(dir, "s.db"), SEED_DEMO: "1", LOCALDB_ADDR: `127.0.0.1:${dbport}`, LOCALDB_TEST_HOOKS: "",
      LOCAL_JWT_SECRET: randomBytes(32).toString("hex"), LOCAL_ANON_KEY: "anon-" + randomBytes(8).toString("hex"), LOCAL_SERVICE_KEY: inst.svcKey,
      LOCAL_PBKDF2_ITER: "1000", SUPABASE_URL: "", SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "",
    });
  } else {
    const dead = await freePort(); // bound-then-released: nothing listens there
    Object.assign(env, { DB_BACKEND: "", SUPABASE_URL: `http://127.0.0.1:${dead}`, SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service" });
  }
  const child = spawn(exePath(), [], { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let log = "";
  child.stdout.on("data", (d) => (log += d)); child.stderr.on("data", (d) => (log += d));
  inst.child = child; inst.pid = child.pid; inst.log = () => log;
  inst.stop = async () => {
    try { if (child.exitCode === null) child.kill(); } catch { /* gone */ }
    await sleep(300);
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* still locked: OS temp cleaner */ }
  };
  const t0 = Date.now();
  for (;;) {
    try { if ((await fetch(inst.base + "/healthz")).ok) break; } catch { /* not up yet */ }
    if (child.exitCode !== null) throw new Error(`instance ${mode} exited early: ${log.slice(-300)}`);
    if (Date.now() - t0 > 25000) throw new Error(`instance ${mode} not up: ${log.slice(-300)}`);
    await sleep(200);
  }
  return inst;
}

export default {
  name: "hunt_robust",
  doc: "robustness hunt: lost updates on concurrent replies, guest-session double claim, unbounded rateMap, no http.Server timeouts, 10MB response cap poisons the doctor inbox, DB-down masked as 401, unthrottled public writers, validation 5xx, log-line injection (private instances)",
  needs: "stack",
  mutating: false,
  costly: false,
  async run(t) {
    if (!t.stack || !existsSync(exePath())) { t.skip("all", "needs the locally built app binary (run against the hermetic stack, not --base)"); return; }
    const ip = () => t.ip();
    const call = async (inst, path, { method = "GET", body, raw, token, headers = {}, timeout = 60000 } = {}) => {
      const h = { "X-Forwarded-For": ip(), ...headers };
      if (body !== undefined && !raw) h["Content-Type"] = "application/json";
      if (token) h.Authorization = "Bearer " + token;
      try {
        const res = await fetch(inst.base + path, { method, headers: h, body: body === undefined ? undefined : raw ? body : JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
        const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
        return { status: res.status, text, json, setCookie: res.headers.get("set-cookie") || "" };
      } catch (e) { return { status: 0, text: String(e), json: null, setCookie: "" }; }
    };
    const tokenOf = (sc) => ((sc || "").match(/sb-access-token=([^;]+)/) || [])[1] || "";
    const login = async (inst, email) => { const r = await call(inst, "/api/auth/login", { method: "POST", body: { email, password: PW } }); return { token: tokenOf(r.setCookie), id: r.json?.user?.id, status: r.status }; };
    const signup = async (inst, email, role = "patient", name = "Robust " + email) => { const r = await call(inst, "/api/auth/signup", { method: "POST", body: { email, password: PW, name, role } }); return { token: tokenOf(r.setCookie), id: r.json?.user?.id, status: r.status }; };
    const svc = (inst, path, o = {}) => fetch(inst.dbUrl + path, { ...o, headers: { apikey: inst.svcKey, Authorization: "Bearer " + inst.svcKey, "Content-Type": "application/json", Prefer: "return=minimal", ...(o.headers || {}) } });

    const insts = [];
    const need = async (mode) => { const i = await boot(mode); insts.push(i); return i; };
    try {
      /* ===================== group A: functional / concurrency ===================== */
      const groupA = async () => {
        const A = await need("sqlite");
        const pat = await login(A, "patient@sihat.com"), doc = await login(A, "doctor@sihat.com");
        if (!t.check("setup.private_instance_login", pat.token && doc.token, `patient=${pat.status} doctor=${doc.status}`)) return;
        const newRequest = async (userToken = pat.token) => {
          const vr = await call(A, "/api/verification-request", { method: "POST", token: userToken, body: { doctorId: doc.id, doctorName: "Dr", patientData: { name: "P" }, reportData: { diagnosis: "x" } } });
          return vr.json?.data?.id;
        };
        const thread = async (rid) => { const r = await call(A, "/api/patient/requests", { token: pat.token }); return (r.json?.requests || []).find((x) => x.id === rid)?.diagnosis_report || {}; };

        // robust-01: read-modify-write of diagnosis_report.messages loses messages when doctor and patient reply at the same instant
        {
          const rid = await newRequest();
          const N = 10, sent = [];
          const jobs = [];
          for (let i = 0; i < N; i++) {
            jobs.push(call(A, "/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rid, message: "doc-" + i, targetTable: "inquiries" } }).then((r) => r.status === 200 && sent.push("doc-" + i)));
            jobs.push(call(A, "/api/patient/reply", { method: "POST", token: pat.token, body: { requestId: rid, message: "pat-" + i } }).then((r) => r.status === 200 && sent.push("pat-" + i)));
          }
          await Promise.all(jobs);
          const have = new Set(((await thread(rid)).messages || []).map((m) => m.content));
          const lost = sent.filter((s) => !have.has(s));
          t.check("lostupdate.concurrent_doctor_patient_replies_all_persist", sent.length === 2 * N && lost.length === 0, `${sent.length} replies were acknowledged with 200 but ${lost.length} are missing from the thread (${lost.slice(0, 6).join(",")}...)`);
        }
        // robust-02: a treatment plan and a reply racing: the later full-document write erases the other's change
        {
          const rid = await newRequest();
          const N = 8, acked = [];
          const jobs = [];
          for (let i = 0; i < N; i++) {
            jobs.push(call(A, "/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rid, message: "r-" + i, targetTable: "inquiries" } }).then((r) => r.status === 200 && acked.push("r-" + i)));
            jobs.push(call(A, "/api/doctor/treatment-plan", { method: "POST", token: doc.token, body: { requestId: rid, plan: { pattern: "p" + i, notes: "n" + i } } }));
          }
          await Promise.all(jobs);
          const rep = await thread(rid);
          const have = new Set((rep.messages || []).map((m) => m.content));
          const lost = acked.filter((s) => !have.has(s));
          t.check("lostupdate.reply_vs_treatment_plan_keeps_both", lost.length === 0 && !!rep.treatment_plan, `acked replies=${acked.length} missing=${lost.length} (${lost.join(",")}) treatment_plan present=${!!rep.treatment_plan}`);
        }
        // robust-06: one guest report can be claimed more than once (check-then-act on migrated_to_user_id)
        {
          const u1 = await signup(A, `claim1-${t.uniq()}@example.com`), u2 = await signup(A, `claim2-${t.uniq()}@example.com`);
          const g = await call(A, "/api/guest/sessions", { method: "POST", body: { primary_diagnosis: "qi deficiency", full_report: { blob: "y".repeat(800_000) }, symptoms: "fatigue" } });
          const st = g.json?.session_token;
          if (t.check("claim.guest_session_created", g.status === 201 && !!st, `status=${g.status}`)) {
            const rs = await Promise.all([...Array.from({ length: 20 }, () => call(A, "/api/migrate-guest-session", { method: "POST", token: u1.token, body: { sessionToken: st } })), ...Array.from({ length: 20 }, () => call(A, "/api/migrate-guest-session", { method: "POST", token: u2.token, body: { sessionToken: st } }))]);
            const ok = rs.filter((r) => r.status === 200).length;
            // count with the service key (the users' own list would blow the 10 MB response cap that robust-05 pins)
            const cnt = async (id) => { const r = await svc(A, `/rest/v1/diagnosis_sessions?select=id&user_id=eq.${id}`, { headers: { Prefer: "" } }); const j = await r.json().catch(() => null); return Array.isArray(j) ? j.length : -1; };
            const s1 = await cnt(u1.id), s2 = await cnt(u2.id);
            t.check("claim.guest_session_migrates_exactly_once", ok === 1 && s1 + s2 === 1, `40 parallel claims of ONE guest token: ${ok}x200, sessions created: user1=${s1} user2=${s2} (want exactly 1 in total)`);
          }
        }
        // robust-07: first-time device registration is check-then-insert: parallel calls (two tabs) hit the unique key and 500
        {
          const u = await signup(A, `dev-${t.uniq()}@example.com`);
          let bad = 0, total = 0, seen = "";
          for (let round = 0; round < 8; round++) { // the SAME new token in every request of a round is what two tabs do
            const tokenStr = `dev-same-${round}-${t.uniq()}`;
            const rs = await Promise.all(Array.from({ length: 15 }, () => call(A, "/api/notifications/register-device", { method: "POST", token: u.token, body: { deviceToken: tokenStr, deviceType: "web", deviceName: "tab" } })));
            total += rs.length; const b = rs.filter((r) => r.status !== 200); bad += b.length; if (b.length && !seen) seen = `${b[0].status} ${b[0].text.trim().slice(0, 60)}`;
          }
          t.check("race.register_device_same_token_parallel_all_200", bad === 0, `${bad}/${total} concurrent registrations of one NEW device token failed (${seen}); an upsert must make them idempotent`);
        }
        // robust-08..10: bad client input must be a 4xx, not the DB's constraint error surfacing as a 500
        {
          const u = await signup(A, `val-${t.uniq()}@example.com`);
          const bodyS = (extra) => ({ primary_diagnosis: "x", full_report: { a: 1 }, ...extra });
          const lt500 = async (label, path, opt, why) => { const r = await call(A, path, opt); t.check(label, r.status > 0 && r.status < 500, `${why}: HTTP ${r.status} ${r.text.trim().slice(0, 80)} (want a 4xx)`); };
          for (const [lbl, extra, why] of [["fractional_score", { overall_score: 55.5 }, "overall_score 55.5"], ["text_score", { overall_score: "abc" }, "overall_score \"abc\""], ["impossible_date", { follow_up_date: "2026-13-45" }, "follow_up_date 2026-13-45"], ["deep_json", null, "full_report nested 1500 levels"]]) {
            const body = extra ? JSON.stringify(bodyS(extra)) : `{"primary_diagnosis":"x","full_report":${'{"a":'.repeat(1500)}1${"}".repeat(1500)}}`;
            await lt500(`validation.guest_session_${lbl}_is_4xx`, "/api/guest/sessions", { method: "POST", raw: true, body }, why);
          }
          await lt500("validation.patient_session_fractional_score_is_4xx", "/api/patient/sessions", { method: "POST", token: u.token, body: bodyS({ overall_score: 55.5 }) }, "overall_score 55.5");
          await lt500("validation.patient_session_impossible_date_is_4xx", "/api/patient/sessions", { method: "POST", token: u.token, body: bodyS({ follow_up_date: "2026-13-45" }) }, "follow_up_date 2026-13-45");
          await lt500("validation.profile_fractional_age_is_4xx", "/api/patient/profile", { method: "PUT", token: u.token, body: { age: 30.5 } }, "age 30.5 (integer column)");
          await lt500("validation.profile_huge_age_is_4xx", "/api/patient/profile", { method: "PUT", token: u.token, body: { age: 1e20 } }, "age 1e20");
          await lt500("validation.notification_prefs_bad_time_is_4xx", "/api/notifications/preferences", { method: "POST", token: u.token, body: { quiet_hours_start: "25:99" } }, "quiet_hours_start 25:99");
        }
        // robust-09: anonymous endpoints that write rows (or fire an outbound Telegram message) have no limiter, unlike /api/logs
        {
          const flood = async (path, body) => {
            const one = ip(); const codes = [];
            for (let i = 0; i < 6; i++) { const rs = await Promise.all(Array.from({ length: 20 }, () => call(A, path, { method: "POST", body, headers: { "X-Forwarded-For": one } }))); codes.push(...rs.map((r) => r.status)); if (codes.includes(429)) break; }
            return codes;
          };
          for (const [lbl, path, body] of [["guest_sessions", "/api/guest/sessions", { primary_diagnosis: "x", full_report: { a: 1 } }], ["system_health", "/api/admin/system-health", { error_type: "flood", message: "m" }], ["report_viewed", "/api/notifications/report-viewed", { isGuest: true }]]) {
            const codes = await flood(path, body);
            t.check(`flood.${lbl}_is_rate_limited`, codes.includes(429), `${codes.length} anonymous POSTs from ONE ip in a burst: statuses ${JSON.stringify(hist(codes.map((s) => ({ status: s }))))} (want a 429 within 120)`);
          }
        }
        // robust-11 (sqlite only): text ordering follows bytes (uppercase before lowercase), Postgres/Supabase follow the en_US collation
        {
          const u = `${t.uniq()}`;
          const lo = await signup(A, `lo-${u}@example.com`, "doctor", `aaa-${u}`), up = await signup(A, `up-${u}@example.com`, "doctor", `ZZZ-${u}`);
          for (const d of [lo, up]) if (d.id) await svc(A, `/rest/v1/profiles?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ is_approved: true }) });
          const dir = await call(A, "/api/doctors");
          const names = (dir.json?.doctors || []).map((d) => d.full_name);
          const iLo = names.indexOf(`aaa-${u}`), iUp = names.indexOf(`ZZZ-${u}`);
          if (iLo >= 0 && iUp >= 0) t.check("collation.directory_orders_names_like_postgres", iLo < iUp, `order=full_name.asc put "ZZZ-…" (idx ${iUp}) before "aaa-…" (idx ${iLo}); Postgres en_US.UTF-8 sorts aaa < ZZZ`);
          else t.skip("collation.directory_orders_names_like_postgres", `test doctors not listed (lo=${iLo} up=${iUp}, signup=${lo.status}/${up.status})`);
        }
        // robust-05: one self-registered patient poisons the master doctor inbox for everybody (10 MB response cap in the Supabase client)
        {
          const atk = await signup(A, `atk-${t.uniq()}@example.com`);
          const before = await call(A, "/api/doctor/requests", { token: doc.token });
          const big = { diagnosis: "x", blob: "A".repeat(1_900_000) };
          let created = 0;
          for (let i = 0; i < 6; i++) { const r = await call(A, "/api/verification-request", { method: "POST", token: atk.token, body: { doctorId: doc.id, doctorName: "Dr", patientData: { name: "x" }, reportData: big } }); if (r.status === 200) created++; }
          const after = await call(A, "/api/doctor/requests", { token: doc.token });
          const mine = await call(A, "/api/patient/requests", { token: atk.token });
          t.check("inbox.survives_large_requests_from_one_patient", before.status === 200 && after.status === 200, `doctor inbox before=${before.status}, after ${created} x 1.9MB verification-requests by one patient=${after.status} ${after.text.trim().slice(0, 60)}`);
          t.check("inbox.patient_own_list_survives_large_requests", mine.status === 200, `the patient's own /api/patient/requests after ${created} large requests = ${mine.status}`);
          const hidden = await call(A, "/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: doc.id, doctorName: "Dr", patientData: { name: "victim" }, reportData: { diagnosis: "real" } } });
          const rid = hidden.json?.data?.id;
          const inbox2 = await call(A, "/api/doctor/requests", { token: doc.token });
          t.check("inbox.new_legit_request_visible_to_doctor", inbox2.status === 200 && (inbox2.json?.requests || []).some((x) => x.id === rid), `a later legitimate request (${rid}) is not visible: inbox=${inbox2.status}`);
        }
      };

      /* ===================== group B: rate limiter memory ===================== */
      const groupB = async () => {
        const B = await need("sqlite");
        const agent = new http.Agent({ keepAlive: true, maxSockets: 64 });
        let k = 0;
        const hit = () => new Promise((resolve) => {
          const n = ++k;
          const rq = http.request({ host: "127.0.0.1", port: B.port, path: "/api/logs", method: "POST", agent, headers: { "X-Forwarded-For": `100.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`, "Content-Type": "application/json", "Content-Length": 2 } }, (r) => { r.resume(); r.on("end", () => resolve(r.statusCode)); });
          rq.on("error", () => resolve(0)); rq.end("{}");
        });
        const burst = async (n) => { let left = n; await Promise.all(Array.from({ length: 64 }, async () => { while (left-- > 0) await hit(); })); };
        await burst(20000); await sleep(1500);
        const r1 = rssMB(B.pid);
        await burst(120000); await sleep(1500);
        const r2 = rssMB(B.pid);
        agent.destroy();
        t.check("ratelimit.map_is_bounded_under_distinct_ips", r2 - r1 < 10, `rateMap (internal/server/auth.go) never evicts: RSS ${r1.toFixed(1)} -> ${r2.toFixed(1)} MB (+${(r2 - r1).toFixed(1)}) after 120k more DISTINCT client IPs; a bounded/expiring map stays flat`);
      };

      /* ===================== group C: slow clients ===================== */
      const groupC = async () => {
        const C = await need("sqlite");
        const probe = (payload, deadlineMs) => new Promise((resolve) => {
          const t0 = Date.now();
          const s = net.connect(C.port, "127.0.0.1", () => s.write(payload));
          let done = false;
          const fin = (closed) => { if (done) return; done = true; clearTimeout(timer); s.destroy(); resolve({ closed, ms: Date.now() - t0 }); };
          const timer = setTimeout(() => fin(false), deadlineMs);
          s.on("close", () => fin(true)); s.on("error", () => fin(true));
          s.on("data", () => { /* a 408 reply may arrive before the close */ });
        });
        const [hdr, body] = await Promise.all([
          probe("GET /healthz HTTP/1.1\r\nHost: x\r\nX-A: b\r\n", 40000),
          probe(`POST /api/auth/login HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{"email":`, 70000),
        ]);
        t.check("slowclient.partial_header_connection_is_closed", hdr.closed, `a client that sends half a request header and stalls is still connected after ${(hdr.ms / 1000).toFixed(0)}s (main.go uses http.ListenAndServe with no ReadHeaderTimeout: unlimited slowloris)`);
        t.check("slowclient.stalled_body_connection_is_closed", body.closed, `a client that promises 1000 body bytes, sends 9 and stalls is still connected after ${(body.ms / 1000).toFixed(0)}s (no ReadTimeout)`);
      };

      /* ===================== group D: database down + log integrity ===================== */
      const groupD = async () => {
        const Dn = await need("dbdown");
        const li = await call(Dn, "/api/auth/login", { method: "POST", body: { email: "patient@sihat.com", password: PW } });
        t.check("dbdown.login_is_5xx_not_invalid_credentials", li.status >= 500 && li.status < 600, `database unreachable: login answers HTTP ${li.status} ${li.text.trim().slice(0, 60)} (users are told their password is wrong; want 503)`);
        const su = await call(Dn, "/api/auth/signup", { method: "POST", body: { email: `d-${t.uniq()}@example.com`, password: PW, name: "D", role: "patient" } });
        t.check("dbdown.signup_is_5xx_not_400", su.status >= 500 && su.status < 600, `database unreachable: signup answers HTTP ${su.status} ${su.text.trim().slice(0, 60)} (a server fault reported as a client error)`);
        await fetch(Dn.base + "/x%0AFORGED-LOG-LINE%20admin%20login%20ok", { headers: { "X-Forwarded-For": ip() } }).catch(() => {});
        await sleep(300);
        t.check("log.request_path_cannot_forge_log_lines", !/^FORGED-LOG-LINE/m.test(Dn.log()), "withLogging prints the DECODED r.URL.Path with %s: %0A in a URL starts a new, attacker-authored line in the server log");
      };

      await Promise.all([groupA(), groupB(), groupC(), groupD()]);
    } finally {
      for (const i of insts) await i.stop();
    }
  },
};
