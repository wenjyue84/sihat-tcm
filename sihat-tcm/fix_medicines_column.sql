-- Quick Fix: Add medicines column to diagnosis_sessions table
-- This fixes the error: "Could not find the 'medicines' column of 'diagnosis_sessions' in the schema cache"
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" (or press Ctrl+Enter)
-- 4. You should see "Success. No rows returned"
-- 5. Restart your Next.js dev server

-- Add medicines column (and other doctor record fields if missing)
alter table public.diagnosis_sessions
  add column if not exists symptoms text[],
  add column if not exists medicines text[],
  add column if not exists vital_signs jsonb,
  add column if not exists clinical_notes text,
  add column if not exists treatment_plan text,
  add column if not exists follow_up_date date;

-- Add comments for documentation
comment on column public.diagnosis_sessions.symptoms is 'Array of reported symptoms (e.g., ["headache", "fatigue", "nausea"])';
comment on column public.diagnosis_sessions.medicines is 'Array of prescribed or current medications (e.g., ["Liu Wei Di Huang Wan", "Ginseng Extract"])';
comment on column public.diagnosis_sessions.vital_signs is 'Vital signs recorded during diagnosis (JSON: {bpm, blood_pressure, temperature, etc.})';
comment on column public.diagnosis_sessions.clinical_notes is 'Additional clinical observations and notes from the doctor';
comment on column public.diagnosis_sessions.treatment_plan is 'Treatment plan summary (dietary, lifestyle, herbal, etc.)';
comment on column public.diagnosis_sessions.follow_up_date is 'Recommended follow-up date for next consultation';

-- Create indexes for better query performance (if not already exists)
create index if not exists diagnosis_sessions_symptoms_idx on public.diagnosis_sessions using gin(symptoms);
create index if not exists diagnosis_sessions_medicines_idx on public.diagnosis_sessions using gin(medicines);
create index if not exists diagnosis_sessions_follow_up_date_idx on public.diagnosis_sessions(follow_up_date);

-- Verify the column was added
select 
  column_name, 
  data_type, 
  is_nullable
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'diagnosis_sessions'
  and column_name in ('medicines', 'symptoms', 'vital_signs', 'clinical_notes', 'treatment_plan', 'follow_up_date')
order by column_name;

