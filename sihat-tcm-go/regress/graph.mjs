#!/usr/bin/env node
/**
 * graph.mjs — the Sihat TCM regression GRAPH (graph-engineering, not a flat script list).
 *
 *   node regress/graph.mjs run [--profile=quick|full|predeploy] [--pc] [--cycles=N] [--resume] [--only=a,b]
 *   node regress/graph.mjs show                 # the graph, as mermaid
 *   node regress/graph.mjs verify-stamp         # exit 0 iff the working tree == the last green predeploy run
 *
 * Output of the one-sentence question: "Is this exact working tree safe to deploy?" → a JSON verdict and,
 * only for a fully-green predeploy run, a STAMP (tree hash) that scripts/deploy.sh and build.sh refuse to ship without.
 *
 *   nodes (type)            edges
 *   ─────────────────────── ───────────────────────────────────────────────────────────────
 *   vet            (code)   ─┐
 *   unit           (code)   ─┼─► integration ─► e2e-api ─┬─► e2e-ui  (browser)
 *   build-linux    (code)   ─┘                           └─► e2e-pc  (model leaf: real opus/sonnet/haiku)
 *   wiring         (code)   ─► integration
 *   e2e-sqlite     (code)   integration ─► journey+roles+security+datacontract+demodata on the SQLite fallback DB (--db=sqlite)
 *   contract-localdb (code) integration ─► suite fakedb run against the Go SQLite backend (FAKEDB_BASE)
 *   gate           (code)   ◄── every node of the profile; writes the stamp
 *
 * State is ONE record: regress/.state/last-<profile>.json {tree, nodes:{id:{status,ms,evidence}}}.
 * Checkpoint: --resume re-uses a node's PASS when the tree hash is unchanged. A failed/blocked node never
 * stamps. Independent branches always run (a failing e2e-ui does not hide an e2e-pc result).
 * Stop rules: every node has a hard timeout; model-leaf cycles are capped; no retries hide a failure.
 * Human gate: none here (nothing outward-facing). The outward step — deploy — is scripts/deploy.sh and it asks.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "regress", ".state");
mkdirSync(STATE, { recursive: true });
const args = process.argv.slice(2);
const cmd = args[0] || "run";
const flag = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const has = (n) => args.includes(`--${n}`);
const elog = (m) => process.stderr.write(m + "\n");
const GO = process.env.GO_BIN || "go";

/* ------------------------------ tree hash ------------------------------ */
function sh(cmd, argv, opts = {}) {
  return new Promise((res) => {
    const c = spawn(cmd, argv, { cwd: ROOT, shell: false, windowsHide: true, ...opts, env: { ...process.env, ...(opts.env || {}) } });
    let o = "", e = "";
    const timer = opts.timeout ? setTimeout(() => { c.kill(); e += `\n[timeout after ${opts.timeout}ms]`; }, opts.timeout) : null;
    c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (e += d));
    c.on("error", (err) => { if (timer) clearTimeout(timer); res({ code: -1, out: o, err: String(err) }); });
    c.on("close", (code) => { if (timer) clearTimeout(timer); res({ code, out: o, err: e }); });
  });
}
export async function treeHash() {
  const ls = await sh("git", ["ls-files", "-co", "--exclude-standard", "-z", "--", "."]);
  const files = ls.out.split("\0").filter(Boolean).sort();
  const h = createHash("sha1");
  for (const f of files) {
    // docs cannot change behaviour: hash code/config/templates/static only, so editing a README does not void the stamp
    if (f.startsWith("regress/.") || f.startsWith("sihat-listener/logs/") || f.endsWith(".md")) continue;
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    h.update(f + "\0"); h.update(readFileSync(p)); h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}

/* ------------------------------- the nodes ------------------------------- */
const tail = (s, n = 400) => (s || "").trim().split("\n").slice(-6).join("\n").slice(-n);

async function aciNode(suite, off, extraEnv = {}, extraArgs = []) {
  const r = await sh(process.execPath, ["aci.mjs", "test", `--suite=${suite}`, ...extraArgs], { env: { ACI_PORT_OFFSET: String(off), ...extraEnv }, timeout: 25 * 60_000 });
  let v = null; try { v = JSON.parse(r.out); } catch { /* not JSON */ }
  if (!v) return { ok: false, evidence: `aci produced no verdict (exit ${r.code}): ${tail(r.err || r.out)}` };
  const bad = (v.failures || []).slice(0, 5).map((f) => `${f.label}: ${f.detail}`).join(" | ");
  return { ok: v.ok === true, evidence: `${v.passed}/${v.total} checks, ${v.skipped || 0} skipped, ${v.ms}ms${bad ? " — FAIL: " + bad : ""}`, data: { passed: v.passed, total: v.total } };
}

const NODES = {
  vet: {
    type: "code", deps: [], timeout: 120_000,
    async run() {
      const r = await sh(GO, ["vet", "./..."], { timeout: 120_000 });
      const fmt = await sh("gofmt", ["-l", "."]);
      const unformatted = fmt.out.split("\n").filter(Boolean);
      // checks/ratchet.mjs: staticcheck may not get worse (override: CHECKS_RATCHET=warn); see wiki/checks.md
      const rt = r.code === 0 ? await sh("node", ["checks/ratchet.mjs"], { timeout: 240_000 }) : { code: 0, out: "", err: "" };
      if (rt.code !== 0) return { ok: false, evidence: tail(rt.err || rt.out) };
      return { ok: r.code === 0, evidence: r.code === 0 ? `go vet clean; ${(rt.out || "").trim()}${unformatted.length ? `; gofmt would change ${unformatted.length} file(s) (warning): ${unformatted.slice(0, 3).join(", ")}` : "; gofmt clean"}` : tail(r.err || r.out) };
    },
  },
  unit: {
    type: "code", deps: [], timeout: 600_000,
    async run() {
      const r = await sh(GO, ["test", "./...", "-count=1", "-json"], { timeout: 600_000 });
      let pass = 0, fail = 0, skip = 0; const failed = [];
      for (const line of r.out.split("\n")) {
        if (!line.startsWith("{")) continue;
        try {
          const e = JSON.parse(line);
          if (!e.Test) continue;
          if (e.Action === "pass") pass++; else if (e.Action === "fail") { fail++; failed.push(`${e.Package?.split("/").pop()}.${e.Test}`); } else if (e.Action === "skip") skip++;
        } catch { /* partial line */ }
      }
      // browser-side modules that have no Go twin (regress/*.test.mjs, node:test): the Web Bluetooth parsers of static/js/health-connect.js
      const jsFiles = readdirSync(join(ROOT, "regress")).filter((f) => f.endsWith(".test.mjs")).map((f) => "regress/" + f);
      const jt = jsFiles.length ? await sh(process.execPath, ["--test", ...jsFiles], { timeout: 120_000 }) : { code: 0, out: "# pass 0\n# fail 0" };
      const jsPass = +((jt.out.match(/^# pass (\d+)/m) || [])[1] || 0), jsFail = +((jt.out.match(/^# fail (\d+)/m) || [])[1] || 0);
      const jsOk = jt.code === 0 && jsFail === 0;
      const ok = r.code === 0 && fail === 0 && pass > 0 && jsOk;
      return { ok, evidence: ok ? `${pass} Go tests passed, ${skip} skipped (KNOWN BUG pins), 0 failed; ${jsPass} JS unit tests passed` : `${fail} failed [${failed.slice(0, 6).join(", ")}], ${pass} passed; ${jsOk ? "" : `JS unit tests: ${jsFail} failed / ${jsPass} passed; ${tail(jt.err || jt.out)}; `}${tail(r.err)}` , data: { pass, skip, jsPass } };
    },
  },
  "build-linux": {
    type: "code", deps: [], timeout: 300_000,
    async run() {
      mkdirSync(join(ROOT, "regress", ".bin"), { recursive: true });
      const r = await sh(GO, ["build", "-trimpath", "-o", "regress/.bin/sihat-tcm-go.linux", "."], { env: { GOOS: "linux", GOARCH: "amd64", CGO_ENABLED: "0" }, timeout: 300_000 });
      return { ok: r.code === 0, evidence: r.code === 0 ? "linux/amd64 static binary compiles (the deploy artifact)" : tail(r.err) };
    },
  },
  wiring: {
    type: "code", deps: [], timeout: 60_000,
    async run() {
      // "every test file is actually run": packages with Go sources must carry tests, suites must load, no orphan test files.
      const problems = [];
      const pkgs = (await sh(GO, ["list", "-f", "{{.Dir}}|{{len .GoFiles}}|{{len .TestGoFiles}}|{{len .XTestGoFiles}}", "./..."])).out.split("\n").filter(Boolean);
      for (const l of pkgs) { const [dir, g, t, x] = l.split("|"); if (+g > 0 && +t + +x === 0) problems.push(`package ${dir.split(/[\\/]/).slice(-2).join("/")} has Go code but no tests`); }
      const suiteFiles = readdirSync(join(ROOT, "regress", "suites")).filter((f) => f.endsWith(".mjs"));
      if (suiteFiles.length < 8) problems.push(`only ${suiteFiles.length} regression suites (expected >= 8)`);
      try { const { loadSuites } = await import("./harness.mjs"); const s = await loadSuites(); for (const [n, m] of Object.entries(s)) if (!m.doc) problems.push(`suite ${n} has no doc`); } catch (e) { problems.push("suite load failed: " + e.message); }
      for (const f of ["aci.mjs", "regress/journey.mjs", "regress/fake-supabase.mjs", "regress/localdb-contract.mjs", "internal/localdb/localdb.go", "sihat-listener/listener.mjs", ".claude/agents/sihat-tcm-go-aci-deterministic.md", ".claude/agents/sihat-tcm-go-aci-evaluator.md"]) if (!existsSync(join(ROOT, f))) problems.push(`missing ${f}`);
      return { ok: problems.length === 0, evidence: problems.length ? problems.join("; ") : `${pkgs.length} Go packages, ${suiteFiles.length} suites, ACI + agents present` };
    },
  },
  integration: { type: "code", deps: ["vet", "unit", "build-linux", "wiring"], timeout: 900_000, run: () => aciNode("health,auth,chat,image,consult,pages,security,ratelimit,listener,fakedb,datacontract,roles,demo,video,demodata,doctor_approval,no_blobs_in_db".split(",").filter(existsSuite).join(","), 10) },
  "e2e-api": { type: "code", deps: ["integration"], timeout: 900_000, run: () => aciNode("journey", 20, { ACI_CYCLES: flag("cycles", "3") }) },
  // the SQLite fallback DB (DB_BACKEND=sqlite): the same app + the money/security-relevant suites on real constraints, RLS and signed JWTs
  "e2e-sqlite": { type: "code", deps: ["integration"], timeout: 900_000, run: () => aciNode("journey,roles,security,datacontract,demodata,doctor_approval,no_blobs_in_db", 40, { ACI_CYCLES: flag("cycles", "2") }, ["--db=sqlite"]) },
  // the ~190-check GoTrue/PostgREST contract (suite fakedb) executed against the Go SQLite backend itself
  "contract-localdb": {
    type: "code", deps: ["integration"], timeout: 600_000,
    async run() {
      const r = await sh(process.execPath, ["regress/localdb-contract.mjs"], { env: { ACI_PORT_OFFSET: "60" }, timeout: 540_000 });
      let v = null; try { v = JSON.parse(r.out); } catch { /* not JSON */ }
      if (!v) return { ok: false, evidence: `contract run produced no verdict (exit ${r.code}): ${tail(r.err || r.out)}` };
      const bad = (v.failures || []).slice(0, 5).map((f) => `${f.label}: ${f.detail}`).join(" | ");
      return { ok: v.ok === true && r.code === 0, evidence: `${v.passed}/${v.total} contract checks vs the Go SQLite backend, ${v.skipped || 0} skipped${bad ? " — FAIL: " + bad : ""}` };
    },
  },
  "e2e-ui": {
    type: "browser", deps: ["e2e-api"], timeout: 900_000,
    async run() {
      const { startStack } = await import("./stack.mjs");
      const scripts = ["e2e_browser_test.py", "flow_browser_test.py", "features_browser_test.py", "admin_browser_test.py", "i18n_browser_test.py", "report_page_browser_test.py", "ui_roles_browser_test.py"].filter((f) => existsSync(join(ROOT, "scripts", f)));
      const res = [];
      let first = true;
      for (const s of scripts) {
        // fresh stack per script: the app rate-limits per IP+path (login 10/min, signup 5/min) and these scripts all come from
        // 127.0.0.1, so sharing one stack makes later scripts flaky; a fresh DB also removes cross-script state.
        const stack = await startStack({ ai: "fake", db: "fake", build: first });
        first = false;
        try {
          const r = await sh("uv", ["run", "--quiet", "--with", "playwright", "python", `scripts/${s}`], { env: { E2E_BASE: stack.base, ACI_BASE: stack.base, PYTHONIOENCODING: "utf-8" }, timeout: 300_000 });
          const pass = (r.out.match(/^PASS /gm) || []).length, fail = (r.out.match(/^FAIL /gm) || []).length;
          const failLines = (r.out.match(/^FAIL .*$/gm) || []).slice(0, 3).join(" ; ");
          res.push({ s, code: r.code, pass, fail, tail: failLines || tail(r.out + r.err, 200) });
        } finally { await stack.stop(); }
      }
      const bad = res.filter((x) => x.code !== 0 || x.fail > 0 || x.pass === 0);
      return { ok: bad.length === 0, evidence: bad.length ? "FAIL: " + bad.map((b) => `${b.s} (exit ${b.code}, ${b.pass} pass/${b.fail} fail${b.pass === 0 ? ", ZERO checks ran" : ""}: ${b.tail.replace(/\s+/g, " ")})`).join(" | ") : res.map((x) => `${x.s} ${x.pass}✓`).join(", ") };
    },
  },
  "e2e-pc": { type: "model", deps: ["e2e-api"], timeout: 40 * 60_000, run: () => aciNode("journey", 30, { ACI_CYCLES: flag("pc-cycles", "2") }, ["--ai=pc"]) },
};
function existsSuite(n) { return existsSync(join(ROOT, "regress", "suites", n + ".mjs")); }

const PROFILES = {
  quick: ["vet", "unit", "wiring", "integration"],
  full: ["vet", "unit", "build-linux", "wiring", "integration", "e2e-api", "e2e-sqlite", "contract-localdb", "e2e-ui"],
  predeploy: ["vet", "unit", "build-linux", "wiring", "integration", "e2e-api", "e2e-sqlite", "contract-localdb", "e2e-ui", "e2e-pc"],
};

/* ------------------------------- scheduler ------------------------------- */
async function run() {
  const profile = flag("profile", has("pc") ? "predeploy" : "full");
  if (!PROFILES[profile]) { console.log(JSON.stringify({ ok: false, error: "unknown profile", available: Object.keys(PROFILES) })); process.exit(2); }
  const only = flag("only", "");
  let ids = PROFILES[profile];
  if (only) ids = only.split(",");
  const tree = await treeHash();
  const lastPath = join(STATE, `last-${profile}.json`);
  const prev = has("resume") && existsSync(lastPath) ? JSON.parse(readFileSync(lastPath, "utf8")) : null;
  const state = { profile, tree, started: new Date().toISOString(), nodes: {} };
  elog(`▶ regression graph  profile=${profile}  tree=${tree}  nodes=${ids.join(" → ")}`);

  const done = new Map(); // id → promise
  const exec = (id) => {
    if (done.has(id)) return done.get(id);
    const n = NODES[id];
    const p = (async () => {
      const depRes = await Promise.all(n.deps.filter((d) => ids.includes(d)).map(exec));
      const blockedBy = n.deps.filter((d, i) => ids.includes(d)).filter((d) => state.nodes[d].status !== "pass");
      if (blockedBy.length) { state.nodes[id] = { status: "blocked", evidence: `blocked by ${blockedBy.join(", ")}` }; elog(`  ⊘ ${id} blocked by ${blockedBy.join(", ")}`); return; }
      if (prev && prev.tree === tree && prev.nodes?.[id]?.status === "pass") { state.nodes[id] = { ...prev.nodes[id], resumed: true }; elog(`  ↺ ${id} (checkpoint: unchanged tree, previous PASS)`); return; }
      const t0 = Date.now();
      elog(`  … ${id} (${n.type})`);
      let r;
      try { r = await Promise.race([n.run(), new Promise((_, rej) => setTimeout(() => rej(new Error(`node timeout ${n.timeout}ms`)), n.timeout))]); }
      catch (e) { r = { ok: false, evidence: String(e.message || e) }; }
      state.nodes[id] = { status: r.ok ? "pass" : "fail", ms: Date.now() - t0, evidence: r.evidence, data: r.data };
      elog(`  ${r.ok ? "✓" : "✗"} ${id}  ${Date.now() - t0}ms — ${r.evidence}`);
    })();
    done.set(id, p);
    return p;
  };
  await Promise.all(ids.map(exec));

  const statuses = ids.map((id) => state.nodes[id].status);
  const allGreen = statuses.every((s) => s === "pass");
  state.ok = allGreen;
  state.finished = new Date().toISOString();
  // the stamp only exists for a COMPLETE, GREEN predeploy-grade run of the whole profile (never for --only)
  const stampable = allGreen && !only && (profile === "predeploy" || (profile === "full" && has("stamp")));
  writeFileSync(lastPath, JSON.stringify(state, null, 2));
  if (stampable) writeFileSync(join(STATE, "stamp.json"), JSON.stringify({ tree, profile, at: state.finished, nodes: Object.fromEntries(ids.map((id) => [id, state.nodes[id].evidence])) }, null, 2));
  const verdict = { ok: allGreen, profile, tree, stamped: stampable, passed: statuses.filter((s) => s === "pass").length, failed: statuses.filter((s) => s === "fail").length, blocked: statuses.filter((s) => s === "blocked").length, nodes: state.nodes, blind_spots: ["JS fake Supabase has no RLS/JWT/constraints (real project answers 402); the SQLite fallback (e2e-sqlite, contract-localdb) does - only the real Supabase gateway itself is unverified", "browser UI covered only by scripts/*_browser_test.py (node e2e-ui)", profile === "predeploy" ? undefined : "no real-model run in this profile"].filter(Boolean) };
  console.log(JSON.stringify(verdict, null, 2));
  elog(allGreen ? `\n✅ GRAPH GREEN${stampable ? " — stamp written (deploy allowed for tree " + tree + ")" : ""}` : `\n❌ GRAPH RED — ${verdict.failed} failed, ${verdict.blocked} blocked`);
  process.exit(allGreen ? 0 : 1);
}

async function verifyStamp() {
  const p = join(STATE, "stamp.json");
  if (!existsSync(p)) { console.log(JSON.stringify({ ok: false, reason: "no stamp — run: node regress/graph.mjs run --profile=predeploy" })); process.exit(1); }
  const s = JSON.parse(readFileSync(p, "utf8"));
  const tree = await treeHash();
  const ok = s.tree === tree;
  const ageH = (Date.now() - Date.parse(s.at)) / 3.6e6;
  console.log(JSON.stringify({ ok, stamp_tree: s.tree, current_tree: tree, stamped_at: s.at, age_hours: +ageH.toFixed(1), reason: ok ? "working tree identical to the last green predeploy run" : "working tree changed since the last green predeploy run — re-run the graph" }));
  process.exit(ok ? 0 : 1);
}

function show() {
  console.log(["flowchart LR", "  vet-->integration", "  unit-->integration", "  build-linux-->integration", "  wiring-->integration", "  integration-->e2e-api", "  integration-->e2e-sqlite", "  integration-->contract-localdb", "  e2e-api-->e2e-ui", "  e2e-api-->e2e-pc", "  e2e-ui-->gate{{stamp}}", "  e2e-sqlite-->gate", "  contract-localdb-->gate", "  e2e-pc-->gate"].join("\n"));
}

if (cmd === "run") run();
else if (cmd === "verify-stamp") verifyStamp();
else if (cmd === "show") show();
else { console.log(JSON.stringify({ error: "unknown command", hint: "run | show | verify-stamp" })); process.exit(2); }
