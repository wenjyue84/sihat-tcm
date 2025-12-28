-- Update existing patients to have mixed types
-- This will create a realistic distribution:
-- ~40% managed, ~35% registered, ~25% guest

DO $$
DECLARE
    patient_record RECORD;
    counter INT := 0;
    random_val FLOAT;
BEGIN
    -- Loop through all patients and randomly assign types
    FOR patient_record IN 
        SELECT id FROM public.patients 
        ORDER BY created_at ASC
    LOOP
        counter := counter + 1;
        random_val := random();
        
        -- Distribute based on counter to ensure good distribution
        IF counter <= 40 THEN
            -- First 40 stay as 'managed'
            UPDATE public.patients 
            SET type = 'managed'
            WHERE id = patient_record.id;
            
        ELSIF counter <= 75 THEN
            -- Next 35 become 'registered'
            UPDATE public.patients 
            SET type = 'registered'
            WHERE id = patient_record.id;
            
        ELSE
            -- Remaining 25 become 'guest'
            UPDATE public.patients 
            SET type = 'guest',
                email = NULL  -- Guests typically don't have emails in the system
            WHERE id = patient_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated patient types successfully!';
    RAISE NOTICE 'Managed: ~40, Registered: ~35, Guest: ~25';
END $$;

-- Verify the distribution
SELECT 
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.patients), 2) as percentage
FROM public.patients
GROUP BY type
ORDER BY count DESC;
