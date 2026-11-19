#!/usr/bin/env node
/**
 * sihat-tcm-go ACI v2 — Agent Computer Interface.
 *
 * One CLI for LLM agents (and humans) to discover, snapshot and regression-test the
 * Sihat TCM Go server through structured JSON — never through a browser.
 *
 *   node aci.mjs describe [--json]                # capability catalog — START HERE
 *   node aci.mjs status                           # is a target up? ai/db configured?
 *   node aci.mjs snapshot --json --out <path>     # machine-readable state dump (ACI v2)
 *   node aci.mjs test --suite=all                 # every suite, hermetic stack (fake db + fake ai)
 *   node aci.mjs test --suite=journey --ai=pc     # real opus/sonnet/haiku via sihat-listener
 *   node aci.mjs test --base=https://tcm.wenjyue.com --suite=health,auth,consult   # post-deploy, read-only
 *   node aci.mjs gates [--profile=quick|full|predeploy]   # the whole regression GRAPH (regress/graph.mjs)
 *
 * Targets: by default the ACI boots ITS OWN isolated stack on ACI_PORT (18081) — fake Supabase
 * (54329) + sihat-listener (18788) + the freshly built Go binary — and kills only those PIDs.
 * It never touches the user's running instance. `--base=URL` tests an existing deployment.
 *
 * JSON → stdout (agents parse this). Human ✓/✗ progress → stderr.
 * Exit codes: 0 pass · 1 failure · 2 usage error · 3 refused by the prod guard.
 *
 * Auth note: the app has no scoped read-only credential. Against localhost the demo accounts
 * (patient|doctor|admin|developer@sihat.com) are used; `snapshot` against a deployed host
 * only reads public endpoints (/healthz, /api/doctors) — no token is stored or needed.
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadSuites, runSuite } from "./regress/harness.mjs";
import { startStack, PORTS } from "./regress/stack.mjs";
import { cleanupRealDb } from "./regress/cleanup-real-db.mjs";
import * as ledger from "./scripts/aci-ledger.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cmd = args[0] || "help";
const flag = (name, def) => { const a = args.find((x) => x.startsWith("--" + name + "=")); return a ? a.split("=").slice(1).join("=") : def; };
const has = (name) => args.includes("--" + name);
const QUIET = has("brief");   // --brief (sweep): progress silenced; stdout carries only the summary line + RED lines
const elog = (m) => { if (!QUIET) process.stderr.write(m + "\n"); };
const out = (o) => console.log(JSON.stringify(o, null, 2));

const EXPLICIT_BASE = flag("base", process.env.ACI_BASE || process.env.BASE_URL || "");
const AI_MODE = flag("ai", process.env.ACI_AI || "fake");   // fake | pc
const DB_MODE = flag("db", process.env.ACI_DB || "fake");   // fake | sqlite | real
if (!["fake", "sqlite", "real"].includes(DB_MODE)) { elog(`usage: --db must be fake|sqlite|real (got "${DB_MODE}")`); process.exit(2); }
const isLocal = (u) => { try { const h = new URL(u).hostname; return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(h); } catch { return false; } };

/** Prod guard: refuse anything that mutates (or spends model calls on) a non-local host. */
function assertProdGuard(readOnlyOk) {
  if (!EXPLICIT_BASE || isLocal(EXPLICIT_BASE) || process.env.ACI_ALLOW_PROD === "1" || readOnlyOk) return;
  elog(`refusing: this command would mutate non-localhost ${EXPLICIT_BASE} — set ACI_ALLOW_PROD=1 to override (read-only suites don't need it)`);
  process.exit(3);
}

