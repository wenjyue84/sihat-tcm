-- Add preferred_language column to profiles table
-- This stores the user's language preference (en, zh, ms)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- Add a check constraint to ensure valid language codes
ALTER TABLE public.profiles
ADD CONSTRAINT valid_language_code 
CHECK (preferred_language IN ('en', 'zh', 'ms') OR preferred_language IS NULL);

COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language: en (English), zh (Chinese), ms (Malay)';
