/**
 * cleanup-real-db.mjs — remove ONLY what the regression suites created on the REAL Supabase project.
 *
 *   node regress/cleanup-real-db.mjs [--since=<ISO time>] [--dry-run] [--via=sql]
 *
 * Test identities are every auth user whose email ends in @example.com (journey: e2e-pat-/e2e-doc-/e2e-stranger-…@example.com;
 * suites: sec-/dc-/rl-/fd-…@example.com). The seeded accounts (@sihat.com) are never touched.
 * Deleted, in order (service key; GoTrue admin API for users):
 *   patients (email @example.com or user_id in test users) · guest_diagnosis_sessions (guest_email @example.com, migrated to a test
 *   user, or — with --since — anonymous rows created since then) · the auth users (profiles, inquiries, diagnosis_sessions and the
 *   notification tables cascade) · with --since: system_errors/system_logs/system_metrics rows written since then.
 * --via=sql does the same through the Management API SQL endpoint (PAT) — for when the REST/Auth gateway answers 402.
 * Refuses to run against any project other than the one in .env's SUPABASE_URL being a *.supabase.co host.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOMAIN = "@example.com";
function envFile() {
  const out = {}; const p = join(ROOT, ".env");
  if (!existsSync(p)) return out;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  return out;
}

export async function cleanupRealDb({ since = "", dryRun = false, via = "rest", log = (m) => process.stderr.write(m + "\n") } = {}) {
  const E = { ...envFile(), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("SUPABASE_"))) };
  const URL_ = (E.SUPABASE_URL || "").replace(/\/+$/, ""), KEY = E.SUPABASE_SERVICE_ROLE_KEY;
  const summary = { via, dryRun, since: since || null, deleted: {} };
  if (via === "sql") {
    const { sql } = await import("../db/mgmt.mjs");
    const ts = since ? `and created_at >= '${new Date(since).toISOString()}'` : "";
    const stmts = [
      `create temp table _t as select id from auth.users where lower(email) like '%${DOMAIN}'`,
      `delete from public.patients where lower(email) like '%${DOMAIN}' or user_id in (select id from _t)`,
      `delete from public.guest_diagnosis_sessions where lower(guest_email) like '%${DOMAIN}' or migrated_to_user_id in (select id from _t)${since ? ` or (guest_email is null ${ts})` : ""}`,
      ...(since ? ["system_errors", "system_logs", "system_metrics"].map((t) => `delete from public.${t} where ${t === "system_logs" || t === "system_metrics" ? '"timestamp"' : "created_at"} >= '${new Date(since).toISOString()}'`) : []),
      `delete from auth.users where id in (select id from _t)`,
    ];
    if (dryRun) { summary.sql = stmts; return summary; }
    const r = await sql(stmts.join(";\n") + ";\nselect 1");
    summary.ok = r.ok; summary.status = r.status; if (!r.ok) summary.error = r.text.slice(0, 300);
    return summary;
  }
  if (!URL_ || !KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (.env)");
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(URL_)) throw new Error("refusing to clean a non-supabase.co host: " + URL_.replace(/\/\/.*@/, "//"));
  const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  const call = async (method, path, body, extra = {}) => {
    const r = await fetch(URL_ + path, { method, headers: { ...H, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: r.status, ok: r.ok, json, text };
  };
  // 1. collect test users
  const ids = [];
  for (let page = 1; page < 100; page++) {
    const r = await call("GET", `/auth/v1/admin/users?page=${page}&per_page=200`);
    if (!r.ok) throw new Error(`list users HTTP ${r.status}: ${r.text.slice(0, 160)}`);
    const users = r.json?.users || [];
    for (const u of users) if ((u.email || "").toLowerCase().endsWith(DOMAIN)) ids.push(u.id);
    if (users.length < 200) break;
  }
  summary.testUsers = ids.length;
  const del = async (label, path) => {
    if (dryRun) { summary.deleted[label] = "dry-run"; return; }
    const r = await call("DELETE", path, undefined, { Prefer: "return=representation" });
    summary.deleted[label] = r.ok ? (Array.isArray(r.json) ? r.json.length : 0) : `HTTP ${r.status}`;
    if (!r.ok) log(`cleanup: ${label} -> HTTP ${r.status} ${r.text.slice(0, 160)}`);
  };
  const inList = ids.length ? `user_id.in.(${ids.join(",")})` : null;
  // 2. rows that would be orphaned (set null) rather than cascaded
  await del("patients", `/rest/v1/patients?or=(email.ilike.*${DOMAIN}${inList ? "," + inList : ""})`);
  const gq = [`guest_email.ilike.*${DOMAIN}`];
  if (ids.length) gq.push(`migrated_to_user_id.in.(${ids.join(",")})`);
  if (since) gq.push(`and(guest_email.is.null,created_at.gte.${encodeURIComponent(new Date(since).toISOString())})`);
  await del("guest_diagnosis_sessions", `/rest/v1/guest_diagnosis_sessions?or=(${gq.join(",")})`);
  if (since) {
    const iso = encodeURIComponent(new Date(since).toISOString());
    await del("system_errors", `/rest/v1/system_errors?created_at=gte.${iso}`);
    await del("system_logs", `/rest/v1/system_logs?timestamp=gte.${iso}`);
    await del("system_metrics", `/rest/v1/system_metrics?timestamp=gte.${iso}`);
  }
  // 3. the auth users (cascades profiles -> inquiries / diagnosis_sessions / notification tables)
  let users = 0, failed = 0;
  if (!dryRun) for (const id of ids) { const r = await call("DELETE", `/auth/v1/admin/users/${id}`); if (r.ok) users++; else { failed++; log(`cleanup: delete user ${id} -> HTTP ${r.status}`); } }
  summary.deleted.auth_users = dryRun ? `dry-run (${ids.length})` : users;
  summary.ok = failed === 0;
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").slice(n.length + 3);
  cleanupRealDb({ since: arg("since"), dryRun: process.argv.includes("--dry-run"), via: arg("via") || "rest" })
    .then((s) => { console.log(JSON.stringify(s)); process.exit(s.ok === false ? 1 : 0); })
    .catch((e) => { console.error("cleanup failed:", e.message); process.exit(1); });
}
