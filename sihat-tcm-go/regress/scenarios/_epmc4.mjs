for (const id of process.argv.slice(2)) {
  const x = await (await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${id}/fullTextXML`)).text();
  const t = x.replace(/<xref[^>]*>.*?<\/xref>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  console.log("\n##### " + id);
  // find case-section "tongue" occurrences after the abstract
  const body = t.slice(t.indexOf("Introduction") > 0 ? t.indexOf("Introduction") : 0);
  const k = body.search(/\btongue\b/i);
  const a = Math.max(0, k - 900);
  console.log(body.slice(a, a + 1700));
}
