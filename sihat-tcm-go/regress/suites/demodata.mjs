/**
 * demodata — the rich DEMO seed of the SQLite backend (SEED_DEMO=1): 8 named doctors + doctor@sihat.com, 16 patients,
 * 1-3 full TCM reports per patient over ~90 days, >=4 routed requests per doctor (mixed status / flag / threads / plans),
 * notifications, and non-empty admin/developer consoles. Logs in as EVERY demo doctor and patient through the API and
 * asserts their lists are non-empty and consistent. Only meaningful with --db=sqlite (the fake DB stays minimal).
 *
 *   ACI_PORT_OFFSET=3200 node aci.mjs test --suite=demodata --db=sqlite --ai=fake
 */
import { reportProblems } from "../journey.mjs";

const PW = "password123";
const NAMED_DOCTORS = ["dr.lew", "dr.tan", "dr.lim", "dr.nurul", "dr.wong", "dr.raj", "dr.chong", "dr.aisyah"].map((x) => x + "@sihat.com");
const DOCTORS = ["doctor@sihat.com", ...NAMED_DOCTORS];
const PATIENTS = Array.from({ length: 16 }, (_, i) => (i === 0 ? "patient@sihat.com" : `demo-patient-${String(i + 1).padStart(2, "0")}@sihat.com`));
const DAY = 86400_000;
// rows other suites add to the same stack (journey, roles) must not be mistaken for the seed: demo rows belong to the demo patients
const DEMO_PATIENT = /^(patient|demo-patient-\d\d)@sihat\.com$/;
const isDemoReq = (r) => DEMO_PATIENT.test(r.diagnosis_report?.patient_profile?.email || "") && !!r.diagnosis_report?.full_report?.analysis?.five_elements;
const isDemoSession = (s) => !!s.full_report?.analysis?.five_elements;

