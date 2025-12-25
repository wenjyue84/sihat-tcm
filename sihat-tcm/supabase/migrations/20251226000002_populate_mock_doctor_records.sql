-- Migration: Populate mock doctor record data for existing diagnosis sessions
-- Description: Adds realistic symptoms, medicines, and clinical details to existing records for demo purposes

-- Function to extract and populate symptoms from full_report
-- This will try to extract from the report structure, or use mock data based on diagnosis type
DO $$
DECLARE
    session_record RECORD;
    mock_symptoms text[];
    mock_medicines text[];
    mock_vital_signs jsonb;
    mock_treatment_plan text;
    diagnosis_type text;
BEGIN
    -- Loop through all diagnosis sessions that don't have symptoms/medicines yet
    FOR session_record IN 
        SELECT id, primary_diagnosis, full_report, constitution
        FROM public.diagnosis_sessions
        WHERE (symptoms IS NULL OR array_length(symptoms, 1) IS NULL)
           OR (medicines IS NULL OR array_length(medicines, 1) IS NULL)
    LOOP
        diagnosis_type := LOWER(session_record.primary_diagnosis);
        
        -- Generate mock symptoms based on diagnosis type
        IF diagnosis_type LIKE '%yin deficiency%' OR diagnosis_type LIKE '%阴虚%' THEN
            mock_symptoms := ARRAY['Night sweats', 'Insomnia', 'Dry mouth', 'Hot palms and soles', 'Restlessness'];
        ELSIF diagnosis_type LIKE '%yang deficiency%' OR diagnosis_type LIKE '%阳虚%' THEN
            mock_symptoms := ARRAY['Cold extremities', 'Lower back pain', 'Fatigue', 'Frequent urination', 'Weakness'];
        ELSIF diagnosis_type LIKE '%qi deficiency%' OR diagnosis_type LIKE '%气虚%' THEN
            mock_symptoms := ARRAY['Fatigue', 'Shortness of breath', 'Weak voice', 'Spontaneous sweating', 'Poor appetite'];
        ELSIF diagnosis_type LIKE '%qi stagnation%' OR diagnosis_type LIKE '%气滞%' THEN
            mock_symptoms := ARRAY['Chest tightness', 'Irritability', 'Bloating', 'Sighing', 'Mood swings'];
        ELSIF diagnosis_type LIKE '%blood deficiency%' OR diagnosis_type LIKE '%血虚%' THEN
            mock_symptoms := ARRAY['Dizziness', 'Palpitations', 'Poor memory', 'Pale complexion', 'Dry skin'];
        ELSIF diagnosis_type LIKE '%damp heat%' OR diagnosis_type LIKE '%湿热%' THEN
            mock_symptoms := ARRAY['Heavy feeling', 'Sticky mouth', 'Yellow discharge', 'Bitter taste', 'Urinary discomfort'];
        ELSIF diagnosis_type LIKE '%wind-cold%' OR diagnosis_type LIKE '%风寒%' THEN
            mock_symptoms := ARRAY['Chills', 'Runny nose', 'Body aches', 'Headache', 'No sweating'];
        ELSIF diagnosis_type LIKE '%phlegm%' OR diagnosis_type LIKE '%痰%' THEN
            mock_symptoms := ARRAY['Chest oppression', 'Cough with phlegm', 'Heaviness', 'Foggy thinking', 'Nausea'];
        ELSE
            -- Generic symptoms
            mock_symptoms := ARRAY['Fatigue', 'General discomfort', 'Sleep issues', 'Digestive problems'];
        END IF;
        
        -- Generate mock medicines based on diagnosis type
        IF diagnosis_type LIKE '%yin deficiency%' OR diagnosis_type LIKE '%阴虚%' THEN
            mock_medicines := ARRAY['Liu Wei Di Huang Wan', 'Zhi Bai Di Huang Wan'];
        ELSIF diagnosis_type LIKE '%yang deficiency%' OR diagnosis_type LIKE '%阳虚%' THEN
            mock_medicines := ARRAY['Jin Gui Shen Qi Wan', 'You Gui Wan'];
        ELSIF diagnosis_type LIKE '%qi deficiency%' OR diagnosis_type LIKE '%气虚%' THEN
            mock_medicines := ARRAY['Si Jun Zi Tang', 'Bu Zhong Yi Qi Tang'];
        ELSIF diagnosis_type LIKE '%qi stagnation%' OR diagnosis_type LIKE '%气滞%' THEN
            mock_medicines := ARRAY['Xiao Yao San', 'Chai Hu Shu Gan San'];
        ELSIF diagnosis_type LIKE '%blood deficiency%' OR diagnosis_type LIKE '%血虚%' THEN
            mock_medicines := ARRAY['Si Wu Tang', 'Gui Pi Tang'];
        ELSIF diagnosis_type LIKE '%damp heat%' OR diagnosis_type LIKE '%湿热%' THEN
            mock_medicines := ARRAY['Ba Zheng San', 'Long Dan Xie Gan Tang'];
        ELSIF diagnosis_type LIKE '%wind-cold%' OR diagnosis_type LIKE '%风寒%' THEN
            mock_medicines := ARRAY['Gui Zhi Tang', 'Ma Huang Tang'];
        ELSIF diagnosis_type LIKE '%phlegm%' OR diagnosis_type LIKE '%痰%' THEN
            mock_medicines := ARRAY['Er Chen Tang', 'Wen Dan Tang'];
        ELSE
            -- Generic medicines
            mock_medicines := ARRAY['General TCM Formula', 'Supportive Herbs'];
        END IF;
        
        -- Try to extract medicines from full_report first
        IF session_record.full_report IS NOT NULL THEN
            -- Check if herbal_formulas exist in recommendations
            IF session_record.full_report->'recommendations'->'herbal_formulas' IS NOT NULL THEN
                SELECT array_agg(formula->>'name')
                INTO mock_medicines
                FROM jsonb_array_elements(session_record.full_report->'recommendations'->'herbal_formulas') AS formula
                WHERE formula->>'name' IS NOT NULL;
            END IF;
            
            -- Check if medicines exist in input_data
            IF session_record.full_report->'input_data'->'medicines' IS NOT NULL THEN
                SELECT array_agg(medicine::text)
                INTO mock_medicines
                FROM jsonb_array_elements_text(session_record.full_report->'input_data'->'medicines') AS medicine;
            END IF;
        END IF;
        
        -- Generate mock vital signs (within normal ranges with slight variations)
        mock_vital_signs := jsonb_build_object(
            'bpm', (70 + floor(random() * 20))::integer,  -- 70-90 bpm
            'blood_pressure', (110 + floor(random() * 20))::text || '/' || (70 + floor(random() * 15))::text,
            'temperature', (36.5 + (random() * 0.8))::numeric(4,1),  -- 36.5-37.3°C
            'heart_rate', (65 + floor(random() * 25))::integer  -- 65-90 bpm
        );
        
        -- Generate treatment plan summary
        IF session_record.full_report IS NOT NULL THEN
            -- Try to extract from recommendations
            IF session_record.full_report->'recommendations' IS NOT NULL THEN
                mock_treatment_plan := '';
                
                -- Add dietary recommendations
                IF session_record.full_report->'recommendations'->'food_therapy'->'beneficial' IS NOT NULL THEN
                    SELECT string_agg(food::text, ', ')
                    INTO mock_treatment_plan
                    FROM jsonb_array_elements_text(
                        session_record.full_report->'recommendations'->'food_therapy'->'beneficial'
                    ) AS food
                    LIMIT 3;
                END IF;
                
                -- Add herbal formulas
                IF session_record.full_report->'recommendations'->'herbal_formulas' IS NOT NULL THEN
                    IF mock_treatment_plan IS NOT NULL AND mock_treatment_plan != '' THEN
                        mock_treatment_plan := mock_treatment_plan || ' | ';
                    END IF;
                    SELECT 'Herbs: ' || string_agg(formula->>'name', ', ')
                    INTO mock_treatment_plan
                    FROM jsonb_array_elements(session_record.full_report->'recommendations'->'herbal_formulas') AS formula
                    WHERE formula->>'name' IS NOT NULL;
                END IF;
            END IF;
        END IF;
        
        -- If treatment plan is still empty, create a generic one
        IF mock_treatment_plan IS NULL OR mock_treatment_plan = '' THEN
            mock_treatment_plan := 'Dietary adjustments | Lifestyle modifications | Herbal support';
        END IF;
        
        -- Update the session with mock data
        UPDATE public.diagnosis_sessions
        SET 
            symptoms = COALESCE(symptoms, mock_symptoms),
            medicines = COALESCE(medicines, mock_medicines),
            vital_signs = COALESCE(vital_signs, mock_vital_signs),
            treatment_plan = COALESCE(treatment_plan, mock_treatment_plan),
            clinical_notes = COALESCE(clinical_notes, 
                'Patient presented with ' || array_to_string(mock_symptoms[1:2], ' and ') || 
                '. Recommended ' || array_to_string(mock_medicines[1:1], ', ') || 
                ' for treatment. Follow-up recommended in 2-4 weeks.')
        WHERE id = session_record.id;
        
    END LOOP;
    
    RAISE NOTICE 'Populated mock doctor record data for existing diagnosis sessions';
END $$;

-- Verify the update
SELECT 
    COUNT(*) as total_sessions,
    COUNT(symptoms) as sessions_with_symptoms,
    COUNT(medicines) as sessions_with_medicines,
    COUNT(vital_signs) as sessions_with_vital_signs,
    COUNT(treatment_plan) as sessions_with_treatment_plan
FROM public.diagnosis_sessions;

