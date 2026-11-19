"""
Build the images for the /demo "测试实录 / Test log" appendix into static/demo-tests/.

    uv run --with pillow --with matplotlib python scripts/build_test_evidence.py --shots <dir with sihat-evidence/ and sihat-devices-shots/>

1. Browser screenshots (scripts/capture_test_evidence.py, scripts/devices_browser_test.py) -> webp, <= 1280 px wide, <= 250 KB.
2. One result card per scenario item (regress/scenarios): the test image (tongue / face) or the case summary, the online
   reference, what the AI said and the independent judge's scores for every scored run (baseline, tuned, tuned-r2).
3. An accuracy chart comparing the scored runs.
4. Terminal cards: raw test output saved under scripts/test_evidence/<name>.txt -> term-<name>.webp.
Writes static/demo-tests/_built.json (file -> width/height) for tests.json authoring. Never touches static/demo/.
"""
import argparse, io, json, pathlib, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "demo-tests"
SCEN = ROOT / "regress" / "scenarios"
RUNS = ["baseline", "tuned", "tuned-r2"]
FONT = "C:/Windows/Fonts/msyh.ttc"
FONT_B = "C:/Windows/Fonts/msyhbd.ttc"
MAX_BYTES = 250 * 1024
built = {}


def save_webp(im, name, max_w=1280):
    im = im.convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    for q in (82, 74, 66, 58, 50, 42):
        buf = io.BytesIO(); im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            break
    (OUT / name).write_bytes(buf.getvalue())
    built[name] = {"w": im.width, "h": im.height, "kb": round(buf.tell() / 1024, 1)}


def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT, size)


def wrap(draw, text, fnt, width):
    """Wrap mixed CJK/Latin text to a pixel width."""
    lines, line = [], ""
    for ch in text:
        if ch == "\n":
            lines.append(line); line = ""; continue
        if draw.textlength(line + ch, font=fnt) > width:
            cut = line.rfind(" ")
            if cut > len(line) * 0.6 and ord(ch) < 0x2E80:
                lines.append(line[:cut]); line = line[cut + 1:] + ch
            else:
                lines.append(line); line = ch
        else:
            line += ch
    if line:
        lines.append(line)
    return lines


def block(draw, xy, label, text, width, color="#1f2a24", max_lines=5, size=19):
    x, y = xy
    draw.text((x, y), label, font=font(16, True), fill="#8a6a1c"); y += 24
    f = font(size)
    lines = wrap(draw, text, f, width)
    if len(lines) > max_lines:
        lines = lines[:max_lines]; lines[-1] = lines[-1][:-1] + "…"
    for ln in lines:
        draw.text((x, y), ln, font=f, fill=color); y += size + 7
    return y + 8


def load_scores():
    out = {}
    for r in RUNS:
        p = SCEN / "runs" / r / "scores.json"
        if p.exists():
            out[r] = {it["id"]: it for it in json.loads(p.read_text(encoding="utf-8"))["items"]}
    return out


def score_line(it):
    if not it:
        return "—"
    if it.get("outcome") == "refused" or it.get("body_colour") is None and "body_colour" in it:
        return "refused"
    keys = [("body_colour", "colour"), ("coating", "coat"), ("shape_moisture", "shape"), ("pattern", "pattern"),
            ("complexion", "complexion"), ("primary_score", "pattern"), ("key_signs", "signs"),
            ("treatment_principle", "principle"), ("safety", "safety")]
    parts = [f"{lab} {it[k]}/2" for k, lab in keys if isinstance(it.get(k), int)]
    return " · ".join(parts) or "—"


