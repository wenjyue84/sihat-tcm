#!/usr/bin/env node
/**
 * fake-google - a hermetic stand-in for the two Google surfaces the health integration talks to:
 *   OAuth 2.0:   POST /token (authorization_code + PKCE S256 check, refresh_token), POST /revoke
 *   Health API:  GET  /v4/users/me/dataTypes/<kebab-case-type>/dataPoints  (shapes copied from Jay's working
 *                jay-health/fitbit/fetch.py client: daily-* summaries, weight, heart-rate, steps)
 * Exists so the ACI can drive the whole OAuth + sync flow without Google, a browser, or a real account.
 *
 *   node regress/fake-google.mjs [--port=18900]
 *   app: GOOGLE_HEALTH_AUTH_URL=http://127.0.0.1:18900/auth GOOGLE_HEALTH_TOKEN_URL=.../token GOOGLE_HEALTH_REVOKE_URL=.../revoke
 *        GOOGLE_HEALTH_API_BASE=.../v4   (honoured outside APP_ENV=production only)
 *
 * Test hooks: GET /__fake/health | POST /__fake/authorize {challenge} -> {code} (plays the consent screen)
 *             POST /__fake/config {failGrant, failType} | GET /__fake/state -> {revoked, hits, refreshTokens}
 * It is a test double: it proves the app's protocol handling, NOT that Google still serves these shapes (verify live once).
 */
import http from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

export const GOOGLE_FAKE = { clientId: "aci-client", clientSecret: "aci-secret" };

export function createFakeGoogle() {
  let codes, refreshTokens, revoked, hits, cfg;
  const reset = () => { codes = new Map(); refreshTokens = new Set(); revoked = []; hits = []; cfg = { failGrant: false, failType: "" }; };
  reset();
  const readBody = (req) => new Promise((res) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => res(Buffer.concat(c).toString())); });
  const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  const b64url = (buf) => buf.toString("base64url");
  const SCOPE = "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";

  const dataPoints = (type, url, access) => {
    const day = new Date(Date.now() - 24 * 3600e3);
    day.setUTCHours(0, 0, 0, 0); // anchor on UTC midnight: from 21:00 UTC on, "now - 24h + 3h" crossed midnight and split the FITBIT steps over two civil days (inserted 8, steps != 5500)
    const date = { year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate() };
    const iso = (h) => new Date(day.getTime() + h * 3600e3).toISOString().replace(/\.\d{3}Z$/, "Z");
    switch (type) {
      case "daily-resting-heart-rate": return { dataPoints: [{ dailyRestingHeartRate: { date, beatsPerMinute: "61" } }] };
      case "daily-heart-rate-variability": return { dataPoints: [{ dailyHeartRateVariability: { date, averageHeartRateVariabilityMilliseconds: 33.4 } }] };
      case "daily-oxygen-saturation": return { dataPoints: [{ dailyOxygenSaturation: { date, averagePercentage: 95.5, lowerBoundPercentage: 90.1 } }] };
      case "daily-respiratory-rate": return { dataPoints: [{ dailyRespiratoryRate: { date, breathsPerMinute: 13.2 } }] };
      case "weight": return { dataPoints: [{ weight: { sampleTime: { physicalTime: iso(10) }, weightGrams: 71200 } }] };
      case "heart-rate":
        return url.searchParams.get("pageToken")
          ? { dataPoints: [{ heartRate: { sampleTime: { physicalTime: iso(5) }, beatsPerMinute: "77" } }, { heartRate: { sampleTime: { physicalTime: iso(6) }, beatsPerMinute: "0" } }] }
          : { dataPoints: [{ heartRate: { sampleTime: { physicalTime: iso(1) }, beatsPerMinute: "70" } }], nextPageToken: "p2" };
      case "steps": return { dataPoints: [
        { dataSource: { platform: "FITBIT" }, steps: { interval: { startTime: iso(2) }, count: "4000" } },
        { dataSource: { platform: "FITBIT" }, steps: { interval: { startTime: iso(3) }, count: "1500" } },
        { dataSource: { platform: "HEALTH_KIT" }, steps: { interval: { startTime: iso(2) }, count: "9000" } }] };
      default: return null;
    }
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (p === "/__fake/health") return json(res, 200, { ok: true, fake: "google" });
    if (p === "/__fake/reset" && req.method === "POST") { reset(); return json(res, 200, { ok: true }); }
    if (p === "/__fake/state") return json(res, 200, { revoked, hits, refreshTokens: [...refreshTokens] });
    if (p === "/__fake/config" && req.method === "POST") { Object.assign(cfg, JSON.parse((await readBody(req)) || "{}")); return json(res, 200, cfg); }
    if (p === "/__fake/authorize" && req.method === "POST") {
      const b = JSON.parse((await readBody(req)) || "{}");
      const code = "code-" + randomBytes(6).toString("hex");
      codes.set(code, b.challenge || "");
      return json(res, 200, { code });
    }
    if (p === "/auth") { res.writeHead(200, { "Content-Type": "text/plain" }); return res.end("fake google consent screen"); }
    if (p === "/token" && req.method === "POST") {
      const f = new URLSearchParams(await readBody(req));
      if (f.get("grant_type") === "authorization_code") {
        const want = codes.get(f.get("code"));
        codes.delete(f.get("code"));
        const challenge = b64url(createHash("sha256").update(f.get("code_verifier") || "").digest());
        if (f.get("client_id") !== GOOGLE_FAKE.clientId || f.get("client_secret") !== GOOGLE_FAKE.clientSecret || want === undefined || want !== challenge)
          return json(res, 400, { error: "invalid_grant" });
        const rt = "1//aci-refresh-" + randomBytes(8).toString("hex");
        refreshTokens.add(rt);
        return json(res, 200, { access_token: "ya29.aci-access", refresh_token: rt, expires_in: 3600, scope: SCOPE, token_type: "Bearer" });
      }
      if (f.get("grant_type") === "refresh_token") {
        if (cfg.failGrant || !refreshTokens.has(f.get("refresh_token"))) return json(res, 400, { error: "invalid_grant", error_description: "Token has been expired or revoked." });
        return json(res, 200, { access_token: "ya29.aci-access", expires_in: 3600, token_type: "Bearer" });
      }
      return json(res, 400, { error: "unsupported_grant_type" });
    }
    if (p === "/revoke" && req.method === "POST") {
      const f = new URLSearchParams(await readBody(req));
      revoked.push(f.get("token")); refreshTokens.delete(f.get("token"));
      return json(res, 200, {});
    }
    const m = p.match(/^\/v4\/users\/me\/dataTypes\/([a-z-]+)\/dataPoints$/);
    if (m) {
      if (req.headers.authorization !== "Bearer ya29.aci-access") return json(res, 401, { error: { code: 401 } });
      hits.push(m[1]);
      if (cfg.failType === m[1]) return json(res, 400, { error: { code: 400, message: "datatype unavailable" } });
      const d = dataPoints(m[1], url);
      return d ? json(res, 200, d) : json(res, 404, { error: { code: 404 } });
    }
    json(res, 404, { error: "fake-google: no route " + req.method + " " + p });
  });
  return { server, reset };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = parseInt((process.argv.find((a) => a.startsWith("--port=")) || "--port=18900").split("=")[1], 10);
  createFakeGoogle().server.listen(port, "127.0.0.1", () => process.stderr.write(`fake-google on http://127.0.0.1:${port}\n`));
}
