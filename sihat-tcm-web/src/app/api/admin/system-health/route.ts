/**
 * @fileoverview Admin System Health API
 *
 * Comprehensive system health dashboard API that aggregates error logs,
 * performance metrics, and system status for admin monitoring.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import { performanceMonitor } from "@/lib/monitoring/performanceMonitor";
import { alertManager } from "@/lib/monitoring/alertManager";
import { securityMonitor } from "@/lib/monitoring/securityMonitor";
import {
  SystemHealthDashboardData,
  ErrorStatistics,
  SystemHealthMetrics,
  PerformanceMetrics,
  SystemError,
  LogErrorRequest,
  ErrorSeverity,
} from "@/types/monitoring";

/**
 * GET /api/admin/system-health
 *
 * Retrieve comprehensive system health dashboard data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    devLog("info", "SystemHealthAPI", "Fetching system health dashboard data");

    // Verify admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Gather all dashboard data in parallel
    const [
      errorStatistics,
      healthMetrics,
      performanceMetrics,
      recentErrors,
      systemInfo,
    ] = await Promise.all([
      getErrorStatistics(supabase),
      getSystemHealthMetrics(supabase),
      getPerformanceMetrics(supabase),
      getRecentErrors(supabase),
      getSystemInfo(),
    ]);

    // Determine overall system status
    const overallStatus = determineOverallStatus(healthMetrics, errorStatistics);

    const dashboardData: SystemHealthDashboardData = {
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      error_statistics: errorStatistics,
      health_metrics: healthMetrics,
      performance_metrics: performanceMetrics,
      recent_errors: recentErrors,
      system_info: systemInfo,
    };

    const responseTime = Date.now() - startTime;

    devLog("info", "SystemHealthAPI", `Dashboard data retrieved in ${responseTime}ms`, {
      overall_status: overallStatus,
      total_errors: errorStatistics.total_errors,
      response_time: responseTime,
    });

    // Track API performance
    performanceMonitor.trackAPI({
      endpoint: "/api/admin/system-health",
      method: "GET",
      statusCode: 200,
      responseTime,
      userId: user.id,
      timestamp: startTime,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    devLog("error", "SystemHealthAPI", "Failed to fetch dashboard data", {
      error: error instanceof Error ? error.message : String(error),
      response_time: responseTime,
    });

    // Track error
    performanceMonitor.trackError({
      message: `System health API error: ${error instanceof Error ? error.message : String(error)}`,
      component: "SystemHealthAPI",
      severity: "high",
      timestamp: Date.now(),
    });

    return NextResponse.json(
      { error: "Failed to fetch system health data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/system-health
 *
 * Log a new system error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LogErrorRequest = await request.json();

    // Validate required fields
    if (!body.error_type || !body.message) {
      return NextResponse.json(
        { error: "error_type and message are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert error into database
    const { data, error } = await supabase
      .from("system_errors")
      .insert({
        error_type: body.error_type,
        message: body.message,
        stack_trace: body.stack_trace,
        component: body.component,
        user_id: body.user_id,
        session_id: body.session_id,
        url: body.url,
        user_agent: body.user_agent,
        severity: body.severity || "medium",
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      devLog("error", "SystemHealthAPI", "Failed to log error", { error: error.message });
      return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
    }

    // Send alert for critical errors
    if (body.severity === "critical") {
      await alertManager.sendAlert({
        type: "critical_error",
        message: `Critical error logged: ${body.message}`,
        severity: "critical",
        metadata: {
          component: body.component,
          error_id: data.id,
          error_type: body.error_type,
          user_id: body.user_id,
        },
      });
    }

    devLog("info", "SystemHealthAPI", "Error logged successfully", {
      error_id: data.id,
      error_type: body.error_type,
      severity: body.severity,
    });

    return NextResponse.json({ success: true, error_id: data.id });
  } catch (error) {
    devLog("error", "SystemHealthAPI", "Failed to process error logging request", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * Get error statistics for the dashboard
 */
