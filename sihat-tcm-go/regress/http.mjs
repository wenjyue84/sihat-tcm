/**
 * http.mjs — fetch-shaped client with NO 300 s headers timeout.
 * Node's built-in fetch (undici) aborts a request that has not produced response headers within 300 s;
 * a real-model consult through sihat-listener (opus/sonnet/haiku) can legitimately take that long
 * (the app buffers nothing, but the first byte only arrives when the model finishes). node:http has no such limit.
 */
import http from "node:http";
import https from "node:https";

export function longFetch(url, { method = "GET", headers = {}, body, timeoutMs = 20 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const payload = body === undefined ? undefined : Buffer.from(body);
    const req = lib.request(
      { protocol: u.protocol, hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers: { ...(payload ? { "Content-Length": payload.length } : {}), ...headers } },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const h = new Map(Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(", ") : String(v)]));
          resolve({
            status: res.statusCode,
            headers: { get: (k) => h.get(String(k).toLowerCase()) ?? null },
            text: async () => buf.toString("utf8"),
          });
        });
        res.on("error", reject);
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`no response within ${timeoutMs}ms`)));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}
