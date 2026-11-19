/**
 * hunt_sec — defects found by the second-pass security hunt (sessions, reset flow, input identity, headers,
 * abuse limits, secrets in logs, deploy config).
 * Every check asserts the CORRECT behaviour and is RED today; it goes green when the defect is fixed.
 * Ids sec-NN are the hunt report ids (see each check label). Needs --db=sqlite (or fake). Mutating: creates
 * hunt-sec-*@example.com accounts and a few anonymous guest rows (notes=hunt-sec-pad).
 *
 *   ACI_PORT_OFFSET=4780 node aci.mjs test --suite=hunt_sec --db=sqlite --ai=fake
 *
 * (offsets whose db port 54329+N lands in a Windows-excluded TCP range, e.g. 4438..4637 on this PC, cannot bind: use 4780.)
 * The "source" checks (sec-12..sec-17) read the repo files relative to this suite; they are skipped against a remote --base.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => { try { return readFileSync(join(here, "..", "..", rel), "utf8"); } catch { return null; } };
const lineNo = (text, idx) => text.slice(0, idx).split("\n").length;

export default {
  name: "hunt_sec",
  doc: "security hunt #2: logout/reset/password-change do not revoke sessions, session token accepted as a reset proof, invisible chars in emails/names, no CSP/Permissions-Policy, unthrottled anonymous writes (report-viewed, guest sessions), IPv6 /64 + per-account brute-force limits, API key in logs, unbounded rate-limit map, nginx HSTS / CF-Connecting-IP, server timeouts",
  needs: "stack",
  mutating: true,
  costly: false,
  async run(t) {
    const u = t.uniq();
    const call = (path, { method = "GET", body, token, headers = {}, ip = t.ip() } = {}) =>
      t.api(path, { method, body, token, headers: { "X-Forwarded-For": ip, ...headers } });
    const mk = async (tag, name = "Hunt Sec") => {
      const email = `hunt-sec-${u}-${tag}@example.com`;
      const s = await t.signup(email, name, "patient", {}, t.ip());
      return { email, ...s };
    };

    /* ---------- sec-01 (P2): logout only clears the cookie; the access token keeps working until it expires ---------- */
    {
      const a = await mk("logout");
      if (!a.ok) t.check("sec-01.fixture", false, `signup failed: ${a.raw?.status}`);
      else {
        const before = await call("/api/auth/me", { token: a.token });
        const lo = await call("/api/auth/logout", { method: "POST", token: a.token });
        const after = await call("/api/auth/me", { token: a.token });
        t.check("sec-01.logout_revokes_the_session_token", before.status === 200 && lo.status === 200 && after.status === 401,
          `/api/auth/me with the session token: before logout ${before.status}, logout ${lo.status}, AFTER logout ${after.status} (expected 401). handleAuthLogout only expires the cookie; a copied/stolen token (browser history, proxy log, XSS-free shared PC) stays valid for the full 1 h and there is no server-side session to kill`);
      }
    }

    /* ---------- sec-02 (P1): /api/auth/reset-password accepts ANY live session access token as the "recovery proof" ---------- */
    {
      const b = await mk("resetswap");
      if (!b.ok) t.check("sec-02.fixture", false, `signup failed: ${b.raw?.status}`);
      else {
        const newPw = "Changed-" + u + "!";
        const rp = await call("/api/auth/reset-password", { method: "POST", body: { access_token: b.token, password: newPw } });
        const oldLogin = await t.login(b.email, PW, t.ip());
        const newLogin = await t.login(b.email, newPw, t.ip());
        t.check("sec-02.reset_password_rejects_a_normal_session_token", rp.status >= 400 && oldLogin.ok && !newLogin.ok,
          `POST /api/auth/reset-password {access_token:<ordinary login/signup token>, password:new} -> ${rp.status} ${rp.text.slice(0, 80)}; old password still logs in=${oldLogin.ok}, NEW password logs in=${newLogin.ok}. The password changed without the old password and without any recovery link (handleResetPassword passes access_token straight to UpdatePassword): whoever holds a session token for even a moment can make the takeover permanent`);
      }
    }

    /* ---------- sec-03 (P2): changing the password through the real recovery flow leaves every earlier access token valid ---------- */
    {
      const c = await mk("pwchange");
      if (!c.ok || !t.dbBase) t.skip("sec-03.password_reset_revokes_existing_tokens", c.ok ? "needs the DB test hook /__fake/recovery" : `signup failed: ${c.raw?.status}`);
      else {
        await call("/api/auth/forgot-password", { method: "POST", body: { email: c.email } });
        let th = null;
        try { th = (await (await fetch(`${t.dbBase}/__fake/recovery?email=${encodeURIComponent(c.email)}`)).json()).token_hash; } catch { /* hook missing */ }
        if (!th) t.skip("sec-03.password_reset_revokes_existing_tokens", "no recovery token_hash available from the test hook");
        else {
          const newPw = "Recovered-" + u + "!";
          const rp = await call("/api/auth/reset-password", { method: "POST", body: { token_hash: th, password: newPw } });
          const stale = await call("/api/auth/me", { token: c.token });
          if (t.dbMode === "fake") t.skip("sec-03.password_reset_revokes_existing_tokens", "fake GoTrue tokens carry no session_id, so session revocation on password change cannot be observed; verified on --db=sqlite"); else t.check("sec-03.password_reset_revokes_existing_tokens", rp.status === 200 && stale.status === 401,
            `reset via token_hash -> ${rp.status}; the access token issued BEFORE the reset still answers /api/auth/me ${stale.status} (expected 401). A victim who resets a compromised password keeps the attacker logged in for up to an hour (JWT carries session_id but nothing checks it)`);
        }
      }
    }

    /* ---------- sec-04 (P2): emails with invisible / control / bidi / HTML characters are accepted ---------- */
    {
      const probes = [["NUL", "\u0000"], ["ZWSP", "​"], ["RLO", "‮"], ["DEL", "\u007f"], ["NBSP", " "], ["lt-gt", "<b>"]];
      const accepted = [];
      for (const [label, ch] of probes) {
        const email = `hunt-sec-${u}-e${label}${ch}x@example.com`;
        const r = await call("/api/auth/signup", { method: "POST", body: { email, password: PW, name: "Hunt Sec" } });
        if (r.status < 400) accepted.push(label);
      }
      t.check("sec-04.signup_email_rejects_invisible_control_and_html_characters", accepted.length === 0,
        `signup accepted an email containing: ${accepted.join(", ") || "-"} (the address is the account identity: a ZWSP/RLO/NBSP twin of a real address is a look-alike account in the doctor inbox and admin lists, NUL/DEL end up in the DB and logs; app check is only Contains("@") and localdb's regexp \\s is ASCII-only)`);
    }

    /* ---------- sec-05 (P3): display names with control / bidi-override characters ---------- */
    {
      const bad = [];
      for (const [label, name] of [["NUL", "Dr\u0000 Lew"], ["RLO", "Dr ‮weL"]]) {
        const r = await call("/api/auth/signup", { method: "POST", body: { email: `hunt-sec-${u}-n${label}@example.com`, password: PW, name } });
        if (r.status < 400) bad.push(label);
      }
      t.check("sec-05.signup_name_rejects_control_and_bidi_override_characters", bad.length === 0,
        `signup accepted a name containing: ${bad.join(", ") || "-"} (names are rendered in the doctor inbox, directory and admin tables; U+202E reverses the text around it, NUL corrupts logs/exports)`);
    }

    /* ---------- sec-06 / sec-07 (P3): browser hardening headers ---------- */
    {
      const missing = [];
      for (const p of ["/", "/login"]) {
        const r = await call(p);
        const csp = r.headers.get("content-security-policy") || "";
        for (const d of ["frame-ancestors", "object-src", "base-uri"]) if (!new RegExp("(^|;)\\s*" + d + "\\b").test(csp)) missing.push(`${p}:${d}`);
      }
      t.check("sec-06.html_pages_send_a_content_security_policy", missing.length === 0,
        `no Content-Security-Policy (or one without these directives): ${missing.join(", ")}. The UI builds a lot of HTML with innerHTML from user/AI data; CSP is the backstop for the one escaping miss. frame-ancestors/object-src/base-uri can be set without touching inline scripts`);
      const pp = (await call("/")).headers.get("permissions-policy") || "";
      t.check("sec-07.html_pages_send_a_permissions_policy", /camera/.test(pp) && /microphone/.test(pp) && /geolocation/.test(pp),
        `Permissions-Policy = ${JSON.stringify(pp)}; the wizard uses camera + microphone, nothing uses geolocation: pin camera=(self), microphone=(self), geolocation=() so an injected frame/script cannot ask for them`);
    }

    /* ---------- sec-08 / sec-09 (P2): anonymous write endpoints with no rate limit ---------- */
    {
      const hammer = async (path, body) => {
        const ip = t.ip();
        let limited = 0, ok = 0;
        for (let i = 0; i < 45; i++) {
          const r = await t.api(path, { method: "POST", body, headers: { "X-Forwarded-For": ip } });
          if (r.status === 429) limited++; else if (r.status < 300) ok++;
        }
        return { limited, ok };
      };
      const rv = await hammer("/api/notifications/report-viewed", { isGuest: true });
      t.check("sec-08.report_viewed_is_rate_limited", rv.limited > 0,
        `45 rapid anonymous POST /api/notifications/report-viewed from one IP -> ${rv.limited} x 429 (route is not wrapped in s.RateLimit; with TELEGRAM_BOT_TOKEN set each call sends a Telegram message to the operator chat, so anyone can flood it and burn the bot's rate budget)`);
      const gs = await hammer("/api/guest/sessions", { full_report: { diagnosis: { primary_pattern: "hunt-sec" } }, primary_diagnosis: "hunt-sec-pad", notes: "hunt-sec-pad" });
      t.check("sec-09.guest_session_create_is_rate_limited", gs.limited > 0,
        `45 rapid anonymous POST /api/guest/sessions from one IP -> ${gs.ok} stored, ${gs.limited} x 429 (each may carry up to 2 MB; no RateLimit, no auth: unbounded database growth)`);
    }

    /* ---------- sec-10 (P2): rate limiter keys on the exact IPv6 address, not the /64 ---------- */
    {
      const net = (Math.floor(Math.random() * 0xffff)).toString(16);
      let limited = 0, tried = 0;
      for (let i = 1; i <= 14; i++) {
        const r = await t.api("/api/auth/login", { method: "POST", body: { email: `nobody-${u}@example.com`, password: "wrong-password-1" }, headers: { "X-Forwarded-For": `2001:db8:${net}:7::${i.toString(16)}` } });
        tried++; if (r.status === 429) limited++;
      }
      t.check("sec-10.rate_limit_buckets_ipv6_clients_by_their_64", limited > 0,
        `${tried} login attempts from 14 different addresses of ONE /64 (login limit is 10/min per client) -> ${limited} x 429. Every IPv6 subscriber owns a /64 (2^64 addresses), so all per-IP limits (login, signup, forgot-password, AI endpoints) are bypassed by rotating the low bits; each bypassed login also costs a 100 ms PBKDF2`);
    }

    /* ---------- sec-11 (P3): no per-account throttle on password guessing ---------- */
    {
      const v = await mk("brute");
      if (!v.ok) t.check("sec-11.fixture", false, `signup failed: ${v.raw?.status}`);
      else {
        let n429 = 0, n401 = 0;
        for (let i = 0; i < 25; i++) {
          const r = await t.api("/api/auth/login", { method: "POST", body: { email: v.email, password: "wrong-guess-" + i }, headers: { "X-Forwarded-For": t.ip() } });
          if (r.status === 429) n429++; else if (r.status === 401) n401++;
        }
        t.check("sec-11.login_throttles_guessing_per_account", n429 > 0,
          `25 wrong passwords for ONE account from 25 different client addresses -> ${n401} x 401, ${n429} x 429. Only a per-IP limit exists, so a botnet/IPv6 pool guesses forever (the demo accounts use password123, real ones whatever users pick). Expect a per-account counter/backoff`);
      }
    }

    /* ---------- sec-12 (P2): the Gemini API key is written to the server log inside upstream error URLs ---------- */
    {
      const files = ["internal/server/handlers_ai.go", "internal/server/handlers_data.go", "internal/server/handlers_admin.go"];
      const texts = files.map((f) => [f, src(f)]);
      if (texts.some(([, s]) => s == null)) t.skip("sec-12.upstream_ai_errors_are_redacted_before_logging", "Go sources not readable from this suite (remote --base?)");
      else {
        const clientRedacts = /redact/i.test(["internal/gemini/client.go", "internal/gemini/stream.go"].map((f) => src(f) || "").join("\n"));
        const offenders = [];
        for (const [f, s] of texts) {
          const re = /log\.Printf\([^\n]*(ai stream failed|test-api-key|patient-summary gemini)[^\n]*/g;
          let m;
          while ((m = re.exec(s))) if (!/redact/i.test(m[0])) offenders.push(`${f}:${lineNo(s, m.index)}`);
        }
        t.check("sec-12.upstream_ai_errors_are_redacted_before_logging", clientRedacts || offenders.length === 0,
          `unredacted log.Printf of an upstream error at ${offenders.join(", ")}. Go's transport error embeds the request URL, which ends in ?key=<GEMINI_API_KEY>; repro: stop the AI backend and call POST /api/chat -> log line 'ai stream failed: ... Post "http://.../streamGenerateContent?alt=sse&key=sihat-listener": dial tcp ...' (the other AI paths already use anRedactKey, see handlers_analysis.go:80). In production the real key lands in journald/PM2 logs on any upstream outage`);
      }
    }

    /* ---------- sec-13 / sec-14 (P3): nginx site config ---------- */
    {
      const conf = src("deploy/tcm.wenjyue.com.nginx.conf");
      if (conf == null) {
        t.skip("sec-13.nginx_sends_hsts", "deploy/tcm.wenjyue.com.nginx.conf not readable");
        t.skip("sec-14.nginx_overwrites_cf_connecting_ip", "deploy/tcm.wenjyue.com.nginx.conf not readable");
      } else {
        t.check("sec-13.nginx_sends_hsts", /add_header\s+Strict-Transport-Security\b/i.test(conf),
          "deploy/tcm.wenjyue.com.nginx.conf sets no Strict-Transport-Security header (the app never sends one either): the login cookie is Secure, but a first visit over http:// and any sslstrip-style downgrade is not prevented. Add 'add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;' to the 443 server");
        t.check("sec-14.nginx_overwrites_cf_connecting_ip", /proxy_set_header\s+CF-Connecting-IP\b/i.test(conf),
          "the app trusts CF-Connecting-IP first whenever the TCP peer is loopback (clientIP in internal/server/auth.go). nginx forwards the CLIENT's CF-Connecting-IP header untouched, so anyone who reaches the origin without going through Cloudflare picks their own rate-limit identity per request (login/signup/forgot limits all bypassed). nginx must overwrite it ('proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;' only inside a Cloudflare-IP-restricted server, otherwise set it from $remote_addr) or the origin must only accept Cloudflare ranges");
      }
    }

    /* ---------- sec-15 (P3): the HTTP server has no timeouts (slowloris) ---------- */
    {
      const main = src("main.go");
      if (main == null) t.skip("sec-15.http_server_sets_read_header_timeout", "main.go not readable");
      else t.check("sec-15.http_server_sets_read_header_timeout", /ReadHeaderTimeout\s*:/.test(main) && /IdleTimeout\s*:/.test(main),
        "main.go builds http.Server{Addr, Handler} with no ReadHeaderTimeout/IdleTimeout (and it binds ':'+PORT, i.e. every interface): one client dribbling header bytes holds a goroutine + socket forever; DEPLOY.md only asks ops not to expose :3200");
    }

    /* ---------- sec-16 (P3): mobile app token compared with != ---------- */
    {
      const adm = src("internal/server/handlers_admin.go");
      if (adm == null) t.skip("sec-16.gemini_key_endpoint_compares_token_in_constant_time", "handlers_admin.go not readable");
      else t.check("sec-16.gemini_key_endpoint_compares_token_in_constant_time", /subtle\.ConstantTimeCompare/.test(adm),
        "handleConfigGeminiKey compares X-App-Token to MOBILE_APP_TOKEN with '!=' (timing side channel) on an unauthenticated, un-rate-limited route whose only job is to hand out the live Gemini API key. Use crypto/subtle.ConstantTimeCompare and wrap the route in RateLimit");
    }

    /* ---------- sec-17 (P2): the rate-limit map never evicts ---------- */
    {
      const auth = src("internal/server/auth.go");
      if (auth == null) t.skip("sec-17.rate_limit_map_evicts_expired_windows", "auth.go not readable");
      else t.check("sec-17.rate_limit_map_evicts_expired_windows", /delete\(\s*rateMap\b/.test(auth),
        "rateMap gets one entry per (client IP, path) and nothing ever deletes one. Measured: 200,000 requests from distinct (IPv6) client addresses grew the server's working set 40 MB -> 100 MB (~300 B per bucket) and it never shrinks; with sec-10 an attacker mints buckets at wire speed until the process is OOM-killed. Sweep windows older than a day (or use a bounded LRU)");
    }
  },
};
