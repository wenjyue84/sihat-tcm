-- Deployment History and Monitoring Tables
-- This migration creates tables for tracking deployments, rollbacks, and system metrics

-- Create deployment_history table
CREATE TABLE IF NOT EXISTS deployment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    version TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failure', 'rolled_back')),
    type TEXT NOT NULL DEFAULT 'deployment' CHECK (type IN ('deployment', 'rollback', 'hotfix', 'maintenance')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create system_metrics table (if not exists)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT DEFAULT 'count',
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deployment_alerts table
CREATE TABLE IF NOT EXISTS deployment_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id UUID REFERENCES deployment_history(id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create health_check_results table
CREATE TABLE IF NOT EXISTS health_check_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    environment TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance_baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    environment TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    baseline_value NUMERIC NOT NULL,
    threshold_warning NUMERIC,
    threshold_critical NUMERIC,
    unit TEXT DEFAULT 'ms',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(environment, metric_name, active) WHERE active = TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployment_history_environment_timestamp 
    ON deployment_history(environment, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_deployment_history_commit_sha 
    ON deployment_history(commit_sha);

CREATE INDEX IF NOT EXISTS idx_deployment_history_status 
    ON deployment_history(status);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type_timestamp 
    ON system_metrics(type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name_timestamp 
    ON system_metrics(name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_deployment_alerts_type_created 
    ON deployment_alerts(alert_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_check_results_environment_timestamp 
    ON health_check_results(environment, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_performance_baselines_environment_active 
    ON performance_baselines(environment, active);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_deployment_history_updated_at 
    BEFORE UPDATE ON deployment_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_alerts_updated_at 
    BEFORE UPDATE ON deployment_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_baselines_updated_at 
    BEFORE UPDATE ON performance_baselines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default performance baselines
INSERT INTO performance_baselines (environment, metric_name, baseline_value, threshold_warning, threshold_critical, unit)
VALUES 
    ('staging', 'response_time', 1000, 2000, 5000, 'ms'),
    ('staging', 'error_rate', 0.5, 1.0, 5.0, 'percent'),
    ('staging', 'availability', 99.5, 99.0, 95.0, 'percent'),
    ('production', 'response_time', 500, 1000, 3000, 'ms'),
    ('production', 'error_rate', 0.1, 0.5, 2.0, 'percent'),
    ('production', 'availability', 99.9, 99.5, 99.0, 'percent')
ON CONFLICT (environment, metric_name, active) WHERE active = TRUE 
DO NOTHING;

-- Create RLS policies
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data
CREATE POLICY "Service role can access deployment_history" ON deployment_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access deployment_alerts" ON deployment_alerts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access health_check_results" ON health_check_results
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access performance_baselines" ON performance_baselines
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access system_metrics" ON system_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read deployment data
CREATE POLICY "Authenticated users can read deployment_history" ON deployment_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read deployment_alerts" ON deployment_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read health_check_results" ON health_check_results
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow developers and admins to manage alerts
CREATE POLICY "Developers can manage deployment_alerts" ON deployment_alerts
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('developer', 'admin')
        )
    );

-- Create functions for deployment management
CREATE OR REPLACE FUNCTION get_deployment_status(env TEXT DEFAULT 'production')
RETURNS TABLE (
    current_version TEXT,
    current_commit TEXT,
    deployed_at TIMESTAMPTZ,
    status TEXT,
    rollback_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dh.version,
        dh.commit_sha,
        dh.timestamp,
        dh.status,
        EXISTS(
            SELECT 1 FROM deployment_history dh2 
            WHERE dh2.environment = env 
            AND dh2.status = 'success' 
            AND dh2.timestamp < dh.timestamp
        ) as rollback_available
    FROM deployment_history dh
    WHERE dh.environment = env
    AND dh.status = 'success'
    ORDER BY dh.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_deployment_alert(
    p_deployment_id UUID,
    p_alert_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO deployment_alerts (
        deployment_id,
        alert_type,
        title,
        message,
        metadata
    ) VALUES (
        p_deployment_id,
        p_alert_type,
        p_title,
        p_message,
        p_metadata
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_performance_summary(
    env TEXT DEFAULT 'production',
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    avg_response_time NUMERIC,
    error_rate NUMERIC,
    total_requests BIGINT,
    availability NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH metrics_summary AS (
        SELECT 
            AVG(CASE WHEN sm.name = 'response_time' THEN sm.value::NUMERIC END) as avg_response_time,
            COUNT(CASE WHEN sm.type = 'api' THEN 1 END) as total_requests,
            COUNT(CASE WHEN sm.type = 'errors' THEN 1 END) as error_count
        FROM system_metrics sm
        WHERE sm.timestamp >= NOW() - (hours_back || ' hours')::INTERVAL
        AND sm.tags->>'environment' = env
    )
    SELECT 
        COALESCE(ms.avg_response_time, 0) as avg_response_time,
        CASE 
            WHEN ms.total_requests > 0 
            THEN (ms.error_count::NUMERIC / ms.total_requests::NUMERIC) * 100 
            ELSE 0 
        END as error_rate,
        COALESCE(ms.total_requests, 0) as total_requests,
        CASE 
            WHEN ms.total_requests > 0 
            THEN ((ms.total_requests - ms.error_count)::NUMERIC / ms.total_requests::NUMERIC) * 100 
            ELSE 100 
        END as availability
    FROM metrics_summary ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create backup function for deployments
CREATE OR REPLACE FUNCTION create_backup(backup_name TEXT)
RETURNS TEXT AS $$
DECLARE
    backup_id TEXT;
BEGIN
    -- This is a placeholder function
    -- In a real implementation, this would trigger actual backup processes
    backup_id := 'backup_' || backup_name || '_' || extract(epoch from now())::text;
    
    -- Log the backup creation
    INSERT INTO system_metrics (type, name, value, metadata)
    VALUES (
        'backup',
        'backup_created',
        backup_id,
        jsonb_build_object('backup_name', backup_name, 'timestamp', now())
    );
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON deployment_history TO authenticated;
GRANT SELECT ON deployment_alerts TO authenticated;
GRANT SELECT ON health_check_results TO authenticated;
GRANT EXECUTE ON FUNCTION get_deployment_status(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_deployment_alert(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_performance_summary(TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_backup(TEXT) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE deployment_history IS 'Tracks all deployment activities including deployments, rollbacks, and maintenance';
COMMENT ON TABLE deployment_alerts IS 'Stores alerts and notifications related to deployments';
COMMENT ON TABLE health_check_results IS 'Records results of automated health checks';
COMMENT ON TABLE performance_baselines IS 'Defines performance baselines and thresholds for monitoring';
COMMENT ON FUNCTION get_deployment_status(TEXT) IS 'Returns current deployment status for specified environment';
COMMENT ON FUNCTION create_deployment_alert(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Creates a new deployment alert';
COMMENT ON FUNCTION get_performance_summary(TEXT, INTEGER) IS 'Returns performance summary for specified environment and time period';
COMMENT ON FUNCTION create_backup(TEXT) IS 'Creates a backup with the specified name';