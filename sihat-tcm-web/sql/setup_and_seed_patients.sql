-- Combined Migration and Seed Script
-- This script creates the missing 'patients' table and then populates it with mock data.

-- 1. Create Types (Idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_status') THEN
        CREATE TYPE patient_status AS ENUM ('active', 'archived', 'pending_invite');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_type') THEN
        CREATE TYPE patient_type AS ENUM ('managed', 'registered');
    END IF;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS public.patients (
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
    constraint patients_user_id_key unique (user_id)
);

-- 3. Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Drop first to avoid conflicts if they somehow exist partially)
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;
CREATE POLICY "Doctors can view all patients"
    ON public.patients FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;
CREATE POLICY "Doctors can insert patients"
    ON public.patients FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
CREATE POLICY "Doctors can update patients"
    ON public.patients FOR UPDATE
    TO authenticated
    USING (true);

-- 5. Helper Function for timestamp updates
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON public.patients;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 6. Seed Data (Malaysian demographics)
DO $$
DECLARE
    i INT;
    mock_doctor_id UUID;
    
    -- Chinese Names
    cn_first_names TEXT[] := ARRAY['Wei', 'Jun', 'Ying', 'Mei', 'Hui', 'Xin', 'Yee', 'Kang', 'Ming', 'Siew', 'Chee', 'Boon', 'Kian', 'Kah', 'Mun', 'Ah', 'Kok', 'Siong', 'Pei', 'Li', 'Jia', 'Yi', 'Zhi', 'Xue'];
    cn_last_names TEXT[] := ARRAY['Tan', 'Lee', 'Wong', 'Lim', 'Chong', 'Ng', 'Chin', 'Liew', 'Chan', 'Low', 'Teoh', 'Seow', 'Ong', 'Goh', 'Chua', 'Khoo', 'Loh', 'Yeoh', 'Ewe', 'Sim', 'Ang', 'Teo', 'Koh', 'Phua'];
    
    -- Malay Names
    my_first_names TEXT[] := ARRAY['Ahmad', 'Muhammad', 'Siti', 'Nur', 'Farah', 'Amir', 'Zainal', 'Aishah', 'Ismail', 'Fatimah', 'Syahir', 'Izzat', 'Haris', 'Haziq', 'Nurul', 'Puteri', 'Adam', 'Amina'];
    my_last_names TEXT[] := ARRAY['Abdullah', 'Ibrahim', 'Yusof', 'Rahman', 'Hassan', 'Aziz', 'Zakaria', 'Mohamad', 'Ali', 'Omar', 'Othman', 'Razak', 'Bakar'];
    
    -- Indian Names
    in_first_names TEXT[] := ARRAY['Ravi', 'Priya', 'Kumar', 'Anjali', 'Sanjay', 'Devi', 'Vijay', 'Geetha', 'Muthu', 'Kavita', 'Suresh', 'Deepa', 'Balan', 'Meena', 'Vikram', 'Lakshmi'];
    in_last_names TEXT[] := ARRAY['Subramaniam', 'Krishnan', 'Raman', 'Menon', 'Pillai', 'Rao', 'Singh', 'Kaur', 'Govindasamy', 'Rajagopal', 'Manickam', 'Fernandes', 'Nair'];

    genders TEXT[] := ARRAY['male', 'female'];
    
    ethnicity_roll FLOAT;
    selected_first_name TEXT;
    selected_last_name TEXT;
    
BEGIN
    SELECT id INTO mock_doctor_id FROM auth.users LIMIT 1;
    
    -- Optional: Clear existing seed data if needed (commented out for safety)
    -- DELETE FROM public.patients WHERE email LIKE 'patient_%@example.com';

    FOR i IN 1..100 LOOP
        ethnicity_roll := random();
        
        -- Select Ethnicity and Name
        IF ethnicity_roll < 0.6 THEN
            -- Chinese (60%)
            selected_first_name := cn_first_names[floor(random() * array_length(cn_first_names, 1) + 1)];
            selected_last_name := cn_last_names[floor(random() * array_length(cn_last_names, 1) + 1)];
        ELSIF ethnicity_roll < 0.85 THEN
            -- Malay (25%)
            selected_first_name := my_first_names[floor(random() * array_length(my_first_names, 1) + 1)];
            selected_last_name := my_last_names[floor(random() * array_length(my_last_names, 1) + 1)];
        ELSE
            -- Indian (15%)
            selected_first_name := in_first_names[floor(random() * array_length(in_first_names, 1) + 1)];
            selected_last_name := in_last_names[floor(random() * array_length(in_last_names, 1) + 1)];
        END IF;

        INSERT INTO public.patients (
            first_name,
            last_name,
            ic_no,
            email,
            phone,
            birth_date,
            gender,
            status,
            type,
            created_by,
            clinical_summary
            -- flag 
        ) VALUES (
            selected_first_name,
            selected_last_name,
            -- Random 12-digit IC (using random seed to minimize collision risk in loop)
            lpad(floor(random() * 1000000000000)::text, 12, '0'),
            -- Unique email
            'patient_' || i || '_' || floor(random() * 100000)::text || '@example.com',
            -- Mock Phone (+601...)
            '+601' || floor(random() * 90000000 + 10000000)::text,
            -- Random Age (0-90)
            (CURRENT_DATE - (floor(random() * 365 * 90) || ' days')::interval)::date,
            genders[floor(random() * array_length(genders, 1) + 1)],
            'active',
            'managed',
            mock_doctor_id,
            '{"summary": "Auto-generated mock patient summary."}'::jsonb
        );
    END LOOP;
END $$;
