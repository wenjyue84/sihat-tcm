/**
 * listener.mjs — regression suite for sihat-listener (the Gemini-shaped bridge to local Claude models).
 * Self-contained (needs: none): the main server runs in-process in FAKE mode on an ephemeral port;
 * token / tmpdir-leak / crash / non-fake (stub `claude`) behaviour is tested in tracked child processes
 * that are killed by PID only. The Go-client contract part runs only when t.stack exists.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import net from "node:net";

const here = dirname(fileURLToPath(import.meta.url));
const LISTENER = join(here, "..", "..", "sihat-listener", "listener.mjs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function call(base, path, opts = {}) {
  if (opts && opts.contents) opts = { body: opts }; // allow passing a request payload directly
  const { method = "POST", body, raw, headers = {} } = opts;
  try {
    const hasBody = body !== undefined || raw !== undefined;
    const res = await fetch(base + path, {
      method,
      headers: hasBody ? { "Content-Type": "application/json", ...headers } : headers,
      body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, headers: res.headers, text, json };
  } catch (e) {
    return { status: 0, error: String(e?.cause?.code || e?.message || e), text: "", json: null, headers: new Headers() };
  }
}
const gc = (text, extra = {}) => ({ contents: [{ role: "user", parts: [{ text }] }], ...extra });
const textOf = (j) => j?.candidates?.[0]?.content?.parts?.[0]?.text;
const GEN = (m) => `/v1beta/models/${m}:generateContent`;
const STREAM = (m) => `/v1beta/models/${m}:streamGenerateContent?alt=sse`;
const REPORT_REQ = (extra = {}) => gc("basic_info wen_inquiry fatigue headache", { generationConfig: { responseMimeType: "application/json" }, ...extra });
const parseSSE = (text) => text.split(/\r?\n\r?\n/).filter((s) => s.trim()).map((ev) => {
  const line = ev.split(/\r?\n/).find((l) => l.startsWith("data: "));
  try { return line ? JSON.parse(line.slice(6)) : null; } catch { return null; }
});
const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); s.on("error", rej); });
const statsOf = async (base, key = "") => (await call(base, "/stats" + (key ? "?key=" + key : ""), { method: "GET" })).json || { recent: [] };
const healthOf = async (base) => (await call(base, "/healthz", { method: "GET" })).json || {};

async function startChild(env, base) {
  const port = await freePort();
  const childEnv = { ...process.env, SIHAT_LISTENER_PORT: String(port), ...env };
  for (const k of Object.keys(childEnv)) if (childEnv[k] === undefined) delete childEnv[k];
  const child = spawn(process.execPath, [LISTENER], { env: childEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let tail = ""; const keep = (d) => { tail = (tail + d).slice(-800); };
  child.stdout.on("data", keep); child.stderr.on("data", keep);
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    const r = await call(url, "/healthz", { method: "GET" });
    if (r.status === 200) return { child, url, tail: () => tail };
    await sleep(150);
  }
  try { child.kill(); } catch { /* gone */ }
  throw new Error("child listener did not start: " + tail);
}

function makeStub(dir) {
  const stub = join(dir, "stub.mjs");
  writeFileSync(stub, `
import fs from "node:fs";
const args = process.argv.slice(2);
let input = ""; process.stdin.setEncoding("utf8");
for await (const c of process.stdin) input += c;
const t0 = Date.now();
const sf = args[args.indexOf("--system-prompt-file") + 1];
let system = ""; try { system = fs.readFileSync(sf, "utf8"); } catch {}
const images = [...input.matchAll(/attached at (.+?) —/g)].map((m) => { let size = -1; try { size = fs.statSync(m[1]).size; } catch {} return { path: m[1], size }; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rec = (phase) => fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ phase, pid: process.pid, t0, t1: Date.now(), args, input, system, images }) + "\\n");
rec("start");
if (input.includes("STUBSLOW")) await sleep(700);
if (input.includes("STUBHANG")) await sleep(60000);
rec("end");
if (input.includes("STUBFAIL")) { process.stderr.write("stub boom"); process.exit(1); }
if (input.includes("STUBEMPTY")) process.exit(0);
if (input.includes("STUBFENCE")) { process.stdout.write('Sure, here you go:\\n\`\`\`json\\n{"a":{"b":1}}\\n\`\`\`\\nDone.'); process.exit(0); }
process.stdout.write("pong");
`);
  writeFileSync(join(dir, "claude.cmd"), `@echo off\r\n"${process.execPath}" "%~dp0stub.mjs" %*\r\n`);
  const sh = join(dir, "claude");
  writeFileSync(sh, `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/stub.mjs" "$@"\n`);
  try { chmodSync(sh, 0o755); } catch { /* windows */ }
}
const readLog = (p) => (existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
// Windows recycles PIDs quickly, so "a process with this pid exists" is not "OUR stub still runs": also require it to be a node.exe.
const alive = (pid) => {
  try { process.kill(pid, 0); } catch { return false; }
  if (process.platform !== "win32") return true;
  const r = spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], { encoding: "utf8", windowsHide: true });
  return /node\.exe/i.test(r.stdout || "");
};

