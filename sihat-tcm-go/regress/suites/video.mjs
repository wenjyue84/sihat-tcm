/**
 * video — the public promo-video surface: GET /video (page) and GET|HEAD /media/{name} (Range-capable file server).
 *
 * The stack (regress/stack.mjs) sets MEDIA_DIR to the repo's media/ when it exists (ACI_MEDIA_DIR overrides, e.g. an empty dir).
 * The suite derives its expectation from the same directory, so it passes in BOTH states:
 *   file present  -> 200/206 + Content-Length + Range semantics + the player markup
 *   file absent   -> 404 + the page shows the friendly "not available" message and NO <video>/download link
 * Traversal probes are sent as RAW bytes on a socket (nothing normalises %2e%2e, backslashes, NUL).
 */
import net from "node:net";
import tls from "node:tls";
import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = "sihat-tcm-demo.mp4";

function rawReq(base, rawPath, { method = "GET", headers = {} } = {}) {
  const u = new URL(base);
  return new Promise((resolveP) => {
    const sock = u.protocol === "https:" ? tls.connect({ host: u.hostname, port: parseInt(u.port || "443", 10), servername: u.hostname }) : net.connect({ host: u.hostname, port: parseInt(u.port || "80", 10) });
    const chunks = [];
    let done = false;
    const fin = (err) => {
      if (done) return; done = true; sock.destroy();
      const buf = Buffer.concat(chunks);
      const i = buf.indexOf("\r\n\r\n");
      const head = (i >= 0 ? buf.subarray(0, i) : buf).toString("latin1");
      const body = i >= 0 ? buf.subarray(i + 4) : Buffer.alloc(0);
      const m = head.match(/^HTTP\/1\.[01] (\d{3})/);
      const hs = {};
      for (const l of head.split("\r\n").slice(1)) { const k = l.indexOf(":"); if (k > 0) hs[l.slice(0, k).toLowerCase()] = l.slice(k + 1).trim(); }
      resolveP({ status: m ? +m[1] : 0, headers: hs, body, err: err ? String(err) : "" });
    };
    sock.setTimeout(8000, () => fin("timeout"));
    sock.on("data", (d) => chunks.push(d));
    sock.on("end", () => fin());
    sock.on("close", () => fin());
    sock.on("error", (e) => fin(e));
    const hdr = { Host: u.host, Connection: "close", "X-Forwarded-For": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...headers };
    sock.on("connect", () => {
      sock.write(Buffer.from(`${method} ${rawPath} HTTP/1.1\r\n` + Object.entries(hdr).map(([k, v]) => `${k}: ${v}`).join("\r\n") + "\r\n\r\n", "latin1"));
    });
  });
}

