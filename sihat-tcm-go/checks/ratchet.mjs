#!/usr/bin/env node
// Ratchet for staticcheck findings: counts per check code are compared with checks/baseline.json
// ("staticcheck"). Fails only when a count goes UP or a new code appears.
//   node checks/ratchet.mjs            check
//   node checks/ratchet.mjs --update   record the current (lower) counts as the new baseline
// Emergency override (prints loudly, exits 0):  CHECKS_RATCHET=warn node checks/ratchet.mjs
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const modRoot = join(here, "..");
const basePath = join(here, "baseline.json");
const warnOnly = process.env.CHECKS_RATCHET === "warn";

const r = spawnSync("staticcheck", ["-f", "json", "./..."], { cwd: modRoot, encoding: "utf8", maxBuffer: 64 << 20, timeout: 240_000, shell: process.platform === "win32" });
if (r.error || (r.status !== 0 && r.status !== 1 && !r.stdout)) {
  console.error(`[ratchet] staticcheck did not run (${r.error?.message || "exit " + r.status}). Install: go install honnef.co/go/tools/cmd/staticcheck@latest`);
  process.exit(warnOnly ? 0 : 1);
}
const counts = {};
for (const line of r.stdout.split("\n")) {
  if (!line.trim()) continue;
  try { const f = JSON.parse(line); if (f.code) counts[f.code] = (counts[f.code] || 0) + 1; } catch { /* ignore non-json line */ }
}
const base = JSON.parse(readFileSync(basePath, "utf8"));
if (process.argv.includes("--update")) {
  base.staticcheck = Object.fromEntries(Object.entries(counts).sort());
  writeFileSync(basePath, JSON.stringify(base, null, 2) + "\n");
  console.log("[ratchet] baseline updated:", base.staticcheck);
  process.exit(0);
}
const bad = [];
for (const [code, n] of Object.entries(counts)) {
  const allowed = base.staticcheck[code] ?? 0;
  if (n > allowed) bad.push(`${code}: ${n} findings, baseline ${allowed}  -> fix the new finding (run: staticcheck ./... | grep ${code}); never raise the baseline without Jay's approval`);
}
const improved = Object.entries(base.staticcheck).filter(([c, n]) => (counts[c] ?? 0) < n).map(([c]) => c);
if (improved.length) console.log(`[ratchet] improved (${improved.join(", ")}): run node checks/ratchet.mjs --update to lock it in`);
if (bad.length) {
  console.error("[ratchet] staticcheck ratchet FAILED:\n  " + bad.join("\n  "));
  if (warnOnly) { console.error("[ratchet] CHECKS_RATCHET=warn -> passing anyway. FIX THIS SOON."); process.exit(0); }
  process.exit(1);
}
console.log(`[ratchet] staticcheck ok: ${Object.values(counts).reduce((a, b) => a + b, 0)} findings, none above baseline`);
