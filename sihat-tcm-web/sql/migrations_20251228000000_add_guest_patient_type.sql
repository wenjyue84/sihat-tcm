-- Update patient_type enum to include 'guest' and redistribute patient types
--  ~40% managed, ~35% registered, ~25% guest

-- Step 1: Add 'guest' to the patient_type enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'guest' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guest' 
        AND enumtypid = 'patient_type'::regtype
    ) THEN
        -- Add 'guest' to the patient_type enum
        ALTER TYPE patient_type ADD VALUE IF NOT EXISTS 'guest';
        RAISE NOTICE '✓ Added ''guest'' to patient_type enum';
    ELSE
        RAISE NOTICE '  ''guest'' already exists in patient_type enum';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '  ''guest'' already exists in patient_type enum (caught duplicate)';
END $$;

-- Step 2: Redistribute patient types
-- First 40 patients: managed
-- Next 35 patients:  registered  
-- Last 25 patients:  guest

DO $$
DECLARE
    patient_ids UUID[];
    i INT;
    new_type TEXT;
BEGIN
    -- Get all patient IDs ordered by created_at
    SELECT ARRAY_AGG(id ORDER BY created_at ASC) INTO patient_ids
    FROM public.patients;

    IF patient_ids IS NULL OR array_length(patient_ids, 1) IS NULL THEN
        RAISE NOTICE '⚠ No patients found in the database';
        RETURN;
    END IF;

    RAISE NOTICE '📊 Found % patients, redistributing types...', array_length(patient_ids, 1);

    -- Loop through patients and assign types
    FOR i IN 1..array_length(patient_ids, 1) LOOP
        IF i <= 40 THEN
            new_type := 'managed';
        ELSIF i <= 75 THEN
            new_type := 'registered';
        ELSE
            new_type := 'guest';
        END IF;

        -- Update patient type using text cast to avoid enum issues
        UPDATE public.patients
        SET type = new_type::patient_type,
            -- Clear email for guest patients (they typically don't have emails)
            email = CASE 
                        WHEN new_type = 'guest' THEN NULL 
                        ELSE email 
                    END
        WHERE id = patient_ids[i];
    END LOOP;

    RAISE NOTICE '✅ Successfully updated patient types!';
END $$;

-- Step 3: Display the distribution
DO $$
DECLARE
    managed_count INT;
    registered_count INT;
    guest_count INT;
    total_count INT;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE type = 'managed'),
        COUNT(*) FILTER (WHERE type = 'registered'),
        COUNT(*) FILTER (WHERE type = 'guest'),
        COUNT(*)
    INTO managed_count, registered_count, guest_count, total_count
    FROM public.patients;

    RAISE NOTICE '';
    RAISE NOTICE '📈 Updated Distribution:';
    RAISE NOTICE '   🏥 Managed:    % (%%)', managed_count, ROUND(managed_count::numeric / NULLIF(total_count, 0) * 100, 1);
    RAISE NOTICE '   👤 Registered: % (%%)', registered_count, ROUND(registered_count::numeric / NULLIF(total_count, 0) * 100, 1);
    RAISE NOTICE '   🎫 Guest:      % (%%)', guest_count, ROUND(guest_count::numeric / NULLIF(total_count, 0) * 100, 1);
    RAISE NOTICE '   📊 Total:      %', total_count;
END $$;
