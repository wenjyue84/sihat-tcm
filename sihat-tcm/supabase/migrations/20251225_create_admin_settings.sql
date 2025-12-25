-- Create admin_settings table for storing admin preferences and acknowledged alerts
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    acknowledged_alerts TEXT[] DEFAULT '{}',
    music_url TEXT,
    music_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

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
