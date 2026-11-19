#!/usr/bin/env node
/**
 * compose.mjs — assemble the Sihat TCM promo video from a storyboard.
 *
 *   node demo-video/compose.mjs [--storyboard=demo-video/storyboard.json] [--out=demo-video/out/sihat-tcm-demo.mp4]
 *                               [--max-mb=29] [--preview]      (--preview = 640x360, fast, no size fitting)
 *
 * Inputs : narration.json (scene text) · build/audio/<scene>.mp3 + durations.json (tts.py) ·
 *          storyboard.json (per-scene visuals, music, credits)
 * Output : 1280x720 / 25 fps H.264 + AAC mp4 with burned-in Chinese captions + subtitles, music ducked under the
 *          voice, loudness-normalised, bitrate fitted to stay under --max-mb (WhatsApp limit is 32 MB).
 *
 * storyboard.json: { "music": {"src": "...mp3", "volume": 0.2}, "logo": "...png"|null,
 *   "scenes": [ { "id": "s00", "visuals": [ {"type":"clip|image|video", "src":"...", "weight":1, "speed":1, "start":0, "zoom":"in|out|none"} ] } ],
 *   "credits": ["line", ...] }
 * Every src is relative to demo-video/ (or absolute).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const PREVIEW = process.argv.includes("--preview");
const W = PREVIEW ? 640 : 1280, H = PREVIEW ? 360 : 720, FPS = 25;
const OUT = resolve(HERE, "..", arg("out", "demo-video/out/sihat-tcm-demo.mp4"));
const MAXMB = parseFloat(arg("max-mb", "29"));
const BUILD = join(HERE, "build"), SEG = join(BUILD, PREVIEW ? "seg-prev" : "seg");
mkdirSync(SEG, { recursive: true }); mkdirSync(dirname(OUT), { recursive: true });
const abs = (p) => (isAbsolute(p) ? p : resolve(HERE, p));
const FONT = "Microsoft YaHei";
const FONTS_DIR = "C\\:/Windows/Fonts";

const narr = JSON.parse(readFileSync(join(HERE, "narration.json"), "utf8"));
const sb = JSON.parse(readFileSync(abs(arg("storyboard", "storyboard.json")), "utf8"));
const durs = JSON.parse(readFileSync(join(BUILD, "audio", "durations.json"), "utf8"));
const text = new Map(narr.scenes.map((s) => [s.id, s]));

function ff(args, label) {
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) { console.error(`ffmpeg failed (${label}):\n${r.stderr.slice(-1800)}`); process.exit(1); }
}
function probe(p) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,duration:format=duration", "-of", "json", p], { encoding: "utf8" });
  try { const j = JSON.parse(r.stdout); return { w: j.streams?.[0]?.width, h: j.streams?.[0]?.height, dur: parseFloat(j.format?.duration || j.streams?.[0]?.duration || "0") }; } catch { return { w: 0, h: 0, dur: 0 }; }
}

/* ------------------------------ per-scene timing ------------------------------ */
const PAD_HEAD = 0.5, PAD_TAIL = 0.7;
const scenes = sb.scenes.map((s) => {
  const t = text.get(s.id);
  if (!t) throw new Error("storyboard scene without narration: " + s.id);
  const a = durs[s.id];
  if (!a) throw new Error("no audio duration for " + s.id + " (run tts.py)");
  return { ...s, title: t.title, caption: t.caption, narration: t.narration, audio: a, dur: +(a + PAD_HEAD + PAD_TAIL).toFixed(2) };
});
if (sb.credits) scenes.push({ id: "credits", visuals: [{ type: "card" }], dur: 7.5, credits: sb.credits, audio: 0 });