async function getErrorStatistics(supabase: any): Promise<ErrorStatistics> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get error counts by severity
  const { data: errorCounts } = await supabase
    .from("system_errors")
    .select("severity, resolved")
    .gte("timestamp", twentyFourHoursAgo);

  // Get most common error types
  const { data: commonErrors } = await supabase
    .from("system_errors")
    .select("error_type")
    .gte("timestamp", twentyFourHoursAgo);

  // Get errors by component
  const { data: componentErrors } = await supabase
    .from("system_errors")
    .select("component, severity")
    .gte("timestamp", twentyFourHoursAgo)
    .not("component", "is", null);

  // Get hourly error trend
  const { data: hourlyTrend } = await supabase
    .from("system_errors")
    .select("timestamp, severity")
    .gte("timestamp", twentyFourHoursAgo)
    .order("timestamp", { ascending: true });

  // Process the data
  const totalErrors = errorCounts?.length || 0;
  const criticalErrors = errorCounts?.filter((e: any) => e.severity === "critical").length || 0;
  const highErrors = errorCounts?.filter((e: any) => e.severity === "high").length || 0;
  const mediumErrors = errorCounts?.filter((e: any) => e.severity === "medium").length || 0;
  const lowErrors = errorCounts?.filter((e: any) => e.severity === "low").length || 0;
  const resolvedErrors = errorCounts?.filter((e: any) => e.resolved).length || 0;

  // Calculate most common errors
  const errorTypeCount = commonErrors?.reduce((acc: Record<string, number>, error: any) => {
    acc[error.error_type] = (acc[error.error_type] || 0) + 1;
    return acc;
  }, {}) || {};

  const mostCommonErrors = Object.entries(errorTypeCount)
    .map(([error_type, count]) => ({
      error_type,
      count: count as number,
      percentage: totalErrors > 0 ? ((count as number) / totalErrors) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate errors by component
  const componentCount = componentErrors?.reduce((acc: Record<string, { total: number; critical: number }>, error: any) => {
    if (!acc[error.component]) {
      acc[error.component] = { total: 0, critical: 0 };
    }
    acc[error.component].total++;
    if (error.severity === "critical") {
      acc[error.component].critical++;
    }
    return acc;
  }, {}) || {};

  const errorsByComponent = Object.entries(componentCount)
    .map(([component, counts]: [string, any]) => ({
      component,
      count: counts.total,
      critical_count: counts.critical,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Process hourly trend data
  const hourlyErrorTrend = hourlyTrend?.reduce((acc: Array<{ hour: string; count: number; critical_count: number }>, error: { timestamp: string; severity: string }) => {
    const hour = new Date(error.timestamp).toISOString().slice(0, 13) + ":00:00Z";
    const existing = acc.find(item => item.hour === hour);

    if (existing) {
      existing.count++;
      if (error.severity === "critical") {
        existing.critical_count++;
      }
    } else {
      acc.push({
        hour,
        count: 1,
        critical_count: error.severity === "critical" ? 1 : 0,
      });
    }

    return acc;
  }, []) || [];

  return {
    total_errors: totalErrors,
    critical_errors: criticalErrors,
    high_errors: highErrors,
    medium_errors: mediumErrors,
    low_errors: lowErrors,
    resolved_errors: resolvedErrors,
    unresolved_errors: totalErrors - resolvedErrors,
    error_rate_24h: totalErrors, // Could be calculated as errors per hour
    most_common_errors: mostCommonErrors,
    errors_by_component: errorsByComponent,
    hourly_error_trend: hourlyErrorTrend,
  };
}

/**
 * Get system health metrics
 */
async function getSystemHealthMetrics(supabase: any): Promise<SystemHealthMetrics> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get database metrics
  const dbStartTime = Date.now();
  const { data: dbTest } = await supabase.from("users").select("count").limit(1);
  const dbResponseTime = Date.now() - dbStartTime;

  // Get API metrics from performance monitoring
  const performanceStats = performanceMonitor.getPerformanceSummary();
  const alertStats = alertManager.getAlertStatistics();
  const securityStats = securityMonitor.getSecurityStatistics();

  // Get memory usage
  const memoryUsage = process.memoryUsage();

  return {
    database: {
      status: dbResponseTime < 1000 ? "healthy" : dbResponseTime < 3000 ? "degraded" : "unhealthy",
      response_time: dbResponseTime,
      connection_count: 1, // This would need to be tracked separately
      query_count_24h: performanceStats.totalMetrics,
      slow_queries_24h: 0, // This would need to be tracked separately
    },
    api: {
      status: performanceStats.isEnabled ? "healthy" : "degraded",
      avg_response_time: 0, // This would be calculated from stored metrics
      total_requests_24h: performanceStats.apiMetrics,
      error_rate_24h: 0, // This would be calculated from error metrics
      slowest_endpoints: [], // This would be calculated from stored metrics
    },
    ai_service: {
      status: "healthy", // This would be determined by AI service health checks
      response_time: 0,
      success_rate_24h: 95, // This would be calculated from AI metrics
      total_requests_24h: 0,
      model_usage: [],
    },
    memory: {
      used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      usage_percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    alerts: {
      active_count: alertStats.activeAlerts,
      critical_count: alertStats.criticalAlerts,
      recent_alerts: [], // This would come from alert manager
    },
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(supabase: any): Promise<PerformanceMetrics> {
  // This would be implemented based on stored performance data
  return {
    page_load_times: {
      avg_load_time: 0,
      p95_load_time: 0,
      slowest_pages: [],
    },
    user_interactions: {
      total_interactions_24h: 0,
      failed_interactions_24h: 0,
      success_rate: 0,
      slowest_interactions: [],
    },
    diagnosis_performance: {
      avg_completion_time: 0,
      total_diagnoses_24h: 0,
      completion_rate: 0,
      step_performance: [],
    },
  };
}

/**
 * Get recent errors
 */
async function getRecentErrors(supabase: any): Promise<SystemError[]> {
  const { data: errors } = await supabase
    .from("system_errors")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(20);

  return errors || [];
}

/**
 * Get system information
 */
function getSystemInfo() {
  const memoryUsage = process.memoryUsage();

  return {
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    node_version: process.version,
    memory_usage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
  };
}

/**
 * Determine overall system status
 */
function determineOverallStatus(
  healthMetrics: SystemHealthMetrics,
  errorStats: ErrorStatistics
): "healthy" | "degraded" | "unhealthy" {
  // Check for critical conditions
  if (
    healthMetrics.database.status === "unhealthy" ||
    healthMetrics.api.status === "unhealthy" ||
    errorStats.critical_errors > 5 ||
    healthMetrics.memory.usage_percentage > 90
  ) {
    return "unhealthy";
  }

  // Check for degraded conditions
  if (
    healthMetrics.database.status === "degraded" ||
    healthMetrics.api.status === "degraded" ||
    errorStats.critical_errors > 0 ||
    errorStats.high_errors > 10 ||
    healthMetrics.memory.usage_percentage > 75
  ) {
    return "degraded";
  }

  return "healthy";
}