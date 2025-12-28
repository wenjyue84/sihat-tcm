-- Add extracted_text column to medical_reports if it doesn't exist
-- This is a safety migration to ensure the column exists even if the original migration wasn't run

ALTER TABLE public.medical_reports 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN public.medical_reports.extracted_text IS 'AI-extracted text from the medical report document for diagnosis prefill';
