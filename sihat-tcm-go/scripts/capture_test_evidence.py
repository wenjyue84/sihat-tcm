"""
Capture the screenshots for the /demo "测试实录 / Test log" section and check every illustration really paints.

    E2E_BASE=http://127.0.0.1:18681 uv run --with playwright python scripts/capture_test_evidence.py

Against a hermetic stack (node regress/serve.mjs --db=sqlite). For each page x viewport (1440 desktop, 390 phone) it:
  * waits for every <img> to finish loading (scrolling lazy ones into view first),
  * checks naturalWidth > 0 for every /static/img/art image (an illustration that does not paint is a FAIL),
  * checks there is no horizontal overflow,
  * saves a PNG to E2E_SHOTS/sihat-evidence/<name>.png.
The PNGs are converted to webp for static/demo-tests/ by scripts/build_test_evidence.py.
"""
import os, sys, json, pathlib, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:18681").rstrip("/")
OUT = pathlib.Path(os.environ.get("E2E_SHOTS", tempfile.gettempdir())) / "sihat-evidence"
OUT.mkdir(parents=True, exist_ok=True)
PW = "password123"

results = []
def check(label, ok, detail=""):
    results.append(bool(ok)); print(("PASS " if ok else "FAIL ") + label + ("" if ok else " - " + str(detail)), flush=True)

PAINT = """async () => {
  const imgs = [...document.images];
  for (const im of imgs) { if (!im.complete) { im.loading = 'eager'; im.scrollIntoView({block: 'center'}); } }
  await Promise.all(imgs.map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 8000); })));
  window.scrollTo(0, 0);
  return imgs.filter((im) => im.offsetParent !== null || im.getClientRects().length)
             .map((im) => ({src: im.getAttribute('src') || '', w: im.naturalWidth}));
}"""

# name, path, role (None = anonymous), selector to scroll into view (None = top of page)
PAGES = [
    ("home-hero", "/", None, None),
    ("home-elements", "/", None, "#home-elements"),
    ("login", "/login", None, None),
    ("reset", "/reset-password", None, None),
    ("notfound", "/no-such-page-404", None, None),
    ("patient-history-empty", "/patient", "fresh", "#sessions-empty"),
    ("patient-devices", "/patient", "patient", "#devices"),
    ("doctor", "/doctor", "doctor", None),
    ("demo", "/demo", None, None),
]

def login(ctx, who):
    pg = ctx.new_page()
    if who == "fresh":
        import time
        email = f"evidence-{int(time.time())}@example.com"
        pg.goto(BASE + "/login"); pg.wait_for_load_state("networkidle")
        pg.click("#tab-signup"); pg.fill("#signup-name", "Evidence Tester"); pg.fill("#signup-email", email); pg.fill("#signup-password", PW)
        pg.click("#signup-btn"); pg.wait_for_url("**/patient", timeout=25000)
    else:
        r = pg.request.post(BASE + "/api/auth/login", data=json.dumps({"email": f"{who}@sihat.com", "password": PW}),
                            headers={"Content-Type": "application/json"})
        check(f"login.{who}", r.status == 200, r.status)
    return pg

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for vw, vh, tag in ((1440, 900, "1440"), (390, 844, "390")):
        sessions = {}
        for name, path, who, sel in PAGES:
            key = who or "anon"
            if key not in sessions:
                ctx = browser.new_context(viewport={"width": vw, "height": vh}, is_mobile=(vw < 500), device_scale_factor=1)
                sessions[key] = login(ctx, who) if who else ctx.new_page()
            pg = sessions[key]
            pg.goto(BASE + path); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
            imgs = pg.evaluate(PAINT)
            art = [i for i in imgs if "/static/img/art/" in i["src"]]
            broken = [i["src"] for i in art if not i["w"]]
            check(f"{name}@{tag}.art_images_paint", not broken, broken)
            sw = pg.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            check(f"{name}@{tag}.no_horizontal_overflow", sw[0] <= sw[1] + 1, sw)
            if sel:
                loc = pg.locator(sel).first
                if loc.count():
                    loc.scroll_into_view_if_needed(); pg.evaluate("() => window.scrollBy(0, -80)"); pg.wait_for_timeout(300)
                else:
                    check(f"{name}@{tag}.section_present", False, sel)
            pg.screenshot(path=str(OUT / f"{name}-{tag}.png"))
            print(f"  shot {name}-{tag}.png  art={[(a['src'].split('/')[-1].split('?')[0], a['w']) for a in art]}", flush=True)
        for pg in sessions.values():
            pg.context.close()
    browser.close()

print(f"\nscreenshots: {OUT}")
failed = results.count(False)
print(f"{len(results) - failed}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
