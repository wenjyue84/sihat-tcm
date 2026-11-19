/**
 * sql-contract-check.mjs — exercises the REAL Postgres (constraints, FKs, RLS, grants, triggers) with the same statements
 * PostgREST would run for the Go app's calls (INSERT … SELECT FROM json_populate_recordset, role = anon/authenticated/service_role,
 * request.jwt.claims.sub = the user), WITHOUT needing the REST/Auth gateway.  Uses the Management API SQL endpoint (PAT).
 *   node db/sql-contract-check.mjs
 * Everything it creates is @example.com test data and is deleted again inside the same script (cascade verified).
 * This is a stand-in for `aci.mjs test --db=real` while the project's data plane answers HTTP 402; it is NOT a replacement.
 */
import { sql } from "./mgmt.mjs";

const SETUP = String.raw`
create temp table res(name text, ok boolean, detail text);
grant all on res to public;
create or replace function pg_temp.chk(nm text, should_fail boolean, stmt text, rl text default 'service_role', uid text default null) returns void language plpgsql as $f$
declare ok boolean; msg text;
begin
  begin
    execute format('set local role %I', rl);
    perform set_config('request.jwt.claims', case when uid is null then '{}' else json_build_object('sub', uid, 'role', rl)::text end, true);
    execute stmt;
    ok := not should_fail; msg := 'ran';
  exception when others then ok := should_fail; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into pg_temp.res values (nm, ok, left(msg, 140));
end $f$;
create or replace function pg_temp.cnt(nm text, expected int, q text, rl text default 'service_role', uid text default null) returns void language plpgsql as $f$
declare n int; msg text := '';
begin
  begin
    execute format('set local role %I', rl);
    perform set_config('request.jwt.claims', case when uid is null then '{}' else json_build_object('sub', uid, 'role', rl)::text end, true);
    execute 'select count(*) from (' || q || ') s' into n;
  exception when others then n := -1; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into pg_temp.res values (nm, n = expected, 'count=' || n || ' expected=' || expected || ' ' || left(msg, 100));
end $f$;
create or replace function pg_temp.upd(nm text, expected int, stmt text, rl text default 'service_role', uid text default null) returns void language plpgsql as $f$
declare n int; msg text := '';
begin
  begin
    execute format('set local role %I', rl);
    perform set_config('request.jwt.claims', case when uid is null then '{}' else json_build_object('sub', uid, 'role', rl)::text end, true);
    execute stmt; get diagnostics n = row_count;
  exception when others then n := -1; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into pg_temp.res values (nm, n = expected, 'rows=' || n || ' expected=' || expected || ' ' || left(msg, 100));
end $f$;
create or replace function pg_temp.mkuser(em text, meta jsonb) returns uuid language plpgsql as $f$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, 'x', now(), '{"provider":"email"}', meta, now(), now(), '', '', '', '', '', '', '', '');
  return uid;
end $f$;
`;

