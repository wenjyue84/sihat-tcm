-- Add is_hidden column to diagnosis_sessions table
ALTER TABLE public.diagnosis_sessions
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Index for performance when filtering
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_is_hidden ON public.diagnosis_sessions(is_hidden) WHERE is_hidden = false;