/* ------------------------------- describe ------------------------------- */
async function describe() {
  const suites = await loadSuites();
  return {
    name: "sihat-tcm-go ACI",
    version: 2,
    app: "Sihat TCM (Go rewrite) — AI-powered TCM 4-examination (四诊合参) diagnostic platform",
    prod: "https://tcm.wenjyue.com (Hetzner, PM2 sihat-tcm-go, port 3200)",
    commands: {
      describe: "this capability catalog (start here)",
      status: "reachability + ai/db configured for the target (--base) or the default local port",
      "snapshot --json --out <path>": "ACI v2 state dump: {app, as_of, counts, flags, ...} — read-only, works against any host",
      "test [--suite=all|quick|a,b,c] [--base=URL] [--ai=fake|pc] [--db=fake|sqlite|real]": "run suites; JSON verdict to stdout",
      "test --sweep [--budget-min=4] [--min-age-h=12] [--brief] [--retry-failed=1] [--dry]": "one idle-sweep batch (tools/aci-sweep.ps1): due / stalest suites first on the hermetic default stack, recorded in .aci/ledger.json; failures go to .aci/sweep-red.json. Local only: --base/--db/--ai are refused. Exit 4 when another ACI run holds .aci/locks/",
      ledger: "per-suite green ledger (.aci/ledger.json): last green time, run seconds, why each suite is due",
      "gates [--profile=quick|full|predeploy] [--pc] [--resume]": "run the whole regression graph (unit → integration → e2e api → e2e ui → pc-model e2e); writes the pre-deploy stamp",
    },
    suites: Object.fromEntries(Object.entries(suites).map(([k, s]) => [k, { doc: s.doc, mutating: !!s.mutating, costly: !!s.costly, needs: s.needs }])),
    profiles: { quick: "all non-costly suites (no model calls beyond canned fake)", full: "every suite on the hermetic stack", predeploy: "full + pc-model journey (real opus/sonnet/haiku) + browser UI; stamps the tree hash that deploy.sh requires" },
    stack: { default: "own hermetic stack: fake Supabase :54329 + sihat-listener :18788 + Go binary :" + PORTS.app, ai: "--ai=fake (canned, deterministic) | --ai=pc (real claude opus/sonnet/haiku on this PC via sihat-listener)", db: "--db=fake (hermetic JS stand-in, default) | --db=sqlite (the app's own SQLite fallback, DB_BACKEND=sqlite: fresh temp file per stack, real constraints/RLS/signed JWTs, internal API pinned to the db port with /__fake/* test hooks) | --db=real (.env Supabase project wgxufplbcncsjwdhtuxd; preflights the gateway, cleans up its test users afterwards; 2026-10-10: gateway answers 402 exceed_egress_quota => BLOCKED)" },
    exitCodes: { 0: "all pass", 1: ">=1 fail or target unreachable", 2: "usage error", 3: "refused by prod guard (needs ACI_ALLOW_PROD=1 for mutating suites on a non-localhost host)" },
    guardrails: [
      "Mutating suites (journey, ratelimit, …) are REFUSED on non-localhost --base unless ACI_ALLOW_PROD=1. Post-deploy verification uses --suite=health,auth,consult (read-only).",
      "Created rows are tagged e2e-<run>@example.com; the hermetic fake DB is in-memory and discarded on exit.",
      "The JS fake Supabase (--db=fake) has NO Row-Level-Security, JWT signing or constraints; use --db=sqlite (or graph node e2e-sqlite) for anything that depends on them. Neither proves the real Supabase gateway (HTTP 402 since 2026-10-10).",
      "--db=sqlite deletes its temp SQLite file with the stack; production data (SQLITE_PATH) is never touched by the ACI.",
      "Never kills processes by name: only the PIDs the stack started.",
      "Browser-only concerns (CSS paint, event wiring, focus, responsive layout) are NOT covered by the HTTP suites — see scripts/*_browser_test.py (graph node e2e-ui).",
    ],
    agents: [".claude/agents/sihat-tcm-go-aci-deterministic.md", ".claude/agents/sihat-tcm-go-aci-evaluator.md"],
  };
}