def scenario_cards(manifest, scores):
    items = manifest["tongue"] + [f for f in manifest["face"] if f.get("file")] + manifest["text"]
    for it in items:
        is_img = not it["id"].startswith("case-")
        if not is_img:
            it = {**it, **json.loads((SCEN / it["file"]).read_text(encoding="utf-8"))}
            it["summary"] = (f'{it.get("patient", {}).get("age", "")} {it.get("patient", {}).get("sex", "")}. {it.get("chief_complaint", "")} '
                             f'Tongue: {it.get("tongue_as_reported") or "not reported"}. Pulse: {it.get("pulse_as_reported") or "not reported"}.')
            it["title"] = it.get("source_title", "")
        W, H = 1280, 720
        card = Image.new("RGB", (W, H), "#fbf8f1")
        d = ImageDraw.Draw(card)
        d.rectangle([0, 0, W, 64], fill="#0f5132")
        title = f'{it["id"]} · {it.get("documented_condition") or it.get("intended_complexion") or it.get("title") or ""}'
        d.text((24, 14), title[:88], font=font(24, True), fill="#ffffff")
        x0 = 24
        if is_img:
            src = Image.open(SCEN / it["file"]).convert("RGB")
            src.thumbnail((470, 600))
            card.paste(src, (24 + (470 - src.width) // 2, 84 + (600 - src.height) // 2))
            cred = f'{it.get("licence", "synthetic (Z-Image-Turbo seed %s)" % it.get("seed"))} · {it.get("author", "")}'.strip(" ·")
            d.text((24, 692), cred[:70], font=font(14), fill="#6b6b6b")
            x0 = 520
        tw = W - x0 - 28
        exp = it.get("expected_tcm") or {}
        ref = exp.get("pattern") if isinstance(exp, dict) else None
        ref = ref or it.get("source_pattern") or it.get("pattern") or json.dumps(exp, ensure_ascii=False)[:200]
        y = 84
        if not is_img:
            y = block(d, (x0, y), f'CASE (paraphrased from {it.get("source_url", "the cited source")}, {it.get("source_licence", "")})',
                      it["summary"], tw, max_lines=4, size=18)
            ref = f'{it.get("source_pattern", "")} — {it.get("source_treatment_principle", "")}'
        y = block(d, (x0, y), "ONLINE REFERENCE", str(ref), tw, max_lines=3)
        base = scores.get("baseline", {}).get(it["id"], {})
        y = block(d, (x0, y), "AI SAID (baseline run)", base.get("ai_said", "—"), tw, max_lines=4, size=18)
        last = next((r for r in reversed(RUNS) if it["id"] in scores.get(r, {})), None)
        reason = scores.get(last, {}).get(it["id"], {}).get("reason", "") if last else ""
        y = block(d, (x0, y), f"JUDGE ({last or 'n/a'})", reason, tw, color="#3a3a3a", max_lines=5, size=17)
        d.text((x0, max(y, 600)), "SCORES (independent judge)", font=font(16, True), fill="#8a6a1c")
        yy = max(y, 600) + 24
        for r in RUNS:
            if it["id"] in scores.get(r, {}):
                d.text((x0, yy), f"{r:<9} {score_line(scores[r][it['id']])}", font=font(17), fill="#0f5132"); yy += 24
        save_webp(card, f"scen-{it['id']}.webp")


def pct(frac):
    """'17/26 (65%)' or '20/28 (71%); same-13 18/26 (69%)' -> percent, preferring the same-13 figure so every run is
    compared on the same 13 tongues the baseline answered."""
    s = str(frac)
    if "same-13 " in s:
        s = s.split("same-13 ", 1)[1]
    a, b = [int(x) for x in s.split(" ")[0].split("/")]
    return 100.0 * a / b


def pattern_points(a):
    p = a["tongue"]["pattern"]
    return p.get("points") or p.get("points_same13")


def text_metric(key):
    def get(a):
        t = a["text"]
        if "copied" in str(t.get("note", "")):
            return None  # not re-run in this round: no bar rather than a copied one
        return t[key]
    return get


def accuracy_chart():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    font_manager.fontManager.addfont(FONT)
    plt.rcParams["font.family"] = font_manager.FontProperties(fname=FONT).get_name()
    aggs = {}
    for r in RUNS:
        p = SCEN / "runs" / r / "scores.json"
        if p.exists():
            aggs[r] = json.loads(p.read_text(encoding="utf-8"))["aggregate"]
    metrics = [("舌色 body colour", lambda a: a["tongue"]["body_colour"]), ("舌苔 coating", lambda a: a["tongue"]["coating"]),
               ("舌形/润燥 shape", lambda a: a["tongue"]["shape_moisture"]), ("舌象证型 pattern", pattern_points),
               ("病例要点 key signs", text_metric("key_signs")), ("治则 principle", text_metric("treatment_principle")),
               ("安全 safety", text_metric("safety"))]
    fig, ax = plt.subplots(figsize=(12.8, 6.4), dpi=100)
    names = list(aggs)
    wbar = 0.8 / max(1, len(names))
    colors = {"baseline": "#94a3b8", "tuned": "#b45309", "tuned-r2": "#0f5132"}
    for k, r in enumerate(names):
        vals = []
        for _, get in metrics:
            v = get(aggs[r])
            vals.append(None if v is None else pct(v))  # a parse error should fail the build, not draw a 0
        xs = [i + k * wbar for i in range(len(metrics))]
        bars = ax.bar(xs, [v or 0 for v in vals], wbar, label=r, color=colors.get(r, "#666"))
        for b, v in zip(bars, vals):
            ax.text(b.get_x() + b.get_width() / 2, (v or 0) + 1, "n/a" if v is None else f"{v:.0f}", ha="center", fontsize=9,
                    rotation=90 if v is None else 0, va="bottom")
    ax.set_xticks([i + wbar * (len(names) - 1) / 2 for i in range(len(metrics))], [m[0] for m in metrics], fontsize=10)
    ax.set_ylim(0, 105); ax.set_ylabel("% of available points (independent judge)")
    ax.set_title("情境准确度(舌象按同一组 13 张比较;第二轮未重跑医案)\nScenario accuracy, tongues on the same 13 items; round 2 did not re-run the text cases (n/a)")
    ax.legend(); ax.spines[["top", "right"]].set_visible(False)
    buf = io.BytesIO(); fig.tight_layout(); fig.savefig(buf, format="png"); plt.close(fig)
    save_webp(Image.open(buf), "scen-accuracy.webp")


SHOT_SOURCES = {
    # name -> (relative path under --shots, mobile)
    "art-home-hero-1440.webp": ("sihat-evidence/home-hero-1440.png", False),
    "art-home-elements-1440.webp": ("sihat-evidence/home-elements-1440.png", False),
    "art-home-hero-390.webp": ("sihat-evidence/home-hero-390.png", True),
    "art-login-1440.webp": ("sihat-evidence/login-1440.png", False),
    "art-reset-1440.webp": ("sihat-evidence/reset-1440.png", False),
    "art-notfound-1440.webp": ("sihat-evidence/notfound-1440.png", False),
    "art-notfound-390.webp": ("sihat-evidence/notfound-390.png", True),
    "art-history-empty-1440.webp": ("sihat-evidence/patient-history-empty-1440.png", False),
    "art-history-empty-390.webp": ("sihat-evidence/patient-history-empty-390.png", True),
    "art-doctor-1440.webp": ("sihat-evidence/doctor-1440.png", False),
    "dev-wizard-pulse.webp": ("sihat-devices-shots/wizard-pulse-desktop.png", False),
    "dev-wizard-ios.webp": ("sihat-devices-shots/wizard-pulse-ios.png", True),
    "dev-dashboard-empty.webp": ("sihat-devices-shots/dashboard-devices-empty.png", False),
    "dev-dashboard-full.webp": ("sihat-devices-shots/dashboard-devices-full.png", False),
    "dev-dashboard-375.webp": ("sihat-devices-shots/dashboard-devices-375.png", True),
    "dev-patient-devices-1440.webp": ("sihat-evidence/patient-devices-1440.png", False),
    "art-features-before-1440.webp": ("sihat-evidence/home-features-before-1440.png", False),
    "art-features-after-1440.webp": ("sihat-evidence/home-elements-1440.png", False),
    "prod-home-1440.webp": ("sihat-prod/home-1440.png", False),
    "prod-demo-log-1440.webp": ("sihat-prod/demo-log-1440.png", False),
    "prod-demo-log-390.webp": ("sihat-prod/demo-log-390.png", True),
    "prod-notfound-1440.webp": ("sihat-prod/notfound-1440.png", False),
    "log-page-1440.webp": ("tests-shots/tests-1440-0.png", False),
    "log-page-390.webp": ("tests-shots/tests-390-1.png", True),
    # chrome-cdp run in Jay's real Chrome (scratchpad ui-shots/), kept as-is, including the early-capture blanks
    "cdp-reset-1440.webp": ("ui-shots/reset-1440.png", False),
    "cdp-wizard-pulse-1440.webp": ("ui-shots/wizard-pulse-1440.png", False),
    "cdp-patient-390.webp": ("ui-shots/patient-390.png", True),
    "cdp-doctor-1440.webp": ("ui-shots/doctor-1440.png", False),
}


def terminal_cards():
    """scripts/test_evidence/<name>.txt (raw output saved from a test run) -> term-<name>.webp."""
    mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 19)
    cjk = font(18)
    for src in sorted((ROOT / "scripts" / "test_evidence").glob("*.txt")):
        lines = src.read_text(encoding="utf-8").splitlines()[:40]
        W, H = 1280, max(240, 40 + 28 * len(lines) + 30)
        im = Image.new("RGB", (W, H), "#0f1a14")
        d = ImageDraw.Draw(im)
        for i, ln in enumerate(lines):
            ln = ln.replace("✅", "").replace("✓", "OK").replace("✗", "FAIL")  # Consolas has none of these glyphs
            col = "#86efac" if ln.startswith("PASS") or " ok" in ln or '"ok": true' in ln else "#fca5a5" if ln.startswith("FAIL") else "#e5e7eb"
            if ln.startswith("$"):
                col = "#fcd34d"
            f = cjk if any(ord(c) > 0x2E80 for c in ln) else mono
            d.text((24, 24 + 28 * i), ln[:118], font=f, fill=col)
        save_webp(im, f"term-{src.stem}.webp")


def crop_tall(im, max_ratio=2.2):
    """Full-page screenshots can be very tall; keep the top part so the webp stays legible."""
    if im.height > im.width * max_ratio:
        im = im.crop((0, 0, im.width, int(im.width * max_ratio)))
    return im


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", required=True)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    base = pathlib.Path(a.shots)
    for name, (rel, mobile) in SHOT_SOURCES.items():
        p = base / rel
        if not p.exists():
            print("missing", p); continue
        save_webp(crop_tall(Image.open(p)), name, max_w=(560 if mobile else 1280))
    manifest = json.loads((SCEN / "manifest.json").read_text(encoding="utf-8"))
    scenario_cards(manifest, load_scores())
    accuracy_chart()
    terminal_cards()
    for f in ("og.webp",):
        save_webp(Image.open(ROOT / "static" / "img" / "art" / f), "art-" + f)
    (OUT / "_built.json").write_text(json.dumps(built, indent=1), encoding="utf-8")
    # tests.json is hand-written; stamp the real pixel size of every shot it references and list what is missing
    tj = OUT / "tests.json"
    if tj.exists():
        log = json.loads(tj.read_text(encoding="utf-8"))
        missing = []
        for g in log["groups"]:
            for it in g["items"]:
                for sh in it.get("shots", []):
                    p = OUT / sh["file"]
                    if not p.exists():
                        missing.append(sh["file"]); continue
                    with Image.open(p) as im:
                        sh["w"], sh["h"] = im.size
        tj.write_text(json.dumps(log, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("tests.json shots missing:", missing or "none")
    print(f"built {len(built)} images, {sum(v['kb'] for v in built.values()):.0f} KB")
