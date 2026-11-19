/**
 * hunt_patient — defects found by the "patient" bug hunt (patient + guest journey: wizard, report, guest->register
 * migration, history, profile, consultations, notifications, dietary Q&A).
 * Every check asserts the CORRECT behaviour and is RED today; it goes green when the defect is fixed.
 * Ids patient-NN are the hunt report ids (see each check label).
 *
 *   ACI_PORT_OFFSET=4002 node aci.mjs test --suite=hunt_patient --db=sqlite --ai=fake
 *
 * Two kinds of check:
 *   - API checks (the bulk): plain HTTP against the stack.
 *   - "vm" checks (patient-01/02/03/06/16/17/18/20): the real static/js/*.js file is executed in a node:vm sandbox with a tiny
 *     DOM/localStorage/fetch stub, so a browser-only defect is pinned without Playwright. They read the shipped file from
 *     disk (not from the stack) and are deterministic. patient-19 is a source-level check (stated in its label).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const appFile = (rel) => { try { return readFileSync(join(here, "..", "..", rel), "utf8"); } catch { return null; } };
const flush = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };
const is4 = (s) => s >= 400 && s < 500;

/** Minimal browser stub: enough of document/window/localStorage/fetch to run one of the app's classic scripts. */
function sandbox({ ls = {}, fetchImpl, ids = {}, qsa = {}, lang } = {}) {
  const els = new Map();
  const mkEl = (id) => {
    const cls = new Set(ids[id]?.classes || []);
    const listeners = {};
    const kids = new Map();
    const el = {
      id, children: [], dataset: {}, style: {}, value: ids[id]?.value ?? "", textContent: "", innerHTML: "", disabled: false, className: "", src: "",
      scrollTop: 0, scrollHeight: 0, files: [],
      classList: {
        add: (...c) => c.forEach((x) => cls.add(x)), remove: (...c) => c.forEach((x) => cls.delete(x)), contains: (c) => cls.has(c),
        toggle: (c, f) => { const on = f === undefined ? !cls.has(c) : !!f; if (on) cls.add(c); else cls.delete(c); return on; },
      },
      addEventListener(ev, fn) { (listeners[ev] ||= []).push(fn); },
      appendChild(c) { el.children.push(c); return c; }, insertBefore(c) { el.children.push(c); return c; },
      querySelector(sel) { if (!kids.has(sel)) kids.set(sel, mkEl(id + ">" + sel)); return kids.get(sel); },
      querySelectorAll() { return []; }, getAttribute() { return null; }, setAttribute() {}, closest() { return null; }, focus() {}, click() {}, scrollIntoView() {},
      _listeners: listeners, _cls: cls,
    };
    return el;
  };
  const byId = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
  const store = new Map(Object.entries(ls));
  const docListeners = {};
  const calls = [];
  const sb = {
    console, Promise, JSON, Math, Date, Array, Object, String, Number, RegExp, Set, Map, Error, TextDecoder, encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN, URL,
    setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {}, clearTimeout: () => {}, requestAnimationFrame: () => 0,
    confirm: () => true, alert: () => {},
    navigator: {}, location: { href: "", hash: "", pathname: "/" },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } },
    document: {
      readyState: "complete", cookie: "", documentElement: { setAttribute() {} },
      getElementById: byId,
      createElement: () => mkEl("created"),
      querySelectorAll: (sel) => qsa[sel] || [], querySelector: (sel) => qsa[sel]?.[0] || mkEl(sel),
      addEventListener: (ev, fn) => { (docListeners[ev] ||= []).push(fn); },
      body: mkEl("body"),
    },
    fetch: (url, opts) => { calls.push({ url: String(url), opts }); return fetchImpl ? fetchImpl(String(url), opts) : Promise.reject(new Error("no fetch stub")); },
  };
  if (lang) sb.tcmLang = { get: () => lang };
  sb.window = sb;
  vm.createContext(sb);
  return { sb, els, byId, store, calls, docListeners, run(src, name) { vm.runInContext(src, sb, { filename: name }); } };
}
const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
const WIZ_STATE = (over = {}) => JSON.stringify({ currentStep: 0, basicInfo: { name: "", age: "", gender: "", height: "", weight: "", symptoms: [] }, chatHistory: [], inquirySummary: "", tongueObs: "", tongueImageDataURL: "", faceObs: "", faceImageDataURL: "", audioObs: "", audioDataURL: "", bpm: "", pulseQualities: [], report: null, ...over });

