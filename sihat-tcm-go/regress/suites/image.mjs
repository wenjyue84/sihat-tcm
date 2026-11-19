import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const mock = (n) => {
  const p = resolve(here, "../../../sihat-tcm-web/public/" + n);
  return existsSync(p) ? "data:image/png;base64," + readFileSync(p).toString("base64") : null;
};
export default {
  name: "image", needs: "stack", mutating: false, costly: true,
  doc: "analyze-image tongue+face: real observation, no raw-JSON leak, face not rejected as tongue (Bug #5 pin)",
  async run(t) {
    const tongue = mock("mock-tongue.png"), face = mock("mock-face.png");
    if (!tongue || !face) return t.skip("mock_images", "mock-*.png not found in ../sihat-tcm-web/public");
    for (const [type, url] of [["tongue", tongue], ["face", face]]) {
      const { status, json } = await t.postJSON("/api/analyze-image", { image: url, type }, { headers: { "X-Forwarded-For": t.ip() } });
      const obs = (json?.observation || "").trim();
      t.check(`${type}.status_200`, status === 200, `status=${status}`);
      t.check(`${type}.real_observation`, obs.length >= 50 && json?.status !== "Analysis pending" && json?.status !== "invalid_image", `status=${json?.status} obslen=${obs.length} (Bug 5 — want a real observation)`);
      t.check(`${type}.no_raw_json_leak`, !(obs.startsWith("{") || obs.includes('"is_valid_image"')), `raw JSON leaked into observation: ${obs.slice(0, 60)}`);
      if (type === "face") t.check("face.not_rejected_as_tongue", !/not (a|appear to be a clear) tongue|tongue diagnosis .*cannot|MUST be a tongue/i.test(obs), "face image rejected with the tongue prompt");
    }
  },
};
