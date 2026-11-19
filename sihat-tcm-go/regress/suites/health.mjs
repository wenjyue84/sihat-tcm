import { runDeviceChecks } from "../health_checks.mjs";

export default {
  name: "health", needs: "stack", mutating: false, costly: false,
  doc: "/healthz returns ok + ai/db configured; on a hermetic stack also the wearable/phone health-data integrations (regress/health_checks.mjs): ingest-token lifecycle, ingest validation/ranges/dedupe/auth, Apple Health export import, Google OAuth+PKCE against a fake, own-rows-only readings, not-configured states",
  async run(t) {
    const { status, json } = await t.get("/healthz");
    t.check("status_200", status === 200, `status=${status} (want 200)`);
    t.check("ok", json?.status === "ok", `status=${json?.status}`);
    t.check("ai_configured", json?.ai === true, `ai=${json?.ai}`);
    t.check("db_configured", json?.db === true, `db=${json?.db}`);
    const alias = await t.get("/api/health");
    t.check("api_health_alias", alias.status === 200 && alias.json?.status === "ok", `status=${alias.status}`);
    // The device checks create accounts and rows, so they run on the ACI's own hermetic stack only (never on a --base deployment).
    if (!t.stack) { t.skip("devices.hermetic_only", "device/health-data checks need the ACI's own stack (not --base)"); return; }
    await runDeviceChecks(t);
  },
};
