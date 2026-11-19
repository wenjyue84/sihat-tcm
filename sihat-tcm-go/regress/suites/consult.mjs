import { reportProblems } from "../journey.mjs";
export default {
  name: "consult", needs: "stack", mutating: false, costly: true,
  doc: "/api/consult returns a parseable structured TCM report matching the renderer's contract",
  async run(t) {
    const data = { basic_info: { name: "张伟", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache", "fatigue"] }, wen_inquiry: "Recurring headache and fatigue for a week; poor sleep.", wang_tongue: "Pale, slightly swollen tongue with teeth marks and thin white coating.", wang_face: "Pale complexion, dark circles.", wen_audio: "", qie: { bpm: "72", qualities: ["wiry"] } };
    let r, rpt = null, cleaned = "";
    for (let i = 0; i < 3 && !rpt; i++) {
      r = await t.postJSON("/api/consult", { data, language: "en" }, { headers: { "X-Forwarded-For": t.ip() } });
      cleaned = r.text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
      try { rpt = JSON.parse(cleaned); } catch { rpt = null; }
    }
    t.check("status_200", r.status === 200, `status=${r.status}`);
    t.check("parseable_json", !!rpt, `unparseable after 3 tries, head=${cleaned.slice(0, 60)}`);
    if (rpt) {
      const probs = reportProblems(rpt);
      t.check("report_contract", probs.length === 0, probs.join("; "));
    }
    const bad = await t.postJSON("/api/consult", { language: "en" }, { headers: { "X-Forwarded-For": t.ip() } });
    t.check("missing_data_rejected", bad.status >= 400 && bad.status < 500, `status=${bad.status} (want 4xx)`);
  },
};
