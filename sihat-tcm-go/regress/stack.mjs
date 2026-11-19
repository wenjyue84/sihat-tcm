/**
 * stack.mjs — boots an isolated, self-owned test stack and tears down ONLY what it
 * started (PIDs tracked; never kills by name).
 *
 *   const s = await startStack({ ai: "fake" | "pc" | "none", db: "fake" | "sqlite" | "real" })
 *   s.base            → http://127.0.0.1:18081 (the Go app)
 *   s.stop()          → kills the PIDs it spawned
 *
 *   ai "fake" = sihat-listener in SIHAT_LISTENER_FAKE=1 (canned replies, zero cost, deterministic)
 *   ai "pc"   = sihat-listener driving the real `claude` opus/sonnet/haiku on this PC
 *   db "fake" = regress/fake-supabase.mjs (hermetic)   db "real" = .env's Supabase
 *   google = regress/fake-google.mjs (OAuth + Health API stand-in) is started with the fake/sqlite stacks and the app is configured
 *            against it (GOOGLE_HEALTH_*); ACI_GOOGLE=off leaves Google unconfigured so the "not configured" paths can be tested
 *   db "sqlite" = the app's own SQLite fallback (DB_BACKEND=sqlite, fresh temp file per stack, no fake-supabase process;
 *                 its internal API is pinned to PORTS.db with /__fake/* test hooks so suites can seed/inspect)
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OFF = parseInt(process.env.ACI_PORT_OFFSET || "0", 10);
export const PORTS = { app: parseInt(process.env.ACI_PORT || "18081", 10) + OFF, db: 54329 + OFF, ai: 18788 + OFF, google: 18900 + OFF };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitHttp(url, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("timeout waiting for " + url);
}
export function parseEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// one binary per port offset: stacks with different ACI_PORT_OFFSET run in parallel (graph nodes), and Windows cannot
// overwrite an .exe another stack is running.
export function exePath() {
  return join(ROOT, "regress", ".bin", `sihat-tcm-aci${OFF ? "-" + OFF : ""}${process.platform === "win32" ? ".exe" : ""}`);
}

export function buildApp(log = () => {}) {
  const dir = join(ROOT, "regress", ".bin");
  mkdirSync(dir, { recursive: true });
  const exe = exePath();
  const r = spawnSync("go", ["build", "-o", exe, "."], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("go build failed: " + (r.stderr || r.stdout).slice(0, 600));
  log("built " + exe);
  return exe;
}

export async function startStack({ ai = "fake", db = "fake", build = true, log = (m) => process.stderr.write(m + "\n") } = {}) {
  const procs = [];
  let sqliteDir = null, dbKey = null;
  const spawnTracked = (cmd, args, env, name) => {
    const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let tail = "";
    const keep = (d) => { tail = (tail + d).slice(-1500); };
    child.stdout.on("data", keep); child.stderr.on("data", keep);
    child.tail = () => tail;
    procs.push({ child, name });
    return child;
  };
  const stop = async () => {
    for (const { child } of procs.reverse()) { try { if (child.exitCode === null) child.kill(); } catch { /* already gone */ } }
    await sleep(200);
    if (sqliteDir) { try { rmSync(sqliteDir, { recursive: true, force: true }); } catch { /* file still locked: the OS temp cleaner gets it */ } }
  };
  try {
    const env = { BIND_ADDR: "127.0.0.1", PORT: String(PORTS.app), APP_ENV: "development", PUBLIC_BASE_URL: `http://127.0.0.1:${PORTS.app}` };
    // promo video: the repo's media/ (repo-ignored, may be absent) unless ACI_MEDIA_DIR points elsewhere (e.g. an empty dir to test the "not available" path)
    { const md = process.env.ACI_MEDIA_DIR || join(ROOT, "media"); if (existsSync(md)) env.MEDIA_DIR = md; }
    if (db === "fake") {
      spawnTracked(process.execPath, ["regress/fake-supabase.mjs", `--port=${PORTS.db}`], {}, "fake-supabase");
      await waitHttp(`http://127.0.0.1:${PORTS.db}/__fake/health`);
      Object.assign(env, { SUPABASE_URL: `http://127.0.0.1:${PORTS.db}`, SUPABASE_ANON_KEY: "fake-anon", SUPABASE_SERVICE_ROLE_KEY: "fake-service" });
    } else if (db === "sqlite") {
      sqliteDir = mkdtempSync(join(tmpdir(), "sihat-sqlite-"));
      dbKey = "sqlite-service-" + randomBytes(8).toString("hex");
      Object.assign(env, {
        DB_BACKEND: "sqlite", SQLITE_PATH: join(sqliteDir, "sihat.db"), SEED_DEMO: "1",
        LOCALDB_ADDR: `127.0.0.1:${PORTS.db}`, LOCALDB_TEST_HOOKS: "1",
        LOCAL_JWT_SECRET: randomBytes(32).toString("hex"), LOCAL_ANON_KEY: "sqlite-anon-" + randomBytes(8).toString("hex"), LOCAL_SERVICE_KEY: dbKey,
        SUPABASE_URL: "", SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "",
      });
    } else {
      Object.assign(env, parseEnvFile(join(ROOT, ".env")), { BIND_ADDR: "127.0.0.1", PORT: String(PORTS.app), APP_ENV: "development", PUBLIC_BASE_URL: `http://127.0.0.1:${PORTS.app}` });
      // Preflight: fail fast and loudly when the real project's data plane is unusable (e.g. HTTP 402 exceed_egress_quota),
      // instead of letting every suite fail with a confusing 500.
      for (const probe of ["/auth/v1/health", "/rest/v1/"]) {
        let pr; try { pr = await fetch(env.SUPABASE_URL + probe, { headers: { apikey: env.SUPABASE_ANON_KEY } }); } catch (e) { throw new Error(`BLOCKED: real Supabase unreachable (${probe}): ${e.message}`); }
        if (pr.status === 402 || pr.status >= 500) throw new Error(`BLOCKED: real Supabase ${probe} -> HTTP ${pr.status}: ${(await pr.text()).slice(0, 220)}`);
      }
    }
    // Google Health channel: a fake OAuth + data server, wired through the app's own GOOGLE_HEALTH_* settings (dev-only overrides)
    let googleBase = null;
    if (db !== "real" && process.env.ACI_GOOGLE !== "off") {
      spawnTracked(process.execPath, ["regress/fake-google.mjs", `--port=${PORTS.google}`], {}, "fake-google");
      await waitHttp(`http://127.0.0.1:${PORTS.google}/__fake/health`);
      googleBase = `http://127.0.0.1:${PORTS.google}`;
      Object.assign(env, {
        GOOGLE_HEALTH_CLIENT_ID: "aci-client", GOOGLE_HEALTH_CLIENT_SECRET: "aci-secret", HEALTH_TOKEN_KEY: randomBytes(24).toString("hex"),
        GOOGLE_HEALTH_REDIRECT_URL: `http://127.0.0.1:${PORTS.app}/api/health/google/callback`,
        GOOGLE_HEALTH_AUTH_URL: googleBase + "/auth", GOOGLE_HEALTH_TOKEN_URL: googleBase + "/token", GOOGLE_HEALTH_REVOKE_URL: googleBase + "/revoke", GOOGLE_HEALTH_API_BASE: googleBase + "/v4",
      });
    } else if (db !== "real") {
      Object.assign(env, { GOOGLE_HEALTH_CLIENT_ID: "", GOOGLE_HEALTH_CLIENT_SECRET: "", HEALTH_TOKEN_KEY: "" });
    }
    if (ai !== "none") {
      spawnTracked(process.execPath, ["sihat-listener/listener.mjs"], { SIHAT_LISTENER_PORT: String(PORTS.ai), SIHAT_LISTENER_FAKE: ai === "fake" ? "1" : "0" }, "sihat-listener");
      await waitHttp(`http://127.0.0.1:${PORTS.ai}/healthz`);
      env.AI_BASE_URL = `http://127.0.0.1:${PORTS.ai}/v1beta/models`;
      env.GEMINI_API_KEY = "";
    } else { env.GEMINI_API_KEY = ""; delete env.AI_BASE_URL; }
    const exe = build ? buildApp(log) : exePath();
    const app = spawnTracked(exe, [], env, "sihat-tcm-go");
    try { await waitHttp(`http://127.0.0.1:${PORTS.app}/healthz`); }
    catch (e) { throw new Error(`${e.message}\n--- app output ---\n${app.tail()}`); }
    return { startedAt: new Date().toISOString(), base: `http://127.0.0.1:${PORTS.app}`, ports: PORTS, ai, db, dbKey, googleBase, stop, pids: procs.map((p) => ({ name: p.name, pid: p.child.pid })), dbBase: db === "real" ? env.SUPABASE_URL : `http://127.0.0.1:${PORTS.db}`, dbReal: db === "real" ? { url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY } : null, aiBase: `http://127.0.0.1:${PORTS.ai}` };
  } catch (e) { await stop(); throw e; }
}
