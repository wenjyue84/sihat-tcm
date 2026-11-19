// Deterministic canned replies for SIHAT_LISTENER_FAKE=1 — lets the regression
// suites exercise the full app (handlers, parsing, persistence) with zero model
// cost and zero flakiness. NOT a clinical engine; shapes only.
const REPORT = {
  diagnosis: { primary_pattern: "Qi deficiency with Spleen dampness (气虚脾湿)", secondary_patterns: ["Liver qi stagnation"], affected_organs: ["Spleen", "Liver"], pathomechanism: "Spleen qi fails to transform fluids, dampness accumulates and clouds the head." },
  constitution: { type: "Qi Deficiency (气虚质)", description: "Prone to fatigue and shortness of breath." },
  analysis: { summary: "Fatigue and headache with a pale swollen tongue point to Spleen qi deficiency.", key_findings: { from_inquiry: "Recurring headache and fatigue", from_visual: "Pale, swollen tongue with teeth marks", from_pulse: "Thready pulse" } },
  recommendations: { food_therapy: { beneficial: ["Chinese yam", "Job's tears", "Red dates"], avoid: ["Cold drinks", "Greasy food"] }, lifestyle: ["Sleep before 11pm", "Gentle walking daily"], acupoints: ["ST36 Zusanli", "SP6 Sanyinjiao"], exercise: ["Baduanjin"] },
  follow_up: { timeline: "2 weeks", warning_signs: ["Sudden severe headache", "Chest pain"] },
  disclaimer: "AI-assisted assessment — consult a licensed practitioner.",
};

export function cannedReply(prompt, system, req) {
  const both = system + "\n" + prompt;
  // fault-injection hooks for resilience suites (FAKE mode only): put the marker anywhere in the user text
  if (both.includes("__FAIL_500__")) { const e = new Error("injected upstream failure"); e.httpStatus = 500; throw e; }
  if (both.includes("__FAIL_429__")) { const e = new Error("Resource has been exhausted (e.g. check quota)."); e.httpStatus = 429; e.geminiStatus = "RESOURCE_EXHAUSTED"; throw e; }
  if (both.includes("__EMPTY__")) return "";
  if (both.includes("__GARBAGE_JSON__")) return "{ this is not json";
  if (/"isValid"/.test(both)) return JSON.stringify({ isValid: !/grocery|gibberish|furniture|hello/i.test(prompt), message: "Looks like a valid medicine entry. (fake-listener)" });
  const json = req?.generationConfig?.responseMimeType === "application/json";
  if (/is_valid_image/.test(both)) {
    const face = /face/i.test(system) && !/tongue/i.test(system.slice(0, 200));
    return JSON.stringify({ is_valid_image: true, observation: (face ? "Facial complexion appears pale with mild dark circles under the eyes; no jaundice or redness noted. " : "Tongue body pale and slightly swollen with teeth marks along the edges; coating thin and white; moisture normal. ").repeat(2), status: "ok", tags: ["pale"], potential_issues: ["Qi deficiency"] });
  }
  if (/primary_pattern/.test(both) || (json && /basic_info|wen_inquiry/.test(prompt))) return JSON.stringify(REPORT);
  if (json) return JSON.stringify({ ok: true, summary: "fake summary" });
  return "Thank you for sharing. Could you tell me more about when the symptoms are worst, your sleep, and your appetite? (fake-listener reply)";
}
