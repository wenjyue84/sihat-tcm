#!/usr/bin/env node
/**
 * sihat-tcm-go ACI — Agent Computer Interface.
 *
 * A single CLI entry point for LLM agents (and humans) to regression-test the
 * Sihat TCM Go server through structured JSON, never a browser.
 *
 *   node aci.mjs describe            # capability catalog — START HERE
 *   node aci.mjs status              # is the server up? ai/db configured?
 *   node aci.mjs test --suite=all    # run all regression suites (JSON verdict)
 *   node aci.mjs test --suite=chat   # run one suite
 *   node aci.mjs test --base=https://tcm.wenjyue.com   # test a remote target
 *
 * JSON → stdout (agents parse this). Human ✓/✗ progress → stderr.
 * Exit codes: 0 = all pass, 1 = >=1 fail / unreachable, 2 = usage error.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cmd = args[0] || "help";

function flag(name, def) {
  const a = args.find((x) => x.startsWith("--" + name + "="));
  return a ? a.split("=").slice(1).join("=") : def;
}

const ACI_PORT = process.env.ACI_PORT || "8081";
const BASE = flag("base", process.env.ACI_BASE || `http://localhost:${ACI_PORT}`).replace(/\/+$/, "");

const ACCOUNTS = ["patient", "doctor", "admin", "developer"];
const DEMO_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "password123";

/* ---------------------------- tiny utilities ---------------------------- */

const elog = (...a) => process.stderr.write(a.join(" ") + "\n");
const okLine = (l) => elog("  ✓", l);
const failLine = (l, d) => elog("  ✗", l, "—", d);
const skipLine = (l, d) => elog("  ~", l, "(skipped:", d + ")");

function check(label, ok, detail) {
  return { label, ok: !!ok, detail: ok ? "ok" : detail || "failed" };
}
function skip(label, detail) {
  return { label, skipped: true, detail };
}

async function get(path) {
  const r = await fetch(BASE + path, { method: "GET" });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON (page/stream) */ }
  return { status: r.status, text, json };
}
async function postJSON(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* streamed text/plain */ }
  return { status: r.status, text, json };
}

function mockDataURL(name, mime = "image/png") {
  const p = resolve(__dirname, "../sihat-tcm-web/public/" + name);
  if (!existsSync(p)) return null;
  return "data:" + mime + ";base64," + readFileSync(p).toString("base64");
}

/* -------------------------------- suites -------------------------------- */

async function suiteHealth() {
  const out = [];
  const { status, json } = await get("/healthz");
  out.push(check("health.status_200", status === 200, `status=${status} (want 200)`));
  out.push(check("health.ok", json?.status === "ok", `status=${json?.status}`));
  out.push(check("health.ai_configured", json?.ai === true, `ai=${json?.ai}`));
  out.push(check("health.db_configured", json?.db === true, `db=${json?.db}`));
  return out;
}

async function suiteAuth() {
  const out = [];
  for (const role of ACCOUNTS) {
    const { status, json } = await postJSON("/api/auth/login", {
      email: `${role}@sihat.com`,
      password: DEMO_PASSWORD,
    });
    out.push(
      check(
        `auth.login.${role}`,
        status === 200 && json?.success === true && json?.role === role,
        `status=${status} success=${json?.success} role=${json?.role} (want ${role})`
      )
    );
  }
  const bad = await postJSON("/api/auth/login", { email: "patient@sihat.com", password: "wrong-xxxxx" });
  out.push(check("auth.login.bad_password_401", bad.status === 401, `status=${bad.status} (want 401)`));

  const fk = await postJSON("/api/auth/forgot-password", { email: "patient@sihat.com" });
  out.push(check("auth.forgot.known_200", fk.status === 200 && fk.json?.success === true, `status=${fk.status}`));

  const fu = await postJSON("/api/auth/forgot-password", { email: `nobody-${Date.now()}@example.com` });
  out.push(
    check("auth.forgot.unknown_200", fu.status === 200 && fu.json?.success === true, `status=${fu.status} (must be enumeration-safe 200)`)
  );

  const rb = await postJSON("/api/auth/reset-password", { token_hash: `bogus-${Date.now()}`, password: "abcd1234" });
  out.push(check("auth.reset.bad_token_400", rb.status === 400, `status=${rb.status} (want 400)`));
  return out;
}

