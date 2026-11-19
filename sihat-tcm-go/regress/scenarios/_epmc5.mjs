const spec = { PMC10615480: /thirst and diarrhea/, PMC11709150: /Clinical information/, PMC11046358: /23-year-old male/, PMC13538104: /55-year-old male developed/, PMC12599627: /Liu, Male, 68/, PMC2840555: /slippery, fine and weak pulse/ };
for (const [id, re] of Object.entries(spec)) {
  const x = await (await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${id}/fullTextXML`)).text();
  const t = x.replace(/<xref[^>]*>.*?<\/xref>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const all = [...t.matchAll(new RegExp(re.source, "g"))]; const m = all[all.length > 1 ? 1 : 0];
  console.log("\n##### " + id + "\n" + t.slice(Math.max(0, m.index - 200), m.index + 1500));
}
