/** Configure GoTrue for the app (Management API):  node db/configure-auth.mjs */
import { REF, mgmt } from "./mgmt.mjs";
const body = {
  mailer_autoconfirm: true,
  site_url: "https://tcm.wenjyue.com",
  uri_allow_list: ["https://tcm.wenjyue.com", "http://localhost:8081", "http://127.0.0.1:18081", "http://127.0.0.1:18131"].join(","),
  password_min_length: 6,
};
const r = await mgmt("PATCH", `/v1/projects/${REF}/config/auth`, body);
console.log("PATCH config/auth", r.status, r.ok ? "" : r.text.slice(0, 500));
const g = await mgmt("GET", `/v1/projects/${REF}/config/auth`);
const j = g.json || {};
console.log(JSON.stringify({ mailer_autoconfirm: j.mailer_autoconfirm, site_url: j.site_url, uri_allow_list: j.uri_allow_list, password_min_length: j.password_min_length }));
process.exit(r.ok ? 0 : 1);
