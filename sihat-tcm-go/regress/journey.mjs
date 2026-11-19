#!/usr/bin/env node
/**
 * journey.mjs — the MAIN workflow, run repeatedly, across every role.
 *
 *   unregistered patient  → asks for consultation (chat inquiry) → is retried until a
 *   valid REPORT exists → saves it as a guest → REGISTERS → logs in → previous report
 *   migrates → registered consultation → picks a registered DOCTOR → doctor reads the
 *   inbox, flags, replies, writes a treatment plan → patient sees it and replies back.
 *   Then the OTHER roles' interfaces: admin, developer, and a stranger (access control).
 *
 *   node regress/journey.mjs [--base=URL] [--cycles=3] [--lang=en|zh|ms|mix] [--keep]
 *
 * Graph shape (see regress/graph.mjs): each phase is a node writing into one shared
 * `state`; a cycle stops at the first hard failure of a prerequisite node (no fake
 * edges), but independent branches (admin / developer / stranger) always run.
 * Stop rule for the "till he gets report" loop: MAX_REPORT_TRIES attempts.
 * Created rows are tagged e2e-<run>@example.com so leftovers are identifiable.
 */
import { pathToFileURL } from "node:url";
import { longFetch } from "./http.mjs";

const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const MAX_REPORT_TRIES = 4;

const SCENARIOS = [
  { id: "qi-def", lang: "en", syms: ["fatigue", "headache"], inq: "Fatigue and dull headache for a week, worse in the afternoon; loose stools.", tongue: "Pale swollen tongue with teeth marks, thin white coat.", face: "Pale lustreless complexion.", bpm: "68", q: ["thready"] },
  { id: "yin-def-zh", lang: "zh", syms: ["失眠", "口干"], inq: "最近两周入睡困难，夜间盗汗，口干，手心发热。", tongue: "舌红少苔，舌体偏瘦。", face: "两颧潮红。", bpm: "84", q: ["thready", "rapid"] },
  { id: "damp-heat-ms", lang: "ms", syms: ["sakit kepala", "badan berat"], inq: "Badan rasa berat, kepala pening, selera makan kurang, dahaga tetapi tidak mahu minum.", tongue: "Lidah merah dengan salutan kuning tebal berminyak.", face: "Muka berminyak, kemerahan.", bpm: "78", q: ["slippery"] },
  { id: "liver-qi", lang: "en", syms: ["irritability", "chest tightness"], inq: "Stress at work, irritable, sighing, bloating in the flanks, PMS-like mood swings.", tongue: "Slightly red edges, thin coat.", face: "Tense, slightly flushed.", bpm: "76", q: ["wiry"] },
];

