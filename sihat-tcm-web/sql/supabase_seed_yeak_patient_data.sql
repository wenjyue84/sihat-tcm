-- ========================================
-- Seed Patient Data: Yeak Kiew Ai (yeak@gmail.com)
-- ========================================
-- This script populates comprehensive health data for patient Yeak Kiew Ai
-- Execute this using: npx supabase db execute -f supabase/seed_yeak_patient_data.sql --db-url <your-db-url>

-- Step 1: Get the user_id for yeak@gmail.com
-- Note: You must have already created this user in Supabase Auth
-- This will fail if the user doesn't exist

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'yeak@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User yeak@gmail.com not found in auth.users. Please create the user account first.';
    END IF;

    RAISE NOTICE 'Found user ID: %', v_user_id;

    -- Step 2: Update or insert profile data
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        age,
        gender,
        height,
        weight,
        medical_history,
        preferred_language
    ) VALUES (
        v_user_id,
        'patient',
        'Yeak Kiew Ai',
        78,
        'female',
        155, -- Estimated height in cm
        64,  -- Current weight in kg (December 2025)
        'Chronic Kidney Disease Stage 4, Hypertension, Cardiovascular disease, Hiatal hernia, Gastritis, Fatty liver, Pre-diabetes, Osteopenia, Avascular necrosis, Sciatica, Anxiety and insomnia, Hearing loss (45%)',
        'en'
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        medical_history = EXCLUDED.medical_history,
        preferred_language = EXCLUDED.preferred_language;

    RAISE NOTICE 'Profile updated for Yeak Kiew Ai';

    -- Step 3: Insert comprehensive diagnosis session with all medical history
    INSERT INTO public.diagnosis_sessions (
        user_id,
        primary_diagnosis,
        constitution,
        overall_score,
        symptoms,
        medicines,
        vital_signs,
        clinical_notes,
        treatment_plan,
        follow_up_date,
        full_report,
        notes,
        created_at
    ) VALUES (
        v_user_id,
        'Multiple Chronic Conditions - CKD Stage 4, Cardiovascular, Gastrointestinal',
        'Kidney Yin Deficiency with Damp-Heat accumulation',
        45, -- Overall health score considering multiple conditions
        ARRAY[
            -- Kidney-related
            'Chronic kidney disease symptoms',
            'Fluid retention',
            'Elevated creatinine',
            'Decreased eGFR',
            -- Gastrointestinal
            'Stomach bloating',
            'Food blockage sensation',
            'Gastritis symptoms',
            'Hiatal hernia',
            'Difficulty swallowing solid foods',
            -- Musculoskeletal
            'Right hip pain',
            'Bilateral knee arthritis (left worse)',
            'Lower back pain',
            'Osteopenia',
            -- Cardiovascular
            'Hypertension',
            'Heart condition requiring surgery',
            -- Neurological
            'Sciatica',
            'Neuropathic pain',
            'Hand tremors (resolved after environmental adjustment)',
            -- Metabolic
            'Pre-diabetes (HbA1c 6.0%)',
            'High triglycerides',
            'Low HDL cholesterol',
            -- Mental health
            'Anxiety',
            'Insomnia',
            -- Sensory
            'Hearing loss 45%',
            -- Infectious history
            'Previous bacterial heart infection',
            'Previous dental infection'
        ],
        ARRAY[
            -- Blood pressure management
            'Valsartan/Amlodipine combination',
            'Atenolol',
            -- Gastrointestinal
            'Rabeprazole (acid reflux)',
            'Previously: Nexium',
            -- Pain and nerve
            'Duloxetine (neuropathic pain)',
            'Strain relief patches (lower back)',
            -- Mental health
            'Mirtazapine (anxiety, sleep)',
            'Lexoton/Bromazepam (anxiety)',
            -- Joint health
            'Joint supplements (started December 2025, 1 month trial)',
            -- Note: Paracetamol only for pain - NO NSAIDs due to CKD
            'Paracetamol/acetaminophen (approved pain relief only)'
        ],
        jsonb_build_object(
            'weight_kg', 64,
            'weight_trend', 'increased from 48-54kg range - possible fluid retention',
            'blood_pressure_status', 'managed with medication',
            'kidney_function', jsonb_build_object(
                'eGFR', '27 mL/min/1.73m²',
                'creatinine', '167 µmol/L',
                'bun', '8.1 mmol/L',
                'date', '2025-08-01'
            ),
            'metabolic_panel', jsonb_build_object(
                'hba1c', '6.0%',
                'triglycerides', '2.97 mmol/L',
                'hdl', '1.12 mmol/L',
                'status', 'pre-diabetes'
            ),
            'bone_density', jsonb_build_object(
                'left_hip', 'osteopenia',
                'fracture_risk_10yr_major', '5.9%',
                'fracture_risk_10yr_hip', '1.4%'
            ),
            'hearing', jsonb_build_object(
                'percentage', '45%',
                'eligible_for', 'PeKa B40 government-subsidized hearing aid'
            )
        ),
        E'# Comprehensive Medical History - Yeak Kiew Ai

## Critical Conditions Requiring Active Management

### 1. Chronic Kidney Disease (CKD) - Stage 4
- eGFR: 27 mL/min/1.73m² (August 2025) - CRITICAL LOW
- At risk of progression to Stage 5 (dialysis)
- **STRICTLY AVOID NSAIDs** (ibuprofen, diclofenac, aspirin)
- Next nephrology follow-up: December 4, 2025 at Regency Specialist Hospital

### 2. Gastrointestinal Issues
- Hiatal hernia (confirmed gastroscopy September 12, 2025)
- Mild atrophic and erosive gastritis
- Esophageal/gastric dysmotility causing food blockage sensation
- **Dietary requirement**: Soft foods ONLY, avoid hard/solid foods

### 3. Cardiovascular
- Hypertension (managed with Valsartan/Amlodipine and Atenolol)
- Heart surgery required but delayed due to bacterial infection (July 2025)

### 4. Metabolic
- Pre-diabetes: HbA1c 6.0% (threshold for diabetes is 6.5%)
- Dyslipidemia: High triglycerides (2.97 mmol/L), low HDL (1.12 mmol/L)

### 5. Musculoskeletal (December 2025 Update)
- Right hip: X-ray shows deterioration but not rapid; surgery not recommended unless severe pain
- Bilateral knee arthritis (left worse than right)
- Lower back pain (managed with strain relief patches)
- Avascular necrosis of right hip
- Osteopenia in left hip

## Recent Progress (December 10-11, 2025)

### Successful Interventions by Jay (Primary Caregiver):
1. **Stopped problematic new medication** - causing adverse effects
2. **Strict dietary control**: Very thin rice porridge (~300ml, mostly water) + steamed egg
3. **Environmental adjustment**: Stopped prolonged AC exposure - hand tremors RESOLVED

### Immediate Improvements:
✅ Stomach bloating reducing
✅ Hand tremors resolved
✅ Able to shower independently
✅ Mood significantly improved
✅ Expressed desire to go out

## Recent Medical Timeline

- **Dec 10-11, 2025**: Jay implemented home care protocol - significant improvement
- **Dec 5, 2025**: Niko brought mum to hospital - pelvis/knee/back assessment
- **Nov 21, 2025**: Hospital admission for several days
- **Nov 17, 2025**: Multiple prescriptions (Rabeprazole, Lexoton, Duloxetine)
- **Sep 11-12, 2025**: Comprehensive diagnostic workup (RM3,000) - ultrasound, gastroscopy
- **Aug 2025**: CKD Stage 4 diagnosis

## Current Care Protocol (Effective December 10, 2025)

### Diet - CRITICAL FOR CKD
**Allowed**: Thin rice congee (mostly water), steamed egg, soft easily-digestible foods
**Strictly Avoid**: 
- Sweet potato (番薯) - high potassium dangerous for CKD
- Bread (面包) - high sodium and phosphorus additives
- Cauliflower (野菜花) - moderate potassium, causes gas
- Hard or solid foods (due to hiatal hernia)

### Environment
- Avoid prolonged AC exposure (keep room warm/comfortable)
- Monitor for hand tremors if environment changes

### Monitoring
- Track daily: swelling, energy level, pain level, appetite, bowel movements
- Watch for RED FLAGS: black stools, breathing difficulty, sudden weakness, fever

## Liver Status
- Mild fatty liver (no cirrhosis)
- Two benign complicated cysts in segments II/III and VII
- Gallbladder normal, no stones
- Requires monitoring but not immediate concern

## Mental Health
- Anxiety and insomnia managed with Mirtazapine and Lexoton
- Recent mood improvement after successful care interventions

## Positive Factors
✅ No cancer detected
✅ No H. pylori infection
✅ No GI bleeding (no anemia)
✅ Liver stable (fatty liver without cirrhosis)
✅ Strong family support (Jay, Niko, Bin actively involved)
✅ Good healthcare access (Regency Hospital, Gleneagle)
✅ Eligible for PeKa B40 government healthcare subsidies

## Family Care Team
- **Jay**: Primary caregiver, coordinates medical appointments, implemented successful care protocol
- **Niko**: Medical coordinator, monitors condition at shop
- **Bin**: Daily porridge preparation, backup support

## Current Status: STABLE & IMPROVING ✅

After implementation of strict dietary control and environmental adjustments on December 10, 2025, patient showing significant improvement in symptoms, mood, and independence.',
        
        E'-- Current Dietary Protocol (PROVEN EFFECTIVE Dec 10-11, 2025) --

ALLOWED FOODS:
✅ Very thin rice porridge (水为主 - mostly water, minimal rice) ~300ml
✅ Steamed egg (easy to digest, good protein)
✅ Other soft, easily-digestible foods

STRICTLY AVOID:
❌ Sweet potato (番薯) - HIGH POTASSIUM (dangerous for CKD Stage 4)
❌ Bread (面包) - high sodium and phosphorus additives
❌ Cauliflower (野菜花) - moderate potassium, causes gas/bloating
❌ Any hard or solid foods (hiatal hernia risk)

ENVIRONMENTAL:
- Keep room warm, avoid prolonged AC exposure (hand tremors resolved after stopping AC)

MEDICATION SAFETY:
⚠️ CRITICAL: NO NSAIDs (ibuprofen, diclofenac, aspirin) - will worsen kidney function
✅ Paracetamol/acetaminophen ONLY for pain relief

NEXT FOLLOW-UP:
- Nephrology: December 4, 2025 at Regency Specialist Hospital
- Monitor daily: swelling, energy, pain, appetite, bowel movements
- RED FLAGS: black stools, breathing difficulty, sudden weakness, fever → IMMEDIATE MEDICAL ATTENTION',
        
        '2025-12-11', -- Follow-up date
        
        -- Full report JSON with all comprehensive data
        jsonb_build_object(
            'patient_info', jsonb_build_object(
                'name', 'Yeak Kiew Ai (叶巧爱)',
                'age', 78,
                'gender', 'female',
                'weight_kg', 64,
                'summary_date', '2025-12-07'
            ),
            'primary_conditions', jsonb_build_array(
                jsonb_build_object(
                    'condition', 'Chronic Kidney Disease (CKD) - Stage 4',
                    'severity', 'critical',
                    'details', jsonb_build_object(
                        'eGFR', '27 mL/min/1.73m²',
                        'creatinine', '167 µmol/L',
                        'bun', '8.1 mmol/L',
                        'status', 'Requires ongoing monitoring; at risk of progression to Stage 5 (dialysis)',
                        'next_follow_up', '2025-12-04',
                        'location', 'Regency Specialist Hospital',
                        'critical_warning', 'Must avoid NSAIDs (ibuprofen, diclofenac, aspirin) due to kidney disease'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Cardiovascular',
                    'severity', 'high',
                    'details', jsonb_build_object(
                        'hypertension', 'Managed with Valsartan/Amlodipine and Atenolol',
                        'heart_condition', 'Required surgery but delayed due to bacterial infection (July 2025)',
                        'status', 'Stable under current medication'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Gastrointestinal',
                    'severity', 'moderate',
                    'details', jsonb_build_object(
                        'hiatal_hernia', 'Confirmed via gastroscopy (2025-09-12)',
                        'gastritis', 'Mild atrophic and erosive gastritis',
                        'dysmotility', 'Esophageal/gastric muscle weakness causing food blockage sensation',
                        'h_pylori', 'Negative (good result)',
                        'dietary_requirement', 'Soft foods only, avoid hard/solid foods'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Hepatic (Liver)',
                    'severity', 'low',
                    'details', jsonb_build_object(
                        'fatty_liver', 'Mild, no cirrhosis',
                        'liver_cysts', 'Two benign complicated cysts (1.89×3.16×2.08 cm and 3.54×3.78×3.54 cm)',
                        'gallbladder', 'Normal, no stones',
                        'status', 'Requires monitoring but not immediate concern'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Metabolic/Endocrine',
                    'severity', 'moderate',
                    'details', jsonb_build_object(
                        'pre_diabetes', jsonb_build_object(
                            'hba1c', '6.0%',
                            'threshold', '6.5%'
                        ),
                        'dyslipidemia', jsonb_build_object(
                            'triglycerides', '2.97 mmol/L',
                            'hdl', '1.12 mmol/L'
                        ),
                        'weight', jsonb_build_object(
                            'current', '64 kg',
                            'previous_range', '48-54 kg',
                            'note', 'Possible fluid retention'
                        )
                    )
                ),
                jsonb_build_object(
                    'condition', 'Musculoskeletal',
                    'severity', 'moderate',
                    'details', jsonb_build_object(
                        'right_hip', 'X-ray shows deterioration compared to 2 years ago, but not rapid; surgery not recommended unless pain becomes severe',
                        'knee_arthritis', 'Confirmed bilateral, left worse than right; started joint supplements',
                        'lower_back_pain', 'Being treated with strain relief patches; X-ray pending if pain persists',
                        'osteopenia', 'Left hip bone density loss (10-year fracture risk: 5.9% major, 1.4% hip)',
                        'avascular_necrosis', 'Right hip'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Neurological/Pain',
                    'severity', 'moderate',
                    'details', jsonb_build_object(
                        'sciatica', true,
                        'neuropathic_pain', 'Possible diabetic neuropathy',
                        'management', 'Duloxetine'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Mental Health',
                    'severity', 'moderate',
                    'details', jsonb_build_object(
                        'anxiety', true,
                        'insomnia', true,
                        'management', 'Mirtazapine, Lexoton (Bromazepam)',
                        'recent_improvement', 'Mood significantly improved after care protocol implementation (Dec 10-11, 2025)'
                    )
                ),
                jsonb_build_object(
                    'condition', 'Sensory',
                    'severity', 'low',
                    'details', jsonb_build_object(
                        'hearing_loss', '45% of normal hearing',
                        'eligible_for', 'Government-subsidized hearing aid (PeKa B40)'
                    )
                )
            ),
            'recent_progress', jsonb_build_object(
                'date_range', '2025-12-10 to 2025-12-11',
                'interventions', jsonb_build_array(
                    'Stopped problematic new medication causing adverse side effects',
                    'Strict dietary control implemented: very thin rice porridge + steamed egg',
                    'Environmental adjustment: stopped prolonged air-conditioning exposure'
                ),
                'immediate_improvements', jsonb_build_array(
                    'Stomach bloating reducing',
                    'Hand tremors resolved',
                    'Able to shower independently',
                    'Mood significantly improved',
                    'Expressed desire to go out'
                )
            ),
            'care_protocol', jsonb_build_object(
                'diet', jsonb_build_object(
                    'allowed', jsonb_build_array(
                        'Thin rice congee (mostly water)',
                        'Steamed egg',
                        'Soft easily-digestible foods'
                    ),
                    'avoid', jsonb_build_array(
                        'Sweet potato (番薯) - high potassium',
                        'Bread (面包) - high sodium and phosphorus',
                        'Cauliflower (野菜花) - moderate potassium',
                        'Hard or solid foods'
                    )
                ),
                'environment', jsonb_build_array(
                    'Avoid prolonged AC exposure',
                    'Keep room warm/comfortable',
                    'Monitor for hand tremors if environment changes'
                ),
                'monitoring', jsonb_build_array(
                    'Track daily: swelling, energy level, pain level, appetite, bowel movements',
                    'Watch for RED FLAGS: black stools, breathing difficulty, sudden weakness, fever'
                )
            ),
            'family_care_team', jsonb_build_array(
                jsonb_build_object(
                    'name', 'Jay',
                    'role', 'Primary caregiver',
                    'responsibilities', 'Coordinates medical appointments, implemented successful care protocol'
                ),
                jsonb_build_object(
                    'name', 'Niko',
                    'role', 'Medical coordinator',
                    'responsibilities', 'Monitors condition at shop'
                ),
                jsonb_build_object(
                    'name', 'Bin',
                    'role', 'Backup support',
                    'responsibilities', 'Daily porridge preparation'
                )
            ),
            'positive_factors', jsonb_build_array(
                'No cancer detected',
                'No H. pylori infection',
                'No GI bleeding (no anemia)',
                'Liver stable (fatty liver without cirrhosis)',
                'Strong family support',
                'Good healthcare access',
                'Eligible for PeKa B40 government healthcare subsidies'
            ),
            'current_status', 'STABLE & IMPROVING'
        ),
        
        'Comprehensive medical history imported from family health records. Patient showing significant improvement after implementation of strict dietary control and environmental adjustments on December 10, 2025.',
        
        '2025-12-11 00:00:00+00'::timestamptz -- Created at timestamp
    );

    RAISE NOTICE 'Comprehensive diagnosis session created for Yeak Kiew Ai';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Data import complete!';
    RAISE NOTICE 'Patient: Yeak Kiew Ai (yeak@gmail.com)';
    RAISE NOTICE 'Primary conditions: CKD Stage 4, Cardiovascular, GI, Musculoskeletal';
    RAISE NOTICE 'Current status: STABLE & IMPROVING';
    RAISE NOTICE '============================================';

END $$;
