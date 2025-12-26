-- Migration: Add comprehensive input data fields to diagnosis_sessions
-- Description: Stores all raw input data collected during diagnosis for complete patient history
-- Phase: 1 - Database Schema Enhancement

-- ============================================================================
-- PART 1: Add input data columns to diagnosis_sessions table
-- ============================================================================

alter table public.diagnosis_sessions
  -- Inquiry data
  add column if not exists inquiry_summary text,
  add column if not exists inquiry_chat_history jsonb,
  add column if not exists inquiry_report_files jsonb, -- Array of file metadata
  add column if not exists inquiry_medicine_files jsonb, -- Array of file metadata
  
  -- Visual analysis data
  add column if not exists tongue_analysis jsonb, -- {image_url, observation, analysis_tags, tcm_indicators, pattern_suggestions}
  add column if not exists face_analysis jsonb, -- {image_url, observation, analysis_tags, tcm_indicators}
  add column if not exists body_analysis jsonb, -- {image_url, observation, analysis_tags}
  
  -- Audio analysis
  add column if not exists audio_analysis jsonb, -- {audio_url, observation, potential_issues}
  
  -- Pulse data (enhanced)
  add column if not exists pulse_data jsonb, -- {bpm, quality, rhythm, strength, notes}
  
  -- Guest user support
  add column if not exists is_guest_session boolean default false,
  add column if not exists guest_email text, -- For follow-up signup prompts
  add column if not exists guest_name text;

-- ============================================================================
-- PART 2: Add comments for documentation
-- ============================================================================

comment on column public.diagnosis_sessions.inquiry_summary is 'Summary text from inquiry step (wen_inquiry.inquiryText)';
comment on column public.diagnosis_sessions.inquiry_chat_history is 'Full chat conversation history from inquiry (array of {role, content, timestamp})';
comment on column public.diagnosis_sessions.inquiry_report_files is 'Metadata for medical report files uploaded during inquiry';
comment on column public.diagnosis_sessions.inquiry_medicine_files is 'Metadata for medicine files uploaded during inquiry';
comment on column public.diagnosis_sessions.tongue_analysis is 'Complete tongue analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.face_analysis is 'Complete face analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.body_analysis is 'Complete body part analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.audio_analysis is 'Complete audio analysis data including audio file, observation, and potential issues';
comment on column public.diagnosis_sessions.pulse_data is 'Complete pulse measurement data including BPM, quality, rhythm, strength, and notes';
comment on column public.diagnosis_sessions.is_guest_session is 'Whether this session was created by a guest user (not authenticated)';
comment on column public.diagnosis_sessions.guest_email is 'Email address provided by guest for signup prompts';
comment on column public.diagnosis_sessions.guest_name is 'Name provided by guest during diagnosis';

-- ============================================================================
-- PART 3: Create indexes for query performance
-- ============================================================================

-- Full-text search index for inquiry summary
create index if not exists diagnosis_sessions_inquiry_summary_idx 
  on public.diagnosis_sessions using gin(to_tsvector('english', inquiry_summary));

-- Index for guest sessions filtering
create index if not exists diagnosis_sessions_is_guest_idx 
  on public.diagnosis_sessions(is_guest_session);

-- Index for guest email lookups (for signup prompts)
create index if not exists diagnosis_sessions_guest_email_idx 
  on public.diagnosis_sessions(guest_email) 
  where is_guest_session = true;

-- GIN indexes for JSONB columns (for efficient JSON queries)
create index if not exists diagnosis_sessions_tongue_analysis_idx 
  on public.diagnosis_sessions using gin(tongue_analysis) 
  where tongue_analysis is not null;

create index if not exists diagnosis_sessions_face_analysis_idx 
  on public.diagnosis_sessions using gin(face_analysis) 
  where face_analysis is not null;

create index if not exists diagnosis_sessions_pulse_data_idx 
  on public.diagnosis_sessions using gin(pulse_data) 
  where pulse_data is not null;

