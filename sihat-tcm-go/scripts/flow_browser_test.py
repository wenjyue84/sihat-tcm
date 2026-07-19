"""
Browser E2E of the full patient↔doctor journey through the UI:
  doctor registers (UI) → patient guest report → save → register → migrate →
  patient picks doctor → doctor inbox reply → patient sees feedback.
Run against a local server. Prints PASS/FAIL; exits 1 on any failure.
"""
import os
import time
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://localhost:8081").rstrip("/")
RUN = str(int(time.time()))
PW = "password123"
DOC_EMAIL = f"ui-doc-{RUN}@example.com"
PAT_EMAIL = f"ui-pat-{RUN}@example.com"
DOC_NAME = f"Dr UI {RUN}"  # unique per run so the patient picks THIS run's doctor

results = []
def check(label, ok, detail=""):
    results.append(ok)
    print(("PASS " if ok else "FAIL ") + label + ("" if ok else " — " + detail), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ============ DOCTOR: register via UI ============
    dctx = browser.new_context()
    dpage = dctx.new_page()
    dpage.goto(BASE + "/login"); dpage.wait_for_load_state("networkidle")
    dpage.click("#tab-signup")
    dpage.click("#role-doctor")
    doctor_fields_visible = dpage.is_visible("#signup-specialty")
    check("doctor.role_toggle_shows_fields", doctor_fields_visible, "specialty field not shown after toggling Doctor")
    dpage.fill("#signup-name", DOC_NAME)
    dpage.fill("#signup-email", DOC_EMAIL)
    dpage.fill("#signup-password", PW)
    dpage.fill("#signup-specialty", "Internal Medicine 内科")
    dpage.fill("#signup-bio", "20 years treating fatigue and digestive disorders")
    dpage.fill("#signup-years", "20")
    dpage.click("#signup-btn")
    try:
        dpage.wait_for_url("**/doctor", timeout=20000)
    except Exception:
        pass
    check("doctor.register_lands_on_doctor_dash", dpage.url.rstrip("/").endswith("/doctor"), f"url={dpage.url}")
    dpage.wait_for_timeout(1500)
    check("doctor.inbox_section_present", dpage.is_visible("#doctor-inbox"), "doctor inbox not rendered")

    # ============ PATIENT: guest report → save → register → migrate ============
    pctx = browser.new_context()
    ppage = pctx.new_page()
    pconsole = []
    ppage.on("console", lambda m: pconsole.append(m.text) if m.type == "error" else None)
    ppage.goto(BASE); ppage.wait_for_load_state("networkidle")
    ppage.click("text=Fill Test Data")
    ppage.wait_for_timeout(1200)
    ppage.click("#wiz-next-btn")  # summary -> generate report
    try:
        ppage.wait_for_function(
            "() => { var c=document.getElementById('report-content'); return c && !c.classList.contains('hidden'); }",
            timeout=90000,
        )
    except Exception:
        pass
    check("patient.guest_report_generated", ppage.eval_on_selector("#report-content", "e=>!e.classList.contains('hidden')"), "guest report not shown")
    # Save as guest → should store guest token + redirect to login
    ppage.click("text=Save to My Account")
    try:
        ppage.wait_for_url("**/login**", timeout=15000)
    except Exception:
        pass
    guest_token = ppage.evaluate("() => localStorage.getItem('tcm-guest-token')")
    check("patient.guest_saved_and_redirected", bool(guest_token) and "/login" in ppage.url, f"token={bool(guest_token)} url={ppage.url}")

    # Register as patient (signup tab should be active via #signup hash)
    ppage.wait_for_load_state("networkidle")
    ppage.click("#tab-signup")
    ppage.fill("#signup-name", "UI Patient")
    ppage.fill("#signup-email", PAT_EMAIL)
    ppage.fill("#signup-password", PW)
    ppage.click("#signup-btn")
    try:
        ppage.wait_for_url("**/patient", timeout=25000)
    except Exception:
        pass
    check("patient.register_lands_on_patient_dash", ppage.url.rstrip("/").endswith("/patient"), f"url={ppage.url}")
    ppage.wait_for_timeout(2500)  # let migration + dashboard loads settle

    # Previous (guest) report migrated → shows in sessions
    sessions_visible = ppage.eval_on_selector("#sessions-list", "e=>e && !e.classList.contains('hidden')") if ppage.query_selector("#sessions-list") else False
    session_cards = len(ppage.query_selector_all("#sessions-list .session-card"))
    check("patient.previous_report_visible", session_cards >= 1, f"session cards={session_cards}")

    # Doctor directory shows the registered doctor
    ppage.wait_for_timeout(500)
    dir_cards = ppage.query_selector_all("#doctor-directory .doctor-card")
    has_our_doc = any(DOC_NAME in (c.inner_text() or "") for c in dir_cards)
    check("patient.sees_doctor_directory", len(dir_cards) >= 1 and has_our_doc, f"cards={len(dir_cards)} hasDoc={has_our_doc}")

    # Request a review from our doctor
    req_btn = None
    for c in dir_cards:
        if DOC_NAME in (c.inner_text() or ""):
            req_btn = c.query_selector("button[data-id]")
            break
    if req_btn:
        req_btn.click()
        ppage.wait_for_timeout(3000)
        cs = ppage.inner_text("#consult-status")
        check("patient.request_sent", "sent to" in cs.lower() or "✓" in cs, f"status={cs[:80]!r}")
    else:
        check("patient.request_sent", False, "no request button for our doctor")

    # ============ DOCTOR: see request + reply ============
    dpage.reload(); dpage.wait_for_load_state("networkidle")
    dpage.wait_for_timeout(2000)
    inbox_items = dpage.query_selector_all("#doctor-inbox .inbox-item")
    check("doctor.sees_patient_request", len(inbox_items) >= 1, f"inbox items={len(inbox_items)}")
    replied = False
    if inbox_items:
        ta = dpage.query_selector("#doctor-inbox .inbox-item textarea")
        btn = dpage.query_selector("#doctor-inbox .inbox-item button[data-reply]")
        if ta and btn:
            ta.fill("Your Spleen Qi pattern is consistent with the AI assessment. Please rest, avoid cold foods, and follow up in 2 weeks.")
            btn.click()
            dpage.wait_for_timeout(3000)  # includes the inbox auto-reload after send
            # The inbox re-renders after sending; the persisted state shows the reply.
            inbox_text = dpage.inner_text("#doctor-inbox") or ""
            replied = ("Your reply:" in inbox_text) or ("Reviewed" in inbox_text)
    check("doctor.reply_sent", replied, "doctor reply not persisted in inbox")

    # ============ PATIENT: sees the doctor feedback ============
    ppage.reload(); ppage.wait_for_load_state("networkidle")
    ppage.wait_for_timeout(2500)
    consult_text = ppage.inner_text("#consultations-list") if ppage.query_selector("#consultations-list") else ""
    check("patient.sees_doctor_feedback", ("Spleen Qi" in consult_text or "consistent with the AI" in consult_text) and ("Reviewed" in consult_text), f"consult text len={len(consult_text)}")
    check("patient.no_console_errors", len(pconsole) == 0, f"errors={pconsole[:3]}")

    dctx.close(); pctx.close(); browser.close()

total = len(results); passed = sum(1 for r in results if r); failed = total - passed
print(f"\nFLOW BROWSER E2E: passed={passed} failed={failed} total={total}", flush=True)
import sys; sys.exit(0 if failed == 0 else 1)
