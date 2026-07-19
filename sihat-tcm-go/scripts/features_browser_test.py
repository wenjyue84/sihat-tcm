"""
Browser E2E for the follow-up UI features: doctor-dropdown login, patient
profile save+persist, consultation details + cancel/remove.
"""
import os, time
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://localhost:8081").rstrip("/")
RUN = str(int(time.time())); PW = "password123"
PAT = f"feat-pat-{RUN}@example.com"
DNAME = f"Dr Feat {RUN}"; DE = f"feat-doc-{RUN}@example.com"

results = []
def check(label, ok, detail=""):
    results.append(ok); print(("PASS " if ok else "FAIL ") + label + ("" if ok else " — " + detail), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ---- 1) Doctor-dropdown login (seeded demo doctor) ----
    ctx = browser.new_context(); pg = ctx.new_page()
    pg.goto(BASE + "/login"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    opts = pg.query_selector_all("#doctor-login-select option")
    demo = None
    for o in opts:
        if (o.get_attribute("value") or "").endswith("@sihat.com"):
            demo = o.get_attribute("value"); break
    if demo:
        pg.select_option("#doctor-login-select", demo)
        try: pg.wait_for_url("**/doctor", timeout=15000)
        except Exception: pass
    check("doctor_dropdown.login", bool(demo) and pg.url.rstrip("/").endswith("/doctor"), f"picked={demo} url={pg.url}")
    ctx.close()

    # ---- register a doctor (for the patient to consult) via API-less UI ----
    dctx = browser.new_context(); dp = dctx.new_page()
    dp.goto(BASE + "/login"); dp.wait_for_load_state("networkidle")
    dp.click("#tab-signup"); dp.click("#role-doctor")
    dp.fill("#signup-name", DNAME); dp.fill("#signup-email", DE); dp.fill("#signup-password", PW)
    dp.fill("#signup-specialty", "General TCM"); dp.fill("#signup-bio", "feature test doctor")
    dp.click("#signup-btn"); dp.wait_for_url("**/doctor", timeout=20000)

    # ---- 2) Patient: guest report -> save -> register (so they own a report) ----
    pctx = browser.new_context(); pp = pctx.new_page()
    pp.goto(BASE); pp.wait_for_load_state("networkidle")
    pp.click("text=Fill Test Data"); pp.wait_for_timeout(1200); pp.click("#wiz-next-btn")
    pp.wait_for_function("()=>{var c=document.getElementById('report-content');return c&&!c.classList.contains('hidden');}", timeout=90000)
    pp.click("text=Save to My Account"); pp.wait_for_url("**/login**", timeout=15000)
    pp.wait_for_load_state("networkidle"); pp.click("#tab-signup")
    pp.fill("#signup-name", "Feat Patient"); pp.fill("#signup-email", PAT); pp.fill("#signup-password", PW)
    pp.click("#signup-btn"); pp.wait_for_url("**/patient", timeout=25000); pp.wait_for_timeout(2500)
    # open profile <details> and save
    pp.eval_on_selector(".profile-details", "e => e.open = true")
    pp.fill("#pf-age", "38"); pp.fill("#pf-gender", "male") if False else pp.select_option("#pf-gender", "male")
    pp.fill("#pf-height", "176"); pp.fill("#pf-weight", "74")
    pp.wait_for_timeout(300)
    bmi = pp.input_value("#pf-bmi")
    pp.click("#pf-save"); pp.wait_for_timeout(1500)
    status = pp.inner_text("#pf-status")
    check("profile.save", "Saved" in status or "✓" in status, f"status={status!r}")
    check("profile.bmi_computed", bmi not in ("", "auto"), f"bmi={bmi!r}")
    # reload → values persist
    pp.reload(); pp.wait_for_load_state("networkidle"); pp.wait_for_timeout(2000)
    pp.eval_on_selector(".profile-details", "e => e.open = true")
    check("profile.persists", pp.input_value("#pf-age") == "38" and pp.input_value("#pf-height") == "176", f"age={pp.input_value('#pf-age')} h={pp.input_value('#pf-height')}")

    # ---- 3) Consultation details + cancel/remove ----
    # request a review from our feature-test doctor
    pp.wait_for_timeout(500)
    picked = False
    for c in pp.query_selector_all("#doctor-directory .doctor-card"):
        if DNAME in (c.inner_text() or ""):
            c.query_selector("button[data-id]").click(); picked = True; break
    pp.wait_for_timeout(2500)
    # consultation shows details (timestamp / Requested)
    consult = pp.inner_text("#consultations-list") if pp.query_selector("#consultations-list") else ""
    check("consult.shows_details", ("Requested" in consult) and (DNAME in consult), f"picked={picked} len={len(consult)}")
    # cancel it (dialog auto-accept)
    pp.on("dialog", lambda d: d.accept())
    btn = pp.query_selector("#consultations-list button[data-cancel]")
    if btn:
        btn.click(); pp.wait_for_timeout(2500)
    after = pp.inner_text("#consultations-list") if pp.query_selector("#consultations-list") else ""
    check("consult.cancel_removes", (DNAME not in after) or ("No consultation requests" in after), f"after_len={len(after)}")

    dctx.close(); pctx.close(); browser.close()

total = len(results); passed = sum(1 for r in results if r); failed = total - passed
print(f"\nFEATURES BROWSER E2E: passed={passed} failed={failed} total={total}", flush=True)
import sys; sys.exit(0 if failed == 0 else 1)