/* ----------------------------- target / stack ----------------------------- */
async function cleanReal(since) {
  try {
    let s;
    try { s = await cleanupRealDb({ since, log: elog }); if (s.ok === false) throw new Error("rest cleanup incomplete"); }
    catch (e) { elog(`cleanup via REST failed (${e.message}); retrying via Management API SQL`); s = await cleanupRealDb({ since, via: "sql", log: elog }); }
    elog("real-db cleanup: " + JSON.stringify(s));
  } catch (e) { elog("real-db cleanup FAILED: " + e.message); }
}
async function withTarget(needStack, fn) {
  if (!needStack) return fn({ base: EXPLICIT_BASE || "", stack: null });
  if (EXPLICIT_BASE) {
    try { const r = await fetch(EXPLICIT_BASE.replace(/\/+$/, "") + "/healthz"); if (!r.ok) throw new Error("status " + r.status); }
    catch (e) { return { unreachable: `${EXPLICIT_BASE}: ${e.message}` }; }
    return fn({ base: EXPLICIT_BASE.replace(/\/+$/, ""), stack: null });
  }
  const stack = await startStack({ ai: AI_MODE, db: DB_MODE });
  try { return await fn({ base: stack.base, stack }); }
  finally {
    await stack.stop();
    if (DB_MODE === "real") await cleanReal(stack.startedAt);   // delete ONLY test-created rows/users from the real project
  }
}

async function status() {
  const base = (EXPLICIT_BASE || `http://127.0.0.1:${PORTS.app}`).replace(/\/+$/, "");
  try {
    const r = await fetch(base + "/healthz");
    const j = await r.json().catch(() => ({}));
    return { reachable: r.status === 200, base, ...j, note: EXPLICIT_BASE ? undefined : "no --base: this probes the default ACI port; `test` boots its own stack" };
  } catch (e) { return { reachable: false, base, error: String(e.message || e) }; }
}

async function snapshot() {
  const base = (EXPLICIT_BASE || "").replace(/\/+$/, "");
  const o = flag("out", "");
  const doSnap = async (b, stack) => {
    const get = async (p) => { try { const r = await fetch(b + p); return { status: r.status, json: await r.json().catch(() => null) }; } catch (e) { return { status: 0, error: String(e.message || e) }; } };
    const h = await get("/healthz"), d = await get("/api/doctors");
    const doctors = d.json?.doctors || [];
    const flags = [];
    if (h.status !== 200) flags.push({ level: "error", msg: `/healthz returned ${h.status}` });
    if (h.json && h.json.db !== true) flags.push({ level: "error", msg: "database not configured" });
    if (h.json && h.json.ai !== true) flags.push({ level: "warn", msg: "AI not configured" });
    if (d.status === 200 && doctors.length === 0) flags.push({ level: "warn", msg: "doctor directory is empty — patients cannot connect with a doctor" });
    if (d.status !== 200) flags.push({ level: "error", msg: `/api/doctors returned ${d.status} (database reachable?)` });
    return {
      app: "sihat-tcm-go", as_of: new Date().toISOString(), target: b, hermetic: !!stack,
      counts: { healthz_status: h.status, doctors_listed: doctors.length, doctors_status: d.status },
      flags, health: h.json, ai_backend: stack ? { mode: AI_MODE } : undefined,
    };
  };
  const snap = EXPLICIT_BASE ? await doSnap(base, null) : await withTarget(true, ({ base: b, stack }) => doSnap(b, stack));
  if (snap.unreachable) { out(snap); process.exit(1); }
  if (o) { mkdirSync(dirname(resolve(o)), { recursive: true }); writeFileSync(resolve(o), JSON.stringify(snap, null, 2)); }
  return snap;
}

/* --------------------------------- test --------------------------------- */
async function runTests() {
  const all = await loadSuites();
  const want = flag("suite", "all");
  let names;
  if (want === "all") names = Object.keys(all);
  else if (want === "quick") names = Object.keys(all).filter((n) => !all[n].costly);
  else names = want.split(",").map((s) => s.trim()).filter(Boolean);
  const unknown = names.filter((n) => !all[n]);
  if (!names.length || unknown.length) { out({ ok: false, error: "no such suite", unknown, available: Object.keys(all) }); process.exit(2); }

  const anyMutating = names.some((n) => all[n].mutating || (AI_MODE === "pc" && all[n].costly));
  assertProdGuard(!anyMutating);

  if (!EXPLICIT_BASE) ledger.acquireRunLock(elog);   // own hermetic stack: ports are shared, so one run at a time (a gate/fix run pre-empts the idle sweep)
  const before = ledger.depHashes(Object.keys(all));
  const verdict = await execSuites(all, names);
  if (verdict.unreachable) { out({ ok: false, error: "target unreachable", detail: verdict.unreachable, passed: 0, failed: 0, total: 0, failures: [] }); process.exit(1); }
  if (verdict.hermetic && DB_MODE === "fake") verdict.blind_spots = ["fake Supabase: no RLS / JWT signing / constraints"];
  if (verdict.hermetic && DB_MODE === "sqlite") verdict.blind_spots = ["SQLite fallback DB (real constraints, RLS, HS256 JWTs) - but NOT the real Supabase gateway; no email delivery (recovery links go to the server log)"];
  if (canRecord(verdict)) verdict.ledger = ledger.record({ steps: stepsOf(verdict), before, after: ledger.depHashes(Object.keys(all)) });   // every finished default-stack run feeds the green ledger
  out(verdict);
  process.exit(verdict.ok ? 0 : 1);
}

