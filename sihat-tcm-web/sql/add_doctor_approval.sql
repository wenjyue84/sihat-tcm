-- ============================================================================
-- Add Doctor Approval System
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add is_approved column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 2. Set existing Master Doctor (from quick login) as approved
UPDATE public.profiles 
SET is_approved = true 
WHERE role = 'doctor';

-- 3. Comment for documentation
COMMENT ON COLUMN public.profiles.is_approved IS 'Only approved doctors appear in verification request doctor list';

-- ============================================================================
-- Create Test Doctor Accounts
-- These accounts allow testing the doctor approval workflow
-- ============================================================================

-- Note: Users must first exist in auth.users before profiles can be created.
-- Use the Supabase Auth API or Dashboard to create these users first.
-- Below are the profile entries to insert AFTER creating auth users.

-- Example: After creating user via Auth Dashboard with email 'dr.wong@sihat.com'
-- and password 'password123', get their user ID and run:

/*
INSERT INTO public.profiles (id, role, full_name, is_approved, updated_at)
VALUES 
  ('<dr-wong-user-id>', 'doctor', 'Dr. Wong Wei Lin', true, NOW()),
  ('<dr-chen-user-id>', 'doctor', 'Dr. Chen Mei Ling', true, NOW()),
  ('<dr-tan-user-id>', 'doctor', 'Dr. Tan Boon Keat', false, NOW()),
  ('<dr-lim-user-id>', 'doctor', 'Dr. Lim Siew Hui', false, NOW())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();
*/
