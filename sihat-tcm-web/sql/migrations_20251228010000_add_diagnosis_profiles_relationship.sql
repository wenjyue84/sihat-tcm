-- Migration: Add foreign key relationship between diagnosis_sessions and profiles
-- This allows Supabase to recognize the relationship between diagnosis_sessions.user_id and profiles.id

-- NOTE: This migration adds an additional foreign key to diagnosis_sessions.user_id
-- diagnosis_sessions.user_id ALREADY references auth.users.id
-- We're adding a SECOND reference to profiles.id (which itself references auth.users.id)
-- This is a "multi-reference" pattern where both FK point to the same ultimate table

-- Since PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD CONSTRAINT,
-- we use a DO block to check first

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'diagnosis_sessions_user_id_profiles_fkey'
    ) THEN
        -- Drop the existing foreign key to auth.users if it exists
        -- We'll keep only the profiles reference since profiles.id = auth.users.id
        ALTER TABLE public.diagnosis_sessions
        DROP CONSTRAINT IF EXISTS diagnosis_sessions_user_id_fkey;
        
        -- Add new foreign key constraint from diagnosis_sessions.user_id to profiles.id
        ALTER TABLE public.diagnosis_sessions
        ADD CONSTRAINT diagnosis_sessions_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: diagnosis_sessions_user_id_profiles_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists: diagnosis_sessions_user_id_profiles_fkey';
    END IF;
END $$;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT diagnosis_sessions_user_id_profiles_fkey ON public.diagnosis_sessions IS 
'Links diagnosis sessions to user profiles via user_id. This enables the relationship syntax profiles!user_id in Supabase queries.';
