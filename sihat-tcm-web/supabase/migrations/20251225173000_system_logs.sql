-- Create system_logs table for persistent logging
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs (category);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Developers and admins can read all logs
CREATE POLICY "Developers and admins can read logs" 
    ON public.system_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('developer', 'admin')
        )
    );

-- Policy: Service role can insert logs (for API routes)
-- Note: Service role bypasses RLS by default, but we add an authenticated insert policy too
CREATE POLICY "Authenticated users can insert logs"
    ON public.system_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Only developers can delete logs (for cleanup)
CREATE POLICY "Developers can delete logs"
    ON public.system_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'developer'
        )
    );

-- Add comment documenting the table
COMMENT ON TABLE public.system_logs IS 'System-wide event logs for monitoring and debugging';
