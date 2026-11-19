-- Sihat TCM Go — database schema (Supabase / Postgres). IDEMPOTENT: safe to re-apply.
--
-- Derived from what the Go app really reads/writes (internal/server/*.go) plus the original
-- TypeScript migrations in ../sihat-tcm-web/sql. Apply with:  node db/apply-schema.mjs
-- (Management API, needs the PAT in 3-resources/credentials/supabase-pat.txt) or paste into the SQL editor.
--
-- ACCESS MODEL
--   * The Go server uses the SERVICE-ROLE key for everything except the tables below that it
--     reads/writes with the USER's JWT (RLS owner policies are what protects those):
--       diagnosis_sessions, user_notification_preferences, user_devices,
--       scheduled_notifications, notification_history
--   * Every other table has RLS ENABLED and (almost) no policy => service-role only.
--   * The browser never talks to Supabase directly.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'patient',
  is_approved boolean not null default false,
  -- doctor directory
  specialty text,
  bio text,
  years_experience integer,
  qualification text,
  languages text,
  clinic text,
  avg_response_time integer,
  -- patient basics
  age integer,
  gender text,
  height double precision,
  weight double precision,
  bmi double precision,
  medical_history text,
  preferred_language varchar(5) default 'en',
  preferences jsonb not null default '{}'::jsonb,
  flag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'patient';
alter table public.profiles add column if not exists is_approved boolean not null default false;
alter table public.profiles add column if not exists specialty text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists years_experience integer;
alter table public.profiles add column if not exists qualification text;
alter table public.profiles add column if not exists languages text;
alter table public.profiles add column if not exists clinic text;
alter table public.profiles add column if not exists avg_response_time integer;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists height double precision;
alter table public.profiles add column if not exists weight double precision;
alter table public.profiles add column if not exists bmi double precision;
alter table public.profiles add column if not exists medical_history text;
alter table public.profiles add column if not exists preferred_language varchar(5) default 'en';
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists flag text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('patient', 'doctor', 'admin', 'developer'));
alter table public.profiles drop constraint if exists valid_language_code;
alter table public.profiles add constraint valid_language_code
  check (preferred_language in ('en', 'zh', 'ms') or preferred_language is null);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_doctor_dir_idx on public.profiles(full_name) where role = 'doctor' and is_approved;
create index if not exists profiles_email_idx on public.profiles(lower(email));

-- ---------------------------------------------------------------------------------------------
-- generic updated_at trigger function
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- handle_new_user(): every auth.users insert gets a profile.
-- Role comes from raw_user_meta_data.role but ONLY 'doctor' is honoured; anything else (including a
-- client trying to self-assign admin/developer through signUp metadata) becomes 'patient'.
-- Admin/developer roles are granted by the service role only (seed script / dashboard).
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'patient'));
begin
  if meta_role not in ('patient', 'doctor') then
    meta_role := 'patient';
  end if;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    meta_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- patients (doctor-managed + registered + guest patient records)
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'patient_status') then
    create type public.patient_status as enum ('active', 'archived', 'pending_invite');
  end if;
  if not exists (select 1 from pg_type where typname = 'patient_type') then
    create type public.patient_type as enum ('managed', 'registered', 'guest');
  end if;
end $$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text,
  ic_no text unique,
  email text,
  phone text,
  birth_date date,
  gender text,
  status public.patient_status not null default 'active',
  type public.patient_type not null default 'managed',
  user_id uuid unique references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  clinical_summary jsonb,
  flag text
);
create index if not exists patients_user_id_idx on public.patients(user_id);
drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at before update on public.patients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- inquiries: consultation requests patient -> doctor (also the doctor "master inbox")
-- ---------------------------------------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  symptoms text,
  status text not null default 'pending',
  flag text,
  notes text,
  diagnosis_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.inquiries add column if not exists doctor_id uuid references public.profiles(id) on delete set null;
alter table public.inquiries add column if not exists status text not null default 'pending';
alter table public.inquiries add column if not exists flag text;
alter table public.inquiries add column if not exists notes text;
alter table public.inquiries add column if not exists updated_at timestamptz not null default now();
create index if not exists inquiries_user_id_idx on public.inquiries(user_id, created_at desc);
create index if not exists inquiries_doctor_id_idx on public.inquiries(doctor_id);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);
create index if not exists inquiries_status_idx on public.inquiries(status);
drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- diagnosis_sessions: saved reports ("Health Passport"). Read/written with the USER's token.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  primary_diagnosis text not null,
  constitution text,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  full_report jsonb not null,
  notes text,
  symptoms text[],
  medicines text[],
  vital_signs jsonb,
  clinical_notes text,
  treatment_plan text,
  follow_up_date date,
  inquiry_summary text,
  inquiry_chat_history jsonb,
  inquiry_report_files jsonb,
  inquiry_medicine_files jsonb,
  tongue_analysis jsonb,
  face_analysis jsonb,
  body_analysis jsonb,
  audio_analysis jsonb,
  pulse_data jsonb,
  is_guest_session boolean default false,
  guest_email text,
  guest_name text,
  is_hidden boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists diagnosis_sessions_user_id_idx on public.diagnosis_sessions(user_id, created_at desc);
create index if not exists diagnosis_sessions_patient_id_idx on public.diagnosis_sessions(patient_id);
create index if not exists diagnosis_sessions_symptoms_idx on public.diagnosis_sessions using gin(symptoms);
drop trigger if exists diagnosis_sessions_set_updated_at on public.diagnosis_sessions;
create trigger diagnosis_sessions_set_updated_at before update on public.diagnosis_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- guest_diagnosis_sessions: anonymous saves, migrated into diagnosis_sessions on signup (service role only)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.guest_diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  guest_email text,
  guest_name text,
  primary_diagnosis text not null,
  constitution text,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  full_report jsonb not null,
  notes text,
  symptoms text[],
  medicines text[],
  vital_signs jsonb,
  clinical_notes text,
  treatment_plan text,
  follow_up_date date,
  inquiry_summary text,
  inquiry_chat_history jsonb,
  inquiry_report_files jsonb,
  inquiry_medicine_files jsonb,
  tongue_analysis jsonb,
  face_analysis jsonb,
  body_analysis jsonb,
  audio_analysis jsonb,
  pulse_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  migrated_to_user_id uuid references auth.users(id) on delete set null,
  migrated_at timestamptz
);
create index if not exists guest_diag_created_idx on public.guest_diagnosis_sessions(created_at desc);
create index if not exists guest_diag_migrated_idx on public.guest_diagnosis_sessions(migrated_to_user_id) where migrated_to_user_id is not null;
drop trigger if exists guest_diag_set_updated_at on public.guest_diagnosis_sessions;
create trigger guest_diag_set_updated_at before update on public.guest_diagnosis_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- admin_settings: single row (id = 1). Extra secret-looking columns are masked by the Go API.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id integer primary key default 1,
  updated_at timestamptz default now(),
  constraint admin_settings_single_row check (id = 1)
);
alter table public.admin_settings add column if not exists acknowledged_alerts text[] default '{}';
alter table public.admin_settings add column if not exists music_url text;
alter table public.admin_settings add column if not exists music_enabled boolean default true;
alter table public.admin_settings add column if not exists gemini_api_key text;
alter table public.admin_settings add column if not exists openai_api_key text;
alter table public.admin_settings add column if not exists settings jsonb not null default '{}'::jsonb;
insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- system_prompts (role -> prompt text). Go reads select=prompt_text.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.system_prompts (
  id bigint generated by default as identity primary key,
  role text unique not null,
  prompt_text text,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------------------------
-- observability: system_logs / system_errors / system_metrics
-- ---------------------------------------------------------------------------------------------
create table if not exists public.system_logs (
  id bigint generated by default as identity primary key,
  "timestamp" timestamptz not null default now(),
  level text not null check (level in ('info', 'warn', 'error', 'debug')),
  category text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  user_id uuid references public.profiles(id) on delete set null
);
create index if not exists idx_system_logs_timestamp on public.system_logs("timestamp" desc);
create index if not exists idx_system_logs_level on public.system_logs(level);
create index if not exists idx_system_logs_category on public.system_logs(category);

-- id is a uuid here ON PURPOSE: the Go handler reads the inserted id into a string (error_id).
create table if not exists public.system_errors (
  id uuid primary key default gen_random_uuid(),
  "timestamp" timestamptz not null default now(),
  error_type varchar(100) not null,
  message text not null,
  stack_trace text,
  component varchar(200),
  user_id uuid references auth.users(id) on delete set null,
  session_id varchar(255),
  url text,
  user_agent text,
  severity varchar(20) default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_system_errors_created on public.system_errors(created_at desc);
create index if not exists idx_system_errors_severity on public.system_errors(severity, created_at desc);
drop trigger if exists system_errors_set_updated_at on public.system_errors;
create trigger system_errors_set_updated_at before update on public.system_errors
  for each row execute function public.set_updated_at();

create table if not exists public.system_metrics (
  id bigint generated by default as identity primary key,
  type text not null,
  name text not null,
  value text not null,           -- Go sends JSON numbers; Postgres stores them as text (same as the TS schema)
  unit text default 'count',
  tags jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  "timestamp" timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_system_metrics_type_ts on public.system_metrics(type, "timestamp" desc);
create index if not exists idx_system_metrics_name_ts on public.system_metrics(name, "timestamp" desc);

-- ---------------------------------------------------------------------------------------------
-- notifications (all four read/written with the USER's token => owner RLS)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  enabled boolean default true,
  health_reminders boolean default true,
  medication_alerts boolean default true,
  appointment_reminders boolean default true,
  exercise_reminders boolean default true,
  sleep_reminders boolean default true,
  quiet_hours_enabled boolean default true,
  quiet_hours_start time default '22:00:00',
  quiet_hours_end time default '07:00:00',
  frequency_daily boolean default true,
  frequency_weekly boolean default true,
  frequency_monthly boolean default false,
  categories jsonb default '{"health": true, "medication": true, "exercise": true, "diet": true, "sleep": true, "appointments": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_token text not null,
  device_type text not null check (device_type in ('ios', 'android', 'web')),
  device_name text,
  platform_info jsonb,
  is_active boolean default true,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, device_token)
);

create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  scheduled_for timestamptz not null,
  repeat_pattern text,
  repeat_config jsonb,
  category text not null,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_sent boolean default false,
  sent_at timestamptz,
  is_cancelled boolean default false,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  category text not null,
  priority text not null,
  sent_at timestamptz default now(),
  clicked boolean default false,
  clicked_at timestamptz,
  device_type text,
  created_at timestamptz default now()
);

create index if not exists idx_unp_user on public.user_notification_preferences(user_id);
create index if not exists idx_user_devices_user_active on public.user_devices(user_id, is_active);
create index if not exists idx_sched_user on public.scheduled_notifications(user_id);
create index if not exists idx_sched_pending on public.scheduled_notifications(user_id, is_sent, is_cancelled, scheduled_for);
create index if not exists idx_notif_hist_user_sent on public.notification_history(user_id, sent_at desc);

drop trigger if exists unp_set_updated_at on public.user_notification_preferences;
create trigger unp_set_updated_at before update on public.user_notification_preferences
  for each row execute function public.set_updated_at();
drop trigger if exists user_devices_set_updated_at on public.user_devices;
create trigger user_devices_set_updated_at before update on public.user_devices
  for each row execute function public.set_updated_at();
drop trigger if exists sched_set_updated_at on public.scheduled_notifications;
create trigger sched_set_updated_at before update on public.scheduled_notifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Wearable / phone health data (Web Bluetooth, Google Health, Apple Health export, iOS Shortcut / Android ingest,
-- manual entry). internal/server/health_*.go. KEEP IN SYNC with internal/localdb/schema.go.
--   health_readings        owner-only RLS, one row per (user, metric, instant, channel)
--   health_connections     service-role only: holds the AES-GCM sealed Google refresh token
--   health_ingest_tokens   service-role only: holds SHA-256(ingest token), never the token
-- ---------------------------------------------------------------------------------------------
create table if not exists public.health_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in ('heart_rate','resting_heart_rate','hrv_rmssd','hrv_sdnn','spo2','systolic_bp','diastolic_bp','body_temperature','respiratory_rate','steps','weight_kg','sleep_hours')),
  value double precision not null,
  unit text not null check (char_length(unit) <= 12),
  measured_at timestamptz not null,
  source text not null check (source in ('manual','bluetooth','google_health','apple_export','ingest')),
  device text check (device is null or char_length(device) <= 120),
  created_at timestamptz not null default now(),
  constraint health_readings_dedupe unique (user_id, metric, measured_at, source),
  constraint health_readings_value_range check (case metric
    when 'heart_rate' then value between 20 and 250
    when 'resting_heart_rate' then value between 20 and 200
    when 'hrv_rmssd' then value between 1 and 500
    when 'hrv_sdnn' then value between 1 and 500
    when 'spo2' then value between 50 and 100
    when 'systolic_bp' then value between 50 and 260
    when 'diastolic_bp' then value between 30 and 160
    when 'body_temperature' then value between 30 and 45
    when 'respiratory_rate' then value between 4 and 60
    when 'steps' then value between 0 and 200000
    when 'weight_kg' then value between 10 and 400
    when 'sleep_hours' then value between 0 and 24
    else false end)
);
create index if not exists idx_health_readings_user_metric_time on public.health_readings(user_id, metric, measured_at desc);

create table if not exists public.health_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_health')),
  status text not null default 'connected' check (status in ('connected','error','revoked')),
  scopes text,
  refresh_token_enc text,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_sync_status text,
  last_error text,
  unique (user_id, provider)
);

create table if not exists public.health_ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  token_hint text check (token_hint is null or char_length(token_hint) <= 8),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id)
);

-- ---------------------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.inquiries enable row level security;
alter table public.diagnosis_sessions enable row level security;
alter table public.guest_diagnosis_sessions enable row level security;
alter table public.admin_settings enable row level security;
alter table public.system_prompts enable row level security;
alter table public.system_logs enable row level security;
alter table public.system_errors enable row level security;
alter table public.system_metrics enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.user_devices enable row level security;
alter table public.scheduled_notifications enable row level security;
alter table public.notification_history enable row level security;
alter table public.health_readings enable row level security;
alter table public.health_connections enable row level security;      -- no policy: service role only
alter table public.health_ingest_tokens enable row level security;    -- no policy: service role only

-- Service-role-only tables (patients, inquiries, guest_diagnosis_sessions, admin_settings, system_*):
-- RLS on + NO policy => anon/authenticated get nothing; the service role bypasses RLS.

-- profiles: a signed-in user may read their OWN row (the app itself uses the service key).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);

-- diagnosis_sessions: owner only.
drop policy if exists ds_select_own on public.diagnosis_sessions;
drop policy if exists ds_insert_own on public.diagnosis_sessions;
drop policy if exists ds_update_own on public.diagnosis_sessions;
drop policy if exists ds_delete_own on public.diagnosis_sessions;
create policy ds_select_own on public.diagnosis_sessions for select to authenticated using (auth.uid() = user_id);
create policy ds_insert_own on public.diagnosis_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy ds_update_own on public.diagnosis_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ds_delete_own on public.diagnosis_sessions for delete to authenticated using (auth.uid() = user_id);

-- notification tables: owner only.
drop policy if exists unp_own on public.user_notification_preferences;
create policy unp_own on public.user_notification_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists devices_own on public.user_devices;
create policy devices_own on public.user_devices for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sched_own on public.scheduled_notifications;
create policy sched_own on public.scheduled_notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notif_hist_own on public.notification_history;
create policy notif_hist_own on public.notification_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists health_readings_own on public.health_readings;
create policy health_readings_own on public.health_readings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grants: PostgREST roles need table privileges for RLS to even be evaluated. Service role keeps ALL.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on public.diagnosis_sessions to authenticated;
grant select, insert, update, delete on public.user_notification_preferences to authenticated;
grant select, insert, update, delete on public.user_devices to authenticated;
grant select, insert, update, delete on public.scheduled_notifications to authenticated;
grant select, insert, update, delete on public.notification_history to authenticated;
grant select, insert, update, delete on public.health_readings to authenticated;
grant select on public.profiles to authenticated;

-- Make PostgREST pick up new tables/columns immediately.
notify pgrst, 'reload schema';
