/**
 * roles — systematic role x route access matrix + the "interface of each role" checks.
 *
 * Route table below mirrors every s.Mux.HandleFunc(...) in internal/server/*.go (RequireAuth roles
 * read from the source). Mutating routes are probed with an INVALID JSON body, so the auth gate is
 * exercised but nothing is created (every handler reads/validates the body after the gate).
 * Only when the hermetic fake DB is present (t.dbBase) the suite seeds 2 diagnosis_sessions and
 * 2 inquiries straight into that fake DB, to make the "only my rows" checks non-vacuous.
 */
const ROLES = ["patient", "doctor", "admin", "developer"];
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const BAD = { raw: true, body: "{not-json" };

// allow: "public" (everyone passes the gate) | "any" (any logged-in user, anon -> 401) | [roles]
// skip: roles whose cell is not asserted (contract unspecified for them)
// gap:  (none left) a route the Go source leaves OPEN although it reads/changes privileged data or spends AI quota
const R = (method, path, allow, extra = {}) => ({ method, path, allow, ...extra });
const ROUTES = [
  // ---- RequireAuth, any logged-in role ----
  R("GET", "/api/auth/me", "any"),
  R("GET", "/api/patient/requests", "any"),
  R("POST", "/api/patient/requests/cancel", "any", BAD),
  R("GET", "/api/patient/profile", "any"),
  R("PUT", "/api/patient/profile", "any", BAD),
  R("GET", "/api/patient/sessions", "any"),
  R("POST", "/api/patient/sessions", "any", BAD),
  R("POST", "/api/patient/reply", "any", BAD),
  R("POST", "/api/verification-request", "any", BAD),
  R("POST", "/api/migrate-guest-session", "any", BAD),
  R("GET", "/api/notifications/preferences", "any"),
  R("POST", "/api/notifications/preferences", "any", BAD),
  R("POST", "/api/notifications/register-device", "any", BAD),
  R("DELETE", "/api/notifications/register-device", "any", BAD),
  R("GET", "/api/notifications/schedule", "any"),
  R("POST", "/api/notifications/schedule", "any", BAD),
  R("DELETE", "/api/notifications/schedule", "any", BAD),
  R("GET", "/api/notifications/sync", "any"),
  R("POST", "/api/notifications/sync", "any", BAD),
  // wearable integrations (own data, any signed-in role). POST/DELETE are probed with an invalid JSON body so no state changes.
  R("GET", "/api/health/summary", "any"),
  R("GET", "/api/health/readings", "any"),
  R("POST", "/api/health/readings", "any", BAD),
  R("DELETE", "/api/health/readings", "any", BAD),
  R("POST", "/api/health/ingest-token", "any", BAD),
  R("DELETE", "/api/health/ingest-token", "any", BAD),
  R("POST", "/api/health/apple/import", "any", BAD),
  R("GET", "/api/health/google/connect", "any"),
  R("POST", "/api/health/google/sync", "any", BAD),
  R("DELETE", "/api/health/google", "any", BAD),
  // ---- doctor only ----
  R("GET", "/api/doctor/requests", ["doctor"]),
  R("POST", "/api/doctor/flag", ["doctor"], BAD),
  R("POST", "/api/doctor/reply", ["doctor"], BAD),
  R("POST", "/api/doctor/treatment-plan", ["doctor"], BAD),
  R("POST", "/api/doctor/generate-inquiry", ["doctor", "admin"], BAD),
  R("POST", "/api/ai/patient-summary", ["doctor", "admin"], BAD),
  // ---- admin / developer ----
  R("PUT", "/api/admin/settings", ["admin"], BAD),
  R("GET", "/api/admin/system-health", ["admin", "developer"]),
  R("GET", "/api/logs", ["admin", "developer"]),
  R("GET", "/api/admin/settings", ["admin", "developer"]),
  R("GET", "/api/admin/db-status", ["admin", "developer"]),
  R("GET", "/api/monitoring/metrics", ["admin", "developer"]),
  R("POST", "/api/admin/test-api-key", ["admin"], BAD),
  R("GET", "/api/admin/doctors", ["admin"]),
  R("POST", "/api/admin/doctors/approve", ["admin"], BAD),
  R("POST", "/api/admin/assistant", ["admin", "developer"], BAD),
  R("POST", "/api/developer/assistant", ["developer", "admin"], BAD),
];
// intentionally public (anon included): health, directory, AI front-door, auth endpoints, ingest.
// POST /api/auth/logout is public too but REVOKES the bearer token it is called with, so it is probed LAST (end of run)
// with the shared identity tokens; every other cell needs them alive.
const PUBLIC = [
  ["GET", "/healthz"], ["GET", "/api/health"], ["GET", "/api/monitoring/health"], ["GET", "/api/doctors"],
  ["POST", "/api/chat", BAD], ["POST", "/api/consult", BAD], ["POST", "/api/report-chat", BAD], ["POST", "/api/western-chat", BAD],
  ["POST", "/api/heart-companion", BAD], ["POST", "/api/analyze-image", BAD], ["POST", "/api/analyze-audio", BAD],
  ["POST", "/api/analyze-snore", BAD], ["POST", "/api/extract-text", BAD], ["POST", "/api/validate-medicine", BAD],
  ["POST", "/api/summarize-inquiry", BAD], ["POST", "/api/summarize-reports", BAD],
  ["POST", "/api/summarize-medical-history", BAD], ["POST", "/api/ask-dietary-advice", BAD], ["POST", "/api/generate-infographic", BAD],
  ["POST", "/api/guest/sessions", BAD], ["POST", "/api/notifications/report-viewed", BAD],
  ["POST", "/api/auth/login", BAD], ["POST", "/api/auth/signup", BAD], ["POST", "/api/auth/forgot-password", BAD], ["POST", "/api/auth/reset-password", BAD],
  ["GET", "/api/health/google/callback"],
  ["POST", "/api/admin/system-health", BAD], ["POST", "/api/logs", BAD], ["POST", "/api/monitoring/metrics", BAD],
];

