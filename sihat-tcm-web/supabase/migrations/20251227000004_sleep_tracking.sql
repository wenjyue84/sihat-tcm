-- Create sleep_logs table
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_start TIMESTAMPTZ NOT NULL,
    sleep_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    audio_url TEXT,
    analysis_result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'sleep_logs' 
        AND policyname = 'Users can view their own sleep logs'
    ) THEN
        CREATE POLICY "Users can view their own sleep logs"
            ON public.sleep_logs FOR SELECT
            USING (auth.uid() = patient_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'sleep_logs' 
        AND policyname = 'Users can insert their own sleep logs'
    ) THEN
        CREATE POLICY "Users can insert their own sleep logs"
            ON public.sleep_logs FOR INSERT
            WITH CHECK (auth.uid() = patient_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'sleep_logs' 
        AND policyname = 'Users can update their own sleep logs'
    ) THEN
        CREATE POLICY "Users can update their own sleep logs"
            ON public.sleep_logs FOR UPDATE
            USING (auth.uid() = patient_id);
    END IF;
END $$;

-- Enable realtime for this table
alter publication supabase_realtime add table sleep_logs;

-- Storage bucket for sleep recordings
-- Note: Requires storage schema access. If this fails, user must create bucket manually.
-- We use a safe block to attempt creation.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('sleep-recordings', 'sleep-recordings', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if storage schema access is restricted
    NULL;
END $$;

-- Storage policies (Applied if bucket exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'sleep-recordings') THEN
        
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = 'Users can upload their own sleep recordings'
        ) THEN
            CREATE POLICY "Users can upload their own sleep recordings"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'sleep-recordings' AND 
                auth.uid() = owner
            );
        END IF;

        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = 'Users can view their own sleep recordings'
        ) THEN
            CREATE POLICY "Users can view their own sleep recordings"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = 'sleep-recordings' AND 
                auth.uid() = owner
            );
        END IF;

    END IF;
END $$;
