-- ==============================================================================
-- SOLUTION: Add 'guest' patient type and seed 100 patients
-- ==============================================================================
-- Run this script in your Supabase SQL Editor Dashboard
-- This will:
-- 1. Add 'guest' to the patient_type enum
-- 2. Create 100 patients with the distribution:
--    - 40 managed
--    - 35 registered  
--    - 25 guest
-- ==============================================================================

-- Step 1: Add 'guest' to patient_type enum (MUST BE SEPARATE FROM STEP 2)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guest' 
        AND enumtypid = 'patient_type'::regtype
    ) THEN
        ALTER TYPE patient_type ADD VALUE 'guest';
        RAISE NOTICE '✓ Added guest to patient_type enum';
    ELSE
        RAISE NOTICE '  guest already exists in patient_type enum';
    END IF;
END $$;

-- IMPORTANT: After running Step 1, you MUST run Step 2 in a SEPARATE query
-- This is because PostgreSQL requires enum values to be committed before use

-- Step 2: Seed 100 patients with proper type distribution
-- COPY EVERYTHING FROM HERE DOWN AND RUN AS A SEPARATE QUERY
-- ============================================================================

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
    patient_type patient_type;
    patient_email TEXT;
    
BEGIN
    SELECT id INTO mock_doctor_id FROM auth.users LIMIT 1;

    RAISE NOTICE '🌱 Seeding 100 patients...';

    FOR i IN 1..100 LOOP
        ethnicity_roll := random();
        
        -- Select Ethnicity and Name
        IF ethnicity_roll < 0.6 THEN
            selected_first_name := cn_first_names[floor(random() * array_length(cn_first_names, 1) + 1)];
            selected_last_name := cn_last_names[floor(random() * array_length(cn_last_names, 1) + 1)];
        ELSIF ethnicity_roll < 0.85 THEN
            selected_first_name := my_first_names[floor(random() * array_length(my_first_names, 1) + 1)];
            selected_last_name := my_last_names[floor(random() * array_length(my_last_names, 1) + 1)];
        ELSE
            selected_first_name := in_first_names[floor(random() * array_length(in_first_names, 1) + 1)];
            selected_last_name := in_last_names[floor(random() * array_length(in_last_names, 1) + 1)];
        END IF;

        -- Determine patient type: 40% managed, 35% registered, 25% guest
        IF i <= 40 THEN
            patient_type := 'managed'::patient_type;
            patient_email := 'patient_' || i || '_' || floor(random() * 10000)::text || '@example.com';
        ELSIF i <= 75 THEN
            patient_type := 'registered'::patient_type;
            patient_email := 'patient_' || i || '_' || floor(random() * 10000)::text || '@example.com';
        ELSE
            patient_type := 'guest'::patient_type;
            patient_email := NULL; -- Guests don't have emails
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
        ) VALUES (
            selected_first_name,
            selected_last_name,
            lpad(floor(random() * 1000000000000)::text, 12, '0'),
            patient_email,
            '+601' || floor(random() * 90000000 + 10000000)::text,
            (CURRENT_DATE - (floor(random() * 365 * 90) || ' days')::interval)::date,
            genders[floor(random() * array_length(genders, 1) + 1)],
            'active'::patient_status,
            patient_type,
            mock_doctor_id,
            '{"summary": "Auto-generated mock patient summary."}'::jsonb
        );
    END LOOP;

    RAISE NOTICE '✅ Successfully seeded 100 patients!';
END $$;

-- Step 3: Display the distribution (run after Step 2)
SELECT 
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.patients), 1) || '%' as percentage
FROM public.patients
GROUP BY type
ORDER BY 
    CASE type
        WHEN 'managed' THEN 1
        WHEN 'registered' THEN 2
        WHEN 'guest' THEN 3
    END;
