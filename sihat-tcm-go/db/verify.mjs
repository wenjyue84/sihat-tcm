/** Read-only verification via the Management API SQL endpoint:  node db/verify.mjs [schema|seed]  (default both) */
import { sql } from "./mgmt.mjs";
const mode = process.argv[2] || "both";
const q = async (s) => JSON.stringify((await sql(s)).json);
if (mode !== "seed") {
  console.log("tables+rls+cols", await q(`select c.relname, c.relrowsecurity as rls, (select count(*) from information_schema.columns k where k.table_schema='public' and k.table_name=c.relname) as cols from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1`));
  console.log("triggers", await q(`select event_object_schema||'.'||event_object_table t, trigger_name from information_schema.triggers where trigger_schema in ('public','auth') group by 1,2 order by 1,2`));
  console.log("policies", await q(`select tablename, policyname from pg_policies where schemaname='public' order by 1,2`));
  console.log("system_errors.id", await q(`select data_type from information_schema.columns where table_name='system_errors' and column_name='id'`));
}
if (mode !== "schema") {
  console.log("profiles", await q(`select email, role, is_approved, specialty is not null as has_spec from public.profiles order by role, email`));
  console.log("auth", await q(`select count(*) users, count(*) filter (where email_confirmed_at is not null) confirmed, (select count(*) from auth.identities) identities from auth.users`));
  console.log("prompts", await q(`select role, length(prompt_text) len from public.system_prompts order by role`));
}
