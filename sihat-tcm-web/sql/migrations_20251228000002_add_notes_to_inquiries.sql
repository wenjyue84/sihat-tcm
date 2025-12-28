-- Migration: Add notes column to inquiries table
-- Description: Supports flagging and dismissing cases in the Doctor Portal

ALTER TABLE IF EXISTS public.inquiries 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop and recreate the view to avoid column mismatch errors
DROP VIEW IF EXISTS inquiries_unified;

CREATE OR REPLACE VIEW inquiries_unified AS
SELECT 
    ds.id,
    ds.user_id,
    ds.primary_diagnosis as symptoms,
    ds.full_report as diagnosis_report,
    ds.notes,
    ds.created_at
FROM diagnosis_sessions ds
ORDER BY ds.created_at DESC;
