-- Run this SQL in your Supabase SQL Editor to add the extracted_text column
-- Go to: https://supabase.com/dashboard/project/ydmxqxnbpkxmxfmgdqxe/sql/new

ALTER TABLE public.medical_reports 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

COMMENT ON COLUMN public.medical_reports.extracted_text IS 'AI-extracted text from the medical report document for diagnosis prefill';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medical_reports' 
AND column_name = 'extracted_text';
