#!/usr/bin/env node
/**
 * sihat-listener — always-on bridge from the Sihat TCM app to the Claude models
 * running on THIS PC (the `claude` CLI: opus / sonnet / haiku). It replaces the
 * Gemini API: it speaks Google's generateContent REST shape, so the Go server
 * only needs  AI_BASE_URL=http://127.0.0.1:8788/v1beta/models  (no other change).
 *
 *   node sihat-listener/listener.mjs            # serve (default port 8788)
 *   node sihat-listener/listener.mjs --selftest # start, call once per tier, exit
 *
 * Endpoints
 *   POST /v1beta/models/{model}:generateContent
 *   POST /v1beta/models/{model}:streamGenerateContent?alt=sse
 *   GET  /healthz   → {ok, tiers, inflight, queued, served, failed}
 *   GET  /stats     → recent request log (model, tier, ms, ok, chars)
 *
 * Tier mapping mirrors the app's model router (internal/gemini/client.go):
 *   gemini-3.5-flash (ModelPro, complex)  → opus
 *   gemini-flash-latest (ModelFlash, std) → sonnet
 *   gemini-3.1-flash-lite (ModelLite)     → haiku
 *   "pc-opus" | "pc-sonnet" | "pc-haiku" or "opus"|"sonnet"|"haiku" → that tier
 *   Every request is also logged to sihat-listener/logs/requests.jsonl.
 *
 * Env: SIHAT_LISTENER_PORT (8788) · SIHAT_LISTENER_CONCURRENCY (3) ·
 *      SIHAT_LISTENER_TIMEOUT_MS (280000; a full consult report is ~19k chars = 60-170s on haiku/sonnet) · SIHAT_LISTENER_TOKEN (optional shared
 *      secret, checked against ?key=) · SIHAT_LISTENER_MODEL_OVERRIDE (force one tier)
 *      SIHAT_LISTENER_FAKE=1 (deterministic canned replies, no model calls — used by
 *      the offline regression suites)
 */
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cannedReply } from "./fake.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.SIHAT_LISTENER_PORT || "8788", 10);
const CONCURRENCY = parseInt(process.env.SIHAT_LISTENER_CONCURRENCY || "3", 10);
const TIMEOUT_MS = parseInt(process.env.SIHAT_LISTENER_TIMEOUT_MS || "280000", 10);
const RETRIES = parseInt(process.env.SIHAT_LISTENER_RETRIES || "1", 10); // stop rule: one retry on timeout/empty, then fail loudly
const TOKEN = process.env.SIHAT_LISTENER_TOKEN || "";
const FORCE = process.env.SIHAT_LISTENER_MODEL_OVERRIDE || "";
const FAKE = process.env.SIHAT_LISTENER_FAKE === "1";
const LOG_DIR = join(__dirname, "logs");
mkdirSync(LOG_DIR, { recursive: true });

const TIERS = ["opus", "sonnet", "haiku"];
export function tierFor(model) {
  if (FORCE && TIERS.includes(FORCE)) return FORCE;
  const m = String(model || "").toLowerCase();
  for (const t of TIERS) if (m === t || m === "pc-" + t || m.includes(t)) return t;
  if (m === "gemini-3.5-flash" || m.includes("pro")) return "opus";
  if (m.includes("lite")) return "haiku";
  return "sonnet"; // gemini-flash-latest and anything unknown
}

/* ------------------------------ concurrency ------------------------------ */
let inflight = 0;
const waiting = [];
const stats = { served: 0, failed: 0, recent: [] };
const abortError = () => Object.assign(new Error("client aborted the request"), { httpStatus: 499, geminiStatus: "CANCELLED", aborted: true });
/** Take a model slot. A waiter whose client has gone away (signal aborted) leaves the queue and never starts a model run. */
function acquire(signal) {
  return new Promise((res, rej) => {
    if (signal?.aborted) return rej(abortError());
    if (inflight < CONCURRENCY) { inflight++; return res(); }
    const onAbort = () => {
      const i = waiting.indexOf(waiter);
      if (i >= 0) waiting.splice(i, 1);
      rej(abortError());
    };
    const waiter = () => { signal?.removeEventListener("abort", onAbort); res(); };
    signal?.addEventListener("abort", onAbort, { once: true });
    waiting.push(waiter);
  });
}
function release() {
  const next = waiting.shift();
  if (next) next(); else inflight--;
}

