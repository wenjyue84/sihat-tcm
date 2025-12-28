-- Add preferences JSONB column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Update the existing profile interface comment/documentation if any
COMMENT ON COLUMN profiles.preferences IS 'Stores UI preferences like language, developer mode, and dashboard settings';
