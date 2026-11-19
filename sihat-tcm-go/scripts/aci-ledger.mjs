// aci-ledger.mjs - the per-suite green ledger behind `node aci.mjs test --sweep` and tools/aci-sweep.ps1 (the idle sweep).
// Ported from salon-system scripts/aci-ledger.mjs (Jay 2026-11-01), adapted: the suites here are regress/suites/*.mjs run on the
// hermetic stack (fake db + fake ai), so a suite's "files it touches" is COMMON (the Go server, web assets, harness, stack) plus its OWN suite file.
//   record : every finished hermetic `aci test` run writes, for each suite that PASSED, {at, deps, secs}: deps = sha1 of the suite's
//            dependency files at the START of the run. A suite whose dependency hash changed while it ran is not recorded.
//   plan   : the sweep runs first what is due - never green, red in an earlier sweep, a dependency changed since its green run, or older
//            than MAX_STALE_H - then the stalest suites older than --min-age-h, up to the batch budget (estimated from recorded run times).
//   lock   : .aci/locks/<pid>.json per running hermetic test/gates run. A sweep (ACI_LOCK_BY=sweep) never starts while another run holds a lock,
//            and any other run (a fix loop, the pre-deploy gate) stops a running sweep's process tree; an interrupted sweep batch records nothing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // sihat-tcm-go/
const ACI_DIR = join(ROOT, '.aci');
export const LEDGER_FILE = join(ACI_DIR, 'ledger.json');
export const SWEEP_RED = join(ACI_DIR, 'sweep-red.json'); // suites the idle sweep found red, until a later run passes them
const LOCK_DIR = join(ACI_DIR, 'locks');
export const VERSION = 1;
export const MAX_STALE_H = 72;
const DEFAULT_SECS = 40; // includes a share of the stack boot

// ---------- dependency sets (relative paths) ----------
const COMMON = [
  /\.go$/, /^go\.(mod|sum)$/, /^(templates|static|db|internal|sihat-listener)\//,
  /^aci\.mjs$/, /^scripts\/aci-ledger\.mjs$/,
  /^regress\/[^/]+\.mjs$/, /^regress\/fixtures\//,   // harness, stack, fakes, journey (NOT regress/suites/: only the suite's own file counts)
];
const SKIP_DIRS = new Set(['.git', 'node_modules', '.aci', '.claude', 'demo-video', 'media', 'logs', 'test_evidence', '.bin', '.state', 'scenarios', 'reports', 'tools']);

const readJson = (p, d = null) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return d; } };
export const readLedger = () => { const l = readJson(LEDGER_FILE, null); return l && l.version === VERSION ? l : { version: VERSION, suites: {} }; };
export const readSweepRed = () => (readJson(SWEEP_RED, null) || {}).suites || [];

// per-file sha1 of every source file (one walk)
export function fileHashes() {
  const h = {};
  const walk = d => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      if (SKIP_DIRS.has(n.name) || n.name.endsWith('.exe') || /\.(db|db-shm|db-wal|mp4|wav|mp3|png|jpg|stackdump)$/.test(n.name)) continue;
      const p = join(d, n.name);
      if (n.isDirectory()) { walk(p); continue; }
      const rel = relative(ROOT, p).replace(/\\/g, '/');
      if (statSync(p).size > 5e6) continue;
      h[rel] = createHash('sha1').update(readFileSync(p)).digest('hex');
    }
  };
  walk(ROOT);
  return h;
}
// one hash per suite over its dependency files
export function depHashes(names, files = fileHashes()) {
  const keys = Object.keys(files).sort();
  const out = {};
  for (const suite of names) {
    const own = `regress/suites/${suite}.mjs`;
    out[suite] = createHash('sha1').update(keys.filter(k => k === own || COMMON.some(re => re.test(k))).map(k => k + '=' + files[k]).join('\n')).digest('hex').slice(0, 16);
  }
  return out;
}

