/**
 * doctor_approval — the doctor-approval flow itself (changed on purpose in the QA+fix round):
 *   a self-registered doctor is NOT approved. Until an admin approves the account (POST /api/admin/doctors/approve,
 *   admin only; GET /api/admin/doctors lists the accounts with their state) the doctor
 *     - is absent from the public directory GET /api/doctors,
 *     - cannot use any doctor-only API (inbox, flag, reply, treatment plan, generate-inquiry, patient-summary) -> 403,
 *     - is bounced from the /doctor page to /patient,
 *     - cannot be chosen by a patient (verification-request must refuse an unapproved target).
 *   Approve lists + unlocks the SAME token (no re-login); suspend (approved:false) locks it again.
 * Failing checks are real app defects (see the detail strings); do not weaken them.
 */
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";

export default {
  name: "doctor_approval", needs: "stack", mutating: true, costly: false,
  doc: "doctor approval flow: unapproved doctor hidden from the directory, locked out of the doctor APIs/page and not choosable; admin approve lists+unlocks, suspend locks again; only admin may approve/list; validation of the approve body",
  async run(t) {
    const u = t.uniq();
    const H = (o = {}) => ({ ...o, headers: { "X-Forwarded-For": t.ip(), ...(o.headers || {}) } });
    const api = (path, o = {}) => t.api(path, H(o));
    const dirIds = async () => ((await api("/api/doctors")).json?.doctors || []).map((d) => d.id);

    /* ---------- identities ---------- */
    const admin = await t.login("admin@sihat.com", PW, t.ip());
    const dev = await t.login("developer@sihat.com", PW, t.ip());
    const demoDoc = await t.login("doctor@sihat.com", PW, t.ip());
    const pat = await t.signup(`da-pat-${u}@example.com`, "DA Patient", "patient", {}, t.ip());
    const X = await t.signup(`da-x-${u}@example.com`, "Dr DA Pending", "doctor", { specialty: "Pending 内科", bio: "awaits approval" }, t.ip());
    const Y = await t.signup(`da-y-${u}@example.com`, "Dr DA Other", "doctor", { specialty: "Other" }, t.ip());
    const ready = admin.token && dev.token && demoDoc.token && pat.token && X.token && X.id && Y.token && Y.id;
    t.check("setup.identities", !!ready, `admin=${!!admin.token} dev=${!!dev.token} demoDoc=${!!demoDoc.token} pat=${!!pat.token} X=${!!X.token}/${X.id} Y=${!!Y.token}/${Y.id} (every check below would pass vacuously)`);
    if (!ready) return;
    t.check("signup.doctor_role_kept", X.role === "doctor", `signup role=${X.role} (a pending doctor is still a doctor, just not approved)`);

    // a request routed to the (approved) demo doctor: the target of the "unapproved doctor tries to act" probes
    const vr = await api("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: demoDoc.id, doctorName: "Demo Doctor", patientData: { name: "DA Patient" }, reportData: { diagnosis: { primary_pattern: "DA-PATTERN" } } } });
    const rid = vr.json?.data?.id;
    t.check("setup.request_to_approved_doctor", vr.status === 200 && !!rid, `verification-request to the seeded approved doctor -> ${vr.status} ${vr.text.slice(0, 100)}`);
    if (!rid) return;

    /* ---------- A. unapproved: hidden + locked out ---------- */
    const me = await api("/api/auth/me", { token: X.token });
    t.check("unapproved.me_reports_not_approved", me.status === 200 && me.json?.user?.role === "doctor" && me.json?.user?.is_approved === false, `GET /api/auth/me -> ${me.status} ${JSON.stringify(me.json?.user)} (want role=doctor is_approved=false)`);
    const ids0 = await dirIds();
    t.check("unapproved.not_in_directory", !ids0.includes(X.id) && !ids0.includes(Y.id), "an unapproved doctor is listed in GET /api/doctors");
    t.check("unapproved.directory_still_lists_seeded_doctors", ids0.includes(demoDoc.id), "the seeded approved demo doctor vanished from the directory");
    const msgsOf = async () => ((await api("/api/patient/requests", { token: pat.token })).json?.requests || []).find((x) => x.id === rid)?.diagnosis_report?.messages?.length ?? -1;
    const before = await msgsOf();
    const blocked = [
      ["inbox", { path: "/api/doctor/requests", token: X.token }],
      ["flag", { path: "/api/doctor/flag", method: "POST", token: X.token, body: { requestId: rid, flag: "critical" } }],
      ["reply", { path: "/api/doctor/reply", method: "POST", token: X.token, body: { requestId: rid, message: "unapproved intruder", targetTable: "inquiries" } }],
      ["treatment_plan", { path: "/api/doctor/treatment-plan", method: "POST", token: X.token, body: { requestId: rid, plan: { herbs: "intruder" } } }],
      ["generate_inquiry", { path: "/api/doctor/generate-inquiry", method: "POST", token: X.token, body: { patientInfo: { age: 30 }, symptoms: "x" } }],
      ["patient_summary", { path: "/api/ai/patient-summary", method: "POST", token: X.token, body: { patientId: crypto.randomUUID() } }],
    ];
    for (const [label, o] of blocked) {
      const { path, ...rest } = o;
      const r = await api(path, rest);
      t.check(`unapproved.${label}_403`, r.status === 403, `unapproved doctor ${rest.method || "GET"} ${path} -> ${r.status} (want 403)`);
    }
    const inbox = await api("/api/doctor/requests", { token: X.token });
    t.check("unapproved.inbox_leaks_no_patient_data", !/DA-PATTERN|DA Patient/.test(inbox.text) && !inbox.json?.requests, `inbox body: ${inbox.text.slice(0, 100)}`);
    t.check("unapproved.attempts_changed_nothing", (await msgsOf()) === before && before >= 0, `thread messages ${before} -> ${await msgsOf()} (an unapproved doctor's reply/plan landed)`);
    const pg = await fetch(t.base + "/doctor", { headers: { Cookie: "sb-access-token=" + X.token, "X-Forwarded-For": t.ip() }, redirect: "manual" });
    await pg.text();
    t.check("unapproved.doctor_page_bounced_to_patient", pg.status === 302 && pg.headers.get("location") === "/patient", `GET /doctor -> ${pg.status} ${pg.headers.get("location")} (want 302 /patient)`);
    const ch = await api("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: X.id, doctorName: "Dr DA Pending", patientData: { name: "DA Patient" }, reportData: {} } });
    t.check("unapproved.cannot_be_chosen_by_a_patient", ch.status >= 400 && ch.status < 500, `verification-request to an UNAPPROVED doctor -> ${ch.status} (want a 4xx: only approved doctors may be chosen; handlers_data.go:716 looks the target up by role=doctor only, without is_approved=true)`);

    /* ---------- B. only admin may list / approve ---------- */
    const list0 = await api("/api/admin/doctors", { token: admin.token });
    const rowOf = (l, id) => (l.json?.doctors || []).find((d) => d.id === id);
    t.check("admin.list_ok", list0.status === 200 && Array.isArray(list0.json?.doctors), `GET /api/admin/doctors -> ${list0.status}`);
    t.check("admin.list_shows_pending_doctor", rowOf(list0, X.id)?.is_approved === false && rowOf(list0, Y.id)?.is_approved === false, `X=${JSON.stringify(rowOf(list0, X.id))} Y=${JSON.stringify(rowOf(list0, Y.id))} (want both is_approved=false)`);
    t.check("admin.list_shows_seeded_doctor_approved", rowOf(list0, demoDoc.id)?.is_approved === true, `seeded doctor row=${JSON.stringify(rowOf(list0, demoDoc.id))}`);
    t.check("admin.list_has_no_secrets", !/password|token|hash/i.test(list0.text), "credential-like text in the doctors list");
    for (const [who, tok] of [["anon", ""], ["patient", pat.token], ["pending_doctor_self", X.token], ["approved_doctor", demoDoc.token], ["developer", dev.token]]) {
      const l = await api("/api/admin/doctors", { token: tok || undefined });
      const ap = await api("/api/admin/doctors/approve", { method: "POST", token: tok || undefined, body: { id: X.id } });
      const want = who === "anon" ? 401 : 403;
      t.check(`forbidden.${who}_cannot_list`, l.status === want, `${who} GET /api/admin/doctors -> ${l.status} (want ${want})`);
      t.check(`forbidden.${who}_cannot_approve`, ap.status === want, `${who} POST /api/admin/doctors/approve -> ${ap.status} (want ${want})`);
    }
    const stillHidden = !(await dirIds()).includes(X.id);
    const stillBlocked = (await api("/api/doctor/requests", { token: X.token })).status === 403;
    t.check("forbidden.attempts_did_not_approve", stillHidden && stillBlocked, `after the refused approvals: hidden=${stillHidden} inboxBlocked=${stillBlocked} (a non-admin approval went through)`);

    /* ---------- C. approve body validation ---------- */
    const ap = (body, tok = admin.token) => api("/api/admin/doctors/approve", { method: "POST", token: tok, body });
    t.check("validate.missing_id_400", (await ap({})).status === 400, "approve without id must be 400");
    t.check("validate.non_uuid_id_400", (await ap({ id: "not-a-uuid" })).status === 400, "approve with a non-UUID id must be 400");
    t.check("validate.filter_injection_id_400", (await ap({ id: "x&role=neq.zzz" })).status === 400, "approve with PostgREST metacharacters in id must be 400");
    t.check("validate.unknown_uuid_404", (await ap({ id: crypto.randomUUID() })).status === 404, "approve of a non-existent profile must be 404");
    const onPatient = await ap({ id: pat.id });
    const patMe = await api("/api/auth/me", { token: pat.token });
    t.check("validate.cannot_approve_a_patient_profile", onPatient.status === 404 && patMe.json?.user?.role === "patient", `approve(patient id) -> ${onPatient.status}, role still ${patMe.json?.user?.role} (the filter must be role=doctor)`);
    const asStr = await ap({ id: X.id, approved: "false" });
    t.check("validate.string_approved_rejected_400", asStr.status === 400, `approved:"false" (string) -> ${asStr.status} (want 400, never a silent approval)`);
    t.check("validate.invalid_body_did_not_approve", !(await dirIds()).includes(X.id), "a rejected approve call approved the doctor anyway");
    const badJson = await api("/api/admin/doctors/approve", { method: "POST", token: admin.token, raw: true, body: "{not json", headers: { "Content-Type": "application/json" } });
    t.check("validate.invalid_json_400", badJson.status === 400, `invalid JSON -> ${badJson.status}`);

    /* ---------- D. approve: listed + unlocked with the SAME token ---------- */
    const a1 = await ap({ id: X.id });
    t.check("approve.ok_default_true", a1.status === 200 && a1.json?.success === true && a1.json?.is_approved === true && a1.json?.id === X.id, `approve (no 'approved' field) -> ${a1.status} ${a1.text.slice(0, 100)}`);
    const ids1 = await dirIds();
    t.check("approve.listed_in_directory", ids1.includes(X.id), "an admin-approved doctor is missing from GET /api/doctors");
    t.check("approve.other_pending_doctor_still_hidden", !ids1.includes(Y.id), "approving X also listed Y");
    const dirRow = ((await api("/api/doctors")).json?.doctors || []).find((d) => d.id === X.id);
    t.check("approve.directory_row_has_profile_fields", dirRow?.full_name === "Dr DA Pending" && dirRow?.specialty === "Pending 内科" && !("email" in (dirRow || {})), `row=${JSON.stringify(dirRow)} (full_name+specialty present, a non-demo doctor's email stays private)`);
    t.check("approve.list_reflects_state", rowOf(await api("/api/admin/doctors", { token: admin.token }), X.id)?.is_approved === true, "GET /api/admin/doctors does not show X as approved");
    const inb = await api("/api/doctor/requests", { token: X.token });
    t.check("approve.same_token_unlocks_inbox", inb.status === 200 && Array.isArray(inb.json?.requests), `inbox with the pre-approval token -> ${inb.status}`);
    t.check("approve.me_reports_approved", (await api("/api/auth/me", { token: X.token })).json?.user?.is_approved === true, "GET /api/auth/me still says is_approved=false");
    const pg2 = await fetch(t.base + "/doctor", { headers: { Cookie: "sb-access-token=" + X.token, "X-Forwarded-For": t.ip() }, redirect: "manual" });
    await pg2.text();
    t.check("approve.doctor_page_opens", pg2.status === 200, `GET /doctor after approval -> ${pg2.status}`);
    const ch2 = await api("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: X.id, doctorName: "Dr DA Pending", patientData: { name: "DA Patient" }, reportData: { diagnosis: { primary_pattern: "DA-X-PATTERN" } } } });
    const rid2 = ch2.json?.data?.id;
    t.check("approve.patient_can_choose_doctor", ch2.status === 200 && !!rid2, `verification-request to the approved doctor -> ${ch2.status}`);
    const fl = await api("/api/doctor/flag", { method: "POST", token: X.token, body: { requestId: rid2 || rid, flag: "watch" } });
    t.check("approve.doctor_can_act", fl.status === 200, `approved doctor POST /api/doctor/flag -> ${fl.status}`);

    /* ---------- E. suspend (approved:false) locks the SAME token again; re-approve restores ---------- */
    const s1 = await ap({ id: X.id, approved: false });
    t.check("suspend.ok", s1.status === 200 && s1.json?.is_approved === false, `approved:false -> ${s1.status} ${s1.text.slice(0, 100)}`);
    t.check("suspend.hidden_from_directory", !(await dirIds()).includes(X.id), "a suspended doctor is still listed");
    t.check("suspend.inbox_403_again", (await api("/api/doctor/requests", { token: X.token })).status === 403, "a suspended doctor keeps inbox access");
    t.check("suspend.cannot_be_chosen", (await api("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: X.id, doctorName: "Dr DA Pending", patientData: {}, reportData: {} } })).status >= 400, "a suspended doctor can still be chosen by a patient (handlers_data.go:716)");
    t.check("suspend.list_reflects_state", rowOf(await api("/api/admin/doctors", { token: admin.token }), X.id)?.is_approved === false, "admin list does not show the suspension");
    const s2 = await ap({ id: X.id, approved: true });
    t.check("reapprove.ok", s2.status === 200 && (await dirIds()).includes(X.id) && (await api("/api/doctor/requests", { token: X.token })).status === 200, `approved:true -> ${s2.status}`);
  },
};