export function newCtx({ base, run, lang = "en" }) {
  const checks = [];
  const elog = (...a) => process.stderr.write(a.join(" ") + "\n");
  const check = (label, ok, detail = "") => {
    checks.push({ label, ok: !!ok, detail: ok ? "ok" : detail || "failed" });
    elog(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : " — " + detail}`);
    return !!ok;
  };
  async function api(path, { method = "GET", body, token } = {}) {
    const headers = {};
    // each virtual client gets its own rate-limit bucket (the app keys limits on X-Forwarded-For)
    if (ctx.ip) headers["X-Forwarded-For"] = ctx.ip;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await longFetch(base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* stream/plain */ }
    return { status: res.status, json, text, setCookie: res.headers.get("set-cookie") || "", headers: res.headers };
  }
  const ctx = { base, run, lang, checks, check, api, elog, ip: "" };
  return ctx;
}

const tokenOf = (setCookie) => ((setCookie || "").match(/sb-access-token=([^;]+)/) || [])[1] || "";

export async function login(ctx, email, password = PW) {
  const r = await ctx.api("/api/auth/login", { method: "POST", body: { email, password } });
  return { ok: r.status === 200 && r.json?.success === true, token: tokenOf(r.setCookie), role: r.json?.role, id: r.json?.user?.id, raw: r };
}
export async function signup(ctx, email, name, role, extra = {}) {
  const r = await ctx.api("/api/auth/signup", { method: "POST", body: { email, password: PW, name, role, ...extra } });
  return { ok: r.status === 200 && r.json?.success === true, token: tokenOf(r.setCookie), role: r.json?.role, id: r.json?.user?.id, raw: r };
}

/**
 * A self-registered doctor is NOT approved: the doctor APIs (inbox, reply, flag, treatment plan) answer 403 and the public
 * directory hides them until an admin approves the account (POST /api/admin/doctors/approve, admin only).
 * approveDoctor() does that through the API as the seeded demo admin (present in both --db=fake and --db=sqlite).
 */
export async function approveDoctor(ctx, adminToken, doctorId, approved = true) {
  const r = await ctx.api("/api/admin/doctors/approve", { method: "POST", token: adminToken, body: { id: doctorId, approved } });
  return { ok: r.status === 200 && r.json?.success === true && r.json?.is_approved === approved, raw: r };
}

const dataFor = (sc) => ({
  basic_info: { name: "Journey " + sc.id, age: "38", gender: "female", height: "163", weight: "57", symptoms: sc.syms },
  wen_inquiry: sc.inq, wang_tongue: sc.tongue, wang_face: sc.face, wen_audio: "", qie: { bpm: sc.bpm, qualities: sc.q },
});

/** Validates the contract the report renderer depends on. Returns [] when OK. */
export function reportProblems(rpt) {
  const p = [];
  if (!rpt || typeof rpt !== "object") return ["not an object"];
  const d = rpt.diagnosis;
  if (!(d && (typeof d === "string" || (typeof d.primary_pattern === "string" && d.primary_pattern.length > 1)))) p.push("diagnosis.primary_pattern missing");
  const kf = rpt.analysis && rpt.analysis.key_findings;
  if (Array.isArray(kf)) p.push("analysis.key_findings is an ARRAY (render crash)");
  const rec = rpt.recommendations;
  if (!rec || !(rec.food_therapy || Array.isArray(rec.lifestyle) || Array.isArray(rec.acupoints))) p.push("recommendations shape");
  return p;
}

/** "until he gets report": ask, retry on unparseable/invalid output, stop after MAX tries. */
export async function consultUntilReport(ctx, data, language, label) {
  const attempts = [];
  for (let i = 1; i <= MAX_REPORT_TRIES; i++) {
    const t0 = Date.now();
    const r = await ctx.api("/api/consult", { method: "POST", body: { data, language } });
    const cleaned = (r.text || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    let rpt = null; try { rpt = JSON.parse(cleaned); } catch { /* retry */ }
    const probs = rpt ? reportProblems(rpt) : ["unparseable JSON (head: " + cleaned.slice(0, 40).replace(/\s+/g, " ") + ")"];
    attempts.push({ try: i, status: r.status, ms: Date.now() - t0, problems: probs });
    if (r.status === 200 && !probs.length) { ctx.check(`${label}.report_obtained(try ${i}/${MAX_REPORT_TRIES})`, true); return { report: rpt, attempts }; }
    ctx.elog(`    … ${label} attempt ${i} not usable: status=${r.status} ${probs.join("; ")}`);
  }
  ctx.check(`${label}.report_obtained`, false, `no valid report in ${MAX_REPORT_TRIES} tries: ${JSON.stringify(attempts.map((a) => a.problems[0] || a.status))}`);
  return { report: null, attempts };
}

/** Inquiry chat turn(s): the conversational part of "ask for consultation". */
async function inquiryChat(ctx, sc, label) {
  const r = await ctx.api("/api/chat", {
    method: "POST",
    body: { messages: [{ role: "user", content: sc.inq }], basicInfo: { name: "Journey", age: "38", gender: "female", height: "163", weight: "57", symptoms: sc.syms }, language: sc.lang },
  });
  ctx.check(`${label}.inquiry_chat_replies`, r.status === 200 && r.text.trim().length > 15, `status=${r.status} len=${r.text.trim().length}`);
  return r.text;
}

/* ------------------------------- one cycle ------------------------------- */
export async function patientDoctorCycle(ctx, n, sc, doctors) {
  const L = `c${n}`;
  const st = { n, sc };
  ctx.ip = `10.${parseInt(ctx.run, 36) % 200}.${n}.7`;
  ctx.elog(`\n--- cycle ${n}: scenario ${sc.id} (${sc.lang}) ---`);

  /* NODE 1 · unregistered patient: inquiry chat → report (retry loop) → guest save */
  await inquiryChat(ctx, sc, `${L}.guest`);
  const g = await consultUntilReport(ctx, dataFor(sc), sc.lang, `${L}.guest`);
  if (!g.report) return st; // hard prerequisite: nothing to save/migrate
  const gs = await ctx.api("/api/guest/sessions", { method: "POST", body: { full_report: g.report, primary_diagnosis: g.report.diagnosis?.primary_pattern, constitution: g.report.constitution?.type, symptoms: sc.syms.join(", "), guest_name: "Guest " + sc.id } });
  st.guestToken = gs.json?.session_token;
  ctx.check(`${L}.guest.session_saved`, gs.status === 201 && !!st.guestToken, `status=${gs.status} ${gs.text.slice(0, 100)}`);

  /* NODE 2 · register as a patient → login → guest report migrates */
  const email = `e2e-pat-${ctx.run}-${n}@example.com`;
  const su = await signup(ctx, email, `Patient ${ctx.run}-${n}`, "patient");
  if (!ctx.check(`${L}.register.patient`, su.ok && su.role === "patient" && !!su.token, `status=${su.raw.status} role=${su.role} body=${su.raw.text.slice(0, 120)}`)) return st;
  const dup = await signup(ctx, email, "dup", "patient");
  ctx.check(`${L}.register.duplicate_email_rejected`, !dup.ok, `second signup with same email succeeded (status ${dup.raw.status})`);
  const li = await login(ctx, email);
  ctx.check(`${L}.login.patient`, li.ok && li.role === "patient" && !!li.token, `role=${li.role}`);
  const wrongPw = await login(ctx, email, "not-the-password");
  ctx.check(`${L}.login.wrong_password_401`, wrongPw.raw.status === 401, `status=${wrongPw.raw.status}`);
  st.patient = { email, token: li.token, id: li.id };
  const me = await ctx.api("/api/auth/me", { token: li.token });
  ctx.check(`${L}.auth_me.patient`, me.status === 200 && JSON.stringify(me.json).includes(email), `status=${me.status}`);

  if (st.guestToken) await ctx.api("/api/migrate-guest-session", { method: "POST", token: li.token, body: { sessionToken: st.guestToken } });
  const l1 = await ctx.api("/api/patient/sessions", { token: li.token });
  ctx.check(`${L}.login.sees_previous_report`, (l1.json?.sessions || []).length >= 1, `sessions=${(l1.json?.sessions || []).length}`);

  /* NODE 3 · registered patient: second consultation (different complaint) */
  const sc2 = SCENARIOS[(n + 1) % SCENARIOS.length];
  await inquiryChat(ctx, sc2, `${L}.registered`);
  const r2 = await consultUntilReport(ctx, dataFor(sc2), sc2.lang, `${L}.registered`);
  if (r2.report) {
    const sv = await ctx.api("/api/patient/sessions", { method: "POST", token: li.token, body: { full_report: r2.report, primary_diagnosis: r2.report.diagnosis?.primary_pattern, constitution: r2.report.constitution?.type, symptoms: sc2.syms.join(", ") } });
    ctx.check(`${L}.registered.report_saved`, sv.status === 200 || sv.status === 201, `status=${sv.status} ${sv.text.slice(0, 100)}`);
    const l2 = await ctx.api("/api/patient/sessions", { token: li.token });
    ctx.check(`${L}.registered.two_reports_listed`, (l2.json?.sessions || []).length >= 2, `sessions=${(l2.json?.sessions || []).length}`);
    // follow-up questions about the report
    const rc = await ctx.api("/api/report-chat", { method: "POST", body: { messages: [{ role: "user", content: "What foods should I avoid?" }], reportData: r2.report, language: sc2.lang } });
    ctx.check(`${L}.registered.report_chat`, rc.status === 200 && rc.text.trim().length > 15, `status=${rc.status}`);
    st.report = r2.report;
  } else return st;

  /* NODE 4 · connect with a registered doctor */
  const dirR = await ctx.api("/api/doctors");
  const dirIds = new Set((dirR.json?.doctors || []).map((d) => d.id));
  const chosen = doctors[(n - 1) % doctors.length];
  ctx.check(`${L}.connect.doctor_in_directory`, dirIds.has(chosen.id), `doctor ${chosen.id} not in directory (size ${dirIds.size})`);
  const vr = await ctx.api("/api/verification-request", { method: "POST", token: li.token, body: { doctorId: chosen.id, doctorName: chosen.name, patientData: { name: `Patient ${ctx.run}-${n}`, email }, reportData: st.report } });
  st.requestId = vr.json?.data?.id;
  if (!ctx.check(`${L}.connect.request_routed`, vr.status === 200 && !!st.requestId, `status=${vr.status} ${vr.text.slice(0, 120)}`)) return st;

  /* NODE 5 · doctor side: inbox → flag → reply → treatment plan */
  const inbox = await ctx.api("/api/doctor/requests", { token: chosen.token });
  const row = (inbox.json?.requests || []).find((x) => x.id === st.requestId);
  ctx.check(`${L}.doctor.sees_request_in_inbox`, !!row, `inbox ${(inbox.json?.requests || []).length} rows, request ${st.requestId} absent`);
  const fl = await ctx.api("/api/doctor/flag", { method: "POST", token: chosen.token, body: { requestId: st.requestId, flag: n % 2 ? "watch" : "critical" } });
  ctx.check(`${L}.doctor.flag_set`, fl.status === 200, `status=${fl.status}`);
  const msg = `Dr review ${ctx.run}-${n}: consistent with the AI pattern; follow the dietary advice.`;
  const rp = await ctx.api("/api/doctor/reply", { method: "POST", token: chosen.token, body: { requestId: st.requestId, message: msg, targetTable: "inquiries" } });
  ctx.check(`${L}.doctor.reply_sent`, rp.status === 200, `status=${rp.status}`);
  const tp = await ctx.api("/api/doctor/treatment-plan", { method: "POST", token: chosen.token, body: { requestId: st.requestId, plan: { herbs: "Si Jun Zi Tang", notes: "e2e plan " + ctx.run } } });
  ctx.check(`${L}.doctor.treatment_plan_saved`, tp.status === 200, `status=${tp.status} ${tp.text.slice(0, 100)}`);

  /* NODE 6 · patient sees the feedback and answers back */
  const mine = await ctx.api("/api/patient/requests", { token: li.token });
  const mrow = (mine.json?.requests || []).find((x) => x.id === st.requestId);
  const msgs = mrow?.diagnosis_report?.messages || [];
  ctx.check(`${L}.patient.sees_doctor_feedback`, msgs.some((m) => m.role === "doctor" && m.content === msg) && mrow?.status === "reviewed", `status=${mrow?.status} msgs=${msgs.length}`);
  const pr = await ctx.api("/api/patient/reply", { method: "POST", token: li.token, body: { requestId: st.requestId, message: "Thank you doctor, I will follow it." } });
  ctx.check(`${L}.patient.reply_back`, pr.status === 200, `status=${pr.status}`);
  const back = await ctx.api("/api/doctor/requests", { token: chosen.token });
  const brow = (back.json?.requests || []).find((x) => x.id === st.requestId);
  ctx.check(`${L}.doctor.sees_patient_reply`, JSON.stringify(brow?.diagnosis_report?.messages || []).includes("I will follow it"), "patient reply not visible to doctor");

  /* NODE 7 · profile + ownership + cancel */
  await ctx.api("/api/patient/profile", { method: "PUT", token: li.token, body: { full_name: `Renamed ${ctx.run}`, age: 39, gender: "female", height: 163, weight: 57, bmi: 21.5 } });
  const prof = (await ctx.api("/api/patient/profile", { token: li.token })).json?.profile || {};
  ctx.check(`${L}.patient.profile_roundtrip`, prof.full_name === `Renamed ${ctx.run}`, `full_name=${prof.full_name}`);
  const cx = await ctx.api("/api/patient/requests/cancel", { method: "POST", token: li.token, body: { id: st.requestId } });
  ctx.check(`${L}.patient.cancel_own_request`, cx.status === 200, `status=${cx.status}`);
  return st;
}

/* ---------------------------- other roles / access ---------------------------- */
export async function otherRoles(ctx, { patientToken, doctorToken, doctorId, foreignRequestId }) {
  ctx.elog("\n--- other roles: admin / developer / access control ---");
  const admin = await login(ctx, "admin@sihat.com");
  const dev = await login(ctx, "developer@sihat.com");
  ctx.check("admin.login", admin.ok && admin.role === "admin", `role=${admin.role}`);
  ctx.check("developer.login", dev.ok && dev.role === "developer", `role=${dev.role}`);

  const asAdmin = (p, o = {}) => ctx.api(p, { token: admin.token, ...o });
  const asDev = (p, o = {}) => ctx.api(p, { token: dev.token, ...o });

  // admin / developer reachable surfaces
  ctx.check("admin.system_health", (await asAdmin("/api/admin/system-health")).status === 200, "admin cannot read system-health");
  ctx.check("developer.system_health", (await asDev("/api/admin/system-health")).status === 200, "developer cannot read system-health");
  ctx.check("admin.logs", (await asAdmin("/api/logs")).status === 200, "admin cannot read logs");
  const dl = await asAdmin("/api/admin/doctors");
  ctx.check("admin.doctors_list", dl.status === 200 && Array.isArray(dl.json?.doctors), `status=${dl.status}`);
  ctx.check("developer.logs", (await asDev("/api/logs")).status === 200, "developer cannot read logs");
  const settings = await asAdmin("/api/admin/settings");
  ctx.check("admin.settings_read", settings.status === 200, `status=${settings.status}`);
  const leaked = JSON.stringify(settings.json || {}).match(/AIza[0-9A-Za-z_-]{20,}/);
  ctx.check("admin.settings_key_masked", !leaked, "admin settings expose a full Gemini API key");
  const dbs = await asAdmin("/api/admin/db-status");
  ctx.check("admin.db_status", dbs.status === 200, `status=${dbs.status}`);
  const mh = await ctx.api("/api/monitoring/health");
  ctx.check("monitor.health_ok", mh.status === 200 && mh.json?.status !== "unhealthy", `status=${mh.status} ${mh.json?.status}`);
  const aa = await ctx.api("/api/admin/assistant", { method: "POST", token: admin.token, body: { messages: [{ role: "user", content: "How many consultation requests are pending?" }] } });
  ctx.check("admin.assistant_answers", aa.status === 200 && aa.text.trim().length > 10, `status=${aa.status}`);
  const da = await ctx.api("/api/developer/assistant", { method: "POST", token: dev.token, body: { messages: [{ role: "user", content: "Summarise recent errors." }] } });
  ctx.check("developer.assistant_answers", da.status === 200 && da.text.trim().length > 10, `status=${da.status}`);

  // role fences: wrong roles must NOT pass
  const matrix = [
    ["patient→doctor inbox", ctx.api("/api/doctor/requests", { token: patientToken }), [401, 403]],
    ["doctor→admin settings PUT", ctx.api("/api/admin/settings", { method: "PUT", token: doctorToken, body: { x: 1 } }), [401, 403]],
    ["patient→system-health", ctx.api("/api/admin/system-health", { token: patientToken }), [401, 403]],
    ["patient→logs", ctx.api("/api/logs", { token: patientToken }), [401, 403]],
    ["doctor→logs", ctx.api("/api/logs", { token: doctorToken }), [401, 403]],
    ["anon→patient sessions", ctx.api("/api/patient/sessions"), [401]],
    ["anon→doctor inbox", ctx.api("/api/doctor/requests"), [401]],
    ["anon→admin settings PUT", ctx.api("/api/admin/settings", { method: "PUT", body: { x: 1 } }), [401, 403]],
    ["garbage token→patient sessions", ctx.api("/api/patient/sessions", { token: "garbage.token.value" }), [401]],
    ["patient→treatment plan (doctor only)", ctx.api("/api/doctor/treatment-plan", { method: "POST", token: patientToken, body: { requestId: foreignRequestId || "x", plan: { a: 1 } } }), [401, 403]],
    ["patient→admin doctors list", ctx.api("/api/admin/doctors", { token: patientToken }), [401, 403]],
    ["doctor→admin doctors list", ctx.api("/api/admin/doctors", { token: doctorToken }), [401, 403]],
    ["anon→admin doctors list", ctx.api("/api/admin/doctors"), [401]],
    ["doctor→self-approve", ctx.api("/api/admin/doctors/approve", { method: "POST", token: doctorToken, body: { id: doctorId || "x" } }), [401, 403]],
    ["patient→approve doctor", ctx.api("/api/admin/doctors/approve", { method: "POST", token: patientToken, body: { id: doctorId || "x" } }), [401, 403]],
    ["anon→approve doctor", ctx.api("/api/admin/doctors/approve", { method: "POST", body: { id: doctorId || "x" } }), [401]],
    ["patient→doctor flag (doctor only)", ctx.api("/api/doctor/flag", { method: "POST", token: patientToken, body: { requestId: foreignRequestId || "x", flag: "critical" } }), [401, 403]],
  ];
  for (const [name, p, want] of matrix) {
    const r = await p;
    ctx.check(`access.${name}`, want.includes(r.status), `status=${r.status} (want ${want.join("/")})`);
  }
  // a patient must not read ANOTHER patient's request or cancel it
  if (foreignRequestId) {
    const cancel = await ctx.api("/api/patient/requests/cancel", { method: "POST", token: patientToken, body: { id: foreignRequestId } });
    ctx.check("access.patient_cannot_cancel_foreign_request", cancel.status === 403 || cancel.status === 404, `status=${cancel.status}`);
    const rep = await ctx.api("/api/patient/reply", { method: "POST", token: patientToken, body: { requestId: foreignRequestId, message: "intruder" } });
    ctx.check("access.patient_cannot_reply_to_foreign_request", rep.status === 403 || rep.status === 404, `status=${rep.status}`);
  }
  return { admin, dev };
}

/* ------------------------------- orchestration ------------------------------- */
export async function runJourney({ base, cycles = 2, langMix = true, nDoctors = 2 }) {
  const run = Date.now().toString(36);
  const ctx = newCtx({ base, run });
  ctx.elog(`\n=== JOURNEY @ ${base} — ${cycles} cycle(s), ${nDoctors} doctor(s), run ${run} ===`);

  // doctors register once per run
  const doctors = [];
  for (let d = 1; d <= nDoctors; d++) {
    ctx.ip = `10.${parseInt(run, 36) % 200}.0.${d}`;
    const email = `e2e-doc-${run}-${d}@example.com`, name = `Dr E2E ${run}-${d}`;
    const su = await signup(ctx, email, name, "doctor", { specialty: d % 2 ? "Internal Medicine 内科" : "Gynecology 妇科", bio: `Experienced TCM physician #${d}.`, yearsExperience: 10 + d });
    ctx.check(`doctor${d}.register`, su.ok && su.role === "doctor", `status=${su.raw.status} role=${su.role} ${su.raw.text.slice(0, 100)}`);
    const li = await login(ctx, email);
    ctx.check(`doctor${d}.login`, li.ok && li.role === "doctor" && !!li.token, `role=${li.role}`);
    doctors.push({ email, name, id: li.id, token: li.token });
  }

  // doctor approval gate: before an admin approves, the doctor is hidden from the directory and locked out of the inbox
  ctx.ip = `10.${parseInt(run, 36) % 200}.0.99`;
  const adm = await login(ctx, "admin@sihat.com");
  ctx.check("approval.admin_login", adm.ok && adm.role === "admin" && !!adm.token, `role=${adm.role}`);
  if (doctors[0]?.token) {
    const pre = await ctx.api("/api/doctor/requests", { token: doctors[0].token });
    ctx.check("approval.unapproved_doctor_inbox_403", pre.status === 403, `unapproved doctor GET /api/doctor/requests -> ${pre.status} (want 403)`);
    const dir0 = await ctx.api("/api/doctors");
    ctx.check("approval.unapproved_doctor_not_in_directory", !(dir0.json?.doctors || []).some((x) => x.id === doctors[0].id), "unapproved doctor listed in GET /api/doctors");
  }
  for (const [i, d] of doctors.entries()) {
    const ap = await approveDoctor(ctx, adm.token, d.id);
    ctx.check(`doctor${i + 1}.approved_by_admin`, ap.ok, `status=${ap.raw.status} ${ap.raw.text.slice(0, 100)}`);
  }

  const cyclesOut = [];
  for (let n = 1; n <= cycles; n++) cyclesOut.push(await patientDoctorCycle(ctx, n, langMix ? SCENARIOS[(n - 1) % SCENARIOS.length] : SCENARIOS[0], doctors.filter((d) => d.token)));

  // stranger patient token + a request that is NOT theirs
  ctx.ip = `10.${parseInt(run, 36) % 200}.250.1`;
  const stranger = await signup(ctx, `e2e-stranger-${run}@example.com`, "Stranger", "patient");
  ctx.check("stranger.register", stranger.ok && !!stranger.token, `status=${stranger.raw.status} ${stranger.raw.text.slice(0, 100)} (without a real token the access matrix below would pass vacuously)`);
  const foreign = cyclesOut.find((c) => c.requestId)?.requestId;
  await otherRoles(ctx, { patientToken: stranger.token, doctorToken: doctors[0]?.token, doctorId: doctors[0]?.id, foreignRequestId: foreign });

  const passed = ctx.checks.filter((c) => c.ok).length;
  const failures = ctx.checks.filter((c) => !c.ok).map(({ label, detail }) => ({ label, detail }));
  return { ok: failures.length === 0 && passed > 0, passed, failed: failures.length, total: ctx.checks.length, cycles, base, run, failures, checks: ctx.checks };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const a = process.argv.slice(2);
  const f = (n, d) => { const x = a.find((v) => v.startsWith(`--${n}=`)); return x ? x.split("=").slice(1).join("=") : d; };
  const base = f("base", process.env.ACI_BASE || "http://localhost:8081").replace(/\/+$/, "");
  runJourney({ base, cycles: parseInt(f("cycles", "2"), 10), nDoctors: parseInt(f("doctors", "2"), 10) })
    .then((v) => { console.log(JSON.stringify(v, null, 2)); process.exit(v.ok ? 0 : 1); })
    .catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
}
