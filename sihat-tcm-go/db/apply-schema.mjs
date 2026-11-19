/** Apply db/schema.sql (idempotent) to the project via the Management API.  node db/apply-schema.mjs */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REF, sql } from "./mgmt.mjs";
const q = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "schema.sql"), "utf8");
const r = await sql(q);
console.log(`project ${REF}: HTTP ${r.status}`, r.ok ? "schema applied" : r.text.slice(0, 1500));
process.exit(r.ok ? 0 : 1);
