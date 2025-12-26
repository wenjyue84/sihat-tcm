-- Migration: Seed symptoms data for testing "Import Previous Symptoms" feature
-- Description: Adds symptoms array to existing diagnosis sessions and creates new mock sessions with symptoms

-- Step 1: Update existing diagnosis sessions with symptoms based on their diagnosis patterns
UPDATE public.diagnosis_sessions
SET symptoms = CASE
    -- Yin Deficiency patterns
    WHEN primary_diagnosis ILIKE '%Yin Deficiency%' OR primary_diagnosis ILIKE '%Empty Heat%' THEN
        ARRAY['Night sweats', 'Insomnia', 'Dry mouth', 'Hot palms and soles', 'Restlessness']
    
    -- Yang Deficiency patterns
    WHEN primary_diagnosis ILIKE '%Yang Deficiency%' OR primary_diagnosis ILIKE '%Kidney Yang%' THEN
        ARRAY['Cold extremities', 'Lower back pain', 'Fatigue', 'Frequent urination', 'Weakness']
    
    -- Qi Deficiency patterns
    WHEN primary_diagnosis ILIKE '%Qi Deficiency%' OR primary_diagnosis ILIKE '%Spleen Qi%' THEN
        ARRAY['Fatigue', 'Shortness of breath', 'Weak voice', 'Spontaneous sweating', 'Poor appetite']
    
    -- Qi Stagnation patterns
    WHEN primary_diagnosis ILIKE '%Qi Stagnation%' OR primary_diagnosis ILIKE '%Liver Qi%' THEN
        ARRAY['Chest tightness', 'Irritability', 'Bloating', 'Sighing', 'Mood swings']
    
    -- Blood Deficiency patterns
    WHEN primary_diagnosis ILIKE '%Blood Deficiency%' THEN
        ARRAY['Dizziness', 'Palpitations', 'Poor memory', 'Pale complexion', 'Dry skin']
    
    -- Damp Heat patterns
    WHEN primary_diagnosis ILIKE '%Damp Heat%' OR primary_diagnosis ILIKE '%Damp%Heat%' THEN
        ARRAY['Heavy feeling', 'Sticky mouth', 'Yellow discharge', 'Bitter taste', 'Urinary discomfort']
    
    -- Wind-Cold patterns
    WHEN primary_diagnosis ILIKE '%Wind-Cold%' OR primary_diagnosis ILIKE '%Wind Cold%' THEN
        ARRAY['Chills', 'Runny nose', 'Body aches', 'Headache', 'No sweating']
    
    -- Phlegm-Damp patterns
    WHEN primary_diagnosis ILIKE '%Phlegm%' OR primary_diagnosis ILIKE '%Damp%' THEN
        ARRAY['Chest oppression', 'Cough with phlegm', 'Heaviness', 'Foggy thinking', 'Nausea']
    
    -- Default for other patterns
    ELSE ARRAY['Fatigue', 'General discomfort', 'Sleep issues', 'Digestive problems']
END
WHERE symptoms IS NULL OR array_length(symptoms, 1) IS NULL;

-- Step 2: Create additional mock diagnosis sessions with diverse symptoms for testing
-- These will be inserted for any user who has existing diagnosis sessions
INSERT INTO public.diagnosis_sessions (
    user_id,
    primary_diagnosis,
    constitution,
    overall_score,
    symptoms,
    medicines,
    full_report,
    notes,
    created_at
)
SELECT 
    ds.user_id,
    'Headache with Liver Yang Rising',
    'Yang Excess Constitution',
    65,
    ARRAY['Severe headache', 'Dizziness', 'Irritability', 'Red eyes', 'Tinnitus'],
    ARRAY['Tian Ma Gou Teng Yin'],
    jsonb_build_object(
        'diagnosis', jsonb_build_object(
            'primary_pattern', 'Liver Yang Rising',
            'affected_organs', jsonb_build_array('Liver', 'Head')
        ),
        'constitution', jsonb_build_object('type', 'Yang Excess'),
        'patient_profile', jsonb_build_object('name', 'Test Patient')
    ),
    'Stress-related headaches getting worse in the afternoon.',
    NOW() - INTERVAL '3 days'
