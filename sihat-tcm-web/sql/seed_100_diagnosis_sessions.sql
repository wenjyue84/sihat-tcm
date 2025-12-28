-- Seed 100 Diagnosis Sessions with Realistic TCM Data
-- This script creates 100 diagnosis records for testing purposes

DO $$
DECLARE
    -- Generate random symptoms
    symptoms_list TEXT[] := ARRAY[
        'Persistent headache, fatigue, and dizziness for the past week',
        'Insomnia, heart palpitations, anxiety, and night sweats',
        'Lower back pain, knee weakness, frequent urination at night',
        'Digestive issues, bloating after meals, loose stools, lack of appetite',
        'Chronic cough with white phlegm, shortness of breath, catches cold easily',
        'Irritability, red eyes, headache on sides, bitter taste in mouth',
        'Menstrual irregularities, breast tenderness, mood swings, frequent sighing',
        'Joint pain worse in cold weather, morning stiffness, heavy limbs',
        'Dry mouth and throat, night sweats, hot palms and soles',
        'Chest tightness, poor circulation, cold hands and feet, dark complexion',
        'Poor appetite, bloating, fatigue after eating, loose stools',
        'Tinnitus, dizziness, poor memory, lower back soreness',
        'Chest pain, irregular heartbeat, anxiety, restlessness',
        'Frequent urination, urinary urgency, lower abdominal discomfort',
        'Chronic sinusitis, nasal congestion, thick yellow discharge',
        'Muscle weakness, easy bruising, heavy menstrual flow',
        'Constipation, dry skin, dry eyes, scanty urination',
        'Excessive thirst, increased appetite, weight loss, frequent urination',
        'Excessive sleepiness, heavy head, mental fog, body feels heavy',
        'Skin rashes, itching, redness that comes and goes'
    ];

    diagnoses_list TEXT[] := ARRAY[
        'Qi Deficiency with Blood Stasis',
        'Heart Yin Deficiency with Empty Heat',
        'Kidney Yang Deficiency',
        'Spleen Qi Deficiency with Dampness',
        'Lung Qi Deficiency',
        'Liver Fire Rising',
        'Liver Qi Stagnation',
        'Wind-Cold-Damp Bi Syndrome',
        'Yin Deficiency',
        'Blood Stagnation',
        'Spleen and Stomach Weakness',
        'Kidney Essence Deficiency',
        'Heart Blood Deficiency',
        'Bladder Damp Heat',
        'Lung Heat with Phlegm',
        'Spleen Fails to Control Blood',
        'Blood and Yin Deficiency',
        'Stomach Yin Deficiency',
        'Phlegm Dampness',
        'Wind Heat Invading Skin'
    ];

    tcm_patterns_list TEXT[] := ARRAY[
        '气虚血瘀证',
        '心阴虚证',
        '肾阳虚证',
        '脾气虚湿困证',
        '肺气虚证',
        '肝火上炎证',
        '肝气郁结证',
        '风寒湿痹证',
        '阴虚证',
        '血瘀证',
        '脾胃虚弱证',
        '肾精不足证',
        '心血虚证',
        '膀胱湿热证',
        '肺热痰盛证',
        '脾不统血证',
        '血虚阴虚证',
        '胃阴虚证',
        '痰湿证',
        '风热犯表证'
    ];

    constitutions_list TEXT[] := ARRAY[
        'Qi Deficiency',
        'Yang Deficiency',
        'Yin Deficiency',
        'Phlegm-Dampness',
        'Damp-Heat',
        'Blood Stagnation',
        'Qi Stagnation',
        'Special Diathesis',
        'Balanced'
    ];

    tongue_observations TEXT[] := ARRAY[
        'Pale tongue with thin white coating',
        'Red tongue tip with little coating',
        'Pale, puffy tongue with tooth marks',
        'Swollen tongue with thick greasy coating',
        'Pale tongue with white coating',
        'Red tongue with yellow coating on sides',
        'Normal color with thin coating',
        'Pale tongue with white greasy coating',
        'Red tongue with scanty coating',
        'Purple-dark tongue',
        'Swollen tongue with white coating',
        'Red tongue body with cracked surface',
        'Pale red with thin yellow coating',
        'Red tongue tip and sides',
        'Dark red with thick yellow coating',
        'Pale with ecchymosis',
        'Red and dry tongue',
        'Red tongue with geographic coating',
        'Thick white greasy coating',
        'Red with yellow thin coating'
    ];

    pulse_observations TEXT[] := ARRAY[
        'Weak and thready pulse',
        'Rapid and thin pulse',
        'Deep and slow pulse',
        'Soggy and slippery pulse',
        'Weak and floating pulse',
        'Wiry and rapid pulse',
        'Wiry pulse especially on left side',
        'Tight and slippery pulse',
        'Thin and rapid pulse',
        'Choppy pulse',
        'Weak and slow pulse',
        'Deep and weak pulse',
        'Fine and weak pulse',
        'Slippery and rapid pulse',
        'Slippery and rapid on right side',
        'Minute and weak pulse',
        'Thin weak pulse',
        'Rapid and deficient pulse',
        'Slippery and slow pulse',
        'Floating and rapid pulse'
    ];

    -- Loop variables
    user_count INT;
    random_user_id UUID;
    random_symptoms TEXT;
    random_diagnosis TEXT;
    random_tcm_pattern TEXT;
    random_constitution TEXT;
    random_tongue TEXT;
    random_pulse TEXT;
    random_score INT;
    random_days_ago INT;
    full_report_json JSONB;
    i INT;

