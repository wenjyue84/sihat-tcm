import { reportProblems } from "../journey.mjs";

/**
 * datacontract — API contract + resilience for every AI-backed / report-related endpoint.
 * Handlers read: handlers_ai.go, handlers_analysis.go, handlers_summaries.go, handlers_data.go, handlers_doctor.go.
 * Client-consumed fields read from static/js (wizard.js, consult.js, dashboard.js) and templates/doctor.html.
 */
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const WEBM = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKIbWF0cm9za2FCh4EEQoWBAhhTgGcBAAAAAAAB";
const LANGS = ["en", "zh", "ms"];
const HOOKS = ["__FAIL_500__", "__FAIL_429__", "__EMPTY__", "__GARBAGE_JSON__"];
const LEAK = /gemini:|googleapis|generativelanguage|[?&]key=|127\.0\.0\.1|localhost|goroutine|panic|\.go:\d+|runtime error|API error \d+|stream status \d+|decode response|AIza/i;
const canon = (v) => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const snip = (s, n = 90) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

export default {
  name: "datacontract", needs: "stack", mutating: true, costly: true,
  doc: "API contract for every AI/report endpoint (shape, 400s, langs, streaming, fault hooks, guest->patient session round trip)",
  async run(t) {
    const fake = t.stack?.ai === "fake";
    const call = async (path, { method = "POST", body, raw, token, ip, headers = {} } = {}) => {
      const h = { "X-Forwarded-For": ip || t.ip(), ...headers };
      if (body !== undefined || raw !== undefined) h["Content-Type"] = "application/json";
      if (token) h["Authorization"] = "Bearer " + token;
      const t0 = Date.now();
      try {
        const res = await fetch(t.base + path, { method, headers: h, body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
        const text = await res.text();
        let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
        return { status: res.status, text, json, headers: res.headers, ct: res.headers.get("content-type") || "", ms: Date.now() - t0 };
      } catch (e) { return { status: 0, text: String(e), json: null, headers: new Headers(), ct: "", ms: Date.now() - t0 }; }
    };

    /* ---------- identities ---------- */
    const uniq = t.uniq();
    const doc = await t.login("doctor@sihat.com", "password123", t.ip());
    const adm = await t.login("admin@sihat.com", "password123", t.ip());
    const dev = await t.login("developer@sihat.com", "password123", t.ip());
    const pat = await t.signup(`dc-a-${uniq}@example.com`, "DC Patient A", "patient", {}, t.ip());
    const pat2 = await t.signup(`dc-b-${uniq}@example.com`, "DC Patient B", "patient", {}, t.ip());
    t.check("identities_have_tokens", doc.ok && adm.ok && dev.ok && pat.ok && pat2.ok && doc.token && adm.token && dev.token && pat.token && pat2.token,
      `doctor=${doc.ok} admin=${adm.ok} dev=${dev.ok} patA=${pat.ok} patB=${pat2.ok} (without real tokens the auth checks below would pass vacuously)`);

    /* ---------- streamed endpoints ---------- */
    const msgs = [{ role: "user", content: "I have had a headache and fatigue for a week." }];
    const report0 = { diagnosis: { primary_pattern: "Qi deficiency" }, constitution: { type: "Qi Deficiency" }, analysis: { summary: "s" }, recommendations: { food_therapy: { beneficial: ["yam"], avoid: ["ice"] }, lifestyle: ["walk"] } };
    const streams = [
      { name: "chat", path: "/api/chat", build: (l) => ({ messages: msgs, basicInfo: { name: "A", age: 30, gender: "male", symptoms: ["headache"] }, language: l }), bad: { messages: "oops" } },
      { name: "report_chat", path: "/api/report-chat", build: (l) => ({ messages: msgs, reportData: report0, patientInfo: { name: "A", age: 30, gender: "male", symptoms: "headache" }, language: l }), bad: { reportData: report0, messages: [] } },
      { name: "western_chat", path: "/api/western-chat", build: (l) => ({ messages: msgs, tcmReportData: report0, patientInfo: { name: "A", symptoms: "headache" }, language: l }), bad: { messages: [] } },
      { name: "heart_companion", path: "/api/heart-companion", build: (l) => ({ messages: msgs, profile: { name: "Ann", age: 40, gender: "female" }, language: l }), bad: { messages: [] } },
      { name: "admin_assistant", path: "/api/admin/assistant", token: adm.token, build: () => ({ messages: msgs }), bad: { messages: [] } },
      { name: "developer_assistant", path: "/api/developer/assistant", token: dev.token, build: () => ({ messages: msgs }), bad: { messages: [] } },
    ];
    for (const s of streams) {
      const bad = [], lines = [];
      for (const l of (s.name.endsWith("assistant") ? ["en"] : LANGS)) {
        const r = await call(s.path, { body: s.build(l), token: s.token });
        const model = r.headers.get("x-model-used");
        if (r.status !== 200) bad.push(`${l}: status ${r.status} ${snip(r.text, 60)}`);
        else {
          if (!r.ct.startsWith("text/plain")) bad.push(`${l}: content-type ${r.ct}`);
          if (!model) bad.push(`${l}: no X-Model-Used`);
          if (r.text.trim().length < 20) bad.push(`${l}: body too short (${r.text.length})`);
          if (fake && !r.text.trim().endsWith("(fake-listener reply)")) bad.push(`${l}: body truncated, tail=${snip(r.text.slice(-40))}`);
          if (r.text.trim().startsWith('{"error"')) bad.push(`${l}: error JSON in a 200 stream`);
        }
        lines.push(l);
      }
      t.check(`${s.name}.stream_200_textplain_full_body_model_header`, bad.length === 0, bad.join(" | "));
      const b = await call(s.path, { body: s.bad, token: s.token });
      t.check(`${s.name}.invalid_input_400_not_500`, b.status === 400 && typeof b.json?.error === "string", `status=${b.status} body=${snip(b.text)}`);
      const nj = await call(s.path, { raw: "{not json", token: s.token });
      t.check(`${s.name}.bad_json_400_with_error_key`, nj.status === 400 && typeof nj.json?.error === "string", `status=${nj.status} body=${snip(nj.text)}`);
    }
    const unk = await call("/api/chat", { body: { messages: msgs, language: "xx" } });
    t.check("chat.unknown_language_falls_back", unk.status === 200 && unk.text.trim().length > 20, `status=${unk.status}`);
    const emptyChat = await call("/api/chat", { body: { messages: [], language: "zh" } });
    t.check("chat.empty_messages_seeds_opening_turn", emptyChat.status === 200 && emptyChat.text.trim().length > 20, `status=${emptyChat.status}`);
    const getChat = await call("/api/chat", { method: "GET" });
    t.check("chat.get_is_405", getChat.status === 405, `status=${getChat.status}`);
    const rcArr = await call("/api/report-chat", { body: { messages: msgs, reportData: report0, patientInfo: { name: "A", symptoms: ["headache", "fatigue"] } } });
    t.check("report_chat.patientinfo_symptoms_array_accepted", rcArr.status === 200, `status=${rcArr.status} ${snip(rcArr.text)} (same array-vs-string trap as chat Bug #3; handlers_ai.go:296-301 types Symptoms as string)`);
    const wcArr = await call("/api/western-chat", { body: { messages: msgs, tcmReportData: report0, patientInfo: { name: "A", symptoms: ["headache"] } } });
    t.check("western_chat.patientinfo_symptoms_array_accepted", wcArr.status === 200, `status=${wcArr.status} ${snip(wcArr.text)} (handlers_ai.go:520-525)`);
    const hcOpt = await call("/api/heart-companion", { method: "OPTIONS" });
    t.check("heart_companion.options_cors", hcOpt.status === 204 && hcOpt.headers.get("access-control-allow-origin") === "*" && /POST/.test(hcOpt.headers.get("access-control-allow-methods") || ""), `status=${hcOpt.status}`);
    const hcPost = await call("/api/heart-companion", { body: { messages: msgs } });
    t.check("heart_companion.post_has_cors_header", hcPost.headers.get("access-control-allow-origin") === "*", `acao=${hcPost.headers.get("access-control-allow-origin")}`);

    /* assistants must not be open to the world / wrong roles */
    for (const [n, p] of [["admin", "/api/admin/assistant"], ["developer", "/api/developer/assistant"]]) {
      const anon = await call(p, { body: { messages: msgs } });
      t.check(`${n}_assistant.anonymous_denied`, anon.status === 401, `status=${anon.status} (expected 401)`);
      const pr = await call(p, { body: { messages: msgs }, token: pat.token });
      t.check(`${n}_assistant.patient_denied`, pr.status === 403 || pr.status === 401, `status=${pr.status} (patient role must not reach ${n} assistant)`);
    }

    /* ---------- consult / report shape ---------- */
    const cdata = (l, extra = {}) => ({ basic_info: { name: "张伟", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache", "fatigue"] }, wen_inquiry: "Recurring headache and fatigue; poor sleep.", wang_tongue: "Pale swollen tongue, teeth marks.", wang_face: "Pale.", wen_audio: "", qie: { bpm: "72", qualities: ["wiry"] }, ...extra });
    let report = null;
    for (const l of LANGS) {
      const r = await call("/api/consult", { body: { data: cdata(l), language: l } });
      const cleaned = r.text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
      let rpt = null; try { rpt = JSON.parse(cleaned); } catch { /* */ }
      t.check(`consult.${l}_200_text_plain_parseable`, r.status === 200 && r.ct.startsWith("text/plain") && !!rpt && !!r.headers.get("x-model-used"), `status=${r.status} ct=${r.ct} parsed=${!!rpt} head=${snip(cleaned, 50)}`);
      if (rpt && !report) report = rpt;
    }
    if (report) {
      const probs = reportProblems(report);
      t.check("consult.report_passes_reportProblems", probs.length === 0, probs.join("; "));
      t.check("consult.key_findings_is_object", isObj(report.analysis?.key_findings), `key_findings=${JSON.stringify(report.analysis?.key_findings)?.slice(0, 60)}`);
      const rec = report.recommendations || {};
      t.check("consult.client_keys_present", typeof report.diagnosis?.primary_pattern === "string" && typeof report.constitution?.type === "string" && typeof report.analysis?.summary === "string" && (!fake || (Array.isArray(rec.food_therapy?.beneficial) && Array.isArray(rec.lifestyle) && Array.isArray(rec.acupoints) && typeof report.disclaimer === "string" && Array.isArray(report.follow_up?.warning_signs))),
        `keys: diagnosis.primary_pattern, constitution.type, analysis.summary, recommendations.food_therapy.beneficial/lifestyle/acupoints, follow_up.warning_signs, disclaimer (read by wizard.js/dashboard.js/report-print.js); got ${Object.keys(report).join(",")}`);
    } else t.check("consult.report_obtained", false, "no parseable report from /api/consult");
    const cm = await call("/api/consult", { body: { language: "en" } });
    t.check("consult.missing_data_400", cm.status === 400, `status=${cm.status} (data absent is marshalled as JSON null and sent to the model: handlers_ai.go:263)`);
    const cb = await call("/api/consult", { raw: "{nope" });
    t.check("consult.bad_json_400", cb.status === 400, `status=${cb.status}`);

    /* ---------- JSON-returning AI endpoints ---------- */
    for (const type of ["tongue", "face", "body"]) {
      const r = await call("/api/analyze-image", { body: { image: PNG, type, symptoms: "headache", mainComplaint: "fatigue" } });
      const j = r.json || {};
      t.check(`analyze_image.${type}_shape`, r.status === 200 && r.ct.includes("json") && typeof j.observation === "string" && j.observation.length >= 50 && typeof j.status === "string" && typeof j.confidence === "number" && Array.isArray(j.potential_issues) && typeof j.modelUsed === "number" && Array.isArray(j.analysis_tags) && j.status !== "Analysis pending",
        `status=${r.status} keys=${Object.keys(j)} obslen=${(j.observation || "").length} st=${j.status}`);
    }
    const ir = await call("/api/analyze-image", { body: { image: PNG.split(",")[1], type: "tongue" } });
    t.check("analyze_image.raw_base64_accepted", ir.status === 200 && typeof ir.json?.observation === "string", `status=${ir.status}`);
    t.check("analyze_image.missing_image_400", (await call("/api/analyze-image", { body: { type: "tongue" } })).status === 400, "missing image must be 400");
    t.check("analyze_image.bad_json_400", (await call("/api/analyze-image", { raw: "{x" })).status === 400, "bad JSON must be 400");

    const au = await call("/api/analyze-audio", { body: { audio: WEBM } });
    t.check("analyze_audio.shape", au.status === 200 && au.ct.includes("json") && typeof au.json?.overall_observation === "string" && au.json.overall_observation.length > 10 && isObj(au.json.voice_quality_analysis) && typeof au.json.status === "string" && typeof au.json.modelUsed === "number", `status=${au.status} keys=${Object.keys(au.json || {})}`);
    t.check("analyze_audio.missing_audio_400", (await call("/api/analyze-audio", { body: {} })).status === 400, "missing audio must be 400");
    const sn = await call("/api/analyze-snore", { body: { audio: WEBM, duration: 12, tcmContext: { diagnosis: "x" } } });
    t.check("analyze_snore.returns_json_object", sn.status === 200 && isObj(sn.json), `status=${sn.status} ${snip(sn.text)}`);
    t.check("analyze_snore.missing_audio_400", (await call("/api/analyze-snore", { body: { duration: 3 } })).status === 400, "missing audio must be 400");

    const ex = await call("/api/extract-text", { body: { file: PNG, fileName: "lab.png", fileType: "image/png", language: "en" } });
    t.check("extract_text.general_shape", ex.status === 200 && typeof ex.json?.text === "string" && ex.json.text.length > 0 && "warning" in ex.json, `status=${ex.status} keys=${Object.keys(ex.json || {})}`);
    if (fake) {
      const marks = { en: "NO MEDICINE DETECTED", zh: "未检测到药物", ms: "TIADA UBAT DIKESAN" };
      for (const l of LANGS) {
        const r = await call("/api/extract-text", { body: { file: PNG, fileName: "pic.png", mode: "medicine", language: l } });
        t.check(`extract_text.medicine_${l}_localised_no_medicine_msg`, r.status === 200 && r.json?.is_valid === false && typeof r.json.text === "string" && r.json.text.includes(marks[l]) && r.json.text.includes("pic.png"), `status=${r.status} text=${snip(r.json?.text)}`);
      }
    } else t.skip("extract_text.medicine_langs", "needs the deterministic fake AI");
    t.check("extract_text.missing_file_400", (await call("/api/extract-text", { body: { mode: "medicine" } })).status === 400, "missing file must be 400");

    const vm = await call("/api/validate-medicine", { body: { text: "Panadol 500mg", language: "en" } });
    if (fake && vm.status === 500 && /parse AI response/.test(vm.text)) t.skip("validate_medicine.happy_shape", "fake AI returns prose for non-JSON-mode calls, so the {isValid,message} path is unreachable here");
    else t.check("validate_medicine.happy_shape", vm.status === 200 && typeof vm.json?.isValid === "boolean" && typeof vm.json?.message === "string", `status=${vm.status} ${snip(vm.text)}`);
    t.check("validate_medicine.missing_text_400", (await call("/api/validate-medicine", { body: { language: "en" } })).status === 400, "missing text must be 400");

    const giBody = { patientInfo: { age: 35, gender: "male", height: 175, weight: 70 }, symptoms: "headache, insomnia" };
    t.check("generate_inquiry.anonymous_401", (await call("/api/doctor/generate-inquiry", { body: giBody })).status === 401, "anonymous must be 401 (doctor/admin only)");
    t.check("generate_inquiry.patient_403", (await call("/api/doctor/generate-inquiry", { body: giBody, token: pat.token })).status === 403, "patient must be 403 (doctor/admin only)");
    const gi = await call("/api/doctor/generate-inquiry", { body: giBody, token: doc.token });
    const qs = gi.json?.questions;
    const qok = Array.isArray(qs) && qs.length > 0 && qs.every((q) => typeof q.id === "string" && typeof q.question === "string" && Array.isArray(q.choices) && q.choices.length > 0 && q.choices.every((c) => typeof c.id === "string" && typeof c.label === "string") && typeof q.multiSelect === "boolean");
    t.check("generate_inquiry.questions_shape", gi.status === 200 && qok, `status=${gi.status} keys=${Object.keys(gi.json || {})} (doctor token; templates/doctor.html shows 'No questions returned' when absent)`);
    t.check("generate_inquiry.bad_json_400", (await call("/api/doctor/generate-inquiry", { raw: "[", token: doc.token })).status === 400, "bad JSON must be 400");

    /* summaries */
    const hist = [{ role: "user", content: "headache" }, { role: "assistant", content: "How long?" }, { role: "user", content: "a week" }];
    for (const l of LANGS) {
      const r = await call("/api/summarize-inquiry", { body: { chatHistory: hist, basicInfo: { name: "A", age: "30", gender: "male", symptoms: "headache" }, language: l } });
      t.check(`summarize_inquiry.${l}_shape`, r.status === 200 && typeof r.json?.summary === "string" && r.json.summary.length > 10 && typeof r.json.modelUsed === "string" && typeof r.json.timing?.total === "number", `status=${r.status} keys=${Object.keys(r.json || {})}`);
    }
    t.check("summarize_inquiry.bad_json_400", (await call("/api/summarize-inquiry", { raw: "x" })).status === 400, "bad JSON must be 400");
    const sr = await call("/api/summarize-reports", { body: { reports: [{ name: "Blood test", date: "2026-01-01", extractedText: "HbA1c 5.4" }], diagnosisHistory: [{ created_at: "2026-01-02", symptoms: "x", diagnosis_report: { tcmDiagnosis: "qi def" } }], language: "zh" } });
    t.check("summarize_reports.shape", sr.status === 200 && typeof sr.json?.summary === "string" && sr.json.summary.length > 10 && typeof sr.json.timing?.total === "number" && typeof sr.json.timing?.generation === "number", `status=${sr.status} keys=${Object.keys(sr.json || {})}`);
    const sr0 = await call("/api/summarize-reports", { body: { language: "en" } });
    t.check("summarize_reports.no_data_400_NO_DATA", sr0.status === 400 && sr0.json?.code === "NO_DATA", `status=${sr0.status} body=${snip(sr0.text)}`);
    const smh = await call("/api/summarize-medical-history", { body: { inquiries: [{ created_at: "2026-01-01", symptoms: "cough", diagnosis_report: { tcmDiagnosis: "lung dryness" } }], reports: [{ name: "X-ray", date: "2026-01-02", extractedText: "clear" }] } });
    t.check("summarize_medical_history.shape", smh.status === 200 && smh.json?.success === true && typeof smh.json.summary === "string" && smh.json.summary.length > 10, `status=${smh.status} body=${snip(smh.text)}`);
    t.check("summarize_medical_history.bad_json_400", (await call("/api/summarize-medical-history", { raw: "{" })).status === 400, "bad JSON must be 400");
    const da = await call("/api/ask-dietary-advice", { body: { question: "Can I drink coffee?", profile: { type: "Qi def" }, diagnosis: report0.diagnosis, advice: report0.recommendations } });
    t.check("ask_dietary_advice.answer_string", da.status === 200 && typeof da.json?.answer === "string" && da.json.answer.length > 10, `status=${da.status} keys=${Object.keys(da.json || {})} (consult.js reads d.answer || d.error)`);
    t.check("ask_dietary_advice.missing_question_400", (await call("/api/ask-dietary-advice", { body: { profile: {} } })).status === 400, "missing question must be 400");

    /* infographic: pure server-side */
    for (const style of ["modern", "traditional", "minimal", "colorful", "bogus", ""]) {
      const r = await call("/api/generate-infographic", { body: { style, reportData: report0 } });
      const svg = r.json?.imageUrl?.startsWith("data:image/svg+xml;base64,") ? Buffer.from(r.json.imageUrl.split(",")[1], "base64").toString("utf8") : "";
      t.check(`infographic.style_${style || "default"}_shape`, r.status === 200 && r.json?.success === true && r.json.type === "html" && /^<!DOCTYPE html>/i.test(r.json.html || "") && svg.startsWith("<svg") && svg.trimEnd().endsWith("</svg>"), `status=${r.status} keys=${Object.keys(r.json || {})}`);
    }
    t.check("infographic.empty_body_ok", (await call("/api/generate-infographic", { body: {} })).status === 200, "empty object must still render a generic card");
    t.check("infographic.bad_json_400", (await call("/api/generate-infographic", { raw: "{" })).status === 400, "bad JSON must be 400");
    const xss = await call("/api/generate-infographic", { body: { reportData: { diagnosis: { primary_pattern: "<script>alert(1)</script>" }, constitution: { type: "<img src=x onerror=1>" }, recommendations: { food_therapy: { beneficial: ["<b>x</b>"] }, lifestyle: ["</div><script>1</script>"] } } } });
    t.check("infographic.html_escapes_report_text", xss.status === 200 && !/<script>alert|<img src=x|<b>x<\/b>|<script>1/.test(xss.json?.html || "x"), `unescaped markup in html: ${snip(xss.json?.html?.match(/<script>.{0,30}/)?.[0])}`);
    const zhDiag = "气虚脾湿兼肝气郁结夹痰湿内阻证型较为典型表现明显的中医辨证结果示例文字";
    const zh = await call("/api/generate-infographic", { body: { reportData: { diagnosis: { primary_pattern: zhDiag }, constitution: { type: "气虚质" }, recommendations: { food_therapy: { beneficial: ["山药薏米红枣茯苓莲子百合芡实白扁豆"] } } } } });
    let validUtf8 = false;
    try { new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from((zh.json?.imageUrl || "").split(",")[1] || "", "base64")); validUtf8 = !!zh.json?.imageUrl; } catch { validUtf8 = false; }
    t.check("infographic.chinese_svg_is_valid_utf8", validUtf8, "SVG imageUrl contains invalid UTF-8 for long Chinese text (handlers_summaries.go:619-621 and 630-633 truncate by BYTES: label[:35], diagLabel[:50])");

    /* ---------- ai/patient-summary ---------- */
    const mkPatient = async (first, userId = null) => {
      const id = crypto.randomUUID();   // patients.id is a uuid on the real DB
      // patients.user_id is UNIQUE (db/schema.sql): only one patient row per account, so extra fixtures stay unlinked
      await t.dbInsert("patients", { id, first_name: first, last_name: "Case", gender: "female", type: userId ? "registered" : "managed", birth_date: "1990-05-05", user_id: userId });
      return id;
    };
    const pid = await mkPatient("Mei", pat.id);
    t.check("patient_summary.anonymous_401", (await call("/api/ai/patient-summary", { body: { patientId: pid } })).status === 401, "anon must be 401");
    t.check("patient_summary.missing_id_400", (await call("/api/ai/patient-summary", { body: {}, token: doc.token })).status === 400, "missing patientId must be 400");
    t.check("patient_summary.unknown_id_404", (await call("/api/ai/patient-summary", { body: { patientId: "nope-" + uniq }, token: doc.token })).status === 404, "unknown patient must be 404");
    const ps = await call("/api/ai/patient-summary", { body: { patientId: pid }, token: doc.token });
    t.check("patient_summary.doctor_gets_summary", ps.status === 200 && typeof ps.json?.summary === "string" && ps.json.summary.length > 10, `status=${ps.status} ${snip(ps.text)}`);
    const cached = ((await t.dbTable("patients")) || []).find((r) => r.id === pid)?.clinical_summary;
    t.check("patient_summary.cached_on_patient_row", cached?.summary === ps.json?.summary && !!cached?.generated_at, `clinical_summary=${JSON.stringify(cached)?.slice(0, 80)}`);
    const psPat = await call("/api/ai/patient-summary", { body: { patientId: pid }, token: pat2.token });
    t.check("patient_summary.unrelated_patient_denied", psPat.status === 403 || psPat.status === 401, `status=${psPat.status} (patient-summary is doctor/admin only)`);
    t.check("patient_summary.patient_owner_403", (await call("/api/ai/patient-summary", { body: { patientId: pid }, token: pat.token })).status === 403, "even the owning patient is not a doctor/admin: 403");

    /* ---------- fault hooks ---------- */
    const aiCall = async (txt) => {
      if (!t.aiBase) return { status: -1, text: "" };
      try { const r = await fetch(`${t.aiBase}/v1beta/models/gemini-flash-latest:generateContent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: txt }] }] }), signal: AbortSignal.timeout(15000) }); return { status: r.status, text: await r.text() }; }
      catch (e) { return { status: 0, text: String(e) }; }
    };
    const baseline = await aiCall("hello");
    const active = {};
    for (const h of HOOKS) { const r = await aiCall(`x ${h} y`); active[h] = baseline.status > 0 && (r.status !== baseline.status || r.text !== baseline.text); }
    if (!HOOKS.every((h) => active[h])) {
      t.skip("fault_hooks", `fake listener does not implement: ${HOOKS.filter((h) => !active[h]).join(", ")} (sihat-listener/fake.mjs / listener.mjs have no hook handling); resilience checks not run for those hooks`);
    }
    const judge = (r, stream, graceful) => {
      if (r.status === 0) return `no response/timeout: ${snip(r.text)}`;
      if (r.status >= 200 && r.status < 300) {
        if (!r.text.trim()) return "200 with EMPTY body (client would show nothing)";
        if (LEAK.test(r.text)) return `leaks internals: ${snip(r.text)}`;
        if (!stream && r.ct.includes("json") && !r.json) return "200 JSON content-type but unparseable body";
        return graceful ? graceful(r) : "";
      }
      // streamed (aiStream) endpoints must use the generic user-safe statuses 429/502/503; the non-stream handlers may still answer a generic 5xx
      if (r.status === 429 || r.status === 502 || r.status === 503 || (!stream && r.status >= 500 && r.status < 600)) {
        if (typeof r.json?.error !== "string" || !r.json.error.trim()) return `status ${r.status} without JSON {error}: ${snip(r.text)}`;
        if (LEAK.test(r.text)) return `status ${r.status} leaks upstream/internal text: ${snip(r.text, 140)}`;
        return "";
      }
      return `unexpected status ${r.status}: ${snip(r.text)}`;
    };
    const faults = [
      { name: "chat", path: "/api/chat", stream: true, build: (h) => ({ messages: [{ role: "user", content: `help ${h}` }], language: "en" }) },
      { name: "consult", path: "/api/consult", stream: true, build: (h) => ({ data: cdata("en", { wen_inquiry: h }), language: "en" }) },
      { name: "report_chat", path: "/api/report-chat", stream: true, build: (h) => ({ messages: [{ role: "user", content: h }], reportData: report0 }) },
      { name: "western_chat", path: "/api/western-chat", stream: true, build: (h) => ({ messages: [{ role: "user", content: h }], tcmReportData: report0 }) },
      { name: "heart_companion", path: "/api/heart-companion", stream: true, build: (h) => ({ messages: [{ role: "user", content: h }] }) },
      { name: "admin_assistant", path: "/api/admin/assistant", stream: true, token: adm.token, build: (h) => ({ messages: [{ role: "user", content: h }] }) },
      { name: "summarize_inquiry", path: "/api/summarize-inquiry", build: (h) => ({ chatHistory: [{ role: "user", content: h }], language: "en" }) },
      { name: "summarize_reports", path: "/api/summarize-reports", build: (h) => ({ reports: [{ name: "r", extractedText: h }] }) },
      { name: "summarize_medical_history", path: "/api/summarize-medical-history", build: (h) => ({ reports: [{ name: "r", extractedText: h }] }) },
      { name: "validate_medicine", path: "/api/validate-medicine", build: (h) => ({ text: h }) },
      { name: "analyze_snore", path: "/api/analyze-snore", build: (h) => ({ audio: WEBM, tcmContext: h }) },
      { name: "ask_dietary_advice", path: "/api/ask-dietary-advice", build: (h) => ({ question: h }), hook429: (r) => (r.status === 429 && /busy|try again/i.test(r.json?.error || "") ? "" : `want 429 with a friendly retry message (handlers_summaries.go:435), got ${r.status} ${snip(r.text)}`) },
      { name: "generate_inquiry", path: "/api/doctor/generate-inquiry", token: doc.token, graceful: (r) => (Array.isArray(r.json?.questions) && r.json.questions.length ? "" : "200 without questions (want the built-in fallback list)"), build: (h) => ({ patientInfo: {}, symptoms: h }) },
      { name: "analyze_image", path: "/api/analyze-image", graceful: (r) => (typeof r.json?.observation === "string" && r.json.observation.length > 10 ? "" : "200 without a readable observation"), build: (h) => ({ image: PNG, type: "tongue", symptoms: h }) },
    ];
    for (const f of faults) {
      const fails = [];
      for (const h of HOOKS) {
        if (!active[h]) continue;
        const r = await call(f.path, { body: f.build(h), token: f.token });
        let why = judge(r, !!f.stream, f.graceful);
        if (!why && h === "__FAIL_429__" && f.hook429) why = f.hook429(r);
        if (!why && r.ms > 20000) why = `slow (${r.ms}ms)`;
        if (why) fails.push(`${h}: ${why}`);
      }
      if (HOOKS.some((h) => active[h])) t.check(`fault.${f.name}_clean_error`, fails.length === 0, fails.join(" || "));
    }
    if (active.__FAIL_500__) {
      const bp = await mkPatient("__FAIL_500__ Zed");
      const r = await call("/api/ai/patient-summary", { body: { patientId: bp }, token: doc.token });
      const why = judge(r, false);
      t.check("fault.patient_summary_clean_error", !why && r.status >= 500, `${why} status=${r.status} ${snip(r.text)}`);
    }

    /* ---------- guest -> patient session round trip ---------- */
    const rich = {
      ...(report || report0),
      _rt: { zero: 0, f: false, nul: null, float: 1.5, tiny: 0.30000000000000004, big: 12345678901, emoji: "🌿 气虚 ñ", html: "<b>&</b> \"q\" 'a'", nested: [{ a: [1, 2, { b: "c" }] }, []], empty: {}, long: Array.from({ length: 2500 }, (_, i) => `item-${i}-` + "x".repeat(70)) },
    };
    const gHdr = { ip: t.ip() };
    t.check("guest_sessions.bad_json_400", (await call("/api/guest/sessions", { raw: "{", ...gHdr })).status === 400, "bad JSON must be 400");
    const gs = await call("/api/guest/sessions", { body: { id: "attacker-chosen-id", full_report: rich, primary_diagnosis: "Qi def", constitution: "Qi", symptoms: "headache, fatigue", guest_name: "Guest DC" }, ...gHdr });
    const token = gs.json?.session_token;
    t.check("guest_sessions.create_201_with_token", gs.status === 201 && gs.json?.success === true && /^[0-9a-f]{32}$/.test(token || ""), `status=${gs.status} body=${snip(gs.text)}`);
    const grow = ((await t.dbTable("guest_diagnosis_sessions")) || []).find((r) => r.session_token === token);
    t.check("guest_sessions.stored_full_report_deep_equal", !!grow && same(grow.full_report, rich), grow ? "stored full_report differs from the posted one" : "guest row not found in DB");
    t.check("guest_sessions.symptoms_normalised_to_array", same(grow?.symptoms, ["headache", "fatigue"]), `symptoms=${JSON.stringify(grow?.symptoms)}`);
    t.check("guest_sessions.client_cannot_choose_primary_key", !!grow && grow.id !== "attacker-chosen-id", `stored id=${grow?.id}`);

    t.check("migrate.anonymous_401", (await call("/api/migrate-guest-session", { body: { sessionToken: token } })).status === 401, "anon must be 401");
    t.check("migrate.missing_token_400", (await call("/api/migrate-guest-session", { body: {}, token: pat.token })).status === 400, "missing sessionToken must be 400");
    t.check("migrate.bogus_token_400", (await call("/api/migrate-guest-session", { body: { sessionToken: "f".repeat(32) }, token: pat.token })).status === 400, "unknown guest token must be 400");
    const mg = await call("/api/migrate-guest-session", { body: { sessionToken: token }, token: pat.token });
    t.check("migrate.success", mg.status === 200 && mg.json?.success === true && same(mg.json?.data?.full_report, rich), `status=${mg.status} body=${snip(mg.text)}`);
    const again = await call("/api/migrate-guest-session", { body: { sessionToken: token }, token: pat.token });
    t.check("migrate.second_use_rejected", again.status === 400, `status=${again.status} (token must be single-use)`);
    const steal = await call("/api/migrate-guest-session", { body: { sessionToken: token }, token: pat2.token });
    t.check("migrate.other_user_cannot_reuse", steal.status === 400, `status=${steal.status}`);

    const l1 = await call("/api/patient/sessions", { method: "GET", token: pat.token });
    const s1 = (l1.json?.sessions || []).find((s) => same(s.full_report, rich));
    t.check("patient_sessions.migrated_report_byte_equivalent", l1.status === 200 && !!s1, `status=${l1.status} sessions=${(l1.json?.sessions || []).length}, none deep-equal to the guest report`);
    t.check("patient_sessions.row_fields", !!s1 && same(s1.symptoms, ["headache", "fatigue"]) && s1.constitution === "Qi" && typeof s1.id === "string" && !!s1.created_at, `row=${JSON.stringify(s1 && { ...s1, full_report: "…" })}`);
    const l2 = await call("/api/patient/sessions", { method: "GET", token: pat2.token });
    t.check("patient_sessions.isolated_per_user", l2.status === 200 && Array.isArray(l2.json?.sessions) && l2.json.sessions.length === 0, `other user sees ${(l2.json?.sessions || []).length} sessions`);
    t.check("patient_sessions.anonymous_401", (await call("/api/patient/sessions", { method: "GET" })).status === 401, "anon list must be 401");
    t.check("patient_sessions.create_anonymous_401", (await call("/api/patient/sessions", { body: { full_report: rich } })).status === 401, "anon create must be 401");

    const ps2 = await call("/api/patient/sessions", { body: { user_id: pat2.id, full_report: report || report0, primary_diagnosis: "x", constitution: "Qi", symptoms: "cough, fever" }, token: pat.token });
    t.check("patient_sessions.create_201_forces_own_user_id", ps2.status === 201 && ps2.json?.success === true && ps2.json.session?.user_id === pat.id && same(ps2.json.session?.symptoms, ["cough", "fever"]), `status=${ps2.status} user_id=${ps2.json?.session?.user_id} (want ${pat.id})`);
    const l3 = await call("/api/patient/sessions", { method: "GET", token: pat.token });
    t.check("patient_sessions.two_listed_newest_first", (l3.json?.sessions || []).length === 2 && same(l3.json.sessions[0].full_report, report || report0) && same(l3.json.sessions[1].full_report, rich), `n=${(l3.json?.sessions || []).length}`);
    t.check("patient_sessions.create_bad_json_400", (await call("/api/patient/sessions", { raw: "{", token: pat.token })).status === 400, "bad JSON must be 400");

    /* ---------- aggregated malformed-input sweep + liveness ---------- */
    const all = ["/api/chat", "/api/consult", "/api/report-chat", "/api/western-chat", "/api/heart-companion", "/api/analyze-image", "/api/analyze-audio", "/api/analyze-snore", "/api/extract-text", "/api/validate-medicine", "/api/doctor/generate-inquiry", "/api/summarize-inquiry", "/api/summarize-reports", "/api/summarize-medical-history", "/api/ask-dietary-advice", "/api/generate-infographic"];
    const badRaw = [["empty", ""], ["array", "[]"], ["string", '"x"'], ["truncated", '{"messages":[{"role":"user"']];
    const offenders = [];
    for (const p of all) for (const [n, raw] of badRaw) {
      const r = await call(p, { raw, token: p === "/api/doctor/generate-inquiry" ? doc.token : undefined });
      if (r.status === 0 || r.status >= 500) offenders.push(`${p}[${n}]=${r.status}`);
    }
    t.check("malformed_bodies_never_5xx", offenders.length === 0, offenders.join(", "));
    const hz = await call("/healthz", { method: "GET" });
    t.check("app_alive_after_abuse", hz.status === 200, `healthz status=${hz.status}`);
  },
};