export default {
  name: "demodata",
  doc: "rich demo seed (sqlite + SEED_DEMO=1): every demo doctor's inbox and every demo patient's sessions/consultations are populated and consistent; consoles show data",
  needs: "stack",
  mutating: false,
  costly: false,
  async run(t) {
    if (t.dbMode !== "sqlite") {
      t.skip("rich_seed", `needs --db=sqlite (the ${t.dbMode || "fake"} DB seeds only the minimal accounts)`);
      // the minimal seed still has to serve a usable doctor directory and a doctor login
      const dir0 = await t.get("/api/doctors");
      t.check("minimal.directory_nonempty", (dir0.json?.doctors || []).length >= 1, `status=${dir0.status}`);
      const l0 = await t.login("doctor@sihat.com", PW, "10.77.9.9");
      t.check("minimal.doctor_login", l0.ok, `status=${l0.raw?.status}`);
      return;
    }
    const ipOf = (n) => `10.77.${Math.floor(n / 250)}.${(n % 250) + 1}`;
    const authed = async (email, n) => {
      const l = await t.login(email, PW, ipOf(n));
      t.check(`login.${email}`, l.ok && !!l.token, `status=${l.raw?.status}`);
      return { ...l, get: (p) => t.api(p, { token: l.token, headers: { "X-Forwarded-For": ipOf(n) } }) };
    };

    // ---- directory: 8 named doctors with complete profiles, plus the generic test doctor
    const dir = await t.get("/api/doctors");
    const docs = (dir.json?.doctors || []).filter((d) => /@sihat\.com$/.test(d.email || "")); // other suites register extra doctors in the same stack
    t.check("directory.count", docs.length === 9, `directory lists ${docs.length}, want 9 (8 named + doctor@sihat.com)`);
    t.check("directory.named_doctors", NAMED_DOCTORS.every((e) => docs.some((d) => d.email === e)), "a named demo doctor is missing from the directory");
    for (const d of docs.filter((x) => NAMED_DOCTORS.includes(x.email))) {
      const miss = ["full_name", "specialty", "bio", "qualification", "languages", "clinic", "avg_response_time", "years_experience"].filter((k) => d[k] == null || d[k] === "");
      t.check(`directory.profile.${d.email}`, miss.length === 0, `missing ${miss.join(",")}`);
    }
    t.check("directory.specialty_mix", new Set(docs.map((d) => d.specialty)).size >= 8, "specialties not diverse");
    const docById = Object.fromEntries(docs.map((d) => [d.id, d]));

    // ---- every doctor: inbox
    let totalOwn = 0;
    for (const [i, email] of DOCTORS.entries()) {
      const me = await authed(email, i);
      if (!me.ok) continue;
      const inbox = (await me.get("/api/doctor/requests")).json?.requests || [];
      const own = inbox.filter((r) => r.doctor_id === me.id && isDemoReq(r));
      totalOwn += own.length;
      t.check(`doctor.${email}.inbox_nonempty`, inbox.length >= 4, `inbox ${inbox.length}`);
      t.check(`doctor.${email}.own_requests>=4`, own.length >= 4, `routed to this doctor: ${own.length}`);
      t.check(`doctor.${email}.status_mix`, own.some((r) => r.status === "pending") && own.some((r) => r.status === "reviewed"), own.map((r) => r.status).join(","));
      t.check(`doctor.${email}.flag_mix`, new Set(own.map((r) => r.flag)).size >= 2, own.map((r) => r.flag).join(","));
      const bad = [];
      for (const r of own) {
        const rep = r.diagnosis_report || {};
        const probs = reportProblems(rep.full_report);
        if (probs.length) bad.push(`${r.id}: ${probs[0]}`);
        if (rep.selected_doctor?.id !== me.id) bad.push(`${r.id}: selected_doctor`);
        if (!rep.patient_profile?.name) bad.push(`${r.id}: patient_profile.name`);
        const msgs = rep.messages || [];
        if (r.status === "reviewed" && !msgs.some((m) => m.role === "doctor")) bad.push(`${r.id}: reviewed without a doctor reply`);
        if (r.status === "pending" && msgs.length && msgs[msgs.length - 1].role !== "patient") bad.push(`${r.id}: pending thread ends with the doctor`);
        if (rep.status !== r.status) bad.push(`${r.id}: report status != column`);
      }
      t.check(`doctor.${email}.requests_consistent`, bad.length === 0, bad.slice(0, 3).join(" | "));
      t.check(`doctor.${email}.has_thread_or_plan`, own.some((r) => (r.diagnosis_report?.messages || []).length > 0), "no conversation among this doctor's requests");
    }
    t.check("doctor.total_routed>=36", totalOwn >= 36, `total ${totalOwn}`);

    // ---- every patient: sessions, consultations, profile
    const patterns = new Set(), langs = new Set(), stamps = [];
    let withPlan = 0;
    for (const [i, email] of PATIENTS.entries()) {
      const me = await authed(email, 20 + i);
      if (!me.ok) continue;
      const sess = ((await me.get("/api/patient/sessions")).json?.sessions || []).filter(isDemoSession);
      t.check(`patient.${email}.sessions_1to3`, sess.length >= 1 && sess.length <= 3, `sessions ${sess.length}`);
      const probs = sess.flatMap((s) => reportProblems(s.full_report).map((p) => `${s.id}: ${p}`));
      t.check(`patient.${email}.reports_valid`, probs.length === 0, probs.slice(0, 2).join(" | "));
      t.check(`patient.${email}.sessions_desc`, sess.every((s, k) => k === 0 || new Date(sess[k - 1].created_at) >= new Date(s.created_at)), "not ordered newest first");
      for (const s of sess) {
        patterns.add(s.full_report?.diagnosis?.primary_pattern);
        const age = (Date.now() - new Date(s.created_at).getTime()) / DAY;
        stamps.push(age);
        if (!(age >= 0 && age <= 95)) t.check(`patient.${email}.session_date_in_range`, false, `age ${age.toFixed(1)}d`);
        if (!s.symptoms?.length) t.check(`patient.${email}.session_symptoms`, false, s.id);
      }
      const reqs = ((await me.get("/api/patient/requests")).json?.requests || []).filter(isDemoReq);
      t.check(`patient.${email}.consultations_nonempty`, reqs.length >= 1, `consultations ${reqs.length}`);
      t.check(`patient.${email}.consultation_doctors_exist`, reqs.every((r) => docById[r.doctor_id]), "request routed to an unknown doctor id");
      withPlan += reqs.filter((r) => r.diagnosis_report?.treatment_plan).length;
      const prof = (await me.get("/api/patient/profile")).json?.profile || {};
      t.check(`patient.${email}.profile_complete`, ["age", "gender", "height", "weight", "bmi", "medical_history", "preferred_language"].every((k) => prof[k] != null), JSON.stringify(prof).slice(0, 160));
      langs.add(prof.preferred_language);
    }
    t.check("patients.distinct_patterns>=10", patterns.size >= 10, `distinct primary patterns: ${patterns.size}`);
    t.check("patients.languages_mixed", ["en", "zh", "ms"].every((l) => langs.has(l)), [...langs].join(","));
    t.check("patients.timestamps_span_trend", Math.max(...stamps) - Math.min(...stamps) >= 60, `session ages span ${(Math.max(...stamps) - Math.min(...stamps)).toFixed(0)}d`);
    t.check("patients.treatment_plans_visible", withPlan >= 5, `plans visible to patients: ${withPlan}`);

    // ---- notifications for the default patient
    const pat = await authed("patient@sihat.com", 50);
    const sync = (await pat.get("/api/notifications/sync")).json?.syncData || {};
    t.check("notifications.preferences", !!sync.preferences, "no preferences row");
    t.check("notifications.scheduled", (sync.scheduledNotifications || []).length >= 1, "no scheduled notifications");
    t.check("notifications.history", (sync.notificationHistory || []).length >= 1, "no history");

    // ---- admin / developer consoles
    for (const [k, email] of ["admin@sihat.com", "developer@sihat.com"].entries()) {
      const me = await authed(email, 60 + k);
      if (!me.ok) continue;
      const logs = (await me.get("/api/logs?limit=200")).json?.logs || [];
      t.check(`console.${email}.logs`, logs.length >= 100, `logs ${logs.length}`);
      t.check(`console.${email}.log_levels`, ["info", "warn", "error"].every((l) => logs.some((x) => x.level === l)), [...new Set(logs.map((x) => x.level))].join(","));
      const spanDays = logs.length ? (new Date(logs[0].timestamp) - new Date(logs[logs.length - 1].timestamp)) / DAY : 0;
      t.check(`console.${email}.logs_span_days`, spanDays >= 3, `span ${spanDays.toFixed(1)}d`);
      const met = (await me.get("/api/monitoring/metrics?limit=1000")).json?.metrics || [];
      t.check(`console.${email}.metrics`, met.length >= 300, `metrics ${met.length}`);
      t.check(`console.${email}.metric_types`, ["http", "ai", "business"].every((ty) => met.some((m) => m.type === ty)), [...new Set(met.map((m) => m.type))].join(","));
      const health = (await me.get("/api/admin/system-health")).json || {};
      const errs = health.recent_errors || [];
      t.check(`console.${email}.errors`, errs.length >= 6, `recent_errors ${errs.length}`);
      t.check(`console.${email}.errors_resolved_mix`, errs.some((e) => e.resolved) && errs.some((e) => !e.resolved), "all resolved or none");
      t.check(`console.${email}.errors_severity_mix`, new Set(errs.map((e) => e.severity)).size >= 3, [...new Set(errs.map((e) => e.severity))].join(","));
      t.check(`console.${email}.error_stats_24h`, (health.error_statistics?.total_errors || 0) >= 1, JSON.stringify(health.error_statistics));
    }
  },
};
