-- Migration: Add flag column to profiles and patients tables
-- Description: Supports patient flagging (Critical, Watch, etc.) for doctor dashboard

-- Add flag to profiles table (used by inquiries relation)
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS flag text;

-- Add flag to patients table (for unified patient management)
ALTER TABLE IF EXISTS public.patients 
ADD COLUMN IF NOT EXISTS flag text;

-- Add comment to explain values
COMMENT ON COLUMN public.profiles.flag IS 'Status flag: Critical, High Priority, Watch, Normal';
COMMENT ON COLUMN public.patients.flag IS 'Status flag: Critical, High Priority, Watch, Normal';
