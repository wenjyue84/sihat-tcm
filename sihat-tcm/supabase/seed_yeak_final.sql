-- ============================================================================
-- FINAL COMPLETE DATA SEED SCRIPT FOR YEAK KIEW AI (yeak@gmail.com)
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find "yeak@gmail.com" and copy the User UID
-- 3. Replace 'PASTE_YOUR_UUID_HERE' below with that ID
-- 4. Run this entire script in Supabase Dashboard > SQL Editor
-- ============================================================================

\set user_id 'PASTE_YOUR_UUID_HERE'

-- 1. Update Profile Information
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
    :'user_id'::uuid,
    'patient',
    'Yeak Kiew Ai',
    78,
    'female',
    155, -- Estimated cm
    64,  -- kg (Dec 2025)
    'CKD Stage 4 (eGFR 27), Hypertension, Cardiovascular Disease, Hiatal Hernia, Gastritis, Dysmotility, Mild Fatty Liver, Pre-diabetes, Osteopenia, Avascular Necrosis (R-Hip), Knee Arthritis, Sciatica, Anxiety/Insomnia, Hearing Loss',
    'en'
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    medical_history = EXCLUDED.medical_history,
    preferred_language = EXCLUDED.preferred_language;


-- 2. Insert Comprehensive Medical Record (Diagnosis Session)
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
    notes,
    created_at,
    full_report
) VALUES (
    :'user_id'::uuid,
    'Multiple Chronic Conditions - CKD Stage 4, CVD, GI, Musculoskeletal',
    'Kidney Yin Deficiency with Damp-Heat & Blood Stasis',
    45, -- Overall health score
    
    -- Symptoms Array
    ARRAY[
        'Chronic Kidney Disease Stage 4 symptoms',
        'Fluid retention (weight increase)',
        'Stomach bloating',
        'Food blockage sensation (dysmotility)',
        'Difficulty swallowing solids',
        'Right hip pain',
        'Bilateral knee pain (Left > Right)',
        'Lower back pain',
        'Hand tremors (resolved w/ env change)',
        'Anxiety',
        'Insomnia',
        'Hearing loss (45%)',
        'Fatigue'
    ],

    -- Medications Array
    ARRAY[
        'Valsartan/Amlodipine (Hypertension)',
        'Atenolol (Hypertension)',
        'Rabeprazole (Acid reflux/Gastritis)',
        'Duloxetine (Nerve pain/Sciatica)',
        'Mirtazapine (Anxiety/Sleep)',
        'Lexoton/Bromazepam (Anxiety)',
        'Joint Supplements',
        'Paracetamol (Pain - SOS only)',
        'Strain relief patches (Back)'
    ],

    -- Vital Signs & Labs JSON
    jsonb_build_object(
        'weight', jsonb_build_object(
            'value', 64, 
            'unit', 'kg',
            'note', 'Increased from 48-54kg; indicates fluid retention'
        ),
        'kidney_function', jsonb_build_object(
            'eGFR', '27 mL/min/1.73m² (Aug 2025)',
            'creatinine', '167 µmol/L',
            'bun', '8.1 mmol/L',
            'status', 'CRITICAL - Stage 4'
        ),
        'metabolic', jsonb_build_object(
            'hba1c', '6.0% (Pre-diabetic)',
            'triglycerides', '2.97 mmol/L (High)',
            'hdl', '1.12 mmol/L (Low)'
        ),
        'bone_density', jsonb_build_object(
            'left_hip', 'Osteopenia',
            'fracture_risk_10y_major', '5.9%',
            'fracture_risk_10y_hip', '1.4%'
        ),
        'hearing', '45% of normal (Eligible for PeKa B40 aid)'
    ),

    -- Clinical Notes (Markdown)
    E'# Medical Summary: Yeak Kiew Ai (78F)\n\n## 🚨 CRITICAL ALERTS\n- **CKD STAGE 4**: eGFR 27. **ABSOLUTELY NO NSAIDs** (Ibuprofen, Voltarne, Aspirin etc).\n- **FALL RISK**: Due to hip AVN, knee arthritis, and medications.\n- **DIET**: Soft/Liquid diet ONLY due to Hiatal Hernia & Dysmotility.\n\n## 📋 Diagnoses Breakdown\n### 1. Renal (Kidney)\n- CKD Stage 4 (Severe). Risk of progression to dialysis.\n- Needs strict BP control & avoidance of nephrotoxic drugs.\n\n### 2. Gastrointestinal\n- Hiatal Hernia & Gastritis (Erosive).\n- Esophageal dysmotility -> sensation of food sticking.\n- *Management*: Rabeprazole + Soft Diet.\n\n### 3. Cardiovascular\n- Hypertension (Managed).\n- History of bacterial heart infection (surgery delayed).\n\n### 4. Musculoskeletal\n- **Right Hip**: Avascular Necrosis (deteriorating).\n- **Knees**: Bilateral Arthritis.\n- **Spine**: Lower back pain/Sciatica.\n\n### 5. Mental Health\n- Anxiety & Insomnia (Managed with Mirtazapine/Lexoton).\n\n## ✅ Recent Progress (Dec 10-11, 2025)\n- **Interventions by Jay**: Stopped bad meds, strict Congee+Egg diet, Warmer room.\n- **Outcome**: Tremors STOPPED. Bloating REDUCED. Mood IMPROVED. Independent showering.',

    -- Treatment Plan (Markdown)
    E'## 🛡️ CARE PROTOCOL (Dec 2025)\n\n### 1. DIETARY RULES (CRITICAL)\n- ✅ **PERMITTED**: Thin Rice Congee (Watery), Steamed Egg, Soft Tofu, Liquid/Pureed foods.\n- ❌ **FORBIDDEN**: \n  - Sweet Potato (High Potassium -> Kidney danger!)\n  - Bread (High Sodium/Phos additives)\n  - Cauliflower (Gas/Bloating)\n  - Hard/Solid foods (Choking/Hernia risk)\n\n### 2. MEDICATION SAFETY\n- **PAIN**: Paracetamol ONLY. Patches allowed.\n- **NO NSAIDs**: Never use Ibuprofen/Diclofenac.\n\n### 3. LIFESTYLE\n- **Environment**: Keep warm. Avoid cold AC (triggers tremors).\n- **Activity**: Independent showering allowed if stable. Sit in car for outings.\n\n### 4. MONITORING\n- Watch for: Swelling (Edema), Breathing trouble, Black stools (GI bleed).\n- Follow-up: Nephrology @ Regency (Dec 4, 2025).',

    '2025-12-11', -- Follow up date
    
    'Comprehensive record imported from patient summary. Validated by primary caregiver (Jay).',
    
    '2025-12-11 00:00:00+00', -- Created At

    -- Full Report JSON (Structured Data for App Logic)
    jsonb_build_object(
        'patient_profile', jsonb_build_object(
            'name', 'Yeak Kiew Ai',
            'age', 78,
            'summary_date', '2025-12-07'
        ),
        'conditions_summary', jsonb_build_array(
            jsonb_build_object('system', 'Renal', 'condition', 'CKD Stage 4', 'status', 'Critical - eGFR 27'),
            jsonb_build_object('system', 'Cardio', 'condition', 'Hypertension', 'status', 'Managed'),
            jsonb_build_object('system', 'GI', 'condition', 'Hiatal Hernia/Gastritis', 'status', 'Diet Controlled'),
            jsonb_build_object('system', 'Ortho', 'condition', 'Hip AVN/Knee Arthritis', 'status', 'Pain Management')
        ),
        'care_team', jsonb_build_array(
            jsonb_build_object('name', 'Jay', 'role', 'Primary', 'task', 'Care Coordination'),
            jsonb_build_object('name', 'Niko', 'role', 'Support', 'task', 'Medical Monitoring'),
            jsonb_build_object('name', 'Bin', 'role', 'Support', 'task', 'Meals')
        ),
        'recent_wins', jsonb_build_array(
            'Hand tremors resolved (AC adjustment)',
            'Bloating reduced (Diet adjustment)',
            'Mood improved',
            'Independent showering'
        ),
        'alerts', jsonb_build_array(
            'NO NSAIDs',
            'SOFT FOOD ONLY',
            'LOW POTASSIUM'
        )
    )
);

SELECT '✅ SUCCESS: Data for Yeak Kiew Ai has been populated.' as result;
