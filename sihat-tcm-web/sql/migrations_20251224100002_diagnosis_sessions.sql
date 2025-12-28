-- Migration: Create diagnosis_sessions table for "My Health Passport" feature
-- Description: Stores patient diagnosis history with full report data and metadata

-- 1. Create diagnosis_sessions table
create table if not exists public.diagnosis_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Core diagnosis metadata
  primary_diagnosis text not null,
  constitution text,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  
  -- Full report data (complete JSON from AI)
  full_report jsonb not null,
  
  -- Patient notes (user can add their own observations)
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create indexes for performance
create index if not exists diagnosis_sessions_user_id_idx on public.diagnosis_sessions(user_id);
create index if not exists diagnosis_sessions_created_at_idx on public.diagnosis_sessions(created_at desc);
create index if not exists diagnosis_sessions_primary_diagnosis_idx on public.diagnosis_sessions(primary_diagnosis);

-- 3. Enable Row Level Security (RLS)
alter table public.diagnosis_sessions enable row level security;

-- 4. RLS Policies

-- Policy: Users can view only their own diagnosis sessions
create policy "Users can view their own diagnosis sessions"
  on public.diagnosis_sessions
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own diagnosis sessions
create policy "Users can insert their own diagnosis sessions"
  on public.diagnosis_sessions
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own diagnosis sessions (mainly for notes)
create policy "Users can update their own diagnosis sessions"
  on public.diagnosis_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own diagnosis sessions
create policy "Users can delete their own diagnosis sessions"
  on public.diagnosis_sessions
  for delete
  using (auth.uid() = user_id);

-- Policy: Doctors can view all diagnosis sessions (for clinical oversight)
create policy "Doctors can view all diagnosis sessions"
  on public.diagnosis_sessions
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'doctor'
    )
  );

-- 5. Create trigger to auto-update updated_at timestamp
create or replace function public.update_diagnosis_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_diagnosis_sessions_updated_at
  before update on public.diagnosis_sessions
  for each row
  execute function public.update_diagnosis_sessions_updated_at();

-- 6. Add helpful comments
comment on table public.diagnosis_sessions is 'Stores patient diagnosis history for "My Health Passport" feature';
comment on column public.diagnosis_sessions.primary_diagnosis is 'Main TCM diagnosis (e.g., "Yin Deficiency", "Damp Heat")';
comment on column public.diagnosis_sessions.overall_score is 'Overall health/vitality score (0-100) derived from analysis';
comment on column public.diagnosis_sessions.full_report is 'Complete diagnosis report JSON from AI including all sections';
comment on column public.diagnosis_sessions.notes is 'User-added private notes about how they felt during this session';

