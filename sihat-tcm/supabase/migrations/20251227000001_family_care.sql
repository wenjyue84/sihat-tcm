-- Migration: Create family_members table for "Family Care" feature
-- Description: Stores family member profiles managed by the primary account holder

-- 1. Create family_members table
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Member profile
  name text not null,
  relationship text not null, -- 'mother', 'father', 'spouse', 'child', 'sibling', 'other'
  gender text, -- 'male', 'female', 'other'
  date_of_birth date,
  
  -- Health data
  height numeric,
  weight numeric,
  medical_history text,
  
  -- Avatar (optional)
  avatar_url text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create indexes for performance
create index if not exists family_members_user_id_idx on public.family_members(user_id);
create index if not exists family_members_relationship_idx on public.family_members(relationship);

-- 3. Enable Row Level Security (RLS)
alter table public.family_members enable row level security;

-- 4. RLS Policies

-- Policy: Users can view only their own family members
create policy "Users can view their own family members"
  on public.family_members
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own family members
create policy "Users can insert their own family members"
  on public.family_members
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own family members
create policy "Users can update their own family members"
  on public.family_members
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own family members
create policy "Users can delete their own family members"
  on public.family_members
  for delete
  using (auth.uid() = user_id);

-- 5. Create trigger to auto-update updated_at timestamp
create or replace function public.update_family_members_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_family_members_updated_at
  before update on public.family_members
  for each row
  execute function public.update_family_members_updated_at();

-- 6. Add family_member_id to diagnosis_sessions for linking diagnoses to family members
alter table public.diagnosis_sessions 
  add column if not exists family_member_id uuid references public.family_members(id) on delete set null;

create index if not exists diagnosis_sessions_family_member_id_idx on public.diagnosis_sessions(family_member_id);

-- 7. Add helpful comments
comment on table public.family_members is 'Stores family member profiles for "Family Care" feature';
comment on column public.family_members.relationship is 'Relationship to account holder: mother, father, spouse, child, sibling, other';
comment on column public.family_members.medical_history is 'Known conditions, allergies, or medications';
comment on column public.diagnosis_sessions.family_member_id is 'Optional link to family member if diagnosis was performed for them';
