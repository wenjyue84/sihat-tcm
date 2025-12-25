-- Migration: Add doctor record fields to diagnosis_sessions table
-- Description: Adds symptoms, medicines, and other clinical details that doctors would keep in their records

-- 1. Add new columns to diagnosis_sessions table
alter table public.diagnosis_sessions
  add column if not exists symptoms text[],
  add column if not exists medicines text[],
  add column if not exists vital_signs jsonb,
  add column if not exists clinical_notes text,
  add column if not exists treatment_plan text,
  add column if not exists follow_up_date date;

-- 2. Add comments for documentation
comment on column public.diagnosis_sessions.symptoms is 'Array of reported symptoms (e.g., ["headache", "fatigue", "nausea"])';
comment on column public.diagnosis_sessions.medicines is 'Array of prescribed or current medications (e.g., ["Liu Wei Di Huang Wan", "Ginseng Extract"])';
comment on column public.diagnosis_sessions.vital_signs is 'Vital signs recorded during diagnosis (JSON: {bpm, blood_pressure, temperature, etc.})';
comment on column public.diagnosis_sessions.clinical_notes is 'Additional clinical observations and notes from the doctor';
comment on column public.diagnosis_sessions.treatment_plan is 'Treatment plan summary (dietary, lifestyle, herbal, etc.)';
comment on column public.diagnosis_sessions.follow_up_date is 'Recommended follow-up date for next consultation';

-- 3. Create indexes for better query performance
create index if not exists diagnosis_sessions_symptoms_idx on public.diagnosis_sessions using gin(symptoms);
create index if not exists diagnosis_sessions_medicines_idx on public.diagnosis_sessions using gin(medicines);
create index if not exists diagnosis_sessions_follow_up_date_idx on public.diagnosis_sessions(follow_up_date);

