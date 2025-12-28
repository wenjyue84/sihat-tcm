-- ========================================
-- SIMPLIFIED: Seed Patient Data for Yeak Kiew Ai
-- ========================================
-- Execute this in Supabase Dashboard > SQL Editor
-- or via: npx supabase db execute --db-url <connection-string> < this-file.sql

-- STEP 1: First, get the user_id for yeak@gmail.com
-- You can find this in: Supabase Dashboard > Authentication > Users
-- Look for yeak@gmail.com and copy the UUID

-- Replace 'YOUR_USER_ID_HERE' below with the actual UUID:
-- Example: '123e4567-e89b-12d3-a456-426614174000'

\set user_id 'YOUR_USER_ID_HERE'

-- STEP 2: Update profile
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
    155,
    64,
    'CKD Stage 4 (eGFR 27), Hypertension, CVD, Hiatal hernia, Gastritis, Fatty liver, Pre-diabetes (HbA1c 6.0%), Knee/hip arthritis, Osteopenia, Avascular necrosis, Sciatica, Anxiety, Insomnia, Hearing loss 45%',
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

-- STEP 3: Insert diagnosis session
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
    :'user_id'::uuid,
    'Multiple Chronic Conditions - CKD Stage 4, CVD, GI',
    'Kidney Yin Deficiency with Damp-Heat',
    45,
    ARRAY[
        'CKD Stage 4 symptoms', 'Fluid retention', 'Elevated creatinine (167 µmol/L)', 
        'Low eGFR (27)', 'Stomach bloating', 'Food blockage sensation', 'Gastritis', 
        'Hiatal hernia', 'Dysphagia for solids', 'Right hip pain', 'Bilateral knee arthritis', 
        'Lower back pain', 'Osteopenia', 'Hypertension', 'Heart condition', 'Sciatica', 
        'Neuropathic pain', 'Hand tremors (resolved)', 'Pre-diabetes', 'High triglycerides', 
        'Low HDL', 'Anxiety', 'Insomnia', 'Hearing loss 45%'
    ],
    ARRAY[
        'Valsartan/Amlodipine', 'Atenolol', 'Rabeprazole', 'Duloxetine', 
        'Mirtazapine', 'Lexoton (Bromazepam)', 'Joint supplements', 
        'Paracetamol only (NO NSAIDs)', 'Strain relief patches'
    ],
    jsonb_build_object(
        'weight_kg', 64,
        'weight_trend', 'increased from 48-54kg - possible fluid retention',
        'kidney_function', jsonb_build_object(
            'eGFR', '27 mL/min/1.73m²',
            'creatinine', '167 µmol/L',
            'bun', '8.1 mmol/L',
            'date', '2025-08-01',
            'stage', 'CKD Stage 4'
        ),
        'metabolic', jsonb_build_object(
            'hba1c', '6.0%',
            'triglycerides', '2.97 mmol/L',
            'hdl', '1.12 mmol/L'
        ),
        'bone_density', jsonb_build_object(
            'left_hip', 'osteopenia',
            '10yr_fracture_risk_major', '5.9%',
            '10yr_fracture_risk_hip', '1.4%'
        )
    ),
    E'# Medical Summary - Yeak Kiew Ai (78F)

## 🚨 CRITICAL CONDITIONS

### CKD Stage 4 (CRITICAL)
- eGFR: 27 mL/min/1.73m² (Aug 2025)
- Creatinine: 167 µmol/L, BUN: 8.1 mmol/L
- ⚠️ **STRICTLY AVOID NSAIDs** (ibuprofen, aspirin, diclofenac)
- Risk of progression to dialysis
- Next follow-up: Dec 4, 2025 @ Regency Hospital

### Gastrointestinal
- Hiatal hernia (gastroscopy Sep 12, 2025)
- Mild atrophic/erosive gastritis
- Dysmotility → food blockage
- **Diet: SOFT FOODS ONLY**

### Cardiovascular
- Hypertension (on Valsartan/Amlodipine + Atenolol)
- Heart surgery delayed (bacterial infection Jul 2025)

### Musculoskeletal
- Right hip avascular necrosis
- Bilateral knee arthritis (L>R)
- Osteopenia (left hip)
- Lower back pain

