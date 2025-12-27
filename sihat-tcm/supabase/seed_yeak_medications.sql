-- Seed medications for Yeak Kiew Ai
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Automatically find the user ID by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'yeak@gmail.com';
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User "yeak@gmail.com" not found! Skipping medication seed.';
    ELSE
        -- Clear existing medications for this user to avoid duplicates if re-run
        DELETE FROM public.patient_medicines WHERE user_id = v_user_id;

        -- Insert Medication Records
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

        RAISE NOTICE '✅ SUCCESS: Medication data for Yeak Kiew Ai has been populated.';
    END IF;
END $$;
