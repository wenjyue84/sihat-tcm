"""Generate one narration mp3 per scene with Microsoft Edge neural TTS (mainland zh-CN voice).

  uv run --with edge-tts python demo-video/tts.py [--voice zh-CN-XiaoxiaoNeural] [--rate=-4%]

Writes demo-video/build/audio/<scene>.mp3 and demo-video/build/audio/durations.json
({scene: seconds}). Re-run after editing narration.json; unchanged scenes are skipped (hash cache).
"""
import asyncio, hashlib, json, subprocess, sys
from pathlib import Path

import edge_tts

HERE = Path(__file__).parent
OUT = HERE / "build" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
cfg = json.loads((HERE / "narration.json").read_text(encoding="utf-8"))
voice = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--voice=")), cfg["voice"])
rate = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--rate=")), cfg["rate"])
cache_p = OUT / "cache.json"
cache = json.loads(cache_p.read_text()) if cache_p.exists() else {}


def duration(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return round(float(r.stdout.strip()), 2)


async def main():
    durs = {}
    for sc in cfg["scenes"]:
        mp3 = OUT / f"{sc['id']}.mp3"
        key = hashlib.sha1(f"{voice}|{rate}|{sc['narration']}".encode()).hexdigest()
        if not (mp3.exists() and cache.get(sc["id"]) == key):
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(sc["narration"], voice, rate=rate).save(str(mp3))
                    break
                except Exception as e:  # network hiccup
                    print("retry", sc["id"], e, file=sys.stderr)
                    await asyncio.sleep(2)
            cache[sc["id"]] = key
        durs[sc["id"]] = duration(mp3)
        print(f"{sc['id']} {durs[sc['id']]:6.2f}s  {sc['title']}")
    cache_p.write_text(json.dumps(cache))
    (OUT / "durations.json").write_text(json.dumps(durs, ensure_ascii=False, indent=2))
    print("total", round(sum(durs.values()), 1), "s")


asyncio.run(main())
