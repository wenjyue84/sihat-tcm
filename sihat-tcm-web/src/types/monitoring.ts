/**
 * @fileoverview Monitoring and Error Tracking Types
 *
 * Type definitions for the enhanced error logging and monitoring system.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * System error record
 */
export interface SystemError {
  id: string;
  timestamp: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  component?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  severity: ErrorSeverity;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Error statistics for dashboard
 */
export interface ErrorStatistics {
  total_errors: number;
  critical_errors: number;
  high_errors: number;
  medium_errors: number;
  low_errors: number;
  resolved_errors: number;
  unresolved_errors: number;
  error_rate_24h: number;
  most_common_errors: Array<{
    error_type: string;
    count: number;
    percentage: number;
  }>;
  errors_by_component: Array<{
    component: string;
    count: number;
    critical_count: number;
  }>;
  hourly_error_trend: Array<{
    hour: string;
    count: number;
    critical_count: number;
  }>;
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  database: {
    status: "healthy" | "degraded" | "unhealthy";
    response_time: number;
    connection_count: number;
    query_count_24h: number;
    slow_queries_24h: number;
  };
  api: {
    status: "healthy" | "degraded" | "unhealthy";
    avg_response_time: number;
    total_requests_24h: number;
    error_rate_24h: number;
    slowest_endpoints: Array<{
      endpoint: string;
      avg_response_time: number;
      request_count: number;
    }>;
  };
  ai_service: {
    status: "healthy" | "degraded" | "unhealthy";
    response_time: number;
    success_rate_24h: number;
    total_requests_24h: number;
    model_usage: Array<{
      model: string;
      request_count: number;
      avg_response_time: number;
      success_rate: number;
    }>;
  };
  memory: {
    used_mb: number;
    total_mb: number;
    usage_percentage: number;
  };
  alerts: {
    active_count: number;
    critical_count: number;
    recent_alerts: Array<{
      id: string;
      type: string;
      message: string;
      severity: ErrorSeverity;
      timestamp: string;
    }>;
  };
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  page_load_times: {
    avg_load_time: number;
    p95_load_time: number;
    slowest_pages: Array<{
      page: string;
      avg_load_time: number;
      sample_count: number;
    }>;
  };
  user_interactions: {
    total_interactions_24h: number;
    failed_interactions_24h: number;
    success_rate: number;
    slowest_interactions: Array<{
      action: string;
      component: string;
      avg_duration: number;
      failure_rate: number;
    }>;
  };
  diagnosis_performance: {
    avg_completion_time: number;
    total_diagnoses_24h: number;
    completion_rate: number;
    step_performance: Array<{
      step: string;
      avg_time: number;
      completion_rate: number;
    }>;
  };
}

/**
 * Error logging request payload
 */
export interface LogErrorRequest {
  error_type: string;
  message: string;
  stack_trace?: string;
  component?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
}

/**
 * System health dashboard response
 */
export interface SystemHealthDashboardData {
  timestamp: string;
  overall_status: "healthy" | "degraded" | "unhealthy";
  error_statistics: ErrorStatistics;
  health_metrics: SystemHealthMetrics;
  performance_metrics: PerformanceMetrics;
  recent_errors: SystemError[];
  system_info: {
    version: string;
    environment: string;
    uptime: number;
    node_version: string;
    memory_usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

/**
 * Error filter options
 */
export interface ErrorFilters {
  severity?: ErrorSeverity[];
  error_type?: string[];
  component?: string[];
  resolved?: boolean;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Error resolution request
 */
export interface ResolveErrorRequest {
  error_ids: string[];
  resolved_by: string;
  resolution_notes?: string;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    error_count_threshold?: number;
    error_rate_threshold?: number;
    response_time_threshold?: number;
    severity_levels?: ErrorSeverity[];
    time_window_minutes?: number;
  };
  notifications: {
    email?: string[];
    slack_webhook?: string;
    webhook_url?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Monitoring dashboard widget data
 */
export interface DashboardWidget {
  id: string;
  type: "chart" | "metric" | "list" | "status";
  title: string;
  data: any;
  config: {
    refresh_interval?: number;
    chart_type?: "line" | "bar" | "pie" | "area";
    time_range?: "1h" | "6h" | "24h" | "7d" | "30d";
  };
}

// All types are already exported above with their declarations