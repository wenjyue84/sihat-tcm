/** Supabase Management API helper (PAT from 3-resources/credentials/supabase-pat.txt). Never prints the PAT. */
import { readFileSync } from "node:fs";
export const REF = process.env.SUPABASE_PROJECT_REF || "wgxufplbcncsjwdhtuxd";
const PAT_FILE = process.env.SUPABASE_PAT_FILE || "C:/Users/Jyue/Documents/3-resources/credentials/supabase-pat.txt";
export function pat() {
  const m = readFileSync(PAT_FILE, "utf8").match(/sbp_[A-Za-z0-9]+/);
  if (!m) throw new Error("no sbp_ token in " + PAT_FILE);
  return m[0];
}
export async function mgmt(method, path, body) {
  const r = await fetch("https://api.supabase.com" + path, {
    method,
    headers: { Authorization: "Bearer " + pat(), "Content-Type": "application/json", "User-Agent": "sihat-tcm-go-db/1.0" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, ok: r.ok, json, text };
}
export const sql = (query) => mgmt("POST", `/v1/projects/${REF}/database/query`, { query });
