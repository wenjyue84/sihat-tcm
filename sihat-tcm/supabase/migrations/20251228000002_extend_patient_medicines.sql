-- Migration: Extend patient_medicines table
-- Description: Adds detailed fields for medication management

-- 1. Add new columns to patient_medicines table
ALTER TABLE public.patient_medicines
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS stop_date DATE,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS chinese_name TEXT,
ADD COLUMN IF NOT EXISTS edited_by TEXT;

-- 2. Add comments for documentation
COMMENT ON COLUMN public.patient_medicines.start_date IS 'Date the medication was started';
COMMENT ON COLUMN public.patient_medicines.stop_date IS 'Date the medication was stopped (if applicable)';
COMMENT ON COLUMN public.patient_medicines.purpose IS 'Reason for taking the medication';
COMMENT ON COLUMN public.patient_medicines.specialty IS 'Medical specialty related to this medication (e.g., Cardiology)';
COMMENT ON COLUMN public.patient_medicines.chinese_name IS 'Chinese name of the medication';
COMMENT ON COLUMN public.patient_medicines.edited_by IS 'The person who last edited this record';
