-- ==============================================================================
-- PART 1: Add 'guest' to patient_type enum
-- ==============================================================================
-- Run this FIRST in Supabase SQL Editor, then run PART_2
-- ==============================================================================

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
