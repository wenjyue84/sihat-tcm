/**
 * hunt_mutation — regression-suite gaps found by MUTATION TESTING ("who tests the tests").
 *
 * ~110 small deliberate mutants were applied to a scratch copy of internal/server + internal/localdb (flip a role list,
 * drop a validator, move a limit by one, drop a cookie flag ...) and run against `go test ./...` and
 * `aci test --suite=all --db=sqlite --ai=fake`. Every mutant that stayed GREEN is a hole in the suite; each check below
 * pins one of them (the mutant id is in the label: mNN = internal/server, lNN = internal/localdb, see
 * regress/README.md "Mutation testing"). Checks assert the CORRECT behaviour, so they pass on the unmutated app and go
 * red on the mutant. Section B holds cheap ACI-level twins of mutants that only the Go unit tests used to catch.
 */
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const tokOf = (sc) => ((sc || "").match(/sb-access-token=([^;]+)/) || [])[1] || "";

export default {
  name: "hunt_mutation", needs: "stack", mutating: true, costly: false,
  doc: "mutation-testing survivors: DELETE/PUT CSRF content-type, yearsExperience bound, reply status machine + 8000-char cap, status validation, session/log/metrics list limits, unapproved doctors hidden, developer on /doctor, migrate token validation, + ACI twins of Go-only kills",
  async run(t) {
    const u = t.uniq();
    const api = (path, o = {}) => t.api(path, { ...o, headers: { "X-Forwarded-For": o.ip || t.ip(), ...(o.headers || {}) } });
    const signup = async (role, extra = {}) => {
      const email = `hm-${role}-${t.uniq()}@example.com`;
      const r = await api("/api/auth/signup", { method: "POST", body: { email, password: PW, name: "HM " + role, role, ...extra } });
      return { r, email, token: tokOf(r.setCookie), id: r.json?.user?.id };
    };
    const login = async (email) => {
      const r = await api("/api/auth/login", { method: "POST", body: { email, password: PW } });
      return { r, token: tokOf(r.setCookie), id: r.json?.user?.id };
    };
    const dbAdmin = (init = {}) => {
      const k = t.stack?.dbKey;
      return { ...init, headers: { ...(init.headers || {}), ...(k ? { apikey: k, Authorization: "Bearer " + k } : {}) } };
    };

    /* ---------------- identities ---------------- */
    const A = await signup("patient");
    const D = await signup("doctor", { specialty: "HM", bio: "mutation" });
    const admin = await login("admin@sihat.com");
    const dev = await login("developer@sihat.com");
    // a self-registered doctor is not approved: the admin approves through the API (POST /api/admin/doctors/approve)
    const approve = async (id, approved = true) => (await api("/api/admin/doctors/approve", { method: "POST", token: admin.token, body: { id, approved } })).status;
    const apSt = admin.token && D.id ? await approve(D.id) : 0;
    t.check("setup.doctor_approved_by_admin", apSt === 200, `approve -> ${apSt} (the doctor-side checks below need an approved doctor)`);
    const ready = !!(A.token && A.id && D.token && D.id && admin.token && dev.token && apSt === 200);
    t.check("setup.identities", ready, `A=${!!A.token} D=${!!D.token} admin=${!!admin.token} dev=${!!dev.token} (the checks below would pass vacuously)`);
    if (!ready) return;

    /* ================= A. survivors (no layer caught them) ================= */

    // m05: writeMethod() forgot DELETE -> a text/plain (cross-site "simple request") DELETE is accepted by cookie sessions
    {
      const d1 = await api("/api/notifications/register-device?deviceToken=hm-dev-" + u, { method: "DELETE", token: A.token, raw: true, body: "deviceToken=x", headers: { "Content-Type": "text/plain" } });
      t.check("m05.delete_register_device_requires_json", d1.status === 400, `DELETE /api/notifications/register-device text/plain -> ${d1.status} (want 400 Content-Type must be application/json)`);
      const d2 = await api("/api/notifications/schedule?id=hm-sched-" + u, { method: "DELETE", token: A.token, raw: true, body: "id=1", headers: { "Content-Type": "text/plain" } });
      t.check("m05.delete_schedule_requires_json", d2.status === 400, `DELETE /api/notifications/schedule text/plain -> ${d2.status} (want 400)`);
      const p1 = await api("/api/patient/profile", { method: "PUT", token: A.token, raw: true, body: "full_name=x", headers: { "Content-Type": "text/plain" } });
      t.check("m05.put_profile_requires_json", p1.status === 400, `PUT /api/patient/profile text/plain -> ${p1.status} (want 400)`);
    }

    // m20: yearsExperience upper bound is 80 (documented 0..80)
    {
      const ip = t.ip();
      const mk = (y) => api("/api/auth/signup", { method: "POST", ip, body: { email: `hm-yrs-${t.uniq()}@example.com`, password: PW, name: "HM Yrs", role: "doctor", yearsExperience: y } });
      const ok80 = await mk(80), bad81 = await mk(81), bad1k = await mk(1000), badNeg = await mk(-1);
      t.check("m20.years_80_accepted", ok80.status === 200, `yearsExperience=80 -> ${ok80.status}`);
      t.check("m20.years_81_rejected", bad81.status === 400, `yearsExperience=81 -> ${bad81.status} (want 400 "between 0 and 80")`);
      t.check("m20.years_1000_rejected", bad1k.status === 400, `yearsExperience=1000 -> ${bad1k.status} (want 400)`);
      t.check("m20.years_negative_rejected", badNeg.status === 400, `yearsExperience=-1 -> ${badNeg.status} (want 400)`);
    }

    // m27 / m28 / m29 / m32: the doctor <-> patient status machine and the reply validators
    const vr = await api("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: D.id, doctorName: "Dr HM", patientData: { name: "HM A" }, reportData: { diagnosis: { primary_pattern: "HM-PATTERN" } } } });
    const rid = vr.json?.data?.id;
    t.check("setup.request_created", !!rid, `verification-request -> ${vr.status} ${vr.text.slice(0, 120)}`);
    if (rid) {
      const statusOf = async (token) => {
        const r = await api("/api/patient/requests", { token });
        return (r.json?.requests || []).find((x) => x.id === rid)?.status;
      };
      const doctorSees = async () => {
        const r = await api("/api/doctor/requests", { token: D.token });
        return (r.json?.requests || []).find((x) => x.id === rid)?.status;
      };
      t.check("m27.new_request_is_pending", (await statusOf(A.token)) === "pending", "freshly created request must be pending");

      // m32 first (rejections must not change anything)
      for (const [label, st] of [["ampersand", "a&b=c"], ["too_long", "x".repeat(33)], ["newline", "bad\nstatus"], ["percent", "50%"]]) {
        const r = await api("/api/doctor/reply", { method: "POST", token: D.token, body: { requestId: rid, message: "hm status probe", status: st, targetTable: "inquiries" } });
        t.check(`m32.reply_status_${label}_rejected`, r.status === 400, `status=${JSON.stringify(st).slice(0, 40)} -> ${r.status} (want 400 invalid status)`);
      }
      t.check("m32.rejected_statuses_changed_nothing", (await statusOf(A.token)) === "pending", `request status after the rejected replies = ${await statusOf(A.token)} (want still pending)`);

      // m29: 8000-rune cap on doctor reply, patient reply, profile.medical_history
      const long = "药".repeat(8001);
      const dl = await api("/api/doctor/reply", { method: "POST", token: D.token, body: { requestId: rid, message: long, targetTable: "inquiries" } });
      t.check("m29.doctor_reply_8001_chars_rejected", dl.status === 400, `8001-rune doctor reply -> ${dl.status} (want 400)`);
      const pl = await api("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: rid, message: long } });
      t.check("m29.patient_reply_8001_chars_rejected", pl.status === 400, `8001-rune patient reply -> ${pl.status} (want 400)`);
      const ml = await api("/api/patient/profile", { method: "PUT", token: A.token, body: { medical_history: long } });
      t.check("m29.profile_history_8001_chars_rejected", ml.status === 400, `8001-rune medical_history -> ${ml.status} (want 400 profile field too long)`);
      const pe = await api("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: rid, message: "药".repeat(8000) } });
      t.check("m29.patient_reply_8000_chars_accepted", pe.status === 200, `exactly 8000 runes -> ${pe.status} (want 200: the cap is inclusive)`);

      // m28: a doctor reply WITHOUT an explicit status moves the request out of "pending"
      const dr = await api("/api/doctor/reply", { method: "POST", token: D.token, body: { requestId: rid, message: "HM doctor reply", targetTable: "inquiries" } });
      t.check("m28.doctor_reply_ok", dr.status === 200, `doctor reply -> ${dr.status}`);
      t.check("m28.reply_without_status_sets_reviewed_in_body", dr.json?.data?.status === "reviewed", `response status=${dr.json?.data?.status} (want reviewed)`);
      t.check("m28.patient_sees_reviewed_column", (await statusOf(A.token)) === "reviewed", `patient list status after doctor reply = ${await statusOf(A.token)} (want reviewed)`);
      t.check("m28.doctor_inbox_sees_reviewed", (await doctorSees()) === "reviewed", `doctor inbox status = ${await doctorSees()} (want reviewed)`);

      // m27: a patient follow-up re-opens it
      const pf = await api("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: rid, message: "HM patient follow-up" } });
      t.check("m27.patient_followup_ok", pf.status === 200 && pf.json?.data?.status === "pending", `patient follow-up -> ${pf.status} data.status=${pf.json?.data?.status} (want pending)`);
      t.check("m27.followup_reopens_column_for_patient", (await statusOf(A.token)) === "pending", `status column after patient follow-up = ${await statusOf(A.token)} (want pending)`);
      t.check("m27.followup_reopens_column_for_doctor", (await doctorSees()) === "pending", `doctor inbox status after patient follow-up = ${await doctorSees()} (want pending)`);

      // b: m30/m31/m41/m42 twins (flag + empty message)
      const empty = await api("/api/doctor/reply", { method: "POST", token: D.token, body: { requestId: rid, message: "", targetTable: "inquiries" } });
      t.check("m30.doctor_reply_empty_message_400", empty.status === 400, `empty doctor message -> ${empty.status} (want 400)`);
      const ws = await api("/api/patient/reply", { method: "POST", token: A.token, body: { requestId: rid, message: "   \n\t " } });
      t.check("m31.patient_reply_whitespace_only_400", ws.status === 400, `whitespace-only patient message -> ${ws.status} (want 400)`);
      // m42 (contract changed on purpose): an unknown / empty / null flag used to be coerced to "normal", silently downgrading
      // a critical case. It is now a 400 and the stored flag is left untouched; the three real flags are accepted verbatim.
      const flagNow = async () => (await api("/api/doctor/requests", { token: D.token })).json?.requests?.find((x) => x.id === rid)?.flag;
      const fgCrit = await api("/api/doctor/flag", { method: "POST", token: D.token, body: { requestId: rid, flag: "critical" } });
      t.check("m42.critical_flag_accepted", fgCrit.status === 200 && fgCrit.json?.flag === "critical" && (await flagNow()) === "critical", `flag="critical" -> ${fgCrit.status} flag=${fgCrit.json?.flag} stored=${await flagNow()} (want 200 + critical)`);
      for (const [label, bodyFlag] of [["bogus", "bogus"], ["empty", ""], ["null", null], ["uppercase", "CRITICAL"], ["filter_injection", "watch&id=neq.0"]]) {
        const fgBad = await api("/api/doctor/flag", { method: "POST", token: D.token, body: { requestId: rid, flag: bodyFlag } });
        t.check(`m42.unknown_flag_${label}_rejected_400`, fgBad.status === 400, `flag=${JSON.stringify(bodyFlag)} -> ${fgBad.status} (want 400 "flag must be normal, watch or critical")`);
      }
      t.check("m42.rejected_flags_did_not_downgrade_critical", (await flagNow()) === "critical", `stored flag after the rejected calls = ${await flagNow()} (want still critical: a malformed call must never downgrade a triage flag)`);
      for (const f of ["watch", "normal"]) {
        const ok = await api("/api/doctor/flag", { method: "POST", token: D.token, body: { requestId: rid, flag: f } });
        t.check(`m42.flag_${f}_accepted`, ok.status === 200 && ok.json?.flag === f && (await flagNow()) === f, `flag=${f} -> ${ok.status} stored=${await flagNow()}`);
      }
      const fgGhost = await api("/api/doctor/flag", { method: "POST", token: D.token, body: { requestId: crypto.randomUUID(), flag: "watch" } });
      t.check("m41.flag_unknown_request_404", fgGhost.status === 404, `flag on a non-existent request -> ${fgGhost.status} (want 404)`);
    }

    // m36: GET /api/patient/sessions returns at most 50 rows, newest first
    {
      const P = await signup("patient");
      let created = 0;
      const mk = async (i) => { const r = await api("/api/patient/sessions", { method: "POST", token: P.token, body: { primary_diagnosis: "HM-" + i, symptoms: "a, b", full_report: { i } } }); if (r.status === 201) created++; };
      for (let i = 0; i < 52; i += 13) await Promise.all(Array.from({ length: 13 }, (_, j) => mk(i + j)));
      t.check("m36.setup_52_sessions", created === 52, `created ${created}/52 sessions`);
      const l = await api("/api/patient/sessions", { token: P.token });
      const rows = l.json?.sessions || [];
      t.check("m36.sessions_list_limit_is_50", rows.length === 50, `GET /api/patient/sessions returned ${rows.length} rows with 52 stored (want exactly 50)`);
      const times = rows.map((r) => Date.parse(r.created_at));
      t.check("m36.sessions_newest_first", rows.length > 1 && times.every((x, i) => i === 0 || times[i - 1] >= x), "sessions are not ordered newest first");
    }

    // m44: an unapproved doctor is not in the public directory; admin approval lists them, suspension hides them again
    {
      const U = await signup("doctor", { specialty: "HM-unapproved" });
      const ids = async () => ((await api("/api/doctors")).json?.doctors || []).map((d) => d.id);
      t.check("m44.directory_hides_unapproved_doctor", !(await ids()).includes(U.id), "a freshly self-registered (unapproved) doctor is listed in GET /api/doctors");
      t.check("m44.directory_still_lists_approved_doctor", (await ids()).includes(D.id), "the approved doctor vanished from GET /api/doctors");
      t.check("m44.admin_approve_lists_doctor", (await approve(U.id)) === 200 && (await ids()).includes(U.id), "an admin-approved doctor is not listed");
      t.check("m44.admin_suspend_hides_doctor", (await approve(U.id, false)) === 200 && !(await ids()).includes(U.id), "a suspended (approved:false) doctor is still listed");
      if (t.dbBase) {
        const patch = await fetch(`${t.dbBase}/rest/v1/profiles?id=eq.${U.id}`, dbAdmin({ method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ is_approved: false }) }));
        t.check("m44.setup_unapprove_via_db", patch.status === 200 || patch.status === 204, `PATCH is_approved=false -> ${patch.status}`);
        t.check("m44.directory_hides_db_unapproved_doctor", !(await ids()).includes(U.id), "an is_approved=false doctor is listed in GET /api/doctors");
      }
    }

    // m49: /api/logs limit capped at 200 (+ floor of 1, bad value -> default 50)
    if (t.hasDb) {
      const rows = Array.from({ length: 260 }, (_, i) => ({ level: "info", category: "hm-bulk", message: `hm-log-${u}-${i}` }));
      const ins = await t.dbInsert("system_logs", rows);
      t.check("m49.setup_260_logs", Array.isArray(ins) ? ins.length === 260 : false, `bulk insert -> ${JSON.stringify(ins).slice(0, 120)}`);
      const big = await api("/api/logs?limit=100000", { token: admin.token });
      t.check("m49.logs_limit_capped_at_200", big.json?.logs?.length === 200 && big.json?.count === 200, `limit=100000 returned ${big.json?.logs?.length} rows (want exactly 200)`);
      // contract changed on purpose: a non-positive / malformed limit used to be clamped UP to 1 (one row for "limit=0" or "1e2");
      // it now falls back to the default (50), while a valid limit is honoured exactly (limit=1 -> one row).
      for (const [label, v] of [["zero", "0"], ["negative", "-3"], ["exponent", "1e2"]]) {
        const r = await api("/api/logs?limit=" + v, { token: admin.token });
        t.check(`m49.logs_limit_${label}_falls_back_to_default_50`, r.json?.logs?.length === 50, `limit=${v} returned ${r.json?.logs?.length} rows (want the default 50, not a floor of 1)`);
      }
      const one = await api("/api/logs?limit=1", { token: admin.token });
      t.check("m49.logs_limit_1_returns_exactly_1", one.json?.logs?.length === 1, `limit=1 returned ${one.json?.logs?.length} rows (want 1)`);
      const lim7 = await api("/api/logs?limit=7", { token: admin.token });
      t.check("m49.logs_limit_7_honoured", lim7.json?.logs?.length === 7, `limit=7 returned ${lim7.json?.logs?.length} rows (want 7)`);
      const junk = await api("/api/logs?limit=abc", { token: admin.token });
      t.check("m49.logs_limit_junk_defaults_to_50", junk.json?.logs?.length === 50, `limit=abc returned ${junk.json?.logs?.length} rows (want the default 50)`);
    } else t.skip("m49.logs_limit_capped_at_200", "no db handle");

    // m53 / m54: metrics list default+cap 1000, ingest batch cap 500
    if (t.hasDb) {
      const mtype = "hm-bulk-" + u;
      const rows = Array.from({ length: 1100 }, (_, i) => ({ type: mtype, name: "n" + i, value: String(i), unit: "count" }));
      const ins = await t.dbInsert("system_metrics", rows);
      t.check("m53.setup_1100_metrics", Array.isArray(ins) ? ins.length === 1100 : false, `bulk insert -> ${JSON.stringify(ins).slice(0, 120)}`);
      const def = await api(`/api/monitoring/metrics?type=${mtype}`, { token: admin.token });
      t.check("m53.metrics_default_limit_is_1000", def.json?.count === 1000, `no limit param returned ${def.json?.count} rows with 1100 stored (want exactly 1000)`);
      const big = await api(`/api/monitoring/metrics?type=${mtype}&limit=99999`, { token: admin.token });
      t.check("m53.metrics_limit_capped_at_1000", big.json?.count === 1000, `limit=99999 returned ${big.json?.count} rows (want 1000)`);
    } else t.skip("m53.metrics_default_limit_is_1000", "no db handle");
    {
      const ip = t.ip();
      const batch = (n) => ({ type: "hm-ingest", metrics: Array.from({ length: n }, (_, i) => ({ name: "m" + i, value: i, unit: "count" })) });
      const over = await api("/api/monitoring/metrics", { method: "POST", ip, body: batch(501) });
      t.check("m54.metrics_batch_501_rejected", over.status === 400, `501 metrics in one POST -> ${over.status} (want 400)`);
      const ok = await api("/api/monitoring/metrics", { method: "POST", ip, body: batch(500) });
      t.check("m54.metrics_batch_500_accepted", ok.status === 200 && ok.json?.stored === 500, `500 metrics -> ${ok.status} stored=${ok.json?.stored} (want 200/500)`);
    }

    // m65: /doctor page is also open to the developer (and admin); patients are bounced to /patient
    {
      const page = async (token, path) => { const r = await fetch(t.base + path, { headers: { Cookie: "sb-access-token=" + token, "X-Forwarded-For": t.ip() }, redirect: "manual" }); await r.text(); return r; };
      const dv = await page(dev.token, "/doctor");
      t.check("m65.developer_can_open_doctor_page", dv.status === 200, `developer GET /doctor -> ${dv.status} ${dv.headers.get("location") || ""} (want 200)`);
      const ad = await page(admin.token, "/doctor");
      t.check("m65.admin_can_open_doctor_page", ad.status === 200, `admin GET /doctor -> ${ad.status} (want 200)`);
      const pt = await page(A.token, "/doctor");
      t.check("m65.patient_bounced_from_doctor_page", pt.status === 302 && (pt.headers.get("location") || "") === "/patient", `patient GET /doctor -> ${pt.status} ${pt.headers.get("location")} (want 302 /patient)`);
      const dd = await page(D.token, "/admin");
      t.check("m68.doctor_bounced_from_admin_to_doctor_page", dd.status === 302 && (dd.headers.get("location") || "") === "/doctor", `doctor GET /admin -> ${dd.status} ${dd.headers.get("location")} (want 302 /doctor)`);
    }

    // m73: the migrate-guest-session token is validated BEFORE it is concatenated into a PostgREST filter
    {
      const bad = await api("/api/migrate-guest-session", { method: "POST", token: A.token, body: { sessionToken: "zzz&session_token=neq.zzz" } });
      t.check("m73.migrate_rejects_filter_metacharacters", bad.status === 400 && /invalid sessionToken/i.test(bad.json?.error || ""), `status=${bad.status} error=${bad.json?.error} (want 400 "invalid sessionToken", not a DB lookup)`);
      const bad2 = await api("/api/migrate-guest-session", { method: "POST", token: A.token, body: { sessionToken: "a".repeat(65) } });
      t.check("m73.migrate_rejects_65_char_token", bad2.status === 400 && /invalid sessionToken/i.test(bad2.json?.error || ""), `65-char token: status=${bad2.status} error=${bad2.json?.error}`);
    }

    /* ================= B. ACI twins of mutants only the Go unit tests used to kill ================= */

    // m15: login password/email length caps answer 400 BEFORE touching the auth backend
    {
      const r = await api("/api/auth/login", { method: "POST", body: { email: "patient@sihat.com", password: "x".repeat(129) } });
      t.check("m15.login_129_char_password_400", r.status === 400, `129-char password -> ${r.status} (want 400, never reaching GoTrue)`);
      const r2 = await api("/api/auth/login", { method: "POST", body: { email: "a".repeat(250) + "@b.co", password: PW } });
      t.check("m15.login_overlong_email_400", r2.status === 400, `255-char email -> ${r2.status} (want 400)`);
    }
    // m21: reset-password enforces the password policy before it looks at the recovery token
    {
      const r = await api("/api/auth/reset-password", { method: "POST", body: { token_hash: "bogus-" + u, password: "short" } });
      t.check("m21.reset_password_policy_checked_first", r.status === 400 && /8 characters/i.test(r.json?.error || ""), `status=${r.status} error=${r.json?.error} (want the "at least 8 characters" message)`);
    }
    // m23: signup rejects an address without '@' with the app's own message
    {
      const r = await api("/api/auth/signup", { method: "POST", body: { email: "no-at-sign.example.com", password: PW } });
      t.check("m23.signup_email_without_at_rejected", r.status === 400 && /^a valid email address/i.test(r.json?.error || ""), `status=${r.status} error=${r.json?.error} (want the app's own "a valid email address ..." message, not the backend's "signup failed: invalid email")`);
    }
    // m34: guest session save drops unknown / server-controlled columns instead of 500-ing
    {
      const r = await api("/api/guest/sessions", { method: "POST", body: { primary_diagnosis: "HM-G", symptoms: "a", full_report: { diagnosis: { primary_pattern: "HM" } }, not_a_column: 1, user_id: crypto.randomUUID(), migrated_to_user_id: crypto.randomUUID() } });
      t.check("m34.guest_session_ignores_unknown_columns", r.status === 201 && !!r.json?.session_token, `status=${r.status} ${r.text.slice(0, 100)} (want 201 + session_token)`);
    }
    // m37: verification-request needs doctor name AND id
    {
      const r = await api("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: D.id, doctorName: "", patientData: {}, reportData: {} } });
      t.check("m37.verification_request_empty_doctor_name_400", r.status === 400, `empty doctorName -> ${r.status} (want 400)`);
      const r2 = await api("/api/verification-request", { method: "POST", token: A.token, body: { doctorId: A.id, doctorName: "Not A Doctor", patientData: {}, reportData: {} } });
      t.check("m77.verification_request_to_non_doctor_404", r2.status === 404, `doctorId of a PATIENT profile -> ${r2.status} (want 404 doctor not found)`);
    }
    // m45: profile language whitelist
    {
      const r = await api("/api/patient/profile", { method: "PUT", token: A.token, body: { preferred_language: "xx" } });
      t.check("m45.profile_language_whitelist", r.status === 400, `preferred_language=xx -> ${r.status} (want 400)`);
      const r2 = await api("/api/patient/profile", { method: "PUT", token: A.token, body: { age: "forty" } });
      t.check("m72.profile_age_must_be_number", r2.status === 400, `age="forty" -> ${r2.status} (want 400)`);
    }
    // m48 / m76: admin settings only accept whitelisted columns
    {
      const empty = await api("/api/admin/settings", { method: "PUT", token: admin.token, body: { definitely_not_a_setting: 1 } });
      t.check("m76.admin_settings_unknown_only_body_400", empty.status === 400, `unknown-only body -> ${empty.status} (want 400 no recognised settings)`);
      const idw = await api("/api/admin/settings", { method: "PUT", token: admin.token, body: { id: 987654, music_enabled: false } });
      t.check("m48.admin_settings_cannot_write_id", idw.status === 200 && idw.json?.settings?.id !== 987654, `PUT {id:987654} -> ${idw.status} settings.id=${idw.json?.settings?.id} (id is not a writable column)`);
    }
    // m51: a log line posted with a valid token records that user; an anonymous one records null
    if (t.hasDb) {
      const marker = `hm-marker-${u}`;
      await api("/api/logs", { method: "POST", token: D.token, body: { level: "info", category: "hm", message: marker + "-auth", metadata: {} } });
      await api("/api/logs", { method: "POST", body: { level: "info", category: "hm", message: marker + "-anon", metadata: {} } });
      const rows = (await t.dbTable("system_logs")) || [];
      const a = rows.find((r) => r.message === marker + "-auth"), b = rows.find((r) => r.message === marker + "-anon");
      t.check("m51.log_records_authenticated_user", a?.user_id === D.id, `user_id=${a?.user_id} (want ${D.id})`);
      t.check("m51.log_anonymous_has_null_user", b && (b.user_id === null || b.user_id === undefined), `anonymous user_id=${b?.user_id}`);
    } else t.skip("m51.log_records_authenticated_user", "no db handle");
    // m56 / m79: log filters + ingest validate their enum/token inputs
    {
      // contract changed on purpose: a category is free text of up to 100 characters without control characters
      // ("http request", "api/chat" are legitimate); only a control character or an over-long value is a 400.
      const cat = `hm cat ${u}`;
      const cp = await api("/api/logs", { method: "POST", body: { level: "info", category: cat, message: "hm-cat-space-" + u } });
      t.check("m56.logs_post_category_with_space_accepted", cp.status === 200 || cp.status === 201, `POST category=${JSON.stringify(cat)} -> ${cp.status} (want 2xx)`);
      const c = await api("/api/logs?category=" + encodeURIComponent(cat), { token: admin.token });
      t.check("m56.logs_get_category_with_space_filters", c.status === 200 && (c.json?.logs || []).length >= 1 && (c.json.logs).every((l) => l.category === cat), `category=${JSON.stringify(cat)} -> ${c.status} rows=${c.json?.logs?.length} cats=${[...new Set((c.json?.logs || []).map((l) => l.category))].join("|")} (want 200 and only that category)`);
      const cc = await api("/api/logs?category=a%0Ab", { token: admin.token });
      t.check("m56.logs_get_category_control_char_400", cc.status === 400, `category with a newline -> ${cc.status} (want 400)`);
      const cl = await api("/api/logs?category=" + "c".repeat(101), { token: admin.token });
      t.check("m56.logs_get_category_101_chars_400", cl.status === 400, `101-char category -> ${cl.status} (want 400)`);
      const cl100 = await api("/api/logs?category=" + "c".repeat(100), { token: admin.token });
      t.check("m56.logs_get_category_100_chars_ok", cl100.status === 200, `100-char category -> ${cl100.status} (want 200: the cap is inclusive)`);
      const pcl = await api("/api/logs", { method: "POST", body: { level: "info", category: "c".repeat(101), message: "x" } });
      t.check("m56.logs_post_category_101_chars_400", pcl.status === 400, `POST 101-char category -> ${pcl.status} (want 400)`);
      const pcc = await api("/api/logs", { method: "POST", body: { level: "info", category: "a\nb", message: "x" } });
      t.check("m56.logs_post_category_control_char_400", pcc.status === 400, `POST category with a newline -> ${pcc.status} (want 400)`);
      const lv = await api("/api/logs?level=fatal", { token: admin.token });
      t.check("m50.logs_get_unknown_level_400", lv.status === 400, `level=fatal -> ${lv.status} (want 400)`);
      const pl = await api("/api/logs", { method: "POST", body: { level: "fatal", category: "hm", message: "x" } });
      t.check("m79.logs_post_unknown_level_400", pl.status === 400, `POST level=fatal -> ${pl.status} (want 400)`);
    }
    // m55: >5 critical errors in 24h flips the overall status to "unhealthy"
    {
      for (let i = 0; i < 6; i++) await api("/api/admin/system-health", { method: "POST", body: { error_type: "hm-crit", message: `hm-critical-${u}-${i}`, severity: "critical" } });
      const h = await api("/api/admin/system-health", { token: admin.token });
      t.check("m55.six_critical_errors_is_unhealthy", (h.json?.error_statistics?.critical_errors ?? 0) >= 6 && h.json?.overall_status === "unhealthy", `critical=${h.json?.error_statistics?.critical_errors} overall=${h.json?.overall_status} (want unhealthy once critical>5)`);
    }
    // m62: default request-body cap is 2 MB (413 before the handler runs)
    {
      const big = JSON.stringify({ email: "patient@sihat.com", password: "x".repeat(3 << 20) });
      const r = await api("/api/auth/login", { method: "POST", raw: true, body: big });
      t.check("m62.default_body_cap_2mb_413", r.status === 413, `3 MB login body -> ${r.status} (want 413)`);
      const mid = JSON.stringify({ email: "patient@sihat.com", password: "x".repeat(1 << 20) });
      const r2 = await api("/api/auth/login", { method: "POST", raw: true, body: mid });
      t.check("m62.1mb_body_not_413", r2.status !== 413, `1 MB body -> ${r2.status} (below the cap)`);
    }
    // m61: the 2 MB cap also holds for a CHUNKED body (no Content-Length to inspect up front)
    {
      const { Readable } = await import("node:stream");
      const head = Buffer.from('{"email":"patient@sihat.com","password":"');
      const mid = Buffer.alloc(3 << 20, 120);
      const tail = Buffer.from('"}');
      const res = await fetch(t.base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": t.ip() }, body: Readable.from([head, mid, tail]), duplex: "half" }).catch((e) => ({ status: 0, err: String(e) }));
      t.check("m61.chunked_body_cap_413", res.status === 413, `3 MB chunked login body -> ${res.status} ${res.err || ""} (want 413)`);
    }
    // m63: versioned static URLs are immutable, unversioned ones must revalidate
    {
      const plain = await api("/static/css/app.css");
      const ver = await api("/static/css/app.css?v=1");
      t.check("m63.unversioned_static_is_no_cache", /no-cache/.test(plain.headers.get("cache-control") || "") && !/immutable/.test(plain.headers.get("cache-control") || ""), `Cache-Control=${plain.headers.get("cache-control")}`);
      t.check("m63.versioned_static_is_immutable", /immutable/.test(ver.headers.get("cache-control") || ""), `Cache-Control=${ver.headers.get("cache-control")}`);
    }
    // m33: a guest session can be migrated exactly once
    {
      const g = await api("/api/guest/sessions", { method: "POST", body: { primary_diagnosis: "HM-ONCE", symptoms: "a", full_report: { diagnosis: { primary_pattern: "HM" } } } });
      const tokG = g.json?.session_token;
      const first = await api("/api/migrate-guest-session", { method: "POST", token: A.token, body: { sessionToken: tokG } });
      const B = await signup("patient");
      const second = await api("/api/migrate-guest-session", { method: "POST", token: B.token, body: { sessionToken: tokG } });
      t.check("m33.guest_session_migrates_once", first.status === 200 && second.status === 400, `first=${first.status} second=${second.status} (want 200 then 400 already migrated)`);
      const bs = await api("/api/patient/sessions", { token: B.token });
      t.check("m33.second_user_got_no_copy", (bs.json?.sessions || []).length === 0, `second user owns ${(bs.json?.sessions || []).length} sessions after a refused migrate`);
    }
    /* ================= C. notifications (second mutation wave: N01..N13) ================= */
    {
      const P = await signup("patient");
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      // n06 / n07 / n11: a registered device is active, a deregistered one is gone from the sync payload
      const tok = "hm-dev-" + u;
      const reg = await api("/api/notifications/register-device", { method: "POST", token: P.token, body: { deviceToken: tok, deviceType: "ios", deviceName: "HM phone" } });
      t.check("n06.register_device_is_active", reg.status === 200 && reg.json?.device?.is_active === true, `register -> ${reg.status} is_active=${reg.json?.device?.is_active} (want true)`);
      const sync1 = await api("/api/notifications/sync", { token: P.token });
      const has = (j) => (j?.syncData?.devices || []).some((d) => d.device_token === tok);
      t.check("n06.sync_lists_registered_device", has(sync1.json), "an active, just-registered device is missing from GET /api/notifications/sync");
      const dereg = await api("/api/notifications/register-device?deviceToken=" + tok, { method: "DELETE", token: P.token });
      t.check("n07.deregister_ok", dereg.status === 200, `deregister -> ${dereg.status}`);
      const sync2 = await api("/api/notifications/sync", { token: P.token });
      t.check("n07.deregistered_device_not_in_sync", sync2.status === 200 && !has(sync2.json), "a deregistered device is still listed as active in GET /api/notifications/sync");

      // n05: every documented required field of a scheduled notification is enforced (category was not)
      const base = { notification_type: "hm-a", title: "T", body: "B", category: "health" };
      const hourAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
      const noCat = await api("/api/notifications/schedule", { method: "POST", token: P.token, body: { notification_type: "hm-a", title: "T", body: "B", scheduled_for: hourAgo(1) } });
      t.check("n05.schedule_requires_category", noCat.status === 400 && /category/.test(noCat.json?.error || ""), `no category -> ${noCat.status} ${noCat.json?.error} (want 400 missing required field: category)`);

      // n01 / n02 / n04 / n12: the schedule list order, the "pending" filter and the idempotent cancel
      const mk = async (type, whenISO) => (await api("/api/notifications/schedule", { method: "POST", token: P.token, body: { ...base, notification_type: type, scheduled_for: whenISO } })).json?.notification;
      const nA = await mk("hm-a", hourAgo(2)), nB = await mk("hm-b", hourAgo(1)), nC = await mk("hm-c", new Date(Date.now() + 24 * 3600e3).toISOString());
      t.check("n04.setup_three_notifications", !!(nA?.id && nB?.id && nC?.id), "could not create the three scheduled notifications");
      if (nA?.id && nB?.id && nC?.id) {
        const list = await api("/api/notifications/schedule", { token: P.token });
        const order = (list.json?.notifications || []).map((n) => n.notification_type).join(",");
        t.check("n04.schedule_list_is_ascending", order === "hm-a,hm-b,hm-c", `order=${order} (want scheduled_for ascending: hm-a,hm-b,hm-c)`);
        // the JS fake DB has no column DEFAULTs (is_sent/is_cancelled stay null), so the filters below only make sense on sqlite/real
        const fakeDb = t.dbMode === "fake";
        if (fakeDb) { t.skip("n01.pending_excludes_sent_and_future", "fake DB has no column defaults"); t.skip("n12.second_cancel_keeps_first_timestamp", "fake DB has no column defaults"); }
        else if (t.dbBase) {
          const mark = await fetch(`${t.dbBase}/rest/v1/scheduled_notifications?id=eq.${nB.id}`, dbAdmin({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_sent: true }) }));
          t.check("n01.setup_mark_sent", mark.status === 200 || mark.status === 204, `PATCH is_sent -> ${mark.status}`);
          const pend = await api("/api/notifications/schedule?pending=true", { token: P.token });
          const types = (pend.json?.notifications || []).map((n) => n.notification_type).sort().join(",");
          t.check("n01.pending_excludes_sent_and_future", types === "hm-a", `pending=${types} (want only hm-a: hm-b is already sent, hm-c is in the future)`);
        } else t.skip("n01.pending_excludes_sent_and_future", "no db handle");
        // n12: cancelling twice keeps the FIRST cancelled_at
        if (!fakeDb) {
        const c1 = await api("/api/notifications/schedule?id=" + nA.id, { method: "DELETE", token: P.token });
        const at1 = ((await api("/api/notifications/schedule", { token: P.token })).json?.notifications || []).find((n) => n.id === nA.id);
        await sleep(1300);
        const c2 = await api("/api/notifications/schedule?id=" + nA.id, { method: "DELETE", token: P.token });
        const at2 = ((await api("/api/notifications/schedule", { token: P.token })).json?.notifications || []).find((n) => n.id === nA.id);
        t.check("n12.cancel_marks_cancelled", c1.status === 200 && at1?.is_cancelled === true && !!at1?.cancelled_at, `cancel -> ${c1.status} is_cancelled=${at1?.is_cancelled} cancelled_at=${at1?.cancelled_at}`);
        t.check("n12.second_cancel_keeps_first_timestamp", c2.status === 200 && at2?.cancelled_at === at1?.cancelled_at, `cancelled_at changed on a repeated cancel: ${at1?.cancelled_at} -> ${at2?.cancelled_at}`);
        }
        const bad = await api("/api/notifications/schedule?id=" + encodeURIComponent("x&user_id=neq.0"), { method: "DELETE", token: P.token });
        t.check("n08.cancel_rejects_filter_metacharacters", bad.status === 400, `DELETE ?id=x&user_id=neq.0 -> ${bad.status} (want 400 invalid id)`);
      }

      // n03: the sync payload returns at most the newest 100 history rows
      if (t.hasDb) {
        const rows = Array.from({ length: 110 }, (_, i) => ({ user_id: P.id, notification_type: "hm-h", title: "H" + i, body: "b", category: "health", priority: "normal", sent_at: new Date(Date.now() - i * 60e3).toISOString() }));
        const ins = await t.dbInsert("notification_history", rows);
        t.check("n03.setup_110_history_rows", Array.isArray(ins) && ins.length === 110, `seed -> ${JSON.stringify(ins).slice(0, 120)}`);
        const sy = await api("/api/notifications/sync", { token: P.token });
        const h = sy.json?.syncData?.notificationHistory || [];
        t.check("n03.sync_history_limited_to_100", h.length === 100, `history rows=${h.length} (want 100 of 110)`);
        const ts = h.map((x) => Date.parse(x.sent_at));
        t.check("n03.sync_history_newest_first", ts.length > 1 && ts.every((x, i) => i === 0 || ts[i - 1] >= x) && h[0]?.title === "H0", `first title=${h[0]?.title} (want H0, newest first)`);
      } else t.skip("n03.sync_history_limited_to_100", "no db handle");
    }
  },
};
