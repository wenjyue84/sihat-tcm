"""Runtime check: the read-only /admin console renders its sections from the
existing admin/monitoring APIs. Logs in as the demo admin via quick-login.
No AI/quota needed. Exit 0 = all pass."""
import sys
from playwright.sync_api import sync_playwright

BASE = "https://tcm.wenjyue.com"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    pg.goto(BASE + "/login")
    pg.wait_for_load_state("networkidle")
    pg.click("button[data-role='admin']")
    pg.wait_for_timeout(2500)  # allow login + any redirect

    pg.goto(BASE + "/admin")
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1800)  # allow the API fetches to render

    status_pill = pg.locator("#ov-status .pill").count() > 0
    db_pill = pg.locator("#ov-db .pill").count() > 0
    prompt_rows = pg.locator("#adm-prompts table tbody tr").count()
    users = pg.inner_text("#st-users")
    uptime = pg.inner_text("#ov-uptime")
    b.close()

checks = [
    ("overall status pill rendered", status_pill),
    ("database status pill rendered", db_pill),
    ("prompt coverage table has rows", prompt_rows >= 1),
    ("uptime populated", uptime not in ("", "—")),
    ("no console errors", len(errors) == 0),
]
passed = sum(1 for _, ok in checks if ok)
for name, ok in checks:
    print(("PASS" if ok else "FAIL"), name)
print("RESULT %d/%d" % (passed, len(checks)))
print("users=%s uptime=%s promptRows=%d" % (users, uptime, prompt_rows))
if errors:
    print("CONSOLE ERRORS:", " | ".join(errors[:4]))
sys.exit(0 if passed == len(checks) else 1)
