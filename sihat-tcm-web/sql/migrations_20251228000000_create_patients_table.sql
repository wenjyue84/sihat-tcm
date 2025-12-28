-- Create a unified patients table
create type patient_status as enum ('active', 'archived', 'pending_invite');
create type patient_type as enum ('managed', 'registered');

create table public.patients (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    
    -- Demographics
    first_name text not null,
    last_name text,
    ic_no text, -- Identity Card number, unique if provided
    email text,
    phone text,
    birth_date date,
    gender text,
    
    -- Status & Type
    status patient_status not null default 'active',
    type patient_type not null default 'managed',
    
    -- Linkages
    user_id uuid references auth.users(id), -- If registered, links to their auth account
    created_by uuid references auth.users(id), -- The doctor/admin who created this record
    
    -- Clinical 
    clinical_summary jsonb, -- Stores the AI generated summary
    
    constraint patients_pkey primary key (id),
    constraint patients_ic_no_key unique (ic_no),
    constraint patients_user_id_key unique (user_id) -- One patient record per registered user
);

-- RLS Policies
alter table public.patients enable row level security;

-- Doctors can view all patients they created OR patients who have granted them access (omitted complex access logic for now, assuming doctors see all for MVP or specific clinic logic)
-- For now, let's allow authenticated doctors to view all patients (simplified for Sihat TCM context where doctors share pool, or restrict to created_by)
-- Assuming a shared clinic model:
create policy "Doctors can view all patients"
    on public.patients for select
    to authenticated
    using (true); -- TODO: Refine based on specific clinic roles if needed

create policy "Doctors can insert patients"
    on public.patients for insert
    to authenticated
    with check (true);

create policy "Doctors can update patients"
    on public.patients for update
    to authenticated
    using (true);

-- Trigger to update updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.patients
  for each row execute procedure moddatetime (updated_at);
