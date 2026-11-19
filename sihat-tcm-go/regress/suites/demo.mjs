/**
 * demo — the public /demo guided tour (investor / prospect page).
 * Pins: route + noindex policy, stable DOM ids (act-0..act-8, step-N-M) that a screen recorder targets, bilingual
 * completeness, every /static/demo asset exists and is within its size budget, the manifest and the page agree,
 * deep links resolve to real routes, "Verified by" chips name checks that really exist, no external network
 * dependencies, ?autoplay/?act params do not break, and the numbers on the page never exceed the stamped run.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAX_IMG = 300 * 1024;      // capture script targets <= 250 KB; allow slack
const MAX_TOTAL = 6 * 1024 * 1024;

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#34;/g, '"').replace(/&#39;/g, "'");

export default {
  name: "demo", needs: "stack", mutating: false, costly: false,
  doc: "/demo tour: public + noindex, stable act/step ids, zh/en pairs, /static/demo assets + manifest, deep links, Verified-by chips exist, offline-safe, autoplay params, stats <= stamp",
  async run(t) {
    const ip = () => ({ "X-Forwarded-For": t.ip() });
    const page = (p, o = {}) => t.api(p, { ...o, headers: { ...ip(), ...(o.headers || {}) } });

    // ---------------------------------------------------------------- route + policy
    const r = await page("/demo");
    t.check("route.200", r.status === 200, `GET /demo = ${r.status}`);
    t.check("route.content_type_html", /^text\/html/i.test(r.headers.get("content-type") || ""), `ct=${r.headers.get("content-type")}`);
    t.check("route.noindex_meta", /<meta name="robots" content="noindex[^"]*">/i.test(r.text), "missing <meta name=robots content=noindex>");
    t.check("route.noindex_header", /noindex/i.test(r.headers.get("x-robots-tag") || ""), `X-Robots-Tag=${r.headers.get("x-robots-tag")}`);
    t.check("route.no_cache", /no-cache/.test(r.headers.get("cache-control") || ""), `cache-control=${r.headers.get("cache-control")}`);
    t.check("route.security_headers", r.headers.get("x-content-type-options") === "nosniff" && r.headers.get("x-frame-options") === "DENY", "security headers missing on /demo");
    t.check("route.title_and_lang", /<title>[^<]{4,}<\/title>/.test(r.text) && /<html lang="zh-CN"/.test(r.text), "title/lang missing");
    const rb = await page("/robots.txt");
    t.check("policy.robots_disallows_demo", /^Disallow:\s*\/demo\s*$/mi.test(rb.text), `robots.txt: ${JSON.stringify(rb.text.slice(0, 200))}`);
    const sm = await page("/sitemap.xml");
    t.check("policy.sitemap_excludes_demo", !/\/demo/.test(sm.text), "sitemap.xml lists /demo (it is a link-shared page)");
    const post = await page("/demo", { method: "POST", body: {} });
    t.check("route.post_405", post.status === 405, `POST /demo = ${post.status}`);
    const head = await page("/demo", { method: "HEAD" });
    t.check("route.head_200", head.status === 200, `HEAD /demo = ${head.status}`);
    // public: identical for every role (no redirect, no 403)
    for (const role of ["patient", "doctor", "admin", "developer"]) {
      const lg = await t.login(`${role}@sihat.com`, "password123", t.ip());
      const rr = await page("/demo", { headers: { Cookie: "sb-access-token=" + lg.token } });
      t.check(`route.public_for_${role}`, rr.status === 200, `GET /demo as ${role} = ${rr.status}`);
    }

    const html = r.text;
    // ---------------------------------------------------------------- stable DOM ids
    for (let n = 0; n <= 8; n++) t.check(`dom.act_${n}`, new RegExp(`<section[^>]*\\bid="act-${n}"`).test(html), `section#act-${n} missing`);
    const stepIds = [...html.matchAll(/<article[^>]*\bid="step-(\d+-\d+)"/g)].map((m) => m[1]);
    t.check("dom.step_count", stepIds.length >= 39, `only ${stepIds.length} step-N-M articles (want >= 39: 5 advantages + 32 steps + 2 summary)`);
    t.check("dom.step_ids_unique", new Set(stepIds).size === stepIds.length, `duplicate ids: ${stepIds.filter((x, i) => stepIds.indexOf(x) !== i)}`);
    for (let n = 1; n <= 7; n++) t.check(`dom.act_${n}_has_steps`, stepIds.filter((s) => s.startsWith(n + "-")).length >= 3, `act ${n} has ${stepIds.filter((s) => s.startsWith(n + "-")).length} steps`);
    t.check("dom.hero_advantages_five", stepIds.filter((s) => s.startsWith("0-")).length === 5, `advantages=${stepIds.filter((s) => s.startsWith("0-")).length}`);
    t.check("dom.summary_steps", stepIds.includes("8-1") && stepIds.includes("8-2"), "step-8-1/step-8-2 missing");
    for (const role of ["patient", "doctor", "admin", "developer"]) t.check(`dom.quick_login_${role}`, html.includes(`data-quick="${role}"`), `quick-login button for ${role} missing`);
    t.check("dom.caption_and_progress_hooks", ["demo-progress", "demo-caption", "cap-title", "demo-done"].every((id) => html.includes(`id="${id}"`)), "autoplay hooks (progress/caption/done) missing");

    // ---------------------------------------------------------------- step cards are complete
    const cards = html.split(/<article class="step /).slice(1).map((c) => c.split("</article>")[0]).filter((c) => /data-role=/.test(c));
    t.check("cards.count_matches_ids", cards.length >= 32, `step cards with a role=${cards.length}`);
    let incomplete = [];
    for (const c of cards) {
      const id = (c.match(/id="step-(\d+-\d+)"/) || [])[1];
      const ok = /class="badge role-/.test(c) && /<h3[^>]*>/.test(c) && /class="see"/.test(c) && /class="why"/.test(c) && /class="live"/.test(c) && /class="chip"/.test(c);
      if (!ok) incomplete.push(id);
    }
    t.check("cards.each_has_badge_title_see_why_link_chip", incomplete.length === 0, `incomplete cards: ${incomplete.join(",")}`);
    const roles = new Set(cards.map((c) => (c.match(/data-role="(\w+)"/) || [])[1]));
    for (const role of ["guest", "patient", "doctor", "admin", "developer", "system"]) t.check(`cards.role_${role}_covered`, roles.has(role), `no step for role ${role}`);

    // ---------------------------------------------------------------- bilingual completeness
    const zh = [...html.matchAll(/<span class="zh"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => m[1]);
    const en = [...html.matchAll(/<span class="en"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => m[1]);
    t.check("i18n.pairs_balanced", zh.length > 100 && zh.length === en.length, `zh=${zh.length} en=${en.length}`);
    t.check("i18n.no_empty_half", zh.every((x) => x.trim()) && en.every((x) => x.trim()), `empty zh=${zh.filter((x) => !x.trim()).length} en=${en.filter((x) => !x.trim()).length}`);
    t.check("i18n.zh_is_chinese", zh.filter((x) => /[一-鿿]/.test(x)).length >= zh.length * 0.9, "zh spans are not Chinese");
    t.check("i18n.en_is_latin", en.filter((x) => /[A-Za-z]/.test(x)).length >= en.length * 0.9, "en spans are not English");
    t.check("i18n.default_is_chinese", /<html lang="zh-CN" data-dlang="zh">/.test(html), "Chinese is not the default language");
    const js = await page("/static/js/demo.js");
    const css = await page("/static/css/demo.css");
    t.check("i18n.toggle_present", html.includes('id="demo-lang"') && /tcm-demo-lang/.test(js.text) && /html\[data-dlang="zh"\] \.en/.test(css.text), "language toggle wiring missing");
    t.check("i18n.lang_param_supported", /get\('lang'\)/.test(html) && /\?lang=/.test(js.text), "?lang= not handled");

    // ---------------------------------------------------------------- assets + manifest
    t.check("assets.js_css_served", js.status === 200 && css.status === 200 && js.text.length > 3000 && css.text.length > 3000, `js=${js.status}/${js.text.length} css=${css.status}/${css.text.length}`);
    t.check("assets.versioned_urls", /\/static\/css\/demo\.css\?v=\d+/.test(html) && /\/static\/js\/demo\.js\?v=\d+/.test(html), "demo.css/demo.js not cache-busted via asset()");
    const refs = [...new Set([...html.matchAll(/\/static\/demo\/([\w.-]+)/g)].map((m) => m[1]))];
    t.check("assets.page_references_screenshots", refs.length >= 30, `page references ${refs.length} distinct /static/demo files (want >= 30)`);
    let total = 0;
    for (const f of refs) {
      const res = await fetch(`${t.base}/static/demo/${f}`, { headers: ip() });
      const buf = Buffer.from(await res.arrayBuffer());
      total += buf.length;
      t.check(`assets.file.${f}`, res.status === 200 && buf.length > 2000 && buf.length <= MAX_IMG && /^image\//.test(res.headers.get("content-type") || ""),
        `${f}: status=${res.status} bytes=${buf.length} (want 2000..${MAX_IMG}) ct=${res.headers.get("content-type")}`);
    }
    t.check("assets.total_size_budget", total <= MAX_TOTAL, `total ${(total / 1048576).toFixed(2)} MB > 6 MB budget`);
    const mres = await page("/static/demo/manifest.json");
    t.check("manifest.served_json", mres.status === 200 && !!mres.json?.shots, `manifest status=${mres.status}`);
    const man = mres.json || { shots: {} };
    const files = Object.values(man.shots).map((s) => s.file);
    t.check("manifest.every_file_on_page", files.every((f) => refs.includes(f)), `in manifest but not on the page: ${files.filter((f) => !refs.includes(f)).join(",")}`);
    t.check("manifest.every_page_ref_in_manifest", refs.every((f) => f === "manifest.json" || files.includes(f)), `on the page but not in the manifest: ${refs.filter((f) => !files.includes(f)).join(",")}`);
    t.check("manifest.act_step_valid", Object.values(man.shots).every((s) => stepIds.includes(`${s.act}-${s.step}`)), `shots pointing at missing steps: ${Object.entries(man.shots).filter(([, s]) => !stepIds.includes(`${s.act}-${s.step}`)).map(([k]) => k)}`);
    t.check("manifest.order_complete", Array.isArray(man.order) && man.order.length === Object.keys(man.shots).length, "manifest.order must list every shot (the page renders in that order)");
    t.check("manifest.no_failed_captures", !(man.failed || []).length, `capture failures recorded: ${JSON.stringify(man.failed || []).slice(0, 300)}`);
    const withShot = new Set(Object.values(man.shots).map((s) => `${s.act}-${s.step}`));
    const bare = stepIds.filter((s) => /^[1-7]-/.test(s) && !withShot.has(s));
    t.check("manifest.every_step_has_screenshot", bare.length === 0, `steps without a screenshot: ${bare.join(",")}`);
    const onDisk = Object.values(man.shots).every((s) => existsSync(join(ROOT, "static", "demo", s.file)));
    t.check("manifest.files_exist_on_disk", onDisk, "a manifest file is missing from static/demo/ (embedded build would 404)");
    if (existsSync(join(ROOT, "scripts", "capture_manifest.json"))) {
      const a = JSON.parse(readFileSync(join(ROOT, "scripts", "capture_manifest.json"), "utf8"));
      t.check("manifest.scripts_copy_in_sync", JSON.stringify(a.shots) === JSON.stringify(man.shots), "scripts/capture_manifest.json differs from static/demo/manifest.json");
    } else t.check("manifest.scripts_copy_in_sync", false, "scripts/capture_manifest.json missing");

    // ---------------------------------------------------------------- deep links
    const hrefs = [...html.matchAll(/class="live" href="([^"]+)"/g)].map((m) => decode(m[1]));
    t.check("links.count", hrefs.length >= 32, `${hrefs.length} 'Open live' links`);
    t.check("links.same_origin_paths", hrefs.every((h) => h.startsWith("/") && !h.startsWith("//")), "a deep link is not a same-origin path");
    for (const h of [...new Set(hrefs)]) {
      const p = h.split("#")[0];
      const rr = await page(p);
      const loc = rr.headers.get("location") || "";
      const ok = rr.status === 200 || (rr.status === 302 && /^\/(login|patient|doctor|admin)\/?$/.test(loc));
      t.check(`links.resolves.${p.replace(/\W+/g, "_") || "root"}`, ok, `${p} -> ${rr.status} ${loc}`);
    }
    const quickLogin = await page("/api/auth/login", { method: "POST", body: { email: "patient@sihat.com", password: "password123" } });
    t.check("links.quick_login_endpoint_works", quickLogin.status === 200 && !!quickLogin.json?.user, `demo patient login = ${quickLogin.status}`);

    // ---------------------------------------------------------------- Verified-by chips name checks that exist
    const chips = [...new Set([...html.matchAll(/<span class="chip">([^<]+)<\/span>/g)].map((m) => decode(m[1])))];
    t.check("verified.chips_present", chips.length >= 15, `${chips.length} distinct chips`);
    const bad = [];
    for (const c of chips) {
      const aci = c.match(/^ACI (\w+)/);
      if (aci && !existsSync(join(ROOT, "regress", "suites", aci[1] + ".mjs"))) bad.push(c);
      const py = c.match(/(\w+_browser_test\.py)/);
      if (py && !existsSync(join(ROOT, "scripts", py[1]))) bad.push(c);
      if (/^journey/.test(c) && !existsSync(join(ROOT, "regress", "suites", "journey.mjs"))) bad.push(c);
    }
    t.check("verified.every_named_check_exists", bad.length === 0, `chips naming a check that does not exist: ${bad.join(" | ")}`);

    // ---------------------------------------------------------------- offline-safe
    const ext = /(?:src|href)\s*=\s*["'](?:https?:)?\/\//i;
    t.check("offline.html_no_external_refs", !ext.test(html), `external ref in HTML: ${(html.match(ext) || [""])[0]}`);
    t.check("offline.no_font_or_cdn_hosts", !/fonts\.(googleapis|gstatic)|cdn\.|unpkg|jsdelivr/i.test(html + css.text + js.text), "font/CDN host referenced");
    t.check("offline.css_no_remote_urls", !/url\(\s*["']?(https?:)?\/\//i.test(css.text) && !/@import/.test(css.text), "css fetches a remote resource");
    t.check("offline.js_no_remote_fetch", !/(fetch|XMLHttpRequest|import)\s*\(?\s*["']https?:/i.test(js.text), "js fetches a remote resource");

    // ---------------------------------------------------------------- params
    for (const q of ["?autoplay=1", "?autoplay=1&act=4", "?act=7", "?act=99", "?act=-1", "?act=abc", "?step=4-3", "?lang=en", "?autoplay=1&dwell=1500&loop=1", "?autoplay=%00", "?act=%3Cscript%3E"]) {
      const rr = await page("/demo" + q);
      t.check(`params.${q.replace(/\W+/g, "_")}`, rr.status === 200 && rr.text.includes('id="act-8"') && rr.text.includes('id="step-4-3"'), `GET /demo${q} -> ${rr.status}`);
    }
    const ap = await page("/demo?autoplay=1");
    t.check("params.autoplay_adds_body_class", /<body class="autoplay"/.test(ap.text) && !/<body class="autoplay"/.test(html), "autoplay=1 must (only) add the body class");
    t.check("params.act_reflected", /data-start-act="4"/.test((await page("/demo?act=4")).text) && /data-start-act="0"/.test((await page("/demo?act=99")).text), "?act not reflected / not clamped");
    t.check("params.xss_not_reflected", !(await page("/demo?act=%3Cscript%3Ealert(1)%3C/script%3E&lang=%3Cb%3E")).text.includes("<script>alert(1)"), "query reflected unescaped");
    t.check("params.autoplay_js_contract", ["demo:step", "demo:done", "__demoDone", "data-demo-state", "dwell", "loop"].every((k) => js.text.includes(k)), "demo.js lost a recorder hook (demo:step/demo:done/__demoDone/data-demo-state/dwell/loop)");

    // ---------------------------------------------------------------- test-log appendix (static/demo-tests/tests.json)
    const tjPath = join(ROOT, "static", "demo-tests", "tests.json");
    if (!existsSync(tjPath)) t.skip("tests.appendix", "no static/demo-tests/tests.json");
    else {
      const tj = JSON.parse(readFileSync(tjPath, "utf8"));
      const want = tj.groups.flatMap((g) => g.items.map((it) => it.id));
      t.check("tests.section_and_nav", /<section class="act tests" id="tests"/.test(html) && html.includes('href="#tests"'), "test-log section or its nav link missing");
      const arts = html.split(/<article class="step tcase /).slice(1).map((c) => c.split("</article>")[0]);
      const ids = arts.map((c) => (c.match(/id="test-([\w-]+)"/) || [])[1]);
      t.check("tests.every_entry_rendered", want.every((id) => ids.includes(id)) && ids.length === want.length, `json=${want.join(",")} page=${ids.join(",")}`);
      const thin = arts.filter((c) => !(/class="tstatus st-(pass|partial|fail|info)"/.test(c) && /class="see"/.test(c) && /class="why"/.test(c))).map((c) => (c.match(/id="test-([\w-]+)"/) || [])[1]);
      t.check("tests.each_has_status_method_result", thin.length === 0, `entries missing status/method/result: ${thin.join(",")}`);
      t.check("tests.not_in_autoplay_tour", !arts.some((c) => /data-tour=/.test(c)) && !ids.some((id) => html.includes(`id="step-${id}"`)), "test entries must stay out of the autoplay tour");
      const tshots = [...new Set([...html.matchAll(/\/static\/demo-tests\/([\w.-]+)/g)].map((m) => m[1]))];
      const declared = new Set(tj.groups.flatMap((g) => g.items.flatMap((it) => (it.shots || []).map((s) => s.file))));
      t.check("tests.page_shows_every_declared_shot", [...declared].every((f) => tshots.includes(f)), `declared but not on the page: ${[...declared].filter((f) => !tshots.includes(f)).join(",")}`);
      t.check("tests.screenshots_present", tshots.length >= 30, `${tshots.length} distinct /static/demo-tests images`);
      let bad = [];
      for (const f of tshots) {
        const res = await fetch(`${t.base}/static/demo-tests/${f}`, { headers: ip() });
        const n = (await res.arrayBuffer()).byteLength;
        if (!(res.status === 200 && n > 2000 && n <= MAX_IMG && /^image\//.test(res.headers.get("content-type") || ""))) bad.push(`${f}:${res.status}/${n}`);
      }
      t.check("tests.screenshots_served", bad.length === 0, `bad test-log images: ${bad.join(" ")}`);
    }

    // ---------------------------------------------------------------- numbers never exceed the stamped run
    const stampPath = join(ROOT, "regress", ".state", "stamp.json");
    const stats = Object.fromEntries([...html.matchAll(/<li data-stat="(\w+)"><b>([^<]+)<\/b>/g)].map((m) => [m[1], m[2]]));
    t.check("stats.four_present", ["go", "integration", "browser", "realmodel"].every((k) => stats[k]), `stats=${JSON.stringify(stats)}`);
    if (!existsSync(stampPath)) t.skip("stats.not_above_stamp", "no regress/.state/stamp.json yet");
    else {
      const nodes = JSON.parse(readFileSync(stampPath, "utf8")).nodes || {};
      const stGo = parseInt((nodes.unit || "").match(/(\d+) Go tests passed/)?.[1] || "NaN", 10);
      const stInt = parseInt((nodes.integration || "").match(/^(\d+)\//)?.[1] || "NaN", 10);
      const stBrowser = [...(nodes["e2e-ui"] || "").matchAll(/(\d+)✓/g)].reduce((a, m) => a + parseInt(m[1], 10), 0);
      const stPc = parseInt((nodes["e2e-pc"] || "").match(/^(\d+)\//)?.[1] || "NaN", 10);
      t.check("stats.go_not_above_stamp", parseInt(stats.go, 10) <= stGo, `page claims ${stats.go} Go tests, stamp has ${stGo}`);
      t.check("stats.integration_not_above_stamp", parseInt(stats.integration, 10) <= stInt, `page claims ${stats.integration} integration checks, stamp has ${stInt}`);
      t.check("stats.browser_not_above_stamp", parseInt(stats.browser, 10) <= stBrowser, `page claims ${stats.browser} browser checks, stamp has ${stBrowser}`);
      t.check("stats.realmodel_not_above_stamp", parseInt(String(stats.realmodel).split("/")[0], 10) <= stPc, `page claims ${stats.realmodel}, stamp has ${stPc}`);
      t.check("stats.realmodel_is_full_pass", /^(\d+)\/\1$/.test(stats.realmodel || ""), `real-model stat must be N/N: ${stats.realmodel}`);
    }
  },
};
