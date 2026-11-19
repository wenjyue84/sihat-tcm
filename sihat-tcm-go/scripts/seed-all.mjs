/**
 * Seed a Supabase project for Sihat TCM Go (service key + GoTrue admin API + PostgREST). Idempotent.
 *   node scripts/seed-all.mjs [--only=accounts,doctors,prompts]
 * Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the environment or ../.env. Never prints keys.
 *   accounts : patient|doctor|admin|developer@sihat.com / password123 (TEST_ACCOUNT_PASSWORD) with the right profile role
 *   doctors  : the 6 realistic demo doctors (approved, full directory profile)
 *   prompts  : db/seed-prompts.json -> system_prompts(role, prompt_text)
 * --via=sql : seed through the Management API SQL endpoint (PAT) instead of GoTrue/PostgREST — the only route that works while
 *             the project's data plane answers HTTP 402 (e.g. exceed_egress_quota) — inserts auth.users/identities directly.
 * (scripts/seed-test-accounts.sh and scripts/seed-doctors.sh are thin wrappers around this file.)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function envFile() {
  const out = {}; const p = join(ROOT, ".env");
  if (!existsSync(p)) return out;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  return out;
}
const E = { ...envFile(), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("SUPABASE_") || k === "TEST_ACCOUNT_PASSWORD")) };
const URL_ = E.SUPABASE_URL, KEY = E.SUPABASE_SERVICE_ROLE_KEY;
const VIA_SQL = process.argv.includes("--via=sql");
if (!VIA_SQL && (!URL_ || !KEY)) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"); process.exit(1); }
const PW = E.TEST_ACCOUNT_PASSWORD || "password123";
const only = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const want = (n) => only.length === 0 || only.includes(n);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function call(method, path, body, extra = {}) {
  const r = await fetch(URL_ + path, { method, headers: { ...H, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, ok: r.ok, json, text };
}
async function findUserId(email) {
  for (let page = 1; page < 20; page++) {
    const r = await call("GET", `/auth/v1/admin/users?page=${page}&per_page=200`);
    const users = r.json?.users || [];
    const u = users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (users.length < 200) return "";
  }
  return "";
}
/** create-or-update a confirmed auth user; returns its id */
async function ensureUser(email, name, role) {
  const c = await call("POST", "/auth/v1/admin/users", { email, password: PW, email_confirm: true, user_metadata: { full_name: name, role } });
  if (c.ok && c.json?.id) return c.json.id;
  const id = await findUserId(email);
  if (!id) throw new Error(`cannot create/find ${email}: ${c.status} ${c.text.slice(0, 200)}`);
  await call("PUT", `/auth/v1/admin/users/${id}`, { password: PW, email_confirm: true, user_metadata: { full_name: name, role } });
  return id;
}
const upsertProfile = (row) => call("POST", "/rest/v1/profiles?on_conflict=id", row, { Prefer: "resolution=merge-duplicates,return=minimal" });