// steps: [{id, status: pass|fail|warn, seconds}] of the finished run; before/after: depHashes() at start and end; sweep: true when the idle sweep ran it
export function record({ steps, before, after, sweep = false, at = new Date().toISOString() }) {
  const led = readLedger();
  const green = [], red = [];
  for (const s of steps) {
    if (!before[s.id]) continue;
    if (s.status === 'fail') { red.push(s.id); delete led.suites[s.id]; continue; }
    if (before[s.id] !== after[s.id]) continue; // its files changed mid-run: it did not test either tree
    led.suites[s.id] = { at, deps: before[s.id], secs: s.seconds || 0, status: s.status };
    green.push(s.id);
  }
  led.updated = at;
  mkdirSync(ACI_DIR, { recursive: true });
  writeFileSync(LEDGER_FILE, JSON.stringify(led, null, 1));
  let left = readSweepRed().filter(n => !green.includes(n));
  if (sweep) left = [...new Set([...left, ...red])];
  if (left.length) writeFileSync(SWEEP_RED, JSON.stringify({ at, suites: left })); else rmSync(SWEEP_RED, { force: true });
  return { green, red };
}

// why each suite is due now ([] = green on this tree and fresh)
export function dueReasons({ names, cur = depHashes(names), now = Date.now() }) {
  const led = readLedger(); const red = readSweepRed(); const why = {};
  for (const n of names) {
    const e = led.suites[n]; const r = [];
    if (red.includes(n)) r.push('red in an earlier sweep');
    if (!e) r.push('never green on record');
    else {
      if (e.deps !== cur[n]) r.push('its files changed since its green run');
      const ageH = (now - Date.parse(e.at)) / 3600e3;
      if (!(ageH <= MAX_STALE_H)) r.push(`last green ${ageH.toFixed(0)} h ago (> ${MAX_STALE_H} h)`);
    }
    why[n] = r;
  }
  return why;
}

// the batch for one sweep run: due suites first, then the stalest older than minAgeH, up to budgetMs of estimated run time
export function planSweep({ names, budgetMs = 240000, minAgeH = 12, now = Date.now() }) {
  const led = readLedger(); const why = dueReasons({ names, now });
  const est = n => (led.suites[n]?.secs || DEFAULT_SECS) * 1000;
  const due = names.filter(n => why[n].length);
  const rest = names.filter(n => !why[n].length && (now - Date.parse(led.suites[n].at)) / 3600e3 >= minAgeH).sort((a, b) => Date.parse(led.suites[a].at) - Date.parse(led.suites[b].at));
  const pick = []; let spent = 0;
  for (const n of [...due, ...rest]) { if (spent + est(n) > budgetMs && pick.length) break; spent += est(n); pick.push(n); }
  return { selected: pick, est_s: Math.round(spent / 1000), due: due.length, why };
}

// ---------- run locks + watchdog ----------
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export function liveLocks() {
  if (!existsSync(LOCK_DIR)) return [];
  const out = [];
  for (const f of readdirSync(LOCK_DIR)) {
    const l = readJson(join(LOCK_DIR, f), null);
    if (l && l.pid !== process.pid && alive(l.pid)) out.push(l); else if (!l || !alive(l.pid)) rmSync(join(LOCK_DIR, f), { force: true });
  }
  return out;
}
// stops exactly one process tree, by the PID the lock file names (never by image name)
export const stopTree = pid => (process.platform === 'win32' ? spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }) : (() => { try { process.kill(-pid, 'SIGKILL'); } catch { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } } })());

// returns a release() function, or exits 4 when a sweep finds another run going
export function acquireRunLock(log = console.error) {
  const by = process.env.ACI_LOCK_BY || 'gate';
  const others = liveLocks();
  if (by === 'sweep' && others.length) { log(`sweep not started: another run holds the ACI lock (pid ${others[0].pid}, by ${others[0].by})`); process.exit(4); }
  if (by !== 'sweep') for (const l of others.filter(x => x.by === 'sweep')) { log(`pre-empting the idle sweep (pid ${l.pid}): this run (${by}) takes over`); stopTree(l.pid); rmSync(join(LOCK_DIR, `${l.pid}.json`), { force: true }); spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},1500)']); } // let Windows release the killed binaries
  mkdirSync(LOCK_DIR, { recursive: true });
  const me = join(LOCK_DIR, `${process.pid}.json`);
  writeFileSync(me, JSON.stringify({ pid: process.pid, by, at: new Date().toISOString() }));
  // ACI_WATCH_PID: the sweep script's pid. When it goes away (task stopped, PC busy, session reaped) take the whole tree down, record nothing.
  const watch = Number(process.env.ACI_WATCH_PID || 0);
  if (watch) setInterval(() => { if (!alive(watch)) { rmSync(me, { force: true }); stopTree(process.pid); process.exit(5); } }, 3000).unref();
  const release = () => rmSync(me, { force: true });
  process.on('exit', release);
  return release;
}
