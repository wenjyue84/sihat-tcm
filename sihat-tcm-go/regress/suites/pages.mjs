import net from "node:net";
import tls from "node:tls";

const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const LEAK = /module sihattcm|^package main|func main\(|GEMINI_API_KEY|SUPABASE_SERVICE/m;

/** Raw HTTP/1.1 request over a socket so the path is sent byte-for-byte (nothing normalises %2e%2e, \, NUL). */
function rawReq(base, rawPath, { method = "GET", headers = {} } = {}) {
  const u = new URL(base);
  return new Promise((resolve) => {
    const sock = u.protocol === "https:" ? tls.connect({ host: u.hostname, port: parseInt(u.port || "443", 10), servername: u.hostname }) : net.connect({ host: u.hostname, port: parseInt(u.port || "80", 10) });
    const chunks = [];
    let done = false;
    const fin = (err) => {
      if (done) return; done = true; sock.destroy();
      const buf = Buffer.concat(chunks).toString("latin1");
      const i = buf.indexOf("\r\n\r\n");
      const head = i >= 0 ? buf.slice(0, i) : buf;
      const body = i >= 0 ? buf.slice(i + 4) : "";
      const m = head.match(/^HTTP\/1\.[01] (\d{3})/);
      const hs = {};
      for (const l of head.split("\r\n").slice(1)) { const k = l.indexOf(":"); if (k > 0) hs[l.slice(0, k).toLowerCase()] = l.slice(k + 1).trim(); }
      resolve({ status: m ? +m[1] : 0, headers: hs, body, err: err ? String(err) : "" });
    };
    sock.setTimeout(5000, () => fin("timeout"));
    sock.on("data", (d) => chunks.push(d));
    sock.on("end", () => fin());
    sock.on("close", () => fin());
    sock.on("error", (e) => fin(e));
    const hdr = { Host: u.host, Connection: "close", "X-Forwarded-For": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...headers };
    const head = `${method} `;
    sock.on("connect", () => {
      sock.write(Buffer.concat([
        Buffer.from(head, "latin1"), Buffer.from(rawPath, "latin1"), Buffer.from(" HTTP/1.1\r\n", "latin1"),
        Buffer.from(Object.entries(hdr).map(([k, v]) => `${k}: ${v}`).join("\r\n") + "\r\n\r\n", "latin1"),
      ]));
    });
  });
}

/** raw GET that follows up to 3 redirects, returning the final response. */
async function rawFollow(base, p) {
  let r = await rawReq(base, p);
  for (let i = 0; i < 3 && [301, 302, 307, 308].includes(r.status) && r.headers.location; i++) {
    let loc = r.headers.location;
    try { const u = new URL(loc, base); loc = u.pathname + u.search; } catch { /* keep */ }
    r = await rawReq(base, loc);
  }
  return r;
}

const ctypeOf = (ext) => ({ css: /^text\/css/, js: /(javascript|ecmascript)/ }[ext]);

export default {
  name: "pages", needs: "stack", mutating: false, costly: false,
  doc: "server-rendered pages: status/redirects per role, HTML sanity, asset cache-bust + /static fetch, security headers, robots/sitemap, 404/405/HEAD, no dir listing, path traversal",
  async run(t) {
    const ip = () => ({ "X-Forwarded-For": t.ip() });
    const page = (p, o = {}) => t.api(p, { ...o, headers: { ...ip(), ...(o.headers || {}) } });
    const cookie = (tok) => ({ headers: { Cookie: "sb-access-token=" + tok } });

    // ---- tokens for every role (must be real, else the denial checks below are vacuous)
    const tok = {};
    for (const role of ["patient", "doctor", "admin", "developer"]) {
      const r = await t.login(`${role}@sihat.com`, PW, t.ip());
      tok[role] = r.token;
      t.check(`setup.token_${role}`, r.ok && !!r.token && r.role === role, `login ok=${r.ok} role=${r.role} tokenlen=${(r.token || "").length}`);
    }

    // ---- anonymous page matrix
    const anon = {};
    for (const p of ["/", "/login", "/reset-password", "/demo", "/video"]) {
      anon[p] = await page(p);
      t.check(`anon.${p}_200`, anon[p].status === 200, `status=${anon[p].status}`);
      t.check(`anon.${p}_content_type_html`, /^text\/html/i.test(anon[p].headers.get("content-type") || ""), `ct=${anon[p].headers.get("content-type")}`);
    }
    for (const p of ["/patient", "/patient/report/abc123", "/doctor", "/admin"]) {
      const r = await page(p);
      t.check(`anon.${p}_redirects_login`, r.status === 302 && r.headers.get("location") === "/login", `status=${r.status} location=${r.headers.get("location")}`);
    }
    const badTok = await page("/patient", cookie("not-a-real-token"));
    t.check("anon.invalid_token_redirects_login", badTok.status === 302 && badTok.headers.get("location") === "/login", `status=${badTok.status} loc=${badTok.headers.get("location")}`);
    const badBearer = await page("/admin", { headers: { Authorization: "Bearer garbage" } });
    t.check("anon.invalid_bearer_admin_redirects_login", badBearer.status === 302 && badBearer.headers.get("location") === "/login", `status=${badBearer.status}`);

    // ---- authenticated matrix
    const want = {
      patient: { "/patient": 200, "/patient/report/xyz": 200, "/doctor": ["302", "/patient"], "/admin": ["302", "/patient"], "/login": ["302", "/patient"] },
      doctor: { "/patient": 200, "/doctor": 200, "/admin": ["302", "/doctor"], "/login": ["302", "/doctor"] },
      admin: { "/admin": 200, "/patient": 200, "/login": ["302", "/admin"] },
      developer: { "/admin": 200, "/patient": 200, "/login": ["302", "/admin"] },
    };
    for (const [role, m] of Object.entries(want)) {
      if (!tok[role]) { t.skip(`role.${role}`, "no token"); continue; }
      for (const [p, exp] of Object.entries(m)) {
        const r = await page(p, cookie(tok[role]));
        const label = `role.${role}.${p.replace(/\W+/g, "_")}`;
        if (Array.isArray(exp)) t.check(label, r.status === +exp[0] && r.headers.get("location") === exp[1], `want ${exp[0]}->${exp[1]}, got ${r.status}->${r.headers.get("location")}`);
        else t.check(label, r.status === exp, `want ${exp}, got ${r.status}`);
      }
    }
    // bearer header works the same as the cookie
    if (tok.admin) {
      const rb = await page("/admin", { token: tok.admin });
      t.check("role.admin.bearer_header_200", rb.status === 200, `status=${rb.status}`);
    }

    // ---- HTML sanity on every rendered page; collect static refs
    const bodies = { "/": anon["/"].text, "/login": anon["/login"].text, "/reset-password": anon["/reset-password"].text };
    if (tok.patient) { bodies["/patient"] = (await page("/patient", cookie(tok.patient))).text; bodies["/report"] = (await page("/patient/report/xyz", cookie(tok.patient))).text; }
    if (tok.doctor) bodies["/doctor"] = (await page("/doctor", cookie(tok.doctor))).text;
    if (tok.admin) bodies["/admin"] = (await page("/admin", cookie(tok.admin))).text;
    t.check("html.all_pages_collected", Object.keys(bodies).length === 7, `collected ${Object.keys(bodies).join(",")}`);

    const staticRefs = new Set();
    for (const [name, html] of Object.entries(bodies)) {
      const k = name.replace(/\W+/g, "_") || "root";
      t.check(`html.${k}.doctype`, /^\s*<!doctype html>/i.test(html), `starts: ${html.slice(0, 30)}`);
      t.check(`html.${k}.title`, /<title>[^<]{3,}<\/title>/i.test(html) && !/<title>\s*—|<title>\s*<\/title>|\{\{|<no value>/.test(html), `title: ${(html.match(/<title>.*?<\/title>/i) || [""])[0]}`);
      t.check(`html.${k}.lang`, /<html[^>]*\slang="[a-z-]+"/i.test(html), "no lang attr on <html>");
      t.check(`html.${k}.viewport`, /<meta[^>]+name="viewport"[^>]+width=device-width/i.test(html), "no viewport meta");
      t.check(`html.${k}.no_template_leak`, !/\{\{|\}\}|<no value>|%!\(/.test(html), "unrendered template markers present");
      t.check(`html.${k}.charset`, /<meta[^>]+charset=/i.test(html), "no charset meta");
      const refs = [...html.matchAll(/(?:src|href)="(\/static\/[^"]+)"/g)].map((m) => m[1]);
      t.check(`html.${k}.has_static_refs`, refs.length >= 2, `refs=${refs.length}`);
      const unversioned = refs.filter((u) => !/[?&]v=\d{6,}$/.test(u));
      t.check(`html.${k}.assets_cache_busted`, unversioned.length === 0, `no ?v= on: ${unversioned.join(", ")}`);
      refs.forEach((r) => staticRefs.add(r));
    }
    // all pages in one process share one build version
    const vers = new Set([...staticRefs].map((u) => (u.match(/v=(\d+)/) || [])[1]));
    t.check("assets.single_build_version", vers.size === 1, `versions=${[...vers].join(",")}`);

    // ---- illustrations (static/img/art): every <img> on every page + the images CSS/JS reference must exist as image/webp,
    //      carry non-empty alt text (zh/en/ms via data-i18n-alt), width/height (no layout shift) and a sane weight.
    {
      const artRefs = new Set();
      let imgTags = 0;
      for (const [name, html] of Object.entries(bodies)) {
        const k = name.replace(/\W+/g, "_") || "root";
        const tags = [...html.matchAll(/<img[^>]*>/gi)].map((m) => m[0]).filter((x) => /\/static\/img\//.test(x));
        imgTags += tags.length;
        for (const tg of tags) {
          const src = (tg.match(/src="([^"]+)"/) || [])[1] || "";
          artRefs.add(src.split("?")[0]);
          t.check(`art.${k}.${src.split("/").pop().split("?")[0]}.alt_nonempty`, /\salt="[^"]{8,}"/.test(tg) && /data-i18n-alt="art\.\w+"/.test(tg), `alt/i18n missing: ${tg.slice(0, 120)}`);
          t.check(`art.${k}.${src.split("/").pop().split("?")[0]}.dimensions`, /\swidth="\d+"/.test(tg) && /\sheight="\d+"/.test(tg), `width/height missing: ${tg.slice(0, 120)}`);
          t.check(`art.${k}.${src.split("/").pop().split("?")[0]}.lazy_unless_hero`, /fetchpriority="high"|loading="lazy"/.test(tg), `neither lazy nor priority: ${tg.slice(0, 120)}`);
        }
      }
      t.check("art.pages_use_illustrations", imgTags >= 9, `only ${imgTags} art <img> tags across pages`);
      for (const f of ["/static/css/art.css", "/static/js/consult.js"]) {
        const r = await page(f);
        for (const m of r.text.matchAll(/["'(](\/static\/img\/[A-Za-z0-9_./-]+\.webp)["')]/g)) artRefs.add(m[1]);
      }
      let artTotal = 0;
      for (const u of artRefs) {
        const res = await fetch(t.base + u, { headers: ip() });
        const buf = Buffer.from(await res.arrayBuffer());
        artTotal += buf.length;
        t.check(`art.file.${u.split("/").pop()}`, res.status === 200 && /^image\/webp/.test(res.headers.get("content-type") || "") && buf.length > 2000 && buf.length <= 150 * 1024, `${u}: status=${res.status} ct=${res.headers.get("content-type")} bytes=${buf.length}`);
      }
      t.check("art.total_weight_budget", artRefs.size >= 6 && artTotal <= 400 * 1024, `${artRefs.size} images, ${(artTotal / 1024).toFixed(0)} KB (budget 400 KB)`);
      const i18n = await page("/static/js/i18n.js");
      for (const k of ["hero", "wang", "wen", "qie", "consult"]) t.check(`art.i18n.alt_${k}_in_en_zh_ms`, (i18n.text.match(new RegExp(`'art\.${k}':`, "g")) || []).length === 3, `art.${k} must exist in all 3 dictionaries`);
      t.check("art.i18n.alt_attr_handled", /data-i18n-alt/.test(i18n.text), "i18n.js does not apply data-i18n-alt");
      t.check("art.css.reduced_motion", /prefers-reduced-motion:\s*reduce/.test((await page("/static/css/art.css")).text), "art.css lacks a prefers-reduced-motion block");
    }

    // ---- login page elements the browser tests rely on
    const lg = bodies["/login"];
    for (const id of ["tab-login", "tab-signup", "role-patient", "role-doctor", "signup-specialty", "signup-bio", "signup-years", "signup-name", "signup-email", "signup-password", "signup-btn", "login-email", "login-password", "login-btn", "panel-login", "panel-signup", "panel-forgot", "doctor-fields", "doctor-login-select", "forgot-email", "forgot-btn"]) {
      t.check(`login.has_#${id}`, new RegExp(`id="${id}"`).test(lg), `#${id} missing from /login`);
    }
    t.check("login.quick_roles_4", (lg.match(/class="quick-role"/g) || []).length === 4, `quick-role buttons=${(lg.match(/class="quick-role"/g) || []).length}`);
    t.check("login.doctor_fields_hidden_by_default", /id="doctor-fields"\s+class="hidden"/.test(lg), "doctor-only fields not hidden initially");

    // ---- every referenced /static file fetches 200 with right content type
    const files = [...staticRefs];
    for (const u of files) {
      const r = await page(u);
      const ext = u.split("?")[0].split(".").pop();
      const re = ctypeOf(ext);
      const ct = r.headers.get("content-type") || "";
      t.check(`static.${u.split("?")[0].replace(/^\/static\//, "").replace(/\W+/g, "_")}`, r.status === 200 && r.text.length > 50 && (!re || re.test(ct)), `status=${r.status} ct=${ct} len=${r.text.length}`);
    }
    // assets referenced from JS/CSS (inline url(), fetch of /static)
    const inner = new Set();
    for (const u of files) {
      const r = await page(u);
      for (const m of r.text.matchAll(/["'(](\/static\/[A-Za-z0-9_./-]+\.[a-z0-9]+)["')?]/g)) inner.add(m[1]);
    }
    for (const u of inner) {
      const r = await page(u);
      t.check(`static.inner_ref.${u.replace(/\W+/g, "_")}`, r.status === 200, `status=${r.status}`);
    }
    // conditional / caching sanity
    const css = await page(files.find((f) => f.includes("app.css")) || "/static/css/app.css");
    t.check("static.has_cache_validator", !!(css.headers.get("etag") || css.headers.get("last-modified")), "no ETag/Last-Modified on static css");

    // ---- security headers on pages, API, static, error responses
    const sec = async (label, r) => {
      const h = r.headers;
      t.check(`headers.${label}.nosniff`, h.get("x-content-type-options") === "nosniff", `got ${h.get("x-content-type-options")}`);
      t.check(`headers.${label}.xfo`, /^(DENY|SAMEORIGIN)$/i.test(h.get("x-frame-options") || ""), `got ${h.get("x-frame-options")}`);
      t.check(`headers.${label}.referrer`, !!h.get("referrer-policy") && !/unsafe-url|no-referrer-when-downgrade/.test(h.get("referrer-policy")), `got ${h.get("referrer-policy")}`);
    };
    await sec("home", anon["/"]);
    await sec("login", anon["/login"]);
    await sec("redirect", await page("/patient"));
    await sec("api_health", await page("/api/health"));
    await sec("api_401", await page("/api/auth/me"));
    await sec("static_css", css);
    await sec("404", await page("/definitely-not-a-route-" + t.uniq()));
    await sec("robots", await page("/robots.txt"));

    // ---- robots.txt + sitemap.xml
    const rb = await page("/robots.txt");
    t.check("robots.200_text", rb.status === 200 && /^text\/plain/.test(rb.headers.get("content-type") || ""), `status=${rb.status} ct=${rb.headers.get("content-type")}`);
    t.check("robots.has_useragent", /^User-agent:\s*\*/mi.test(rb.text), rb.text.slice(0, 80));
    t.check("robots.disallows_api", /^Disallow:\s*\/api\/?\s*$/mi.test(rb.text), rb.text);
    t.check("robots.hides_private_pages", ["/patient", "/doctor", "/admin"].every((p) => new RegExp(`^Disallow:\\s*${p}\\b`, "mi").test(rb.text)), `robots must Disallow /patient /doctor /admin: ${JSON.stringify(rb.text)}`);
    const smLine = (rb.text.match(/^Sitemap:\s*(\S+)/mi) || [])[1] || "";
    t.check("robots.sitemap_absolute_url", /^https?:\/\/[^/]+\/sitemap\.xml$/.test(smLine), `sitemap line=${smLine}`);
    const sm = await page("/sitemap.xml");
    t.check("sitemap.200_xml", sm.status === 200 && /xml/.test(sm.headers.get("content-type") || ""), `status=${sm.status} ct=${sm.headers.get("content-type")}`);
    t.check("sitemap.xml_declaration", /^<\?xml version="1\.0"/.test(sm.text), sm.text.slice(0, 40));
    t.check("sitemap.urlset_ns", /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(sm.text) && /<\/urlset>\s*$/.test(sm.text), "urlset missing/unclosed");
    const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    t.check("sitemap.has_urls", locs.length >= 2, `locs=${locs.length}`);
    t.check("sitemap.contains_home_and_login", locs.some((l) => /\/$/.test(new URL(l).pathname) && new URL(l).pathname === "/") && locs.some((l) => new URL(l).pathname === "/login"), locs.join(","));
    t.check("sitemap.no_dup_urls", new Set(locs).size === locs.length, locs.join(","));
    for (const l of locs) {
      let pth; try { pth = new URL(l).pathname; } catch { pth = ""; }
      const r = await page(pth || "/__bad__");
      t.check(`sitemap.url_is_real.${pth.replace(/\W+/g, "_") || "root"}`, r.status === 200, `${l} -> status=${r.status}`);
      t.check(`sitemap.url_public.${pth.replace(/\W+/g, "_") || "root"}`, !/^\/(patient|doctor|admin|api)/.test(pth), `sitemap lists private path ${pth}`);
    }
    t.check("sitemap.origin_matches_robots", !smLine || locs.every((l) => new URL(l).origin === new URL(smLine).origin), `sitemap origin ${smLine} vs ${locs[0]}`);

    // ---- 404 / 405 / HEAD
    for (const p of ["/nope", "/patients", "/login/extra", "/admin/users", "/doctor/x/y", "/sitemap.xml/x", "/api/definitely-missing-" + t.uniq()]) {
      const r = await page(p);
      t.check(`notfound.${p.replace(/\W+/g, "_").slice(0, 30)}`, r.status === 404, `status=${r.status}`);
    }
    const nf = await page("/nope-" + t.uniq());
    t.check("notfound.body_not_stacktrace", !/goroutine|\.go:\d+|panic/.test(nf.text), nf.text.slice(0, 120));
    for (const [m, p] of [["POST", "/login"], ["POST", "/"], ["PUT", "/patient"], ["DELETE", "/admin"], ["POST", "/robots.txt"], ["POST", "/sitemap.xml"], ["POST", "/reset-password"], ["POST", "/static/css/app.css"], ["PATCH", "/doctor"]]) {
      const r = await page(p, { method: m, body: "{}" });
      t.check(`method.${m}_${p.replace(/\W+/g, "_")}_405`, r.status === 405, `status=${r.status}`);
      if (m === "POST" && p === "/login") t.check("method.405_has_allow_header", /GET/.test(r.headers.get("allow") || ""), `Allow=${r.headers.get("allow")}`);
    }
    for (const p of ["/", "/login", "/robots.txt", "/sitemap.xml", "/reset-password", files[0] || "/static/css/app.css"]) {
      const r = await page(p, { method: "HEAD" });
      t.check(`head.${p.replace(/\W+/g, "_")}`, r.status === 200 && r.text === "" && !!r.headers.get("content-type"), `status=${r.status} bodylen=${r.text.length} ct=${r.headers.get("content-type")}`);
    }
    const hg = await page("/login");
    const hh = await page("/login", { method: "HEAD" });
    t.check("head.content_type_matches_get", hh.headers.get("content-type") === hg.headers.get("content-type"), `${hh.headers.get("content-type")} vs ${hg.headers.get("content-type")}`);
    const hp = await page("/patient", { method: "HEAD" });
    t.check("head.protected_page_still_redirects", hp.status === 302, `HEAD /patient anon status=${hp.status}`);
    const opt = await page("/login", { method: "OPTIONS" });
    t.check("method.options_not_500", opt.status < 500, `status=${opt.status}`);

    // ---- static directory listing must not be exposed
    for (const d of ["/static/", "/static", "/static/js/", "/static/js", "/static/css/", "/static/css", "/static/./", "/static//"]) {
      const r = await rawFollow(t.base, d);
      const listing = /<pre>\s*<a href=/i.test(r.body) || /href="[^"]+\.(js|css)"/i.test(r.body) && /<pre>/i.test(r.body);
      t.check(`listing.${d.replace(/\W+/g, "_")}`, !listing && !/auth\.js|app\.css/.test(r.body) && r.status !== 0, `status=${r.status} body=${r.body.slice(0, 100).replace(/\s+/g, " ")}`);
    }

    // ---- path traversal / source disclosure (raw bytes on the wire)
    const trav = [
      "/static/..%2f..%2fgo.mod", "/static/..%2Fgo.mod", "/static/%2e%2e/main.go", "/static/%2e%2e%2fmain.go", "/static/%2e%2e/%2e%2e/go.mod",
      "/static/../go.mod", "/static/../../main.go", "/static/js/../../go.mod", "/static/%252e%252e/go.mod", "/static/%252e%252e%252fgo.mod",
      "/static/..%5cgo.mod", "/static/..\\go.mod", "/static/%5c..%5cgo.mod", "/static/js/..%5c..%5cmain.go", "/static/%2e%2e%5cmain.go",
      "/static/.%2e/go.mod", "/static/%2e./go.mod", "/static/..;/go.mod", "/static/....//go.mod", "/static/%c0%ae%c0%ae/go.mod",
      "/static/%00", "/static/go.mod%00.js", "/static/js/auth.js%00.txt", "/static/..%00/go.mod", "/static/js/%00/../../go.mod",
      "/static//..//go.mod", "/static/%2f%2e%2e%2fgo.mod", "/static/js/..%2f..%2f.env", "/static/..%2f..%2f.env", "/static/..%2f..%2finternal%2fserver%2fserver.go",
      "/static/..%2ftemplates%2flogin.html", "/templates/login.html", "/.env", "/go.mod", "/main.go", "/internal/server/server.go", "/regress/stack.mjs", "/.git/config",
    ];
    for (const p of trav) {
      const r = await rawFollow(t.base, p);
      const leaked = LEAK.test(r.body) || /\[core\]|\bGEMINI_API_KEY\s*=|SUPABASE_[A-Z_]*KEY\s*=/.test(r.body) || /\{\{template|\{\{define/.test(r.body);
      const label = "traversal." + p.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 48);
      t.check(label, !leaked && r.status !== 500,
        `${p} -> status=${r.status} leaked=${leaked} body=${r.body.slice(0, 80).replace(/\s+/g, " ")}`);
    }
    // stronger: none of these may be served 200 with a body of any kind unless it IS a real static asset
    const bad200 = [];
    for (const p of ["/static/..%2f..%2fgo.mod", "/static/%2e%2e/main.go", "/static/..%5cgo.mod", "/static/%252e%252e/go.mod", "/static/..%2ftemplates%2flogin.html"]) {
      const r = await rawFollow(t.base, p);
      if (r.status === 200) bad200.push(p);
    }
    t.check("traversal.none_served_200", bad200.length === 0, `served 200: ${bad200.join(", ")}`);
    const nul = await rawReq(t.base, "/static/js/auth.js\0.txt");
    t.check("traversal.literal_nul_not_500", nul.status !== 500 && !LEAK.test(nul.body), `status=${nul.status} err=${nul.err}`);
    const longp = await rawReq(t.base, "/static/" + "a".repeat(9000));
    t.check("traversal.long_path_not_5xx", longp.status > 0 && longp.status < 500, `status=${longp.status} err=${longp.err}`);
    // control: a legit encoded path to a real asset still works (proves the raw helper isn't just failing)
    const ctl = await rawReq(t.base, "/static/js/auth.js");
    t.check("traversal.control_real_asset_200", ctl.status === 200 && ctl.body.length > 50, `status=${ctl.status} len=${ctl.body.length} err=${ctl.err}`);
    const ctl2 = await rawReq(t.base, "/static/js/%61uth.js");
    t.check("traversal.control_percent_encoded_asset_200", ctl2.status === 200, `status=${ctl2.status}`);
    // static is read-only and doesn't leak embedded template sources
    const tpl = await rawFollow(t.base, "/static/templates/login.html");
    t.check("static.templates_not_served", tpl.status === 404, `status=${tpl.status}`);
  },
};
