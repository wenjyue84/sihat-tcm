"""
Browser E2E for the wearable / phone health-data UI (static/js/health-connect.js, devices.js, wizard.js link-a-device panel).

Run against a hermetic stack (regress/serve.mjs boots one with a fake Google, see regress/stack.mjs):
    E2E_BASE=http://127.0.0.1:18281 uv run --with playwright python scripts/devices_browser_test.py

What it proves in a real Chromium:
  1. wizard pulse step: a fake GATT heart-rate strap (navigator.bluetooth stub) is requested with the 0x180D filter, its notifications
     stream into the BPM field, "Stop and use this" stores the average + HRV chip, and /api/consult carries qie.device_vitals;
  2. an iPhone user agent (no Web Bluetooth) gets the plain-words explanation instead of a dead button;
  3. patient dashboard "Devices & health data": 4 channel cards, Google OAuth round trip through the fake (connect -> consent -> callback
     -> auto sync -> connected + latest vitals), ingest token creation (shown once) + a push with it, Apple export.xml upload, manual entry,
     delete; screenshots at desktop and 375 px width land in E2E_SHOTS (default: temp dir).
"""
import os, re, sys, time, json, datetime, pathlib, tempfile
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:18281").rstrip("/")
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(os.environ.get("E2E_SHOTS", tempfile.gettempdir())) / "sihat-devices-shots"
SHOTS.mkdir(parents=True, exist_ok=True)
RUN = str(int(time.time())); PW = "password123"
EMAIL = f"dev-ui-{RUN}@example.com"

results = []
def check(label, ok, detail=""):
    results.append(bool(ok)); print(("PASS " if ok else "FAIL ") + label + ("" if ok else " - " + str(detail)), flush=True)

FAKE_BT = r"""
(() => {
  const chars = {};
  const mkChar = (id) => { const l = []; return { uuid: id, addEventListener(t, f) { l.push(f); }, removeEventListener() {}, startNotifications() { return Promise.resolve(this); },
      _emit(bytes) { const dv = new DataView(new Uint8Array(bytes).buffer); l.forEach((f) => f({ target: { value: dv } })); } }; };
  const device = { name: 'Fake Strap', addEventListener() {}, gatt: { connected: false,
      connect() { this.connected = true; return Promise.resolve({ getPrimaryService() { return Promise.resolve({ getCharacteristic(c) { chars[c] = chars[c] || mkChar(c); return Promise.resolve(chars[c]); } }); } }); },
      disconnect() { this.connected = false; } } };
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: { requestDevice: async (o) => { window.__btRequest = o; return device; } } });
  window.__btStream = (n) => { let i = 0; const c = chars[0x2a37]; const t = setInterval(() => { c._emit([0x16, 66 + (i % 3), 0x00, 0x04]); if (++i >= n) clearInterval(t); }, 40); };
})();
"""