export default {
  name: "hunt_patient",
  doc: "bug hunt (patient/guest journey): wizard refresh + guest-save + guest-token loss, concurrent migration + migrated date, history order, profile validation/clearing, 5xx on bad input (sessions, notifications), sync duplicates, AI-endpoint rate limits/model param, dietary Q&A, string-shaped reports",
  needs: "stack",
  mutating: true,
  costly: false,
  async run(t) {
    const H = () => ({ "X-Forwarded-For": t.ip() });
    const call = (path, { method = "GET", body, token, raw, headers } = {}) => t.api(path, { method, body, token, raw, headers: { ...H(), ...(headers || {}) } });
    const u = t.uniq();
    const mkPatient = async (tag) => t.signup(`hunt-patient-${tag}-${u}@example.com`, `Hunt ${tag}`, "patient", {}, t.ip());
    const rep = (n = "Qi deficiency") => ({ diagnosis: { primary_pattern: n }, constitution: { type: n }, analysis: { summary: "s" }, recommendations: { lifestyle: ["walk"] } });

    const A = await mkPatient("a");
    if (!A.ok) { t.check("setup.patient_signup", false, `signup failed: ${A.raw.status} ${A.raw.text.slice(0, 100)}`); return; }

    /* ---------- patient-01: refreshing the wizard on the report step leaves an endless "Generating…" spinner ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (!wizSrc) t.check("patient-01.fixture", false, "static/js/wizard.js unreadable");
      else {
        const report = { constitution: { type: "REFRESH-MARKER-QI", description: "d" }, diagnosis: { primary_pattern: "P" }, analysis: { summary: "s" } };
        const env = sandbox({ ls: { "tcm-wizard-state": WIZ_STATE({ currentStep: 7, basicInfo: { name: "T", age: "30", gender: "", height: "", weight: "", symptoms: [] }, report }) }, fetchImpl: () => Promise.reject(new Error("offline")) });
        env.run(wizSrc, "wizard.js");
        await flush();
        const shown = env.byId("rpt-constitution-type").textContent;
        t.check("patient-01.refresh_on_report_step_renders_the_saved_report", String(shown).includes("REFRESH-MARKER-QI"),
          `wizard state {currentStep:7, report:{…}} in localStorage, page reloaded: #rpt-constitution-type="${shown}", #report-content hidden=${env.byId("report-content")._cls.has("hidden")}, fetch calls=${env.calls.length}. renderStep(7) only calls generateReport() when !state.report and never renderReport(state.report), so the user sees the loading card forever (screenshot: "Generating your personalised TCM report…" static); Back→Next does the same; only Reset recovers`);
      }
    }

    /* ---------- patient-02: guest "Save" says "Report saved!" when the save failed ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (wizSrc) {
        const env = sandbox({ ls: { "tcm-wizard-state": WIZ_STATE({ currentStep: 7, report: rep("G") }) }, fetchImpl: () => json(500, { error: "failed to save guest session" }) });
        env.run(wizSrc, "wizard.js");
        env.sb.wizardSaveSession();
        await flush();
        const msg = env.byId("rpt-save-status").textContent;
        t.check("patient-02.guest_save_failure_is_not_reported_as_saved", !/saved/i.test(msg) || /not|fail|could/i.test(msg),
          `POST /api/guest/sessions -> 500; #rpt-save-status="${msg}" and the page redirects to /login#signup (wizard.js wizardSaveSession: .then(r=>r.json()) never checks r.ok). The guest then registers believing the report is kept; tcm-guest-token=${env.store.get("tcm-guest-token") ?? "none"}, so nothing is ever migrated`);
      }
    }

    /* ---------- patient-03: the guest token is dropped even when migration FAILED, and a 2nd guest save overwrites the 1st token ---------- */
    {
      const authSrc = appFile("static/js/auth.js");
      const wizSrc = appFile("static/js/wizard.js");
      if (authSrc) {
        const swallow = () => {}; // auth.js has no .catch(): the browser logs it, node would exit on it
        process.on("unhandledRejection", swallow);
        for (const [label, migrate] of [["http_500", () => json(500, { error: "failed to migrate session" })], ["network_error", () => Promise.reject(new Error("offline"))]]) {
          const env = sandbox({
            ls: { "tcm-guest-token": "guest-token-xyz" }, ids: { "login-email": { value: "patient@sihat.com" }, "login-password": { value: "password123" } },
            fetchImpl: (url) => (url.includes("/api/auth/login") ? json(200, { success: true, role: "patient", user: { id: "u1", email: "patient@sihat.com", role: "patient" } }) : migrate()),
          });
          env.run(authSrc, "auth.js");
          env.sb.authLogin();
          await flush(20);
          t.check(`patient-03.failed_migration_(${label})_keeps_the_guest_token_for_retry`, env.store.get("tcm-guest-token") === "guest-token-xyz",
            `login ok, POST /api/migrate-guest-session failed (${label}); tcm-guest-token is now ${JSON.stringify(env.store.get("tcm-guest-token") ?? null)} (auth.js afterAuth removes it in .finally() regardless of the outcome, so the guest report is orphaned forever)`);
        }
        process.off("unhandledRejection", swallow);
      }
      if (wizSrc) {
        let n = 0;
        const env = sandbox({ ls: { "tcm-wizard-state": WIZ_STATE({ currentStep: 7, report: rep("G") }) }, fetchImpl: () => json(201, { success: true, session_token: "tok-" + ++n }) });
        env.run(wizSrc, "wizard.js");
        env.sb.wizardSaveSession(); await flush();
        env.sb.wizardSaveSession(); await flush();
        const all = [...env.store.values()].join("|");
        t.check("patient-03.second_guest_save_does_not_orphan_the_first_report", all.includes("tok-1") && all.includes("tok-2"),
          `two guest saves returned tok-1 and tok-2; localStorage keeps only: ${JSON.stringify([...env.store.entries()].filter(([k]) => /guest/i.test(k)))} (single 'tcm-guest-token' key is overwritten; the first saved report can never be migrated)`);
      }
    }

    /* ---------- patient-04: a guest token can be claimed more than once concurrently (select-then-insert, no atomic claim) ---------- */
    {
      const P = await mkPatient("mig");
      let worst = null; // the round with the most copies
      for (let round = 0; round < 4; round++) {
        const mark = `mig-${u}-${round}`;
        const g = await call("/api/guest/sessions", { method: "POST", body: { full_report: rep("M"), symptoms: mark } });
        const tok = g.json?.session_token;
        if (!tok) { t.check("patient-04.fixture", false, `guest save failed ${g.status}`); worst = null; break; }
        const rs = await Promise.all(Array.from({ length: 12 }, () => call("/api/migrate-guest-session", { method: "POST", token: P.token, body: { sessionToken: tok } })));
        const ok = rs.filter((r) => r.status === 200).length;
        const list = await call("/api/patient/sessions", { token: P.token });
        const copies = (list.json?.sessions || []).filter((s) => JSON.stringify(s.symptoms).includes(mark)).length;
        if (!worst || copies > worst.copies) worst = { ok, copies, round };
        if (ok !== 1 || copies !== 1) break;
      }
      if (worst) t.check("patient-04.concurrent_migrations_of_one_guest_token_create_one_session", worst.ok === 1 && worst.copies === 1,
        `12 parallel POST /api/migrate-guest-session with the same single-use token (up to 4 rounds) -> ${worst.ok} x 200 and ${worst.copies} copies in the patient's history (round ${worst.round}; handleMigrateGuestSession SELECTs migrated_to_user_id IS NULL, INSERTs, then UPDATEs: not atomic, so a double-click/retry duplicates the report; two accounts racing both succeed too)`);
    }

    /* ---------- patient-05: a migrated guest report is re-dated to the moment of registration ---------- */
    {
      const P = await mkPatient("date");
      const g = await call("/api/guest/sessions", { method: "POST", body: { full_report: rep("D"), symptoms: "dated-" + u } });
      const guestAt = Date.now();
      await new Promise((r) => setTimeout(r, 2000));
      const m = await call("/api/migrate-guest-session", { method: "POST", token: P.token, body: { sessionToken: g.json?.session_token || "x" } });
      const at = Date.parse(m.json?.data?.created_at || "");
      t.check("patient-05.migrated_report_keeps_its_assessment_date", Number.isFinite(at) && at - guestAt < 1500,
        `guest report saved at ${new Date(guestAt).toISOString()}, migrated 2 s later: new diagnosis_sessions.created_at=${m.json?.data?.created_at} (${Number.isFinite(at) ? at - guestAt : "n/a"} ms later; the INSERT omits created_at so the assessment date becomes the registration date: history order / "journey" days are wrong when registering days after the assessment)`);
    }

    /* ---------- patient-06: the dashboard history is shown OLDEST first ---------- */
    {
      const dashSrc = appFile("static/js/dashboard.js");
      if (dashSrc) {
        // API order is created_at.desc (newest first); the page must show newest first too.
        const sessions = [{ id: "s2", created_at: "2026-10-09T10:00:00Z", symptoms: "NEWEST-SESSION", full_report: rep("N") }, { id: "s1", created_at: "2026-09-01T10:00:00Z", symptoms: "OLDEST-SESSION", full_report: rep("O") }];
        const env = sandbox({ fetchImpl: (url) => (url.includes("/api/patient/sessions") ? json(200, { sessions }) : json(404, {})) });
        env.run(dashSrc, "dashboard.js");
        for (const fn of env.docListeners.DOMContentLoaded || []) fn();
        await flush();
        const kids = env.byId("sessions-list").children.map((c) => c.innerHTML);
        const first = kids.findIndex((h) => h.includes("NEWEST-SESSION")), last = kids.findIndex((h) => h.includes("OLDEST-SESSION"));
        t.check("patient-06.dashboard_lists_newest_session_first", kids.length === 2 && first === 0 && last === 1,
          `GET /api/patient/sessions is newest-first; #sessions-list card order = ${JSON.stringify(kids.map((h) => (h.match(/(NEWEST|OLDEST)-SESSION/) || [])[1]))} (dashboard.js loadSessions does sessions.slice().reverse() under a "newest first" comment, so the latest assessment is at the bottom; confirmed in Chromium: ['oldest','newest'])`);
      }
    }

    /* ---------- patient-07: a profile field can never be cleared again ---------- */
    {
      const P = await mkPatient("prof");
      await call("/api/patient/profile", { method: "PUT", token: P.token, body: { medical_history: "diabetes", gender: "female" } });
      const clr = await call("/api/patient/profile", { method: "PUT", token: P.token, body: { medical_history: "", gender: "" } });
      const got = (await call("/api/patient/profile", { token: P.token })).json?.profile || {};
      t.check("patient-07.profile_field_can_be_cleared", clr.status === 200 && !got.medical_history, `PUT {medical_history:""} -> ${clr.status}, then GET medical_history=${JSON.stringify(got.medical_history)} (handlePatientProfilePut skips empty strings/null, so the dashboard's "clear and Save" shows "Saved ✓" yet the old medical history comes back after reload)`);
      t.check("patient-07.profile_gender_can_be_cleared", !got.gender, `GET gender=${JSON.stringify(got.gender)} after PUT gender:""`);
    }

    /* ---------- patient-08: profile numeric validation (impossible values stored, fractional/huge age = 500) ---------- */
    {
      const P = await mkPatient("num");
      const put = (b) => call("/api/patient/profile", { method: "PUT", token: P.token, body: b });
      for (const [label, b] of [["age_-1", { age: -1 }], ["age_0", { age: 0 }], ["age_200", { age: 200 }], ["height_-5", { height: -5 }], ["weight_0", { weight: 0 }], ["bmi_99999", { bmi: 99999 }]]) {
        const r = await put(b);
        t.check(`patient-08.profile_rejects_${label}`, is4(r.status), `PUT ${JSON.stringify(b)} -> ${r.status} (stored as-is; doctors and the AI prompt then see an impossible value)`);
      }
      for (const [label, b] of [["age_3.5", { age: 3.5 }], ["age_1e30", { age: 1e30 }]]) {
        const r = await put(b);
        t.check(`patient-08.profile_${label}_is_4xx_not_500`, is4(r.status), `PUT ${JSON.stringify(b)} -> ${r.status} ${r.text.slice(0, 60)} (integer column: the DB error surfaces as a 500 "failed to save profile")`);
      }
    }

    /* ---------- patient-09: malformed session payloads crash into 500 (guest save + registered save) ---------- */
    {
      const bads = [["overall_score_string", { overall_score: "abc" }], ["symptoms_object", { symptoms: { a: 1 } }], ["follow_up_date_garbage", { follow_up_date: "notadate" }]];
      for (const [label, extra] of bads) {
        const r = await call("/api/guest/sessions", { method: "POST", body: { full_report: rep("X"), ...extra } });
        t.check(`patient-09.guest_save_${label}_is_4xx`, is4(r.status), `POST /api/guest/sessions ${JSON.stringify(extra)} -> ${r.status} ${r.text.slice(0, 60)} (client error leaks as a DB 500)`);
      }
      for (const [label, extra] of bads) {
        const r = await call("/api/patient/sessions", { method: "POST", token: A.token, body: { full_report: rep("X"), primary_diagnosis: "x", ...extra } });
        t.check(`patient-09.session_create_${label}_is_4xx`, is4(r.status), `POST /api/patient/sessions ${JSON.stringify(extra)} -> ${r.status} ${r.text.slice(0, 60)}`);
      }
      const fr = await call("/api/patient/sessions", { method: "POST", token: A.token, body: { full_report: [1, 2], primary_diagnosis: "x" } });
      t.check("patient-09.session_create_full_report_must_be_an_object", is4(fr.status), `full_report:[1,2] -> ${fr.status} (accepted; every renderer then shows an empty report)`);
    }

    /* ---------- patient-10: notification preferences / device registration: client input errors are 500s ---------- */
    {
      const P = await mkPatient("notif");
      for (const [label, b] of [["unknown_column", { foo: 1 }], ["bad_time", { quiet_hours_start: "99:99" }], ["boolean_as_string", { enabled: "yes" }]]) {
        const r = await call("/api/notifications/preferences", { method: "POST", token: P.token, body: b });
        t.check(`patient-10.preferences_${label}_is_4xx`, is4(r.status), `POST /api/notifications/preferences ${JSON.stringify(b)} -> ${r.status} ${r.text.slice(0, 60)} (the raw body is upserted: DB errors become 500)`);
      }
      const d = await call("/api/notifications/register-device", { method: "POST", token: P.token, body: { deviceToken: "tk-" + u, deviceType: "toaster" } });
      t.check("patient-10.register_device_invalid_type_is_4xx", is4(d.status), `deviceType "toaster" -> ${d.status} ${d.text.slice(0, 60)}`);
    }

    /* ---------- patient-11: scheduled notifications: invalid input / DELETE with a non-uuid id are 500s ---------- */
    {
      const P = await mkPatient("sched");
      const ok = { notification_type: "med", title: "T", body: "B", scheduled_for: new Date(Date.now() + 3600e3).toISOString(), category: "medication" };
      for (const [label, b] of [["bad_date", { ...ok, scheduled_for: "tomorrow" }], ["null_title", { ...ok, title: null }], ["bad_priority", { ...ok, priority: "urgentest" }]]) {
        const r = await call("/api/notifications/schedule", { method: "POST", token: P.token, body: b });
        t.check(`patient-11.schedule_${label}_is_4xx`, is4(r.status), `POST /api/notifications/schedule ${label} -> ${r.status} ${r.text.slice(0, 60)} ("required" check uses fmt.Sprintf("%v") so null passes; no date/enum validation)`);
      }
      const del = await call("/api/notifications/schedule?id=abc", { method: "DELETE", token: P.token });
      t.check("patient-11.schedule_delete_non_uuid_id_is_4xx", is4(del.status), `DELETE ?id=abc -> ${del.status} (validID accepts slugs but the column is uuid: same class as validUUID in verification-request)`);
    }

    /* ---------- patient-12: /api/notifications/sync re-inserts the same local rows on every sync ---------- */
    {
      const P = await mkPatient("sync");
      const when = new Date(Date.now() + 86400e3).toISOString();
      const body = { deviceToken: "tk-sync-" + u, syncData: { notificationHistory: [{ type: "med", title: "SYNC-H-" + u, body: "b", sentAt: "2026-01-01T00:00:00Z" }], scheduledNotifications: [{ type: "x", title: "SYNC-S-" + u, body: "b", scheduledFor: when, category: "health" }] } };
      await call("/api/notifications/sync", { method: "POST", token: P.token, body });
      await call("/api/notifications/sync", { method: "POST", token: P.token, body });
      const g = (await call("/api/notifications/sync", { token: P.token })).json?.syncData || {};
      const h = (g.notificationHistory || []).filter((x) => x.title === "SYNC-H-" + u).length;
      const s = (g.scheduledNotifications || []).filter((x) => x.title === "SYNC-S-" + u).length;
      if (t.dbMode === "fake") t.skip("patient-12.sync_is_idempotent", "fake DB has no unique/dedupe constraints; verified on --db=sqlite"); else t.check("patient-12.sync_is_idempotent", h === 1 && s === 1, `the same device re-posting the same local history row / scheduled row twice -> history copies=${h}, scheduled copies=${s} (handleNotifSyncPost INSERTs every item with no dedupe key: reminders fire twice, history doubles on each sync)`);
    }

    /* ---------- patient-13: paid AI endpoints without a rate limit (chat/consult have 20/min; these have none) ---------- */
    {
      for (const [label, path, body] of [["ask_dietary_advice", "/api/ask-dietary-advice", { question: "durian?" }], ["summarize_inquiry", "/api/summarize-inquiry", { chatHistory: [{ role: "user", content: "hi" }] }], ["summarize_medical_history", "/api/summarize-medical-history", { medicalHistory: "x" }]]) {
        const ip = t.ip();
        let limited = 0;
        for (let i = 0; i < 45; i++) { const r = await t.api(path, { method: "POST", body, headers: { "X-Forwarded-For": ip } }); if (r.status === 429) limited++; }
        t.check(`patient-13.${label}_is_rate_limited`, limited > 0, `45 rapid anonymous POST ${path} from one IP -> ${limited} x 429 (registerSummaryRoutes has no s.RateLimit; each call is a paid model request)`);
      }
    }

    /* ---------- patient-14: anonymous clients choose the AI model ---------- */
    {
      const r = await call("/api/consult", { method: "POST", body: { data: { basic_info: { name: "a", age: "30" }, wen_inquiry: "x" }, model: "gemini-2.5-pro" } });
      t.check("patient-14.consult_ignores_client_chosen_model", r.headers.get("x-model-used") !== "gemini-2.5-pro", `POST /api/consult {model:"gemini-2.5-pro"} (no auth) -> X-Model-Used: ${r.headers.get("x-model-used")} (handleConsult/handleReportChat pass body.model straight to the upstream: anyone can force the most expensive model; use a server-side allowlist)`);
      const rc = await call("/api/report-chat", { method: "POST", body: { messages: [{ role: "user", content: "hi" }], reportData: rep(), model: "gemini-2.5-pro" } });
      t.check("patient-14.report_chat_ignores_client_chosen_model", rc.headers.get("x-model-used") !== "gemini-2.5-pro", `POST /api/report-chat {model:"gemini-2.5-pro"} -> X-Model-Used: ${rc.headers.get("x-model-used")}`);
    }

    /* ---------- patient-15: dietary Q&A: prompt echoed, blank/huge questions accepted ---------- */
    {
      const d = await call("/api/ask-dietary-advice", { method: "POST", body: { question: "Can I eat durian?", profile: { name: "SECRET-PROFILE-NAME" } } });
      t.check("patient-15.dietary_response_does_not_echo_the_prompt", d.status === 200 && !("prompt" in (d.json || {})), `200 response keys=${Object.keys(d.json || {})}: the full model prompt (template + the patient's profile/diagnosis) is returned to the browser in "prompt"`);
      const ws = await call("/api/ask-dietary-advice", { method: "POST", body: { question: "   " } });
      t.check("patient-15.dietary_whitespace_question_is_400", ws.status === 400, `question "   " -> ${ws.status} (only the empty string is rejected; a paid model call is made for nothing)`);
      const big = await call("/api/ask-dietary-advice", { method: "POST", body: { question: "x".repeat(100_000) } });
      t.check("patient-15.dietary_question_length_capped", is4(big.status), `100 000-char question -> ${big.status} (no length cap; chat/replies cap at 8000)`);
    }

    /* ---------- patient-16: wizard accepts impossible ages ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (wizSrc) {
        for (const age of ["-1", "0", "200"]) {
          const env = sandbox({ ids: { "bi-name": { value: "T" }, "bi-age": { value: age } }, fetchImpl: () => Promise.reject(new Error("offline")) });
          env.run(wizSrc, "wizard.js");
          env.sb.wizardNext();
          const step = JSON.parse(env.store.get("tcm-wizard-state") || '{"currentStep":0}').currentStep;
          t.check(`patient-16.wizard_rejects_age_${age}`, step === 0, `bi-age=${age} + Next -> currentStep=${step} (validateBasicInfo only checks !isNaN(parseInt(age)); <input min=1 max=120> is never enforced because there is no <form>). The impossible age goes into the consult prompt`);
        }
      }
    }

    /* ---------- patient-17: custom symptoms: chip lost after reload but still submitted; duplicates ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (wizSrc) {
        const preset = ["headache", "fatigue"].map((v) => { const c = { dataset: { value: v }, classList: { add() {}, toggle() {}, remove() {} } }; return c; });
        const env = sandbox({
          ls: { "tcm-wizard-state": WIZ_STATE({ basicInfo: { name: "T", age: "30", gender: "", height: "", weight: "", symptoms: ["headache", "backache-" + u] } }) },
          qsa: { "#symptom-chips .chip[data-value]": preset }, fetchImpl: () => Promise.reject(new Error("offline")),
        });
        env.run(wizSrc, "wizard.js");
        const box = env.byId("symptom-chips");
        const seen = JSON.stringify(box.children.map((c) => c.dataset?.value || c.textContent)) + box.innerHTML;
        t.check("patient-17.custom_symptom_chip_is_restored_after_reload", seen.includes("backache-" + u),
          `state.basicInfo.symptoms=["headache","backache-…"] restored from localStorage; chips re-rendered into #symptom-chips: ${seen.slice(0, 80)}. populateBasicInfoFields only re-activates chips that exist in the HTML, so the custom symptom is invisible (cannot be un-selected) but still sent to the AI (confirmed in Chromium: 0 chips after reload, state keeps it)`);
        const env2 = sandbox({ ids: { "symptom-custom-input": { value: "backache" } }, fetchImpl: () => Promise.reject(new Error("offline")) });
        env2.run(wizSrc, "wizard.js");
        env2.sb.wizardAddCustomSymptom();
        env2.byId("symptom-custom-input").value = "backache";
        env2.sb.wizardAddCustomSymptom();
        const syms = JSON.parse(env2.store.get("tcm-wizard-state") || "{}").basicInfo?.symptoms || [];
        t.check("patient-17.custom_symptom_added_twice_is_stored_once", syms.filter((s) => s === "backache").length === 1, `adding "backache" twice -> state symptoms ${JSON.stringify(syms)} (two chips, two entries sent to the model)`);
      }
    }

    /* ---------- patient-18: the inquiry chat lets a second message go out while the first answer is still streaming ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (wizSrc) {
        const env = sandbox({ ids: { "chat-input": { value: "first" } }, fetchImpl: () => new Promise(() => {}) });
        env.run(wizSrc, "wizard.js");
        env.sb.wizardChatSend();
        env.byId("chat-input").value = "second";
        env.sb.wizardChatSend();
        const n = env.calls.filter((c) => c.url.includes("/api/chat")).length;
        t.check("patient-18.chat_blocks_a_second_send_while_streaming", n === 1, `two wizardChatSend() calls before the first reply finished -> ${n} concurrent POST /api/chat (the Send button is disabled but Enter and the quick-reply chips are not guarded): two replies interleave in chatHistory and the second request lacks the first answer`);
      }
    }

    /* ---------- patient-19: wizard navigation labels are hard-coded English (SOURCE-LEVEL check) ---------- */
    {
      const wizSrc = appFile("static/js/wizard.js");
      if (wizSrc) {
        const hard = ["'Next →'", "'Generate Report →'"].filter((s) => wizSrc.includes("textContent = " + s));
        t.check("patient-19.wizard_nav_labels_follow_the_selected_language", hard.length === 0,
          `renderStep() assigns ${hard.join(", ")} (and the "Step N of 8" counter) as literal English on every step, so after switching to 中文/BM the Next / Generate / Step labels stay English (confirmed in Chromium after tcmLang.toggle()). Use i18n keys`);
      }
    }

    /* ---------- patient-20: reports whose diagnosis/constitution/analysis are strings render empty (dashboard, page, print) ---------- */
    {
      const dashSrc = appFile("static/js/dashboard.js"), printSrc = appFile("static/js/report-print.js");
      const strReport = { diagnosis: "STRDIAG-" + u, constitution: "STRCONST-" + u, analysis: "STRANALYSIS-" + u };
      if (dashSrc) {
        const env = sandbox({ fetchImpl: (url) => (url.includes("/api/patient/sessions") ? json(200, { sessions: [{ id: "s1", created_at: "2026-10-01T00:00:00Z", symptoms: "x", full_report: strReport }] }) : json(404, {})) });
        env.run(dashSrc, "dashboard.js");
        for (const fn of env.docListeners.DOMContentLoaded || []) fn();
        await flush();
        const card = env.byId("sessions-list").children[0];
        const click = card?._listeners?.click?.[0];
        if (click) click();
        const html = (card?.querySelector(".session-detail") || {}).innerHTML || "";
        const head = card?.innerHTML || "";
        t.check("patient-20.dashboard_shows_a_string_diagnosis", html.includes("STRDIAG-" + u), `full_report.diagnosis is a string (the consult contract, reportProblems() and dtEnsureSessionRequired accept it; wizard.js handles it) -> dashboard detail: "${html.slice(0, 80)}"`);
        t.check("patient-20.dashboard_shows_a_string_constitution", (html + head).includes("STRCONST-" + u), "full_report.constitution is a string -> shown nowhere on the session card");
        t.check("patient-20.dashboard_shows_a_string_analysis", html.includes("STRANALYSIS-" + u), "full_report.analysis is a string -> summary missing");
      }
      if (printSrc) {
        const env = sandbox({});
        env.run(printSrc, "report-print.js");
        const body = env.sb.TCMReportBody({ full_report: strReport, created_at: "2026-10-01T00:00:00Z" });
        t.check("patient-20.report_page_and_print_show_string_fields", body.includes("STRDIAG-" + u) && body.includes("STRCONST-" + u) && body.includes("STRANALYSIS-" + u), `TCMReportBody (used by /patient/report/{id} and Print) for string-shaped diagnosis/constitution/analysis: contains diagnosis=${body.includes("STRDIAG-" + u)} constitution=${body.includes("STRCONST-" + u)} analysis=${body.includes("STRANALYSIS-" + u)}`);
      }
    }

    /* ---------- patient-21: history list is silently capped at 50 and ignores is_hidden ---------- */
    {
      const P = await mkPatient("hist");
      for (let i = 0; i < 52; i++) await call("/api/patient/sessions", { method: "POST", token: P.token, body: { full_report: rep("H" + i), primary_diagnosis: "h", symptoms: "hist-" + i } });
      const l = await call("/api/patient/sessions", { token: P.token });
      const n = (l.json?.sessions || []).length;
      const declares = l.json && (l.json.total >= 52 || l.json.next || l.json.has_more || l.json.truncated || l.json.nextCursor);
      t.check("patient-21.history_returns_every_session_or_declares_truncation", n >= 52 || !!declares, `52 saved sessions -> GET /api/patient/sessions returns ${n} (limit=50, keys=${Object.keys(l.json || {})}); the 2 oldest are unreachable from the dashboard AND from /patient/report/{id} ("Report not found"), with no paging/total`);
      const hid = await call("/api/patient/sessions", { method: "POST", token: P.token, body: { full_report: rep("Hid"), primary_diagnosis: "h", symptoms: "hidden-" + u, is_hidden: true } });
      const l2 = await call("/api/patient/sessions", { token: P.token });
      const listed = (l2.json?.sessions || []).some((s) => JSON.stringify(s.symptoms).includes("hidden-" + u));
      t.check("patient-21.is_hidden_session_is_not_listed", hid.status >= 400 || !listed, `session created with is_hidden:true (an accepted writable column) is still returned by the history list: ${listed} (the list query never filters is_hidden, and there is no endpoint to hide/delete a session)`);
    }

    /* ---------- patient-22: notification rows can be mass-assigned (id / created_at / is_sent / is_cancelled) ---------- */
    {
      const P = await mkPatient("mass");
      const first = await call("/api/notifications/preferences", { method: "POST", token: P.token, body: { enabled: true } });
      const id0 = first.json?.preferences?.id, ca0 = first.json?.preferences?.created_at;
      const evil = await call("/api/notifications/preferences", { method: "POST", token: P.token, body: { id: "11111111-1111-1111-1111-111111111111", created_at: "2000-01-01T00:00:00Z" } });
      t.check("patient-22.preferences_id_and_created_at_are_server_controlled", evil.json?.preferences?.id === id0 && evil.json?.preferences?.created_at === ca0, `POST preferences {id, created_at} -> id ${id0} => ${evil.json?.preferences?.id}, created_at ${ca0} => ${evil.json?.preferences?.created_at} (handleNotifPrefsPost upserts the raw body)`);
      const s = await call("/api/notifications/schedule", { method: "POST", token: P.token, body: { notification_type: "med", title: "T", body: "B", scheduled_for: new Date(Date.now() + 3600e3).toISOString(), category: "medication", is_sent: true, is_cancelled: true, sent_at: "2000-01-01T00:00:00Z" } });
      if (t.dbMode === "fake") t.skip("patient-22.schedule_state_flags_are_server_controlled", "fake DB has no column defaults (is_sent/is_cancelled stay undefined); verified on --db=sqlite"); else t.check("patient-22.schedule_state_flags_are_server_controlled", s.json?.notification?.is_sent === false && s.json?.notification?.is_cancelled === false, `POST schedule {is_sent:true,is_cancelled:true} -> is_sent=${s.json?.notification?.is_sent} is_cancelled=${s.json?.notification?.is_cancelled} (a new reminder is born already sent/cancelled; only the sender job should set these)`);
    }

    /* ---------- patient-23: blank names / non-object consult data accepted ---------- */
    {
      const su = await t.signup(`hunt-patient-ws-${u}@example.com`, "   ", "patient", {}, t.ip());
      t.check("patient-23.signup_whitespace_only_name_is_rejected", !su.ok, `signup name "   " -> ${su.raw.status} (accepted: the patient shows up as a blank name in the doctor inbox and on the dashboard)`);
      const P = await mkPatient("blank");
      const pn = await call("/api/patient/profile", { method: "PUT", token: P.token, body: { full_name: "   " } });
      t.check("patient-23.profile_whitespace_only_name_is_rejected", is4(pn.status), `PUT full_name "   " -> ${pn.status}`);
      for (const [label, data] of [["array", []], ["number", 5], ["string", "x"]]) {
        const r = await call("/api/consult", { method: "POST", body: { data, language: "en" } });
        t.check(`patient-23.consult_data_${label}_is_400`, r.status === 400, `POST /api/consult {data:${JSON.stringify(data)}} -> ${r.status} (only null/{}/"" are rejected; the model is called with garbage)`);
      }
    }

    /* ---------- patient-24: a double-click on "Request" creates two identical consultation requests ---------- */
    {
      const P = await mkPatient("dup");
      const dir = await call("/api/doctors");
      const d0 = (dir.json?.doctors || [])[0];
      if (!d0) t.check("patient-24.fixture", false, "no doctor in directory");
      else {
        const body = { doctorId: d0.id, doctorName: d0.full_name, patientData: { name: "Dup", email: "dup@example.com" }, reportData: rep("Dup") };
        const [r1, r2] = await Promise.all([call("/api/verification-request", { method: "POST", token: P.token, body }), call("/api/verification-request", { method: "POST", token: P.token, body })]);
        const id1 = r1.json?.data?.id, id2 = r2.json?.data?.id;
        const mine = await call("/api/patient/requests", { token: P.token });
        const rows = (mine.json?.requests || []).length;
        t.check("patient-24.duplicate_pending_request_to_same_doctor_is_deduplicated", rows === 1 || is4(r1.status) || is4(r2.status) || (id1 && id1 === id2),
          `two identical in-flight POST /api/verification-request -> ids ${id1} / ${id2}, ${rows} rows in the patient's list (consult.js consultRequest() never disables the button; the doctor inbox gets two copies; dedupe on (user, doctor, pending) or an idempotency key)`);
      }
    }
  },
};
