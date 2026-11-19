/**
 * hunt_frontend — defects found by the frontend hunt (Playwright crawl of every page/role at 360/768/1440 px, en/zh/ms,
 * keyboard + back-button + long-name probes). Every check asserts the CORRECT behaviour and is RED until the app is fixed.
 * Static/structural by design (cheap, deterministic): HTML as rendered, served CSS/JS source, response headers.
 */
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";

// ---- tiny CSS/colour helpers
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const cssVar = (css, name) => { const m = css.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{3,6})`)); return m ? m[1] : null; };
const rule = (css, sel) => { const m = css.match(new RegExp(`(?:^|[},\\s])${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`, "m")); return m ? m[1] : ""; };

/** controls in rendered HTML that have no accessible name (no label[for], wrapping label, aria-label(ledby)). */
function unlabeled(html) {
  const out = [];
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const a = m[2];
    if (/type="(hidden|file|checkbox|radio|submit|button)"/i.test(a)) continue;
    if (/aria-label(ledby)?="[^"]+"/i.test(a)) continue;
    const id = (a.match(/\bid="([^"]+)"/) || [])[1];
    if (id && new RegExp(`<label[^>]+for="${id}"`).test(html)) continue;
    const before = html.slice(Math.max(0, m.index - 300), m.index);
    if (/<label\b[^>]*>(?:(?!<\/label>)[\s\S])*$/i.test(before)) continue;
    out.push(id || a.slice(0, 40));
  }
  return out;
}

export default {
  name: "hunt_frontend", needs: "stack", mutating: false, costly: false,
  doc: "frontend hunt: caching of private pages/APIs, keyboard + dialog a11y, mobile overflow, contrast, i18n chrome, titles/landmarks, favicon, 404 page, print",
  async run(t) {
    const H = () => ({ "X-Forwarded-For": t.ip() });
    const page = (p, o = {}) => t.api(p, { ...o, headers: { ...H(), ...(o.headers || {}) } });
    const ck = (tok) => ({ headers: { Cookie: "sb-access-token=" + tok } });
    const tok = {};
    for (const role of ["patient", "doctor", "admin"]) {
      const r = await t.login(`${role}@sihat.com`, PW, t.ip());
      tok[role] = r.token;
      t.check(`setup.token_${role}`, r.ok && !!r.token, `login ok=${r.ok}`);
    }
    const css = (await page("/static/css/app.css")).text;
    const home = (await page("/")).text;
    const login = (await page("/login")).text;
    const reset = (await page("/reset-password")).text;
    const patient = (await page("/patient", ck(tok.patient))).text;
    const doctor = (await page("/doctor", ck(tok.doctor))).text;
    const admin = (await page("/admin", ck(tok.admin))).text;
    const patientJs = (await page("/static/js/consult.js")).text + (await page("/static/js/dashboard.js")).text;
    const wizardJs = (await page("/static/js/wizard.js")).text;
    const inboxJs = (await page("/static/js/doctor-inbox.js")).text;

    // frontend-01 (P2): private pages must not be cacheable -> after logout the Back button re-shows the patient's data
    for (const [label, path, who] of [["patient", "/patient", "patient"], ["report", "/patient/report/abc", "patient"], ["doctor", "/doctor", "doctor"], ["admin", "/admin", "admin"]]) {
      const r = await page(path, ck(tok[who]));
      const cc = (r.headers.get("cache-control") || "").toLowerCase();
      t.check(`fe01.private_page_no_store.${label}`, /no-store/.test(cc), `GET ${path} as ${who}: Cache-Control="${cc}" (logout then Back shows the cached page with PHI)`);
    }
    // frontend-02 (P2): private JSON likewise
    for (const path of ["/api/patient/sessions", "/api/auth/me", "/api/patient/profile"]) {
      const r = await page(path, ck(tok.patient));
      const cc = (r.headers.get("cache-control") || "").toLowerCase();
      t.check(`fe02.private_api_no_store.${path.replace(/\W+/g, "_")}`, r.status === 200 && /no-store|private/.test(cc), `GET ${path}: status=${r.status} Cache-Control="${cc}"`);
    }

    // frontend-03 (P2): a registered doctor's 60-char unbroken name/specialty made /patient 1322px wide at 360px and the detail modal 2852px
    const wrapCss = css + "\n" + patient;
    const wrapRules = [".doctor-info", ".doctor-name", ".doctor-bio", ".doctor-specialty", ".doctor-modal-card", ".dm-name", ".dm-bio", ".dm-spec", ".dm-rows", ".dm-row", "body", "main", ".dashboard-main", "\\*"];
    const wraps = wrapRules.some((s) => /(overflow-wrap\s*:\s*(anywhere|break-word)|word-break\s*:\s*(break-word|break-all)|text-overflow\s*:\s*ellipsis)/.test(rule(wrapCss, s)));
    t.check("fe03.long_doctor_name_wraps", wraps, "no overflow-wrap/word-break on the doctor card/modal/body: unbroken 60-char name widens /patient to 1322px at 360px");

    // frontend-04 (P2): dialog semantics + Escape
    t.check("fe04.doctor_modal_role_dialog", /role="dialog"/.test(patient) && /aria-modal="true"/.test(patient), "doctor detail modal has no role=dialog/aria-modal");
    t.check("fe04.doctor_modal_closes_on_escape", /Escape|['"]Esc['"]|keyCode\s*={2,3}\s*27/.test(patientJs), "no Escape handler for #doctor-modal (keyboard users cannot dismiss it; observed: modal stays open after Esc)");

    // frontend-05 (P2): symptom + pulse chips are <span>/<div> with click handlers only -> not keyboard reachable
    const chips = [...home.matchAll(/<(span|div)\b[^>]*class="(?:chip|quality-chip)"[^>]*>/g)].map((m) => m[0]);
    const chipsOk = chips.length >= 15 && chips.every((c) => /tabindex=|role="(button|checkbox|switch)"/.test(c));
    const jsAdds = /setAttribute\(\s*['"]tabindex['"]|setAttribute\(\s*['"]role['"]|tabIndex\s*=/.test(wizardJs);
    t.check("fe05.wizard_chips_keyboard_operable", chipsOk || (chips.length >= 15 && jsAdds), `${chips.length} chips, none focusable/with role (symptoms + pulse quality cannot be chosen with the keyboard)`);

    // frontend-06 (P2): visible keyboard focus
    t.check("fe06.focus_visible_style", /:focus-visible/.test(css), "app.css has no :focus-visible rule; .form-input sets outline:none with only a 12% box-shadow, buttons/links rely on UA default");

    // frontend-07 (P2): doctor header language button: the toggle script looks up #lang-toggle but the button is #lang-toggle-doc
    const docBtnId = (doctor.match(/<button[^>]*class="lang-btn"[^>]*id="([^"]+)"|<button[^>]*id="([^"]+)"[^>]*class="lang-btn"/) || []);
    const bid = docBtnId[1] || docBtnId[2] || "";
    const scriptTargets = new RegExp(`getElementById\\(['"]${bid}['"]\\)|querySelectorAll?\\(['"][^'"]*lang-btn`).test(doctor);
    t.check("fe07.doctor_lang_button_label_updates", bid === "lang-toggle" || scriptTargets, `doctor page lang button id="${bid}" but the label updater only targets #lang-toggle: label stays "EN" after switching to 中文/BM`);

    // frontend-08 (P3): admin console horizontally scrolls at 360px (378px wide): header nav + tables
    const mq = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)\s*\{([\s\S]*?)\n\}/g)].filter((m) => +m[1] <= 480 || +m[1] <= 640);
    t.check("fe08.header_nav_fits_360", mq.some((m) => /\.header-nav|\.site-header/.test(m[2]) && /flex-wrap|gap|font-size|display\s*:\s*none/.test(m[2])) || /\.header-nav\s*\{[^}]*flex-wrap\s*:\s*wrap/.test(css), "no small-screen rule for .header-nav: logged-in admin header (Video/Dashboard/Admin/Logout/lang) is 378px wide on a 360px screen");
    const adminJs = (await page("/static/js/admin.js")).text;
    t.check("fe09.admin_tables_scroll_container", /(overflow-x\s*:\s*(auto|scroll)[^>]*>\s*['"]?\s*\+?\s*['"]?<table)|(class="[^"]*(table-wrap|table-scroll|scroll-x)[^"]*"[^>]*>\s*<table)|\.adm-table\s*\{[^}]*display\s*:\s*block[^}]*overflow-x/.test(adminJs) || /\.(adm-table-wrap|table-wrap|table-scroll)\s*\{[^}]*overflow-x\s*:\s*(auto|scroll)/.test(admin + css), "admin tables (.adm-table: logs/errors) have no overflow-x container; at 360px table right edge = 374px");

    // frontend-10 (P3): primary button contrast
    const emerald = cssVar(css, "--emerald-600");
    const bp = rule(css, ".btn-primary");
    const bgv = (bp.match(/background\s*:\s*var\((--[\w-]+)\)/) || [])[1];
    const bgc = bgv ? cssVar(css, bgv) : (bp.match(/background\s*:\s*(#[0-9a-f]{3,6})/i) || [])[1];
    const fgc = (bp.match(/(?:^|;|\s)color\s*:\s*(#[0-9a-f]{3,6})/i) || [])[1] || "#ffffff";
    const cr = bgc ? ratio(hex(bgc), hex(fgc)) : 0;
    t.check("fe10.btn_primary_contrast_aa", cr >= 4.5, `.btn-primary ${fgc} on ${bgc} = ${cr.toFixed(2)}:1 (<4.5; also .btn-outline/links use ${emerald} as text on light backgrounds)`);
    const outl = rule(css, ".btn-outline");
    const oc = cssVar(css, (outl.match(/(?:^|;|\s)color\s*:\s*var\((--[\w-]+)\)/) || [])[1] || "--x");
    t.check("fe10.text_link_colour_contrast_aa", !!oc && ratio(hex(oc), [253, 251, 242]) >= 4.5, `.btn-outline/link text ${oc} on the cream page background = ${oc ? ratio(hex(oc), [253, 251, 242]).toFixed(2) : "?"}:1 (<4.5)`);

    // frontend-11 (P3): unlabeled form controls (placeholder-only)
    const u1 = unlabeled(home), u2 = unlabeled(patient), u3 = unlabeled(doctor);
    t.check("fe11.home_controls_labelled", u1.length === 0, `no accessible name: ${u1.join(", ")}`);
    t.check("fe11.patient_controls_labelled", u2.length === 0, `no accessible name: ${u2.join(", ")}`);
    t.check("fe11.doctor_controls_labelled", u3.length === 0, `no accessible name: ${u3.join(", ")}`);
    const genned = [...inboxJs.matchAll(/<(textarea|select|input)\b[^>]*>/g)].map((m) => m[0]).filter((x) => !/type="(hidden|checkbox)"/.test(x) && !/aria-label/.test(x));
    t.check("fe11.doctor_inbox_generated_controls_labelled", genned.length === 0, `${genned.length} JS-generated reply/flag/treatment-plan controls without aria-label, e.g. ${(genned[0] || "").slice(0, 70)}`);

    // frontend-13 (P3): headings/landmarks
    t.check("fe13.patient_has_h1", /<h1[\s>]/.test(patient), "/patient has no <h1> (dashboard title is an <h2>)");
    t.check("fe13.doctor_has_h1", /<h1[\s>]/.test(doctor), "/doctor has no <h1>");
    t.check("fe14.home_has_main_landmark", /<main[\s>]/.test(home), "/ has no <main> landmark (screen-reader skip target)");

    // frontend-15 (P3): <title>
    for (const [p, html] of [["/patient", patient], ["/doctor", doctor]]) {
      const ti = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
      const parts = ti.split(/\s+[—-]\s+/);
      t.check(`fe15.title_not_duplicated${p.replace(/\W+/g, "_")}`, parts.length < 2 || parts[0].trim() !== parts[1].trim(), `title="${ti}"`);
    }

    // frontend-16 (P3): favicon
    const fav = await page("/favicon.ico");
    t.check("fe16.favicon_available", /<link[^>]+rel="(shortcut )?icon"/.test(home) || fav.status === 200, `no <link rel=icon> and /favicon.ico -> ${fav.status} (every browser tab/request 404s)`);

    // frontend-17 (P3): 404 for a browser navigation is a bare text line
    const nf = await page("/no-such-page-" + t.uniq(), { headers: { Accept: "text/html" } });
    t.check("fe17.html_404_page", nf.status === 404 && /^text\/html/.test(nf.headers.get("content-type") || "") && /href="\//.test(nf.text), `404 body is "${nf.text.slice(0, 40).trim()}" (${nf.headers.get("content-type")}): no styled page, no way back home`);

    // frontend-18 (P3): footer year
    const yr = (home.match(/&copy;\s*(\d{4})/) || [])[1];
    t.check("fe18.footer_year_current", +yr >= new Date().getFullYear(), `footer says © ${yr}, now ${new Date().getFullYear()} (hard-coded in templates/_partials.html)`);

    // frontend-19 (P3): i18n coverage of auth chrome + chrome links (zh/ms users see English / mixed text)
    const loginKeyed = ["login-btn", "signup-btn", "forgot-btn"].filter((id) => !new RegExp(`id="${id}"[^>]*data-i18n|data-i18n[^>]*id="${id}"`).test(login));
    t.check("fe19.login_buttons_translatable", loginKeyed.length === 0, `no data-i18n on: ${loginKeyed.join(", ")} (and JS resets them to hard-coded "Sign In 登录")`);
    const resetKeys = (reset.replace(/<footer[\s\S]*$/, "").match(/data-i18n(-ph|-html)?="/g) || []).length;
    t.check("fe19.reset_password_page_translatable", resetKeys >= 5, `/reset-password has ${resetKeys} data-i18n attrs outside the footer (title, subtitle, labels, button are English-only in zh/ms)`);
    const partialNav = ["nav-login-link", "nav-video-link"].filter((id) => !new RegExp(`id="${id}"[^>]*data-i18n|data-i18n[^>]*id="${id}"`).test(home));
    t.check("fe20.header_nav_translatable", partialNav.length === 0, `header links without data-i18n: ${partialNav.join(", ")} ("Login"/"Dashboard"/"Logout" stay English in zh; "Video 视频" shows Chinese in ms)`);
    t.check("fe20.footer_links_translatable", /<a href="\/"[^>]*data-i18n/.test(home.slice(home.indexOf("site-footer"))), "footer Home/Login links are not translatable");

    // frontend-21 (P3): print stylesheet for the standalone report page
    t.check("fe21.print_stylesheet", /@media\s+print/.test(css), "app.css has no @media print: Ctrl+P on /patient/report/{id} prints the site header, footer and buttons around the iframe");

    // frontend-22 (P3): tap target of the language switch
    const lb = rule(css, ".lang-btn");
    const mh = (lb.match(/min-height\s*:\s*([\d.]+)(px|rem)/) || []);
    const mhPx = mh[1] ? (+mh[1]) * (mh[2] === "rem" ? 16 : 1) : 0;
    t.check("fe22.lang_btn_tap_target_40px", mhPx >= 40, `.lang-btn renders 38x28px (min-height ${mhPx || "unset"}px); same for .btn-sm (29-30px high) on mobile`);

    // frontend-23 (P3): promo video has no captions track
    const vid = (await page("/video")).text;
    t.check("fe23.video_has_captions_track", /<track\b[^>]*kind="(captions|subtitles)"/.test(vid), "/video <video> has no <track kind=captions> (narrated promo is inaccessible to deaf users)");

    // frontend-24 (P3): error containers are not announced
    const alerts = ["login-alert", "signup-alert", "forgot-alert"].filter((id) => !new RegExp(`id="${id}"[^>]*(role="alert"|aria-live)`).test(login));
    t.check("fe24.auth_alerts_announced", alerts.length === 0, `no role=alert/aria-live on: ${alerts.join(", ")}`);
    t.check("fe24.wizard_step_error_announced", /id="step0-error"[^>]*(role="alert"|aria-live)/.test(home), "#step0-error (\"Please enter your name.\") is not announced and focus stays on Next");
  },
};