FROM (
    SELECT DISTINCT user_id 
    FROM public.diagnosis_sessions 
    LIMIT 1
) ds
WHERE NOT EXISTS (
    SELECT 1 FROM public.diagnosis_sessions 
    WHERE user_id = ds.user_id 
    AND primary_diagnosis = 'Headache with Liver Yang Rising'
    AND created_at > NOW() - INTERVAL '7 days'
);

INSERT INTO public.diagnosis_sessions (
    user_id,
    primary_diagnosis,
    constitution,
    overall_score,
    symptoms,
    medicines,
    full_report,
    notes,
    created_at
)
SELECT 
    ds.user_id,
    'Chronic Fatigue Syndrome',
    'Qi Deficiency Constitution',
    58,
    ARRAY['Extreme fatigue', 'Brain fog', 'Muscle weakness', 'Sleep disturbances', 'Poor concentration'],
    ARRAY['Bu Zhong Yi Qi Tang', 'Ginseng Extract'],
    jsonb_build_object(
        'diagnosis', jsonb_build_object(
            'primary_pattern', 'Qi and Blood Deficiency',
            'affected_organs', jsonb_build_array('Spleen', 'Heart', 'Kidney')
        ),
        'constitution', jsonb_build_object('type', 'Qi Deficiency'),
        'patient_profile', jsonb_build_object('name', 'Test Patient')
    ),
    'Feeling exhausted all the time, even after sleeping 10 hours.',
    NOW() - INTERVAL '10 days'
FROM (
    SELECT DISTINCT user_id 
    FROM public.diagnosis_sessions 
    LIMIT 1
) ds
WHERE NOT EXISTS (
    SELECT 1 FROM public.diagnosis_sessions 
    WHERE user_id = ds.user_id 
    AND primary_diagnosis = 'Chronic Fatigue Syndrome'
    AND created_at > NOW() - INTERVAL '14 days'
);

INSERT INTO public.diagnosis_sessions (
    user_id,
    primary_diagnosis,
    constitution,
    overall_score,
    symptoms,
    medicines,
    full_report,
    notes,
    created_at
)
SELECT 
    ds.user_id,
    'Digestive Issues with Spleen Dampness',
    'Damp Constitution',
    62,
    ARRAY['Bloating after meals', 'Loose stools', 'Feeling of heaviness', 'Poor digestion', 'Loss of appetite'],
    ARRAY['Xiang Sha Liu Jun Zi Tang'],
    jsonb_build_object(
        'diagnosis', jsonb_build_object(
            'primary_pattern', 'Spleen Dampness',
            'affected_organs', jsonb_build_array('Spleen', 'Stomach')
        ),
        'constitution', jsonb_build_object('type', 'Damp'),
        'patient_profile', jsonb_build_object('name', 'Test Patient')
    ),
    'Digestive problems worsened after eating too much greasy food.',
    NOW() - INTERVAL '18 days'
FROM (
    SELECT DISTINCT user_id 
    FROM public.diagnosis_sessions 
    LIMIT 1
) ds
WHERE NOT EXISTS (
    SELECT 1 FROM public.diagnosis_sessions 
    WHERE user_id = ds.user_id 
    AND primary_diagnosis = 'Digestive Issues with Spleen Dampness'
    AND created_at > NOW() - INTERVAL '21 days'
);

-- Step 3: Verify the update
SELECT 
    id,
    primary_diagnosis,
    symptoms,
    array_length(symptoms, 1) as symptom_count,
    created_at
FROM public.diagnosis_sessions
WHERE symptoms IS NOT NULL AND array_length(symptoms, 1) > 0
ORDER BY created_at DESC
LIMIT 10;