export default {
  name: "video", needs: "stack", mutating: false, costly: false,
  doc: "promo video: /video page markup + chapters + credits, /media Range (206/416) + HEAD + Content-Length, raw-path traversal rejected, friendly 404 state when the file is absent",
  async run(t) {
    const mediaDir = process.env.ACI_MEDIA_DIR || join(ROOT, "media");
    const local = /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(t.base);
    const onDisk = existsSync(join(mediaDir, FILE)) ? statSync(join(mediaDir, FILE)).size : 0;
    // against a remote --base we cannot see its disk: derive the state from the server's own answer instead
    const head = await rawReq(t.base, "/media/" + FILE, { method: "HEAD" });
    const present = local ? onDisk > 0 : head.status === 200;
    t.check("state.matches_disk", head.status === (present ? 200 : 404), `HEAD /media/${FILE} -> ${head.status}, expected ${present ? 200 : 404} (MEDIA_DIR=${mediaDir}, ${onDisk} bytes)`);

    /* ---------- the page ---------- */
    const page = await t.get("/video");
    const html = page.text;
    t.check("page.200_html", page.status === 200 && /^text\/html/i.test(page.headers.get("content-type") || ""), `status=${page.status} ct=${page.headers.get("content-type")}`);
    t.check("page.indexable", !/noindex/i.test(html) && !/noindex/i.test(page.headers.get("x-robots-tag") || ""), "/video must not be noindex (it is a public, indexable page)");
    t.check("page.site_header_footer", /class="site-header"/.test(html) && /class="site-footer"/.test(html), "site header/footer partials missing");
    t.check("page.bilingual", /class="zh"/.test(html) && /class="en"/.test(html), "zh/en spans missing");
    t.check("page.chapters", (html.match(/data-seek="/g) || []).length >= 10 && /data-seek="0\.00"/.test(html) && />0:00</.test(html), "chapter list (0:00 + >=10 seek buttons) missing");
    const seeks = [...html.matchAll(/data-seek="([\d.]+)"/g)].map((m) => parseFloat(m[1]));
    t.check("page.chapters_increasing_within_video", seeks.every((v, i) => i === 0 || v > seeks[i - 1]) && seeks[seeks.length - 1] < 164.2, `seeks=${seeks.join(",")}`);
    t.check("page.credits_cc_by", /id="video-credits"/.test(html) && /CC BY 3\.0/.test(html) && /Wikimedia Commons/.test(html), "CC-BY credits block missing");
    t.check("page.share_whatsapp", /href="https:\/\/wa\.me\/\?text=[^"]+"/.test(html) && /video/.test((html.match(/wa\.me\/\?text=([^"]+)"/) || [])[1] || ""), "WhatsApp share link missing");
    if (present) {
      t.check("page.player_markup", /<video id="promo" controls preload="metadata"/.test(html) && /poster="\/static\/img\/art\/video-poster\.webp\?v=\d+"/.test(html) && /<source src="\/media\/sihat-tcm-demo\.mp4" type="video\/mp4">/.test(html), "video element/poster/source missing");
      t.check("page.download_link", /href="\/media\/sihat-tcm-demo\.mp4" download/.test(html), "download link missing");
    } else {
      t.check("page.friendly_when_missing", /not available on this server/.test(html) && !/<video[\s>]/.test(html) && !/id="video-download"/.test(html), "missing file must show the friendly message and no broken player/download link");
    }
    const poster = await t.get("/static/img/art/video-poster.webp");
    t.check("page.poster_served", poster.status === 200, `poster status=${poster.status}`);
    t.check("nav.header_and_footer_links", /id="nav-video-link"/.test((await t.get("/")).text) && /id="footer-video-link"/.test((await t.get("/login")).text), "Video link missing in the shared header/footer");
    const demo = await t.get("/demo");
    t.check("demo.has_video_card", /id="demo-video-card"[^>]*href="\/video"|href="\/video"[^>]*id="demo-video-card"/.test(demo.text) || (/id="demo-video-card"/.test(demo.text) && /href="\/video"/.test(demo.text)), "/demo lacks the video card linking to /video");

    /* ---------- robots / sitemap coherence ---------- */
    const rb = await t.get("/robots.txt");
    t.check("robots.allows_video", !/^Disallow:\s*\/video/mi.test(rb.text) && !/^Disallow:\s*\/media/mi.test(rb.text), `robots.txt blocks the video: ${JSON.stringify(rb.text.slice(0, 200))}`);
    const sm = await t.get("/sitemap.xml");
    t.check("sitemap.video_iff_file", /\/video</.test(sm.text) === present, `sitemap lists /video=${/\/video</.test(sm.text)} but file present=${present}`);

    /* ---------- /media ---------- */
    if (present) {
      const total = local ? onDisk : parseInt(head.headers["content-length"] || "0", 10);
      t.check("media.head", head.status === 200 && head.body.length === 0 && /^video\/mp4/.test(head.headers["content-type"] || "") && parseInt(head.headers["content-length"], 10) === total, `status=${head.status} ct=${head.headers["content-type"]} cl=${head.headers["content-length"]} want ${total}`);
      t.check("media.cache_and_ranges_advertised", /public/.test(head.headers["cache-control"] || "") && /max-age=86400/.test(head.headers["cache-control"] || "") && head.headers["accept-ranges"] === "bytes", `cache-control=${head.headers["cache-control"]} accept-ranges=${head.headers["accept-ranges"]}`);
      const r0 = await rawReq(t.base, "/media/" + FILE, { headers: { Range: "bytes=0-1" } });
      t.check("media.range_0_1_206", r0.status === 206 && r0.body.length === 2 && r0.headers["content-length"] === "2" && new RegExp(`^bytes 0-1/${total}$`).test(r0.headers["content-range"] || ""), `status=${r0.status} len=${r0.body.length} cr=${r0.headers["content-range"]}`);
      t.check("media.mp4_magic", (await rawReq(t.base, "/media/" + FILE, { headers: { Range: "bytes=4-7" } })).body.toString("latin1") === "ftyp", "bytes 4-7 of an MP4 must be 'ftyp'");
      const mid = Math.floor(total / 2);
      const r1 = await rawReq(t.base, "/media/" + FILE, { headers: { Range: `bytes=${mid}-${mid + 99999}` } });
      t.check("media.range_mid_206_length", r1.status === 206 && r1.body.length === 100000 && r1.headers["content-length"] === "100000", `status=${r1.status} len=${r1.body.length} cl=${r1.headers["content-length"]}`);
      const r2 = await rawReq(t.base, "/media/" + FILE, { headers: { Range: `bytes=${total - 10}-` } });
      t.check("media.range_open_ended_tail", r2.status === 206 && r2.body.length === 10, `status=${r2.status} len=${r2.body.length}`);
      const r3 = await rawReq(t.base, "/media/" + FILE, { headers: { Range: `bytes=${total + 5}-${total + 10}` } });
      t.check("media.range_unsatisfiable_416", r3.status === 416 && r3.headers["content-range"] === `bytes */${total}`, `status=${r3.status} cr=${r3.headers["content-range"]}`);
      const full = await rawReq(t.base, "/media/" + FILE, { headers: { Range: "bytes=0-" } });
      t.check("media.range_whole_content_length_matches", full.status === 206 && full.body.length === total && full.headers["content-length"] === String(total), `status=${full.status} body=${full.body.length} cl=${full.headers["content-length"]} total=${total}`);
    } else {
      t.skip("media.range", `no ${FILE} in ${mediaDir}: Range checks need the file (the Go unit tests cover Range with a fixture)`);
      const g = await rawReq(t.base, "/media/" + FILE);
      t.check("media.missing_404", g.status === 404, `status=${g.status}`);
    }
    // the poster also goes through /media when someone drops one in: an allowed name that does not exist is a plain 404
    t.check("media.unknown_file_404", (await rawReq(t.base, "/media/nope-" + t.uniq() + ".mp4")).status === 404, "missing allowlisted name must be 404");
    t.check("media.bad_extension_404", (await rawReq(t.base, "/media/notes.txt")).status === 404 && (await rawReq(t.base, "/media/x.exe")).status === 404, "non-media extension must be 404");

    /* ---------- hardening: RAW traversal / junk paths ---------- */
    const bad = [
      "/media/../go.mod", "/media/..%2fgo.mod", "/media/..%2Fgo.mod", "/media/%2e%2e%2fgo.mod", "/media/%2e%2e/go.mod", "/media/%2e%2e/%2e%2e/go.mod",
      "/media/..%5cgo.mod", "/media/..\\go.mod", "/media/%252e%252e%252fgo.mod", "/media/..%2f..%2fmain.go", "/media/..%2f.env", "/media/%00", "/media/" + FILE + "%00.txt",
      "/media/..%00/go.mod", "/media/%c0%ae%c0%ae/go.mod", "/media/....//go.mod", "/media/.hidden.mp4", "/media/..mp4", "/media/a%20b.mp4", "/media/" + FILE + "/", "/media/" + FILE + "/../go.mod",
      "/media//go.mod", "/media/" + FILE + "%2f..%2fgo.mod",
    ];
    const leaked = [];
    for (const p of bad) {
      const r = await rawReq(t.base, p);
      const body = r.body.toString("latin1");
      if (r.status === 200 || r.status === 206) leaked.push(`${p} -> ${r.status}`);
      if (/module sihattcm|^package main|GEMINI_API_KEY|SUPABASE_SERVICE/m.test(body)) leaked.push(`${p} leaked source`);
      if (r.status === 500 || r.status === 0) leaked.push(`${p} -> ${r.status} ${r.err}`);
    }
    t.check("traversal.none_served", leaked.length === 0, leaked.join("; "));
    for (const d of ["/media", "/media/"]) {
      const r = await rawReq(t.base, d);
      const body = r.body.toString("latin1");
      t.check("listing." + (d.replace(/\W/g, "_") || "root"), r.status !== 200 && !/<pre>|<a href=/i.test(body) && !body.includes(FILE), `${d} -> ${r.status} ${body.slice(0, 80)}`);
    }
    const post = await rawReq(t.base, "/media/" + FILE, { method: "POST", headers: { "Content-Length": "0" } });
    t.check("method.post_rejected", post.status === 405 || post.status === 404, `POST -> ${post.status}`);
    const long = await rawReq(t.base, "/media/" + "a".repeat(9000) + ".mp4");
    t.check("traversal.long_name_not_5xx", long.status > 0 && long.status < 500, `status=${long.status} err=${long.err}`);
  },
};
