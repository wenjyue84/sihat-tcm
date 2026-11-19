/**
 * hunt_staff — defects found by the "staff" bug hunt (doctor / admin / developer features).
 * Every check asserts the CORRECT behaviour and is RED today; it goes green when the defect is fixed.
 * Ids staff-NN are the hunt report ids (see each check label). Needs --db=sqlite (or fake) for the checks that read/seed rows.
 *
 *   ACI_PORT_OFFSET=4140 node aci.mjs test --suite=hunt_staff --db=sqlite --ai=fake
 *
 * (offsets whose db port 54329+N lands in a Windows-excluded TCP range, e.g. 4038..4137, cannot bind: use 4140.)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PW = "password123";
const here = dirname(fileURLToPath(import.meta.url));
const goSrc = (rel) => { try { return readFileSync(join(here, "..", "..", rel), "utf8"); } catch { return null; } };

export default {
  name: "hunt_staff",
  doc: "bug hunt (doctor/admin/developer): flag/status validation, lost updates, inbox cap, cancel data loss, open doctor signup, settings mask round-trip, system-health ingestion, test-api-key, logs/metrics validation",
  needs: "stack",
  mutating: true,
  costly: false,
  async run(t) {
    const ip = () => ({ "X-Forwarded-For": t.ip() });
    const call = (path, { method = "GET", body, token } = {}) => t.api(path, { method, body, token, headers: ip() });
    const who = async (email) => { const l = await t.login(email, PW, t.ip()); return l; };

    const doc = await who("doctor@sihat.com");
    const adm = await who("admin@sihat.com");
    const dev = await who("developer@sihat.com");
    if (!doc.ok || !adm.ok || !dev.ok) { t.check("setup.demo_logins", false, `doctor=${doc.ok} admin=${adm.ok} developer=${dev.ok}`); return; }

    const u = t.uniq();
    const mkPatient = async (tag) => { const p = await t.signup(`hunt-staff-${tag}-${u}@example.com`, `Hunt ${tag}`, "patient", {}, t.ip()); return p; };
    // a routed consultation request created through the real endpoint
    const mkReq = async (pat, label) => {
      const r = await call("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: doc.id, doctorName: "Hunt Doctor", patientData: { name: "Hunt " + label, email: `hunt-${label}-${u}@example.com` }, reportData: { diagnosis: { primary_pattern: "Hunt pattern" } } } });
      return r.json?.data?.id || null;
    };
    const inboxRow = async (id) => { const r = await call("/api/doctor/requests", { token: doc.token }); return (r.json?.requests || []).find((x) => x.id === id); };

    const pA = await mkPatient("a");
    if (!pA.ok) { t.check("setup.patient_signup", false, `status=${pA.raw?.status}`); return; }

    /* ---------- system-health: derive status from DB first (before this suite adds any unresolved criticals) ---------- */
    if (t.hasDb) {
      const sh = (await call("/api/admin/system-health", { token: adm.token })).json || {};
      const rows = (await t.dbTable("system_errors")) || [];
      const since = Date.now() - 24 * 3600 * 1000;
      const win = rows.filter((e) => Date.parse(e.created_at) >= since);
      const unresCrit = win.filter((e) => e.severity === "critical" && !e.resolved).length;
      const unresHigh = win.filter((e) => e.severity === "high" && !e.resolved).length;
      const want = unresCrit > 5 ? "unhealthy" : unresCrit > 0 || unresHigh > 10 ? "degraded" : "healthy";
      t.check("staff-12.system_health_ignores_resolved_errors", sh.overall_status === want,
        `overall_status=${sh.overall_status}, want ${want} (24h unresolved critical=${unresCrit} high=${unresHigh}; reported critical=${sh.error_statistics?.critical_errors} of which resolved are counted too: handlers_admin.go dtOverallStatus(critical, high) takes totals, not unresolved)`);
    } else t.skip("staff-12.system_health_ignores_resolved_errors", "needs a DB hook");

    /* ---------- staff-09 (P1): anyone who self-registers as a doctor is auto-approved and reads EVERY patient's record ---------- */
    {
      const d = await t.signup(`hunt-staff-selfdoc-${u}@example.com`, "Hunt Selfdoc", "doctor", {}, t.ip());
      const inb = d.ok ? await call("/api/doctor/requests", { token: d.token }) : { status: 0 };
      t.check("staff-09.self_registered_doctor_cannot_read_inbox_until_approved", d.ok && inb.status === 403,
        `a freshly self-registered, UNAPPROVED doctor got GET /api/doctor/requests -> ${inb.status} with ${inb.json?.requests?.length ?? "?"} patients' reports (profiles.is_approved is set true at signup; role check ignores it). Note: journey/roles suites sign up doctors and must approve them via t.dbInsert/patch once this is fixed`);
    }

    /* ---------- staff-01 flag validation ---------- */
    const rFlag = await mkReq(pA, "flag");
    if (rFlag) {
      await call("/api/doctor/flag", { method: "POST", token: doc.token, body: { requestId: rFlag, flag: "critical" } });
      const bad = await call("/api/doctor/flag", { method: "POST", token: doc.token, body: { requestId: rFlag, flag: "bogus" } });
      const after = await inboxRow(rFlag);
      t.check("staff-01.flag_invalid_value_is_400", bad.status === 400, `POST /api/doctor/flag {flag:"bogus"} -> ${bad.status} ${JSON.stringify(bad.json)} (handlers_doctor.go coerces every unknown value to "normal")`);
      t.check("staff-01.flag_invalid_value_keeps_critical", after?.flag === "critical", `a critical request is silently downgraded to ${JSON.stringify(after?.flag)} by a malformed flag call (also flag "", null, "CRITICAL")`);
    } else t.check("staff-01.fixture", false, "could not create a request");

    /* ---------- staff-02/03/04/05: reply + treatment-plan validation ---------- */
    const rRep = await mkReq(pA, "reply");
    if (rRep) {
      const ws = await call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rRep, message: "   \n ", targetTable: "inquiries" } });
      t.check("staff-02.doctor_reply_whitespace_only_is_400", ws.status === 400, `whitespace-only doctor reply -> ${ws.status} (patient/reply already trims and rejects; doctor/reply stores an empty bubble and marks the request reviewed)`);
      const st = await call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rRep, message: "ok", status: "bogus-status", targetTable: "inquiries" } });
      const row = await inboxRow(rRep);
      t.check("staff-03.doctor_reply_status_whitelist", st.status === 400 && row?.status !== "bogus-status",
        `reply {status:"bogus-status"} -> ${st.status}; inquiries.status is now ${JSON.stringify(row?.status)}: the doctor UI filters/counters only know pending|reviewed, so the request vanishes from both filters and is counted "pending"`);
      // restore sane state
      await call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rRep, message: "reset", status: "reviewed", targetTable: "inquiries" } });
    } else t.check("staff-02.fixture", false, "could not create a request");

    const rTp = await mkReq(pA, "plan");
    if (rTp) {
      const empty = await call("/api/doctor/treatment-plan", { method: "POST", token: doc.token, body: { requestId: rTp, plan: { pattern: "", treatment: "", lifestyle: "" } } });
      t.check("staff-04.treatment_plan_all_empty_is_400", empty.status === 400, `plan with only empty strings -> ${empty.status}; it is stored and the request is marked reviewed (the UI blocks this, the API does not)`);
      // patient follow-up that the doctor has NOT answered, then the doctor just saves a plan
      await call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rTp, message: "first answer", targetTable: "inquiries" } });
      await call("/api/patient/reply", { method: "POST", token: pA.token, body: { requestId: rTp, message: "I have a new question about the herbs" } });
      const mid = await inboxRow(rTp);
      await call("/api/doctor/treatment-plan", { method: "POST", token: doc.token, body: { requestId: rTp, plan: { pattern: "Spleen qi deficiency", treatment: "Si Jun Zi Tang" } } });
      const end = await inboxRow(rTp);
      const lastRole = end?.diagnosis_report?.messages?.at(-1)?.role;
      t.check("staff-05.treatment_plan_does_not_hide_unanswered_patient_message", mid?.status === "pending" && !(end?.status === "reviewed" && lastRole === "patient"),
        `after a patient follow-up (status ${mid?.status}) saving a treatment plan sets status=${end?.status} while the last thread message is from the ${lastRole}: the unanswered question leaves the pending list`);
    } else t.check("staff-04.fixture", false, "could not create a request");

    /* ---------- staff-06: concurrent replies lose messages (read-modify-write on a JSON blob) ---------- */
    const rRace = await mkReq(pA, "race");
    if (rRace) {
      const N = 10;
      await Promise.all(Array.from({ length: N }, (_, i) => i % 2
        ? call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rRace, message: "race-" + i, targetTable: "inquiries" } })
        : call("/api/patient/reply", { method: "POST", token: pA.token, body: { requestId: rRace, message: "race-" + i } })));
      const row = await inboxRow(rRace);
      const got = (row?.diagnosis_report?.messages || []).filter((m) => /^race-\d+$/.test(m.content)).length;
      t.check("staff-06.concurrent_replies_all_persisted", got === N, `${N} parallel replies (all answered 200) -> only ${got} stored in diagnosis_report.messages (handleDoctorReply/handlePatientReply SELECT then PATCH the whole blob: last writer wins)`);
    } else t.check("staff-06.fixture", false, "could not create a request");

    /* ---------- staff-07: patient cancel hard-deletes a request the doctor already answered ---------- */
    const rCancel = await mkReq(pA, "cancel");
    if (rCancel) {
      await call("/api/doctor/reply", { method: "POST", token: doc.token, body: { requestId: rCancel, message: "Clinical advice that must not vanish", targetTable: "inquiries" } });
      await call("/api/doctor/treatment-plan", { method: "POST", token: doc.token, body: { requestId: rCancel, plan: { pattern: "x", treatment: "y" } } });
      const c = await call("/api/patient/requests/cancel", { method: "POST", token: pA.token, body: { id: rCancel } });
      const still = await inboxRow(rCancel);
      t.check("staff-07.cancel_keeps_reviewed_request_for_the_doctor", c.status >= 400 || !!still,
        `patient cancel of a REVIEWED request (doctor reply + treatment plan) -> ${c.status}; doctor inbox still has it: ${!!still}. The row is DELETEd, so the doctor's clinical reply and plan are destroyed and there is no cancelled state to show`);
    } else t.check("staff-07.fixture", false, "could not create a request");

    /* ---------- staff-08: inbox silently capped at 300 rows (newest first), no total / paging ---------- */
    if (t.hasDb && t.dbMode !== "real") {
      const pB = await mkPatient("b");
      const tgt = pB.ok ? await mkReq(pB, "oldest-critical") : null;
      if (tgt) {
        await call("/api/doctor/flag", { method: "POST", token: doc.token, body: { requestId: tgt, flag: "critical" } });
        const future = Date.now() + 3600_000;
        const pad = Array.from({ length: 310 }, (_, i) => ({ user_id: pB.id, doctor_id: doc.id, status: "pending", symptoms: "hunt-pad", notes: "hunt-staff-pad", created_at: new Date(future + i * 1000).toISOString(), diagnosis_report: { type: "verification_request", status: "pending", messages: [], patient_profile: { name: "Hunt Pad" } } }));
        const ins = await t.dbInsert("inquiries", pad);
        const total = ((await t.dbTable("inquiries")) || []).length;
        const r = await call("/api/doctor/requests", { token: doc.token });
        const list = r.json?.requests || [];
        const declared = r.json?.truncated === true || r.json?.hasMore === true || r.json?.next != null || (typeof r.json?.total === "number" && r.json.total >= total);
        t.check("staff-08.inbox_returns_all_or_declares_truncation", Array.isArray(ins) && (list.length >= total || declared || list.some((x) => x.id === tgt)),
          `inbox returned ${list.length} of ${total} rows with no total/truncated/next field; the oldest CRITICAL pending request is ${list.some((x) => x.id === tgt) ? "present" : "missing"} (handlers_doctor.go: limit=300, order=created_at.desc; a patient can create unlimited requests via /api/verification-request)`);
        await cleanup(t, "inquiries", "notes=eq.hunt-staff-pad");
      } else t.check("staff-08.fixture", false, "could not create the target request");
    } else t.skip("staff-08.inbox_returns_all_or_declares_truncation", "needs a seedable DB");

    /* ---------- staff-10/11: admin db-status ---------- */
    {
      const st = (await call("/api/admin/db-status", { token: adm.token })).json || {};
      const roles = (st.promptsStatus || []).map((p) => p.role);
      // real prompt roles come from prompts.go (PromptDoctorImage ... PromptHeartCompanion); doctor_tongue/face/body/pulse are legacy names nothing reads
      const real = ["doctor_chat", "doctor_final", "doctor_image", "doctor_listening", "doctor_inquiry_summary", "doctor_report_chat", "doctor_western_chat", "heart_companion"];
      const missing = real.filter((r) => !roles.includes(r));
      const legacy = ["doctor_tongue", "doctor_face", "doctor_body", "doctor_pulse"].filter((r) => roles.includes(r));
      t.check("staff-10.db_status_checks_the_prompt_roles_the_app_uses", missing.length === 0 && legacy.length === 0,
        `promptsStatus checks ${roles.join(",")}; not covered (a missing row there is invisible to the admin): ${missing.join(",") || "-"}; legacy names nothing reads: ${legacy.join(",") || "-"}`);
    }
    if (t.hasDb && t.dbMode !== "real") {
      const base = ((await t.dbTable("diagnosis_sessions")) || []).length;
      const pad = Array.from({ length: 1000 }, () => ({ primary_diagnosis: "hunt-staff-pad", full_report: {}, notes: "hunt-staff-pad" }));
      const ins = await t.dbInsert("diagnosis_sessions", pad);
      const actual = ((await t.dbTable("diagnosis_sessions")) || []).length;
      const st = (await call("/api/admin/db-status", { token: adm.token })).json || {};
      t.check("staff-11.db_status_counts_are_not_capped_at_1000", Array.isArray(ins) && st.stats?.totalDiagnoses === actual,
        `diagnosis_sessions rows=${actual}, db-status totalDiagnoses=${st.stats?.totalDiagnoses} (handlers_admin.go counts len(select id limit 1000); same cap on totalUsers/adminUsers)`);
      await cleanup(t, "diagnosis_sessions", "notes=eq.hunt-staff-pad");
      void base;
    } else t.skip("staff-11.db_status_counts_are_not_capped_at_1000", "needs a seedable DB");

    /* ---------- system-health ingestion (open endpoint) ---------- */
    {
      const bad = await call("/api/admin/system-health", { method: "POST", body: { error_type: "hunt-staff", message: "bogus severity", severity: "BOGUS" } });
      const unk = await call("/api/admin/system-health", { method: "POST", body: { error_type: "hunt-staff", message: "unknown column", not_a_column: 1 } });
      t.check("staff-13.system_health_post_rejects_invalid_input", bad.status === 400 && unk.status === 400,
        `severity "BOGUS" -> ${bad.status} ${JSON.stringify(bad.json)}, unknown column -> ${unk.status} ${JSON.stringify(unk.json)} (a failed insert is swallowed into system_logs and answered 200 success+fallback, so the admin error console never shows it)`);
      if (t.hasDb) {
        const victim = pA.id;
        await call("/api/admin/system-health", { method: "POST", body: { error_type: "hunt-staff-attr", message: "attributed to " + u, severity: "low", user_id: victim } });
        const rows = ((await t.dbTable("system_errors")) || []).filter((e) => e.message === "attributed to " + u);
        t.check("staff-14.system_health_post_ignores_client_user_id", rows.length === 1 && rows[0].user_id == null,
          `anonymous POST with user_id=<another user> stored user_id=${JSON.stringify(rows[0]?.user_id)} (POST /api/logs derives it from the session; system-health passes the whole body to INSERT, so any column incl. user_id/resolved/created_at is client-controlled)`);
      } else t.skip("staff-14.system_health_post_ignores_client_user_id", "needs a DB hook");
      const ipFlood = "10.231." + Math.floor(Math.random() * 250) + "." + (1 + Math.floor(Math.random() * 250));
      let n429 = 0;
      for (let i = 0; i < 70; i++) {
        const r = await t.api("/api/admin/system-health", { method: "POST", body: { error_type: "hunt-staff-flood", message: "flood " + i, severity: "low" }, headers: { "X-Forwarded-For": ipFlood } });
        if (r.status === 429) n429++;
      }
      t.check("staff-15.system_health_post_is_rate_limited", n429 > 0, `70 anonymous POSTs from one IP in <1 min -> ${n429} x 429 (/api/logs and /api/monitoring/metrics are RateLimit(60,2000); this route is not wrapped, and 6 critical posts flip the admin console to "unhealthy")`);
    }

    /* ---------- admin settings ---------- */
    {
      const put = (b, token = adm.token) => call("/api/admin/settings", { method: "PUT", token, body: b });
      const secret = "AIzaSyHUNT" + u.padEnd(20, "x") + "ABCDEF";
      const p1 = await put({ gemini_api_key: secret });
      t.check("staff-18.settings_put_response_does_not_echo_secret", !JSON.stringify(p1.json || {}).includes(secret), `PUT /api/admin/settings echoes the full unmasked gemini_api_key in its response body (GET masks it)`);
      const g1 = await call("/api/admin/settings", { token: adm.token });
      // the admin UI loads the (masked) value into a form and saves the form back
      await put({ gemini_api_key: g1.json?.gemini_api_key, music_enabled: false });
      const row = t.hasDb ? ((await t.dbTable("admin_settings")) || [])[0] : null;
      if (row) t.check("staff-16.settings_put_ignores_masked_placeholder", row.gemini_api_key === secret, `after PUT of the masked value ${JSON.stringify(g1.json?.gemini_api_key)} the stored key is ${JSON.stringify(row.gemini_api_key)} (the real key is overwritten by its mask)`);
      else {
        const t2 = await call("/api/admin/settings", { token: adm.token });
        t.check("staff-16.settings_put_ignores_masked_placeholder", t2.json?.gemini_api_key === g1.json?.gemini_api_key && false, "no DB hook to read the stored key");
      }
      const nested = "hunt-nested-" + u;
      await put({ settings: { smtp_password: nested, nested_api_key: nested + "-k" } });
      const gd = await call("/api/admin/settings", { token: dev.token });
      t.check("staff-17.settings_masks_secrets_inside_the_settings_json", !JSON.stringify(gd.json || {}).includes(nested), `secret-looking keys inside admin_settings.settings (smtp_password, nested_api_key) are returned in clear to admin AND developer: the mask only looks at top-level column names`);
      const bt = await put({ music_enabled: "yes" });
      const bu = await put({ music_url: "javascript:alert(1)" });
      t.check("staff-19.settings_put_validates_types_and_urls", bt.status === 400 && bu.status === 400, `music_enabled:"yes" -> ${bt.status} (500 from the DB type error), music_url "javascript:alert(1)" -> ${bu.status} (stored as-is)`);
      // restore
      await put({ gemini_api_key: "", music_enabled: true, music_url: null, settings: {} });
    }

    /* ---------- staff-21: admin "test key" bypasses the configured AI backend ---------- */
    {
      const r = await call("/api/admin/test-api-key", { method: "POST", token: adm.token, body: { useSavedKey: true } });
      t.check("staff-21.test_api_key_uses_the_configured_ai_backend", r.status === 200 && r.json?.success === true,
        `POST test-api-key {useSavedKey:true} -> ${r.status} ${JSON.stringify(r.json)}. handlers_admin.go builds gemini.Client{APIKey,HTTP} WITHOUT BaseURL, so the probe goes to generativelanguage.googleapis.com with the placeholder key "sihat-listener" even when every real call is routed through the listener: the button reports "Invalid key" on a healthy install (and leaks a hermetic stack's traffic to the internet)`);
    }

    /* ---------- logs / metrics ---------- */
    {
      const cat = "http request " + u;
      await t.api("/api/logs", { method: "POST", body: { level: "info", category: cat, message: "hunt-staff category" }, headers: ip() });
      const f = await call("/api/logs?category=" + encodeURIComponent(cat), { token: dev.token });
      t.check("staff-22.logs_category_filter_accepts_any_category_that_post_accepts", f.status === 200 && (f.json?.logs || []).some((l) => l.category === cat), `POST /api/logs accepts category ${JSON.stringify(cat)} but GET ?category= answers ${f.status} ${JSON.stringify(f.json?.error)} (safeTokenRe only allows [A-Za-z0-9_.:-]); such logs can never be filtered`);
      const all = (await call("/api/logs?limit=200", { token: dev.token })).json?.logs || [];
      const bad = [];
      for (const q of ["0", "-3", "1e2"]) { const r = await call("/api/logs?limit=" + q, { token: dev.token }); if (!(r.status === 400 || (r.json?.count || 0) > 1)) bad.push(`limit=${q}->${r.status}/${r.json?.count}`); }
      t.check("staff-23.logs_invalid_limit_not_collapsed_to_one_row", all.length < 2 || bad.length === 0, `${bad.join(" ")} of ${all.length} logs: limit<1 is clamped to 1 and "1e2" parses as 1 (Sscanf %d) -- silently returns a single row instead of 400 / the default`);
      const m1 = await t.api("/api/monitoring/metrics", { method: "POST", body: { type: "hunt", metrics: [{ name: "n", value: null }] }, headers: ip() });
      const m2 = await t.api("/api/monitoring/metrics", { method: "POST", body: { type: "hunt", metrics: [{ name: "n", value: 1, timestamp: "garbage" }] }, headers: ip() });
      t.check("staff-24.metrics_post_bad_value_or_timestamp_is_400_not_500", m1.status === 400 && m2.status === 400, `value:null -> ${m1.status}, timestamp:"garbage" -> ${m2.status} (DB constraint errors surface as 500 "failed to store metrics")`);
    }

    /* ---------- staff-25: doctor dashboard stat cards read the doctor's OWN sessions ---------- */
    {
      const pg = await t.api("/doctor", { token: doc.token, headers: ip() });
      const body = pg.text || "";
      const usesOwnSessions = /fetch\(\s*['"]\/api\/patient\/sessions['"]/.test(body) && /stat-total/.test(body);
      t.check("staff-25.doctor_stat_cards_do_not_use_the_doctors_own_sessions", pg.status === 200 && !usesOwnSessions,
        `templates/doctor.html fills "Total Sessions / Today / Top Constitution" from /api/patient/sessions = sessions owned by the logged-in DOCTOR (always 0 / "—" for the demo doctors) while the same page lists ${"44+"} patients' requests from the master inbox. Fetch an inbox-/all-patients-based figure instead`);
    }

    /* ---------- staff-26: developer assistant briefed on a different codebase ---------- */
    {
      const src = goSrc("internal/server/handlers_ai.go");
      const wrong = src ? ["Next.js 16", "diagnosis_history", "medical_reports", "practitioners", "GET /api/config - Public"].filter((s) => src.includes(s)) : null;
      t.check("staff-26.developer_assistant_prompt_matches_this_codebase", wrong !== null && wrong.length === 0, `handlers_ai.go handleDeveloperAssistant/AdminAssistant system prompts describe the old Next.js/Supabase app (${(wrong || []).join(", ")}): tables and routes that do not exist here, so developers get confidently wrong answers`);
    }
  },
};

/** delete helper rows seeded by this suite through the DB's own REST (service key / sqlite hook). */
async function cleanup(t, table, filter) {
  try {
    const s = t.stack || {};
    if (s.dbReal) return;
    const h = s.dbKey ? { apikey: s.dbKey, Authorization: "Bearer " + s.dbKey } : {};
    await fetch(`${s.dbBase}/rest/v1/${table}?${filter}`, { method: "DELETE", headers: h });
  } catch { /* best effort */ }
}