BEGIN
    -- Get the first available user (or create a test user if none exists)
    SELECT id INTO random_user_id FROM profiles WHERE role = 'patient' LIMIT 1;
    
    IF random_user_id IS NULL THEN
        RAISE NOTICE 'No patient users found. Please create at least one patient user first.';
        RETURN;
    END IF;

    -- Get count of all patients for distribution
    SELECT COUNT(*) INTO user_count FROM profiles WHERE role = 'patient';
    
    RAISE NOTICE 'Starting to seed 100 diagnosis sessions...';
    RAISE NOTICE 'Found % patient users', user_count;

    -- Loop to create 100 diagnosis sessions
    FOR i IN 1..100 LOOP
        -- Select random data
        random_symptoms := symptoms_list[1 + floor(random() * array_length(symptoms_list, 1))];
        random_diagnosis := diagnoses_list[1 + floor(random() * array_length(diagnoses_list, 1))];
        random_tcm_pattern := tcm_patterns_list[1 + floor(random() * array_length(tcm_patterns_list, 1))];
        random_constitution := constitutions_list[1 + floor(random() * array_length(constitutions_list, 1))];
        random_tongue := tongue_observations[1 + floor(random() * array_length(tongue_observations, 1))];
        random_pulse := pulse_observations[1 + floor(random() * array_length(pulse_observations, 1))];
        random_score := 50 + floor(random() * 40); -- Score between 50-89
        random_days_ago := floor(random() * 180); -- Within last 6 months

        -- Select a random patient user
        SELECT id INTO random_user_id 
        FROM profiles 
        WHERE role = 'patient' 
        ORDER BY random() 
        LIMIT 1;

        -- Build the full report JSON
        full_report_json := jsonb_build_object(
            'diagnosis', jsonb_build_object(
                'primary_pattern', random_diagnosis,
                'secondary_patterns', ARRAY[]::text[],
                'affected_organs', ARRAY['Spleen', 'Stomach', 'Liver']::text[],
                'pathomechanism', 'Pattern arises from chronic stress and irregular eating habits'
            ),
            'constitution', jsonb_build_object(
                'type', random_constitution,
                'description', 'This constitution type indicates certain predispositions'
            ),
            'analysis', jsonb_build_object(
                'summary', random_diagnosis || ' - requires balanced approach to restore harmony',
                'key_findings', jsonb_build_object(
                    'from_inquiry', random_symptoms,
                    'from_visual', random_tongue,
                    'from_pulse', random_pulse
                )
            ),
            'recommendations', jsonb_build_object(
                'lifestyle', ARRAY['Regular sleep schedule', 'Moderate exercise', 'Stress management']::text[],
                'food', ARRAY['Warm, cooked foods', 'Ginger tea', 'Whole grains']::text[],
                'avoid', ARRAY['Cold, raw foods', 'Excessive dairy', 'Spicy foods']::text[],
                'herbal_formulas', jsonb_build_array(
                    jsonb_build_object(
                        'name', 'Bu Zhong Yi Qi Tang',
                        'purpose', 'Tonify Qi and raise Yang'
                    )
                )
            ),
            'precautions', jsonb_build_object(
                'warning_signs', ARRAY['Severe chest pain', 'Difficulty breathing', 'Severe headache']::text[],
                'special_notes', 'Consult healthcare provider if symptoms worsen'
            ),
            'follow_up', jsonb_build_object(
                'timeline', '2-4 weeks',
                'expected_improvement', 'Gradual reduction in symptoms over 2-3 weeks',
                'next_steps', 'Follow-up consultation to assess progress'
            ),
            'disclaimer', 'This is not a substitute for professional medical advice. Consult a licensed healthcare provider.'
        );

        -- Insert the diagnosis session
        INSERT INTO diagnosis_sessions (
            user_id,
            primary_diagnosis,
            constitution,
            overall_score,
            full_report,
            created_at,
            updated_at
        ) VALUES (
            random_user_id,
            random_diagnosis,
            random_constitution,
            random_score,
            full_report_json,
            NOW() - (random_days_ago || ' days')::INTERVAL,
            NOW() - (random_days_ago || ' days')::INTERVAL
        );

        -- Log progress every 20 records
        IF i % 20 = 0 THEN
            RAISE NOTICE 'Seeded % diagnosis sessions...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully seeded 100 diagnosis sessions!';
    RAISE NOTICE 'Diagnosis sessions are distributed across % patient users', user_count;
END $$;

-- Verify the results
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_patients,
    MIN(created_at) as oldest_session,
    MAX(created_at) as newest_session
FROM diagnosis_sessions;
