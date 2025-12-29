-- Migration: Create diagnosis_session_drafts table for auto-save functionality
-- Date: 2024-12-29
-- Description: Adds table to store in-progress diagnosis sessions for auto-save and recovery

-- Create diagnosis_session_drafts table
CREATE TABLE IF NOT EXISTS public.diagnosis_session_drafts (
    session_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_token TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT diagnosis_session_drafts_user_or_guest_check 
        CHECK ((user_id IS NOT NULL) OR (guest_token IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS diagnosis_session_drafts_user_id_idx 
    ON public.diagnosis_session_drafts(user_id);

CREATE INDEX IF NOT EXISTS diagnosis_session_drafts_guest_token_idx 
    ON public.diagnosis_session_drafts(guest_token);

CREATE INDEX IF NOT EXISTS diagnosis_session_drafts_updated_at_idx 
    ON public.diagnosis_session_drafts(updated_at);

CREATE INDEX IF NOT EXISTS diagnosis_session_drafts_metadata_idx 
    ON public.diagnosis_session_drafts USING GIN(metadata);

-- Enable Row Level Security
ALTER TABLE public.diagnosis_session_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own session drafts
CREATE POLICY "Users can view own session drafts" ON public.diagnosis_session_drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session drafts" ON public.diagnosis_session_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session drafts" ON public.diagnosis_session_drafts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session drafts" ON public.diagnosis_session_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Guest sessions policy (allow access by guest_token)
CREATE POLICY "Guest sessions access by token" ON public.diagnosis_session_drafts
    FOR ALL USING (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token = current_setting('app.guest_token', true)
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_diagnosis_session_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diagnosis_session_drafts_updated_at
    BEFORE UPDATE ON public.diagnosis_session_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_diagnosis_session_drafts_updated_at();

-- Add comments
COMMENT ON TABLE public.diagnosis_session_drafts IS 'Stores in-progress diagnosis sessions for auto-save and recovery functionality';
COMMENT ON COLUMN public.diagnosis_session_drafts.session_id IS 'Unique session identifier';
COMMENT ON COLUMN public.diagnosis_session_drafts.user_id IS 'Reference to authenticated user (null for guest sessions)';
COMMENT ON COLUMN public.diagnosis_session_drafts.guest_token IS 'Token for guest session identification';
COMMENT ON COLUMN public.diagnosis_session_drafts.data IS 'Diagnosis wizard data in progress';
COMMENT ON COLUMN public.diagnosis_session_drafts.metadata IS 'Session metadata including progress, step, timing info';
COMMENT ON COLUMN public.diagnosis_session_drafts.created_at IS 'Session creation timestamp';
COMMENT ON COLUMN public.diagnosis_session_drafts.updated_at IS 'Last update timestamp (auto-updated)';