-- Add dietary_preferences JSONB column to profiles table
-- Structure: {allergies: string[], dietary_type: string, disliked_foods: string[], serving_size: number}

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.dietary_preferences IS 
'User dietary preferences for meal planning: {allergies: [], dietary_type: string, disliked_foods: [], serving_size: number}';
