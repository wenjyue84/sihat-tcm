-- Create tcm_practitioners table
create table if not exists public.tcm_practitioners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo text,
  clinic_name text,
  specialties text[],
  address text,
  phone text,
  experience text,
  waze_link text,
  working_hours text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.tcm_practitioners enable row level security;

-- Policies
create policy "Public can view practitioners." on public.tcm_practitioners
  for select using (true);

create policy "Admins can manage practitioners." on public.tcm_practitioners
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Insert default practitioners (migrating from mock data)
insert into public.tcm_practitioners (name, photo, clinic_name, specialties, address, phone, experience, working_hours)
values 
('Dr. Lee Wei Hong', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lee', 'TCM Wellness Centre', ARRAY['Acupuncture', 'Herbal Medicine', 'Pain Management'], '123, Jalan Bukit Bintang, 55100 Kuala Lumpur', '+60 3-2141 1234', '15 years', 'Mon-Sat: 9am - 6pm'),
('Dr. Tan Mei Ling', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tan', 'Harmony TCM Clinic', ARRAY['Women''s Health', 'Fertility', 'Dermatology'], '45, Jalan SS 2/66, 47300 Petaling Jaya', '+60 3-7878 2345', '12 years', 'Mon-Sun: 10am - 7pm'),
('Dr. Chong Ah Kow', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chong', 'Evergreen TCM', ARRAY['Stroke Rehabilitation', 'Internal Medicine'], '88, Jalan Tun Sambanthan, 50470 Kuala Lumpur', '+60 3-2274 3456', '25 years', 'Mon-Fri: 8am - 5pm'),
('Dr. Siti Sarah', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Nature Cure TCM', ARRAY['Pediatrics', 'Digestive Disorders'], '12, Jalan Ampang, 50450 Kuala Lumpur', '+60 3-2161 4567', '8 years', 'Tue-Sun: 9am - 6pm'),
('Dr. Wong Siew Ming', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wong', 'Golden Herbs TCM', ARRAY['Oncology Support', 'Mental Wellness'], '56, Jalan Gasing, 46000 Petaling Jaya', '+60 3-7956 7890', '20 years', 'Mon-Sat: 9am - 5pm'),
('Dr. Raj Kumar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj', 'Holistic Healing Centre', ARRAY['Sports Injuries', 'Musculoskeletal Disorders'], '34, Jalan Bangsar, 59100 Kuala Lumpur', '+60 3-2282 9012', '10 years', 'Mon-Sat: 10am - 8pm');