/* ------------------------------ prompt build ------------------------------ */
/** File extension for an attached part. The client-supplied mimeType is NEVER used as a file name: it used to be split
 *  on "/" and ";" and joined onto the temp dir, so a backslash in it ("image/x\..\..\p.txt") wrote outside that dir. */
const EXT_BY_MIME = {
  "image/png": "png", "image/jpeg": "jpeg", "image/jpg": "jpg", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "image/gif": "gif",
  "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/mp4": "m4a", "audio/aac": "aac",
  "video/webm": "webm", "application/pdf": "pdf",
};
export function extFor(mimeType) {
  const base = String(mimeType || "image/png").toLowerCase().split(";")[0].trim();
  if (!/^[a-z]+\/[a-z0-9.+-]+$/.test(base)) return "bin";
  return EXT_BY_MIME[base] || "bin";
}

function buildPrompt(req, imageDir) {
  const out = [];
  const files = [];
  let n = 0;
  for (const c of req.contents || []) {
    const role = c.role === "model" ? "ASSISTANT" : "USER";
    const parts = [];
    for (const p of c.parts || []) {
      if (p.text) parts.push(p.text);
      else if (p.inlineData && p.inlineData.data) {
        const f = join(imageDir, `img${++n}.${extFor(p.inlineData.mimeType)}`);
        writeFileSync(f, Buffer.from(p.inlineData.data, "base64"));
        files.push(f);
        parts.push(`[An image is attached at ${f} — open it with the Read tool and base your analysis on what it actually shows.]`);
      }
    }
    if (parts.length) out.push((req.contents.length > 1 ? role + ": " : "") + parts.join("\n"));
  }
  let sys = (req.systemInstruction?.parts || []).map((p) => p.text || "").join("\n");
  const gc = req.generationConfig || {};
  if (gc.responseMimeType === "application/json") {
    sys += "\n\nOUTPUT FORMAT: respond with ONE valid JSON value only. No markdown fences, no commentary before or after.";
  }
  if (req.contents && req.contents.length > 1) out.push("ASSISTANT:");
  return { prompt: out.join("\n\n"), system: sys.trim(), files };
}

/* ------------------------------ claude runner ----------------------------- */
/** Kill the whole tree (claude is spawned through a shell on Windows; child.kill() would orphan it). Only OUR pid. */
function killTree(child) {
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true });
    else child.kill("SIGKILL");
  } catch { /* already gone */ }
}

function runClaude(tier, prompt, system, files, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError()); // nobody is waiting any more: do not start a model run
    const work = mkdtempSync(join(tmpdir(), "sihat-l-"));
    const sysFile = join(work, "system.txt");
    writeFileSync(sysFile, system || "You are a careful clinical-support assistant for Traditional Chinese Medicine.");
    const args = ["-p", "--model", tier, "--no-session-persistence", "--disable-slash-commands",
      "--strict-mcp-config", "--system-prompt-file", sysFile];
    if (files.length) args.push("--tools", "Read", "--allowedTools", "Read", "--add-dir", dirname(files[0]));
    else args.push("--tools", '""');
    const child = spawn("claude", args, { cwd: work, shell: true, windowsHide: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { killTree(child); reject(new Error(`timeout after ${TIMEOUT_MS}ms`)); }, TIMEOUT_MS);
    // the client went away (aborted / timed out upstream): kill the model run now instead of letting it burn 60-170 s
    signal?.addEventListener("abort", () => { clearTimeout(timer); killTree(child); reject(abortError()); }, { once: true });
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      try { rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ }
      if (code !== 0 || !stdout.trim()) reject(new Error(`claude exit ${code}: ${(stderr || stdout).slice(0, 300)}`));
      else resolve(stdout.trim());
    });
    child.stdin.end(prompt);
  });
}