export default {
  name: "roles", needs: "stack", mutating: false, costly: false,
  doc: "role x route access matrix (anon/patient/doctor/admin/developer vs every registered route), page redirects per role, /me, own-rows-only data endpoints, role fences",
  async run(t) {
    const ids = { anon: { role: "anon", token: "" } };
    /* ---------- identities (every later check needs real tokens: no vacuous denials) ---------- */
    for (const role of ROLES) {
      const email = `${role}@sihat.com`;
      const l = await t.login(email, PW, t.ip());
      t.check(`login.${role}`, l.ok && l.role === role && !!l.token, `ok=${l.ok} role=${l.role} token=${l.token ? "yes" : "no"} (matrix needs a real ${role} token)`);
      ids[role] = { role, email, token: l.token, id: l.id };
    }
    const haveAll = ROLES.every((r) => ids[r].token);
    if (!haveAll) { t.check("tokens_available", false, "cannot build the matrix without all four tokens"); return; }
    const tokSet = new Set(ROLES.map((r) => ids[r].token));
    t.check("tokens_distinct", tokSet.size === 4, `distinct tokens=${tokSet.size}`);

    const call = (who, route, headers = {}) => {
      const o = { method: route.method, token: ids[who].token || undefined, headers: { "X-Forwarded-For": t.ip(), ...headers } };
      // POST/PUT/PATCH with a body but no JSON Content-Type is 415 (RequireAuth); probe the auth gate with a JSON-typed (invalid) body
      if (route.raw) { o.raw = true; o.body = route.body; o.headers["Content-Type"] = "application/json"; }
      return t.api(route.path, o);
    };

    let cells = 0, cellsOk = 0;
    const statusLog = [];
    /* ---------- matrix: one check per gated route (5 identities each) ---------- */
    for (const route of ROUTES) {
      const bad = [];
      for (const who of ["anon", ...ROLES]) {
        if (route.skip && route.skip.includes(who)) continue;
        const r = await call(who, route);
        const allowed = route.allow === "public" || (who !== "anon" && (route.allow === "any" || route.allow.includes(who)));
        let ok, want;
        if (allowed) { ok = r.status !== 401 && r.status !== 403 && r.status < 500; want = "pass the gate (not 401/403/5xx)"; }
        else if (who === "anon") { ok = r.status === 401; want = "401"; }
        else { ok = r.status === 403; want = "403"; }
        cells++; if (ok) cellsOk++;
        statusLog.push(`${route.method} ${route.path} ${who}=${r.status}`);
        if (!ok) bad.push(`${who}: got ${r.status}, want ${want}`);
      }
      const label = `matrix.${route.method}_${route.path.replace(/^\/api\//, "").replace(/[^a-z0-9]+/gi, "_")}`;
      const who = route.allow === "any" ? "any logged-in role" : Array.isArray(route.allow) ? route.allow.join("|") : route.allow;
      t.check(label, bad.length === 0, `${route.gap ? "[route is open in Go source] " : ""}allowed=${who}; ${bad.join("; ")}`);
    }

    /* ---------- public routes: no identity may be blocked or crash the server ---------- */
    {
      const bad = [];
      for (const [method, path, extra] of PUBLIC) {
        for (const who of ["anon", ...ROLES]) {
          const r = await call(who, { method, path, ...(extra || {}) });
          cells++;
          // 400/404/405/200/3xx are all fine; 401/403 means an unexpected gate, 5xx a crash on garbage input
          const ok = r.status !== 401 && r.status !== 403 && r.status < 500;
          if (ok) cellsOk++; else bad.push(`${who} ${method} ${path}=${r.status}`);
        }
      }
      t.check("matrix.public_routes_open_to_all", bad.length === 0, bad.slice(0, 8).join("; ") + (bad.length > 8 ? ` (+${bad.length - 8} more)` : ""));
    }

    /* ---------- sanity: gate is real, not a blanket 401 / blanket 200 ---------- */
    {
      const a = await call("admin", R("GET", "/api/admin/system-health", []));
      const p = await call("patient", R("GET", "/api/admin/system-health", []));
      t.check("gate_discriminates_roles", a.status === 200 && p.status === 403, `admin=${a.status} patient=${p.status} (want 200 vs 403)`);
      const g = await call("anon", R("GET", "/api/auth/me", []), { Authorization: "Bearer garbage.token.value" });
      t.check("garbage_bearer_401", g.status === 401, `status=${g.status}`);
      const nb = await t.api("/api/auth/me", { headers: { "X-Forwarded-For": t.ip(), Authorization: "Basic " + Buffer.from("admin@sihat.com:password123").toString("base64") } });
      t.check("basic_auth_not_accepted", nb.status === 401, `status=${nb.status}`);
      const ck = await t.api("/api/auth/me", { headers: { "X-Forwarded-For": t.ip(), Cookie: "sb-access-token=" + ids.doctor.token } });
      t.check("cookie_token_authenticates", ck.status === 200 && ck.json?.user?.role === "doctor", `status=${ck.status} role=${ck.json?.user?.role}`);
      const ckBad = await t.api("/api/doctor/requests", { headers: { "X-Forwarded-For": t.ip(), Cookie: "sb-access-token=" + ids.patient.token } });
      t.check("cookie_patient_token_still_403_on_doctor", ckBad.status === 403, `status=${ckBad.status}`);
      const m = await t.api("/api/doctor/requests", { method: "POST", token: ids.doctor.token, headers: { "X-Forwarded-For": t.ip() } });
      t.check("wrong_method_405", m.status === 405, `POST on a GET-only route status=${m.status}`);
      const nf = await t.api("/api/does-not-exist", { token: ids.admin.token, headers: { "X-Forwarded-For": t.ip() } });
      t.check("unknown_api_404", nf.status === 404, `status=${nf.status}`);
    }

    /* ---------- /api/auth/me per role ---------- */
    const userIds = [];
    for (const role of ROLES) {
      const r = await call(role, R("GET", "/api/auth/me", "any"));
      const u = r.json?.user || {};
      userIds.push(u.id);
      t.check(`me.${role}`, r.status === 200 && u.role === role && u.email === `${role}@sihat.com` && !!u.id, `status=${r.status} user=${JSON.stringify(u)}`);
    }
    t.check("me.ids_distinct_and_match_login", new Set(userIds).size === 4 && ROLES.every((r, i) => userIds[i] === ids[r].id), `ids=${JSON.stringify(userIds)} login ids=${JSON.stringify(ROLES.map((r) => ids[r].id))}`);

    /* ---------- page interfaces per role ---------- */
    const page = async (who, path) => { const r = await call(who, { method: "GET", path }); return { status: r.status, loc: r.headers.get("location") || "", text: r.text }; };
    const pageCheck = (label, p, status, loc) => t.check(label, p.status === status && (loc === undefined || p.loc === loc), `status=${p.status} location=${p.loc || "-"} (want ${status}${loc !== undefined ? " -> " + (loc || "-") : ""})`);
    for (const path of ["/patient", "/doctor", "/admin", "/patient/report/abc"]) {
      pageCheck(`page.anon${path.replace(/[^a-z]+/g, "_")}_to_login`, await page("anon", path), 302, "/login");
    }
    pageCheck("page.anon_login_renders", await page("anon", "/login"), 200);
    // /demo is the public investor tour: 200 for anonymous AND every role, never a redirect
    pageCheck("page.anon_demo_200", await page("anon", "/demo"), 200);
    for (const role of ROLES) pageCheck(`page.${role}_demo_200`, await page(role, "/demo"), 200);
    // /video is public too (indexable promo page): 200 for anonymous and every role
    pageCheck("page.anon_video_200", await page("anon", "/video"), 200);
    for (const role of ROLES) pageCheck(`page.${role}_video_200`, await page(role, "/video"), 200);
    for (const role of ROLES) pageCheck(`page.${role}_patient_200`, await page(role, "/patient"), 200);
    pageCheck("page.doctor_doctor_200", await page("doctor", "/doctor"), 200);
    // /admin: only admin+developer; others bounce to their own dashboard (pgRedirectByRole)
    pageCheck("page.admin_admin_200", await page("admin", "/admin"), 200);
    pageCheck("page.developer_admin_200", await page("developer", "/admin"), 200);
    pageCheck("page.patient_admin_bounced_to_patient", await page("patient", "/admin"), 302, "/patient");
    pageCheck("page.doctor_admin_bounced_to_doctor", await page("doctor", "/admin"), 302, "/doctor");
    // /doctor shell: handler comment says any authed role may view, but a patient landing on the doctor dashboard is
    // inconsistent with /admin; correct behaviour = bounce to the patient's own dashboard
    pageCheck("page.patient_doctor_bounced_to_patient", await page("patient", "/doctor"), 302, "/patient");
    // already-signed-in visitors of /login go to THEIR dashboard
    pageCheck("page.login_patient_to_patient", await page("patient", "/login"), 302, "/patient");
    pageCheck("page.login_doctor_to_doctor", await page("doctor", "/login"), 302, "/doctor");
    pageCheck("page.login_admin_to_admin", await page("admin", "/login"), 302, "/admin");
    pageCheck("page.login_developer_to_admin", await page("developer", "/login"), 302, "/admin");
    {
      const a = await page("admin", "/admin"), d = await page("doctor", "/doctor");
      t.check("page.render_marks_role_pages", /admin/i.test(a.text) && a.text.length > 500 && d.text.length > 500, `admin html ${a.text.length}b, doctor html ${d.text.length}b`);
    }

    /* ---------- data endpoints: own rows only ---------- */
    let seeded = null;
    if (t.hasDb) {
      const post = (table, rows) => t.dbInsert(table, rows);
      const tag = "roles-" + t.uniq();
      const ds = await post("diagnosis_sessions", [
        { user_id: ids.patient.id, primary_diagnosis: "Qi deficiency " + tag, symptoms: [tag], constitution: "qi", full_report: { tag } },
        { user_id: ids.doctor.id, primary_diagnosis: "Yin deficiency " + tag, symptoms: [tag], constitution: "yin", full_report: { tag } }]);   // primary_diagnosis + full_report are NOT NULL in db/schema.sql (a real DB rejects rows without them)
      const iq = await post("inquiries", [
        { user_id: ids.patient.id, doctor_id: ids.doctor.id, symptoms: tag, status: "pending", diagnosis_report: { messages: [] } },
        { user_id: ids.doctor.id, doctor_id: null, symptoms: tag, status: "pending", diagnosis_report: { messages: [] } }]);
      if (Array.isArray(ds) && Array.isArray(iq) && ds.length === 2 && iq.length === 2) seeded = { sP: ds[0].id, sD: ds[1].id, qP: iq[0].id, qD: iq[1].id };
    }
    if (!seeded) {
      t.skip("data.own_rows_only", "no DB access (t.hasDb) to seed rows into");
    } else {
      const ownOnly = async (label, path, key, mine, others) => {
        for (const role of ["patient", "doctor", "admin", "developer"]) {
          const r = await call(role, R("GET", path, "any"));
          const idsBack = (r.json?.[key] || []).map((x) => x.id);
          const wantMine = mine[role];
          const okShape = r.status === 200 && Array.isArray(r.json?.[key]);
          const hasMine = wantMine ? idsBack.includes(wantMine) : true;
          const leaks = Object.entries(mine).filter(([k, id]) => k !== role && id && idsBack.includes(id)).map(([k]) => k);
          t.check(`${label}.${role}`, okShape && hasMine && leaks.length === 0, `status=${r.status} rows=${idsBack.length} hasOwnSeed=${hasMine} leakedFrom=${leaks.join(",") || "-"}`);
        }
      };
      await ownOnly("data.patient_sessions", "/api/patient/sessions", "sessions", { patient: seeded.sP, doctor: seeded.sD }, null);
      await ownOnly("data.patient_requests", "/api/patient/requests", "requests", { patient: seeded.qP, doctor: seeded.qD }, null);
      const inbox = await call("doctor", R("GET", "/api/doctor/requests", ["doctor"]));
      const inboxIds = (inbox.json?.requests || []).map((x) => x.id);
      t.check("data.doctor_inbox_lists_patient_request", inbox.status === 200 && inboxIds.includes(seeded.qP), `status=${inbox.status} rows=${inboxIds.length} (patient's seeded request missing)`);
      const inboxP = await call("patient", R("GET", "/api/doctor/requests", ["doctor"]));
      t.check("data.patient_gets_no_inbox_rows", inboxP.status === 403 && !inboxP.json?.requests, `status=${inboxP.status} body=${inboxP.text.slice(0, 80)}`);
      const inboxA = await call("admin", R("GET", "/api/doctor/requests", ["doctor"]));
      t.check("data.admin_gets_no_inbox_rows", inboxA.status === 403 && !inboxA.json?.requests, `status=${inboxA.status}`);
    }
    for (const role of ROLES) {
      const r = await call(role, R("GET", "/api/patient/profile", "any"));
      const p = r.json?.profile || {};
      t.check(`data.profile_${role}_is_self`, r.status === 200 && p.email === `${role}@sihat.com` && p.role === role, `status=${r.status} email=${p.email} role=${p.role}`);
    }

    /* ---------- admin/developer surfaces + cross-role fences ---------- */
    for (const role of ["admin", "developer"]) {
      const h = await call(role, R("GET", "/api/admin/system-health", []));
      t.check(`surface.${role}_system_health_json`, h.status === 200 && h.json && typeof h.json === "object", `status=${h.status} body=${h.text.slice(0, 80)}`);
      const l = await call(role, R("GET", "/api/logs", []));
      t.check(`surface.${role}_logs_json`, l.status === 200 && l.json && typeof l.json === "object", `status=${l.status} body=${l.text.slice(0, 80)}`);
    }
    for (const role of ["patient", "doctor"]) {
      for (const p of ["/api/admin/system-health", "/api/logs"]) {
        const r = await call(role, R("GET", p, []));
        t.check(`fence.${role}_blocked_${p.replace(/[^a-z]+/gi, "_").replace(/^_api_/, "")}`, r.status === 403 && !/"(logs|errors|metrics)"/.test(r.text), `status=${r.status}`);
      }
    }
    {
      const s = await call("doctor", R("PUT", "/api/admin/settings", ["admin"], BAD));
      t.check("fence.doctor_cannot_write_admin_settings", s.status === 403, `status=${s.status}`);
      const s2 = await call("developer", R("PUT", "/api/admin/settings", ["admin"], BAD));
      t.check("fence.developer_cannot_write_admin_settings", s2.status === 403, `status=${s2.status}`);
      const s3 = await call("admin", R("PUT", "/api/admin/settings", ["admin"], BAD));
      t.check("fence.admin_passes_settings_gate", s3.status === 400, `status=${s3.status} (invalid JSON after the gate -> 400)`);
      for (const p of ["/api/doctor/requests", "/api/doctor/flag", "/api/doctor/reply", "/api/doctor/treatment-plan"]) {
        const r = await call("admin", { method: p.endsWith("requests") ? "GET" : "POST", path: p, ...(p.endsWith("requests") ? {} : BAD) });
        const rd = await call("developer", { method: p.endsWith("requests") ? "GET" : "POST", path: p, ...(p.endsWith("requests") ? {} : BAD) });
        t.check(`fence.admin_dev_not_doctor${p.replace(/[^a-z]+/gi, "_")}`, r.status === 403 && rd.status === 403, `admin=${r.status} developer=${rd.status} (doctor-only route)`);
      }
    }

    /* ---------- logout (public, but it revokes the token it carries): LAST, after every cell that needs live tokens ---------- */
    {
      const bad = [], notRevoked = [];
      for (const who of ["anon", ...ROLES]) {
        const r = await call(who, { method: "POST", path: "/api/auth/logout" });
        cells++;
        const ok = r.status !== 401 && r.status !== 403 && r.status < 500;
        if (ok) cellsOk++; else bad.push(`${who} POST /api/auth/logout=${r.status}`);
        if (who !== "anon") {
          const me = await call(who, R("GET", "/api/auth/me", "any"));
          if (me.status !== 401) notRevoked.push(`${who}: /me after logout=${me.status}`);
        }
      }
      t.check("matrix.public_logout_open_to_all", bad.length === 0, bad.join("; "));
      t.check("logout.revokes_token_for_every_role", notRevoked.length === 0, `a logged-out token still authenticates: ${notRevoked.join("; ")}`);
      await new Promise((r) => setTimeout(r, 1100));   // the next suite's login of the same account must not mint a byte-identical (already revoked) JWT within the same second
    }

    const total = cells;
    t.elog(`roles: ${cellsOk}/${total} route x role cells verified`);
    t.check(`matrix_${total}_cells_all_verified`, cellsOk === total, `${cellsOk}/${total} route x role cells verified (${ROUTES.length} gated + ${PUBLIC.length + 1} public routes x 5 identities)`);
  },
};