-- ============================================================================
-- PART 4: Create guest_diagnosis_sessions table
-- ============================================================================

-- This table stores diagnosis sessions for unauthenticated (guest) users
-- Sessions can be migrated to diagnosis_sessions when user signs up
create table if not exists public.guest_diagnosis_sessions (
  id uuid default gen_random_uuid() primary key,
  session_token text unique not null, -- Temporary token for guest access
  
  -- Guest identification
  guest_email text,
  guest_name text,
  
  -- Core diagnosis metadata (same as diagnosis_sessions)
  primary_diagnosis text not null,
  constitution text,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  full_report jsonb not null,
  notes text,
  
  -- Doctor record fields
  symptoms text[],
  medicines text[],
  vital_signs jsonb,
  clinical_notes text,
  treatment_plan text,
  follow_up_date date,
  
  -- Input data fields (same as diagnosis_sessions)
  inquiry_summary text,
  inquiry_chat_history jsonb,
  inquiry_report_files jsonb,
  inquiry_medicine_files jsonb,
  tongue_analysis jsonb,
  face_analysis jsonb,
  body_analysis jsonb,
  audio_analysis jsonb,
  pulse_data jsonb,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Migration fields (when guest signs up)
  migrated_to_user_id uuid references auth.users(id) on delete set null,
  migrated_at timestamp with time zone
);

-- ============================================================================
-- PART 5: Indexes for guest_diagnosis_sessions
-- ============================================================================

create index if not exists guest_diagnosis_sessions_token_idx 
  on public.guest_diagnosis_sessions(session_token);

create index if not exists guest_diagnosis_sessions_email_idx 
  on public.guest_diagnosis_sessions(guest_email) 
  where guest_email is not null;

create index if not exists guest_diagnosis_sessions_migrated_idx 
  on public.guest_diagnosis_sessions(migrated_to_user_id) 
  where migrated_to_user_id is not null;

create index if not exists guest_diagnosis_sessions_created_at_idx 
  on public.guest_diagnosis_sessions(created_at desc);

-- ============================================================================
-- PART 6: RLS for guest_diagnosis_sessions
-- ============================================================================

alter table public.guest_diagnosis_sessions enable row level security;

-- Policy: Anyone can create a guest session (for unauthenticated users)
create policy "Anyone can create guest sessions"
  on public.guest_diagnosis_sessions
  for insert
  with check (true);

-- Policy: Token holders can view their guest session
-- Note: Token validation should be done in application layer for security
create policy "Token holders can view their guest session"
  on public.guest_diagnosis_sessions
  for select
  using (true); -- Application layer will validate token

-- Policy: Authenticated users can view their migrated sessions
create policy "Users can view their migrated guest sessions"
  on public.guest_diagnosis_sessions
  for select
  using (auth.uid() = migrated_to_user_id);

-- Policy: System can update guest sessions (for migration)
-- Note: This should be restricted to server-side operations only
create policy "System can update guest sessions for migration"
  on public.guest_diagnosis_sessions
  for update
  using (true)
  with check (true);

-- ============================================================================
-- PART 7: Trigger for guest_diagnosis_sessions updated_at
-- ============================================================================

create or replace function public.update_guest_diagnosis_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_guest_diagnosis_sessions_updated_at
  before update on public.guest_diagnosis_sessions
  for each row
  execute function public.update_guest_diagnosis_sessions_updated_at();

-- ============================================================================
-- PART 8: Add comments for guest_diagnosis_sessions table
-- ============================================================================

comment on table public.guest_diagnosis_sessions is 'Stores diagnosis sessions for unauthenticated (guest) users. Can be migrated to diagnosis_sessions when user signs up.';
comment on column public.guest_diagnosis_sessions.session_token is 'Unique token for guest to access their session (stored in sessionStorage)';
comment on column public.guest_diagnosis_sessions.migrated_to_user_id is 'User ID after guest session is migrated to authenticated user account';
comment on column public.guest_diagnosis_sessions.migrated_at is 'Timestamp when guest session was migrated to authenticated user';