### Metabolic
- Pre-diabetes: HbA1c 6.0%
- Dyslipidemia: TG 2.97, HDL 1.12

## ✅ RECENT PROGRESS (Dec 10-11, 2025)

### JAY''s Interventions:
1. ✅ Stopped problematic medication
2. ✅ Strict diet: thin porridge + steamed egg
3. ✅ Stopped prolonged AC exposure

### Improvements:
- ✅ Hand tremors RESOLVED
- ✅ Bloating reducing
- ✅ Mood improved
- ✅ Showering independently
- ✅ Wants to go out

## 🏥 Medical Timeline

- **Dec 10-11, 2025**: Home care protocol → significant improvement
- **Dec 5, 2025**: Hospital visit (hip/knee/back)
- **Nov 21, 2025**: Hospital admission (few days)
- **Nov 17, 2025**: New prescriptions (Rabeprazole, Lexoton, Duloxetine)
- **Sep 11-12, 2025**: Comprehensive workup (RM3,000) - gastroscopy, ultrasound
- **Aug 2025**: CKD Stage 4 diagnosis

## 👨‍👩‍👧 Family Care Team

- **Jay**: Primary caregiver, medical coordinator
- **Niko**: Medical support, monitoring
- **Bin**: Daily meal prep, backup support',

    E'## 🍲 CURRENT DIETARY PROTOCOL (PROVEN EFFECTIVE)

### ✅ ALLOWED:
- Very thin rice porridge (水为主) ~300ml
- Steamed egg
- Soft, easily-digestible foods

### ❌ STRICTLY AVOID:
- Sweet potato (番薯) - HIGH POTASSIUM → dangerous for CKD
- Bread (面包) - high sodium/phosphorus
- Cauliflower (野菜花) - causes bloating
- Hard/solid foods - hiatal hernia risk

## 🌡️ ENVIRONMENTAL:
- Keep room WARM
- ❌ NO prolonged AC (causes hand tremors)

## 💊 MEDICATION SAFETY:
⚠️ **CRITICAL**: NO NSAIDs (will worsen kidneys)
✅ Paracetamol ONLY for pain

## 📅 MONITORING:
Daily: swelling, energy, pain, appetite, bowel movements
🚨 RED FLAGS → IMMEDIATE ER:
- Black stools
- Breathing difficulty
- Sudden weakness
- Fever

## ✅ POSITIVE FACTORS:
- No cancer
- No H. pylori
- No GI bleeding
- Strong family support
- Good healthcare access
- PeKa B40 eligible',

    '2025-12-11',
    
    jsonb_build_object(
        'patient', jsonb_build_object(
            'name', 'Yeak Kiew Ai (叶巧爱)',
            'age', 78,
            'gender', 'female',
            'weight', 64
        ),
        'status', 'STABLE & IMPROVING',
        'conditions', jsonb_build_array(
            jsonb_build_object('name', 'CKD Stage 4', 'severity', 'critical'),
            jsonb_build_object('name', 'Hypertension', 'severity', 'high'),
            jsonb_build_object('name', 'Hiatal hernia', 'severity', 'moderate'),
            jsonb_build_object('name', 'Pre-diabetes', 'severity', 'moderate'),
            jsonb_build_object('name', 'Knee/hip arthritis', 'severity', 'moderate')
        ),
        'family_care', jsonb_build_array(
            jsonb_build_object('name', 'Jay', 'role', 'Primary caregiver'),
            jsonb_build_object('name', 'Niko', 'role', 'Medical coordinator'),
            jsonb_build_object('name', 'Bin', 'role', 'Meal prep & support')
        ),
        'recent_improvements', jsonb_build_array(
            'Hand tremors resolved (stopped AC)',
            'Bloating reducing (diet change)',
            'Mood improved',
            'Showering independently',
            'Expressed desire to go out'
        )
    ),
    
    'Comprehensive medical history imported Dec 2025. Patient showing significant improvement after strict dietary control and environmental adjustments by Jay (primary caregiver).',
    
    '2025-12-11 00:00:00+00'::timestamptz
);

SELECT 'Data import complete for Yeak Kiew Ai!' as status;
