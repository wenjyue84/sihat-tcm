-- Fix malformed primary_diagnosis and constitution in diagnosis_sessions table
-- Problem: Some records have stringified JSON objects stored instead of clean strings
-- Example: '{"disease_cause": "...", "primary_pattern": "Qi Deficiency", ...}' 
-- Should be: 'Qi Deficiency'

-- Strategy: Parse the JSON string and extract the clean value

-- Fix primary_diagnosis - extract primary_pattern from JSON string
UPDATE public.diagnosis_sessions
SET primary_diagnosis = 
    CASE 
        -- If it's a JSON object string, try to parse and extract primary_pattern
        WHEN primary_diagnosis LIKE '{%' AND primary_diagnosis LIKE '%}' THEN
            COALESCE(
                (primary_diagnosis::jsonb)->>'primary_pattern',
                (primary_diagnosis::jsonb)->'diagnosis'->>'primary_pattern',
                'TCM Health Assessment'
            )
        ELSE primary_diagnosis
    END
WHERE primary_diagnosis LIKE '{%';

-- Fix constitution - extract type from JSON string
UPDATE public.diagnosis_sessions
SET constitution = 
    CASE 
        WHEN constitution LIKE '{%' AND constitution LIKE '%}' THEN
            COALESCE(
                (constitution::jsonb)->>'type',
                (constitution::jsonb)->'constitution'->>'type',
                'Constitutional Assessment'
            )
        ELSE constitution
    END
WHERE constitution LIKE '{%';

-- Also update from full_report if primary_diagnosis is still malformed or empty
UPDATE public.diagnosis_sessions
SET 
    primary_diagnosis = COALESCE(
        full_report->'diagnosis'->>'primary_pattern',
        full_report->'diagnosis'->>'pattern',
        CASE 
            WHEN jsonb_typeof(full_report->'diagnosis') = 'string' 
            THEN full_report->>'diagnosis'
            ELSE NULL
        END,
        'TCM Health Assessment'
    ),
    constitution = COALESCE(
        full_report->'constitution'->>'type',
        CASE 
            WHEN jsonb_typeof(full_report->'constitution') = 'string' 
            THEN full_report->>'constitution'
            ELSE NULL
        END,
        constitution,
        'Constitutional Assessment'
    )
WHERE 
    primary_diagnosis LIKE '{%' 
    OR primary_diagnosis LIKE '%"%:%' 
    OR primary_diagnosis IS NULL
    OR primary_diagnosis = ''
    OR LENGTH(primary_diagnosis) > 100;

-- Verify the fix
SELECT 
    id,
    LEFT(primary_diagnosis, 60) as primary_diagnosis,
    LEFT(constitution, 50) as constitution,
    overall_score,
    created_at
FROM public.diagnosis_sessions
ORDER BY created_at DESC
LIMIT 20;
