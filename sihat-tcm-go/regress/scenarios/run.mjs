#!/usr/bin/env node
/**
 * run.mjs — runs the online-grounded scenario corpus (manifest.json) against a hermetic sihat-tcm-go stack and saves every
 * raw output to runs/<label>/<id>.json.
 *
 *   node run.mjs --label=baseline                  # real PC models (opus/sonnet/haiku via sihat-listener), fake DB, port offset 300
 *   node run.mjs --label=t1 --only=tongue-01,case-03   # ids, id prefixes ("tongue", "face", "case") or types
 *   node run.mjs --label=smoke --ai=fake           # canned replies, zero cost (plumbing check only)
 *   node run.mjs --label=x --base=http://127.0.0.1:18381   # reuse an already running stack (does not start/stop one)
 *
 * Endpoints are called exactly as static/js/wizard.js does:
 *   tongue / face  POST /api/analyze-image  {image: <data URL>, type: "tongue"|"face"}
 *   text case      POST /api/consult        {data:{basic_info,wen_inquiry,wang_tongue,wang_face,wen_audio,qie}, language}
 * Concurrency <= 3, retry on 429 / 5xx / unparseable consult JSON. NEVER calls OpenRouter; AI is the local sihat-listener only.
 * If --ai=pc cannot start the stack the run ends with "BLOCKED: <reason>" and writes no fake outputs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const a = process.argv.find((x) => x === "--" + n || x.startsWith("--" + n + "=")); return a === undefined ? d : a.includes("=") ? a.slice(a.indexOf("=") + 1) : "true"; };
process.env.ACI_PORT_OFFSET = process.env.ACI_PORT_OFFSET || "300"; // must be set before stack.mjs reads it

const label = arg("label", "run-" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12));
const only = arg("only", "").split(",").map((s) => s.trim()).filter(Boolean);
const ai = arg("ai", "pc");
const dbMode = arg("db", "fake");
const conc = Math.min(3, Math.max(1, parseInt(arg("concurrency", "3"), 10) || 3));
const extBase = arg("base", "");
const noBuild = arg("no-build", "false") === "true";
const reqTimeoutMs = parseInt(arg("timeout", "330000"), 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const manifest = JSON.parse(readFileSync(join(HERE, "manifest.json"), "utf8"));
let items = [
  ...manifest.tongue.map((x) => ({ ...x, type: "tongue" })),
  ...manifest.face.filter((x) => x.generated && x.file).map((x) => ({ ...x, type: "face" })),
  ...manifest.text.map((x) => ({ ...JSON.parse(readFileSync(join(HERE, x.file), "utf8")), type: "text" })),
];
if (only.length) items = items.filter((it) => only.some((o) => it.id === o || it.id.startsWith(o) || it.type === o));
if (!items.length) { console.error("no items selected"); process.exit(2); }

const outDir = join(HERE, "runs", label);
mkdirSync(outDir, { recursive: true });

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
function dataURL(rel) {
  const p = join(HERE, rel);
  const ext = p.split(".").pop().toLowerCase();
  return `data:${MIME[ext] || "image/jpeg"};base64,${readFileSync(p).toString("base64")}`;
}

async function post(base, path, body) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), reqTimeoutMs);
  try {
    const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const text = await res.text(); // /api/consult streams; reading the whole body == the wizard's pump() loop
    return { status: res.status, text };
  } finally { clearTimeout(t); }
}
const stripFence = (s) => s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
function tryParse(s) { try { return JSON.parse(stripFence(s)); } catch { return null; } }

function collectText(v) { // every string value in the parsed output, lower-cased, for the crude keyword check
  const out = [];
  (function walk(x) { if (typeof x === "string") out.push(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") Object.values(x).forEach(walk); })(v);
  return out.join(" \n ").toLowerCase();
}
function keywordCheck(groups, text) {
  const res = (groups || []).map((g) => ({ any_of: g, hit: g.some((k) => text.includes(k.toLowerCase())) }));
  return { groups: res, all_hit: res.length ? res.every((r) => r.hit) : null };
}

async function runItem(base, it) {
  const t0 = Date.now();
  let path, body;
  if (it.type === "text") { path = "/api/consult"; body = it.consult_request; }
  else { path = "/api/analyze-image"; body = { image: dataURL(it.file), type: it.type }; }
  const rec = { id: it.id, type: it.type, label, endpoint: path, started_at: new Date(t0).toISOString(), attempts: [], ai, db: dbMode };
  let final = null;
  for (let a = 1; a <= 5; a++) {
    const ta = Date.now();
    let r;
    try { r = await post(base, path, body); } catch (e) { r = { status: 0, text: "", err: String(e.message || e) }; }
    const parsed = r.status === 200 ? tryParse(r.text) : null;
    rec.attempts.push({ n: a, status: r.status, ms: Date.now() - ta, bytes: r.text.length, err: r.err || (r.status && r.status !== 200 ? r.text.slice(0, 200) : undefined), json_ok: parsed !== null });
    final = { ...r, parsed };
    if (r.status === 200 && parsed !== null) break;
    if (r.status === 429) { await sleep(Math.min(60000, 5000 * 2 ** (a - 1))); continue; }       // rate limited: back off
    if (r.status >= 500 || r.status === 0 || (r.status === 200 && parsed === null)) { await sleep(1500 * a); continue; } // transient / malformed JSON (wizard retries too)
    break; // 4xx other than 429: deterministic, do not retry
  }
  rec.status = final.status; rec.ms = Date.now() - t0;
  rec.raw = final.text; rec.parsed = final.parsed;
  rec.ok = final.status === 200 && final.parsed !== null;
  rec.request_summary = it.type === "text" ? { ...body, data: { ...body.data } } : { type: it.type, image_file: it.file, image_bytes: body.image.length };
  rec.expected = { documented_condition: it.documented_condition, intended_complexion: it.intended_complexion, expected_tcm: it.expected_tcm, source_pattern: it.source_pattern, source_url: it.source_url || it.source_page, ground_truth_strength: it.ground_truth_strength };
  rec.keyword_check = rec.ok ? keywordCheck(it.expect_keyword_groups, collectText(final.parsed)) : null;
  writeFileSync(join(outDir, it.id + ".json"), JSON.stringify(rec, null, 2));
  const kc = rec.keyword_check ? (rec.keyword_check.all_hit === null ? "n/a" : rec.keyword_check.all_hit ? "kw-hit" : "kw-MISS") : "-";
  console.error(`${rec.ok ? "OK  " : "FAIL"} ${it.id.padEnd(10)} ${String(rec.status).padEnd(3)} ${(rec.ms / 1000).toFixed(1).padStart(6)}s tries=${rec.attempts.length} ${kc}`);
  return rec;
}

async function main() {
  const tStart = Date.now();
  let stack = null, base = extBase;
  if (!base) {
    const { startStack } = await import(pathToFileURL(resolve(HERE, "..", "stack.mjs")).href);
    try { stack = await startStack({ ai, db: dbMode, build: !noBuild }); }
    catch (e) { console.error("BLOCKED: stack did not start (" + ai + "/" + dbMode + "): " + String(e.message).slice(0, 600)); process.exit(3); }
    base = stack.base;
    console.error(`stack up: ${base} ai=${ai} db=${dbMode} offset=${process.env.ACI_PORT_OFFSET} pids=${JSON.stringify(stack.pids)}`);
  }
  const results = [];
  try {
    const queue = items.slice();
    await Promise.all(Array.from({ length: conc }, async () => { while (queue.length) { const it = queue.shift(); results.push(await runItem(base, it)); } }));
  } finally { if (stack) await stack.stop(); }
  results.sort((a, b) => a.id.localeCompare(b.id));
  const sum = {
    label, ai, db: dbMode, port_offset: process.env.ACI_PORT_OFFSET, concurrency: conc, started_at: new Date(tStart).toISOString(), wall_seconds: Math.round((Date.now() - tStart) / 1000),
    selected: items.length, ok: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).map((r) => ({ id: r.id, status: r.status, err: r.attempts.at(-1)?.err })),
    by_type: Object.fromEntries(["tongue", "face", "text"].map((t) => [t, { n: results.filter((r) => r.type === t).length, ok: results.filter((r) => r.type === t && r.ok).length, kw_all_hit: results.filter((r) => r.type === t && r.keyword_check?.all_hit === true).length, kw_miss: results.filter((r) => r.type === t && r.keyword_check?.all_hit === false).map((r) => r.id) }])),
    note: "keyword hits are a crude lexical signal against literature-derived expectations; read the raw JSONs before drawing conclusions.",
  };
  writeFileSync(join(outDir, "_summary.json"), JSON.stringify(sum, null, 2));
  console.log(JSON.stringify(sum, null, 2));
  process.exit(sum.failed.length ? 1 : 0);
}
import { pathToFileURL } from "node:url";
main();
