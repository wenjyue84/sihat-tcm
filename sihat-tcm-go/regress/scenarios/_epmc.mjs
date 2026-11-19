const qs = process.argv.slice(2);
for (const q of qs) {
  const u = "https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=8&resultType=core&query=" + encodeURIComponent(q + ' AND OPEN_ACCESS:y AND "case report"');
  const r = await fetch(u); const j = await r.json();
  console.log("\n=== " + q);
  for (const x of j.resultList.result) console.log(x.pmcid || x.id, "|", x.title?.slice(0, 110), "|", x.license, "|", (x.abstractText || "").replace(/<[^>]+>/g, "").length);
}
