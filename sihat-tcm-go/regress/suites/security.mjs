/**
 * security — defensive input-validation + access-control QA of our own app (hermetic stack).
 * Sections: route-table audit · anonymous probes of OPEN routes · IDOR · filter injection ·
 * body hardening · auth hardening · XSS reflection · error leakage.
 * Failing checks are real app defects (see the detail strings); do not weaken them.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRV = join(ROOT, "internal", "server");

/* ---- pinned route tables (update deliberately when a route is added/removed/re-protected) ---- */
const OPEN = new Set([
  "GET /healthz", "GET /api/health", "GET /{$}", "GET /login", "GET /reset-password", "GET /patient",
  "GET /patient/report/{id}", "GET /doctor", "GET /admin", "GET /robots.txt", "GET /sitemap.xml", "GET /demo", "GET /video", "GET /media/{name}",
  "POST /api/chat", "POST /api/consult", "POST /api/report-chat", "POST /api/western-chat",
  "POST /api/heart-companion", "OPTIONS /api/heart-companion",   "POST /api/analyze-image", "POST /api/analyze-audio", "POST /api/analyze-snore", "POST /api/extract-text",
  "POST /api/validate-medicine",
  "POST /api/auth/login", "POST /api/auth/signup", "POST /api/auth/logout", "POST /api/auth/forgot-password", "POST /api/auth/reset-password",
  "GET /api/doctors", "POST /api/guest/sessions",
  "POST /api/admin/system-health",
  "POST /api/logs", "GET /api/config/gemini-key", "GET /api/monitoring/health", "POST /api/monitoring/metrics",
  "POST /api/notifications/report-viewed",
  "GET /api/health/google/callback", "POST /api/health/ingest",   // wearable integrations: browser returning from Google (sealed state cookie) / bearer ingest token
  "POST /api/summarize-inquiry", "POST /api/summarize-reports", "POST /api/summarize-medical-history", "POST /api/ask-dietary-advice", "POST /api/generate-infographic",
]);
const PROTECTED = {
  "PUT /api/admin/settings": "admin", "GET /api/admin/settings": "admin,developer", "GET /api/admin/db-status": "admin,developer",
  "GET /api/monitoring/metrics": "admin,developer", "POST /api/admin/test-api-key": "admin",
  "POST /api/admin/assistant": "admin,developer", "POST /api/developer/assistant": "developer,admin", "POST /api/doctor/generate-inquiry": "doctor,admin",
  "POST /api/verification-request": "",
  "GET /api/admin/system-health": "admin,developer", "GET /api/logs": "developer,admin",
  "GET /api/admin/doctors": "admin", "POST /api/admin/doctors/approve": "admin",
  "GET /api/auth/me": "", "POST /api/doctor/reply": "doctor", "POST /api/patient/reply": "", "POST /api/doctor/treatment-plan": "doctor",
  "POST /api/ai/patient-summary": "doctor,admin", "POST /api/migrate-guest-session": "", "GET /api/patient/sessions": "", "POST /api/patient/sessions": "",
  "GET /api/doctor/requests": "doctor", "POST /api/doctor/flag": "doctor", "GET /api/patient/requests": "", "POST /api/patient/requests/cancel": "",
  "GET /api/patient/profile": "", "PUT /api/patient/profile": "",
  "GET /api/notifications/preferences": "", "POST /api/notifications/preferences": "", "POST /api/notifications/register-device": "",
  "DELETE /api/notifications/register-device": "", "GET /api/notifications/schedule": "", "POST /api/notifications/schedule": "",
  "DELETE /api/notifications/schedule": "", "GET /api/notifications/sync": "", "POST /api/notifications/sync": "",
  "GET /api/health/summary": "", "GET /api/health/readings": "", "POST /api/health/readings": "", "DELETE /api/health/readings": "",
  "POST /api/health/ingest-token": "", "DELETE /api/health/ingest-token": "", "POST /api/health/apple/import": "",
  "GET /api/health/google/connect": "", "POST /api/health/google/sync": "", "DELETE /api/health/google": "",
};
/** Open routes whose handler authenticates internally (page redirect to /login). */
const PAGE_AUTH = ["GET /patient", "GET /patient/report/{id}", "GET /doctor", "GET /admin"];

