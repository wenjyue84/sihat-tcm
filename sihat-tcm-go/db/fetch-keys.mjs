/**
 * Fetch the project's API keys via the Management API and write them (never printing them) to
 *   - ../.env (gitignored): replaces the SUPABASE_* lines, keeps the rest
 *   - 3-resources/credentials/sihat-tcm-supabase-2.txt (KEY=VALUE lines)
 *   node db/fetch-keys.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REF, mgmt } from "./mgmt.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CRED = "C:/Users/Jyue/Documents/3-resources/credentials/sihat-tcm-supabase-2.txt";
const r = await mgmt("GET", `/v1/projects/${REF}/api-keys?reveal=true`);
if (!r.ok || !Array.isArray(r.json)) { console.error("api-keys failed", r.status, r.text.slice(0, 200)); process.exit(1); }
const pick = (name) => (r.json.find((k) => k.name === name && k.api_key) || {}).api_key;
const vals = { SUPABASE_URL: `https://${REF}.supabase.co`, SUPABASE_ANON_KEY: pick("anon"), SUPABASE_SERVICE_ROLE_KEY: pick("service_role") };
for (const [k, v] of Object.entries(vals)) if (!v) { console.error("missing", k); process.exit(1); }

const envPath = join(ROOT, ".env");
const old = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
const keep = old.filter((l) => l.trim() !== "" && !/^\s*SUPABASE_(URL|ANON_KEY|SERVICE_ROLE_KEY)\s*=/.test(l));
writeFileSync(envPath, [...keep, ...Object.entries(vals).map(([k, v]) => `${k}=${v}`)].join("\n") + "\n");
writeFileSync(CRED, `# sihat-tcm Supabase project ${REF} (sihat-tcm-2, ap-southeast-1) — created 2026-10-10\n` + Object.entries(vals).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
console.log("wrote .env and", CRED, "keys:", Object.keys(vals).join(","), "lengths:", Object.values(vals).map((v) => v.length).join(","));
