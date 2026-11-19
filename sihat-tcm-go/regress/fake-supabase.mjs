#!/usr/bin/env node
/**
 * fake-supabase — a hermetic, in-memory stand-in for the subset of Supabase the Go
 * server actually uses (GoTrue password auth + PostgREST eq/gt/gte/lt/lte/in/is/cs,
 * order, limit, offset, select). Exists because the real project (free tier, Vercel
 * org) auto-pauses and — as of 2026-10-09 — cannot be restored ("organization is under
 * service restrictions"), which would otherwise make every e2e test impossible.
 *
 *   node regress/fake-supabase.mjs [--port=54329]
 *   app: SUPABASE_URL=http://127.0.0.1:54329 SUPABASE_ANON_KEY=fake SUPABASE_SERVICE_ROLE_KEY=fake
 *
 * BLIND SPOTS (say so in every verdict that uses this): no Row-Level-Security, no real
 * JWT signing, no FK/constraint/column validation, no email delivery, schemaless tables.
 * Anything that depends on those must be verified against the real project.
 *
 * Test hooks: GET /__fake/health · POST /__fake/reset · GET /__fake/table/<name> ·
 *             GET /__fake/recovery?email=…  (latest recovery token_hash)
 */
import http from "node:http";
import { randomUUID, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

const SEED_PW = "password123";
const SEED = [
  ["patient@sihat.com", "patient", "Demo Patient"],
  ["doctor@sihat.com", "doctor", "Dr Demo"],
  ["admin@sihat.com", "admin", "Demo Admin"],
  ["developer@sihat.com", "developer", "Demo Developer"],
];

export function createFakeSupabase() {
  let users, tokens, tables, recoveries, seq;
  const reset = () => {
    users = new Map(); tokens = new Map(); tables = new Map(); recoveries = new Map(); seq = new Map();
    for (const [email, role, name] of SEED) {
      const id = randomUUID();
      users.set(email, { id, email, password: SEED_PW, user_metadata: { role, full_name: name } });
      tbl("profiles").push({ id, email, role, full_name: name, created_at: new Date().toISOString(), ...(role === "doctor" ? { is_approved: true, specialty: "General TCM 中医全科", bio: "Seeded demo doctor", years_experience: 12 } : {}) });
    }
  };
  const tbl = (n) => { if (!tables.has(n)) tables.set(n, []); return tables.get(n); };
  const nextId = (n) => { const v = (seq.get(n) || 0) + 1; seq.set(n, v); return v; };
  const NUMERIC_ID = new Set(["admin_settings", "system_logs", "system_errors", "system_metrics", "notification_history", "system_prompts"]);

  const mkToken = (u) => {
    const payload = { sub: u.id, email: u.email, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, user_metadata: u.user_metadata };
    const t = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify(payload)).toString("base64url") + "." + randomBytes(6).toString("hex");
    tokens.set(t, u.email);
    return t;
  };
  const userJSON = (u) => ({ id: u.id, email: u.email, role: "authenticated", aud: "authenticated", user_metadata: u.user_metadata, created_at: u.created_at || new Date().toISOString() });
  const session = (u) => ({ access_token: mkToken(u), refresh_token: randomBytes(8).toString("hex"), expires_in: 3600, token_type: "bearer", user: userJSON(u) });

  /* ----------------------------- PostgREST ----------------------------- */
  const coerce = (rowVal, s) => {
    if (rowVal === null || rowVal === undefined) return [rowVal, s];
    if (typeof rowVal === "number") return [rowVal, Number(s)];
    if (typeof rowVal === "boolean") return [String(rowVal), s];
    return [String(rowVal), s];
  };
  function matcher(col, expr) {
    const dot = expr.indexOf(".");
    const op = expr.slice(0, dot), val = expr.slice(dot + 1);
    return (row) => {
      const v = row[col];
      if (op === "is") return val === "null" ? v == null : String(v) === val;
      if (op === "in") return val.replace(/^\(|\)$/g, "").split(",").map((x) => x.replace(/^"|"$/g, "")).includes(String(v));
      if (op === "cs") {
        const want = val.replace(/^[{[]|[}\]]$/g, "").split(",").map((x) => x.replace(/^"|"$/g, ""));
        if (Array.isArray(v)) return want.every((w) => v.map(String).includes(w));
        if (v && typeof v === "object") return want.every((w) => JSON.stringify(v).includes(w));
        return want.every((w) => String(v ?? "").includes(w));
      }
      if (op === "ilike" || op === "like") { const re = new RegExp("^" + val.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*|%/g, ".*") + "$", op === "ilike" ? "i" : ""); return re.test(String(v ?? "")); }
      const [a, b] = coerce(v, val);
      if (a == null) return op === "neq";
      switch (op) {
        case "eq": return a === b;
        case "neq": return a !== b;
        case "gt": return a > b;
        case "gte": return a >= b;
        case "lt": return a < b;
        case "lte": return a <= b;
        default: throw new Error("unsupported operator " + op);
      }
    };
  }
  function query(rows, sp) {
    const filters = [];
    for (const [k, v] of sp) {
      if (["select", "order", "limit", "offset"].includes(k)) continue;
      if (k === "or" || k === "and") throw new Error("or/and filters unsupported by fake");
      filters.push(matcher(k, v));
    }
    return rows.filter((r) => filters.every((f) => f(r)));
  }
  const project = (rows, sel) => {
    if (!sel || sel === "*") return rows;
    const cols = sel.split(",").map((c) => c.trim()).filter(Boolean);
    if (cols.includes("*")) return rows;
    return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
  };
  const order = (rows, o) => {
    if (!o) return rows;
    const keys = o.split(",").map((s) => { const [c, d = "asc"] = s.split("."); return [c, d.startsWith("desc") ? -1 : 1]; });
    return [...rows].sort((x, y) => { for (const [c, d] of keys) { const a = x[c], b = y[c]; if (a === b) continue; if (a == null) return 1; if (b == null) return -1; return (a < b ? -1 : 1) * d; } return 0; });
  };
  function withDefaults(name, row) {
    const r = { ...row };
    if (r.id === undefined) r.id = NUMERIC_ID.has(name) ? nextId(name) : randomUUID();
    if (!r.created_at) r.created_at = new Date().toISOString();
    return r;
  }

  /* --------------------------------- http --------------------------------- */
  const readBody = (req) => new Promise((res) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => { const s = Buffer.concat(c).toString(); try { res(s ? JSON.parse(s) : null); } catch { res(undefined); } }); });
  const send = (res, code, obj, extra = {}) => { res.writeHead(code, { "Content-Type": "application/json", ...extra }); res.end(obj === undefined ? "" : JSON.stringify(obj)); };
  const bearer = (req) => (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const userFor = (req) => { const e = tokens.get(bearer(req)); return e ? users.get(e) : null; };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");
      const p = url.pathname;
      /* test hooks */
      if (p === "/__fake/health") return send(res, 200, { ok: true, fake: "supabase", users: users.size });
      if (p === "/__fake/reset" && req.method === "POST") { reset(); return send(res, 200, { ok: true }); }
      if (p.startsWith("/__fake/table/")) return send(res, 200, tbl(p.slice(14)));
      if (p === "/__fake/recovery") return send(res, 200, { token_hash: recoveries.get(url.searchParams.get("email")) || null });

      /* GoTrue */
      if (p === "/auth/v1/signup" && req.method === "POST") {
        const b = await readBody(req);
        if (!b || !b.email || !b.password) return send(res, 400, { code: 400, error_code: "validation_failed", msg: "email and password required" });
        if (String(b.password).length < 6) return send(res, 422, { code: 422, error_code: "weak_password", msg: "Password should be at least 6 characters." });
        const email = String(b.email).toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { code: 400, error_code: "validation_failed", msg: "Unable to validate email address: invalid format" });
        if (users.has(email)) return send(res, 422, { code: 422, error_code: "user_already_exists", msg: "User already registered" });
        const u = { id: randomUUID(), email, password: b.password, user_metadata: b.data || {}, created_at: new Date().toISOString() };
        users.set(email, u);
        // mirrors Supabase's handle_new_user trigger
        tbl("profiles").push({ id: u.id, email, role: u.user_metadata.role || "patient", full_name: u.user_metadata.full_name || u.user_metadata.name || "", created_at: u.created_at });
        return send(res, 200, session(u));
      }
      if (p === "/auth/v1/token" && req.method === "POST") {
        const b = await readBody(req);
        const u = users.get(String(b?.email || "").toLowerCase());
        if (!u || u.password !== b.password) return send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
        return send(res, 200, session(u));
      }
      if (p === "/auth/v1/user") {
        const u = userFor(req);
        if (!u) return send(res, 401, { code: 401, msg: "invalid JWT" });
        if (req.method === "PUT") { const b = await readBody(req); if (b?.password) u.password = b.password; return send(res, 200, userJSON(u)); }
        return send(res, 200, userJSON(u));
      }
      if (p === "/auth/v1/recover" && req.method === "POST") {
        const b = await readBody(req); const e = String(b?.email || "").toLowerCase();
        if (users.has(e)) recoveries.set(e, randomBytes(12).toString("hex"));
        return send(res, 200, {});
      }
      if (p === "/auth/v1/verify" && req.method === "POST") {
        const b = await readBody(req);
        for (const [email, th] of recoveries) if (th === b?.token_hash) { recoveries.delete(email); return send(res, 200, session(users.get(email))); }
        return send(res, 400, { code: 400, error_code: "otp_expired", msg: "Email link is invalid or has expired" });
      }

      /* PostgREST */
      const m = p.match(/^\/rest\/v1\/([^/]+)$/);
      if (m) {
        const name = decodeURIComponent(m[1]);
        const rows = tbl(name);
        const sp = url.searchParams;
        if (req.method === "GET") {
          let out = order(query(rows, sp), sp.get("order"));
          const off = parseInt(sp.get("offset") || "0", 10); if (off) out = out.slice(off);
          const lim = parseInt(sp.get("limit") || "0", 10); if (lim) out = out.slice(0, lim);
          return send(res, 200, project(out, sp.get("select")));
        }
        if (req.method === "POST") {
          const b = await readBody(req);
          if (b === undefined || b === null) return send(res, 400, { code: "PGRST102", message: "Empty or invalid json" });
          const merge = /merge-duplicates/.test(req.headers.prefer || "");
          const ignore = /ignore-duplicates/.test(req.headers.prefer || "");
          const onConflict = (sp.get("on_conflict") || "").split(",").filter(Boolean);   // PostgREST ?on_conflict=a,b (health_readings dedupe)
          const made = [];
          for (const item of Array.isArray(b) ? b : [b]) {
            let prev = null;
            if ((merge || ignore) && onConflict.length) prev = rows.find((r) => onConflict.every((c) => String(r[c]) === String(item[c])));
            else if (merge && item.id !== undefined) prev = rows.find((r) => r.id === item.id);
            if (prev && ignore) continue;                  // ignore-duplicates: skipped rows are not returned
            if (prev) { Object.assign(prev, item); made.push(prev); continue; }
            const r = withDefaults(name, item); rows.push(r); made.push(r);
          }
          return send(res, 201, made);
        }
        if (req.method === "PATCH") {
          const b = await readBody(req);
          const hit = query(rows, sp);
          for (const r of hit) Object.assign(r, b);
          return send(res, 200, hit);
        }
        if (req.method === "DELETE") {
          const hit = new Set(query(rows, sp));
          tables.set(name, rows.filter((r) => !hit.has(r)));
          return send(res, 204);
        }
      }
      send(res, 404, { message: "fake-supabase: no route " + req.method + " " + p });
    } catch (e) {
      send(res, 400, { code: "FAKE", message: String(e.message || e) });
    }
  });
  reset();
  return { server, reset };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = parseInt((process.argv.find((a) => a.startsWith("--port=")) || "--port=54329").split("=")[1], 10);
  const { server } = createFakeSupabase();
  server.listen(port, "127.0.0.1", () => process.stderr.write(`fake-supabase on http://127.0.0.1:${port}\n`));
}
