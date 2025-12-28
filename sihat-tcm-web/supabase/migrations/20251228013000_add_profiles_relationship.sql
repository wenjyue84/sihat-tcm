-- Migration: Add explicit relationship from diagnosis_sessions to profiles
-- Description: This allows Supabase to understand the join between diagnosis_sessions.user_id and profiles.id

-- Add foreign key constraint from diagnosis_sessions.user_id to profiles.id
-- Note: This assumes profiles.id references auth.users.id (which is standard in Supabase)
-- The user_id in diagnosis_sessions already references auth.users.id, and profiles.id is the same
ALTER TABLE public.diagnosis_sessions
ADD CONSTRAINT diagnosis_sessions_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS diagnosis_sessions_user_id_profiles_idx 
ON public.diagnosis_sessions(user_id);

-- Add comment
COMMENT ON CONSTRAINT diagnosis_sessions_user_id_profiles_fkey 
ON public.diagnosis_sessions IS 'Links diagnosis sessions to user profiles for doctor portal queries';
