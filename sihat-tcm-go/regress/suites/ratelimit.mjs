/**
 * ratelimit — per-IP+path limiter (internal/server/auth.go RateLimit).
 * Limits: signup 5/min, login 10/min, forgot-password 3/min, reset-password 5/min, AI endpoints 20/min.
 * Every bucket is a throwaway IP used by exactly one check group (the suite is the only one that
 * exhausts buckets deliberately).
 */
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";

export default {
  name: "ratelimit", needs: "stack", mutating: true, costly: false,
  doc: "per-IP+path limiter: N passes / N+1 = 429+Retry-After+JSON error, endpoint & IP isolation, handler not run on 429, concurrent burst exactness, XFF-spoof bypass",
  async run(t) {
    const post = (path, body, ip, extra = {}) => t.api(path, { method: "POST", body, headers: { "X-Forwarded-For": ip, ...extra } });
    const uniq = () => t.uniq() + Math.floor(Math.random() * 1e6).toString(36);
    const signupBody = (email) => ({ email, password: PW, name: "RL " + email, role: "patient" });
    const loginBad = (ip) => post("/api/auth/login", { email: "patient@sihat.com", password: "wrong-" + uniq() }, ip);
    const loginGood = (ip, email = "patient@sihat.com") => post("/api/auth/login", { email, password: PW }, ip);
    const forgot = (ip) => post("/api/auth/forgot-password", { email: `rl-${uniq()}@example.com` }, ip);
    const reset = (ip) => post("/api/auth/reset-password", { token_hash: "bogus-" + uniq(), password: "abcd1234" }, ip);
    const seq = async (n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(await fn(i)); return out; };
    const sts = (rs) => rs.map((r) => r.status).join(",");

    /* ---------- signup 5/min ---------- */
    {
      const ip = t.ip();
      const emails = Array.from({ length: 5 }, () => `rl-su-${uniq()}@example.com`);
      const rs = await seq(5, (i) => post("/api/auth/signup", signupBody(emails[i]), ip));
      t.check("signup.first5_allowed", rs.every((r) => r.status === 200 && r.json?.success === true), `statuses=${sts(rs)} (want 5x200)`);
      const sixthEmail = `rl-su6-${uniq()}@example.com`;
      const r6 = await post("/api/auth/signup", signupBody(sixthEmail), ip);
      t.check("signup.6th_is_429", r6.status === 429, `status=${r6.status} body=${r6.text.slice(0, 100)}`);
      const ra = r6.headers.get("retry-after");
      t.check("signup.429_retry_after_header", !!ra && Number(ra) > 0 && Number(ra) <= 120, `Retry-After=${ra} (want positive seconds <=120)`);
      t.check("signup.429_json_error", typeof r6.json?.error === "string" && r6.json.error.length > 0, `body=${r6.text.slice(0, 100)}`);
      t.check("signup.429_content_type_json", /application\/json/i.test(r6.headers.get("content-type") || ""), `content-type=${r6.headers.get("content-type")}`);
      t.check("signup.429_no_session_cookie", !/sb-access-token=/.test(r6.setCookie), `Set-Cookie on a 429: ${r6.setCookie.slice(0, 60)}`);
      const r7 = await post("/api/auth/signup", signupBody(`rl-su7-${uniq()}@example.com`), ip);
      t.check("signup.stays_blocked_7th", r7.status === 429, `status=${r7.status}`);

      // handler must NOT run on 429: the blocked email can't log in (and the 5 allowed ones can)
      const ok1 = await loginGood(t.ip(), emails[0]);
      t.check("signup.allowed_user_can_login", ok1.status === 200 && ok1.json?.success === true, `status=${ok1.status} (proves signups within the limit really created users)`);
      const ghost = await loginGood(t.ip(), sixthEmail);
      t.check("signup.429_did_not_create_user", ghost.status === 401, `login of rate-limited signup email: status=${ghost.status} (want 401 = no user created)`);

      // other IP unaffected (per-IP isolation) and other endpoints on the same IP unaffected
      const other = await post("/api/auth/signup", signupBody(`rl-su-o-${uniq()}@example.com`), t.ip());
      t.check("signup.other_ip_not_limited", other.status === 200, `status=${other.status} (a different client IP must have its own bucket)`);
      const lg = await loginGood(ip);
      t.check("signup.exhausted_does_not_429_login", lg.status === 200, `login on same IP after signup exhaustion: status=${lg.status}`);
      const fg = await forgot(ip);
      t.check("signup.exhausted_does_not_429_forgot", fg.status === 200, `forgot on same IP: status=${fg.status}`);
    }

    /* ---------- login 10/min ---------- */
    {
      const ip = t.ip();
      const rs = await seq(10, () => loginBad(ip));
      t.check("login.first10_allowed_401", rs.every((r) => r.status === 401), `statuses=${sts(rs)} (want 10x401, never 429)`);
      const r11 = await loginBad(ip);
      t.check("login.11th_is_429", r11.status === 429, `status=${r11.status}`);
      t.check("login.429_retry_after", Number(r11.headers.get("retry-after")) > 0, `Retry-After=${r11.headers.get("retry-after")}`);
      t.check("login.429_json_error", typeof r11.json?.error === "string" && r11.json.error.length > 0, `body=${r11.text.slice(0, 100)}`);
      const good = await loginGood(ip);
      t.check("login.valid_creds_also_429_once_exhausted", good.status === 429, `valid login after exhaustion: status=${good.status} (limiter must fire before credential check)`);
      t.check("login.429_no_session_cookie", !/sb-access-token=/.test(good.setCookie), "a blocked login must not set a session cookie");
      const other = await loginGood(t.ip());
      t.check("login.other_ip_not_limited", other.status === 200, `status=${other.status}`);
      const fg = await forgot(ip);
      t.check("login.exhausted_does_not_429_forgot", fg.status === 200, `status=${fg.status}`);
      const rp = await reset(ip);
      t.check("login.exhausted_does_not_429_reset", rp.status === 400, `status=${rp.status} (want handler's 400 for bogus token, not 429)`);
    }

    /* ---------- forgot-password 3/min ---------- */
    {
      const ip = t.ip();
      const rs = await seq(3, () => forgot(ip));
      t.check("forgot.first3_allowed", rs.every((r) => r.status === 200 && r.json?.success === true), `statuses=${sts(rs)}`);
      const r4 = await forgot(ip);
      t.check("forgot.4th_is_429", r4.status === 429, `status=${r4.status}`);
      t.check("forgot.429_retry_after_and_error", Number(r4.headers.get("retry-after")) > 0 && typeof r4.json?.error === "string", `Retry-After=${r4.headers.get("retry-after")} body=${r4.text.slice(0, 80)}`);
      t.check("forgot.429_not_enumeration_body", r4.json?.success !== true, `429 body claims success: ${r4.text.slice(0, 80)}`);
      const lg = await loginGood(ip);
      t.check("forgot.exhausted_does_not_429_login", lg.status === 200, `status=${lg.status}`);
      const su = await post("/api/auth/signup", signupBody(`rl-fg-${uniq()}@example.com`), ip);
      t.check("forgot.exhausted_does_not_429_signup", su.status === 200, `status=${su.status}`);
      const rp = await reset(ip);
      t.check("forgot.exhausted_does_not_429_reset", rp.status === 400, `status=${rp.status}`);
    }

    /* ---------- reset-password 5/min ---------- */
    {
      const ip = t.ip();
      const rs = await seq(5, () => reset(ip));
      t.check("reset.first5_allowed_400", rs.every((r) => r.status === 400), `statuses=${sts(rs)} (want 5x400 bogus-token, never 429)`);
      const r6 = await reset(ip);
      t.check("reset.6th_is_429", r6.status === 429, `status=${r6.status}`);
      t.check("reset.429_retry_after_and_error", Number(r6.headers.get("retry-after")) > 0 && typeof r6.json?.error === "string", `Retry-After=${r6.headers.get("retry-after")} body=${r6.text.slice(0, 80)}`);
      const fg = await forgot(ip);
      t.check("reset.exhausted_does_not_429_forgot", fg.status === 200, `status=${fg.status}`);
    }

    /* ---------- AI endpoints 20/min (invalid bodies: cheap, still counted) ---------- */
    {
      const eps = ["/api/chat", "/api/consult", "/api/report-chat", "/api/western-chat", "/api/heart-companion"];
      await Promise.all(eps.map(async (ep) => {
        const ip = t.ip();
        const name = ep.split("/").pop().replace(/-/g, "_");
        const rs = await seq(20, () => post(ep, {}, ip));
        t.check(`ai.${name}.first20_allowed`, rs.every((r) => r.status !== 429), `statuses=${sts(rs)} (none may be 429)`);
        const r21 = await post(ep, {}, ip);
        t.check(`ai.${name}.21st_is_429`, r21.status === 429, `status=${r21.status}`);
        t.check(`ai.${name}.429_retry_after_and_error`, Number(r21.headers.get("retry-after")) > 0 && typeof r21.json?.error === "string", `Retry-After=${r21.headers.get("retry-after")} body=${r21.text.slice(0, 80)}`);
        const sib = await post(eps.find((x) => x !== ep), {}, ip);
        t.check(`ai.${name}.exhausted_does_not_429_sibling_endpoint`, sib.status !== 429, `sibling AI endpoint on same IP: status=${sib.status} (buckets are per path)`);
      }));
    }

    /* ---------- healthy low-volume use never 429s ---------- */
    {
      const ip = t.ip();
      const a = await loginGood(ip, "patient@sihat.com");
      const b = await loginGood(ip, "doctor@sihat.com");
      const c = await loginGood(ip, "admin@sihat.com");
      const f = await forgot(ip);
      const s = await post("/api/auth/signup", signupBody(`rl-low-${uniq()}@example.com`), ip);
      t.check("lowvolume.mixed_use_never_429", [a, b, c, f, s].every((r) => r.status === 200), `login x3,forgot,signup -> ${sts([a, b, c, f, s])}`);
      const me = await t.get("/api/health", { headers: { "X-Forwarded-For": ip } });
      t.check("lowvolume.unlimited_routes_unaffected", me.status !== 429, `status=${me.status}`);
    }

    /* ---------- per-IP isolation: many clients in parallel, each within its own limit ---------- */
    {
      const ips = Array.from({ length: 8 }, () => t.ip());
      const rs = await Promise.all(ips.map((ip) => forgot(ip)));
      t.check("isolation.8_distinct_ips_each_get_own_bucket", rs.every((r) => r.status === 200), `statuses=${sts(rs)}`);
    }

    /* ---------- concurrent burst: counter must be race-safe ---------- */
    {
      const ip = t.ip();
      const rs = await Promise.all(Array.from({ length: 30 }, () => forgot(ip)));
      const ok = rs.filter((r) => r.status !== 429).length;
      const lim = rs.filter((r) => r.status === 429).length;
      t.check("burst.forgot_30_parallel_exactly_3_pass", ok === 3 && lim === 27, `non-429=${ok} 429=${lim} (want exactly 3 / 27)`);
      t.check("burst.forgot_all_429_have_retry_after", rs.filter((r) => r.status === 429).every((r) => Number(r.headers.get("retry-after")) > 0), "some 429 lacked Retry-After");
      const ip2 = t.ip();
      const rl = await Promise.all(Array.from({ length: 30 }, () => loginBad(ip2)));
      const ok2 = rl.filter((r) => r.status !== 429).length;
      t.check("burst.login_30_parallel_exactly_10_pass", ok2 === 10 && rl.every((r) => r.status === 429 || r.status === 401), `non-429=${ok2} (want exactly 10); statuses=${[...new Set(rl.map((r) => r.status))].join("/")}`);
      const ip3 = t.ip();
      const emails = Array.from({ length: 30 }, () => `rl-bs-${uniq()}@example.com`);
      const rsu = await Promise.all(emails.map((e) => post("/api/auth/signup", signupBody(e), ip3)));
      const okSu = rsu.filter((r) => r.status === 200).length;
      t.check("burst.signup_30_parallel_exactly_5_succeed", okSu === 5 && rsu.filter((r) => r.status === 429).length === 25, `200=${okSu} 429=${rsu.filter((r) => r.status === 429).length} other=${rsu.filter((r) => r.status !== 200 && r.status !== 429).map((r) => r.status)} (want 5/25)`);
      // exactly the 200s created users, none of the 429s did
      const logins = await Promise.all(emails.map((e) => loginGood(t.ip(), e)));
      const created = logins.filter((r) => r.status === 200).length;
      t.check("burst.signup_users_created_equals_allowed", created === okSu, `users that can log in=${created}, signups answered 200=${okSu} (a 429 must not run the handler)`);
    }

    /* ---------- spoofable key: rotating X-Forwarded-For from ONE peer must not bypass ---------- */
    {
      // All requests below come from the same TCP peer (this process). The limiter keys on the FIRST
      // X-Forwarded-For entry, so a client that simply rotates that header gets a fresh bucket each time.
      // DESIRED: the limit still binds the real peer (trusted-proxy model: loopback peer => right-most XFF / CF-Connecting-IP; public peer => ignore headers).
      // what an attacker produces THROUGH nginx: client-chosen prefix, then the real peer appended last by the proxy
      const realPeer = `10.77.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
      const fgRs = await seq(12, () => forgot(`${t.ip()}, ${realPeer}`));
      const fg429 = fgRs.filter((r) => r.status === 429).length;
      t.check("spoof.forgot_rotating_xff_does_not_bypass", fg429 > 0, `12 forgot-password requests (limit 3/min) from one peer with 12 different X-Forwarded-For values -> 429 count=${fg429}; APP BUG: clientIP() (internal/server/auth.go:136) trusts the first X-Forwarded-For entry so the per-IP limiter is bypassable by header rotation (enables credential-stuffing on /api/auth/login)`);
      const lgRs = await seq(25, () => loginBad(`${t.ip()}, ${realPeer}`));
      const lg429 = lgRs.filter((r) => r.status === 429).length;
      t.check("spoof.login_rotating_xff_does_not_bypass", lg429 > 0, `25 wrong-password logins (limit 10/min) from one peer with rotating X-Forwarded-For -> 429 count=${lg429}; brute force is unthrottled`);
      // sanity of the contrast: same header value repeated IS limited (proves the check above is about rotation)
      const fixed = t.ip();
      const fx = await seq(5, () => forgot(fixed));
      t.check("spoof.control_fixed_xff_is_limited", fx.filter((r) => r.status === 429).length === 2, `statuses=${sts(fx)} (want 3 pass + 2x429)`);
    }
  },
};