async function suiteChat() {
  const out = [];
  // Bug #3 regression pin: web wizard sends symptoms as an ARRAY.
  const arr = await postJSON("/api/chat", {
    messages: [{ role: "user", content: "I have a headache and fatigue" }],
    basicInfo: { name: "张伟", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache", "fatigue"] },
    language: "en",
  });
  out.push(check("chat.symptoms_array_200", arr.status === 200, `status=${arr.status} (Bug#3 regression — want 200, not 400)`));
  out.push(check("chat.symptoms_array_nonempty", (arr.text || "").trim().length > 20, `bodylen=${(arr.text || "").trim().length}`));

  // Backward-compat: other callers may still send a plain string.
  const str = await postJSON("/api/chat", {
    messages: [{ role: "user", content: "headache" }],
    basicInfo: { name: "Ann", age: 30, symptoms: "headache" },
    language: "en",
  });
  out.push(check("chat.symptoms_string_200", str.status === 200, `status=${str.status}`));
  return out;
}

async function suiteImage() {
  const out = [];
  const tongue = mockDataURL("mock-tongue.png");
  const face = mockDataURL("mock-face.png");
  if (!tongue || !face) {
    out.push(skip("image.tongue", "mock-tongue.png not found at ../sihat-tcm-web/public"));
    out.push(skip("image.face", "mock-face.png not found at ../sihat-tcm-web/public"));
    return out;
  }
  for (const [type, url] of [["tongue", tongue], ["face", face]]) {
    const { status, json } = await postJSON("/api/analyze-image", { image: url, type });
    const obs = (json?.observation || "").trim();
    const leak = obs.startsWith("{") || obs.includes('"is_valid_image"');
    out.push(check(`image.${type}.status_200`, status === 200, `status=${status}`));
    out.push(
      check(
        `image.${type}.real_observation`,
        obs.length >= 50 && json?.status !== "Analysis pending" && json?.status !== "invalid_image",
        `status=${json?.status} obslen=${obs.length} (Bug#5 regression — want a real observation)`
      )
    );
    out.push(check(`image.${type}.no_raw_json_leak`, !leak, `raw-JSON-leak=${leak}`));
    if (type === "face") {
      const rejected = /not (a|appear to be a clear) tongue|tongue diagnosis .*cannot|MUST be a tongue/i.test(obs);
      out.push(check("image.face.not_rejected_as_tongue", !rejected, `rejected_as_tongue=${rejected} (face must use the face prompt)`));
    }
  }
  return out;
}

async function suiteConsult() {
  const out = [];
  const data = {
    basic_info: { name: "张伟", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache", "fatigue"] },
    wen_inquiry: "Patient reports recurring headache and fatigue for a week; poor sleep.",
    wang_tongue: "Pale, slightly swollen tongue body with teeth marks and a thin white coating.",
    wang_face: "Pale complexion, dark circles under the eyes.",
    wen_audio: "",
    qie: { bpm: "72", qualities: ["wiry"] },
  };
  // Stream a single generation; the client retries once on a bad parse, so the
  // suite mirrors that (up to 3 attempts) rather than flaking on a rare bad JSON.
  let status, text, cleaned = "", rpt = null;
  for (let attempt = 0; attempt < 3 && !rpt; attempt++) {
    ({ status, text } = await postJSON("/api/consult", { data, language: "en" }));
    cleaned = (text || "").replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try { rpt = JSON.parse(cleaned); } catch { rpt = null; }
  }
  out.push(check("consult.status_200", status === 200, `status=${status}`));
  out.push(check("consult.nonempty", (text || "").trim().length > 100, `bodylen=${(text || "").trim().length}`));

  // The frontend JSON.parses this, so pin the actual schema contract the report
  // renderer depends on (mismatch here = "findings.map is not a function" etc.).
  out.push(check("consult.parseable_json", !!rpt, `parseable(<=3 tries)=${!!rpt} head=${cleaned.slice(0, 50)}`));
  if (rpt) {
    const diag = rpt.diagnosis;
    out.push(check("consult.has_diagnosis", !!(diag && (typeof diag === "string" || diag.primary_pattern)), `diagnosis=${typeof diag}`));
    // key_findings MUST be an object (never a bare array) — the render-crash pin.
    const kf = rpt.analysis && rpt.analysis.key_findings;
    out.push(check("consult.key_findings_not_array", kf === undefined || (typeof kf === "object" && !Array.isArray(kf)),
      `key_findings=${Array.isArray(kf) ? "ARRAY (would crash render)" : typeof kf}`));
    const rec = rpt.recommendations || {};
    const recOk = !!(rec.food_therapy || Array.isArray(rec.lifestyle) || Array.isArray(rec.acupoints));
    out.push(check("consult.recommendations_shape", recOk, `rec_keys=${Object.keys(rec).join(",") || "none"}`));
  }
  return out;
}

const SUITES = { health: suiteHealth, auth: suiteAuth, chat: suiteChat, image: suiteImage, consult: suiteConsult };

/* ------------------------------ commands -------------------------------- */

function describe() {
  return {
    name: "sihat-tcm-go ACI",
    app: "Sihat TCM (Go rewrite) — AI-powered TCM 4-examination (四诊合参) diagnostic platform",
    base: BASE,
    commands: {
      describe: "this capability catalog (start here)",
      status: "health snapshot — server reachable? ai/db configured?",
      "test [--suite=all|health|auth|chat|image|consult] [--base=URL]": "run regression suites; JSON verdict to stdout",
    },
    suites: {
      health: "/healthz returns ok + ai/db configured",
      auth: "4-role login + role correctness; bad-password → 401; forgot-password → 200 (enumeration-safe); reset bad-token → 400",
      chat: "/api/chat with symptoms ARRAY returns 200 + streamed text (Bug #3 regression pin)",
      image: "/api/analyze-image tongue+face return a real observation, no raw-JSON leak, face NOT rejected as non-tongue (Bug #5 regression pin)",
      consult: "/api/consult returns a structured TCM diagnosis report",
    },
    exitCodes: { 0: "all pass", 1: ">=1 fail or server unreachable", 2: "usage error" },
    guardrails: [
      "Point --base at a LOCAL server (ACI_PORT, default 8081) during the dev loop; only use --base=https://tcm.wenjyue.com for post-deploy production verification.",
      "Uses shared Supabase demo accounts (patient/doctor/admin/developer@sihat.com / password123) — login only, creates NO rows.",
      "AI suites (chat/image/consult) call real Gemini (free tier) — a full run is ~5 model calls; keep runs modest.",
      "Mock images are read from ../sihat-tcm-web/public/mock-*.png; the image suite is SKIPPED (not failed) if they are absent.",
      "Seed the demo accounts first with scripts/seed-test-accounts.sh if the auth suite fails to log in.",
    ],
  };
}

async function status() {
  try {
    const { status, json } = await get("/healthz");
    return { reachable: status === 200, base: BASE, ...(json || {}) };
  } catch (e) {
    return { reachable: false, base: BASE, error: String(e) };
  }
}

async function runTests() {
  const want = flag("suite", "all");
  const names = want === "all" ? Object.keys(SUITES) : want.split(",").map((s) => s.trim()).filter((n) => SUITES[n]);
  if (!names.length) {
    console.log(JSON.stringify({ ok: false, error: "no such suite", want, available: Object.keys(SUITES) }, null, 2));
    process.exit(2);
  }

  // Reachability preflight.
  try {
    const h = await get("/healthz");
    if (h.status !== 200) {
      console.log(JSON.stringify({ ok: false, error: `server returned ${h.status} at ${BASE}`, passed: 0, failed: 0, total: 0, failures: [] }, null, 2));
      process.exit(1);
    }
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: `server unreachable at ${BASE}`, detail: String(e), passed: 0, failed: 0, total: 0, failures: [] }, null, 2));
    process.exit(1);
  }

  let passed = 0, failed = 0, skipped = 0;
  const failures = [], skippedList = [];
  for (const name of names) {
    elog(`▶ suite ${name}`);
    let results;
    try {
      results = await SUITES[name]();
    } catch (e) {
      results = [{ label: `${name}.suite_error`, ok: false, detail: String(e) }];
    }
    for (const r of results) {
      if (r.skipped) { skipped++; skippedList.push({ label: r.label, detail: r.detail }); skipLine(r.label, r.detail); continue; }
      if (r.ok) { passed++; okLine(r.label); } else { failed++; failures.push({ label: r.label, detail: r.detail }); failLine(r.label, r.detail); }
    }
  }

  const total = passed + failed;
  const verdict = { ok: failed === 0 && total > 0, passed, failed, total, skipped, failures, skipped_checks: skippedList, base: BASE, suites: names };
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(failed === 0 ? 0 : 1);
}

/* ------------------------------ dispatch -------------------------------- */

if (cmd === "describe") {
  console.log(JSON.stringify(describe(), null, 2));
  process.exit(0);
} else if (cmd === "status") {
  status().then((s) => { console.log(JSON.stringify(s, null, 2)); process.exit(s.reachable ? 0 : 1); });
} else if (cmd === "test") {
  runTests();
} else {
  console.log(JSON.stringify({ error: "unknown command", cmd, hint: "try: describe | status | test --suite=all" }, null, 2));
  process.exit(2);
}