export default {
  name: "listener", needs: "none", mutating: false, costly: false,
  doc: "sihat-listener: Gemini wire shape (JSON+SSE), tier mapping, stripFences, errors, fault hooks, concurrency, images/tmp cleanup, body limit, token, Go-client wiring",
  async run(t) {
    const root = mkdtempSync(join(tmpdir(), "sihat-lsuite-"));
    const children = [];
    let server = null;
    const saved = {};
    const KEYS = ["SIHAT_LISTENER_FAKE", "SIHAT_LISTENER_CONCURRENCY", "SIHAT_LISTENER_TOKEN", "SIHAT_LISTENER_MODEL_OVERRIDE", "SIHAT_LISTENER_TIMEOUT_MS", "SIHAT_LISTENER_RETRIES", "SIHAT_LISTENER_PORT"];
    try {
      /* ---------- in-process server (FAKE, concurrency 2) ---------- */
      for (const k of KEYS) saved[k] = process.env[k];
      Object.assign(process.env, { SIHAT_LISTENER_FAKE: "1", SIHAT_LISTENER_CONCURRENCY: "2" });
      delete process.env.SIHAT_LISTENER_TOKEN; delete process.env.SIHAT_LISTENER_MODEL_OVERRIDE;
      const mod = await import(pathToFileURL(LISTENER).href + "?suite=" + Date.now() + Math.random().toString(36).slice(2));
      for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
      server = mod.server;
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      const B = `http://127.0.0.1:${server.address().port}`;
      const { tierFor, stripFences } = mod;

      /* ---------- wire shape: generateContent ---------- */
      const g = await call(B, GEN("gemini-flash-latest"), { body: gc("hello there") });
      t.check("gen_status_200", g.status === 200, `status=${g.status} ${g.text.slice(0, 100)}`);
      t.check("gen_content_type_json", (g.headers.get("content-type") || "").includes("application/json"), g.headers.get("content-type"));
      const cand = g.json?.candidates?.[0];
      t.check("gen_candidate_shape", cand?.content?.role === "model" && Array.isArray(cand?.content?.parts) && typeof cand.content.parts[0]?.text === "string" && cand.content.parts[0].text.length > 10, JSON.stringify(g.json).slice(0, 160));
      t.check("gen_finish_reason_stop", cand?.finishReason === "STOP", `finishReason=${cand?.finishReason}`);
      const rep = await call(B, GEN("gemini-3.5-flash"), REPORT_REQ());
      let repObj = null; try { repObj = JSON.parse(textOf(rep.json)); } catch { /* checked below */ }
      t.check("json_mode_report_parses", !!repObj?.diagnosis?.primary_pattern, `text=${String(textOf(rep.json)).slice(0, 80)}`);
      const generic = await call(B, GEN("gemini-flash-latest"), gc("anything", { generationConfig: { responseMimeType: "application/json" } }));
      let gobj = null; try { gobj = JSON.parse(textOf(generic.json)); } catch { /* below */ }
      t.check("json_mode_generic_parses", gobj && typeof gobj === "object", `text=${String(textOf(generic.json)).slice(0, 80)}`);
      const multi = await call(B, GEN("gemini-flash-latest"), { contents: [{ role: "user", parts: [{ text: "a" }] }, { role: "model", parts: [{ text: "b" }] }, { role: "user", parts: [{ text: "c" }] }], systemInstruction: { parts: [{ text: "be brief" }] } });
      t.check("multi_turn_with_system_200", multi.status === 200 && textOf(multi.json)?.length > 0, `status=${multi.status}`);
      const sysOnly = await call(B, GEN("gemini-flash-latest"), gc("hi", { systemInstruction: { parts: [{ text: "primary_pattern" }] } }));
      t.check("system_instruction_is_seen", sysOnly.status === 200 && /primary_pattern/.test(textOf(sysOnly.json) || ""), "system text not used by canned reply path");

      /* ---------- wire shape: streaming SSE ---------- */
      const sFull = await call(B, STREAM("gemini-3.5-flash"), REPORT_REQ());
      const evs = parseSSE(sFull.text);
      t.check("stream_status_and_type", sFull.status === 200 && (sFull.headers.get("content-type") || "").includes("text/event-stream"), `status=${sFull.status} ct=${sFull.headers.get("content-type")}`);
      t.check("stream_events_parse_to_wire_shape", evs.length > 1 && evs.every((e) => e?.candidates?.[0]?.content?.role === "model" && typeof e.candidates[0].content.parts?.[0]?.text === "string"), `events=${evs.length} nulls=${evs.filter((e) => !e).length}`);
      const joined = evs.map((e) => e?.candidates?.[0]?.content?.parts?.[0]?.text || "").join("");
      t.check("stream_concat_equals_nonstream", joined === textOf(rep.json) && joined.length > 0, `stream=${joined.length}ch nonstream=${String(textOf(rep.json)).length}ch`);
      t.check("stream_chunks_bounded_120", evs.every((e) => (e?.candidates?.[0]?.content?.parts?.[0]?.text || "").length <= 120) && evs.length === Math.ceil(joined.length / 120), `events=${evs.length} len=${joined.length}`);
      t.check("stream_ends_cleanly", sFull.text.endsWith("\r\n\r\n") && sFull.text.startsWith("data: ") && !/\[DONE\]/.test(sFull.text), `tail=${JSON.stringify(sFull.text.slice(-12))}`);
      t.check("stream_reassembled_json_valid", (() => { try { return !!JSON.parse(joined).diagnosis; } catch { return false; } })(), "concatenated stream is not the report JSON");
      const sShort = await call(B, STREAM("gemini-flash-latest"), gc("hi"));
      const shortLen = (textOf((await call(B, GEN("gemini-flash-latest"), gc("hi"))).json) || "").length;
      t.check("stream_short_reply_event_count", parseSSE(sShort.text).length === Math.ceil(shortLen / 120), `events=${parseSSE(sShort.text).length} len=${shortLen}`);
      const sBad = await call(B, STREAM("gemini-flash-latest"), { raw: "{nope" });
      t.check("stream_bad_json_is_json_400", sBad.status === 400 && (sBad.headers.get("content-type") || "").includes("application/json"), `status=${sBad.status} ct=${sBad.headers.get("content-type")}`);

      /* ---------- tierFor ---------- */
      const tiers = {
        "gemini-flash-latest": "sonnet", "gemini-3.5-flash": "opus", "gemini-3.1-flash-lite": "haiku",
        "pc-opus": "opus", "pc-sonnet": "sonnet", "pc-haiku": "haiku", opus: "opus", sonnet: "sonnet", haiku: "haiku",
        "gemini-2.5-pro": "opus", "gemini-1.5-pro": "opus", "gemini-2.5-flash-lite": "haiku", "gemini-2.0-flash": "sonnet", "gemini-2.5-flash": "sonnet",
        "OPUS": "opus", "claude-haiku-4": "haiku", "totally-unknown": "sonnet", "": "sonnet",
      };
      const badTier = Object.entries(tiers).filter(([m, w]) => tierFor(m) !== w).map(([m, w]) => `${m || "(empty)"}->${tierFor(m)} want ${w}`);
      t.check("tier_mapping_table", badTier.length === 0, badTier.join("; "));
      t.check("tier_go_constants", tierFor("gemini-flash-latest") === "sonnet" && tierFor("gemini-3.5-flash") === "opus" && tierFor("gemini-3.1-flash-lite") === "haiku", "Go client ModelFlash/Pro/Lite do not map to sonnet/opus/haiku");
      t.check("tier_null_undefined_safe", tierFor(undefined) === "sonnet" && tierFor(null) === "sonnet", `undefined->${tierFor(undefined)} null->${tierFor(null)}`);
      const seen = [];
      for (const m of ["gemini-3.5-flash", "gemini-3.1-flash-lite", "pc-haiku"]) {
        await call(B, GEN(m), gc("tier probe"));
        const rec = (await statsOf(B)).recent.at(-1);
        seen.push(`${m}:${rec?.model}/${rec?.tier}`);
      }
      t.check("stats_records_tier_per_request", seen.join(",") === "gemini-3.5-flash:gemini-3.5-flash/opus,gemini-3.1-flash-lite:gemini-3.1-flash-lite/haiku,pc-haiku:pc-haiku/haiku", seen.join(","));

      /* ---------- stripFences ---------- */
      const sf = [
        ["fenced_json", "```json\n{\"a\":1}\n```", '{"a":1}'],
        ["fenced_bare", "```\n[1,2]\n```", "[1,2]"],
        ["fenced_upper", "```JSON\n{\"a\":1}\n```", '{"a":1}'],
        ["preamble_and_fence", "Here is the result:\n```json\n{\"a\":{\"b\":{\"c\":1}}}\n```\nHope that helps", '{"a":{"b":{"c":1}}}'],
        ["preamble_no_fence", "Sure! {\"a\":1}", '{"a":1}'],
        ["preamble_array", "Result: [1,2,3]", "[1,2,3]"],
        ["already_bare", '{"a":1}', '{"a":1}'],
        ["bare_whitespace_trimmed", '  \n{"a":[1,{"b":2}]}\n ', '{"a":[1,{"b":2}]}'],
      ];
      for (const [name, input, want] of sf) {
        let got; try { got = stripFences(input); } catch (e) { got = "THROW " + e.message; }
        t.check("strip_" + name, got === want, `want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
      }
      t.check("strip_result_parses", (() => { try { JSON.parse(stripFences("```json\n{\"x\":{\"y\":[1,2]}}\n```")); return true; } catch { return false; } })(), "fenced JSON is not parseable after stripFences");

      /* ---------- errors & routes ---------- */
      const ij = await call(B, GEN("gemini-flash-latest"), { raw: "{not json" });
      t.check("invalid_json_400", ij.status === 400 && ij.json?.error?.code === 400 && ij.json.error.status === "INVALID_ARGUMENT" && !!ij.json.error.message, `status=${ij.status} ${ij.text.slice(0, 100)}`);
      for (const [name, body] of [["missing_contents", {}], ["empty_contents", { contents: [] }], ["contents_not_array", { contents: "x" }]]) {
        const r = await call(B, GEN("gemini-flash-latest"), { body });
        t.check(name + "_400", r.status === 400 && r.json?.error?.status === "INVALID_ARGUMENT", `status=${r.status} ${r.text.slice(0, 80)}`);
      }
      const nf = await call(B, "/v1beta/models/x:bogusMethod", { body: gc("x") });
      t.check("wrong_path_404", nf.status === 404 && nf.json?.error?.status === "NOT_FOUND" && nf.json.error.code === 404, `status=${nf.status} ${nf.text.slice(0, 80)}`);
      const gg = await call(B, GEN("gemini-flash-latest"), { method: "GET" });
      t.check("get_on_generate_404", gg.status === 404, `status=${gg.status}`);
      const ph = await call(B, "/healthz", { body: {} });
      t.check("post_healthz_404", ph.status === 404, `status=${ph.status}`);

      /* ---------- healthz / stats ---------- */
      const h0 = await healthOf(B);
      t.check("healthz_shape", h0.ok === true && h0.service === "sihat-listener" && h0.fake === true && JSON.stringify(h0.tiers) === '["opus","sonnet","haiku"]' && ["inflight", "queued", "served", "failed"].every((k) => typeof h0[k] === "number"), JSON.stringify(h0));
      await call(B, GEN("gemini-flash-latest"), gc("count me"));
      const h1 = await healthOf(B);
      t.check("healthz_served_increments", h1.served === h0.served + 1 && h1.failed === h0.failed, `served ${h0.served}->${h1.served} failed ${h0.failed}->${h1.failed}`);
      for (let i = 0; i < 60; i++) await call(B, GEN("ring-" + i), gc("ring"));
      const st = await statsOf(B);
      t.check("stats_ring_buffer_50", st.recent.length === 50 && st.recent.at(-1).model === "ring-59" && st.recent.at(-5).model === "ring-55", `len=${st.recent.length} last=${st.recent.at(-1)?.model}`);
      const e0 = st.recent.at(-1);
      t.check("stats_entry_fields", typeof e0.model === "string" && typeof e0.tier === "string" && typeof e0.ms === "number" && e0.ok === true && typeof e0.chars === "number" && !Number.isNaN(Date.parse(e0.at)), JSON.stringify(e0));
      t.check("stats_totals_match", st.served >= 60 && typeof st.failed === "number", JSON.stringify({ served: st.served, failed: st.failed }));

      /* ---------- fault hooks ---------- */
      const failsBefore = (await healthOf(B)).failed;
      const f500 = await call(B, GEN("gemini-flash-latest"), gc("please __FAIL_500__ now"));
      t.check("fault_500_status", f500.status === 500, `status=${f500.status} ${f500.text.slice(0, 80)}`);
      t.check("fault_500_gemini_body", f500.json?.error?.code === 500 && typeof f500.json.error.message === "string" && f500.json.error.message.length > 0 && f500.json.error.status === "INTERNAL", f500.text.slice(0, 120));
      const f429 = await call(B, GEN("gemini-flash-latest"), gc("__FAIL_429__"));
      t.check("fault_429_resource_exhausted", f429.status === 429 && f429.json?.error?.code === 429 && f429.json.error.status === "RESOURCE_EXHAUSTED", `status=${f429.status} ${f429.text.slice(0, 100)}`);
      const f500multi = await call(B, GEN("gemini-flash-latest"), { contents: [{ role: "user", parts: [{ text: "__FAIL_500__" }] }, { role: "model", parts: [{ text: "ok" }] }, { role: "user", parts: [{ text: "again" }] }] });
      t.check("fault_hook_in_earlier_turn", f500multi.status === 500, `status=${f500multi.status}`);
      const fs500 = await call(B, STREAM("gemini-flash-latest"), gc("__FAIL_500__"));
      t.check("fault_500_stream_json_error", fs500.status === 500 && (fs500.headers.get("content-type") || "").includes("application/json") && fs500.json?.error?.status === "INTERNAL", `status=${fs500.status} ct=${fs500.headers.get("content-type")}`);
      const fs429 = await call(B, STREAM("gemini-flash-latest"), gc("__FAIL_429__"));
      t.check("fault_429_stream", fs429.status === 429 && fs429.json?.error?.status === "RESOURCE_EXHAUSTED", `status=${fs429.status} ${fs429.text.slice(0, 80)}`);
      const h2 = await healthOf(B);
      const last = (await statsOf(B)).recent.at(-1);
      t.check("fault_counted_as_failed", h2.failed >= failsBefore + 4 && last?.ok === false && !!last.error, `failed ${failsBefore}->${h2.failed} last=${JSON.stringify(last)}`);
      await Promise.all([1, 2, 3, 4, 5].map(() => call(B, GEN("gemini-flash-latest"), gc("__FAIL_500__"))));
      const afterFail = await call(B, GEN("gemini-flash-latest"), gc("still alive?"));
      const h3 = await healthOf(B);
      t.check("fault_releases_slots", afterFail.status === 200 && h3.inflight === 0 && h3.queued === 0, `status=${afterFail.status} inflight=${h3.inflight} queued=${h3.queued}`);
      const emp = await call(B, GEN("gemini-flash-latest"), gc("__EMPTY__"));
      const empText = textOf(emp.json);
      t.check("fault_empty_reply", emp.status === 200 && (empText === "" || empText === undefined) && !/fake-listener reply/.test(emp.text), `status=${emp.status} text=${String(empText).slice(0, 60)}`);
      const gar = await call(B, GEN("gemini-flash-latest"), gc("__GARBAGE_JSON__", { generationConfig: { responseMimeType: "application/json" } }));
      let garParsed = true; try { JSON.parse(textOf(gar.json)); } catch { garParsed = false; }
      t.check("fault_garbage_json_unparseable", gar.status === 200 && typeof textOf(gar.json) === "string" && textOf(gar.json).length > 0 && garParsed === false, `status=${gar.status} text=${String(textOf(gar.json)).slice(0, 60)}`);

      /* ---------- concurrency burst (in-process, fake) ---------- */
      const sBefore = await healthOf(B);
      const burst = await Promise.all(Array.from({ length: 16 }, (_, i) => call(B, i % 2 ? STREAM("gemini-flash-latest") : GEN("gemini-3.5-flash"), gc("burst " + i))));
      const sAfter = await healthOf(B);
      t.check("burst_all_ok", burst.every((r) => r.status === 200), burst.map((r) => r.status).join(","));
      t.check("burst_no_slot_leak", sAfter.inflight === 0 && sAfter.queued === 0 && sAfter.served === sBefore.served + 16, `inflight=${sAfter.inflight} queued=${sAfter.queued} served ${sBefore.served}->${sAfter.served}`);

      /* ---------- inline images (accepted) ---------- */
      const imgReq = (mime, data = PNG) => ({ contents: [{ role: "user", parts: [{ text: "look" }, { inlineData: { mimeType: mime, data } }] }] });
      const im1 = await call(B, GEN("gemini-flash-latest"), imgReq("image/png"));
      const im2 = await call(B, GEN("gemini-flash-latest"), imgReq("image/jpeg"));
      const im3 = await call(B, GEN("gemini-flash-latest"), { contents: [{ role: "user", parts: [{ inlineData: { data: PNG } }] }] });
      t.check("inline_image_accepted", im1.status === 200 && im2.status === 200 && im3.status === 200 && typeof textOf(im1.json) === "string", `${im1.status}/${im2.status}/${im3.status}`);
      const imS = await call(B, STREAM("gemini-flash-latest"), imgReq("image/png;base64"));
      t.check("inline_image_stream_accepted", imS.status === 200 && parseSSE(imS.text).length >= 1, `status=${imS.status}`);

      /* ---------- body size limit ---------- */
      const big = "x".repeat(24 * 1024 * 1024);
      const okBig = await call(B, GEN("gemini-flash-latest"), { raw: JSON.stringify(gc(big)) });
      t.check("body_24mb_accepted", okBig.status === 200, `status=${okBig.status} ${okBig.error || ""}`);
      const huge = "x".repeat(26 * 1024 * 1024);
      const tooBig = await call(B, GEN("gemini-flash-latest"), { raw: JSON.stringify(gc(huge)) });
      t.check("body_26mb_rejected", tooBig.status !== 200, `status=${tooBig.status}`);
      const hAfter = await call(B, "/healthz", { method: "GET" });
      t.check("alive_after_oversize", hAfter.status === 200 && hAfter.json?.ok === true, `status=${hAfter.status}`);

      /* ---------- token (child) ---------- */
      const tok = await startChild({ SIHAT_LISTENER_FAKE: "1", SIHAT_LISTENER_TOKEN: "k", SIHAT_LISTENER_MODEL_OVERRIDE: "bogus", SIHAT_LISTENER_CONCURRENCY: undefined }); children.push(tok.child);
      const T = tok.url;
      const nokey = await call(T, GEN("gemini-flash-latest"), { body: gc("x") });
      t.check("token_missing_403", nokey.status === 403 && nokey.json?.error?.status === "PERMISSION_DENIED" && nokey.json.error.code === 403, `status=${nokey.status} ${nokey.text.slice(0, 80)}`);
      const wrong = await call(T, GEN("gemini-flash-latest") + "?key=nope", { body: gc("x") });
      const emptyKey = await call(T, GEN("gemini-flash-latest") + "?key=", { body: gc("x") });
      t.check("token_wrong_or_empty_403", wrong.status === 403 && emptyKey.status === 403, `${wrong.status}/${emptyKey.status}`);
      const good = await call(T, GEN("gemini-flash-latest") + "?key=k", { body: gc("x") });
      t.check("token_correct_200", good.status === 200 && typeof textOf(good.json) === "string", `status=${good.status}`);
      const goodS = await call(T, "/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=k", { body: gc("x") });
      const badS = await call(T, STREAM("gemini-flash-latest") + "&key=zzz", { body: gc("x") });
      t.check("token_applies_to_stream", goodS.status === 200 && badS.status === 403, `${goodS.status}/${badS.status}`);
      const authFirst = await call(T, GEN("gemini-flash-latest"), { raw: "{bad" });
      t.check("token_checked_before_body", authFirst.status === 403, `status=${authFirst.status} (bad key + bad body should be 403)`);
      t.check("token_stats_requires_key", (await call(T, "/stats", { method: "GET" })).status === 403, "stats exposes request metadata without the key")
      t.check("token_healthz_open", (await call(T, "/healthz", { method: "GET" })).status === 200, "healthz requires key");
      await call(T, GEN("gemini-3.5-flash") + "?key=k", { body: gc("x") });
      t.check("invalid_override_ignored", (await statsOf(T, "k")).recent?.at(-1)?.tier === "opus", `tier=${(await statsOf(T, "k")).recent?.at(-1)?.tier}`);

      /* ---------- private-tmp child: override, image temp cleanup, malformed input ---------- */
      const tmpC = join(root, "tmpC"); mkdirSync(tmpC);
      const cc = await startChild({ SIHAT_LISTENER_FAKE: "1", SIHAT_LISTENER_MODEL_OVERRIDE: "haiku", TEMP: tmpC, TMP: tmpC, TMPDIR: tmpC }); children.push(cc.child);
      const C = cc.url;
      await call(C, GEN("gemini-3.5-flash"), gc("x"));
      t.check("model_override_forces_tier", (await statsOf(C)).recent.at(-1)?.tier === "haiku", `tier=${(await statsOf(C)).recent.at(-1)?.tier}`);
      const imgs = [imgReq("image/png"), imgReq("image/jpeg"), imgReq("image/png;charset=x"), { contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/webp", data: PNG } }] }] }, imgReq("image/png", "")];
      const imgRes = [];
      for (const r of imgs) imgRes.push((await call(C, GEN("gemini-flash-latest"), { body: r })).status);
      imgRes.push((await call(C, STREAM("gemini-flash-latest"), { body: imgReq("image/png") })).status);
      t.check("images_variants_200", imgRes.every((s) => s === 200), imgRes.join(","));
      const leaks1 = readdirSync(tmpC).filter((n) => n.startsWith("sihat-img-"));
      t.check("no_sihat_img_dirs_left", leaks1.length === 0, `leftover: ${leaks1.join(",")}`);
      const badContents = await call(C, GEN("gemini-flash-latest"), { body: { contents: [null] } });
      t.check("null_content_item_is_400", badContents.status === 400, `status=${badContents.status} ${badContents.text.slice(0, 100)} (client error reported as ${badContents.status})`);
      const badSys = await call(C, GEN("gemini-flash-latest"), { body: gc("x", { systemInstruction: { parts: "oops" } }) });
      t.check("bad_system_instruction_is_400", badSys.status === 400, `status=${badSys.status}`);
      const leaks2 = readdirSync(tmpC).filter((n) => n.startsWith("sihat-img-"));
      t.check("no_img_dir_leak_on_bad_input", leaks2.length === 0, `leaked temp dirs after malformed requests: ${leaks2.length}`);
      const nul = await call(C, GEN("gemini-flash-latest"), { raw: "null" });
      t.check("json_null_body_is_400", nul.status === 400, `status=${nul.status} ${nul.error || nul.text.slice(0, 80)}`);
      const live = await call(C, "/healthz", { method: "GET" });
      t.check("survives_json_null_body", live.status === 200 && cc.child.exitCode === null, `healthz=${live.status} exit=${cc.child.exitCode} tail=${cc.tail().slice(-160)}`);

      /* ---------- non-fake path via stub `claude` ---------- */
      const stubDir = join(root, "stub"); mkdirSync(stubDir);
      const tmpB = join(root, "tmpB"); mkdirSync(tmpB);
      const logFile = join(root, "stub.log");
      makeStub(stubDir);
      const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "PATH";
      const sb = await startChild({ SIHAT_LISTENER_FAKE: "0", SIHAT_LISTENER_CONCURRENCY: "2", SIHAT_LISTENER_TIMEOUT_MS: "3000", SIHAT_LISTENER_RETRIES: "1", SIHAT_LISTENER_MODEL_OVERRIDE: undefined, SIHAT_LISTENER_TOKEN: undefined, STUB_LOG: logFile, TEMP: tmpB, TMP: tmpB, TMPDIR: tmpB, [pathKey]: stubDir + (process.platform === "win32" ? ";" : ":") + process.env[pathKey] }); children.push(sb.child);
      const S = sb.url;
      const hangP = call(S, GEN("gemini-flash-latest"), { body: gc("STUBHANG") });
      const lastRec = (needle, phase = "end") => readLog(logFile).filter((r) => r.phase === phase && r.input.includes(needle)).at(-1);

      const tierSeen = [];
      for (const m of ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]) {
        const r = await call(S, GEN(m), gc("TIERPROBE " + m));
        const rec = lastRec("TIERPROBE " + m);
        tierSeen.push(`${r.status}:${rec?.args?.[rec.args.indexOf("--model") + 1]}`);
      }
      t.check("stub_model_arg_per_tier", tierSeen.join(",") === "200:opus,200:sonnet,200:haiku", tierSeen.join(","));
      const one = await call(S, GEN("gemini-flash-latest"), gc("SINGLE turn", { systemInstruction: { parts: [{ text: "SYS-A" }, { text: "SYS-B" }] } }));
      const oneRec = lastRec("SINGLE turn");
      t.check("stub_wire_reply_text", one.status === 200 && textOf(one.json) === "pong", `status=${one.status} text=${textOf(one.json)}`);
      t.check("stub_single_turn_prompt_plain", oneRec?.input === "SINGLE turn", JSON.stringify(oneRec?.input));
      t.check("stub_system_parts_joined", oneRec?.system === "SYS-A\nSYS-B", JSON.stringify(oneRec?.system));
      t.check("stub_cli_flags", ["-p", "--no-session-persistence", "--strict-mcp-config", "--disable-slash-commands"].every((f) => oneRec?.args?.includes(f)) && !oneRec.args.includes("Read"), JSON.stringify(oneRec?.args));
      await call(S, GEN("gemini-flash-latest"), { body: { contents: [{ role: "user", parts: [{ text: "MT-a" }] }, { role: "model", parts: [{ text: "MT-b" }] }, { role: "user", parts: [{ text: "MT-c" }] }] } });
      t.check("stub_multi_turn_prompt_format", lastRec("MT-a")?.input === "USER: MT-a\n\nASSISTANT: MT-b\n\nUSER: MT-c\n\nASSISTANT:", JSON.stringify(lastRec("MT-a")?.input));
      await call(S, GEN("gemini-flash-latest"), gc("JSONMODE", { generationConfig: { responseMimeType: "application/json" } }));
      t.check("stub_json_mode_appends_instruction", /ONE valid JSON value/.test(lastRec("JSONMODE")?.system || ""), JSON.stringify(lastRec("JSONMODE")?.system));
      const png = Buffer.from(PNG, "base64");
      const imR = await call(S, GEN("gemini-flash-latest"), { body: { contents: [{ role: "user", parts: [{ text: "IMGPROBE" }, { inlineData: { mimeType: "image/jpeg", data: PNG } }] }] } });
      const imRec = lastRec("IMGPROBE");
      t.check("stub_image_written_before_run", imR.status === 200 && imRec?.images?.length === 1 && imRec.images[0].size === png.length && /\.jpeg$/.test(imRec.images[0].path), JSON.stringify(imRec?.images));
      t.check("stub_image_tools_enabled", ["--tools", "--allowedTools", "--add-dir"].every((f) => imRec?.args?.includes(f)) && imRec.args[imRec.args.indexOf("--tools") + 1] === "Read", JSON.stringify(imRec?.args));
      t.check("stub_image_removed_after", imRec?.images?.[0] && !existsSync(imRec.images[0].path), "image file still on disk after request");
      const fen = await call(S, GEN("gemini-flash-latest"), gc("STUBFENCE", { generationConfig: { responseMimeType: "application/json" } }));
      let fenObj = null; try { fenObj = JSON.parse(textOf(fen.json)); } catch { /* below */ }
      t.check("stub_fenced_json_stripped_e2e", fenObj?.a?.b === 1, `text=${JSON.stringify(textOf(fen.json))}`);
      const fenRaw = await call(S, GEN("gemini-flash-latest"), gc("STUBFENCE"));
      t.check("stub_fences_kept_without_json_mode", /```json/.test(textOf(fenRaw.json) || ""), JSON.stringify(textOf(fenRaw.json)));
      const hang = await hangP; // settle the slow hang request FIRST so its recorded failure cannot land inside the failure-count window below
      const sFailBefore = await healthOf(S);
      const fl = await call(S, GEN("gemini-flash-latest"), gc("STUBFAIL"));
      t.check("stub_failure_500_gemini_body", fl.status === 500 && fl.json?.error?.code === 500 && /claude exit 1/.test(fl.json.error.message || ""), `status=${fl.status} ${fl.text.slice(0, 120)}`);
      t.check("stub_failure_retried_once", readLog(logFile).filter((r) => r.phase === "end" && r.input.includes("STUBFAIL")).length === 2, "expected exactly RETRIES+1 = 2 attempts");
      const emptyR = await call(S, GEN("gemini-flash-latest"), gc("STUBEMPTY"));
      t.check("stub_empty_output_is_error", emptyR.status === 500, `status=${emptyR.status}`);
      const sFailAfter = await healthOf(S);
      t.check("stub_failures_counted", sFailAfter.failed === sFailBefore.failed + 2 && (await statsOf(S)).recent.at(-2)?.ok === false, `failed ${sFailBefore.failed}->${sFailAfter.failed}`);

      t.check("stub_timeout_500", hang.status === 500 && /timeout after 3000ms/.test(hang.json?.error?.message || ""), `status=${hang.status} ${hang.text.slice(0, 120)}`);
      const hangPids = [...new Set(readLog(logFile).filter((r) => r.phase === "start" && r.input.includes("STUBHANG")).map((r) => r.pid))];
      for (let i = 0; i < 40 && hangPids.some(alive); i++) await sleep(250); // taskkill /T can lag under load
      t.check("stub_timeout_retried_and_killed", hangPids.length === 2 && hangPids.every((p) => !alive(p)), `attempts=${hangPids.length} alive=${hangPids.filter(alive).join(",")}`);

      const hs0 = await healthOf(S);
      let maxIn = 0, maxQ = 0, polling = true;
      const poll = (async () => { while (polling) { const h = await healthOf(S); maxIn = Math.max(maxIn, h.inflight || 0); maxQ = Math.max(maxQ, h.queued || 0); await sleep(40); } })();
      const tBurst = Date.now();
      const slow = await Promise.all(Array.from({ length: 6 }, (_, i) => call(S, GEN("gemini-flash-latest"), gc("STUBSLOW " + i))));
      const elapsed = Date.now() - tBurst;
      polling = false; await poll;
      const spans = readLog(logFile).filter((r) => r.phase === "end" && r.input.includes("STUBSLOW"));
      let overlap = 0;
      for (const a of spans) overlap = Math.max(overlap, spans.filter((b) => b.t0 < a.t1 && a.t0 < b.t1).length);
      t.check("limit_all_burst_ok", slow.every((r) => r.status === 200) && spans.length === 6, slow.map((r) => r.status).join(",") + ` spans=${spans.length}`);
      t.check("limit_never_exceeds_2", overlap <= 2 && maxIn <= 2, `max concurrent claude=${overlap} max inflight=${maxIn} spans=${spans.map((s) => (s.t0 - tBurst) + "-" + (s.t1 - tBurst)).join(" ")}`);
      t.check("limit_uses_both_slots", overlap === 2 && maxQ >= 1, `overlap=${overlap} maxQueued=${maxQ}`);
      t.check("limit_burst_serialised_in_waves", elapsed >= 2000, `6x700ms at concurrency 2 took ${elapsed}ms (want >= ~2100)`);
      const hs1 = await healthOf(S);
      t.check("limit_drains_to_zero", hs1.inflight === 0 && hs1.queued === 0 && hs1.served === hs0.served + 6, JSON.stringify(hs1));
      await sleep(300);
      const workLeft = readdirSync(tmpB).filter((n) => n.startsWith("sihat-l-") || n.startsWith("sihat-img-"));
      t.check("claude_workdirs_cleaned", workLeft.length === 0, `leftover temp dirs: ${workLeft.join(",")}`);

      /* ---------- Go client -> listener wiring (needs the hermetic stack) ---------- */
      if (!t.stack) {
        t.skip("go_client_wiring", "no hermetic stack (suite run alone or remote --base)");
      } else {
        const A = t.stack.aiBase, fake = t.stack.ai === "fake";
        const h = () => ({ headers: { "X-Forwarded-For": t.ip() } });
        const since = new Date(Date.now() - 50).toISOString();
        const lh = await healthOf(A);
        t.check("wire_stack_listener_healthy", lh.ok === true && lh.service === "sihat-listener" && lh.fake === fake, JSON.stringify(lh));
        const chat = await t.postJSON("/api/chat", { messages: [{ role: "user", content: "I have a headache" }], language: "en" }, h());
        t.check("wire_chat_200_text", chat.status === 200 && chat.text.trim().length > 20, `status=${chat.status} len=${chat.text.length}`);
        t.check("wire_chat_x_model_used", chat.headers.get("x-model-used") === "gemini-2.0-flash", `X-Model-Used=${chat.headers.get("x-model-used")}`);
        const seenChat = (await statsOf(A)).recent.filter((r) => r.at >= since && r.model === "gemini-flash-latest").at(-1);
        t.check("wire_chat_reached_listener_as_sonnet", seenChat?.ok === true && seenChat.tier === "sonnet", `listener saw ${JSON.stringify(seenChat)} (legacy gemini-2.0-flash should normalise to gemini-flash-latest)`);
        // An ANONYMOUS client can no longer steer the model tier (aiModelChain in handlers_ai.go only honours the cheap flash/lite
        // tiers): asking /api/chat for gemini-2.5-pro must NOT reach the listener's opus tier ...
        const pro = await t.postJSON("/api/chat", { messages: [{ role: "user", content: "hi" }], model: "gemini-2.5-pro", language: "en" }, h());
        const seenProViaChat = (await statsOf(A)).recent.filter((r) => r.at >= since && r.model === "gemini-3.5-flash");
        t.check("wire_anonymous_chat_cannot_pick_pro_model", pro.status === 200 && pro.headers.get("x-model-used") !== "gemini-2.5-pro" && seenProViaChat.length === 0, `status=${pro.status} hdr=${pro.headers.get("x-model-used")} pro-model calls seen by the listener=${seenProViaChat.length} (want 0: an anonymous caller must not force the most expensive model)`);
        // ... while a SERVER-chosen pro-tier call still routes gemini-2.5-pro -> gemini-3.5-flash -> opus: analyze-audio always tries
        // gemini-2.5-pro first (handlers_analysis.go), so it pins the pro-model wiring end to end.
        const sincePro = new Date(Date.now() - 50).toISOString();
        const au = await t.postJSON("/api/analyze-audio", { audio: "data:audio/webm;base64," + Buffer.from("RIFF-wire-probe-audio-bytes").toString("base64") }, h());
        const seenPro = (await statsOf(A)).recent.filter((r) => r.at >= sincePro && r.model === "gemini-3.5-flash").at(-1);
        t.check("wire_pro_model_routes_to_opus", au.status === 200 && seenPro?.tier === "opus", `analyze-audio status=${au.status} listener saw ${JSON.stringify(seenPro)} (server-chosen gemini-2.5-pro must normalise to gemini-3.5-flash and run on the opus tier)`);
        const data = { basic_info: { name: "Wire", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache"] }, wen_inquiry: "Headache and fatigue for a week.", wang_tongue: "Pale tongue, teeth marks.", wang_face: "Pale.", wen_audio: "", qie: { bpm: "72", qualities: ["wiry"] } };
        const con = await t.postJSON("/api/consult", { data, language: "en" }, h());
        const cleaned = con.text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
        let rpt = null; try { rpt = JSON.parse(cleaned); } catch { /* below */ }
        t.check("wire_consult_200", con.status === 200 && con.text.trim().length > 20, `status=${con.status}`);
        if (fake) t.check("wire_consult_sse_reassembled", !!rpt?.diagnosis?.primary_pattern, `head=${cleaned.slice(0, 80)} (multi-chunk SSE must reassemble to the full report)`);
        else t.skip("wire_consult_sse_reassembled", "fake listener only");
        const seenCon = (await statsOf(A)).recent.filter((r) => r.at >= since && r.tier && r.chars > 120).length;
        t.check("wire_consult_reached_listener", seenCon >= 1, "no long reply recorded in listener stats");
        if (fake) {
          const ff = await t.postJSON("/api/chat", { messages: [{ role: "user", content: "hello __FAIL_500__" }], language: "en" }, h());
          t.check("wire_listener_500_surfaces_as_5xx", ff.status >= 500 && !ff.headers.get("x-model-used"), `status=${ff.status} hdr=${ff.headers.get("x-model-used")} body=${ff.text.slice(0, 80)}`);
        } else t.skip("wire_listener_500_surfaces_as_5xx", "fake listener only");
      }
    } finally {
      for (const c of children) { try { if (c.exitCode === null) c.kill(); } catch { /* gone */ } }
      if (server) { try { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); } catch { /* closed */ } }
      for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
      await sleep(200);
      try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort, own temp dir */ }
    }
  },
};
