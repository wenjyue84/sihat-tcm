const ids = process.argv.slice(2);
for (const id of ids) {
  const x = await (await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${id}/fullTextXML`)).text();
  const t = x.replace(/<xref[^>]*>.*?<\/xref>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const title = (x.match(/<article-title>(.*?)<\/article-title>/s) || [])[1]?.replace(/<[^>]+>/g, "");
  const lic = (x.match(/<license[^>]*>/) || [])[0];
  console.log("\n##### " + id + " " + title);
  const i = t.search(/(Case presentation|CASE PRESENTATION|Case Description|CASE HISTORY|Clinical information)/);
  const j = t.search(/\b(tongue)\b[^.]{0,200}(pulse)|\bpulse\b[^.]{0,200}\btongue\b/i);
  const a = Math.max(0, (j > 0 ? j : i) - 700);
  console.log(t.slice(a, a + 1500));
}
