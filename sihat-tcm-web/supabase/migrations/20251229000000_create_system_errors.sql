-- Create system_errors table for error tracking
create table if not exists system_errors (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now() not null,
  error_type text not null,
  message text not null,
  stack_trace text,
  component text,
  user_id uuid references auth.users(id),
  session_id text,
  url text,
  user_agent text,
  severity text check (severity in ('low', 'medium', 'high', 'critical')) default 'medium',
  resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for common query patterns
create index if not exists system_errors_timestamp_idx on system_errors (timestamp);
create index if not exists system_errors_user_id_idx on system_errors (user_id);
create index if not exists system_errors_resolved_idx on system_errors (resolved);
create index if not exists system_errors_severity_idx on system_errors (severity);
create index if not exists system_errors_component_idx on system_errors (component);

-- Enable RLS
alter table system_errors enable row level security;

-- Policies
-- Admins and developers can view all errors
create policy "Admins and developers can view all errors"
  on system_errors
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'developer')
    )
  );

-- System (and authenticated users) can insert errors
create policy "Users can insert errors"
  on system_errors
  for insert
  with check (true);

-- Admins and developers can update (resolve) errors
create policy "Admins and developers can update errors"
  on system_errors
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'developer')
    )
  );
