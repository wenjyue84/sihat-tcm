-- Migration: Create patient_medicines table for Health Portfolio
-- Description: Stores medicines and supplements currently in use by the patient

-- 1. Create patient_medicines table
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

-- 2. Create index for user_id
CREATE INDEX IF NOT EXISTS patient_medicines_user_id_idx ON public.patient_medicines(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.patient_medicines ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own medicines"
    ON public.patient_medicines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines"
    ON public.patient_medicines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines"
    ON public.patient_medicines FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines"
    ON public.patient_medicines FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_patient_medicines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_medicines_updated_at
    BEFORE UPDATE ON public.patient_medicines
    FOR EACH ROW
    EXECUTE PROCEDURE update_patient_medicines_updated_at();

-- 6. Add comments
COMMENT ON TABLE public.patient_medicines IS 'Stores medicines and supplements currently in use by the patient for Health Portfolio';
