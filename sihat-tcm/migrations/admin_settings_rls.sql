-- Admin Settings Table Setup with RLS
-- Run this in your Supabase SQL Editor

-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  gemini_api_key TEXT,
  medical_history_summary_prompt TEXT,
  dietary_advice_prompt TEXT,
  background_music_enabled BOOLEAN DEFAULT false,
  background_music_url TEXT,
  background_music_volume FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can read admin_settings" ON public.admin_settings;

-- Policy: Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage admin_settings" 
ON public.admin_settings
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policy: Authenticated users can read settings (for background music, etc.)
CREATE POLICY "Anyone can read admin_settings" 
ON public.admin_settings
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert default row if it doesn't exist
INSERT INTO public.admin_settings (
  id, 
  background_music_enabled, 
  background_music_url, 
  background_music_volume
)
VALUES (1, false, '', 0.5)
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'admin_settings';
