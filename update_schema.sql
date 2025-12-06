-- Add a config column to system_prompts to store additional settings like model selection
ALTER TABLE system_prompts 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Update the existing doctor prompt to have some default config
UPDATE system_prompts 
SET config = '{"default_level": "Expert", "model": "gemini-1.5-flash"}'::jsonb
WHERE role = 'doctor';
