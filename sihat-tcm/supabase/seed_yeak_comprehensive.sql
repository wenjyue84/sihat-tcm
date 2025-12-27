-- ============================================================================
-- COMPREHENSIVE SEED SCRIPT FOR YEAK KIEW AI
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Find User ID from profiles
    SELECT id INTO v_user_id FROM public.profiles WHERE full_name ILIKE '%Yeak Kiew Ai%' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        -- Try auth.users if profile doesn't exist
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'yeak@gmail.com' LIMIT 1;
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User Yeak Kiew Ai not found. Please ensure the account exists.';
    END IF;
    
    RAISE NOTICE 'Found User ID: %', v_user_id;

    -- ========================================================================
    -- PART 1: UPDATE PROFILE WITH COMPREHENSIVE MEDICAL HISTORY
    -- ========================================================================
    UPDATE public.profiles SET
        full_name = 'Yeak Kiew Ai',
        age = 78,
        gender = 'female',
        height = 155,
        weight = 64,
        medical_history = 'CKD Stage 4 (eGFR 27), Hypertension, Cardiovascular Disease, Hiatal Hernia, Gastritis, Dysmotility, Mild Fatty Liver, Pre-diabetes (HbA1c 6.0%), Osteopenia, Avascular Necrosis (R-Hip), Knee Arthritis (Bilateral), Sciatica, Anxiety/Insomnia, Hearing Loss (45%)',
        preferred_language = 'zh'
    WHERE id = v_user_id;

    -- ========================================================================
    -- PART 2: CLEAR EXISTING DATA (for clean re-seed)
    -- ========================================================================
    DELETE FROM public.patient_medicines WHERE user_id = v_user_id;
    DELETE FROM public.diagnosis_sessions WHERE user_id = v_user_id;

    -- ========================================================================
    -- PART 3: INSERT MEDICATIONS
    -- ========================================================================
    INSERT INTO public.patient_medicines (
        user_id, name, chinese_name, dosage, frequency, start_date, stop_date, purpose, specialty, is_active, edited_by
    ) VALUES 
    (v_user_id, 'Duloxetine (Duloxpra)', '神经痛药', 'As prescribed', NULL, '2025-11-17', '2025-12-10', 'Nerve pain/muscle relaxation', '疼痛科', FALSE, 'wenjyue lew'),
    (v_user_id, 'Remeron SolTab (Mirtazapine)', '安眠抗焦虑药', '15mg nightly', 'Nightly', '2020-01-01', NULL, 'Mental health / sleep / anxiety (精神科)', '精神科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Normaten (Atenolol)', '心跳药', '50mg daily', 'Daily', '2020-01-01', NULL, 'Slow heart rate control (心脏跳慢)', '心脏科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Lexoton (Bromazepam)', '安眠镇静药', 'As prescribed', NULL, '2025-11-17', NULL, 'Anxiety/sleep', '精神科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Joint supplements (replaced by Mobithron Advance)', '关节保健品', '1 month course', NULL, NULL, '2025-12-05', 'Knee arthritis', '骨科', FALSE, 'wenjyue lew'),
    (v_user_id, 'Trajenta (Linagliptin)', '糖尿病药', '5mg daily', 'Daily', '2020-01-01', NULL, 'Diabetes management (kencing manis/糖尿病)', '内分泌科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Exforge (Amlodipine/Valsartan)', '降血压护肾药', '10mg/160mg daily', 'Daily', '2020-01-01', NULL, 'High blood pressure + kidney protection (高血压)', '肾脏科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Crestor (Rosuvastatin)', '降胆固醇药', '10mg daily', 'Daily', '2020-01-01', NULL, 'Cholesterol control (降胆固醇)', '心脏科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Rabeprazole', '胃酸药', 'As prescribed', NULL, '2025-11-17', NULL, 'Acid reflux (PPI)', '胃科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Moxifloxacin (Avelox)', '抗生素', '400mg once daily', 'Once daily', '2025-12-04', '2025-12-10', 'Antibiotic (1 week course)', '感染科', FALSE, 'wenjyue lew'),
    (v_user_id, 'Mobithron Advance (100/10/45mg)', '骨关节药', '1 capsule once daily', 'Once daily', '2025-12-05', NULL, 'Bone/joint health (collagen, hyaluronic acid, boswellia)', '骨科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Simethicone (Gascoal)', '消胀气药', '50mg, 3 times daily', '3 times daily', '2025-12-05', NULL, 'Anti-gas/bloating (胀风)', '胃科', TRUE, 'wenjyue lew'),
    (v_user_id, 'Brintellix (Vortioxetine)', '抗抑郁药', '10mg, ½ tablet at bedtime', 'Bedtime', '2025-12-09', NULL, 'Antidepressant/anxiety (from Dr. Chan)', '精神科', TRUE, 'wenjyue lew');

    RAISE NOTICE '✅ Inserted 13 medications';

    -- ========================================================================
    -- PART 4: INSERT DIAGNOSIS SESSIONS (Multiple Historical Records)
    -- ========================================================================

    -- Session 1: CKD Stage 4 Diagnosis (August 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines, 
        vital_signs, clinical_notes, treatment_plan, created_at, full_report
    ) VALUES (
        v_user_id,
        'Chronic Kidney Disease Stage 4 - Critical Kidney Function Decline',
        'Kidney Yin Deficiency with Damp-Heat',
        35,
        ARRAY['Fatigue', 'Fluid retention', 'Weight gain', 'Abdominal discomfort', 'Bloating', 'Fever episodes'],
        ARRAY['Valsartan/Amlodipine', 'Atenolol', 'Trajenta'],
        jsonb_build_object(
            'weight', jsonb_build_object('value', 60, 'unit', 'kg'),
            'kidney_function', jsonb_build_object('eGFR', '27 mL/min/1.73m²', 'creatinine', '167 µmol/L', 'bun', '8.1 mmol/L', 'status', 'Stage 4 - Severe'),
            'metabolic', jsonb_build_object('hba1c', '6.0%', 'triglycerides', '2.97 mmol/L', 'hdl', '1.12 mmol/L')
        ),
        E'# CKD Stage 4 Diagnosis\n\n## Critical Findings\n- eGFR: 27 mL/min/1.73m² (Stage 4)\n- Significant decline from previous measurements\n- Risk of progression to dialysis\n\n## Immediate Actions\n- Strict BP control\n- **NO NSAIDs** (ibuprofen, aspirin, naproxen)\n- Nephrology referral scheduled\n\n## TCM Perspective\n- Kidney Yin Deficiency pattern\n- Damp-Heat accumulation\n- Qi and Blood stagnation',
        E'1. Strict blood pressure control\n2. Avoid all nephrotoxic medications\n3. Low sodium, low potassium diet\n4. Monitor weight daily for fluid retention\n5. Follow-up nephrology in 3 months',
        '2025-08-15 10:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female'),
            'diagnosis', jsonb_build_object('primary_pattern', 'Kidney Yin Deficiency with Damp-Heat', 'secondary_patterns', ARRAY['Blood Stasis', 'Spleen Qi Deficiency']),
            'analysis', jsonb_build_object('summary', 'Severe kidney function decline requiring immediate intervention and close monitoring'),
            'recommendations', jsonb_build_object('lifestyle', ARRAY['Rest adequately', 'Avoid cold foods', 'Light exercise only'], 'avoid', ARRAY['NSAIDs', 'High sodium foods', 'High potassium foods']),
            'five_elements', jsonb_build_object(
                'scores', jsonb_build_object('kidney', 25, 'liver', 55, 'heart', 50, 'spleen', 45, 'lung', 60),
                'justifications', jsonb_build_object(
                    'kidney', 'Stage 4 CKD with eGFR 27, severe Yin deficiency',
                    'liver', 'Mild fatty liver, some Qi stagnation from stress',
                    'heart', 'Hypertension managed, bacterial infection history',
                    'spleen', 'Digestive issues, bloating, poor appetite',
                    'lung', 'Relatively stable, occasional cough from gastric reflux'
                )
            )
        )
    );

    -- Session 2: Comprehensive GI Workup (September 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines,
        vital_signs, clinical_notes, treatment_plan, created_at, full_report
    ) VALUES (
        v_user_id,
        'Gastrointestinal Dysfunction - Hiatal Hernia & Gastritis',
        'Spleen Qi Deficiency with Stomach Yin Deficiency',
        42,
        ARRAY['Food blockage sensation', 'Difficulty swallowing solids', 'Stomach bloating', 'Acid reflux', 'Abdominal discomfort'],
        ARRAY['Rabeprazole', 'Previous acid suppressants'],
        jsonb_build_object(
            'weight', jsonb_build_object('value', 62, 'unit', 'kg'),
            'gastroscopy', jsonb_build_object('hiatal_hernia', 'Present', 'gastritis', 'Mild atrophic and erosive', 'h_pylori', 'Negative', 'esophageal_dysmotility', 'Present')
        ),
        E'# Gastroscopy Results (Sept 11-12, 2025)\n\n## Findings\n- Hiatal hernia confirmed\n- Mild atrophic and erosive gastritis\n- Esophageal dysmotility (muscle weakness)\n- H. pylori: NEGATIVE ✅\n- No malignancy detected ✅\n\n## Dietary Recommendations\n- Soft foods only\n- Avoid hard/solid foods\n- Small frequent meals\n\n## TCM Analysis\n- Spleen Qi Deficiency leading to poor digestion\n- Stomach Yin Deficiency causing dryness\n- Food stagnation pattern',
        E'1. Soft food diet strictly enforced\n2. Continue PPI medication\n3. Small, frequent meals\n4. Avoid lying down after eating\n5. Elevate head during sleep',
        '2025-09-12 14:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female'),
            'diagnosis', jsonb_build_object('primary_pattern', 'Spleen Qi Deficiency with Stomach Yin Deficiency', 'secondary_patterns', ARRAY['Food Stagnation', 'Rebellious Stomach Qi']),
            'analysis', jsonb_build_object('summary', 'GI dysfunction requiring dietary modification and ongoing PPI therapy. Good news: No cancer, no H. pylori.'),
            'recommendations', jsonb_build_object(
                'food_therapy', jsonb_build_object('beneficial', ARRAY['Rice congee', 'Steamed egg', 'Soft tofu', 'Warm soups'], 'avoid', ARRAY['Hard foods', 'Fried foods', 'Spicy foods', 'Cold drinks']),
                'lifestyle', ARRAY['Eat slowly', 'Chew thoroughly', 'Stay upright after meals']
            ),
            'five_elements', jsonb_build_object(
                'scores', jsonb_build_object('kidney', 28, 'liver', 52, 'heart', 48, 'spleen', 35, 'lung', 58),
                'justifications', jsonb_build_object(
                    'kidney', 'CKD ongoing, slight improvement with management',
                    'liver', 'Stable, mild fatty liver unchanged',
                    'heart', 'Hypertension controlled',
                    'spleen', 'Significantly weakened - hiatal hernia, gastritis, dysmotility',
                    'lung', 'Good, supporting digestion with breathing exercises'
                )
            )
        )
    );

    -- Session 3: Hospital Admission (November 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines,
        clinical_notes, treatment_plan, created_at, full_report
    ) VALUES (
        v_user_id,
        'Acute Exacerbation - Dental Infection & Pain Crisis',
        'Toxic Heat with Qi Deficiency',
        30,
        ARRAY['Severe pain', 'Dental infection', 'Fever', 'Weakness', 'Poor appetite'],
        ARRAY['Antibiotics', 'Pain medication', 'Mirtazapine', 'Lexoton'],
        E'# Hospital Admission (Nov 21, 2025)\n\n## Presenting Complaints\n- Dental infection requiring treatment\n- Pain management\n- Kidney function monitoring\n\n## Concerns\n- Infection in CKD patient is high-risk\n- Limited antibiotic options due to kidney function\n- Careful pain management (NO NSAIDs)\n\n## Outcome\n- Stabilized after few days\n- Discharged with follow-up plan',
        E'1. Complete antibiotic course\n2. Dental follow-up required\n3. Continue kidney monitoring\n4. Pain relief with Paracetamol only\n5. Anxiety management with Lexoton',
        '2025-11-21 09:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female'),
            'diagnosis', jsonb_build_object('primary_pattern', 'Toxic Heat with Qi Deficiency'),
            'analysis', jsonb_build_object('summary', 'Acute infection episode requiring hospitalization. High-risk due to CKD and age.'),
            'five_elements', jsonb_build_object(
                'scores', jsonb_build_object('kidney', 22, 'liver', 48, 'heart', 45, 'spleen', 38, 'lung', 50),
                'justifications', jsonb_build_object(
                    'kidney', 'Under stress from infection, requires protection',
                    'liver', 'Slightly affected by infection and medications',
                    'heart', 'Stable but monitoring for infection spread',
                    'spleen', 'Weakened from illness, poor appetite',
                    'lung', 'Respiratory function maintained'
                )
            )
        )
    );

    -- Session 4: Musculoskeletal Assessment (December 5, 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines,
        vital_signs, clinical_notes, treatment_plan, created_at, full_report
    ) VALUES (
        v_user_id,
        'Musculoskeletal Degeneration - Hip AVN & Bilateral Knee Arthritis',
        'Kidney Yang Deficiency with Blood Stasis',
        40,
        ARRAY['Right hip pain', 'Bilateral knee pain (Left > Right)', 'Lower back pain', 'Difficulty walking', 'Stiffness'],
        ARRAY['Mobithron Advance', 'Simethicone', 'Strain relief patches'],
        jsonb_build_object(
            'imaging', jsonb_build_object('right_hip', 'AVN - deterioration from 2 years ago, not rapid', 'knees', 'Bilateral arthritis, left worse', 'spine', 'Lower back strain, X-ray pending'),
            'bone_density', jsonb_build_object('left_hip', 'Osteopenia', 'fracture_risk_10y_major', '5.9%', 'fracture_risk_10y_hip', '1.4%')
        ),
        E'# Orthopedic Assessment (Dec 5, 2025)\n\n## X-Ray Findings\n- **Right Hip:** AVN with slow deterioration; surgery not recommended unless severe pain\n- **Knees:** Bilateral arthritis (L > R); started joint supplements\n- **Lower Back:** Strain; patches provided; X-ray if pain persists\n\n## Bone Density\n- Left hip osteopenia\n- Fall risk assessment: MODERATE\n\n## TCM Perspective\n- Kidney Yang Deficiency (bone weakness)\n- Blood Stasis (joint degeneration)\n- Bi Syndrome (arthritis pattern)',
        E'1. Joint supplements for 1 month\n2. May need lubricant injection (RM2,000+/knee) if no improvement\n3. Strain relief patches for back\n4. Avoid high-impact activities\n5. Fall prevention measures at home',
        '2025-12-05 11:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female'),
            'diagnosis', jsonb_build_object('primary_pattern', 'Kidney Yang Deficiency with Blood Stasis', 'secondary_patterns', ARRAY['Bi Syndrome', 'Liver Blood Deficiency']),
            'analysis', jsonb_build_object('summary', 'Progressive musculoskeletal degeneration requiring conservative management. Surgery high-risk due to comorbidities.'),
            'recommendations', jsonb_build_object(
                'lifestyle', ARRAY['Gentle stretching', 'Warm compresses', 'Avoid cold exposure', 'Use walking aids if needed'],
                'acupoints', ARRAY['ST36 足三里', 'SP6 三阴交', 'GB34 阳陵泉', 'KD3 太溪']
            ),
            'five_elements', jsonb_build_object(
                'scores', jsonb_build_object('kidney', 30, 'liver', 45, 'heart', 50, 'spleen', 42, 'lung', 55),
                'justifications', jsonb_build_object(
                    'kidney', 'Yang deficiency - bone weakness, osteopenia, AVN',
                    'liver', 'Blood deficiency affecting tendons and joints',
                    'heart', 'Stable with medication management',
                    'spleen', 'Improving with dietary control',
                    'lung', 'Chest/cough improved'
                )
            )
        )
    );

    -- Session 5: Home Care Intervention Success (December 10-11, 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines,
        clinical_notes, treatment_plan, created_at, full_report
    ) VALUES (
        v_user_id,
        'Recovery Phase - Dietary & Environmental Optimization',
        'Spleen Yang Deficiency with Kidney Yin Deficiency',
        48,
        ARRAY['Reduced bloating', 'Hand tremors resolved', 'Improved energy', 'Better mood', 'Independent mobility'],
        ARRAY['Thin rice congee diet', 'Steamed egg', 'Warm environment'],
        E'# Home Care Progress (Dec 10-11, 2025)\n\n## Interventions by Jay\n1. **Stopped problematic medication** causing side effects\n2. **Strict dietary control:**\n   - Previously eating harmful foods: 番薯 (sweet potato), 面包 (bread), 野菜花 (cauliflower)\n   - Now: Very thin rice congee + steamed egg only\n3. **Environmental adjustment:**\n   - Stopped prolonged AC exposure\n   - Warmer environment - much more comfortable\n\n## Improvements Observed 🎉\n- ✅ Stomach bloating REDUCING\n- ✅ Hand tremors STOPPED\n- ✅ Showering INDEPENDENTLY\n- ✅ Mood IMPROVED\n- ✅ Wants to go out again\n\n## Why These Interventions Work\n| Food Avoided | Why It''s Problematic |\n|--------------|----------------------|\n| Sweet potato | High potassium - dangerous for CKD |\n| Bread | High sodium/phosphorus additives |\n| Cauliflower | Causes gas, moderate potassium |',
        E'## Updated Care Protocol\n\n### Diet\n- ✅ ALLOWED: Thin rice congee, steamed egg, soft tofu, warm soups\n- ❌ AVOID: 番薯, 面包, 野菜花, high-K/high-P foods, hard foods\n\n### Environment\n- Keep room warm (no prolonged AC)\n- Monitor for tremors if environment changes\n\n### Monitoring\n- Daily tracking: swelling, energy, pain, appetite, bowels\n- Watch for: black stools, breathing difficulty, fever',
        '2025-12-11 15:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female'),
            'diagnosis', jsonb_build_object('primary_pattern', 'Spleen Yang Deficiency with Kidney Yin Deficiency - IMPROVING'),
            'analysis', jsonb_build_object('summary', 'Excellent response to dietary and environmental modifications. Patient showing signs of stabilization and recovery.'),
            'recommendations', jsonb_build_object(
                'food_therapy', jsonb_build_object(
                    'beneficial', ARRAY['Thin rice congee (水为主)', 'Steamed egg', 'Warm water', 'Soft foods'],
                    'avoid', ARRAY['Sweet potato (番薯)', 'Bread (面包)', 'Cauliflower (野菜花)', 'Cold foods', 'Hard foods']
                ),
                'lifestyle', ARRAY['Warm environment', 'Light activity as tolerated', 'Rest adequately', 'Family support continues']
            ),
            'five_elements', jsonb_build_object(
                'scores', jsonb_build_object('kidney', 35, 'liver', 50, 'heart', 52, 'spleen', 48, 'lung', 58),
                'justifications', jsonb_build_object(
                    'kidney', 'Stabilizing with dietary control, protecting from further damage',
                    'liver', 'Improving with reduced medication burden and stress',
                    'heart', 'Stable, good blood pressure control',
                    'spleen', 'Significantly improved with congee diet - bloating reduced',
                    'lung', 'Good respiratory function maintained'
                )
            ),
            'care_team', jsonb_build_array(
                jsonb_build_object('name', 'Jay', 'role', 'Primary Caregiver', 'task', 'Care Coordination & Medical Appointments'),
                jsonb_build_object('name', 'Niko', 'role', 'Medical Coordinator', 'task', 'Monitoring at Shop'),
                jsonb_build_object('name', 'Bin', 'role', 'Support', 'task', 'Daily Porridge Preparation')
            )
        )
    );

    -- Session 6: Current Status Summary (December 2025)
    INSERT INTO public.diagnosis_sessions (
        user_id, primary_diagnosis, constitution, overall_score, symptoms, medicines,
        vital_signs, clinical_notes, treatment_plan, follow_up_date, created_at, full_report
    ) VALUES (
        v_user_id,
        'Multiple Chronic Conditions - Stable & Improving',
        'Mixed Deficiency Pattern - Kidney Yin/Yang and Spleen Qi',
        50,
        ARRAY['Mild fatigue', 'Manageable pain', 'Good appetite for soft foods', 'Stable mood', 'Reduced swelling'],
        ARRAY['Exforge', 'Atenolol', 'Crestor', 'Trajenta', 'Rabeprazole', 'Mirtazapine', 'Mobithron Advance'],
        jsonb_build_object(
            'weight', jsonb_build_object('value', 64, 'unit', 'kg', 'note', 'Slightly elevated, monitoring for fluid'),
            'kidney_function', jsonb_build_object('eGFR', '27 mL/min/1.73m²', 'status', 'Stage 4 - Stable'),
            'blood_pressure', 'Controlled with medication',
            'diabetes', jsonb_build_object('hba1c', '6.0%', 'status', 'Pre-diabetic, controlled')
        ),
        E'# Comprehensive Health Summary (Dec 2025)\n\n## Primary Conditions\n1. **CKD Stage 4** - Stable, eGFR 27\n2. **Cardiovascular** - HTN controlled, heart surgery pending\n3. **GI** - Hiatal hernia, gastritis, dysmotility - managed with diet\n4. **Musculoskeletal** - Hip AVN, knee arthritis, back pain - conservative management\n5. **Mental Health** - Anxiety/insomnia - medicated, improved\n6. **Hearing** - 45% loss, eligible for PeKa B40 aid\n\n## ⚠️ CRITICAL ALERTS\n- **NO NSAIDs** - Will worsen kidney function\n- **SOFT FOOD ONLY** - Choking/hernia risk\n- **FALL RISK** - Due to hip/knee issues and medications\n- **LOW POTASSIUM** - Avoid 番薯, bananas, oranges\n\n## ✅ Positive Factors\n- No cancer detected\n- No H. pylori\n- Strong family support (Jay, Niko, Bin)\n- Good healthcare access\n- PeKa B40 eligible',
        E'## Ongoing Care Requirements\n\n1. **Monitoring:** Kidney function, diabetes, BP every 3 months\n2. **Diet:** Soft foods, low sodium, controlled carbs, LOW POTASSIUM\n3. **Medications:** Strict adherence to regimen\n4. **Watch for:** Black stools, breathing changes, sudden weakness, fever\n5. **Follow-ups:** Nephrology, Cardiology, Ortho as scheduled\n\n## Family Care Responsibilities\n- **Jay:** Primary caregiver, coordinates appointments\n- **Niko:** Medical monitoring at shop\n- **Bin:** Daily congee preparation',
        '2026-01-15',
        '2025-12-27 10:00:00+08',
        jsonb_build_object(
            'patient_summary', jsonb_build_object('name', 'Yeak Kiew Ai', 'age', 78, 'gender', 'Female', 'summary_date', '2025-12-27'),
            'diagnosis', jsonb_build_object(
                'primary_pattern', 'Mixed Deficiency Pattern - Kidney Yin/Yang and Spleen Qi',
                'secondary_patterns', ARRAY['Blood Stasis', 'Damp-Heat residual'],
                'affected_organs', ARRAY['Kidney', 'Spleen', 'Liver', 'Heart']
            ),
            'constitution', jsonb_build_object('type', 'Mixed Deficiency', 'description', 'Complex multi-organ involvement requiring balanced support'),
            'analysis', jsonb_build_object(
                'summary', 'Patient is stable and showing improvement with current management. Multiple chronic conditions require ongoing coordination.',
                'key_findings', jsonb_build_object(
                    'from_inquiry', 'Reduced symptoms, improved independence, better mood',
                    'from_visual', 'Reduced swelling, healthier complexion',
                    'from_pulse', 'Thready and weak, consistent with deficiency pattern'
                ),
                'five_elements', jsonb_build_object(
                    'scores', jsonb_build_object('liver', 50, 'heart', 52, 'spleen', 48, 'lung', 58, 'kidney', 35),
                    'justifications', jsonb_build_object(
                        'liver', 'Mild fatty liver stable, emotional state improving',
                        'heart', 'HTN controlled, awaiting cardiac surgery when stable',
                        'spleen', 'Much improved with congee diet, reduced bloating',
                        'lung', 'Good function, supporting overall recovery',
                        'kidney', 'Stage 4 CKD - critical focus, maintaining with strict protocol'
                    )
                )
            ),
            'recommendations', jsonb_build_object(
                'food_therapy', jsonb_build_object(
                    'beneficial', ARRAY['Rice congee', 'Steamed egg', 'Soft tofu', 'Warm soups', 'White fish'],
                    'recipes', ARRAY['山药粥 (Yam congee)', '蒸蛋 (Steamed egg)', '豆腐汤 (Tofu soup)'],
                    'avoid', ARRAY['Sweet potato', 'Bread', 'Cauliflower', 'Bananas', 'Oranges', 'High-sodium foods']
                ),
                'lifestyle', ARRAY['Warm environment', 'Light walking', 'Adequate rest', 'Stress management'],
                'acupoints', ARRAY['KD3 太溪', 'SP6 三阴交', 'ST36 足三里', 'CV6 气海'],
                'herbal_formulas', jsonb_build_array(
                    jsonb_build_object('name', 'Liu Wei Di Huang Wan', 'purpose', 'Kidney Yin support', 'dosage', 'Consult practitioner'),
                    jsonb_build_object('name', 'Si Jun Zi Tang', 'purpose', 'Spleen Qi tonification', 'dosage', 'Consult practitioner')
                ),
                'doctor_consultation', 'Continue regular follow-ups with nephrology, cardiology, and orthopedics. Consider TCM practitioner for complementary support.'
            ),
            'precautions', jsonb_build_object(
                'warning_signs', ARRAY['Black stools (GI bleeding)', 'Sudden breathing difficulty', 'Severe weakness', 'Fever > 38°C', 'Significant weight gain (fluid retention)'],
                'contraindications', ARRAY['NSAIDs (ibuprofen, aspirin, naproxen)', 'High potassium foods', 'Hard/solid foods', 'Prolonged cold exposure'],
                'special_notes', 'CKD Stage 4 patient - all medications must be kidney-safe. Consult nephrologist before any new medication.'
            ),
            'follow_up', jsonb_build_object(
                'timeline', 'Next nephrology: January 2026',
                'expected_improvement', 'Continued stabilization with current protocol',
                'next_steps', 'Monitor kidney function, reassess musculoskeletal symptoms, hearing aid assessment'
            ),
            'care_team', jsonb_build_array(
                jsonb_build_object('name', 'Jay', 'role', 'Primary Caregiver', 'task', 'Care Coordination'),
                jsonb_build_object('name', 'Niko', 'role', 'Support', 'task', 'Medical Monitoring'),
                jsonb_build_object('name', 'Bin', 'role', 'Support', 'task', 'Meal Preparation')
            )
        )
    );

    RAISE NOTICE '✅ Inserted 6 diagnosis sessions';
    RAISE NOTICE '✅✅✅ COMPLETE: All data for Yeak Kiew Ai has been populated successfully!';

END $$;