/* ------------------------------ segment rendering ------------------------------ */
const bgFit = (w, h) => `split[a][b];[a]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=24:3,eq=brightness=-0.12[bg];[b]scale=${Math.round(w * 0.94)}:${Math.round(h * 0.94)}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;

function renderVisual(v, d, outFile) {
  const fade = `fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0, d - 0.35).toFixed(2)}:d=0.35`;
  if (v.type === "card") {
    ff(["-f", "lavfi", "-i", `color=c=0x0f2a24:s=${W}x${H}:r=${FPS}:d=${d}`, "-vf", `format=yuv420p,${fade}`, "-t", d, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", outFile], "card");
    return;
  }
  const src = abs(v.src);
  if (!existsSync(src)) throw new Error("missing visual " + src);
  if (v.type === "image") {
    const zoom = v.zoom || "in";
    const frames = Math.round(d * FPS);
    const z = zoom === "out" ? `max(1.0,1.14-0.14*on/${frames})` : zoom === "none" ? "1.0" : `min(1.14,1.0+0.14*on/${frames})`;
    const vf = `${bgFit(1920, 1080)},zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p,${fade}`;
    ff(["-loop", "1", "-framerate", FPS, "-t", d, "-i", src, "-vf", vf, "-t", d, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", outFile], "image " + v.src);
    return;
  }
  // clip (stock) or video (screen recording): trim/speed/loop to exactly d seconds
  const speed = v.speed || 1;
  const info = probe(src);
  const need = d * speed; // source seconds needed
  const loops = info.dur > 0 && info.dur - (v.start || 0) < need ? Math.ceil(need / Math.max(0.5, info.dur - (v.start || 0))) : 0;
  const scale = v.type === "video"
    ? `${bgFit(W, H)}` // keep UI recordings uncropped
    : `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},eq=saturation=1.06:contrast=1.03`;
  const vf = `${scale},setpts=PTS/${speed},fps=${FPS},format=yuv420p,${fade}`;
  const pre = loops ? ["-stream_loop", String(loops)] : [];
  ff([...pre, "-ss", String(v.start || 0), "-i", src, "-vf", vf, "-t", d, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", outFile], "clip " + v.src);
}

const segFiles = [];
for (const sc of scenes) {
  const vis = sc.visuals && sc.visuals.length ? sc.visuals : [{ type: "card" }];
  const wsum = vis.reduce((a, v) => a + (v.weight || 1), 0);
  const parts = [];
  vis.forEach((v, i) => {
    const d = +(sc.dur * (v.weight || 1) / wsum).toFixed(2);
    const f = join(SEG, `${sc.id}_${i}.mp4`);
    renderVisual(v, d, f);
    parts.push(f);
  });
  const list = join(SEG, `${sc.id}.txt`);
  writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  const sceneFile = join(SEG, `${sc.id}.mp4`);
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", sceneFile], "concat " + sc.id);
  segFiles.push(sceneFile);
  console.error(`scene ${sc.id} ${sc.dur}s (${vis.length} visuals)`);
}
const allList = join(SEG, "all.txt");
writeFileSync(allList, segFiles.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
const silent = join(BUILD, PREVIEW ? "silent-prev.mp4" : "silent.mp4");
ff(["-f", "concat", "-safe", "0", "-i", allList, "-c", "copy", silent], "concat all");

/* ------------------------------ captions + subtitles (ASS) ------------------------------ */
const ts = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, "0")}:${x.toFixed(2).padStart(5, "0")}`; };
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\{/g, "(").replace(/\}/g, ")");
const sc_ = PREVIEW ? 0.5 : 1;
let ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n`;
ass += `Style: Cap,${FONT},${Math.round(40 * sc_)},&H00FFFFFF,&H00FFFFFF,&H00123A30,&HB0123A30,1,0,0,0,100,100,1,0,3,${Math.round(12 * sc_)},0,7,${Math.round(40 * sc_)},40,${Math.round(36 * sc_)},1\n`;
ass += `Style: Sub,${FONT},${Math.round(34 * sc_)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,${Math.round(3 * sc_)},${Math.round(1 * sc_)},2,60,60,${Math.round(62 * sc_)},1\n`;
ass += `Style: Brand,${FONT},${Math.round(24 * sc_)},&H99FFFFFF,&H99FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,2,0,1,${Math.round(2 * sc_)},0,9,40,${Math.round(36 * sc_)},${Math.round(28 * sc_)},1\n`;
ass += `Style: Disc,${FONT},${Math.round(22 * sc_)},&HCCFFFFFF,&HCCFFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,${Math.round(2 * sc_)},0,1,40,40,${Math.round(14 * sc_)},1\n`;
ass += `Style: Title,${FONT},${Math.round(64 * sc_)},&H00FFFFFF,&H00FFFFFF,&H00123A30,&H00000000,1,0,0,0,100,100,2,0,1,${Math.round(4 * sc_)},${Math.round(2 * sc_)},5,60,60,60,1\n`;
ass += `\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
let t0 = 0;
for (const sc of scenes) {
  const end = t0 + sc.dur;
  if (sc.id === "credits") {
    ass += `Dialogue: 0,${ts(t0 + 0.3)},${ts(end - 0.2)},Title,,0,0,0,,${esc("Sihat TCM")}\\N{\\fs${Math.round(30 * sc_)}}${(sc.credits || []).map(esc).join("\\N")}\n`;
  } else {
    if (sc.caption) ass += `Dialogue: 1,${ts(t0 + 0.3)},${ts(end - 0.2)},Cap,,0,0,0,,{\\fad(300,300)}${esc(sc.caption)}\n`;
    // narration subtitles split on punctuation, timed by character share of the audio span
    const pieces = sc.narration.split(/(?<=[，。；：？！、])/).map((x) => x.trim()).filter(Boolean);
    const total = pieces.reduce((a, p) => a + p.length, 0);
    let cur = t0 + PAD_HEAD;
    for (const p of pieces) {
      const d = sc.audio * p.length / total;
      ass += `Dialogue: 2,${ts(cur)},${ts(cur + d)},Sub,,0,0,0,,${esc(p.replace(/[，。；：、]$/, ""))}\n`;
      cur += d;
    }
  }
  t0 = end;
}
const totalDur = t0;
ass += `Dialogue: 3,${ts(0)},${ts(totalDur)},Brand,,0,0,0,,Sihat TCM\n`;
ass += `Dialogue: 3,${ts(0)},${ts(totalDur)},Disc,,0,0,0,,${esc(narr.disclaimer)}\n`;
const assFile = join(BUILD, "subs.ass");
writeFileSync(assFile, ass, "utf8");

/* ------------------------------ audio mix ------------------------------ */
// narration track: each scene's mp3 placed at its start + PAD_HEAD, whole track exactly totalDur long
const narrWav = join(BUILD, "narration.wav");
{
  const inputs = [], filters = [], labels = [];
  let t = 0, idx = 0;
  for (const sc of scenes) {
    if (sc.id !== "credits") {
      inputs.push("-i", join(BUILD, "audio", `${sc.id}.mp3`));
      filters.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round((t + PAD_HEAD) * 1000)}:all=1[n${idx}]`);
      labels.push(`[n${idx}]`); idx++;
    }
    t += sc.dur;
  }
  ff([...inputs, "-filter_complex", `${filters.join(";")};${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad=whole_dur=${totalDur},atrim=0:${totalDur}[o]`, "-map", "[o]", "-ac", "1", narrWav], "narration track");
}
let finalAudio = narrWav;
if (sb.music && existsSync(abs(sb.music.src))) {
  const mixed = join(BUILD, "mix.wav");
  const vol = sb.music.volume ?? 0.22;
  ff(["-stream_loop", "-1", "-i", abs(sb.music.src), "-i", narrWav,
    "-filter_complex",
    `[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=${vol},afade=t=in:st=0:d=2.5,afade=t=out:st=${(totalDur - 4).toFixed(2)}:d=4[m];` +
    `[1:a]aformat=channel_layouts=stereo,asplit=2[n][sc];[m][sc]sidechaincompress=threshold=0.02:ratio=9:attack=15:release=450[d];` +
    `[d][n]amix=inputs=2:normalize=0:duration=longest,atrim=0:${totalDur},loudnorm=I=-16:TP=-1.5:LRA=9[o]`,
    "-map", "[o]", mixed], "music mix");
  finalAudio = mixed;
}

/* ------------------------------ final encode (size-fitted) ------------------------------ */
const subVf = `subtitles='${assFile.replace(/\\/g, "/").replace(/:/g, "\\:")}':fontsdir='${FONTS_DIR}'`;
const logo = sb.logo && existsSync(abs(sb.logo));
function encode(vkbps) {
  const args = ["-i", silent, "-i", finalAudio];
  const vf = logo ? `${subVf}` : subVf;
  args.push("-vf", vf, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", PREVIEW ? "veryfast" : "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-b:v", `${vkbps}k`, "-maxrate", `${Math.round(vkbps * 1.35)}k`, "-bufsize", `${vkbps * 2}k`, "-c:a", "aac", "-b:a", "96k", "-ac", "2", "-movflags", "+faststart", "-shortest", OUT);
  ff(args, "final encode");
  return statSync(OUT).size / 1048576;
}
if (PREVIEW) { const mb = encode(600); console.log(JSON.stringify({ out: OUT, mb: +mb.toFixed(1), seconds: +totalDur.toFixed(1), preview: true })); process.exit(0); }
let vk = Math.floor(((MAXMB * 8192) / totalDur) - 96 - 24); // kbit/s budget after audio + container
let mb = encode(vk);
for (let i = 0; i < 3 && mb > MAXMB; i++) { vk = Math.floor(vk * (MAXMB / mb) * 0.96); mb = encode(vk); }
console.log(JSON.stringify({ out: OUT, mb: +mb.toFixed(2), seconds: +totalDur.toFixed(1), video_kbps: vk, under_32mb: mb < 32 }));
