export default {
  name: "chat", needs: "stack", mutating: false, costly: true,
  doc: "/api/chat accepts symptoms ARRAY (Bug #3 pin) and string; streams non-empty text; bad JSON 400",
  async run(t) {
    const h = () => ({ headers: { "X-Forwarded-For": t.ip() } });
    const arr = await t.postJSON("/api/chat", { messages: [{ role: "user", content: "I have a headache and fatigue" }], basicInfo: { name: "张伟", age: "35", gender: "male", height: "175", weight: "72", symptoms: ["headache", "fatigue"] }, language: "en" }, h());
    t.check("symptoms_array_200", arr.status === 200, `status=${arr.status} (Bug 3 regression — want 200, not 400)`);
    t.check("symptoms_array_nonempty", arr.text.trim().length > 20, `bodylen=${arr.text.trim().length}`);
    const str = await t.postJSON("/api/chat", { messages: [{ role: "user", content: "headache" }], basicInfo: { name: "Ann", age: 30, symptoms: "headache" }, language: "en" }, h());
    t.check("symptoms_string_200", str.status === 200, `status=${str.status}`);
    const bad = await t.api("/api/chat", { method: "POST", body: "{not json", raw: true, headers: { "Content-Type": "application/json", ...h().headers } });
    t.check("bad_json_400", bad.status === 400, `status=${bad.status} (want 400)`);
  },
};