// only the default hermetic stack (fake db + fake ai) feeds the ledger: that is what the sweep re-runs
const canRecord = (v) => !!v.hermetic && DB_MODE === "fake" && AI_MODE === "fake";
const stepsOf = (v) => Object.entries(v.suites).map(([id, s]) => ({ id, status: s.failed ? "fail" : "pass", seconds: Math.round(s.ms / 1000) }));

/** Run the named suites once on one target (own stack, or --base); returns the verdict, or {unreachable}. */
async function execSuites(all, names) {
  const t0 = Date.now();
  return withTarget(names.some((n) => all[n].needs === "stack"), async ({ base, stack }) => {
    let passed = 0, failed = 0, skipped = 0;
    const failures = [], skippedList = [], perSuite = {};
    for (const name of names) {
      elog(`▶ suite ${name}`);
      const s0 = Date.now();
      const rows = await runSuite(all[name], { base, stack, elog });
      let p = 0, f = 0;
      for (const r of rows) {
        if (r.skipped) { skipped++; skippedList.push({ label: r.label, detail: r.detail }); elog(`  ~ ${r.label} (skipped: ${r.detail})`); continue; }
        if (r.ok) { passed++; p++; elog("  ✓ " + r.label); } else { failed++; f++; failures.push({ label: r.label, detail: r.detail }); elog(`  ✗ ${r.label} — ${r.detail}`); }
      }
      if (p + f === 0) { failed++; f++; failures.push({ label: `${name}.no_checks`, detail: "suite ran zero checks — a suite that checks nothing is a false green" }); elog(`  ✗ ${name}.no_checks`); }
      perSuite[name] = { passed: p, failed: f, ms: Date.now() - s0 };
    }
    const total = passed + failed;
    return { ok: failed === 0 && total > 0, passed, failed, total, skipped, failures, skipped_checks: skippedList, suites: perSuite, base, hermetic: !!stack, ai: stack ? AI_MODE : "external", db: stack ? DB_MODE : "external", ms: Date.now() - t0 };
  });
}

