-- Migration: System Errors Table for Enhanced Error Logging
-- Created: 2024-12-27
-- Purpose: Store system errors and exceptions for monitoring dashboard

-- Create system_errors table
CREATE TABLE IF NOT EXISTS system_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    component VARCHAR(200),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    url TEXT,
    user_agent TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_errors_timestamp ON system_errors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_severity ON system_errors(severity);
CREATE INDEX IF NOT EXISTS idx_system_errors_error_type ON system_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_system_errors_user_id ON system_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_system_errors_resolved ON system_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_system_errors_component ON system_errors(component);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_system_errors_severity_timestamp ON system_errors(severity, timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_errors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_system_errors_updated_at
    BEFORE UPDATE ON system_errors
    FOR EACH ROW
    EXECUTE FUNCTION update_system_errors_updated_at();

-- Enable Row Level Security
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin users can see all errors
CREATE POLICY "Admin users can view all system errors" ON system_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin users can insert errors
CREATE POLICY "Admin users can insert system errors" ON system_errors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin users can update errors (for marking as resolved)
CREATE POLICY "Admin users can update system errors" ON system_errors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow system to insert errors (for automated error logging)
CREATE POLICY "System can insert errors" ON system_errors
    FOR INSERT WITH CHECK (true);

-- Create a view for error statistics
CREATE OR REPLACE VIEW system_error_stats AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    error_type,
    severity,
    component,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved THEN 1 END) as resolved_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - timestamp))) as avg_resolution_time_seconds
FROM system_errors 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), error_type, severity, component
ORDER BY hour DESC;

-- Grant access to the view
GRANT SELECT ON system_error_stats TO authenticated;

-- Create function to clean up old error logs (keep only 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_system_errors()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_errors 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup daily (if pg_cron is available)
-- Note: This requires pg_cron extension which may not be available in all environments
-- SELECT cron.schedule('cleanup-system-errors', '0 2 * * *', 'SELECT cleanup_old_system_errors();');

-- Add comment to table
COMMENT ON TABLE system_errors IS 'Stores system errors and exceptions for monitoring and debugging purposes';
COMMENT ON COLUMN system_errors.error_type IS 'Type/category of the error (e.g., ValidationError, DatabaseError, APIError)';
COMMENT ON COLUMN system_errors.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN system_errors.component IS 'Component or module where the error occurred';
COMMENT ON COLUMN system_errors.metadata IS 'Additional error context and debugging information';
COMMENT ON COLUMN system_errors.resolved IS 'Whether the error has been acknowledged/resolved by an admin';