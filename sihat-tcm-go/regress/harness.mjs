/**
 * harness.mjs — the tiny contract every regression suite in regress/suites/*.mjs follows.
 *
 *   export default {
 *     name: "security",                 // unique, == filename without .mjs
 *     doc: "one line shown by `aci describe`",
 *     needs: "stack" | "none",          // "stack": a running app (own hermetic one, or --base)
 *     mutating: false,                  // true = creates rows → refused on non-local --base
 *     costly: false,                    // true = real model calls when --ai=pc (excluded from `quick`)
 *     async run(t) { t.check("label", cond, "expected vs actual detail"); }
 *   }
 *
 * `t` (see makeT): base, stack, check, skip, api, get, postJSON, login, signup, elog, dbBase, aiBase.
 * Checks never throw; an exception inside run() becomes a single `<suite>.suite_error` failure.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { login, signup } from "./journey.mjs";
import { longFetch } from "./http.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export async function loadSuites() {
  const dir = join(here, "suites");
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".mjs")).sort()) {
    const mod = (await import(pathToFileURL(join(dir, f)).href)).default;
    if (!mod || !mod.name || typeof mod.run !== "function") throw new Error(`suite ${f} must default-export {name, run}`);
    if (mod.name !== f.replace(/\.mjs$/, "")) throw new Error(`suite ${f}: name "${mod.name}" must equal the filename`);
    out[mod.name] = mod;
  }
  return out;
}

export function makeT({ base, stack, suite, elog = (m) => process.stderr.write(m + "\n") }) {
  const results = [];
  const t = {
    base, stack, suite,
    dbBase: stack?.dbBase, aiBase: stack?.aiBase, dbMode: stack?.db, hasDb: !!(stack?.dbBase || stack?.dbReal),
    // Direct DB access for seeding/inspection: the fake's REST + /__fake/table, or the REAL project via the service key.
    async dbInsert(table, rows) {
      try {
        const r = stack?.dbReal
          ? await fetch(`${stack.dbReal.url}/rest/v1/${table}`, { method: "POST", headers: { apikey: stack.dbReal.key, Authorization: "Bearer " + stack.dbReal.key, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(rows) })
          : await fetch(`${stack.dbBase}/rest/v1/${table}`, { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation", ...(stack.dbKey ? { apikey: stack.dbKey, Authorization: "Bearer " + stack.dbKey } : {}) }, body: JSON.stringify(rows) });
        return await r.json();
      } catch (e) { return { error: String(e.message || e) }; }
    },
    async dbTable(name) {
      try {
        if (stack?.dbReal) return await (await fetch(`${stack.dbReal.url}/rest/v1/${name}?select=*&limit=5000`, { headers: { apikey: stack.dbReal.key, Authorization: "Bearer " + stack.dbReal.key } })).json();
        if (stack?.dbBase) return await (await fetch(`${stack.dbBase}/__fake/table/${name}`)).json();
      } catch { /* unreachable */ }
      return null;
    },
    elog,
    results,
    check(label, ok, detail) {
      const full = label.startsWith(suite + ".") ? label : `${suite}.${label}`;
      results.push({ label: full, ok: !!ok, detail: ok ? "ok" : detail || "failed" });
      return !!ok;
    },
    skip(label, detail) { results.push({ label: `${suite}.${label}`, skipped: true, detail }); },
    async api(path, { method = "GET", body, token, headers = {}, raw = false } = {}) {
      const h = { ...headers };
      if (body !== undefined && !raw) h["Content-Type"] = h["Content-Type"] || "application/json";
      if (token) h["Authorization"] = "Bearer " + token;
      const res = await longFetch(base + path, { method, headers: h, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
      const text = await res.text();
      let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
      return { status: res.status, text, json, headers: res.headers, setCookie: res.headers.get("set-cookie") || "" };
    },
    get(path, o) { return t.api(path, o); },
    postJSON(path, body, o) { return t.api(path, { method: "POST", body, ...o }); },
    // fresh identity helpers share the journey ctx implementation (own rate-limit bucket per call via ip)
    async login(email, password, ip) { const c = { api: (p, o) => t.api(p, { ...o, headers: { ...(o?.headers || {}), ...(ip ? { "X-Forwarded-For": ip } : {}) } }) }; return login(c, email, password); },
    async signup(email, name, role, extra, ip) { const c = { api: (p, o) => t.api(p, { ...o, headers: { ...(o?.headers || {}), ...(ip ? { "X-Forwarded-For": ip } : {}) } }) }; return signup(c, email, name, role, extra); },
    uniq: () => Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    ip: () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  };
  return t;
}

/** Run one suite, returning its result rows. */
export async function runSuite(suite, ctx) {
  const t = makeT({ ...ctx, suite: suite.name });
  try { await suite.run(t); } catch (e) { t.check("suite_error", false, String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e)); }
  return t.results;
}
