const spec = { PMC10011998: /TCM diagnosis|Chinese medicine diagnosis|syndrome differentiation|pattern/i, PMC8137033: /Kampo diagnosis|pattern|sho\b|Kampo medicine diagnos/i };
for (const [id, re] of Object.entries(spec)) {
  const x = await (await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${id}/fullTextXML`)).text();
  const t = x.replace(/<xref[^>]*>.*?<\/xref>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const k = t.indexOf("Petechiae were observed") > 0 ? t.indexOf("Petechiae were observed") : t.indexOf("tongue diagnosis revealed");
  console.log("\n##### " + id + "\n" + t.slice(k - 600, k + 1800));
}
