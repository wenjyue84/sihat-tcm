"""
Browser E2E of every role's interface (anonymous, patient, doctor, admin, developer)
+ login-page accessibility + JS-exception / same-origin 4xx-5xx hygiene.

Hermetic by default: if E2E_BASE is not set, boots the isolated regress stack
(`node regress/serve.mjs`, fake DB + fake AI) with ACI_PORT_OFFSET (default 800) and
tears down ONLY the PIDs it started.

  uv run --with playwright python scripts/ui_roles_browser_test.py
  E2E_BASE=http://localhost:8081 uv run --with playwright python scripts/ui_roles_browser_test.py

Prints PASS/FAIL per check, a final 'TOTAL n checks' line; exit 1 on any failure
or if fewer than 25 checks ran.
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from e2e_admin import approve_doctor  # noqa: E402  (a registered doctor is unapproved until an admin approves it)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RUN = str(int(time.time()))
PW = "password123"
REPLY_TEXT = f"UIROLES reply {RUN}: consistent with the AI pattern; rest and warm foods."

results = []  # (label, ok)


def check(label, ok, detail=""):
    ok = bool(ok)
    results.append((label, ok))
    print(("PASS " if ok else "FAIL ") + label + ("" if ok else " — " + str(detail)), flush=True)
    return ok


# ---------------------------------------------------------------- stack
STACK = {"proc": None, "pids": []}


def start_stack():
    base = os.environ.get("E2E_BASE")
    if base:
        return base.rstrip("/")
    env = dict(os.environ)
    env.setdefault("ACI_PORT_OFFSET", "800")
    proc = subprocess.Popen(
        ["node", os.path.join(ROOT, "regress", "serve.mjs")],
        cwd=ROOT, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL, text=True,
    )
    STACK["proc"] = proc
    deadline = time.time() + 120
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                break
            continue
        line = line.strip()
        if line.startswith("{"):
            info = json.loads(line)
            STACK["pids"] = info.get("pids") or []
            return info["base"].rstrip("/")
    raise RuntimeError("hermetic stack did not report a base URL")


def stop_stack():
    proc = STACK["proc"]
    if not proc:
        return
    try:
        proc.stdin.close()  # serve.mjs stops its stack when stdin ends
        proc.wait(timeout=15)
    except Exception:
        pass
    pids = []
    for p in STACK["pids"]:
        if isinstance(p, int):
            pids.append(p)
        elif isinstance(p, dict) and isinstance(p.get("pid"), int):
            pids.append(p["pid"])
    pids.append(proc.pid)
    for pid in pids:  # only our own PIDs, never by name
        try:
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, timeout=15)
        except Exception:
            pass


# ---------------------------------------------------------------- tiny API client (seeding only)
IPN = [0]


def next_ip():
    IPN[0] += 1
    return f"10.{int(RUN) % 200}.{(int(RUN) // 200) % 250}.{IPN[0]}"


def api(base, path, method="GET", body=None, token=None, ip=None):
    headers = {"X-Forwarded-For": ip or next_ip()}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            cookies = r.headers.get_all("Set-Cookie") or []
            code = r.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        cookies = e.headers.get_all("Set-Cookie") or []
        code = e.code
    try:
        js = json.loads(raw)
    except Exception:
        js = None
    tok = ""
    for c in cookies:
        m = re.match(r"sb-access-token=([^;]+)", c)
        if m:
            tok = m.group(1)
    return {"status": code, "json": js, "text": raw, "token": tok}


REPORT = {
    "constitution": {"type": "Spleen Qi Deficiency 脾气虚", "description": "Tends to fatigue and loose stools."},
    "analysis": {"summary": "UIROLES seeded report: fatigue with pale tongue suggests Spleen Qi deficiency.",
                 "key_findings": {"from_inquiry": "fatigue, loose stools", "from_visual": "pale swollen tongue",
                                  "from_pulse": "thready"}},
    "diagnosis": {"primary_pattern": "Spleen Qi Deficiency 脾气虚", "secondary_patterns": ["Dampness"],
                  "affected_organs": ["Spleen", "Stomach"], "pathomechanism": "Weak transformation and transportation."},
    "recommendations": {"food_therapy": {"beneficial": ["Millet", "Chinese yam"], "avoid": ["Cold drinks"]},
                        "lifestyle": ["Regular meals", "Gentle exercise"], "acupoints": ["ST36"],
                        "herbal_formulas": [{"name": "Si Jun Zi Tang", "ingredients": ["Ginseng"]}]},
}


def main():
    base = start_stack()
    print(f"# base={base}", flush=True)
    host = urlparse(base).netloc

    # a registered, approved doctor so the patient directory has an entry
    DOC_NAME = f"Dr UIRoles {RUN}"
    dsu = api(base, "/api/auth/signup", "POST", {"email": f"uiroles-doc-{RUN}@example.com", "password": PW, "name": DOC_NAME,
                                                  "role": "doctor", "specialty": "Internal Medicine", "bio": "UI roles test doctor", "yearsExperience": 5})
    check("seed.directory_doctor_registered", dsu["status"] == 200 and (dsu["json"] or {}).get("success") is True, f"status={dsu['status']} {dsu['text'][:120]}")
    try:
        approve_doctor(base, f"uiroles-doc-{RUN}@example.com")  # admin approval through the API: only approved doctors are listed
        approved_ok = True
    except Exception as e:  # noqa: BLE001
        approved_ok = False
        print("approve_doctor failed:", e, flush=True)
    check("seed.directory_doctor_approved_by_admin", approved_ok, "admin approval of the directory doctor failed")

    # -------- seed (API): demo patient report + a consultation request to the demo doctor
    p_login = api(base, "/api/auth/login", "POST", {"email": "patient@sihat.com", "password": PW})
    d_login = api(base, "/api/auth/login", "POST", {"email": "doctor@sihat.com", "password": PW})
    ptok, pid = p_login["token"], (p_login["json"] or {}).get("user", {}).get("id")
    dtok, did = d_login["token"], (d_login["json"] or {}).get("user", {}).get("id")
    check("seed.demo_accounts_login", bool(ptok and pid and dtok and did),
          f"patient={p_login['status']} doctor={d_login['status']} (no token => rest of the suite would be vacuous)")
    sv = api(base, "/api/patient/sessions", "POST", {"full_report": REPORT, "primary_diagnosis": "Spleen Qi Deficiency",
                                                     "constitution": "Spleen Qi Deficiency", "symptoms": "fatigue, loose stools"}, token=ptok)
    check("seed.patient_report_saved", sv["status"] in (200, 201), f"status={sv['status']} {sv['text'][:120]}")
    vr = api(base, "/api/verification-request", "POST",
             {"userId": pid, "doctorId": did, "doctorName": "Test Doctor",
              "patientData": {"name": "Demo Patient", "email": "patient@sihat.com"}, "reportData": REPORT}, token=ptok)
    req_id = ((vr["json"] or {}).get("data") or {}).get("id")
    check("seed.consult_request_created", vr["status"] == 200 and bool(req_id), f"status={vr['status']} {vr['text'][:120]}")

    page_errors = []   # (who, message)
    bad_responses = []  # (who, status, path)
    console_errors = []  # (who, text)

    def watch(page, who):
        page.on("pageerror", lambda e: page_errors.append((who, str(e)[:200])))

        def on_resp(r):
            try:
                u = urlparse(r.url)
                if u.netloc == host and r.status >= 400:
                    bad_responses.append((who, r.status, u.path))
            except Exception:
                pass
        page.on("response", on_resp)

        def on_console(m):
            if m.type != "error":
                return
            try:
                loc = (m.location or {}).get("url", "")
            except Exception:
                loc = ""
            if loc and urlparse(loc).netloc != host:
                return  # external (Google Fonts etc.) not reachable in a hermetic run
            if "/api/admin/test-api-key" in loc:
                return  # a rejected/missing key legitimately answers 400 (asserted in admin.gemini_key_test_no_server_error)
            console_errors.append((who, m.text[:200]))
        page.on("console", on_console)

        def on_failed(r):
            try:
                u = urlparse(r.url)
                if u.netloc == host:
                    bad_responses.append((who, "FAILED:" + str(r.failure), u.path))
            except Exception:
                pass
        page.on("requestfailed", on_failed)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        def new_ctx(**kw):
            # own rate-limit bucket per browser context; header added to SAME-ORIGIN requests only
            # (adding it cross-origin would make Google Fonts CORS-fail and pollute the console check)
            ctx = browser.new_context(**kw)
            ip = next_ip()
            ctx.route(re.compile(r"^https?://" + re.escape(host) + r"/"),
                      lambda route: route.continue_(headers={**route.request.headers, "x-forwarded-for": ip}))
            return ctx

        # ================= (a) ANONYMOUS =================
        actx = new_ctx()
        a = actx.new_page()
        watch(a, "anon")
        a.goto(base + "/")
        a.wait_for_load_state("networkidle")
        check("anon.home_title", "Sihat" in a.title(), f"title={a.title()!r}")
        check("anon.home_hero_visible", a.is_visible("#home-hero h1.hero-title"), "hero title not visible")
        check("anon.home_primary_cta_visible", a.is_visible("button[data-i18n='hero.start']"), "start-assessment CTA hidden")
        check("anon.home_signin_link", a.get_attribute("a[data-i18n='hero.signin']", "href") == "/login", "sign-in link wrong")

        # language switcher: EN -> 中文 -> BM -> EN, visible text must change
        def hero_txt():
            return (a.inner_text(".hero-sub") or "").strip()
        en = hero_txt()
        a.click("#lang-toggle")
        zh = hero_txt()
        zh_btn = a.inner_text("#lang-toggle").strip()
        a.click("#lang-toggle")
        ms = hero_txt()
        ms_btn = a.inner_text("#lang-toggle").strip()
        check("anon.lang_zh_text_changes", zh != en and re.search(r"[一-鿿]", zh) is not None, f"en={en[:40]!r} zh={zh[:40]!r}")
        check("anon.lang_ms_text_changes", ms != en and ms != zh and len(ms) > 10, f"ms={ms[:40]!r}")
        check("anon.lang_button_labels", zh_btn == "中文" and ms_btn == "BM", f"zh_btn={zh_btn!r} ms_btn={ms_btn!r}")
        a.click("#lang-toggle")
        check("anon.lang_cycles_back_to_en", hero_txt() == en, "third toggle did not restore English")
        a.click("#lang-toggle")  # zh again, test persistence across reload
        a.reload()
        a.wait_for_load_state("networkidle")
        check("anon.lang_persists_across_reload", hero_txt() == zh, f"after reload hero={hero_txt()[:40]!r}")
        a.evaluate("localStorage.setItem('tcm-lang','en')")
        a.reload()
        a.wait_for_load_state("networkidle")

        # guest wizard
        a.click("button[data-i18n='hero.start']")
        a.wait_for_timeout(500)
        check("anon.wizard_opens", a.is_visible("#wizard-section"), "wizard section hidden after CTA click")
        check("anon.wizard_step0_form", a.is_visible("#step-0") and a.is_visible("#bi-name") and a.is_visible("#bi-age"),
              "basic-info step not shown")
        check("anon.wizard_next_button", a.is_visible("#wiz-next-btn"), "wizard next button missing")
        actx.close()

        # mobile viewport
        mctx = new_ctx(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        m = mctx.new_page()
        watch(m, "mobile")
        m.goto(base + "/")
        m.wait_for_load_state("networkidle")
        sw = m.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("anon.mobile_no_horizontal_scroll", sw[0] <= sw[1], f"scrollWidth={sw[0]} innerWidth={sw[1]}")
        box = m.locator("button[data-i18n='hero.start']").bounding_box()
        check("anon.mobile_cta_within_viewport", bool(box) and box["x"] >= 0 and box["x"] + box["width"] <= 376 and m.is_visible("button[data-i18n='hero.start']"),
              f"box={box}")
        m.goto(base + "/login")
        m.wait_for_load_state("networkidle")
        sw = m.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("anon.mobile_login_no_horizontal_scroll", sw[0] <= sw[1], f"scrollWidth={sw[0]} innerWidth={sw[1]}")
        mctx.close()

        # anonymous access control on pages
        xctx = new_ctx()
        x = xctx.new_page()
        watch(x, "anon-gate")
        for path in ("/patient", "/doctor", "/admin", "/patient/report/whatever"):
            x.goto(base + path)
            x.wait_for_load_state("networkidle")
            check(f"anon.{path.strip('/').replace('/', '_')}_redirects_to_login", urlparse(x.url).path == "/login", f"url={x.url}")
        xctx.close()

        # ================= (f) ACCESSIBILITY on login page =================
        fctx = new_ctx()
        f = fctx.new_page()
        watch(f, "a11y")
        f.goto(base + "/login")
        f.wait_for_load_state("networkidle")
        unlabeled = f.evaluate("""() => {
          const out = [];
          document.querySelectorAll('#panel-login input, #panel-login select, #panel-signup input, #panel-forgot input').forEach(el => {
            const id = el.id;
            const lab = id && document.querySelector('label[for="' + id + '"]');
            if (!(lab && lab.textContent.trim()) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.closest('label')) out.push(id || el.name || el.tagName);
          });
          return out;
        }""")
        check("a11y.login_inputs_have_labels", not unlabeled, f"unlabeled: {unlabeled}")
        nameless = f.evaluate("""() => Array.from(document.querySelectorAll('button')).filter(b => !(b.innerText || '').trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).map(b => b.id || b.className)""")
        check("a11y.buttons_have_text", not nameless, f"nameless buttons: {nameless}")
        check("a11y.html_lang_and_title", bool(f.get_attribute("html", "lang")) and bool(f.title().strip()), f"lang={f.get_attribute('html','lang')} title={f.title()!r}")
        check("a11y.single_h1", f.locator("h1").count() == 1, f"h1 count={f.locator('h1').count()}")
        check("a11y.email_input_type_and_autocomplete", f.get_attribute("#login-email", "type") == "email" and bool(f.get_attribute("#login-email", "autocomplete")),
              "email input lacks type=email/autocomplete")
        check("a11y.password_input_masked", f.get_attribute("#login-password", "type") == "password", "password not masked")
        f.focus("#login-email")
        order = []
        for _ in range(6):
            f.keyboard.press("Tab")
            order.append(f.evaluate("() => document.activeElement && (document.activeElement.id || document.activeElement.tagName)"))
        check("a11y.tab_order_email_to_password_to_submit", order[0] == "login-password" and "login-btn" in order[:3], f"tab order={order}")
        # wrong password via keyboard -> inline alert, no navigation
        f.fill("#login-email", "patient@sihat.com")
        f.fill("#login-password", "definitely-wrong-pw")
        f.press("#login-password", "Enter")
        f.wait_for_selector("#login-alert:not(.hidden)", timeout=10000)
        check("a11y.bad_password_shows_alert", urlparse(f.url).path == "/login" and len(f.inner_text("#login-alert").strip()) > 0,
              f"url={f.url} alert={f.inner_text('#login-alert')!r}")
        # Enter submits valid creds
        f.fill("#login-password", PW)
        f.press("#login-password", "Enter")
        try:
            f.wait_for_url("**/patient", timeout=20000)
        except Exception:
            pass
        check("a11y.enter_key_submits_login", urlparse(f.url).path == "/patient", f"url={f.url}")
        fctx.close()

        # ================= (b) PATIENT =================
        pctx = new_ctx()
        pg = pctx.new_page()
        watch(pg, "patient")
        pg.goto(base + "/login")
        pg.wait_for_load_state("networkidle")
        pg.fill("#login-email", "patient@sihat.com")
        pg.fill("#login-password", PW)
        pg.click("#login-btn")
        try:
            pg.wait_for_url("**/patient", timeout=20000)
        except Exception:
            pass
        check("patient.login_form_lands_on_patient", urlparse(pg.url).path == "/patient", f"url={pg.url}")
        pg.wait_for_load_state("networkidle")
        pg.wait_for_timeout(1500)
        for sel, name in (("#health-overview", "overview"), ("#sessions-list", "sessions"), ("#doctor-directory", "doctors"),
                          ("#dietary-q", "dietary"), ("#consultations-list", "consultations")):
            check(f"patient.section_{name}_present", pg.locator(sel).count() == 1 and pg.is_visible(sel), f"{sel} not visible")
        sessions_n = pg.locator("#sessions-list .session-card").count()
        check("patient.saved_report_listed", sessions_n >= 1, f"session cards={sessions_n}")
        check("patient.overview_populated", pg.inner_text("#ov-sessions").strip() not in ("", "—"), f"ov-sessions={pg.inner_text('#ov-sessions')!r}")
        check("patient.header_shows_dashboard_and_logout", pg.is_visible("#nav-logout-link") and pg.inner_text("#nav-login-link").strip() == "Dashboard",
              "logged-in header links missing")
        dir_txt = pg.inner_text("#doctor-directory")
        check("patient.doctor_directory_lists_registered_doctor", pg.locator("#doctor-directory .doctor-card").count() >= 1 and DOC_NAME in dir_txt,
              f"cards={pg.locator('#doctor-directory .doctor-card').count()} text={dir_txt[:100]!r}")

        # open a saved report page
        pg.locator("#sessions-list .session-card").first.click()  # link is rendered on expand
        pg.wait_for_timeout(400)
        link = pg.locator("#sessions-list a[href^='/patient/report/']").first
        href = link.get_attribute("href") if link.count() else None
        check("patient.report_link_present", bool(href), "no /patient/report/{id} link on session card")
        if href:
            pg.goto(base + href)
            pg.wait_for_load_state("networkidle")
            try:
                pg.wait_for_selector("#report-host iframe", timeout=15000)
            except Exception:
                pass
            has_frame = pg.locator("#report-host iframe").count() == 1
            check("patient.report_page_renders_iframe", has_frame, f"host={pg.inner_text('#report-host')[:100]!r}")
            body = ""
            if has_frame:
                pg.wait_for_timeout(500)
                body = pg.frame_locator("#report-host iframe").locator("body").inner_text()
            check("patient.report_page_shows_report_content", "Spleen" in body, f"iframe body head={body[:80]!r}")
            check("patient.report_page_print_and_back", pg.is_visible("#rp-print") and pg.locator("a[href='/patient']").count() >= 1, "print/back controls missing")
        # a bogus report id must degrade gracefully (message, not blank/crash)
        pg.goto(base + "/patient/report/does-not-exist")
        pg.wait_for_load_state("networkidle")
        pg.wait_for_timeout(800)
        check("patient.unknown_report_graceful", "not found" in pg.inner_text("#report-host").lower(), f"host={pg.inner_text('#report-host')[:100]!r}")

        # role fences from the patient's browser
        pg.goto(base + "/admin")
        pg.wait_for_load_state("networkidle")
        check("patient.admin_page_bounces_to_patient", urlparse(pg.url).path == "/patient", f"url={pg.url}")
        pg.goto(base + "/login")
        check("patient.login_page_redirects_when_signed_in", urlparse(pg.url).path == "/patient", f"url={pg.url}")

        # logout
        pg.goto(base + "/patient")
        pg.wait_for_load_state("networkidle")
        pg.click("#nav-logout-link")
        try:
            pg.wait_for_url(base + "/", timeout=15000)
        except Exception:
            pass
        pg.wait_for_load_state("networkidle")
        check("patient.logout_returns_home", urlparse(pg.url).path == "/", f"url={pg.url}")
        check("patient.logout_clears_local_state", pg.evaluate("() => !localStorage.getItem('tcm-token') && !localStorage.getItem('tcm-user')"),
              "tcm-token/tcm-user still in localStorage")
        pg.goto(base + "/patient")
        pg.wait_for_load_state("networkidle")
        check("patient.after_logout_protected_page_redirects_to_login", urlparse(pg.url).path == "/login", f"url={pg.url}")
        pctx.close()

        # ================= (c) DOCTOR (+ patient in a 2nd context) =================
        dctx = new_ctx()
        dg = dctx.new_page()
        watch(dg, "doctor")
        dg.goto(base + "/login")
        dg.wait_for_load_state("networkidle")
        dg.fill("#login-email", "doctor@sihat.com")
        dg.fill("#login-password", PW)
        dg.click("#login-btn")
        try:
            dg.wait_for_url("**/doctor", timeout=20000)
        except Exception:
            pass
        check("doctor.login_lands_on_doctor", urlparse(dg.url).path == "/doctor", f"url={dg.url}")
        dg.wait_for_load_state("networkidle")
        dg.wait_for_timeout(1500)
        check("doctor.inbox_and_stats_render", dg.is_visible("#doctor-inbox") and dg.is_visible("#stats-grid"), "inbox/stats not visible")
        items = dg.locator("#doctor-inbox .inbox-item")
        check("doctor.inbox_has_seeded_request", items.count() >= 1, f"inbox items={items.count()} inbox={dg.inner_text('#doctor-inbox')[:80]!r}")
        check("doctor.inbox_count_badge_matches", dg.inner_text("#inbox-count").strip() == str(items.count()) or items.count() == 0,
              f"badge={dg.inner_text('#inbox-count')!r} items={items.count()}")
        # patients tab
        dg.click("#tabbtn-patients")
        check("doctor.patients_tab_shows_table", dg.is_visible("#doctor-patients table") and not dg.is_visible("#doctor-inbox"),
              "patients tab not rendering table / requests still visible")
        dg.click("#tabbtn-requests")
        check("doctor.requests_tab_back", dg.is_visible("#doctor-inbox"), "requests tab not restored")
        # empty reply is rejected client-side
        ta = dg.locator(f"#reply-{req_id}") if req_id else dg.locator("#doctor-inbox .inbox-item textarea").first
        if ta.count():
            dg.locator(f"button[data-reply='{req_id}']").click()
            check("doctor.empty_reply_rejected", "write feedback" in dg.inner_text(f"#reply-status-{req_id}").lower(),
                  f"status={dg.inner_text(f'#reply-status-{req_id}')!r}")
            ta.fill(REPLY_TEXT)
            dg.locator(f"button[data-reply='{req_id}']").click()
            try:
                dg.wait_for_function("(id) => (document.getElementById('reply-status-'+id)||{}).textContent.includes('sent')", arg=req_id, timeout=15000)
            except Exception:
                pass
            sent = "sent" in (dg.inner_text(f"#reply-status-{req_id}").lower() if dg.locator(f"#reply-status-{req_id}").count() else "")
            dg.wait_for_timeout(1800)  # inbox auto-reloads
            inbox_txt = dg.inner_text("#doctor-inbox")
            check("doctor.reply_sent_and_persisted", (sent or "Reviewed" in inbox_txt) and REPLY_TEXT in inbox_txt, f"inbox head={inbox_txt[:120]!r}")
        else:
            check("doctor.empty_reply_rejected", False, "no reply textarea for the seeded request")
            check("doctor.reply_sent_and_persisted", False, "no reply textarea for the seeded request")

        # patient (2nd context) sees it
        qctx = new_ctx()
        q = qctx.new_page()
        watch(q, "patient2")
        q.goto(base + "/login")
        q.wait_for_load_state("networkidle")
        q.fill("#login-email", "patient@sihat.com")
        q.fill("#login-password", PW)
        q.click("#login-btn")
        try:
            q.wait_for_url("**/patient", timeout=20000)
        except Exception:
            pass
        q.wait_for_load_state("networkidle")
        q.wait_for_timeout(2000)
        ctext = q.inner_text("#consultations-list")
        check("doctor.patient_sees_reply_in_other_context", REPLY_TEXT in ctext, f"consultations text head={ctext[:120]!r}")
        check("doctor.patient_sees_reviewed_badge", "Reviewed" in ctext, f"consultations text head={ctext[:120]!r}")
        qctx.close()

        # doctor logout
        dg.click("#doc-logout-link")
        try:
            dg.wait_for_url("**/login", timeout=15000)
        except Exception:
            pass
        check("doctor.logout_goes_to_login", urlparse(dg.url).path == "/login", f"url={dg.url}")
        dg.goto(base + "/doctor")
        dg.wait_for_load_state("networkidle")
        check("doctor.after_logout_protected_redirects", urlparse(dg.url).path == "/login", f"url={dg.url}")
        dctx.close()

        # ================= (d) ADMIN =================
        mctx2 = new_ctx()
        ad = mctx2.new_page()
        watch(ad, "admin")
        ad.goto(base + "/login")
        ad.wait_for_load_state("networkidle")
        ad.click("button.quick-role[data-role='admin']")
        ad.wait_for_load_state("networkidle")
        try:
            ad.wait_for_url(re.compile(r".*/(patient|admin|doctor)$"), timeout=20000)
        except Exception:
            pass
        landing = urlparse(ad.url).path
        # The admin console has no other entry point, so a signed-in admin must either land on
        # /admin or at least see a link to it.
        admin_link = ad.locator("a[href='/admin']").count()
        check("admin.login_lands_on_console_or_links_to_it", landing == "/admin" or admin_link > 0,
              f"admin landed on {landing} with {admin_link} links to /admin (console unreachable from UI)")
        ad.goto(base + "/admin")
        ad.wait_for_load_state("networkidle")
        check("admin.console_reachable", urlparse(ad.url).path == "/admin", f"url={ad.url}")
        try:
            ad.wait_for_selector("#ov-status .pill", timeout=15000)
        except Exception:
            pass
        ad.wait_for_timeout(1500)
        check("admin.system_health_status_pill", ad.locator("#ov-status .pill").count() > 0, f"ov-status={ad.inner_text('#ov-status')!r}")
        check("admin.database_status_pill", ad.locator("#ov-db .pill").count() > 0, f"ov-db={ad.inner_text('#ov-db')!r}")
        check("admin.ai_service_status_filled", ad.inner_text("#ov-ai").strip() not in ("", "—"), f"ov-ai={ad.inner_text('#ov-ai')!r}")
        check("admin.uptime_populated", ad.inner_text("#ov-uptime").strip() not in ("", "—"), f"uptime={ad.inner_text('#ov-uptime')!r}")
        users_txt = ad.inner_text("#st-users").strip()
        check("admin.user_stats_numeric", users_txt.isdigit() and int(users_txt) >= 4, f"st-users={users_txt!r} (4 demo accounts exist)")
        stuck = [i for i in ("adm-prompts", "adm-errors", "adm-logs", "adm-settings")
                 if ad.inner_text("#" + i).strip().lower().startswith("loading") or not ad.inner_text("#" + i).strip()]
        check("admin.sections_finished_loading", not stuck, f"still loading/empty: {stuck}")
        check("admin.prompt_table_has_rows", ad.locator("#adm-prompts table tbody tr").count() >= 1, "no prompt coverage rows")
        before = ad.inner_text("#adm-testkey-result")
        with ad.expect_response(lambda r: r.url.endswith("/api/admin/test-api-key"), timeout=20000) as ri:
            ad.click("#adm-testkey")
        tk = ri.value
        ad.wait_for_timeout(1000)
        after = ad.inner_text("#adm-testkey-result")
        check("admin.gemini_key_test_reports_result", after != before and after.strip() != "", f"result unchanged: {after[:80]!r}")
        check("admin.gemini_key_test_no_server_error", tk.status < 500, f"POST /api/admin/test-api-key -> {tk.status} body={tk.text()[:160]!r}")
        check("admin.header_logout_available", ad.is_visible("#nav-logout-link"), "no logout link on admin console")
        mctx2.close()

        # ================= (e) DEVELOPER =================
        vctx = new_ctx()
        dv = vctx.new_page()
        watch(dv, "developer")
        dv.goto(base + "/login")
        dv.wait_for_load_state("networkidle")
        dv.fill("#login-email", "developer@sihat.com")
        dv.fill("#login-password", PW)
        dv.click("#login-btn")
        try:
            dv.wait_for_url(re.compile(r".*/(patient|admin|doctor)$"), timeout=20000)
        except Exception:
            pass
        dv.wait_for_load_state("networkidle")
        dland = urlparse(dv.url).path
        dlink = dv.locator("a[href='/admin']").count()
        check("developer.login_lands_on_console_or_links_to_it", dland == "/admin" or dlink > 0,
              f"developer landed on {dland} with {dlink} links to /admin (console unreachable from UI)")
        dv.goto(base + "/admin")
        dv.wait_for_load_state("networkidle")
        dv.wait_for_timeout(1500)
        check("developer.admin_console_accessible", urlparse(dv.url).path == "/admin" and dv.locator("#ov-status .pill").count() > 0,
              f"url={dv.url}")
        vctx.close()

        browser.close()

    # ================= (g) hygiene across everything =================
    check("hygiene.no_js_exceptions", not page_errors, page_errors[:5])
    check("hygiene.no_console_errors_same_origin_ignoring_expected_401",
          not [e for e in console_errors if "401" not in e[1] and "500" not in e[1]],
          [e for e in console_errors if "401" not in e[1]][:5])
    # 401 is legitimate only for the deliberate wrong-password attempt (a11y flow)
    unexpected = [r for r in bad_responses
                  if not (r[1] == 401 and r[2] == "/api/auth/login" and r[0] == "a11y")
                  and r[2] != "/api/admin/test-api-key"]  # asserted separately in admin.gemini_key_test_no_server_error
    check("hygiene.no_unexpected_4xx_5xx_or_failed_same_origin_requests", not unexpected, unexpected[:8])

    n = len(results)
    failed = [l for l, ok in results if not ok]
    print(f"\nTOTAL {n} checks, passed={n - len(failed)} failed={len(failed)}", flush=True)
    if n < 25:
        print(f"FAIL fewer than 25 checks ran ({n})", flush=True)
        return 1
    return 1 if failed else 0


if __name__ == "__main__":
    code = 1
    try:
        code = main()
    except Exception as e:  # a crash is a failure, never a silent zero
        import traceback
        traceback.print_exc()
        print(f"FAIL script crashed — {e}", flush=True)
        print(f"\nTOTAL {len(results)} checks", flush=True)
        code = 1
    finally:
        stop_stack()
    sys.exit(code)
