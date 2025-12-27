-- ============================================================================
-- COMPLETE MEDICATIONS UPDATE SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.patient_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.patient_medicines ENABLE ROW LEVEL SECURITY;

-- Add Policies (Safe usage with IF NOT EXISTS style logic via DO block or just ignore errors if they exist)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own medicines" ON public.patient_medicines;
    CREATE POLICY "Users can view their own medicines" ON public.patient_medicines FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own medicines" ON public.patient_medicines;
    CREATE POLICY "Users can insert their own medicines" ON public.patient_medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own medicines" ON public.patient_medicines;
    CREATE POLICY "Users can update their own medicines" ON public.patient_medicines FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can delete their own medicines" ON public.patient_medicines;
    CREATE POLICY "Users can delete their own medicines" ON public.patient_medicines FOR DELETE USING (auth.uid() = user_id);
END $$;

-- 2. Add New Columns (Safe IF NOT EXISTS)
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS stop_date DATE;
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS chinese_name TEXT;
ALTER TABLE public.patient_medicines ADD COLUMN IF NOT EXISTS edited_by TEXT;

-- 3. Seed Data for Yeak Kiew Ai
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Find User
    SELECT id INTO v_user_id FROM public.profiles WHERE full_name ILIKE '%Yeak Kiew Ai%' LIMIT 1;
    
    -- Try auth.users if profiles fail (requires admin privs usually, but profiles is safer for public schema scripts)
    -- If v_user_id is NULL, we can't seed.
    
    IF v_user_id IS NOT NULL THEN
        -- Clear old data
        DELETE FROM public.patient_medicines WHERE user_id = v_user_id;

        -- Insert Records
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
        
        RAISE NOTICE '✅ Successfully populated medications for user %', v_user_id;
    ELSE
        RAISE WARNING '⚠️ User "Yeak Kiew Ai" not found in profiles.';
    END IF;
END $$;