def apple_fixture(path):
    s = (ROOT / "regress" / "fixtures" / "health" / "export.template.xml").read_text(encoding="utf-8")
    now = datetime.datetime.now(datetime.timezone.utc)
    for n in (0, 1, 2, 3, 45):
        s = s.replace("{{d%d}}" % n, (now - datetime.timedelta(days=n)).strftime("%Y-%m-%d"))
    path.write_text(s, encoding="utf-8")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ------------------------------------------------------------------ 1. wizard: fake strap
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}); ctx.add_init_script(FAKE_BT)
    pg = ctx.new_page()
    consult = []
    pg.on("request", lambda r: consult.append(r.post_data) if r.url.endswith("/api/consult") and r.method == "POST" else None)
    pg.goto(BASE); pg.wait_for_load_state("domcontentloaded")
    pg.evaluate("""() => localStorage.setItem('tcm-wizard-state', JSON.stringify({currentStep: 5,
        basicInfo: {name: 'Device Tester', age: '40', gender: 'male', height: '175', weight: '72', symptoms: ['fatigue']},
        chatHistory: [], inquirySummary: 'Tired for a week.', tongueObs: 'Pale tongue.', faceObs: 'Pale face.', audioObs: '', bpm: '', pulseQualities: [], deviceVitals: [], report: null}))""")
    pg.reload(); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(600)
    check("wizard.link_panel_visible", pg.is_visible("#hc-panel") and pg.locator("#hc-buttons [data-hc-kind]").count() == 4, "panel/buttons missing on step 5")
    pg.click("[data-hc-kind=heart_rate]")
    pg.wait_for_function("() => !!window.__btRequest", timeout=5000)
    req = pg.evaluate("() => window.__btRequest")
    check("wizard.requests_heart_rate_service", req["filters"][0]["services"] == [0x180d], req)
    pg.wait_for_function("() => document.getElementById('hc-stop') && !document.getElementById('hc-stop').classList.contains('hidden')", timeout=5000)
    pg.evaluate("() => window.__btStream(9)"); pg.wait_for_timeout(700)
    check("wizard.live_bpm_shown", re.fullmatch(r"6[6-8]", pg.inner_text("#bpm-display").strip()) is not None, pg.inner_text("#bpm-display"))
    pg.click("#hc-stop")
    pg.wait_for_function("() => document.getElementById('bpm-input').value !== ''", timeout=5000)
    bpm = int(pg.input_value("#bpm-input"))
    check("wizard.average_in_bpm_field", bpm == 67, f"bpm field={bpm} (mean of the 66/67/68 stream is 67)")
    chip = pg.inner_text("#hc-vitals")
    check("wizard.vitals_chip", "67" in chip and "Fake Strap" in chip, chip)
    check("wizard.result_text", "Average 67 bpm" in pg.inner_text("#hc-status"), pg.inner_text("#hc-status"))
    pg.screenshot(path=str(SHOTS / "wizard-pulse-desktop.png"), full_page=False)
    pg.click("#wiz-next-btn"); pg.wait_for_timeout(500)
    summary = pg.inner_text("#summary-grid")
    check("wizard.summary_lists_device_readings", "67" in summary and ("device readings" in summary.lower() or "设备" in summary), summary)
    pg.click("#wiz-next-btn")
    pg.wait_for_function("() => { var c = document.getElementById('report-content'); return c && !c.classList.contains('hidden'); }", timeout=90000)
    body = json.loads(consult[-1]) if consult else {}
    qie = (body.get("data") or {}).get("qie") or {}
    dv = qie.get("device_vitals") or []
    check("wizard.consult_payload_has_device_vitals", qie.get("bpm") == "67" and any(v.get("metric") == "heart_rate" and v.get("device") == "Fake Strap" and v.get("source") == "bluetooth" for v in dv), json.dumps(qie)[:300])
    ctx.close()

    # ------------------------------------------------------------------ 2. iPhone: no Web Bluetooth, plain explanation
    ios = browser.new_context(user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                              viewport={"width": 390, "height": 800}, is_mobile=True)
    # real iOS browsers have no navigator.bluetooth; Chromium (used here) does, so remove it to mimic them
    ios.add_init_script("Object.defineProperty(navigator, 'bluetooth', {value: undefined, configurable: true});")
    ip = ios.new_page(); ip.goto(BASE); ip.wait_for_load_state("domcontentloaded")
    ip.evaluate("""() => localStorage.setItem('tcm-wizard-state', JSON.stringify({currentStep: 5, basicInfo: {name: 'iOS Tester', age: '40', gender: 'male', height: '', weight: '', symptoms: ['fatigue']}, chatHistory: [], bpm: '', pulseQualities: [], deviceVitals: [], report: null}))""")
    ip.reload(); ip.wait_for_load_state("networkidle"); ip.wait_for_timeout(500)
    msg = ip.inner_text("#hc-status")
    check("ios.explains_why_not", "iPhone" in msg and "Bluetooth" in msg, msg)
    check("ios.bluetooth_buttons_marked_unavailable", ip.locator("#hc-buttons [data-hc-kind][aria-disabled=true]").count() == 4, "buttons not aria-disabled")
    ip.screenshot(path=str(SHOTS / "wizard-pulse-ios.png"))
    ios.close()

    # ------------------------------------------------------------------ 3. dashboard
    dctx = browser.new_context(viewport={"width": 1280, "height": 1000}); dctx.add_init_script(FAKE_BT)
    dp = dctx.new_page()
    dp.goto(BASE + "/login"); dp.wait_for_load_state("networkidle")
    dp.click("#tab-signup")
    dp.fill("#signup-name", "Device UI"); dp.fill("#signup-email", EMAIL); dp.fill("#signup-password", PW)
    dp.click("#signup-btn"); dp.wait_for_url("**/patient", timeout=25000)
    dp.wait_for_selector("#devices .hd-card", timeout=15000)
    check("dash.four_channel_cards", dp.locator("#devices .hd-card").count() == 4, dp.locator("#devices .hd-card").count())
    check("dash.art_image_has_dimensions", dp.get_attribute("#devices .hd-intro img", "width") == "900" and dp.get_attribute("#devices .hd-intro img", "height") == "600", "")
    check("dash.honest_bluetooth_copy", "Apple Watch" in dp.inner_text("#hd-bt"), dp.inner_text("#hd-bt")[:200])
    dp.screenshot(path=str(SHOTS / "dashboard-devices-empty.png"), full_page=True)

    # Google round trip through the fake (browser plays the consent screen)
    g_btn = dp.locator("#hd-google [data-act=g-connect]")
    if g_btn.count() == 1:
        g_btn.click()
        dp.wait_for_url(re.compile(r".*/auth\?.*"), timeout=10000)
        q = parse_qs(urlparse(dp.url).query)
        gbase = urlparse(dp.url).scheme + "://" + urlparse(dp.url).netloc
        check("dash.google_goes_to_consent_with_pkce", q.get("code_challenge_method") == ["S256"] and "state" in q and q.get("access_type") == ["offline"], dp.url)
        code = dp.request.post(gbase + "/__fake/authorize", data=json.dumps({"challenge": q["code_challenge"][0]})).json()["code"]
        dp.goto(f"{BASE}/api/health/google/callback?state={q['state'][0]}&code={code}")
        dp.wait_for_url("**/patient?**", timeout=15000) if False else dp.wait_for_load_state("domcontentloaded")
        dp.wait_for_selector("#hd-google .hd-pill.is-on", timeout=20000)
        dp.wait_for_function("() => document.querySelectorAll('#devices .hd-vital').length >= 5", timeout=20000)
        check("dash.google_connected_and_synced", "Connected" in dp.inner_text("#hd-google") and dp.locator("#devices .hd-vital").count() >= 5, dp.inner_text("#hd-google")[:200])
        check("dash.return_banner_shown", dp.is_visible("#hd-banner"), "")
    else:
        check("dash.google_card_not_configured_state", "Not configured" in dp.inner_text("#hd-google"), dp.inner_text("#hd-google")[:200])

    # ingest token
    dp.click("[data-act=token-create]")
    dp.wait_for_selector("#hd-token-val", timeout=10000)
    tok = dp.input_value("#hd-token-val")
    check("dash.token_shown_once", tok.startswith("shi_") and "shown only once" in dp.inner_text("#hd-auto"), tok[:12])
    r = dp.evaluate("""async (tok) => { const x = await fetch('/api/health/ingest', {method:'POST', headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},
        body: JSON.stringify([{metric:'heart_rate', value: 71, unit:'bpm', measured_at: new Date(Date.now()-60000).toISOString(), source:'Browser test'}])}); return [x.status, await x.json()]; }""", tok)
    check("dash.ingest_with_the_token_works", r[0] == 200 and r[1]["inserted"] == 1, r)
    dp.reload(); dp.wait_for_selector("#devices .hd-card", timeout=15000)
    check("dash.token_not_shown_again", dp.locator("#hd-token-val").count() == 0 and "ending in" in dp.inner_text("#hd-auto"), dp.inner_text("#hd-auto")[:200])

    # Apple export upload
    fx = pathlib.Path(tempfile.gettempdir()) / f"export-{RUN}.xml"; apple_fixture(fx)
    dp.set_input_files("#hd-apple-file", str(fx))
    dp.click("[data-act=apple]")
    dp.wait_for_function("() => /Imported 12 new/.test(document.getElementById('hd-banner').textContent)", timeout=30000)
    check("dash.apple_export_imported", "Imported 12 new readings" in dp.inner_text("#hd-banner"), dp.inner_text("#hd-banner"))
    dp.set_input_files("#hd-apple-file", str(fx)); dp.click("[data-act=apple]")
    dp.wait_for_function("() => /0 new readings \\(12 already stored\\)/.test(document.getElementById('hd-banner').textContent)", timeout=30000)
    check("dash.apple_reimport_is_noop", "0 new readings (12 already stored)" in dp.inner_text("#hd-banner"), dp.inner_text("#hd-banner"))
    fx.unlink(missing_ok=True)
    dp.wait_for_timeout(1200)   # the list reloads after the banner; do not open the manual form under it

    # manual entry
    dp.locator("#devices details.hd-details summary").last.click()
    dp.select_option("#hd-m-metric", "systolic_bp"); dp.fill("#hd-m-value", "123")
    dp.click("[data-act=manual]")
    dp.wait_for_function("() => document.getElementById('hd-banner').textContent.indexOf('Saved') >= 0", timeout=10000)
    check("dash.manual_entry_saved", "Saved" in dp.inner_text("#hd-banner"), dp.inner_text("#hd-banner"))
    check("dash.recent_table_lists_sources", dp.locator("#devices .hd-table tbody tr").count() >= 10, dp.locator("#devices .hd-table tbody tr").count())
    dp.screenshot(path=str(SHOTS / "dashboard-devices-full.png"), full_page=True)

    # mobile layout: no horizontal scroll
    dp.set_viewport_size({"width": 375, "height": 800}); dp.wait_for_timeout(400)
    sw = dp.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
    check("dash.mobile_no_horizontal_overflow", sw[0] <= sw[1] + 1, sw)
    dp.locator("#devices").scroll_into_view_if_needed()
    dp.screenshot(path=str(SHOTS / "dashboard-devices-375.png"))
    dp.set_viewport_size({"width": 1280, "height": 1000})

    # Chinese UI
    dp.evaluate("() => window.tcmLang && window.tcmLang.toggle()")
    dp.wait_for_timeout(400)
    zh = dp.inner_text("#devices")
    check("dash.chinese_strings", ("设备与健康数据" in zh or "蓝牙" in zh) and "Connect Google Health" not in zh, zh[:160])

    # delete everything
    dp.once("dialog", lambda d: d.accept())
    dp.click("[data-act=del-all]")
    dp.wait_for_function("() => document.querySelectorAll('#devices .hd-table').length === 0", timeout=10000)
    check("dash.delete_all", dp.locator("#devices .hd-table").count() == 0, "")
    dctx.close()
    browser.close()

print(f"\nscreenshots: {SHOTS}")
failed = results.count(False)
print(f"{len(results) - failed}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
