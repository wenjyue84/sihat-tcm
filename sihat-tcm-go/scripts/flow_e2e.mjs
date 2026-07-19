#!/usr/bin/env node
/**
 * flow_e2e.mjs — end-to-end test of the full patient↔doctor journey with
 * multiple patients and doctors, exercising all 11 steps of the goal via the
 * REST API. Prints a JSON verdict; exit 0 = all pass, 1 = any fail.
 *
 *   node scripts/flow_e2e.mjs [--base=URL] [--patients=3] [--doctors=2]
 */
const args = process.argv.slice(2);
const flag = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const BASE = flag("base", process.env.ACI_BASE || "http://localhost:8081").replace(/\/+$/, "");
const NPAT = parseInt(flag("patients", "3"), 10);
const NDOC = parseInt(flag("doctors", "2"), 10);
const RUN = Date.now().toString(36);
const PW = "password123";

const elog = (...a) => process.stderr.write(a.join(" ") + "\n");
const checks = [];
function check(label, ok, detail = "") {
  checks.push({ label, ok: !!ok, detail: ok ? "" : detail });
  elog(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : " — " + detail}`);
}

async function api(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookie = res.headers.get("set-cookie") || "";
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, setCookie };
}
function tokenFromCookie(setCookie) {
  const m = (setCookie || "").match(/sb-access-token=([^;]+)/);
  return m ? m[1] : "";
}

// consult with client-style retry (report must parse).
async function consult(data, language = "en") {
  for (let i = 0; i < 3; i++) {
    const r = await api("/api/consult", { method: "POST", body: { data, language } });
    const cleaned = (r.text || "").replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try { return JSON.parse(cleaned); } catch {}
  }
  return null;
}

async function signup(email, name, role, extra = {}) {
  const r = await api("/api/auth/signup", { method: "POST", body: { email, password: PW, name, role, ...extra } });
  return { ok: r.status === 200 && r.json && r.json.success, token: tokenFromCookie(r.setCookie), role: r.json && r.json.role, userId: r.json && r.json.user && r.json.user.id, raw: r };
}
async function login(email) {
  const r = await api("/api/auth/login", { method: "POST", body: { email, password: PW } });
  return { ok: r.status === 200 && r.json && r.json.success, token: tokenFromCookie(r.setCookie), role: r.json && r.json.role, userId: r.json && r.json.user && r.json.user.id, raw: r };
}

const DATA = (sym) => ({
  basic_info: { name: "Test", age: "40", gender: "female", height: "162", weight: "58", symptoms: sym },
  wen_inquiry: "symptoms for about two weeks", wang_tongue: "pale tongue with thin white coat",
  wang_face: "slightly pale", wen_audio: "", qie: { bpm: "74", qualities: ["thready"] },
});

async function main() {
  elog(`\n=== FLOW E2E @ ${BASE} — ${NPAT} patients × ${NDOC} doctors (run ${RUN}) ===`);

  // ---- Steps 5-6: register + login doctors ----
  elog("\n[5-6] Doctor registration + login");
  const doctors = [];
  for (let d = 1; d <= NDOC; d++) {
    const email = `e2e-doc${d}-${RUN}@example.com`;
    const name = `Dr E2E ${d}`;
    const su = await signup(email, name, "doctor", { specialty: d % 2 ? "Internal Medicine 内科" : "Gynecology 妇科", bio: `Experienced TCM physician #${d}.`, yearsExperience: 10 + d });
    check(`doctor${d}.register_role_doctor`, su.ok && su.role === "doctor", `role=${su.role} status=${su.raw.status}`);
    const li = await login(email);
    check(`doctor${d}.login`, li.ok && li.role === "doctor" && !!li.token, `role=${li.role} hasToken=${!!li.token}`);
    doctors.push({ email, name, id: li.userId, token: li.token });
  }

  // ---- Doctor directory (step 10) ----
  elog("\n[10] Doctor directory");
  const dir = await api("/api/doctors");
  const dirDocs = (dir.json && dir.json.doctors) || [];
  const dirIds = new Set(dirDocs.map((x) => x.id));
  check("directory.lists_registered_doctors", doctors.every((d) => dirIds.has(d.id)), `dir has ${dirDocs.length}, expected ids ${doctors.map((d) => d.id).join(",")}`);
  const e2eInDir = dirDocs.filter((x) => doctors.some((d) => d.id === x.id));
  check("directory.has_details", e2eInDir.length === doctors.length && e2eInDir.every((x) => x.full_name && x.specialty && x.bio), `e2e doctors with details ${e2eInDir.filter((x) => x.full_name && x.specialty && x.bio).length}/${doctors.length}`);

  // ---- Per-patient full journey ----
  const patients = [];
  for (let p = 1; p <= NPAT; p++) {
    elog(`\n--- Patient ${p} ---`);
    const email = `e2e-pat${p}-${RUN}@example.com`;
    const name = `Patient E2E ${p}`;
    const chosen = doctors[(p - 1) % doctors.length]; // patient's own selection

    // [1] Guest generates report + saves guest session
    const gReport = await consult(DATA(["fatigue", "insomnia"]));
    check(`p${p}.1.guest_report_generated`, !!gReport && !!(gReport.diagnosis), "guest consult did not return a valid report");
    const gSave = await api("/api/guest/sessions", { method: "POST", body: { full_report: gReport, primary_diagnosis: gReport && gReport.diagnosis && gReport.diagnosis.primary_pattern, constitution: gReport && gReport.constitution && gReport.constitution.type, symptoms: "fatigue, insomnia", guest_name: name } });
    const guestToken = gSave.json && gSave.json.session_token;
    check(`p${p}.1.guest_session_saved`, gSave.status === 201 && !!guestToken, `status=${gSave.status}`);

    // [2] Register as user
    const su = await signup(email, name, "patient");
    check(`p${p}.2.register`, su.ok && su.role === "patient" && !!su.token, `role=${su.role} status=${su.raw.status}`);
    const token = su.token;

    // [3] Login + migrate guest session → previous report visible
    await api("/api/migrate-guest-session", { method: "POST", token, body: { sessionToken: guestToken } });
    const li = await login(email);
    const listAfterMigrate = await api("/api/patient/sessions", { token: li.token });
    const nAfterMigrate = ((listAfterMigrate.json && listAfterMigrate.json.sessions) || []).length;
    check(`p${p}.3.login_sees_previous_report`, nAfterMigrate >= 1, `sessions after migrate=${nAfterMigrate}`);

    // [4] Assessment again while logged in
    const report2 = await consult(DATA(["headache", "anxiety"]));
    check(`p${p}.4.second_report`, !!report2 && !!report2.diagnosis, "second consult failed");
    await api("/api/patient/sessions", { method: "POST", token: li.token, body: { full_report: report2, primary_diagnosis: report2 && report2.diagnosis && report2.diagnosis.primary_pattern, constitution: report2 && report2.constitution && report2.constitution.type, symptoms: "headache, anxiety" } });
    const listAfter2 = await api("/api/patient/sessions", { token: li.token });
    const nAfter2 = ((listAfter2.json && listAfter2.json.sessions) || []).length;
    check(`p${p}.4.two_reports_saved`, nAfter2 >= 2, `sessions=${nAfter2} (want >=2)`);

    // [7+10] Patient picks a doctor from the directory → routes record to that doctor
    const vr = await api("/api/verification-request", { method: "POST", body: { userId: li.userId, doctorId: chosen.id, doctorName: chosen.name, patientData: { name, email }, reportData: report2 } });
    const requestId = vr.json && vr.json.data && vr.json.data.id;
    check(`p${p}.7.request_routed`, vr.status === 200 && !!requestId, `status=${vr.status}`);

    patients.push({ p, email, name, token: li.token, userId: li.userId, chosen, requestId });
  }

  // ---- [7] Each doctor sees ONLY the requests routed to them ----
  elog("\n[7] Doctor inbox routing");
  for (const doc of doctors) {
    const inbox = await api("/api/doctor/requests", { token: doc.token });
    const reqs = (inbox.json && inbox.json.requests) || [];
    const expected = patients.filter((pt) => pt.chosen.id === doc.id);
    const gotIds = new Set(reqs.map((x) => x.id));
    const allExpectedPresent = expected.every((pt) => gotIds.has(pt.requestId));
    const noForeign = reqs.every((x) => x.doctor_id === doc.id);
    check(`${doc.name}.inbox_has_assigned`, allExpectedPresent, `expected ${expected.length} reqs, inbox has ${reqs.length}`);
    check(`${doc.name}.inbox_no_foreign`, noForeign, "inbox contains a request not assigned to this doctor");
  }

  // ---- [8] Doctor reviews + replies; patient sees feedback ----
  elog("\n[8] Doctor feedback → patient");
  for (const pt of patients) {
    const doc = pt.chosen;
    const feedback = `Reviewed by ${doc.name}: your pattern looks consistent with the AI assessment. Please rest and follow the dietary advice.`;
    const reply = await api("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: pt.requestId, message: feedback, targetTable: "inquiries" } });
    check(`p${pt.p}.8.doctor_replied`, reply.status === 200, `status=${reply.status}`);

    const mine = await api("/api/patient/requests", { token: pt.token });
    const rows = (mine.json && mine.json.requests) || [];
    const row = rows.find((x) => x.id === pt.requestId);
    const msgs = (row && row.diagnosis_report && row.diagnosis_report.messages) || [];
    const docMsg = msgs.find((m) => m.role === "doctor" && m.content && m.content.includes(doc.name));
    check(`p${pt.p}.8.patient_sees_feedback`, !!docMsg && row.status === "reviewed", `status=${row && row.status} hasDocMsg=${!!docMsg}`);
  }

  // ---- [9] Doctor auth isolation: a patient token cannot read the doctor inbox ----
  elog("\n[9] Access control");
  const leak = await api("/api/doctor/requests", { token: patients[0].token });
  check("access.patient_cannot_read_doctor_inbox", leak.status === 403 || leak.status === 401, `status=${leak.status} (want 401/403)`);

  const passed = checks.filter((c) => c.ok).length;
  const verdict = { ok: checks.every((c) => c.ok), passed, total: checks.length, base: BASE, run: RUN, failures: checks.filter((c) => !c.ok) };
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(verdict.ok ? 0 : 1);
}

main().catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
