-- Add 'developer' to the profiles_role_check constraint
-- First, drop the existing constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Then, add the updated check that includes 'developer'
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('patient', 'doctor', 'admin', 'developer'));
