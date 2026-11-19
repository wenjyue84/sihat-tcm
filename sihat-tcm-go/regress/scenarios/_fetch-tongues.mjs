// one-off: downloads the Commons tongue photos listed in ii.json (thumb <=1024px) into images/ and writes tongue-src.json
import { readFileSync, writeFileSync } from "node:fs";
const j = JSON.parse(readFileSync("ii.json", "utf8"));
const UA = "SihatTCMRegress/1.0 (wenjyue@gmail.com)";
const strip = (s = "") => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
const out = [];
for (const p of Object.values(j.query.pages)) {
  const i = p.imageinfo?.[0]; if (!i) continue;
  const m = i.extmetadata;
  let slug = p.title.replace(/^File:/, "").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40); if (out.some((o) => o.file.startsWith("tongue-" + slug + "."))) slug += "-b";
  const url = i.thumburl || i.url;
  let buf, ct;
  for (let a = 0; a < 5; a++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.status === 429) { await new Promise((z) => setTimeout(z, 4000 * (a + 1))); continue; }
    if (!r.ok) throw new Error(p.title + " " + r.status);
    ct = r.headers.get("content-type"); buf = Buffer.from(await r.arrayBuffer()); break;
  }
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  const file = `tongue-${slug}.${ext}`;
  writeFileSync("images/" + file, buf);
  out.push({ title: p.title, file, bytes: buf.length, contentType: ct, source_page: i.descriptionurl, licence: m.LicenseShortName?.value, licence_url: m.LicenseUrl?.value || "", author: strip(m.Artist?.value), description: strip(m.ImageDescription?.value).slice(0, 400), orig_size: `${i.width}x${i.height}`, thumb_size: `${i.thumbwidth}x${i.thumbheight}` });
  console.log(file, buf.length, ct);
}
writeFileSync("tongue-src.json", JSON.stringify(out, null, 1));
