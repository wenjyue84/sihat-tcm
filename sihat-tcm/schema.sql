-- Create users table
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create health_reports table
create table public.health_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  raw_ai_analysis jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.health_reports enable row level security;

-- Policies
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can view their own reports" on public.health_reports
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reports" on public.health_reports
  for insert with check (auth.uid() = user_id);
