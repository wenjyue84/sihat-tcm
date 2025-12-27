-- Migration: Migrate existing inquiries to diagnosis_sessions
-- Description: Move historical data from inquiries table to new diagnosis_sessions table
-- This ensures backward compatibility and data preservation

-- Step 1: Migrate existing inquiries to diagnosis_sessions
-- Only migrate records that don't already exist in diagnosis_sessions
INSERT INTO diagnosis_sessions (
    user_id,
    primary_diagnosis,
    constitution,
    overall_score,
    full_report,
    notes,
    created_at,
    updated_at
)
SELECT 
    i.user_id,
    -- Extract primary diagnosis from various possible locations in JSON
    COALESCE(
        i.diagnosis_report->>'diagnosis',
        i.diagnosis_report->'diagnosis'->>'primary_pattern',
        i.diagnosis_report->'diagnosis'->>'type',
        i.symptoms,
        'Historical Session'
    ) as primary_diagnosis,
    
    -- Extract constitution
    COALESCE(
        i.diagnosis_report->>'constitution',
        i.diagnosis_report->'constitution'->>'type'
    ) as constitution,
    
    -- Assign default score of 70 for historical data (neutral/fair)
    70 as overall_score,
    
    -- Store complete diagnosis report
    i.diagnosis_report as full_report,
    
    -- No notes for historical data
    NULL as notes,
    
    -- Preserve original timestamps
    i.created_at,
    i.created_at as updated_at
FROM inquiries i
WHERE NOT EXISTS (
    -- Skip if already migrated (prevent duplicates)
    SELECT 1 FROM diagnosis_sessions ds 
    WHERE ds.user_id = i.user_id 
    AND ds.created_at = i.created_at
    AND ds.full_report::text = i.diagnosis_report::text
);

-- Step 2: Log migration results
DO $$
DECLARE
    inquiries_count INT;
    sessions_count INT;
    migrated_count INT;
BEGIN
    SELECT COUNT(*) INTO inquiries_count FROM inquiries;
    SELECT COUNT(*) INTO sessions_count FROM diagnosis_sessions;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total inquiries: %', inquiries_count;
    RAISE NOTICE 'Total diagnosis_sessions: %', sessions_count;
    RAISE NOTICE '==============================================';
END $$;

-- Step 3: Create a view for backward compatibility
-- This allows old code to still work with inquiries table
CREATE OR REPLACE VIEW inquiries_unified AS
SELECT 
    ds.id,
    ds.user_id,
    ds.primary_diagnosis as symptoms,
    ds.full_report as diagnosis_report,
    ds.created_at
FROM diagnosis_sessions ds
ORDER BY ds.created_at DESC;

-- Add comment
COMMENT ON VIEW inquiries_unified IS 'Backward compatibility view - maps diagnosis_sessions to inquiries format';

-- Step 4: Verify migration
-- Check for any inquiries that weren't migrated
DO $$
DECLARE
    unmigrated_count INT;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM inquiries i
    WHERE NOT EXISTS (
        SELECT 1 FROM diagnosis_sessions ds 
        WHERE ds.user_id = i.user_id 
        AND ds.created_at = i.created_at
    );
    
    IF unmigrated_count > 0 THEN
        RAISE WARNING 'Warning: % inquiries were not migrated. Please review.', unmigrated_count;
    ELSE
        RAISE NOTICE 'Success: All inquiries migrated to diagnosis_sessions';
    END IF;
END $$;

