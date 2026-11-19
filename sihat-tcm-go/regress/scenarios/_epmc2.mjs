const ids = process.argv.slice(2);
for (const id of ids) {
  const r = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${id}/fullTextXML`);
  const x = await r.text();
  const t = x.replace(/<xref[^>]*>.*?<\/xref>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const title = (x.match(/<article-title>(.*?)<\/article-title>/s) || [])[1]?.replace(/<[^>]+>/g, "");
  console.log("\n##### " + id + " " + title);
  const sents = t.split(/(?<=[.;])\s+/);
  const keep = sents.filter((s) => /btongueb|bpulseb|syndrome|TCM pattern|differentiation|year-old|years old|principle/i.test(s) && s.length < 380 && !/pulse d+ times|et al|doi|Figure|Fig./i.test(s));
  console.log(keep.slice(0, 12).join("\n- "));
}
