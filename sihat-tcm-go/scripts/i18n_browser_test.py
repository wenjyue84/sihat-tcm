"""Runtime check: the landing-page language toggle actually switches UI text
across en -> zh -> ms. Public page, no AI/quota needed. Exit 0 = all pass."""
import sys
from playwright.sync_api import sync_playwright

BASE = "https://tcm.wenjyue.com/"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    pg.goto(BASE)
    pg.wait_for_load_state("networkidle")
    # normalise to a known start (en) then reload
    pg.evaluate("localStorage.removeItem('tcm-lang')")
    pg.reload()
    pg.wait_for_load_state("networkidle")

    def hero():
        return pg.inner_text(".hero-title") + " || " + pg.inner_text(".hero-sub")

    def stepper():
        # first two stepper labels (Info, Inquiry); hidden but data-i18n still applies
        return pg.eval_on_selector_all(
            ".step-label", "els => els.slice(0,2).map(e => e.textContent).join('/')")

    en = hero(); en_step = stepper()
    pg.click("#lang-toggle"); pg.wait_for_timeout(350)
    zh = hero(); zh_step = stepper()
    pg.click("#lang-toggle"); pg.wait_for_timeout(350)
    ms = hero(); ms_step = stepper()

    # --- Login page (public) ---
    pg.evaluate("localStorage.removeItem('tcm-lang')")
    pg.goto(BASE + "login")
    pg.wait_for_load_state("networkidle")
    login_en = pg.inner_text(".auth-title")
    pg.click("#lang-toggle"); pg.wait_for_timeout(350)
    login_zh = pg.inner_text(".auth-title")
    pg.click("#lang-toggle"); pg.wait_for_timeout(350)
    login_ms = pg.inner_text(".auth-title")
    b.close()

checks = [
    ("en shows English", "Understood Holistically" in en),
    ("zh switches to Chinese", ("全面理解" in zh) or ("结合问诊" in zh)),
    ("ms switches to Malay", ("Kesihatan Anda" in ms) or ("Difahami" in ms) or ("Penilaian" in ms)),
    ("zh != en", zh != en),
    ("ms != zh", ms != zh),
    ("stepper en", "Info" in en_step),
    ("stepper zh", "基本" in zh_step and "问诊" in zh_step),
    ("stepper ms", "Maklumat" in ms_step or "Soal" in ms_step),
    ("login en", "Welcome Back" in login_en),
    ("login zh", "欢迎回来" in login_zh),
    ("login ms", "Selamat Kembali" in login_ms),
]
passed = sum(1 for _, ok in checks if ok)
for name, ok in checks:
    print(("PASS" if ok else "FAIL"), name)
print("RESULT %d/%d" % (passed, len(checks)))
print("EN:", en[:90].replace("\n", " "))
print("ZH:", zh[:90].replace("\n", " "))
print("MS:", ms[:90].replace("\n", " "))
sys.exit(0 if passed == len(checks) else 1)