/* --------------------------- idle sweep + ledger --------------------------- */
// One idle-sweep batch (tools/aci-sweep.ps1): due / stalest suites on the hermetic default stack (fake db + fake ai), recorded in .aci/ledger.json.
// Local only by construction: --base, --db=real and --ai=pc are refused, so a sweep never touches production, the real Supabase or a model call.
async function sweep() {
  if (EXPLICIT_BASE || DB_MODE !== "fake" || AI_MODE !== "fake") { elog("usage: test --sweep runs the hermetic default stack only (no --base, --db, --ai)"); process.exit(2); }
  const all = await loadSuites();
  const names = Object.keys(all);
  const budgetMs = Number(flag("budget-min", 4)) * 60000, minAgeH = Number(flag("min-age-h", 12));
  const plan = ledger.planSweep({ names, budgetMs, minAgeH });
  const line = (s) => { if (has("brief")) console.log(s); };
  if (has("dry") || has("list")) { out({ sweep: true, ...plan }); process.exit(0); }
  if (!plan.selected.length) { line(`ACI SWEEP: nothing due (all ${names.length} suites green on this tree, none older than ${minAgeH} h)`); if (!has("brief")) out({ sweep: true, selected: [], nothing_due: true }); process.exit(0); }
  ledger.acquireRunLock(elog);   // exit 4 when another run is going
  const t0 = Date.now();
  const before = ledger.depHashes(names);
  let v = await execSuites(all, plan.selected);
  if (v.unreachable) { elog("sweep: " + v.unreachable); process.exit(1); }
  let steps = stepsOf(v); const flaky = [];
  if (Number(flag("retry-failed", 0)) > 0) {   // one retry of the failed suites, on a fresh stack: a pass the second time is flaky, not red
    const bad = steps.filter((s) => s.status === "fail").map((s) => s.id);
    if (bad.length) {
      elog(`retrying ${bad.join(", ")} once (--retry-failed)`);
      const v2 = await execSuites(all, bad);
      if (!v2.unreachable) for (const s of stepsOf(v2)) { if (s.status !== "fail") flaky.push(s.id); steps = steps.map((x) => (x.id === s.id ? s : x)); v.failures = v.failures.filter((f) => !f.label.startsWith(s.id + ".")); if (s.status === "fail") v.failures.push(...v2.failures.filter((f) => f.label.startsWith(s.id + "."))); }
    }
  }
  const rec = ledger.record({ steps, before, after: ledger.depHashes(names), sweep: true });
  const secs = Math.round((Date.now() - t0) / 1000);
  const red = steps.filter((s) => s.status === "fail");
  const left = ledger.planSweep({ names, budgetMs: Infinity, minAgeH }).due;
  if (has("brief")) {
    line(`ACI SWEEP: ${red.length ? "FAIL" : "PASS"} ${plan.selected.length - red.length}/${plan.selected.length} suite(s) [${plan.selected.join(",")}] in ${secs}s${flaky.length ? `, flaky: ${flaky.join(",")}` : ""}; ${left} still due`);
    for (const s of red) line(`RED ${s.id}: ${v.failures.filter((f) => f.label.startsWith(s.id + ".")).slice(0, 2).map((f) => `${f.label} ${String(f.detail || "")}`).join(" / ").replace(/\s+/g, " ").slice(0, 240)}`);
  } else out({ sweep: true, selected: plan.selected, why: Object.fromEntries(plan.selected.map((n) => [n, plan.why[n]])), seconds: secs, green: rec.green, red: red.map((s) => s.id), flaky, still_due: left });
  process.exit(red.length ? 1 : 0);
}

async function showLedger() {
  const names = Object.keys(await loadSuites());
  const led = ledger.readLedger(); const why = ledger.dueReasons({ names }); const now = Date.now();
  out({
    file: ".aci/ledger.json", updated: led.updated || null, sweep_red: ledger.readSweepRed(),
    suites: Object.fromEntries(names.map((n) => { const e = led.suites[n]; return [n, { green_at: e?.at || null, age_h: e ? Math.round((now - Date.parse(e.at)) / 360e3) / 10 : null, secs: e?.secs ?? null, due: why[n] }]; })),
  });
}

function runGates() {
  ledger.acquireRunLock(elog);   // the gate graph boots the same hermetic ports: it pre-empts a running idle sweep
  const r = spawnSync(process.execPath, [join(__dirname, "regress", "graph.mjs"), "run", ...args.slice(1)], { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", cwd: __dirname });
  process.stdout.write(r.stdout || "");
  process.exit(r.status ?? 1);
}

/* -------------------------------- dispatch -------------------------------- */
(async () => {
  if (cmd === "describe") { out(await describe()); process.exit(0); }
  else if (cmd === "status") { const s = await status(); out(s); process.exit(s.reachable ? 0 : 1); }
  else if (cmd === "snapshot") { assertProdGuard(true); const s = await snapshot(); out(s); process.exit(s.flags.some((f) => f.level === "error") ? 1 : 0); }
  else if (cmd === "test") { if (has("sweep")) await sweep(); else await runTests(); }
  else if (cmd === "ledger") await showLedger();
  else if (cmd === "gates") runGates();
  else { out({ error: "unknown command", cmd, hint: "try: describe | status | snapshot | test --suite=all | gates" }); process.exit(2); }
})().catch((e) => { out({ ok: false, error: String(e && e.stack ? e.stack : e) }); process.exit(1); });
