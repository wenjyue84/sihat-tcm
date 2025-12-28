-- Background Music Feature Migration
-- Run this in your Supabase SQL Editor

-- Add background music columns to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS background_music_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_music_url TEXT,
ADD COLUMN IF NOT EXISTS background_music_volume FLOAT DEFAULT 0.5;

-- Insert default row if table is empty
INSERT INTO admin_settings (id, background_music_enabled, background_music_url, background_music_volume)
VALUES (1, false, '', 0.5)
ON CONFLICT (id) DO NOTHING;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
  AND column_name LIKE 'background_music%';
