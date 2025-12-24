-- Migration: Create meal_plans table for TCM AI Meal Planner
-- Description: Stores AI-generated personalized meal plans based on TCM diagnosis

-- 1. Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    diagnosis_session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    
    -- Core meal plan data (JSONB for flexibility)
    plan_json JSONB NOT NULL,
    
    -- Metadata
    constitution TEXT, -- e.g., "Yin Deficiency", "Damp Heat"
    syndrome TEXT, -- Primary syndrome pattern
    
    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE,
    completed_days INTEGER DEFAULT 0, -- Track progress (0-7)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days') -- Plans expire after 30 days
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_diagnosis_session_id_idx ON public.meal_plans(diagnosis_session_id);
CREATE INDEX IF NOT EXISTS meal_plans_is_active_idx ON public.meal_plans(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS meal_plans_created_at_idx ON public.meal_plans(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Users can view their own meal plans
CREATE POLICY "Users can view their own meal plans"
    ON public.meal_plans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own meal plans
CREATE POLICY "Users can insert their own meal plans"
    ON public.meal_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans (e.g., mark days complete)
CREATE POLICY "Users can update their own meal plans"
    ON public.meal_plans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete their own meal plans"
    ON public.meal_plans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Doctors can view all meal plans (for clinical oversight)
CREATE POLICY "Doctors can view all meal plans"
    ON public.meal_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'
        )
    );

-- 5. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_meal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_meal_plans_updated_at();

-- 6. Create function to deactivate expired plans
CREATE OR REPLACE FUNCTION public.deactivate_expired_meal_plans()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.meal_plans
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < timezone('utc'::text, now());
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 7. Add helpful comments
COMMENT ON TABLE public.meal_plans IS 'TCM AI-generated personalized meal plans based on patient diagnosis';
COMMENT ON COLUMN public.meal_plans.plan_json IS 'Complete meal plan JSON with weekly_plan array and shopping_list';
COMMENT ON COLUMN public.meal_plans.constitution IS 'TCM constitution type (e.g., Yin Deficiency, Yang Deficiency, Damp Heat)';
COMMENT ON COLUMN public.meal_plans.syndrome IS 'Primary TCM syndrome pattern';
COMMENT ON COLUMN public.meal_plans.completed_days IS 'Number of days completed (0-7) for progress tracking';
COMMENT ON COLUMN public.meal_plans.expires_at IS 'Plan expiration date (default 30 days from creation)';

-- 8. Create sample structure documentation
COMMENT ON COLUMN public.meal_plans.plan_json IS 'Expected JSON structure:
{
  "weekly_plan": [
    {
      "day": 1,
      "date": "2024-12-24",
      "meals": {
        "breakfast": { "name": "...", "tcm_benefit": "...", "ingredients": [...], "instructions": "..." },
        "lunch": { "name": "...", "tcm_benefit": "...", "ingredients": [...], "instructions": "..." },
        "dinner": { "name": "...", "tcm_benefit": "...", "ingredients": [...], "instructions": "..." },
        "snack": { "name": "...", "tcm_benefit": "...", "ingredients": [...], "instructions": "..." }
      }
    },
    ...
  ],
  "shopping_list": {
    "Produce": ["...", "..."],
    "Proteins": ["...", "..."],
    "Spices & Herbs": ["...", "..."],
    "Grains & Legumes": ["...", "..."],
    "Beverages": ["...", "..."]
  },
  "tcm_principles": "Overall TCM dietary guidance for this constitution..."
}';

-- 9. Create view for active meal plans with user info
CREATE OR REPLACE VIEW meal_plans_with_user AS
SELECT 
    mp.*,
    p.full_name,
    ds.primary_diagnosis,
    ds.overall_score
FROM meal_plans mp
LEFT JOIN profiles p ON mp.user_id = p.id
LEFT JOIN diagnosis_sessions ds ON mp.diagnosis_session_id = ds.id
WHERE mp.is_active = TRUE;

COMMENT ON VIEW meal_plans_with_user IS 'Active meal plans with user and diagnosis information for easier querying';

