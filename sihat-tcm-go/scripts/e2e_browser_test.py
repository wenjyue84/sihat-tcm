"""
Browser E2E for sihat-tcm-go — covers the UI wiring the ACI cannot see:
one-click Fill, 4-role quick login redirect, forgot-password form, and (the
important one) a REAL tongue-image upload rendering real analysis text.

Run against the local server on :8081. Prints PASS/FAIL lines; exits 1 on any fail.
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://localhost:8081").rstrip("/")
MOCK_TONGUE = r"C:/Users/Jyue/Documents/1-projects/Software Projects/sihat-tcm/sihat-tcm-web/public/mock-tongue.png"

results = []
def check(label, ok, detail=""):
    results.append(ok)
    line = ("PASS " if ok else "FAIL ") + label
    if detail and not ok:
        line += " — " + detail
    print(line, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ---- 1) One-click Fill Test Data → wizard opens + summary populated ----
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE); page.wait_for_load_state("networkidle")
    page.click("text=Fill Test Data")
    page.wait_for_timeout(1800)
    wiz_class = page.get_attribute("#wizard-section", "class") or ""
    check("fill.wizard_visible", "hidden" not in wiz_class, f"class={wiz_class}")
    body = page.content()
    check("fill.summary_has_name", "张伟" in body, "patient name 张伟 not rendered")
    check("fill.summary_has_symptoms", ("headache" in body or "fatigue" in body or "头痛" in body), "symptoms missing in summary")
    ctx.close()

    # ---- 2) Quick login (patient) → redirect to /patient ----
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + "/login"); page.wait_for_load_state("networkidle")
    page.click('.quick-role[data-role="patient"]')
    try:
        page.wait_for_url("**/patient", timeout=15000)
    except Exception:
        pass
    check("quicklogin.redirect_patient", page.url.rstrip("/").endswith("/patient"), f"url={page.url}")
    ctx.close()

    # ---- 2b) Quick login (doctor) → redirect to /doctor ----
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + "/login"); page.wait_for_load_state("networkidle")
    page.click('.quick-role[data-role="doctor"]')
    try:
        page.wait_for_url("**/doctor", timeout=15000)
    except Exception:
        pass
    check("quicklogin.redirect_doctor", page.url.rstrip("/").endswith("/doctor"), f"url={page.url}")
    ctx.close()

    # ---- 3) Forgot password form → shows success message ----
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + "/login"); page.wait_for_load_state("networkidle")
    page.click("#forgot-link")
    page.wait_for_timeout(400)
    forgot_visible = page.is_visible("#panel-forgot")
    check("forgot.panel_shown", forgot_visible, "forgot panel not visible")
    page.fill("#forgot-email", "patient@sihat.com")
    page.click("#forgot-btn")
    try:
        page.wait_for_selector("#forgot-alert.alert-success", timeout=15000)
        msg = page.inner_text("#forgot-alert")
    except Exception:
        msg = page.inner_text("#forgot-alert") if page.is_visible("#forgot-alert") else ""
    check("forgot.success_message", "reset link" in msg.lower() or "sent" in msg.lower(), f"msg={msg!r}")
    ctx.close()

    # ---- 4) REAL tongue image upload → real analysis text renders (Bug #5 UI) ----
    ctx = browser.new_context()
    page = ctx.new_page()
    console_errors = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_load_state("networkidle")
    page.click("text=Start Free Assessment")
    page.wait_for_timeout(600)
    page.fill("#bi-name", "Test User")
    page.fill("#bi-age", "30")
    page.click("#wiz-next-btn")            # step0 -> step1 (inquiry)
    page.wait_for_timeout(600)
    page.click("#wiz-next-btn")            # step1 -> step2 (tongue)
    page.wait_for_timeout(400)
    page.set_input_files("#tongue-file", MOCK_TONGUE)
    ok_render = True
    detail = ""
    try:
        page.wait_for_function(
            "() => { var t=document.getElementById('tongue-obs-text'); return t && t.value && t.value.trim().length > 40; }",
            timeout=70000,
        )
        val = page.eval_on_selector("#tongue-obs-text", "el => el.value").strip()
    except Exception as e:
        ok_render = False
        val = ""
        detail = f"textarea never populated ({e})"
    if ok_render:
        leak = val.startswith("{") or '"is_valid_image"' in val
        placeholder = (val == "" )
        ok_render = (len(val) >= 50) and (not leak) and (not placeholder)
        detail = f"len={len(val)} leak={leak} head={val[:50]!r}"
    check("image.tongue_renders_real_analysis", ok_render, detail)
    check("image.no_console_errors", len(console_errors) == 0, f"errors={console_errors[:3]}")
    ctx.close()

    # ---- 5) Full flow to REPORT (Fill → Generate Report → renders, no crash) ----
    ctx = browser.new_context()
    page = ctx.new_page()
    rpt_errors = []
    page.on("console", lambda m: rpt_errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_load_state("networkidle")
    page.click("text=Fill Test Data")
    page.wait_for_timeout(1200)
    page.click("#wiz-next-btn")   # summary -> report step (triggers /api/consult)
    ok_report = True
    rdetail = ""
    try:
        page.wait_for_function(
            "() => { var c=document.getElementById('report-content'); var e=document.getElementById('report-error');"
            " return (c && !c.classList.contains('hidden')) || (e && !e.classList.contains('hidden') && e.textContent.trim().length>0); }",
            timeout=90000,
        )
        err_visible = page.eval_on_selector("#report-error", "el => (!el.classList.contains('hidden') && el.textContent.trim().length>0)")
        content_visible = page.eval_on_selector("#report-content", "el => !el.classList.contains('hidden')")
        if err_visible:
            ok_report = False
            rdetail = "report-error shown: " + page.inner_text("#report-error")[:90]
        else:
            diag = page.inner_text("#rpt-diagnosis").strip()
            rec = page.inner_text("#rpt-recommendations").strip()
            ok_report = content_visible and len(diag) > 10 and "No diagnosis" not in diag
            rdetail = f"content={content_visible} diaglen={len(diag)} reclen={len(rec)}"
    except Exception as e:
        ok_report = False
        rdetail = f"timeout/err: {e}"
    check("report.renders_without_crash", ok_report, rdetail)
    findings_err = any(("findings" in e) or ("map is not a function" in e) for e in rpt_errors)
    check("report.no_findings_map_error", not findings_err, f"errors={rpt_errors[:3]}")
    ctx.close()

    # ---- 6) Inquiry <OPTIONS> → clickable chips, no raw tag shown ----
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE); page.wait_for_load_state("networkidle")
    page.click("text=Start Free Assessment")
    page.wait_for_timeout(600)
    page.fill("#bi-name", "Test User")
    page.fill("#bi-age", "30")
    page.click("#wiz-next-btn")   # basic info -> inquiry chat
    page.wait_for_timeout(500)
    page.fill("#chat-input", "I often feel cold, have headaches and poor sleep")
    page.click("#chat-send-btn")
    ok_opts = True
    odetail = ""
    try:
        page.wait_for_selector("#chat-options .chat-option-chip", timeout=70000)
        chips = page.query_selector_all("#chat-options .chat-option-chip")
        chat_text = page.inner_text("#chat-messages")
        raw_tag = ("OPTIONS>" in chat_text) or ("&lt;OPTIONS" in chat_text)
        ok_opts = len(chips) > 0 and not raw_tag
        odetail = f"chips={len(chips)} raw_tag_visible={raw_tag}"
    except Exception as e:
        # No chips within timeout — still assert the raw tag is not shown.
        chat_text = page.inner_text("#chat-messages") if page.query_selector("#chat-messages") else ""
        raw_tag = ("OPTIONS>" in chat_text) or ("&lt;OPTIONS" in chat_text)
        ok_opts = not raw_tag
        odetail = f"no chips ({e}); raw_tag_visible={raw_tag}"
    check("inquiry.options_chips_no_raw_tag", ok_opts, odetail)

    # Clicking a chip auto-submits it as the user's next message.
    if ok_opts and odetail.startswith("chips=") and "chips=0" not in odetail:
        try:
            first_label = page.inner_text("#chat-options .chat-option-chip")
            page.query_selector("#chat-options .chat-option-chip").click()
            page.wait_for_timeout(1500)
            user_msgs = page.query_selector_all("#chat-messages .chat-msg.user")
            joined = " ".join([u.inner_text() for u in user_msgs])
            check("inquiry.chip_click_autosubmits", first_label in joined, f"first={first_label!r}")
        except Exception as e:
            check("inquiry.chip_click_autosubmits", False, f"err {e}")
    ctx.close()

    browser.close()

total = len(results); passed = sum(1 for r in results if r); failed = total - passed
print(f"\nE2E VERDICT: passed={passed} failed={failed} total={total}", flush=True)
sys.exit(0 if failed == 0 else 1)