let failed = 0;
const ACCOUNTS = [["patient@sihat.com", "patient", "Test Patient"], ["doctor@sihat.com", "doctor", "Test Doctor"], ["admin@sihat.com", "admin", "Test Admin"], ["developer@sihat.com", "developer", "Test Developer"]];
const report = (label, ok, extra = "") => { if (!ok) failed++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${extra}`); };

if (want("accounts")) {
  for (const [email, role, name] of VIA_SQL ? [] : ACCOUNTS) {
    try {
      const id = await ensureUser(email, name, role);
      const row = { id, email, full_name: name, role };
      if (role === "doctor") Object.assign(row, { is_approved: true, specialty: "General TCM 中医全科", bio: "Seeded demo doctor", years_experience: 12 });
      const p = await upsertProfile(row);
      report(`account ${email} (${role})`, p.ok, `profile HTTP ${p.status}`);
    } catch (e) { report(`account ${email}`, false, e.message); }
  }
}

const DOCTORS = [
  ["dr.lew@sihat.com", "Lew Wen Jyue 刘文傕", "General TCM 全科中医", 22, "B.Med (TCM), Guangzhou UCM · Licensed by MOH Malaysia", "Senior physician focused on constitutional balancing, digestive and chronic-fatigue disorders. Blends classical formulas with practical lifestyle guidance.", "English, 中文, Bahasa Malaysia", "Sihat TCM Centre, Kuala Lumpur", 120],
  ["dr.tan@sihat.com", "Tan Wei Ming 陈伟明", "Acupuncture 针灸", 15, "M.Sc Acupuncture, Beijing UCM", "Pain-management and sports-injury specialist. Combines acupuncture with tui na for musculoskeletal recovery.", "English, 中文", "Wellness Point, Johor Bahru", 60],
  ["dr.lim@sihat.com", "Lim Siew Hoon 林秀云", "Gynaecology 妇科", 18, "B.Sc TCM (UiTM) · Cert. TCM Gynaecology", "Women's health and fertility support; menstrual and menopausal pattern regulation with gentle herbal therapy.", "English, 中文, 客家话", "Harmony TCM Clinic, Penang", 180],
  ["dr.nurul@sihat.com", "Nurul Aina Rahman", "Herbal Medicine 中药", 10, "Dip. TCM, INTI · Herbal Pharmacology Cert.", "Herbal-formula tailoring for chronic conditions, allergies and skin patterns. Warm, patient-centred consultations.", "Bahasa Malaysia, English", "Klinik Herba Sihat, Shah Alam", 90],
  ["dr.wong@sihat.com", "Wong Mei Ling 黄美玲", "Paediatric TCM 儿科", 12, "B.Med (TCM), Nanjing UCM", "Gentle paediatric care — appetite, sleep, immunity and growth support for children using mild formulas and tui na.", "中文, English", "Little Sprout TCM, Ipoh", 45],
  ["dr.raj@sihat.com", "Rajesh Kumar", "Tui Na 推拿 · 正骨", 8, "Dip. Tui Na & Manual Therapy", "Manual therapy for posture correction, neck/shoulder tension and stress relief. Hands-on, results-driven.", "English, Tamil, Bahasa Malaysia", "Balance Bodyworks, Petaling Jaya", 75],
];
if (want("doctors")) {
  for (const [email, name, specialty, years, qualification, bio, languages, clinic, art] of VIA_SQL ? [] : DOCTORS) {
    try {
      const id = await ensureUser(email, name, "doctor");
      const p = await upsertProfile({ id, email, role: "doctor", is_approved: true, full_name: name, specialty, years_experience: years, qualification, bio, languages, clinic, avg_response_time: art });
      report(`doctor ${email}`, p.ok, `profile HTTP ${p.status}`);
    } catch (e) { report(`doctor ${email}`, false, e.message); }
  }
}

if (VIA_SQL) {
  const { sql } = await import("../db/mgmt.mjs");
  const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
  const stmts = [];
  const user = (email, name, role, extra) => stmts.push(`
do $$ declare uid uuid; begin
  select id into uid from auth.users where lower(email) = lower(${q(email)});
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', ${q(email)}, extensions.crypt(${q(PW)}, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', ${q(name)}, 'role', ${q(role)}, 'email_verified', true),
      now(), now(), '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', ${q(email)}, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = extensions.crypt(${q(PW)}, extensions.gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()) where id = uid;
  end if;
  insert into public.profiles (id, email, full_name, role) values (uid, ${q(email)}, ${q(name)}, ${q(role)}) on conflict (id) do nothing;
  update public.profiles set email = ${q(email)}, full_name = ${q(name)}, role = ${q(role)}${extra} where id = uid;
end $$;`);
  if (want("accounts")) for (const [email, role, name] of ACCOUNTS) user(email, name, role, role === "doctor" ? ", is_approved = true, specialty = 'General TCM 中医全科', bio = 'Seeded demo doctor', years_experience = 12" : "");
  if (want("doctors")) for (const [email, name, specialty, years, qualification, bio, languages, clinic, art] of DOCTORS)
    user(email, name, "doctor", `, is_approved = true, specialty = ${q(specialty)}, years_experience = ${years}, qualification = ${q(qualification)}, bio = ${q(bio)}, languages = ${q(languages)}, clinic = ${q(clinic)}, avg_response_time = ${art}`);
  if (want("prompts")) for (const [role, text] of Object.entries(JSON.parse(readFileSync(join(ROOT, "db", "seed-prompts.json"), "utf8"))))
    stmts.push(`insert into public.system_prompts (role, prompt_text, updated_at) values (${q(role)}, ${q(text)}, now()) on conflict (role) do update set prompt_text = excluded.prompt_text, updated_at = now();`);
  const r = await sql(stmts.join(";\n"));
  report(`sql seed (${stmts.length} statements)`, r.ok, `HTTP ${r.status}${r.ok ? "" : " " + r.text.slice(0, 400)}`);
  process.exit(failed ? 1 : 0);
}

if (want("prompts")) {
  const prompts = JSON.parse(readFileSync(join(ROOT, "db", "seed-prompts.json"), "utf8"));
  const rows = Object.entries(prompts).map(([role, prompt_text]) => ({ role, prompt_text, updated_at: new Date().toISOString() }));
  const r = await call("POST", "/rest/v1/system_prompts?on_conflict=role", rows, { Prefer: "resolution=merge-duplicates,return=minimal" });
  report(`system_prompts x${rows.length}`, r.ok, `HTTP ${r.status}${r.ok ? "" : " " + r.text.slice(0, 200)}`);
}
process.exit(failed ? 1 : 0);
