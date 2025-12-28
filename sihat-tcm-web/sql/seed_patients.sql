-- SQL query to add about 100 random managed patients with Malaysian demographics
-- Distribution: ~60% Chinese, ~25% Malay, ~15% Indian

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
    -- Attempt to get a user ID to set as 'created_by'
    SELECT id INTO mock_doctor_id FROM auth.users LIMIT 1;

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
            -- flag -- Uncomment if 'flag' column has been added to the patients table
        ) VALUES (
            selected_first_name,
            selected_last_name,
            -- Random 12-digit IC
            lpad(floor(random() * 1000000000000)::text, 12, '0'),
            -- Unique email
            'patient_' || i || '_' || floor(random() * 10000)::text || '@example.com',
            -- Mock Phone (+601...)
            '+601' || floor(random() * 90000000 + 10000000)::text,
            -- Random Age (0-90)
            (CURRENT_DATE - (floor(random() * 365 * 90) || ' days')::interval)::date,
            genders[floor(random() * array_length(genders, 1) + 1)],
            'active',
            'managed',
            mock_doctor_id,
            '{"summary": "Auto-generated mock patient summary."}'::jsonb
            -- 'Normal' -- Uncomment if using flags
        );
    END LOOP;
END $$;