export function parseRoutes() {
  const out = [];
  for (const f of readdirSync(SRV).filter((x) => x.endsWith(".go") && !x.endsWith("_test.go"))) {
    const src = readFileSync(join(SRV, f), "utf8");
    const re = /s\.Mux\.HandleFunc\(\s*"([A-Z]+) ([^"]+)"/g;
    let m;
    while ((m = re.exec(src))) {
      let depth = 1, j = m.index + "s.Mux.HandleFunc(".length;
      while (j < src.length && depth > 0) { const c = src[j++]; if (c === "(") depth++; else if (c === ")") depth--; }
      const stmt = src.slice(m.index, j);
      const ra = stmt.match(/RequireAuth\(\s*[\w.]+\s*((?:,\s*"[^"]+")*)\s*\)/);
      out.push({ key: `${m[1]} ${m[2]}`, file: f, auth: !!ra, roles: ra ? [...ra[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).join(",") : "", rate: /RateLimit\(/.test(stmt) });
    }
  }
  return out;
}

const LEAK = [/supabase\.co/i, /sbp_[A-Za-z0-9]/, /AIza[0-9A-Za-z_-]{10,}/, /\/home\//, /[A-Za-z]:\\\\?[A-Za-z]/, /goroutine \d/, /panic:/i, /runtime error/i, /\.go:\d+/, /generativelanguage/i, /api\.telegram\.org/i, /service_role/i, /\bSELECT\s.+\sFROM\b/i, /pq:|SQLSTATE/];

export default {
  name: "security", needs: "stack", mutating: true, costly: false,
  doc: "route-table audit, open-route probes, IDOR, PostgREST filter injection, body hardening, auth/cookie hardening, XSS reflection, error leakage",
  async run(t) {
    const seen = []; // every response, for the final leakage sweep
    const req = async (path, { method = "GET", body, raw, token, cookie, headers = {}, ip = t.ip(), timeout = 20000 } = {}) => {
      const h = { "X-Forwarded-For": ip, ...headers };
      if (body !== undefined && !h["Content-Type"]) h["Content-Type"] = "application/json"; // 415 otherwise; raw bodies are JSON-typed (invalid JSON on purpose)
      if (token) h["Authorization"] = "Bearer " + token;
      if (cookie) h["Cookie"] = "sb-access-token=" + cookie;
      const t0 = Date.now();
      try {
        const res = await fetch(t.base + path, { method, headers: h, body: body === undefined ? undefined : raw ? body : JSON.stringify(body), redirect: "manual", signal: AbortSignal.timeout(timeout) });
        const text = await res.text();
        let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
        const r = { status: res.status, text, json, headers: res.headers, setCookie: res.headers.get("set-cookie") || "", ms: Date.now() - t0, path, method };
        seen.push(r);
        return r;
      } catch (e) {
        return { status: 0, text: "", json: null, headers: new Headers(), setCookie: "", ms: Date.now() - t0, err: String(e), timeout: /timeout|abort/i.test(String(e)), path, method };
      }
    };
    const tokOf = (sc) => ((sc || "").match(/sb-access-token=([^;]+)/) || [])[1] || "";
    const is4 = (s) => s >= 400 && s < 500;
    const u = t.uniq();
    const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
    const signup = async (email, name, role, extra = {}) => {
      const r = await req("/api/auth/signup", { method: "POST", body: { email, password: PW, name, role, ...extra } });
      return { r, token: tokOf(r.setCookie), id: r.json?.user?.id, role: r.json?.role };
    };
    const login = async (email, password = PW, o = {}) => {
      const r = await req("/api/auth/login", { method: "POST", body: { email, password }, ...o });
      return { r, token: tokOf(r.setCookie), id: r.json?.user?.id, role: r.json?.role };
    };
    const dbTable = (n) => t.dbTable(n);
    const patId = crypto.randomUUID();   // patients.id is a uuid on the real DB

    /* ================= 1. route-table audit ================= */
    const routes = parseRoutes();
    t.check("routes.parsed", routes.length >= 60, `parsed only ${routes.length} routes from internal/server/*.go (parser broken?)`);
    const openNow = new Set(routes.filter((r) => !r.auth).map((r) => r.key));
    const newOpen = [...openNow].filter((k) => !OPEN.has(k));
    const goneOpen = [...OPEN].filter((k) => !openNow.has(k));
    t.check("routes.no_unexpected_open", newOpen.length === 0, `route(s) OPEN (no RequireAuth) but not in the suite allowlist: ${newOpen.join(", ")}`);
    t.check("routes.no_vanished_open", goneOpen.length === 0, `allowlisted open route(s) vanished or now protected: ${goneOpen.join(", ")} — update the allowlist`);
    const prot = Object.fromEntries(routes.filter((r) => r.auth).map((r) => [r.key, r.roles]));
    const protDiff = [];
    for (const k of Object.keys(prot)) if (!(k in PROTECTED)) protDiff.push(`+${k}[${prot[k]}]`); else if (PROTECTED[k] !== prot[k]) protDiff.push(`${k}: roles "${PROTECTED[k]}" -> "${prot[k]}"`);
    for (const k of Object.keys(PROTECTED)) if (!(k in prot)) protDiff.push(`-${k}`);
    t.check("routes.protected_set_pinned", protDiff.length === 0, `protected-route table drift: ${protDiff.join("; ")}`);

    /* ================= identities ================= */
    const A = await signup(`sec-a-${u}@example.com`, "Sec A", "patient");
    const B = await signup(`sec-b-${u}@example.com`, "Sec B", "patient");
    const D1 = await signup(`sec-d1-${u}@example.com`, "Dr Sec One", "doctor", { specialty: "Internal", bio: "bio" });
    const D2 = await signup(`sec-d2-${u}@example.com`, "Dr Sec Two", "doctor");
    const admin = await login("admin@sihat.com");
    const dev = await login("developer@sihat.com");
    // a self-registered doctor is NOT approved: the admin must approve before the doctor APIs / directory work
    const apprDoc = async (d) => { if (!d.id || !admin.token) return false; const r = await req("/api/admin/doctors/approve", { method: "POST", token: admin.token, body: { id: d.id } }); return r.status === 200; };
    const D3 = await signup(`sec-d3-${u}@example.com`, "Dr Sec Unapproved", "doctor", { specialty: "Pending", bio: "stays unapproved" });   // never approved: the negative control
    const apprOk = (await apprDoc(D1)) && (await apprDoc(D2));
    t.check("setup.doctors_approved_by_admin", apprOk, `POST /api/admin/doctors/approve for D1/D2 failed (D1=${D1.id} D2=${D2.id}); every doctor-side check below needs approved doctors`);
    const ready = A.token && B.token && D1.token && D2.token && admin.token && dev.token && A.id && B.id && D1.id;
    t.check("setup.identities_hold_valid_tokens", !!ready, `A=${!!A.token} B=${!!B.token} D1=${!!D1.token} D2=${!!D2.token} admin=${!!admin.token} dev=${!!dev.token} (further checks would pass vacuously)`);
    if (!ready) return;

    // victim B: a routed request + a saved session + a patients row
    const vr = await req("/api/verification-request", { method: "POST", token: B.token, body: { userId: B.id, doctorId: D1.id, doctorName: "Dr Sec One", patientData: { name: "Sec B", email: `sec-b-${u}@example.com` }, reportData: { diagnosis: { primary_pattern: "B-PRIVATE-PATTERN" } } } });
    const bReq = vr.json?.data?.id;
    const ar = await req("/api/verification-request", { method: "POST", token: A.token, body: { userId: A.id, doctorId: D1.id, doctorName: "Dr Sec One", patientData: { name: "Sec A" }, reportData: {} } });
    const aReq = ar.json?.data?.id;
    t.check("setup.requests_created", !!bReq && !!aReq, `verification-request B=${vr.status} A=${ar.status}`);
    const bs = await req("/api/patient/sessions", { method: "POST", token: B.token, body: { primary_diagnosis: "B-SECRET-DX", symptoms: "a, b", full_report: { x: 1 } } });
    const bSess = bs.json?.session?.id;
    if (t.hasDb) await t.dbInsert("patients", { id: patId, first_name: "Victim", last_name: "Bee", user_id: B.id, birth_date: "1980-01-01" });
    if (!bReq || !aReq) return;

    /* ================= 2. open routes: what does an anonymous caller get? ================= */
    const gk = "AIza" + "SyD" + u.padEnd(32, "x").slice(0, 32);
    const put = await req("/api/admin/settings", { method: "PUT", token: admin.token, body: { gemini_api_key: gk, openai_api_key: "sk-probe-" + u.padEnd(30, "z"), service_role_key: "svc-probe-" + u.padEnd(30, "q") } });
    t.check("settings.admin_put_ok", put.status === 200, `admin PUT settings status=${put.status}`);
    const sAnon = await req("/api/admin/settings");
    t.check("settings.anonymous_denied", sAnon.status === 401, `anonymous GET /api/admin/settings -> ${sAnon.status} (expected 401)`);
    const sPat = await req("/api/admin/settings", { token: A.token });
    t.check("settings.patient_denied", sPat.status === 403, `patient GET /api/admin/settings -> ${sPat.status} (expected 403)`);
    const sDevGet = await req("/api/admin/settings", { token: dev.token });
    t.check("settings.developer_can_read", sDevGet.status === 200, `developer GET /api/admin/settings -> ${sDevGet.status} (expected 200)`);
    const sAdm = await req("/api/admin/settings", { token: admin.token });
    t.check("settings.admin_get_ok", sAdm.status === 200, `admin GET /api/admin/settings -> ${sAdm.status}`);
    const sTxt = sAdm.text + sDevGet.text; // masking is asserted on what privileged callers actually receive
    t.check("settings.gemini_key_masked", !sTxt.includes(gk) && !/AIza[0-9A-Za-z_-]{30,}/.test(sTxt), "full Gemini key present in settings response");
    t.check("settings.other_secret_fields_masked", !sTxt.includes("sk-probe-") && !sTxt.includes("svc-probe-"), "non-gemini secret-looking fields (openai_api_key/service_role_key) returned raw; only gemini_api_key is masked (handlers_admin.go:81)");
    await req("/api/admin/settings", { method: "PUT", token: admin.token, body: { gemini_api_key: "", openai_api_key: "", service_role_key: "" } });
    const dev403 = await req("/api/admin/settings", { method: "PUT", token: dev.token, body: { x: 1 } });
    t.check("settings.developer_cannot_put", dev403.status === 403, `developer PUT settings -> ${dev403.status}`);

    const dbs = await req("/api/admin/db-status");
    t.check("dbstatus.anonymous_denied", dbs.status === 401, `anonymous GET db-status -> ${dbs.status} (expected 401)`);
    const dbsP = await req("/api/admin/db-status", { token: A.token });
    t.check("dbstatus.patient_denied", dbsP.status === 403, `patient GET db-status -> ${dbsP.status} (expected 403)`);
    const dbsD = await req("/api/admin/db-status", { token: dev.token });
    t.check("dbstatus.developer_allowed", dbsD.status === 200, `developer GET db-status -> ${dbsD.status} (expected 200)`);
    const mm = await req("/api/monitoring/metrics");
    t.check("metrics.get_anonymous_denied", mm.status === 401, `anonymous GET /api/monitoring/metrics -> ${mm.status} (expected 401)`);
    const mmP = await req("/api/monitoring/metrics", { token: D1.token });
    t.check("metrics.get_doctor_denied", mmP.status === 403, `doctor GET /api/monitoring/metrics -> ${mmP.status} (expected 403)`);
    const mh = await req("/api/monitoring/health");
    t.check("monitoring_health.no_secrets", !/key|token|secret|password/i.test(JSON.stringify(mh.json?.components || {})), "health components mention secrets");

    for (const [label, hdrs] of [["no_header", {}], ["wrong_token", { "X-App-Token": "wrong-" + u }], ["empty_token", { "X-App-Token": "" }], ["guess_token", { "X-App-Token": "changeme" }]]) {
      const r = await req("/api/config/gemini-key", { headers: hdrs });
      t.check(`gemini_key.${label}_denied`, [401, 403, 503].includes(r.status) && !/apiKey/.test(r.text), `status=${r.status} body=${r.text.slice(0, 80)}`);
    }
    const gq = await req("/api/config/gemini-key?token=1&X-App-Token=1&apiKey=1");
    t.check("gemini_key.query_param_not_accepted", !/"apiKey"/.test(gq.text) && gq.status !== 200, `status=${gq.status}`);

    const dir = await req("/api/doctors");
    const rows = dir.json?.doctors || [];
    t.check("doctors.directory_nonempty", dir.status === 200 && rows.some((d) => d.id === D1.id), `status=${dir.status} rows=${rows.length}`);
    t.check("doctors.no_email_pii", rows.length > 0 && rows.every((d) => !("phone" in d) && (!("email" in d) || /@sihat\.com$/i.test(d.email))), "anonymous /api/doctors returns a real (non-demo) doctor's email address (only seeded @sihat.com demo doctors may expose it, for the login quick-access dropdown)");
    t.check("doctors.no_credentials", !/password|hash|token/i.test(dir.text), "credential-like text in directory");

    const aa = await req("/api/admin/assistant", { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    t.check("assistant.admin_requires_auth", aa.status === 401, `anonymous POST /api/admin/assistant -> ${aa.status} (expected 401)`);
    const aaP = await req("/api/admin/assistant", { method: "POST", token: A.token, body: { messages: [{ role: "user", content: "hi" }] } });
    t.check("assistant.admin_patient_denied", aaP.status === 403, `patient POST /api/admin/assistant -> ${aaP.status} (expected 403)`);
    const da = await req("/api/developer/assistant", { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    t.check("assistant.developer_requires_auth", da.status === 401, `anonymous POST /api/developer/assistant -> ${da.status} (expected 401)`);
    const daP = await req("/api/developer/assistant", { method: "POST", token: D1.token, body: { messages: [{ role: "user", content: "hi" }] } });
    t.check("assistant.developer_doctor_denied", daP.status === 403, `doctor POST /api/developer/assistant -> ${daP.status} (expected 403)`);
    const gi = await req("/api/doctor/generate-inquiry", { method: "POST", body: { patientInfo: { age: 30 }, symptoms: "x" } });
    t.check("generate_inquiry_requires_auth", gi.status === 401, `anonymous POST /api/doctor/generate-inquiry -> ${gi.status} (expected 401)`);
    const giP = await req("/api/doctor/generate-inquiry", { method: "POST", token: A.token, body: { patientInfo: { age: 30 }, symptoms: "x" } });
    t.check("generate_inquiry_patient_denied", giP.status === 403, `patient POST /api/doctor/generate-inquiry -> ${giP.status} (expected 403)`);
    const tk = await req("/api/admin/test-api-key", { method: "POST", body: { useSavedKey: true } });
    t.check("test_api_key_requires_auth", tk.status === 401, `anonymous POST /api/admin/test-api-key {useSavedKey} -> ${tk.status} (expected 401)`);
    const tkD = await req("/api/admin/test-api-key", { method: "POST", token: dev.token, body: { useSavedKey: true } });
    t.check("test_api_key_developer_denied", tkD.status === 403, `developer POST /api/admin/test-api-key -> ${tkD.status} (admin only; expected 403)`);
    const rv = await req("/api/notifications/report-viewed", { method: "POST", body: { isGuest: true } });
    t.check("report_viewed.no_token_or_url_leak", !/api\.telegram\.org|bot\d+:|\d{6,}:[A-Za-z0-9_-]{30,}/.test(rv.text), `body leaks telegram url/token: ${rv.text.slice(0, 120)}`);

    // userId spoofing on unauthenticated writers
    const spoofMsg = "spoof-" + u;
    await req("/api/logs", { method: "POST", body: { level: "info", category: "sec", message: spoofMsg, userId: B.id } });
    const logs = await dbTable("system_logs");
    const lrow = (logs || []).find((r) => r.message === spoofMsg);
    if (logs) t.check("logs.post_cannot_spoof_user_id", !!lrow && lrow.user_id !== B.id, `anonymous log row stored with attacker-chosen user_id=${lrow?.user_id} (handlers_admin.go:~400)`);
    else t.skip("logs.post_cannot_spoof_user_id", "fake db table hook unavailable");
    const anonReq = await req("/api/verification-request", { method: "POST", body: { userId: B.id, doctorId: D1.id, doctorName: "Dr Sec One", patientData: { name: "INJECTED-BY-ANON" }, reportData: {} } });
    t.check("verification.anonymous_denied", anonReq.status === 401, `anonymous verification-request -> ${anonReq.status} (expected 401)`);
    const spoofReq = await req("/api/verification-request", { method: "POST", token: A.token, body: { userId: B.id, doctorId: D1.id, doctorName: "Dr Sec One", patientData: { name: "INJECTED-BY-A" }, reportData: {} } });
    const spoofId = spoofReq.json?.data?.id;
    const bList = await req("/api/patient/requests", { token: B.token });
    const aList2 = await req("/api/patient/requests", { token: A.token });
    t.check("verification.body_user_id_ignored_not_in_victim_inbox", spoofReq.status >= 400 || (!!spoofId && !(bList.json?.requests || []).some((x) => x.id === spoofId) && (aList2.json?.requests || []).some((x) => x.id === spoofId)), `authed attacker A passing userId=B: request ${spoofId} must be attached to A, never to B's inbox (status ${spoofReq.status}; handleVerificationRequest forces user.ID)`);
    const ghost = await req("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: crypto.randomUUID(), doctorName: "Ghost", patientData: {}, reportData: {} } });
    t.check("verification.unknown_doctor_rejected", is4(ghost.status), `request to nonexistent doctor accepted -> ${ghost.status}`);
    // a malformed (non-UUID) id passes validID but a typed uuid column (real Supabase / sqlite) answers 22P02 -> the app returns 500, not 4xx
    const ghostSlug = await req("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: "no-such-doctor-" + u, doctorName: "Ghost", patientData: {}, reportData: {} } });
    t.check("verification.malformed_doctor_id_never_accepted", ghostSlug.status >= 400, `non-uuid doctorId accepted -> ${ghostSlug.status}`);
    t.check("verification.malformed_doctor_id_is_4xx", ghostSlug.status >= 400 && ghostSlug.status < 500, `non-UUID doctorId answered ${ghostSlug.status} (must be 400: a typed uuid column would otherwise surface a DB 500)`);
    const noRep = await req("/api/patient/sessions", { method: "POST", token: A.token, body: { symptoms: "x" } });
    t.check("sessions.missing_required_fields_400", noRep.status === 400, `patient session without full_report -> ${noRep.status} (NOT NULL column; want 400 not 500)`);
    const noRepG = await req("/api/guest/sessions", { method: "POST", body: { symptoms: "x" } });
    t.check("sessions.guest_missing_required_fields_400", noRepG.status === 400, `guest session without full_report -> ${noRepG.status} (want 400 not 500)`);
    const gs = await req("/api/guest/sessions", { method: "POST", body: { session_token: "known-" + u, migrated_to_user_id: B.id, primary_diagnosis: "Qi deficiency", full_report: { a: 1 } } });   // primary_diagnosis is NOT NULL on a real DB
    t.check("guest.token_server_generated", gs.status === 201 && gs.json?.session_token && gs.json.session_token !== "known-" + u, `client-chosen session_token honoured? ${gs.text.slice(0, 80)}`);
    const grows = await dbTable("guest_diagnosis_sessions");
    const grow = (grows || []).find((r) => r.session_token === gs.json?.session_token);
    if (grows) t.check("guest.no_mass_assignment", !!grow && !grow.migrated_to_user_id, `anonymous client pre-set migrated_to_user_id=${grow?.migrated_to_user_id} (handlers_doctor.go:1144 inserts raw payload)`);

    /* ================= 3. IDOR / role fences ================= */
    const msgCount = async (tok, id) => { const l = await req("/api/patient/requests", { token: tok }); const row = (l.json?.requests || []).find((x) => x.id === id); return row ? (row.diagnosis_report?.messages || []).length : -1; };
    const aList = await req("/api/patient/requests", { token: A.token });
    t.check("idor.list_excludes_other_patients", aList.status === 200 && !(aList.json?.requests || []).some((x) => x.id === bReq) && !/B-PRIVATE-PATTERN/.test(aList.text), "A's list contains B's request");
    const before = await msgCount(B.token, bReq);
    t.check("idor.victim_visible_to_owner", before >= 0, "B cannot see own request (later checks vacuous)");
    const cx = await req("/api/patient/requests/cancel", { method: "POST", token: A.token, body: { id: bReq } });
    t.check("idor.cancel_foreign_denied", cx.status === 403 || cx.status === 404, `status=${cx.status}`);
    t.check("idor.cancel_foreign_not_deleted", (await msgCount(B.token, bReq)) >= 0, "B's request vanished after A's cancel attempt");
    const rp = await req("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: bReq, message: "intruder" } });
    t.check("idor.reply_foreign_denied", rp.status === 403 || rp.status === 404, `status=${rp.status}`);
    t.check("idor.reply_foreign_not_appended", (await msgCount(B.token, bReq)) === before, "intruder message landed in B's thread");
    const ps = await req("/api/ai/patient-summary", { method: "POST", token: A.token, body: { patientId: patId } });
    t.check("idor.patient_summary_foreign_denied", ps.status === 403, `patient A got status ${ps.status} for POST /api/ai/patient-summary (doctor/admin only; expected 403)`);
    const psAnon = await req("/api/ai/patient-summary", { method: "POST", body: { patientId: patId } });
    t.check("idor.patient_summary_anonymous_denied", psAnon.status === 401, `anonymous patient-summary -> ${psAnon.status} (expected 401)`);
    const asess = await req("/api/patient/sessions", { token: A.token });
    t.check("idor.sessions_excludes_other_patients", asess.status === 200 && !/B-SECRET-DX/.test(asess.text), "A sees B's saved session");
    const forge = await req("/api/patient/sessions", { method: "POST", token: A.token, body: { user_id: B.id, primary_diagnosis: "FORGED-FOR-B", full_report: {}, symptoms: "x" } });   // full_report is NOT NULL on a real DB
    const bAfter = await req("/api/patient/sessions", { token: B.token });
    t.check("idor.session_create_ignores_body_user_id", forge.status < 300 && !/FORGED-FOR-B/.test(bAfter.text), `forged session landed on B (status ${forge.status})`);
    const pp = await req("/api/patient/profile", { method: "PUT", token: A.token, body: { id: B.id, role: "admin", full_name: "A-Renamed" } });
    const meA = await req("/api/auth/me", { token: A.token });
    const bProf = await req("/api/patient/profile", { token: B.token });
    t.check("idor.profile_put_no_mass_assignment", pp.status === 200 && meA.json?.user?.role === "patient" && bProf.json?.profile?.full_name !== "A-Renamed", `role=${meA.json?.user?.role} bName=${bProf.json?.profile?.full_name}`);
    const fences = [
      ["patient_cannot_treatment_plan", { path: "/api/doctor/treatment-plan", method: "POST", token: A.token, body: { requestId: bReq, plan: { a: 1 } } }],
      ["patient_cannot_flag", { path: "/api/doctor/flag", method: "POST", token: A.token, body: { requestId: bReq, flag: "critical" } }],
      ["patient_cannot_doctor_reply", { path: "/api/doctor/reply", method: "POST", token: A.token, body: { requestId: bReq, message: "x", targetTable: "inquiries" } }],
      ["patient_cannot_doctor_inbox", { path: "/api/doctor/requests", token: A.token }],
      ["anon_cannot_treatment_plan", { path: "/api/doctor/treatment-plan", method: "POST", body: { requestId: bReq, plan: { a: 1 } } }],
      ["anon_cannot_doctor_reply", { path: "/api/doctor/reply", method: "POST", body: { requestId: bReq, message: "x" } }],
      ["admin_not_a_doctor_for_reply", { path: "/api/doctor/reply", method: "POST", token: admin.token, body: { requestId: bReq, message: "x", targetTable: "inquiries" } }],
      ["doctor_cannot_read_logs", { path: "/api/logs", token: D1.token }],
      ["patient_cannot_generate_inquiry", { path: "/api/doctor/generate-inquiry", method: "POST", token: A.token, body: { symptoms: "x" } }],
      ["anon_cannot_generate_inquiry", { path: "/api/doctor/generate-inquiry", method: "POST", body: { symptoms: "x" } }],
      ["patient_cannot_patient_summary", { path: "/api/ai/patient-summary", method: "POST", token: A.token, body: { patientId: "x" } }],
      ["patient_cannot_test_api_key", { path: "/api/admin/test-api-key", method: "POST", token: A.token, body: { useSavedKey: true } }],
      ["doctor_cannot_db_status", { path: "/api/admin/db-status", token: D1.token }],
      ["patient_cannot_system_health", { path: "/api/admin/system-health", token: A.token }],
      ["doctor_cannot_put_settings", { path: "/api/admin/settings", method: "PUT", token: D1.token, body: { x: 1 } }],
      ["patient_cannot_put_settings", { path: "/api/admin/settings", method: "PUT", token: A.token, body: { x: 1 } }],
    ];
    for (const [label, o] of fences) { const { path, ...rest } = o; const r = await req(path, rest); t.check(`fence.${label}`, r.status === 401 || r.status === 403, `status=${r.status}`); }
    t.check("idor.flag_unchanged_after_fence_tests", true === !(await dbTable("inquiries"))?.some((r) => r.id === bReq && r.flag === "critical"), "patient flagged B's request critical");
    const d3in = await req("/api/doctor/requests", { token: D3.token });
    t.check("idor.unapproved_doctor_cannot_read_inbox", d3in.status === 403 && !/B-PRIVATE-PATTERN/.test(d3in.text), `unapproved self-registered doctor GET /api/doctor/requests -> ${d3in.status} (want 403: the inbox lists every patient's record)`);
    const d2 = await req("/api/doctor/requests", { token: D2.token });
    // OWNER DECISION PENDING (kept visible as a skip, not silently dropped): the doctor inbox is deliberately a MASTER inbox
    // (every APPROVED doctor sees every patient's request; flow_e2e/journey rely on it). Admin approval is now in place (see
    // idor.unapproved_doctor_cannot_read_inbox), so a self-registered doctor can no longer read anything; flip this skip to
    // t.check(...) only if the owner also wants per-doctor filtering of approved doctors. Evidence this run: D2 sees B's request = ${(d2.json?.requests || []).some((x) => x.id === bReq)}.
    t.skip("idor.selfregistered_doctor_sees_only_own_routed_requests", `DESIGN DECISION: master inbox for approved doctors (handlers_doctor.go master inbox); unapproved doctors are fenced (admin approval); D2 can read B's request: ${(d2.json?.requests || []).some((x) => x.id === bReq)}`);

    /* ================= 4. PostgREST filter injection ================= */
    const INJ = ["x&user_id=neq.zzz", "x%26user_id=neq.zzz", "x&or=(id.neq.0)", "neq.zzz", "not.eq.0", "in.(a,b)", "x,y", "x)", "*", "x#", "x\nid=neq.0", "x&select=*&limit=999", "x&id=neq.0"];
    const okBogus = (s) => s === 400 || s === 404 || s === 403 || s === 401;
    const injCases = [
      ["patient_reply", (v) => req("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: v, message: "m" } }), () => aReq],
      ["patient_cancel", (v) => req("/api/patient/requests/cancel", { method: "POST", token: A.token, body: { id: v } }), null],
      ["doctor_reply", (v) => req("/api/doctor/reply", { method: "POST", token: D1.token, body: { requestId: v, message: "m", targetTable: "inquiries" } }), () => aReq],
      ["doctor_flag", (v) => req("/api/doctor/flag", { method: "POST", token: D1.token, body: { requestId: v, flag: "watch" } }), () => aReq],
      ["treatment_plan", (v) => req("/api/doctor/treatment-plan", { method: "POST", token: D1.token, body: { requestId: v, plan: { a: 1 } } }), () => aReq],
      ["patient_summary", (v) => req("/api/ai/patient-summary", { method: "POST", token: D1.token, body: { patientId: v } }), null],
      ["migrate_guest", (v) => req("/api/migrate-guest-session", { method: "POST", token: A.token, body: { sessionToken: v } }), null],
    ];
    for (const [name, call] of injCases) {
      const bad = [];
      for (const v of INJ) { const r = await call(v); if (!okBogus(r.status)) bad.push(`${JSON.stringify(v)}->${r.status}`); }
      t.check(`inject.${name}_bogus_id_rejected`, bad.length === 0, `non-4xx for malformed id: ${bad.slice(0, 4).join(" ")}`);
    }
    // own valid id + injected suffix must not be honoured (ids are not validated before concatenation)
    for (const [name, call, own] of injCases.filter((c) => c[2])) {
      const bad = [];
      for (const sfx of ["&user_id=neq.zzz", "&id=neq.0", "&select=*"]) { const r = await call(own() + sfx); if (!(r.status === 400 || r.status === 404)) bad.push(`${sfx}->${r.status}`); }
      t.check(`inject.${name}_own_id_with_suffix_rejected`, bad.length === 0, `id with PostgREST metacharacters honoured (no uuid validation): ${bad.join(" ")}`);
    }
    const lg = await req("/api/logs?level=" + encodeURIComponent("info&or=(id.neq.0)"), { token: admin.token });
    t.check("inject.logs_level_param_not_interpreted", lg.status < 500, `?level=info&or=(...) reached the DB as a separate filter -> ${lg.status} (handlers_admin.go level concat)`);
    const mt = await req("/api/monitoring/metrics?type=" + encodeURIComponent("x&or=(id.neq.0)"), { token: admin.token });
    t.check("inject.metrics_type_param_not_interpreted", mt.status < 500, `?type=x&or=... -> ${mt.status}`);
    const vi = await req("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: "x&user_id=neq.zzz", doctorName: "n", patientData: {}, reportData: {} } });
    t.check("inject.verification_doctor_id_validated", vi.status === 400, `doctorId with '&' accepted -> ${vi.status}`);

    /* ================= 5. body hardening ================= */
    const jsonTargets = [
      ["login", "/api/auth/login", null], ["signup", "/api/auth/signup", null], ["logs", "/api/logs", null], ["guest", "/api/guest/sessions", null],
      ["verification", "/api/verification-request", A.token], ["chat", "/api/chat", null], ["syshealth", "/api/admin/system-health", null],
      ["patient_reply", "/api/patient/reply", A.token], ["profile", "/api/patient/profile", A.token],
    ];
    const badJson = [];
    for (const [n, p, tok] of jsonTargets) {
      for (const raw of ["{not json", "", "[]garbage", "null"]) {
        const r = await req(p, { method: p.includes("profile") ? "PUT" : "POST", raw: true, body: raw, token: tok });
        if (!(r.status === 400 || r.status === 401)) badJson.push(`${n}:${JSON.stringify(raw)}->${r.status}`);
      }
    }
    t.check("body.invalid_json_is_400", badJson.length === 0, badJson.slice(0, 6).join(" "));
    const ct = await req("/api/auth/login", { method: "POST", raw: true, body: "{not json" });
    t.check("body.error_content_type_json", /json/i.test(ct.headers.get("content-type") || ""), `invalid-JSON error served as ${ct.headers.get("content-type")} (http.Error sets text/plain; handlers_auth.go:15)`);

    const confuse = [];
    const vals = [{}, [], 123, true, null, { a: 1 }];
    for (const v of vals) {
      for (const f of ["email", "password"]) { const b = { email: "patient@sihat.com", password: PW }; b[f] = v; const r = await req("/api/auth/login", { method: "POST", body: b }); if (!(r.status === 400 || r.status === 401)) confuse.push(`login.${f}=${JSON.stringify(v)}->${r.status}`); }
      const s = await req("/api/auth/signup", { method: "POST", body: { email: v, password: PW } }); if (!(s.status === 400)) confuse.push(`signup.email=${JSON.stringify(v)}->${s.status}`);
      const rr = await req("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: v, message: v } }); if (!(rr.status === 400)) confuse.push(`reply=${JSON.stringify(v)}->${rr.status}`);
      const ch = await req("/api/chat", { method: "POST", body: { messages: v } }); if (ch.status >= 500) confuse.push(`chat.messages=${JSON.stringify(v)}->${ch.status}`);
      const lo = await req("/api/logs", { method: "POST", body: { level: v, category: v, message: v } }); if (!(lo.status === 400)) confuse.push(`logs=${JSON.stringify(v)}->${lo.status}`);
    }
    t.check("body.type_confusion_is_4xx_not_5xx", confuse.length === 0, confuse.slice(0, 6).join(" "));
    const ageObj = await req("/api/patient/profile", { method: "PUT", token: A.token, body: { age: { $gt: 0 }, height: ["x"] } });
    t.check("body.profile_numeric_fields_validated", is4(ageObj.status), `profile PUT age:{...} -> ${ageObj.status} (stored as-is; handlers_doctor.go:1083)`);

    const big2 = "A".repeat(2 * 1024 * 1024);
    for (const [n, p, b] of [["login", "/api/auth/login", { email: "patient@sihat.com", password: big2 }], ["logs", "/api/logs", { level: "info", category: "c", message: big2 }], ["chat", "/api/chat", { messages: [{ role: "user", content: big2 }] }], ["guest", "/api/guest/sessions", { notes: big2 }]]) {
      const r = await req(p, { method: "POST", body: b, timeout: 25000 });
      t.check(`body.2mb_${n}_no_5xx_no_hang`, !r.timeout && r.status < 500 && r.status !== 0, `status=${r.status} ms=${r.ms} ${r.err || ""}`);
    }
    const big20 = JSON.stringify({ level: "info", category: "c", message: "B".repeat(20 * 1024 * 1024) });
    for (const [n, p] of [["logs", "/api/logs"], ["guest", "/api/guest/sessions"], ["verification", "/api/verification-request"], ["login", "/api/auth/login"], ["chat", "/api/chat"], ["syshealth", "/api/admin/system-health"]]) {
      const r = await req(p, { method: "POST", raw: true, body: big20, timeout: 30000 });
      t.check(`body.20mb_${n}_rejected`, !r.timeout && (r.status === 413 || r.status === 400 || (r.status === 0 && !r.timeout)), `20MB body -> status ${r.status} ${r.err || ""} (withBodyLimit caps bodies at 2MB/30MB: expected 413)`);
    }

    const rt = A.token;
    const emoji = "héllo 你好 😀🧑‍⚕️ ‮RTL مرحبا";
    const er = await req("/api/patient/reply", { method: "POST", token: rt, body: { requestId: aReq, message: emoji } });
    const aMsgs = (await req("/api/patient/requests", { token: rt })).json?.requests?.find((x) => x.id === aReq)?.diagnosis_report?.messages || [];
    t.check("body.unicode_roundtrips", er.status === 200 && aMsgs.some((m) => m.content === emoji), `status=${er.status}`);
    const nul = await req("/api/patient/reply", { method: "POST", token: rt, raw: true, body: '{"requestId":"' + aReq + '","message":"a\\u0000b"}' });
    t.check("body.nul_byte_is_4xx_or_handled", nul.status < 500, `NUL in message -> ${nul.status}`);
    const nulInId = await req("/api/patient/reply", { method: "POST", token: rt, raw: true, body: '{"requestId":"a\\u0000b","message":"m"}' });
    t.check("body.nul_in_id_is_4xx", is4(nulInId.status), `NUL in requestId -> ${nulInId.status}`);
    const longMsg = await req("/api/patient/reply", { method: "POST", token: rt, body: { requestId: aReq, message: "L".repeat(1024 * 1024) } });
    t.check("body.message_length_capped", is4(longMsg.status), `1MB patient message accepted -> ${longMsg.status} (no length cap)`);
    const longName = await req("/api/auth/signup", { method: "POST", body: { email: `sec-long-${u}@example.com`, password: PW, name: "N".repeat(100000) } });
    t.check("body.signup_name_length_capped", is4(longName.status), `100k-char name accepted -> ${longName.status} ${longName.err || ""}`);
    const ctText = await req("/api/auth/login", { method: "POST", raw: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ email: "patient@sihat.com", password: PW }) });
    t.check("body.login_requires_json_content_type", ctText.status === 415 || ctText.status === 400, `login with Content-Type: text/plain -> ${ctText.status} (cross-site simple-request login CSRF)`);
    const ctForm = await req("/api/patient/reply", { method: "POST", raw: true, token: rt, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ requestId: aReq, message: "csrf" }) });
    t.check("body.state_change_requires_json_content_type", ctForm.status === 415 || ctForm.status === 400, `authed POST text/plain -> ${ctForm.status}`);
    const meth = [];
    for (const [m, p] of [["GET", "/api/auth/login"], ["DELETE", "/api/patient/reply"], ["PUT", "/api/auth/signup"], ["PATCH", "/api/logs"]]) { const r = await req(p, { method: m }); if (!(r.status === 405 || r.status === 404 || r.status === 501)) meth.push(`${m} ${p}->${r.status}`); }
    t.check("body.wrong_method_405", meth.length === 0, meth.join(" "));
    const trav = [];
    for (const p of ["/static/..%2f..%2fgo.mod", "/static/..%5c..%5cmain.go", "/static/%2e%2e/main.go", "/.env", "/.git/config", "/go.mod", "/main.go", "/static/../../.env", "/internal/server/auth.go"]) { const r = await req(p); if (r.status === 200 && /^module |package main|SUPABASE|\[core\]/.test(r.text)) trav.push(p); }
    t.check("body.no_source_or_env_served", trav.length === 0, `served: ${trav.join(", ")}`);
    const hdr = await req("/api/doctors", { headers: { Origin: "https://evil.example" } });
    t.check("body.no_wildcard_cors_on_data_api", !hdr.headers.get("access-control-allow-origin"), `ACAO=${hdr.headers.get("access-control-allow-origin")}`);
    const sh = await req("/login");
    t.check("body.security_headers", sh.headers.get("x-content-type-options") === "nosniff" && !!sh.headers.get("x-frame-options"), "missing nosniff/X-Frame-Options on /login");

    /* ================= 6. auth hardening ================= */
    const li = await login("patient@sihat.com");
    const sc = li.r.setCookie;
    t.check("cookie.login_ok", li.r.status === 200 && !!li.token, `status=${li.r.status}`);
    t.check("cookie.httponly", /;\s*HttpOnly/i.test(sc), sc);
    t.check("cookie.samesite", /;\s*SameSite=(Lax|Strict)/i.test(sc), sc);
    t.check("cookie.path_root", /;\s*Path=\//i.test(sc), sc);
    t.check("cookie.has_lifetime", /Max-Age=[1-9]/i.test(sc), sc);
    const lis = await login("patient@sihat.com", PW, { headers: { "X-Forwarded-Proto": "https" } });
    t.check("cookie.secure_when_https", /;\s*Secure/i.test(lis.r.setCookie), `X-Forwarded-Proto: https login cookie lacks Secure (handlers_auth.go:36 keys on APP_ENV only): ${lis.r.setCookie.replace(/=[^;]+/, "=<tok>")}`);
    // logout REVOKES the token it carries, so it is exercised on a throwaway account: `li.token` is reused below as the valid control
    const loUser = await signup(`sec-lo-${u}@example.com`, "Sec Logout", "patient");
    const lo = await req("/api/auth/logout", { method: "POST", cookie: loUser.token });
    t.check("cookie.logout_revokes_token", !!loUser.token && (await req("/api/auth/me", { token: loUser.token })).status === 401, "a token stays valid after POST /api/auth/logout (copied access tokens must die with the session)");
    t.check("cookie.logout_expires", /sb-access-token=;/i.test(lo.setCookie) && /Max-Age=0|Max-Age=-1|Expires=/i.test(lo.setCookie) && /Path=\//i.test(lo.setCookie), lo.setCookie);
    const leakBodies = [li.r.text, (await req("/api/auth/me", { token: li.token })).text, (await req("/api/patient/profile", { token: li.token })).text, A.r.text];
    t.check("auth.no_password_or_tokens_in_bodies", leakBodies.every((b) => !/password|encrypted|"access_token"|refresh_token|"hash"/i.test(b)) && !leakBodies.some((b) => b.includes(li.token)), "credential material in a response body");

    for (const role of ["admin", "developer", "ADMIN", " admin", "Doctor", "superuser"]) {
      const e = `sec-esc-${role.trim().toLowerCase()}-${u}-${Math.floor(Math.random() * 1e6)}@example.com`;
      const s = await signup(e, "Esc", role);
      const me = await req("/api/auth/me", { token: s.token });
      const adm = await req("/api/admin/system-health", { token: s.token });
      const prof = (await dbTable("profiles"))?.find((p) => p.id === s.id);
      const okRole = ["patient", "doctor"].includes(me.json?.user?.role) && (role !== "admin" && role !== "developer" || me.json?.user?.role === "patient");
      t.check(`signup.role_${role.trim().toLowerCase()}_${role === role.toLowerCase() ? "" : "var_"}no_escalation`, !!s.token && okRole && adm.status === 403 && (!prof || ["patient", "doctor"].includes(prof.role)), `signup role=${JSON.stringify(role)} -> status ${s.r.status}, /me role=${me.json?.user?.role}, system-health=${adm.status}, profile.role=${prof?.role}`);
    }
    const spf = await req("/api/auth/signup", { method: "POST", body: { email: `sec-priv-${u}@example.com`, password: PW, role: "patient", is_approved: true, app_metadata: { role: "admin" }, id: "00000000-0000-0000-0000-000000000000" } });
    const spfMe = await req("/api/auth/me", { token: tokOf(spf.setCookie) });
    t.check("signup.extra_fields_ignored", spf.status === 200 && spfMe.json?.user?.role === "patient" && spf.json?.user?.id !== "00000000-0000-0000-0000-000000000000", `role=${spfMe.json?.user?.role}`);
    const roleArr = await req("/api/auth/signup", { method: "POST", body: { email: `sec-ra-${u}@example.com`, password: PW, role: ["admin"] } });
    t.check("signup.role_array_is_400", roleArr.status === 400, `status=${roleArr.status}`);

    const dupMail = `sec-Dup-${u}@Example.com`;
    const d1 = await signup(dupMail, "d", "patient");
    const d2s = await signup(dupMail, "d", "patient");
    const d3 = await signup(dupMail.toLowerCase(), "d", "patient");
    const d4 = await signup(dupMail.toUpperCase(), "d", "patient");
    t.check("signup.first_ok", d1.r.status === 200, `status=${d1.r.status}`);
    t.check("signup.duplicate_exact_4xx", is4(d2s.r.status), `status=${d2s.r.status}`);
    t.check("signup.email_case_normalised", is4(d3.r.status) && is4(d4.r.status), `lower=${d3.r.status} upper=${d4.r.status}`);
    const wk = [];
    for (const pw of ["abc", "1", "", "       "]) { const r = await req("/api/auth/signup", { method: "POST", body: { email: `sec-wk-${u}-${wk.length}-${Math.floor(Math.random() * 1e6)}@example.com`, password: pw } }); if (!is4(r.status)) wk.push(`${JSON.stringify(pw)}->${r.status}`); }
    t.check("signup.weak_password_rejected", wk.length === 0, wk.join(" "));
    const p7 = await req("/api/auth/signup", { method: "POST", body: { email: `sec-p7-${u}@example.com`, password: "abcd123" } });
    t.check("signup.min_length_matches_reset_policy", is4(p7.status), `7-char password accepted at signup (status ${p7.status}) although reset-password demands >=8 (handlers_auth.go:106)`);
    const badMail = [];
    for (const e of ["notanemail", "a@b", "@x.com", "a b@x.com", "x".repeat(400) + "@example.com"]) { const r = await req("/api/auth/signup", { method: "POST", body: { email: e, password: PW } }); if (!is4(r.status)) badMail.push(`${e.slice(0, 20)}->${r.status}`); }
    t.check("signup.invalid_email_rejected", badMail.length === 0, badMail.join(" "));
    const wrongPw = await login("patient@sihat.com", "nope-nope-1");
    const noUser = await login(`nobody-${u}@example.com`, "nope-nope-1");
    t.check("login.no_user_enumeration", wrongPw.r.status === 401 && noUser.r.status === 401 && wrongPw.r.text === noUser.r.text, `known=${wrongPw.r.status} ${wrongPw.r.text.trim()} unknown=${noUser.r.status} ${noUser.r.text.trim()}`);

    const good = li.token || (await login("patient@sihat.com")).token;
    const flip = good.slice(0, -1) + (good.endsWith("a") ? "b" : "a");
    const garbage = ["garbage", "a.b.c", "null", "undefined", good.slice(0, 20), flip, ""];
    const forged = "eyJhbGciOiJub25lIn0." + Buffer.from(JSON.stringify({ sub: admin.id, role: "authenticated", exp: 9999999999, user_metadata: { role: "admin" } })).toString("base64url") + ".";
    const expired = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({ sub: A.id, exp: 1000 })).toString("base64url") + ".sig";
    const badTok = [];
    for (const g of [...garbage.slice(0, 6), forged, expired]) for (const [p, via] of [["/api/auth/me", "bearer"], ["/api/admin/system-health", "bearer"], ["/api/auth/me", "cookie"]]) {
      const r = via === "bearer" ? await req(p, { token: g }) : await req(p, { cookie: g });
      if (r.status !== 401) badTok.push(`${via}:${g.slice(0, 12)}…${p}->${r.status}`);
    }
    t.check("token.tampered_forged_expired_all_401", badTok.length === 0, badTok.slice(0, 5).join(" "));
    t.check("token.valid_control_accepted", (await req("/api/auth/me", { token: good })).status === 200, "valid token rejected (negative checks above would be vacuous)");
    const prec1 = await req("/api/auth/me", { token: "garbage-bearer", cookie: good });
    t.check("token.bearer_takes_precedence_over_cookie", prec1.status === 401, `garbage Bearer + valid cookie -> ${prec1.status}`);
    const prec2 = await req("/api/auth/me", { token: A.token, cookie: B.token });
    t.check("token.bearer_over_cookie_identity", prec2.json?.user?.id === A.id, `identity=${prec2.json?.user?.id}`);
    const nobody = await req("/api/auth/me");
    t.check("token.anonymous_401", nobody.status === 401, `status=${nobody.status}`);
    const rst = await req("/api/auth/reset-password", { method: "POST", body: { access_token: "forged." + u, password: "newpassw0rd" } });
    t.check("reset.forged_access_token_rejected", is4(rst.status), `status=${rst.status}`);
    const rst2 = await req("/api/auth/reset-password", { method: "POST", body: { token_hash: "x&type=signup", password: "short" } });
    t.check("reset.short_password_400", rst2.status === 400, `status=${rst2.status}`);
    const fp = await req("/api/auth/forgot-password", { method: "POST", body: { email: { $ne: "" } } });
    t.check("forgot.object_email_400", fp.status === 400, `status=${fp.status}`);

    /* ================= 7. XSS reflection ================= */
    const XSS = `<script>alert('x')</script>"><img src=x onerror=alert(1)>`;
    const xs = await signup(`sec-xss-${u}@example.com`, XSS, "doctor", { specialty: XSS, bio: XSS });
    t.check("xss.setup_doctor_approved", await apprDoc(xs), "could not approve the XSS-payload doctor (directory only lists approved doctors)");
    const dir2 = await req("/api/doctors");
    const xr = (dir2.json?.doctors || []).find((d) => d.id === xs.id);
    t.check("xss.doctor_fields_stored_verbatim_as_json", !!xr && xr.full_name === XSS && xr.bio === XSS && /^application\/json/i.test(dir2.headers.get("content-type") || ""), `row=${JSON.stringify(xr)?.slice(0, 120)} ct=${dir2.headers.get("content-type")}`);
    t.check("xss.api_json_nosniff", dir2.headers.get("x-content-type-options") === "nosniff", "missing nosniff on JSON API");
    const xrq = await req("/api/verification-request", { method: "POST", token: A.token, body: { userId: A.id, doctorId: D1.id, doctorName: XSS, patientData: { name: XSS }, reportData: { diagnosis: XSS } } });
    t.check("xss.report_fields_accepted_as_data", xrq.status === 200 && /^application\/json/i.test(xrq.headers.get("content-type") || ""), `status=${xrq.status}`);
    const rd = { diagnosis: { primary_pattern: XSS }, constitution: { type: XSS }, recommendations: { food_therapy: { beneficial: [XSS, "你好".repeat(20)], avoid: [XSS] }, lifestyle: [XSS] } };
    const ig = await req("/api/generate-infographic", { method: "POST", body: { reportData: rd, patientInfo: { name: XSS }, style: XSS } });
    const html = ig.json?.html || "";
    t.check("xss.infographic_present", ig.status === 200 && html.length > 200, `status=${ig.status}`);
    t.check("xss.infographic_html_escaped", html.includes("&lt;script&gt;") && !/<script|<img/i.test(html), "raw <script>/<img onerror> in infographic HTML (or payload missing)");
    const svgUrl = ig.json?.imageUrl || "";
    let svg = "", utf8ok = true;
    if (svgUrl.startsWith("data:image/svg+xml;base64,")) { const buf = Buffer.from(svgUrl.split(",")[1], "base64"); svg = buf.toString("utf8"); try { new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { utf8ok = false; } }
    t.check("xss.infographic_svg_escaped", svg.length > 100 && !/<script|<img/i.test(svg), "raw script/img in SVG data URL (or no SVG returned)");
    t.check("xss.infographic_svg_valid_utf8", utf8ok, "SVG truncates multibyte labels mid-rune (label[:35] / diag[:50] byte slicing in handlers_summaries.go) -> invalid UTF-8 / broken XML");
    const rep = await req("/patient/report/" + encodeURIComponent("<img src=x onerror=alert(1)>"), { cookie: good });
    t.check("xss.report_page_path_not_reflected", rep.status < 500 && !/onerror=alert\(1\)/.test(rep.text), `status=${rep.status}`);
    const nf = await req("/<script>alert(1)</script>");
    t.check("xss.404_not_reflected", !/<script>alert/.test(nf.text), nf.text.slice(0, 60));
    for (const p of ["/patient", "/doctor", "/admin", "/patient/report/abc"]) {
      const r = await req(p);
      t.check(`pages.anon_redirects_${p.replace(/\W+/g, "_").replace(/^_|_$/g, "")}`, r.status === 302 && /\/login/.test(r.headers.get("location") || "") && !/<html/i.test(r.text), `status=${r.status} loc=${r.headers.get("location")}`);
    }
    const pa = await req("/admin", { cookie: A.token });
    t.check("pages.patient_bounced_from_admin", pa.status === 302 && !/Admin Console/.test(pa.text), `status=${pa.status}`);

    /* ================= 8. error leakage ================= */
    const hooks = ["__FAIL_500__", "__FAIL_429__", "__EMPTY__", "__GARBAGE_JSON__"];
    for (const h of hooks) {
      await req("/api/chat", { method: "POST", body: { messages: [{ role: "user", content: `hello ${h}` }], language: "en" } });
      await req("/api/consult", { method: "POST", body: { data: { basic_info: { name: "x", symptoms: [h] }, wen_inquiry: h }, language: "en" } });
      await req("/api/report-chat", { method: "POST", body: { messages: [{ role: "user", content: h }], reportData: {}, language: "en" } });
      await req("/api/western-chat", { method: "POST", body: { messages: [{ role: "user", content: h }], language: "en" } });
      await req("/api/heart-companion", { method: "POST", body: { messages: [{ role: "user", content: h }], language: "en" } });
      await req("/api/ask-dietary-advice", { method: "POST", body: { question: h, reportData: {}, language: "en" } });
    }
    await req("/api/auth/signup", { method: "POST", body: { email: dupMail, password: PW } });
    await req("/api/admin/db-status", { token: admin.token });
    const probeHosts = [t.dbBase, t.aiBase].filter(Boolean).map((b) => { try { return new URL(b).host; } catch { return null; } }).filter(Boolean);
    const leaks = [];
    for (const r of seen) {
      if (/\/api\/admin\/settings/.test(r.path)) continue; // PUT echoes the probe values we sent ourselves
      if (r.status < 400 && r.status !== 0 && !/AIza|sbp_/.test(r.text)) continue;
      for (const re of LEAK) if (re.test(r.text)) leaks.push(`${r.method} ${r.path.slice(0, 40)} [${r.status}] ~ ${re}`);
      for (const h of probeHosts) if (r.text.includes(h)) leaks.push(`${r.method} ${r.path.slice(0, 40)} [${r.status}] upstream host ${h}`);
    }
    t.check("leak.no_internals_in_error_bodies", leaks.length === 0, `${leaks.length} leak(s): ${[...new Set(leaks)].slice(0, 5).join(" | ")}`);
    const all2xx = seen.filter((r) => r.status >= 200 && r.status < 300 && !/\/api\/admin\/settings$/.test(r.path)).filter((r) => /AIza[0-9A-Za-z_-]{20,}|sbp_[A-Za-z0-9]{10,}|service_role/.test(r.text));
    t.check("leak.no_keys_in_success_bodies", all2xx.length === 0, all2xx.slice(0, 3).map((r) => r.path).join(", "));
    // static audit: upstream error text echoed to clients
    const echo = [];
    for (const f of readdirSync(SRV).filter((x) => x.endsWith(".go") && !x.endsWith("_test.go"))) {
      readFileSync(join(SRV, f), "utf8").split(/\r?\n/).forEach((ln, i) => { if (/err2?\.Error\(\)/.test(ln) && /JSONError\(|"error":|"message":/.test(ln)) echo.push(`${f}:${i + 1}`); });
    }
    t.check("leak.no_err_Error_echoed_to_clients", echo.length === 0, `err.Error() returned to clients at ${echo.join(", ")}`);
  },
};
