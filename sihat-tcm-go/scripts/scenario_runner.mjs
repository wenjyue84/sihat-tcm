#!/usr/bin/env node
/**
 * scenario_runner.mjs — drive the full TCM report generation across many diverse
 * patient scenarios (as the wizard's generateReport() does) and verify the
 * patient reliably GETS a correct, parseable, well-structured report.
 *
 *   node scenario_runner.mjs [--base=URL] [--out=DIR]
 *
 * Writes each {scenario, report} to <out>/NN-<id>.json for independent quality
 * evaluation, and prints a JSON verdict to stdout (exit 0 all-good / 1 issues).
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const BASE = flag("base", process.env.ACI_BASE || "http://localhost:8081").replace(/\/+$/, "");
const OUT = resolve(__dirname, flag("out", "scenario_reports"));

const elog = (...a) => process.stderr.write(a.join(" ") + "\n");

// ---- Diverse scenarios: consistent 4-examination data per TCM pattern ----
const SCENARIOS = [
  {
    id: "qi-deficiency-fatigue", lang: "en",
    expect_pattern: "Spleen/Qi deficiency",
    data: {
      basic_info: { name: "Zhang Wei", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["fatigue", "headache"] },
      wen_inquiry: "Fatigue and dull frontal headache for a week, worse in the afternoon. Poor sleep, wakes 2-3 times. Loose stools, poor appetite. No thirst. Sighs often.",
      wang_tongue: "Pale, slightly swollen tongue body with teeth marks along the edges; thin white coating.",
      wang_face: "Pale, lustreless complexion with mild dark circles.",
      wen_audio: "Low, weak voice with occasional sighing.",
      qie: { bpm: "68", qualities: ["weak", "thready"] },
    },
  },
  {
    id: "heart-yin-insomnia", lang: "en",
    expect_pattern: "Heart yin/blood deficiency",
    data: {
      basic_info: { name: "Emily Tan", age: "44", gender: "female", height: "160", weight: "55", symptoms: ["insomnia", "palpitations", "anxiety"] },
      wen_inquiry: "Difficulty falling asleep, vivid dreams, palpitations and anxiety for 2 months. Night sweats, dry mouth, poor memory, five-palm heat. Worse with stress.",
      wang_tongue: "Red tongue tip with little coating; slightly dry.",
      wang_face: "Malar flush, tired-looking eyes.",
      wen_audio: "Clear but slightly rapid speech, restless.",
      qie: { bpm: "92", qualities: ["rapid", "thready"] },
    },
  },
  {
    id: "spleen-damp-digestive", lang: "en",
    expect_pattern: "Spleen deficiency with dampness",
    data: {
      basic_info: { name: "Ahmad", age: "50", gender: "male", height: "170", weight: "84", symptoms: ["digestive", "fatigue"] },
      wen_inquiry: "Bloating after meals, loose sticky stools, heavy limbs and foggy head for months. Poor appetite, prefers warm food, no thirst. Overweight, oily skin.",
      wang_tongue: "Swollen pale tongue with a thick greasy white coating; teeth marks.",
      wang_face: "Sallow, slightly puffy complexion; oily.",
      wen_audio: "Heavy, slightly muffled voice.",
      qie: { bpm: "72", qualities: ["slippery"] },
    },
  },
  {
    id: "kidney-yang-cold", lang: "en",
    expect_pattern: "Kidney yang deficiency",
    data: {
      basic_info: { name: "Robert Lim", age: "62", gender: "male", height: "168", weight: "63", symptoms: ["cold-limbs", "joint-pain"] },
      wen_inquiry: "Cold hands and feet, aversion to cold, sore weak lower back and knees for a year. Frequent clear night urination, low libido, no energy. Everything worse in cold weather.",
      wang_tongue: "Pale, moist, swollen tongue with a thin white coating.",
      wang_face: "Pale, dark under-eye area.",
      wen_audio: "Weak, low voice; slow speech.",
      qie: { bpm: "58", qualities: ["deep", "slow", "weak"] },
    },
  },
  {
    id: "yin-deficiency-heat", lang: "en",
    expect_pattern: "Yin deficiency with empty heat",
    data: {
      basic_info: { name: "Susan Wong", age: "52", gender: "female", height: "158", weight: "54", symptoms: ["hot-flush", "insomnia"] },
      wen_inquiry: "Hot flushes, night sweats, dry mouth and throat, irritability for 6 months (peri-menopausal). Afternoon low-grade heat sensation, constipation with dry stools, five-palm heat.",
      wang_tongue: "Red tongue with cracks and scanty/peeled coating; dry.",
      wang_face: "Cheeks flushed red, dry skin.",
      wen_audio: "Clear voice, slightly hurried.",
      qie: { bpm: "88", qualities: ["thready", "rapid"] },
    },
  },
  {
    id: "liver-qi-stagnation", lang: "en",
    expect_pattern: "Liver Qi stagnation",
    data: {
      basic_info: { name: "Daniel Ng", age: "38", gender: "male", height: "176", weight: "70", symptoms: ["anxiety", "digestive"] },
      wen_inquiry: "Chest and rib-side fullness, frequent sighing, irritability and mood swings, lump sensation in the throat, alternating loose stools and constipation, worse with stress and emotions. Bitter taste in the morning.",
      wang_tongue: "Slightly red tongue edges with a thin white coating.",
      wang_face: "Tense expression, slightly dull complexion.",
      wen_audio: "Frequent sighing, tense voice.",
      qie: { bpm: "78", qualities: ["wiry"] },
    },
  },
  {
    id: "lung-qi-cough", lang: "en",
    expect_pattern: "Lung Qi deficiency",
    data: {
      basic_info: { name: "Grace Lee", age: "29", gender: "female", height: "162", weight: "50", symptoms: ["shortness-breath", "fatigue"] },
      wen_inquiry: "Weak chronic cough, shortness of breath on exertion, weak voice, spontaneous daytime sweating, catches colds easily for several months. Pale, tired.",
      wang_tongue: "Pale tongue with a thin white coating.",
      wang_face: "Pale, bright-white complexion.",
      wen_audio: "Weak, breathy voice; shallow breathing with a faint cough.",
      qie: { bpm: "74", qualities: ["weak"] },
    },
  },
  {
    id: "damp-heat-bi-joint", lang: "en",
    expect_pattern: "Damp-heat / Bi obstruction",
    data: {
      basic_info: { name: "Michael Chua", age: "47", gender: "male", height: "172", weight: "80", symptoms: ["joint-pain", "digestive"] },
      wen_inquiry: "Hot, swollen, painful knee and finger joints, heavy aching limbs worse in humid weather, sticky bitter taste, yellow greasy urine, scanty dark urine for weeks.",
      wang_tongue: "Red tongue with a thick yellow greasy coating.",
      wang_face: "Oily, slightly reddish complexion.",
      wen_audio: "Normal strong voice.",
      qie: { bpm: "84", qualities: ["slippery", "rapid"] },
    },
  },
  {
    id: "zh-heart-spleen", lang: "zh",
    expect_pattern: "心脾两虚",
    data: {
      basic_info: { name: "王丽", age: "48", gender: "female", height: "159", weight: "56", symptoms: ["失眠", "心悸", "健忘"] },
      wen_inquiry: "多梦易醒、心悸健忘三个月，倦怠乏力、食欲不振、大便偏溏。面色萎黄，思虑过度，白天精神差。",
      wang_tongue: "舌淡胖，边有齿痕，苔薄白。",
      wang_face: "面色萎黄少华，眼神疲惫。",
      wen_audio: "声音低弱，懒言少语。",
      qie: { bpm: "70", qualities: ["细", "弱"] },
    },
  },
  {
    id: "ms-wind-cold", lang: "ms",
    expect_pattern: "Wind-cold / exterior",
    data: {
      basic_info: { name: "Nurul", age: "33", gender: "female", height: "163", weight: "58", symptoms: ["headache", "cold-limbs"] },
      wen_inquiry: "Sakit kepala, hidung berair jernih, sedikit demam tetapi lebih rasa sejuk, sakit badan dan tengkuk kaku selama 2 hari selepas kena hujan. Tiada peluh, tak berapa dahaga.",
      wang_tongue: "Lidah pucat dengan salutan putih nipis.",
      wang_face: "Muka agak pucat.",
      wen_audio: "Suara normal dengan hidung tersumbat.",
      qie: { bpm: "76", qualities: ["floating", "wiry"] },
    },
  },
];

async function postConsult(scenario) {
  // Mirror the client: up to 3 attempts, JSON.parse the streamed body.
  let status = 0, text = "", rpt = null, cleaned = "";
  for (let attempt = 0; attempt < 3 && !rpt; attempt++) {
    const res = await fetch(BASE + "/api/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: scenario.data, language: scenario.lang }),
    });
    status = res.status;
    text = await res.text();
    cleaned = text.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try { rpt = JSON.parse(cleaned); } catch { rpt = null; }
  }
  return { status, rpt, rawLen: text.length };
}

function validate(rpt) {
  const issues = [];
  if (!rpt) return ["report did not parse as JSON"];
  const diag = rpt.diagnosis;
  if (!(diag && (typeof diag === "string" || diag.primary_pattern))) issues.push("missing diagnosis.primary_pattern");
  const kf = rpt.analysis && rpt.analysis.key_findings;
  if (kf !== undefined && (typeof kf !== "object" || Array.isArray(kf))) issues.push("key_findings not an object");
  const rec = rpt.recommendations || {};
  if (!(rec.food_therapy || Array.isArray(rec.lifestyle) || Array.isArray(rec.acupoints))) issues.push("missing/empty recommendations");
  if (!rpt.constitution) issues.push("missing constitution");
  if (!rpt.disclaimer) issues.push("missing disclaimer");
  return issues;
}

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const results = [];
  let idx = 0;
  for (const sc of SCENARIOS) {
    idx++;
    const tag = String(idx).padStart(2, "0") + "-" + sc.id;
    elog(`▶ [${idx}/${SCENARIOS.length}] ${sc.id} (${sc.lang})`);
    let r;
    try { r = await postConsult(sc); } catch (e) { r = { status: 0, rpt: null, rawLen: 0, err: String(e) }; }
    const issues = validate(r.rpt);
    const ok = r.status === 200 && issues.length === 0;
    elog(`   ${ok ? "✓" : "✗"} status=${r.status} parsed=${!!r.rpt}${issues.length ? " issues=" + issues.join("; ") : ""}`);
    // Persist symptoms + report for independent evaluation.
    writeFileSync(resolve(OUT, tag + ".json"), JSON.stringify({
      id: sc.id, language: sc.lang, expect_pattern: sc.expect_pattern,
      input: sc.data, report: r.rpt, ok, issues,
    }, null, 2));
    results.push({ id: sc.id, lang: sc.lang, status: r.status, parsed: !!r.rpt, ok, issues });
  }
  const passed = results.filter((x) => x.ok).length;
  const verdict = {
    ok: passed === results.length,
    passed, total: results.length,
    out: OUT,
    failures: results.filter((x) => !x.ok),
    results,
  };
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(verdict.ok ? 0 : 1);
}

main();