/** The end index (exclusive) of the balanced JSON-looking value that starts at s[i] ("{" or "["), honouring strings and
 *  escapes; -1 when it never closes. */
function balancedEnd(s, i) {
  const stack = [];
  let inStr = false;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (inStr) {
      if (c === "\\") k++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") {
      if (stack.pop() !== c) return -1;
      if (!stack.length) return k + 1;
    }
  }
  return -1;
}
const parses = (x) => { try { JSON.parse(x); return true; } catch { return false; } };

/** JSON mode: models love ```json fences and a preamble; the Gemini API would return bare JSON. Returns the first
 *  complete, VALID JSON value in the reply: the bare reply itself, the content of a wrapping fence, or the first
 *  balanced {...}/[...] that parses (so a preamble like "result [see below]:" or a code fence inside a string value
 *  cannot confuse it). Only when the reply holds no valid JSON at all (e.g. it was cut off) does it fall back to
 *  best-effort trimming, so the app can still salvage fields from the fragment. */
export function stripFences(t) {
  t = String(t).trim();
  if ((t.startsWith("{") || t.startsWith("[")) && parses(t)) return t;
  const wrapped = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (wrapped && parses(wrapped[1].trim())) return wrapped[1].trim();
  let tried = 0;
  for (let i = 0; i < t.length && tried < 200; i++) {
    if (t[i] !== "{" && t[i] !== "[") continue;
    tried++;
    const end = balancedEnd(t, i);
    if (end > 0 && parses(t.slice(i, end))) return t.slice(i, end);
  }
  // no complete JSON value anywhere: best effort for a fragment
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) t = m[1];
  t = t.trim();
  if (!t.startsWith("{") && !t.startsWith("[")) { const k = t.search(/[[{]/); if (k > 0) t = t.slice(k); }
  // trailing commentary after the closing brace/bracket ("Hope that helps")
  const last = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (last > 0 && (t.startsWith("{") || t.startsWith("[")) && last < t.length - 1) t = t.slice(0, last + 1);
  return t;
}

/** Split a reply into SSE-sized pieces without ever cutting a surrogate pair (an emoji) in half: the Go client decodes
 *  every event on its own, and a lone surrogate becomes U+FFFD. */
export function chunkText(text, n = 120) {
  const out = [];
  for (let i = 0; i < text.length;) {
    let j = Math.min(i + n, text.length);
    if (j < text.length) {
      const c = text.charCodeAt(j - 1);
      if (c >= 0xd800 && c <= 0xdbff) j = j - 1 > i ? j - 1 : j + 1; // keep the pair together
    }
    out.push(text.slice(i, j));
    i = j;
  }
  return out;
}

async function generate(model, req, signal) {
  const tier = tierFor(model);
  const t0 = Date.now();
  const imageDir = mkdtempSync(join(tmpdir(), "sihat-img-"));
  let acquired = false;
  try {
    const { prompt, system, files } = buildPrompt(req, imageDir);
    await acquire(signal); acquired = true;
    if (signal?.aborted) throw abortError();
    let text;
    if (FAKE) text = cannedReply(prompt, system, req);
    else {
      let lastErr;
      for (let attempt = 0; attempt <= RETRIES && text === undefined; attempt++) {
        try { text = await runClaude(tier, prompt, system, files, signal); } catch (e) {
          lastErr = e;
          if (e.aborted || signal?.aborted) break; // the client is gone: no retry
          if (attempt < RETRIES) process.stderr.write(`[retry ${attempt + 1}] ${tier}: ${e.message}
`);
        }
      }
      if (text === undefined) throw lastErr;
    }
    if (req.generationConfig?.responseMimeType === "application/json") text = stripFences(text);
    record({ model, tier, ms: Date.now() - t0, ok: true, chars: text.length });
    return { text, tier };
  } catch (e) {
    record({ model, tier, ms: Date.now() - t0, ok: false, error: String(e.message || e) });
    throw e;
  } finally {
    if (acquired) release();
    try { rmSync(imageDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

function record(r) {
  r.at = new Date().toISOString();
  r.ok ? stats.served++ : stats.failed++;
  stats.recent.push(r);
  if (stats.recent.length > 50) stats.recent.shift();
  try { appendFileSync(join(LOG_DIR, "requests.jsonl"), JSON.stringify(r) + "\n"); } catch { /* best effort */ }
  process.stderr.write(`[${r.at}] ${r.tier} ${r.ok ? "ok" : "FAIL"} ${r.ms}ms ${r.error || r.chars + "ch"}\n`);
}

/* --------------------------------- server --------------------------------- */
function body(req) {
  return new Promise((res, rej) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 25 << 20) { rej(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => res(Buffer.concat(chunks).toString("utf8")));
    req.on("error", rej);
  });
}
/** Structural validation so malformed bodies are a clean 400, never a crash or a 500 with a leaked temp dir. */
export function validatePayload(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return "request body must be a JSON object";
  if (!Array.isArray(p.contents) || !p.contents.length) return "contents required";
  for (const c of p.contents) {
    if (!c || typeof c !== "object" || !Array.isArray(c.parts)) return "each content needs a parts array";
    for (const part of c.parts) if (!part || typeof part !== "object") return "each part must be an object";
  }
  const si = p.systemInstruction;
  if (si !== undefined && si !== null && (typeof si !== "object" || !Array.isArray(si.parts))) return "systemInstruction.parts must be an array";
  return "";
}
const geminiError = (res, code, msg, status = "INTERNAL") => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { code, message: msg, status } }));
};
const wrap = (text) => ({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP", index: 0 }] });

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, service: "sihat-listener", fake: FAKE, tiers: TIERS, inflight, queued: waiting.length, served: stats.served, failed: stats.failed }));
  }
  if (req.method === "GET" && url.pathname === "/stats") {
    if (TOKEN && url.searchParams.get("key") !== TOKEN) return geminiError(res, 403, "bad key", "PERMISSION_DENIED");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(stats));
  }
  const m = url.pathname.match(/^\/v1beta\/models\/([^/:]+):(generateContent|streamGenerateContent)$/);
  if (req.method !== "POST" || !m) return geminiError(res, 404, "not found", "NOT_FOUND");
  if (TOKEN && url.searchParams.get("key") !== TOKEN) return geminiError(res, 403, "bad key", "PERMISSION_DENIED");
  let payload;
  try { payload = JSON.parse(await body(req)); } catch { return geminiError(res, 400, "invalid JSON body", "INVALID_ARGUMENT"); }
  const bad = validatePayload(payload);
  if (bad) return geminiError(res, 400, bad, "INVALID_ARGUMENT");
  // tie the model run to the client connection: when it closes before the answer is out (app retry, Cloudflare 100 s
  // cut, user navigated away) the queued job is dropped / the running `claude` is killed
  const ac = new AbortController();
  res.on("close", () => { if (!res.writableFinished) ac.abort(); });
  try {
    const { text } = await generate(m[1], payload, ac.signal);
    if (m[2] === "generateContent") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(wrap(text)));
    }
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    for (const piece of chunkText(text)) res.write(`data: ${JSON.stringify(wrap(piece))}\r\n\r\n`);
    res.end();
  } catch (e) {
    if (e.aborted) { if (!res.writableEnded) res.destroy(); }
    else if (!res.headersSent) geminiError(res, e.httpStatus || 500, String(e.message || e), e.geminiStatus || "INTERNAL");
    else res.end();
  }
});

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("listener.mjs")) {
  const selftest = process.argv.includes("--selftest");
  server.listen(PORT, "127.0.0.1", async () => {
    process.stderr.write(`sihat-listener on http://127.0.0.1:${PORT}/v1beta/models  (fake=${FAKE}, concurrency=${CONCURRENCY})\n`);
    if (!selftest) return;
    let bad = 0;
    for (const model of ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"]) {
      const r = await fetch(`http://127.0.0.1:${PORT}/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with exactly: pong" }] }] }),
      });
      const j = await r.json();
      const t = j.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(j).slice(0, 120);
      process.stderr.write(`${model} → ${tierFor(model)}: ${t.slice(0, 60)}\n`);
      if (!r.ok) bad++;
    }
    server.close(); process.exit(bad ? 1 : 0);
  });
}
