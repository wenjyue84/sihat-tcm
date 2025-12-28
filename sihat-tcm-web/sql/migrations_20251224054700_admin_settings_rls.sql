-- Admin Settings Table Setup with RLS
-- Re-runnable migration that harmonizes the table structure with App expectations (Integer ID)

-- 1. Drop existing table to ensure schema matches expectations (Integer ID vs UUID mismatch fix)
DROP TABLE IF EXISTS public.admin_settings CASCADE;

-- 2. Create admin_settings table with Integer ID (to match id: 1 in App code)
CREATE TABLE public.admin_settings (
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

-- 3. Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage admin_settings" 
ON public.admin_settings
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policy: Authenticated users can read settings
CREATE POLICY "Anyone can read admin_settings" 
ON public.admin_settings
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 5. Insert default row
INSERT INTO public.admin_settings (
  id, 
  background_music_enabled, 
  background_music_url, 
  background_music_volume
)
VALUES (1, false, '', 0.5)
ON CONFLICT (id) DO NOTHING;