const BODY = String.raw`
do $t$
declare a uuid; b uuid; d uuid; x uuid;
begin
  a := pg_temp.mkuser('sqlchk-a@example.com', '{"full_name":"A"}');
  b := pg_temp.mkuser('sqlchk-b@example.com', '{"full_name":"B"}');
  d := pg_temp.mkuser('sqlchk-d@example.com', '{"full_name":"Dr D","role":"doctor"}');
  x := pg_temp.mkuser('sqlchk-x@example.com', '{"full_name":"X","role":"admin"}');
  insert into pg_temp.res select 'trigger.profile_created_for_each_user', (select count(*) from public.profiles where id in (a,b,d,x)) = 4, '';
  insert into pg_temp.res select 'trigger.signup_cannot_self_assign_admin', (select role from public.profiles where id = x) = 'patient', 'role=' || (select role from public.profiles where id = x);
  insert into pg_temp.res select 'trigger.doctor_signup_keeps_doctor_unapproved', (select role = 'doctor' and not is_approved from public.profiles where id = d), '';

  perform pg_temp.chk('profiles.role_check_rejects_root', true, format('update public.profiles set role=%L where id=%L', 'root', a));
  perform pg_temp.chk('profiles.language_check_rejects_klingon', true, format('update public.profiles set preferred_language=%L where id=%L', 'klingon', a));
  perform pg_temp.chk('profiles.partial_upsert_like_PUT_patient_profile', false, format($q$insert into public.profiles (id, full_name, age, gender, height, weight, bmi, medical_history, preferred_language)
      select id, full_name, age, gender, height, weight, bmi, medical_history, preferred_language from json_populate_recordset(null::public.profiles, '[{"id":"%s","full_name":"A Updated","age":30,"gender":"f","height":165.5,"weight":55,"bmi":20.2,"medical_history":"none","preferred_language":"zh"}]')
      on conflict (id) do update set full_name=excluded.full_name, age=excluded.age, gender=excluded.gender, height=excluded.height, weight=excluded.weight, bmi=excluded.bmi, medical_history=excluded.medical_history, preferred_language=excluded.preferred_language$q$, a));
  insert into pg_temp.res select 'profiles.upsert_kept_email_and_role', (select email = 'sqlchk-a@example.com' and role = 'patient' and full_name = 'A Updated' from public.profiles where id = a), '';

  -- RLS: diagnosis_sessions is read/written with the USER's token
  perform pg_temp.chk('rls.A_inserts_own_session', false, format($q$insert into public.diagnosis_sessions (user_id, primary_diagnosis, full_report, symptoms, overall_score)
      select user_id, primary_diagnosis, full_report, symptoms, overall_score from json_populate_recordset(null::public.diagnosis_sessions, '[{"user_id":"%s","primary_diagnosis":"Qi deficiency","full_report":{"x":1},"symptoms":["a","b"],"overall_score":70}]')$q$, a), 'authenticated', a::text);
  perform pg_temp.chk('rls.A_cannot_insert_session_for_B', true, format($q$insert into public.diagnosis_sessions (user_id, primary_diagnosis, full_report) values (%L, 'x', '{}')$q$, b), 'authenticated', a::text);
  perform pg_temp.chk('rls.session_requires_primary_diagnosis_and_report', true, format($q$insert into public.diagnosis_sessions (user_id) values (%L)$q$, a), 'authenticated', a::text);
  perform pg_temp.chk('rls.session_score_range_enforced', true, format($q$insert into public.diagnosis_sessions (user_id, primary_diagnosis, full_report, overall_score) values (%L, 'x', '{}', 101)$q$, a), 'authenticated', a::text);
  perform pg_temp.cnt('rls.A_sees_own_session', 1, 'select * from public.diagnosis_sessions', 'authenticated', a::text);
  perform pg_temp.cnt('rls.B_sees_none_of_As_sessions', 0, 'select * from public.diagnosis_sessions', 'authenticated', b::text);
  perform pg_temp.upd('rls.B_cannot_update_As_session', 0, $q$update public.diagnosis_sessions set notes='hacked'$q$, 'authenticated', b::text);
  perform pg_temp.cnt('rls.anon_sees_no_sessions', 0, 'select * from public.diagnosis_sessions', 'anon');
  perform pg_temp.cnt('rls.anon_sees_no_profiles', 0, 'select * from public.profiles', 'anon');
  perform pg_temp.cnt('rls.A_reads_only_own_profile', 1, 'select * from public.profiles', 'authenticated', a::text);
  perform pg_temp.upd('rls.authenticated_cannot_write_profiles', 0, format($q$update public.profiles set role='admin' where id=%L$q$, a), 'authenticated', a::text);

  -- service-role-only tables: seeded with one row each below, then must look EMPTY to anon/authenticated (RLS on, no policy)
  insert into public.inquiries (user_id) values (a);
  insert into public.patients (first_name) values ('RLS probe');
  insert into public.system_errors (error_type, message) values ('t', 'm');
  insert into public.system_logs (level, category, message) values ('info', 'ui', 'm');
  insert into public.system_metrics (type, name, value) values ('perf', 'lcp', '1');
  insert into public.guest_diagnosis_sessions (session_token, primary_diagnosis, full_report) values ('sqlchk-rls', 'd', '{}');
  perform pg_temp.cnt('rls.' || t || '_empty_for_' || r, 0, 'select * from public.' || t, r, a::text)
    from unnest(array['inquiries','patients','admin_settings','system_prompts','system_logs','system_errors','system_metrics','guest_diagnosis_sessions']) t, unnest(array['authenticated','anon']) r;

  -- service-role writes (what the Go handlers do with the service key)
  perform pg_temp.chk('svc.verification_request_insert', false, format($q$insert into public.inquiries (user_id, doctor_id, status, symptoms, diagnosis_report)
      select user_id, doctor_id, status, symptoms, diagnosis_report from json_populate_recordset(null::public.inquiries, '[{"user_id":"%s","doctor_id":"%s","status":"pending","symptoms":"Request for Verification","diagnosis_report":{"type":"verification_request","messages":[]}}]')$q$, a, d));
  perform pg_temp.chk('svc.inquiry_flag_update', false, format($q$update public.inquiries set flag='watch', notes='n', status='replied' where user_id=%L$q$, a));
  perform pg_temp.chk('svc.inquiry_requires_existing_profile_fk', true, format($q$insert into public.inquiries (user_id) values (%L)$q$, gen_random_uuid()));
  perform pg_temp.chk('svc.inquiry_unknown_doctor_fk', true, format($q$insert into public.inquiries (user_id, doctor_id) values (%L, %L)$q$, a, gen_random_uuid()));
  perform pg_temp.chk('svc.patients_non_uuid_id_rejected (suite uses pat-<u>)', true, $q$insert into public.patients (id, first_name) values ('pat-123', 'Victim')$q$);
  perform pg_temp.chk('svc.patients_insert_with_user_link', false, format($q$insert into public.patients (first_name, last_name, user_id, birth_date, email) values ('Victim', 'Bee', %L, '1980-01-01', 'sqlchk-b@example.com')$q$, b));
  perform pg_temp.chk('svc.guest_session_insert_array_symptoms', false, $q$insert into public.guest_diagnosis_sessions (session_token, primary_diagnosis, full_report, symptoms, guest_email)
      select session_token, primary_diagnosis, full_report, symptoms, guest_email from json_populate_recordset(null::public.guest_diagnosis_sessions, '[{"session_token":"sqlchk-tok-1","primary_diagnosis":"d","full_report":{"a":1},"symptoms":["x","y"],"guest_email":"g@example.com"}]')$q$);
  perform pg_temp.chk('svc.guest_session_unique_token', true, $q$insert into public.guest_diagnosis_sessions (session_token, primary_diagnosis, full_report) values ('sqlchk-tok-1', 'd', '{}')$q$);
  perform pg_temp.chk('svc.guest_migration_insert_as_user', false, format($q$insert into public.diagnosis_sessions (user_id, primary_diagnosis, full_report, is_guest_session) values (%L, 'd', '{}', false)$q$, b), 'authenticated', b::text);
  perform pg_temp.chk('svc.guest_mark_migrated', false, format($q$update public.guest_diagnosis_sessions set migrated_to_user_id=%L, migrated_at=now() where session_token='sqlchk-tok-1'$q$, b));
  perform pg_temp.chk('svc.system_error_insert_returns_uuid_id', false, $q$insert into public.system_errors (error_type, message, severity, metadata) select error_type, message, severity, metadata from json_populate_recordset(null::public.system_errors, '[{"error_type":"t","message":"m","severity":"medium","metadata":{}}]') returning id::text$q$);
  perform pg_temp.chk('svc.system_error_bad_severity_rejected', true, $q$insert into public.system_errors (error_type, message, severity) values ('t','m','catastrophic')$q$);
  perform pg_temp.chk('svc.system_log_insert', false, $q$insert into public.system_logs (level, category, message, metadata, user_id) select level, category, message, metadata, user_id from json_populate_recordset(null::public.system_logs, '[{"level":"warn","category":"ui","message":"m","metadata":{},"user_id":null}]')$q$);
  perform pg_temp.chk('svc.system_log_bad_level_rejected', true, $q$insert into public.system_logs (level, category, message) values ('fatal','c','m')$q$);
  perform pg_temp.chk('svc.system_metrics_numeric_value_into_text', false, $q$insert into public.system_metrics (type, name, value, unit, tags, "timestamp", metadata) select type, name, value, unit, tags, "timestamp", metadata from json_populate_recordset(null::public.system_metrics, '[{"type":"perf","name":"lcp","value":1234.5,"unit":"ms","tags":{},"timestamp":"2026-10-10T00:00:00Z","metadata":{}}]')$q$);
  perform pg_temp.chk('svc.admin_settings_update_known_columns', false, $q$update public.admin_settings set music_url='http://x/y.mp3', music_enabled=false, gemini_api_key='k' where id > 0 returning *$q$);
  perform pg_temp.chk('svc.admin_settings_unknown_column_rejected (why the handler whitelists)', true, $q$update public.admin_settings set service_role_key='k' where id > 0$q$);
  perform pg_temp.chk('svc.admin_settings_single_row', true, $q$insert into public.admin_settings (id) values (2)$q$);
  perform pg_temp.cnt('svc.system_prompts_seeded_chat_prompt', 1, $q$select 1 from public.system_prompts where role='doctor_chat' and length(prompt_text) > 100$q$);
  perform pg_temp.cnt('svc.doctor_directory_query', 1, $q$select id from public.profiles where role='doctor' and is_approved=true and email='doctor@sihat.com'$q$);

  -- notification tables: owner RLS with the user's token
  perform pg_temp.chk('rls.A_inserts_device', false, format($q$insert into public.user_devices (user_id, device_token, device_type, device_name) values (%L, 'tok', 'web', 'Chrome')$q$, a), 'authenticated', a::text);
  perform pg_temp.chk('rls.device_type_check', true, format($q$insert into public.user_devices (user_id, device_token, device_type) values (%L, 'tok2', 'toaster')$q$, a), 'authenticated', a::text);
  perform pg_temp.cnt('rls.B_cannot_see_As_devices', 0, 'select * from public.user_devices', 'authenticated', b::text);
  perform pg_temp.chk('rls.A_cannot_insert_device_for_B', true, format($q$insert into public.user_devices (user_id, device_token, device_type) values (%L, 'tok3', 'web')$q$, b), 'authenticated', a::text);
  perform pg_temp.chk('rls.A_inserts_prefs_and_schedule_and_history', false, format($q$
      insert into public.user_notification_preferences (user_id, enabled, quiet_hours_start) values (%1$L, true, '22:00');
      insert into public.scheduled_notifications (user_id, notification_type, title, body, scheduled_for, category, priority) values (%1$L, 'reminder', 't', 'b', now(), 'health', 'high');
      insert into public.notification_history (user_id, notification_type, title, body, category, priority) values (%1$L, 'reminder', 't', 'b', 'health', 'high')$q$, a), 'authenticated', a::text);
  perform pg_temp.chk('rls.prefs_one_row_per_user', true, format($q$insert into public.user_notification_preferences (user_id) values (%L)$q$, a), 'authenticated', a::text);
  perform pg_temp.chk('rls.schedule_priority_check', true, format($q$insert into public.scheduled_notifications (user_id, notification_type, title, body, scheduled_for, category, priority) values (%L, 'r', 't', 'b', now(), 'c', 'panic')$q$, a), 'authenticated', a::text);
  perform pg_temp.cnt('rls.B_cannot_see_As_scheduled', 0, 'select * from public.scheduled_notifications', 'authenticated', b::text);
  perform pg_temp.cnt('rls.B_cannot_see_As_history', 0, 'select * from public.notification_history', 'authenticated', b::text);
  perform pg_temp.cnt('rls.B_cannot_see_As_prefs', 0, 'select * from public.user_notification_preferences', 'authenticated', b::text);
  perform pg_temp.cnt('rls.A_sees_own_scheduled', 1, 'select * from public.scheduled_notifications', 'authenticated', a::text);

  -- cascade: deleting the auth users removes everything they own (what cleanup-real-db relies on)
  delete from public.patients where email like '%@example.com' or user_id in (a,b,d,x) or first_name = 'RLS probe';
  delete from public.guest_diagnosis_sessions where session_token like 'sqlchk-%';
  delete from public.guest_diagnosis_sessions where guest_email like '%@example.com' or migrated_to_user_id in (a,b,d,x);
  delete from auth.users where id in (a,b,d,x);
  insert into pg_temp.res select 'cleanup.cascade_leaves_no_rows', (select count(*) from public.profiles where email like 'sqlchk-%') + (select count(*) from public.inquiries where user_id in (a,b,d,x))
      + (select count(*) from public.diagnosis_sessions where user_id in (a,b,d,x)) + (select count(*) from public.user_devices where user_id in (a,b,d,x))
      + (select count(*) from public.scheduled_notifications where user_id in (a,b,d,x)) + (select count(*) from public.notification_history where user_id in (a,b,d,x))
      + (select count(*) from public.user_notification_preferences where user_id in (a,b,d,x)) = 0, '';
  update public.admin_settings set music_url = null, music_enabled = true, gemini_api_key = null where id = 1;
  delete from public.system_errors where error_type = 't' and message = 'm';
  delete from public.system_errors where error_type = 't';
  delete from public.system_logs where category = 'ui' and message = 'm';
  delete from public.system_logs where category = 'ui';
  delete from public.system_metrics where name = 'lcp' and type = 'perf';
end $t$;
select name, ok, detail from pg_temp.res order by ok, name;
`;

const r = await sql(SETUP + BODY);
if (!r.ok || !Array.isArray(r.json)) { console.error("sql-contract-check failed:", r.status, r.text.slice(0, 800)); process.exit(1); }
const bad = r.json.filter((x) => !x.ok);
for (const x of r.json) console.log(`${x.ok ? "ok  " : "FAIL"} ${x.name}${x.ok ? "" : "  -> " + x.detail}`);
console.log(`\n${r.json.length - bad.length}/${r.json.length} passed`);
process.exit(bad.length ? 1 : 0);
