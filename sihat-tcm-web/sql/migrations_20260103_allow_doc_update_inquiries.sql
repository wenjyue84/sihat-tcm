
-- Enable Doctors to update inquiries (e.g. for replying to messages)
create policy "Doctors can update inquiries." on public.inquiries
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'doctor'
    )
  );
