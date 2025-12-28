-- Migration: Enhance diagnosis_sessions for managed patients
-- Description: Adds patient_id link and makes user_id nullable to support doctor-managed patients

-- 1. Add patient_id column referencing public.patients
ALTER TABLE public.diagnosis_sessions
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

-- 2. Make user_id nullable (to support cases where patient doesn't have an auth user yet)
ALTER TABLE public.diagnosis_sessions
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS diagnosis_sessions_patient_id_idx ON public.diagnosis_sessions(patient_id);

-- 4. Add comment
COMMENT ON COLUMN public.diagnosis_sessions.patient_id IS 'Link to unified patients table. Used for doctor-managed patients without an auth user.';

-- 5. Update RLS (Doctors can insert diagnosis for any patient)
-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnosis_sessions' 
        AND policyname = 'Doctors can insert diagnosis sessions'
    ) THEN
        CREATE POLICY "Doctors can insert diagnosis sessions"
        ON public.diagnosis_sessions
        FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'
            )
        );
    END IF;
END $$;
