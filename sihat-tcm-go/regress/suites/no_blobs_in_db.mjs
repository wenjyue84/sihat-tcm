/**
 * no_blobs_in_db — HARD RULE (Jay, 2026-10-10, skill no-blobs-in-db): file bytes (images, audio, PDFs ...) are never stored
 * inside a database row. A client may still SEND a data URL (the wizard captures the tongue/face photo and the voice note in
 * the browser), but the SERVER must strip it, turn it into a file, or reject the request before the INSERT.
 *
 * The check: save guest sessions, patient sessions and a doctor request whose report carries `data:image/png;base64,...`
 * (and audio) strings -> after the save the stored rows must not contain them anywhere (full_report, tongue_analysis,
 * audio_analysis, diagnosis_report ...), neither as a data URL nor as the raw base64 bytes. A 4xx rejection also passes.
 * A control save without blobs proves the tables are readable and the save path works (no vacuous pass).
 * Failing checks are real app defects (see the detail strings); do not weaken them.
 */
import { randomBytes } from "node:crypto";

const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
const DATA_URL = /data:(image|audio|video|application)\/[a-z0-9.+-]+;base64,/i;

export default {
  name: "no_blobs_in_db", needs: "stack", mutating: true, costly: false,
  doc: "no image/audio/file bytes are ever stored in the database: guest/patient sessions and doctor requests that carry data:image/png;base64,... must not persist them (stripped, converted or rejected)",
  async run(t) {
    if (!t.hasDb) { t.skip("no_blobs", "no DB handle (t.dbTable) to inspect the stored rows"); return; }
    const u = t.uniq();
    const api = (path, o = {}) => t.api(path, { ...o, headers: { "X-Forwarded-For": t.ip(), ...(o.headers || {}) } });
    // a fresh random "image" per call: the raw base64 body is searched for as well, so renaming the prefix does not hide it
    const blob = (kind) => {
      const body = randomBytes(3000).toString("base64");
      return { body, url: kind === "audio" ? `data:audio/webm;base64,${body}` : `data:image/png;base64,iVBORw0KGgo${body}` };
    };
    const img = blob("image"), img2 = blob("image"), aud = blob("audio");
    const probes = [img.body, img2.body, aud.body];

    const pat = await t.signup(`nb-pat-${u}@example.com`, "NB Patient", "patient", {}, t.ip());
    t.check("setup.patient", !!pat.token, `signup -> ${pat.raw?.status}`);
    if (!pat.token) return;

    const leaks = async (table) => {
      const rows = await t.dbTable(table);
      if (!Array.isArray(rows)) return { rows: null, found: [] };
      const text = JSON.stringify(rows);
      const found = [];
      if (probes.some((p) => text.includes(p))) found.push("raw base64 bytes");
      const m = text.match(DATA_URL);
      if (m) found.push(`a ${m[0]} data URL`);
      return { rows, found };
    };
    const report = (extra = {}) => ({ diagnosis: { primary_pattern: "NB pattern " + u }, constitution: { type: "qi" }, tongue_image: img.url, nested: { photos: [img2.url, { audio: aud.url }] }, ...extra });

    /* ---- control: the same saves WITHOUT blobs are stored (proves the tables are readable and the endpoints work) ---- */
    const ctl = `nb-control-${u}`;
    const cg = await api("/api/guest/sessions", { method: "POST", body: { primary_diagnosis: ctl, symptoms: "a", full_report: { diagnosis: { primary_pattern: ctl } } } });
    const cp = await api("/api/patient/sessions", { method: "POST", token: pat.token, body: { primary_diagnosis: ctl, symptoms: "a", full_report: { diagnosis: { primary_pattern: ctl } } } });
    t.check("control.saves_without_blobs_succeed", cg.status === 201 && (cp.status === 201 || cp.status === 200), `guest=${cg.status} patient=${cp.status}`);
    t.check("control.rows_readable_in_db", JSON.stringify(await t.dbTable("guest_diagnosis_sessions")).includes(ctl) && JSON.stringify(await t.dbTable("diagnosis_sessions")).includes(ctl), "the control rows are not visible through the DB hook (the leak checks below would pass vacuously)");

    /* ---- guest session ---- */
    const g = await api("/api/guest/sessions", { method: "POST", body: { primary_diagnosis: "NB guest " + u, symptoms: "a, b", full_report: report(), tongue_analysis: { image: img.url, observation: "pale" }, face_analysis: { photo: img2.url }, audio_analysis: { recording: aud.url } } });
    const gl = await leaks("guest_diagnosis_sessions");
    t.check("guest.save_answered_201_or_4xx", g.status === 201 || (g.status >= 400 && g.status < 500), `guest session with image/audio data URLs -> ${g.status} ${g.text.slice(0, 100)}`);
    t.check("guest.no_bytes_in_stored_row", gl.rows && gl.found.length === 0, `guest_diagnosis_sessions stores ${gl.found.join(" + ")} (status ${g.status}): the full_report / *_analysis JSON keeps the image/audio bytes. The server must strip or reject data URLs before the INSERT (handlers_doctor.go:482 handleGuestSessionCreate -> dtValidateSession in handlers_data.go has no such check)`);

    /* ---- patient session (and the list API must not echo bytes either) ---- */
    const p = await api("/api/patient/sessions", { method: "POST", token: pat.token, body: { primary_diagnosis: "NB patient " + u, symptoms: "a, b", full_report: report({ tongue_image: img2.url }), tongue_analysis: { image: img2.url }, audio_analysis: { recording: aud.url } } });
    const pl = await leaks("diagnosis_sessions");
    t.check("patient.save_answered_2xx_or_4xx", p.status === 201 || p.status === 200 || (p.status >= 400 && p.status < 500), `patient session with image/audio data URLs -> ${p.status} ${p.text.slice(0, 100)}`);
    t.check("patient.no_bytes_in_stored_row", pl.rows && pl.found.length === 0, `diagnosis_sessions stores ${pl.found.join(" + ")} (status ${p.status}): the server must strip or reject data URLs before the INSERT (handlers_data.go:1040 handlePatientSessionsCreate)`);
    const list = await api("/api/patient/sessions", { token: pat.token });
    t.check("patient.list_response_carries_no_bytes", !probes.some((x) => list.text.includes(x)) && !DATA_URL.test(list.text), "GET /api/patient/sessions returns image/audio bytes from the stored report");

    /* ---- guest -> account migration must not smuggle bytes in either ---- */
    const tokG = g.json?.session_token;
    if (tokG) {
      const mg = await api("/api/migrate-guest-session", { method: "POST", token: pat.token, body: { sessionToken: tokG } });
      const afterMig = await leaks("diagnosis_sessions");
      t.check("migrate.no_bytes_after_migration", mg.status >= 400 || afterMig.found.length === 0, `after migrating the guest session diagnosis_sessions stores ${afterMig.found.join(" + ")}`);
    } else t.skip("migrate.no_bytes_after_migration", "guest save was rejected (no session_token to migrate): nothing stored, nothing to migrate");

    /* ---- doctor request (inquiries.diagnosis_report) ---- */
    const doc = await t.login("doctor@sihat.com", PW, t.ip());
    if (doc.id) {
      const vr = await api("/api/verification-request", { method: "POST", token: pat.token, body: { doctorId: doc.id, doctorName: "Demo Doctor", patientData: { name: "NB", photo: img.url }, reportData: report() } });
      const il = await leaks("inquiries");
      t.check("request.save_answered_200_or_4xx", vr.status === 200 || (vr.status >= 400 && vr.status < 500), `verification-request with image/audio data URLs -> ${vr.status} ${vr.text.slice(0, 100)}`);
      t.check("request.no_bytes_in_stored_row", il.rows && il.found.length === 0, `inquiries stores ${il.found.join(" + ")} (status ${vr.status}): the request's report/patient data keeps the image/audio bytes (handlers_data.go:~766 inserts body.ReportData as is)`);
    } else t.skip("request.no_bytes_in_stored_row", "seeded doctor login unavailable");
  },
};
