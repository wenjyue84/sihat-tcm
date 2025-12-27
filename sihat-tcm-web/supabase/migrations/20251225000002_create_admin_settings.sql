-- Create admin_settings table for storing admin preferences and acknowledged alerts
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Ensure columns exist (idempotent)
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS acknowledged_alerts TEXT[] DEFAULT '{}';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS music_enabled BOOLEAN DEFAULT true;

-- Insert default row if not exists
INSERT INTO admin_settings (id, acknowledged_alerts)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users with admin role to read/write
CREATE POLICY "Admins can manage settings" ON admin_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow service role full access (for server-side API calls)
CREATE POLICY "Service role has full access" ON admin_settings
    FOR ALL
    USING (auth.role() = 'service_role');
