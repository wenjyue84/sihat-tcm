-- Add medical_history column to profiles table
-- This column stores patient medical history information

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Add column comment for documentation
COMMENT ON COLUMN public.profiles.medical_history IS 'Patient medical history information';

-- Verify the column was added with detailed information
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'medical_history';
