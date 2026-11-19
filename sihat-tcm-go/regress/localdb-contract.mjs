#!/usr/bin/env node
/**
 * localdb-contract.mjs — run suite `fakedb` (the ~160-check GoTrue + PostgREST contract) against the Go SQLite backend.
 *
 *   node regress/localdb-contract.mjs            # ports shift with ACI_PORT_OFFSET (backend on 54379+offset)
 *
 * Builds the app, boots `sihat-tcm-go --localdb-only --port N` (test hooks + scratch tables ON, fresh temp SQLite file,
 * fixed throw-away keys), then runs `node aci.mjs test --suite=fakedb` with FAKEDB_BASE/FAKEDB_KEY/FAKEDB_ANON_KEY set so
 * the SAME checks that gate the JS fake run against the Go backend. Only the PID it started is killed. The JSON verdict of
 * the aci run goes to stdout; exit code is the aci run's.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp, PORTS } from "./stack.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = PORTS.db + 50;
const base = `http://127.0.0.1:${port}`;
const dir = mkdtempSync(join(tmpdir(), "sihat-contract-"));
const key = "contract-service-" + randomBytes(8).toString("hex"), anon = "contract-anon-" + randomBytes(8).toString("hex");

const exe = buildApp((m) => process.stderr.write(m + "\n"));
const child = spawn(exe, ["--localdb-only", `--port=${port}`], {
  cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  env: { ...process.env, APP_ENV: "development", SQLITE_PATH: join(dir, "contract.db"), SEED_DEMO: "1", LOCAL_SERVICE_KEY: key, LOCAL_ANON_KEY: anon, LOCAL_JWT_SECRET: randomBytes(32).toString("hex") },
});
let tail = "";
child.stdout.on("data", (d) => { tail = (tail + d).slice(-1500); }); child.stderr.on("data", (d) => { tail = (tail + d).slice(-1500); });
const cleanup = async () => { try { if (child.exitCode === null) child.kill(); } catch { /* gone */ } await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch { /* temp cleaner */ } };

let status = 1;
try {
  let up = false;
  for (let i = 0; i < 80 && !up; i++) { try { up = (await fetch(base + "/__fake/health")).ok; } catch { await sleep(250); } }
  if (!up) throw new Error("localdb-only did not come up:\n" + tail);
  const r = spawnSync(process.execPath, [join(ROOT, "aci.mjs"), "test", "--suite=fakedb"], {
    cwd: ROOT, stdio: ["ignore", "inherit", "inherit"], encoding: "utf8",
    env: { ...process.env, FAKEDB_BASE: base, FAKEDB_KEY: key, FAKEDB_ANON_KEY: anon },
  });
  status = r.status ?? 1;
} catch (e) { process.stderr.write(String(e.stack || e) + "\n"); }
finally { await cleanup(); }
process.exit(status);
