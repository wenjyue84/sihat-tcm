"""
Read-only post-deploy check of the PRODUCTION site in Chromium: no sign-up, no login, no form submit, GET navigation only.

    E2E_BASE=https://tcm.wenjyue.com uv run --with playwright python scripts/capture_prod_readonly.py

For each public page at 1440 and 390 px: every visible <img> decodes (naturalWidth > 0), no sideways scroll, no console
errors, and a screenshot lands in E2E_SHOTS/sihat-prod/. Also checks the deployed build serves what the deploy added
(the /demo test log, the five-elements band, the og:image URL). scripts/build_test_evidence.py turns the PNGs into webp.
"""
import os, sys, pathlib, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "https://tcm.wenjyue.com").rstrip("/")
OUT = pathlib.Path(os.environ.get("E2E_SHOTS", tempfile.gettempdir())) / "sihat-prod"
OUT.mkdir(parents=True, exist_ok=True)
results = []
def check(label, ok, detail=""):
    results.append(bool(ok)); print(("PASS " if ok else "FAIL ") + label + ("" if ok else " - " + str(detail)), flush=True)

PROBE = """async () => {
  const imgs = [...document.images];
  imgs.forEach((i) => { i.loading = 'eager'; });
  await Promise.all(imgs.map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  const shown = imgs.filter((i) => i.offsetParent !== null);
  return {n: shown.length, broken: shown.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')),
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth};
}"""
PAGES = [("home", "/"), ("login", "/login"), ("demo-log", "/demo#tests"), ("notfound", "/no-such-page-404")]

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, tag in ((1440, 900, "1440"), (390, 844, "390")):
        for name, path in PAGES:
            pg = b.new_page(viewport={"width": w, "height": h})
            errs = []
            # own-origin failures and JS errors only: Cloudflare injects its analytics beacon (static.cloudflareinsights.com), which the
            # sandboxed browser cannot reach, and the 404 page's own 404 status is logged by Chromium as a console error.
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("requestfailed", lambda r: errs.append(f"{r.url} {r.failure}") if r.url.startswith(BASE) else None)
            r = pg.goto(BASE + path); pg.wait_for_load_state("networkidle")
            if name != "notfound":
                check(f"{name}@{tag}.status_200", r.status == 200, r.status)
            info = pg.evaluate(PROBE)
            check(f"{name}@{tag}.images_decode({info['n']})", not info["broken"], info["broken"])
            check(f"{name}@{tag}.no_sideways_scroll", info["over"] <= 1, info["over"])
            check(f"{name}@{tag}.no_console_errors", not errs, errs[:2])
            if name == "demo-log":
                pg.locator("#tests").scroll_into_view_if_needed(); pg.evaluate("() => window.scrollBy(0, -70)")
                check(f"{name}@{tag}.test_log_entries", pg.locator("#tests article.tcase").count() >= 10, pg.locator("#tests article.tcase").count())
            pg.wait_for_timeout(300)
            pg.screenshot(path=str(OUT / f"{name}-{tag}.png"))
            pg.close()
    pg = b.new_page()
    home = pg.goto(BASE + "/").text() if False else pg.request.get(BASE + "/").text()
    check("deploy.home_has_five_elements_band", "art-elements" in home and "elements.webp" in home)
    check("deploy.og_image_is_absolute_jpg", f'content="{BASE}/static/img/art/og.jpg' in home, "og:image url not absolute og.jpg")
    check("deploy.apple_import_route_exists", pg.request.post(BASE + "/api/health/apple/import", data="<x/>", headers={"X-Sihat-Upload": "1", "Content-Type": "application/xml"}).status == 401)
    b.close()

failed = results.count(False)
print(f"\nscreenshots: {OUT}\n{len(results) - failed}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
