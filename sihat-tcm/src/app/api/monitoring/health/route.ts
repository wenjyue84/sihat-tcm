/**
 * @fileoverview System Health Monitoring API
 * 
 * Comprehensive health check endpoint that monitors all system components
 * and provides detailed health status information.
 * 
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/systemLogger';
import { createClient } from '@/lib/supabase/server';
import { performanceMonitor } from '@/lib/monitoring/performanceMonitor';
import { alertManager } from '@/lib/monitoring/alertManager';
import { securityMonitor } from '@/lib/monitoring/securityMonitor';

/**
 * Health check status levels
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Component health information
 */
interface ComponentHealth {
  status: HealthStatus;
  responseTime?: number;
  lastCheck: string;
  details?: Record<string, any>;
  error?: string;
}

/**
 * System health response
 */
interface SystemHealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    database: ComponentHealth;
    ai_service: ComponentHealth;
    external_apis: ComponentHealth;
    monitoring: ComponentHealth;
    security: ComponentHealth;
  };
  metrics: {
    activeAlerts: number;
    errorRate: number;
    avgResponseTime: number;
    totalRequests: number;
  };
  commit?: string;
}

/**
 * GET /api/monitoring/health
 * 
 * Comprehensive system health check
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    devLog('info', 'HealthCheck', 'Starting comprehensive health check');

    // Initialize response structure
    const healthResponse: SystemHealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '3.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: await checkDatabaseHealth(),
        ai_service: await checkAIServiceHealth(),
        external_apis: await checkExternalAPIsHealth(),
        monitoring: checkMonitoringHealth(),
        security: checkSecurityHealth()
      },
      metrics: await getSystemMetrics(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
    };

    // Determine overall system status
    const componentStatuses = Object.values(healthResponse.components).map(c => c.status);
    
    if (componentStatuses.includes('unhealthy')) {
      healthResponse.status = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      healthResponse.status = 'degraded';
    } else if (componentStatuses.includes('unknown')) {
      healthResponse.status = 'degraded';
    }

    const responseTime = Date.now() - startTime;
    
    devLog('info', 'HealthCheck', `Health check completed in ${responseTime}ms`, {
      status: healthResponse.status,
      responseTime
    });

    // Record health check metrics
    performanceMonitor.trackMetric({
      name: 'health_check_response_time',
      value: responseTime,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        status: healthResponse.status,
        environment: healthResponse.environment
      }
    });

    // Return appropriate HTTP status based on health
    const httpStatus = healthResponse.status === 'healthy' ? 200 : 
                      healthResponse.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResponse, { status: httpStatus });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    devLog('error', 'HealthCheck', 'Health check failed', { 
      error: error instanceof Error ? error.message : String(error),
      responseTime
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime
    }, { status: 503 });
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }

    // Check response time thresholds
    let status: HealthStatus = 'healthy';
    if (responseTime > 5000) {
      status = 'unhealthy';
    } else if (responseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        connectionPool: 'active',
        queryCount: data?.length || 0
      }
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Check AI service health
 */
async function checkAIServiceHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Test Gemini API connectivity with a simple request
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': process.env.GEMINI_API_KEY || ''
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `AI service returned ${response.status}: ${response.statusText}`
      };
    }

    // Check response time thresholds
    let status: HealthStatus = 'healthy';
    if (responseTime > 10000) {
      status = 'unhealthy';
    } else if (responseTime > 5000) {
      status = 'degraded';
    }

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        provider: 'Google Gemini',
        modelsAvailable: true
      }
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'AI service connection failed'
    };
  }
}

/**
 * Check external APIs health
 */
async function checkExternalAPIsHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      // Check Vercel deployment status
      fetch('https://api.vercel.com/v1/user', {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`
        }
      }).catch(() => ({ ok: false, status: 0 })),
      
      // Check any other external services
      // Add more external service checks here
    ]);

    const responseTime = Date.now() - startTime;
    const failedChecks = checks.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.ok)
    ).length;

    let status: HealthStatus = 'healthy';
    if (failedChecks === checks.length) {
      status = 'unhealthy';
    } else if (failedChecks > 0) {
      status = 'degraded';
    }

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        totalChecks: checks.length,
        failedChecks,
        successRate: ((checks.length - failedChecks) / checks.length * 100).toFixed(1) + '%'
      }
    };

  } catch (error) {
    return {
      status: 'unknown',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'External API check failed'
    };
  }
}

/**
 * Check monitoring system health
 */
function checkMonitoringHealth(): ComponentHealth {
  try {
    const performanceStats = performanceMonitor.getPerformanceSummary();
    const alertStats = alertManager.getAlertStatistics();

    let status: HealthStatus = 'healthy';
    
    // Check if monitoring is enabled and functioning
    if (!performanceStats.isEnabled) {
      status = 'degraded';
    }
    
    // Check for excessive critical alerts
    if (alertStats.criticalAlerts > 5) {
      status = 'degraded';
    }

    return {
      status,
      lastCheck: new Date().toISOString(),
      details: {
        performanceMonitoring: performanceStats.isEnabled,
        totalMetrics: performanceStats.totalMetrics,
        activeAlerts: alertStats.activeAlerts,
        criticalAlerts: alertStats.criticalAlerts
      }
    };

  } catch (error) {
    return {
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Monitoring check failed'
    };
  }
}

/**
 * Check security system health
 */
function checkSecurityHealth(): ComponentHealth {
  try {
    const securityStats = securityMonitor.getSecurityStatistics();

    let status: HealthStatus = 'healthy';
    
    // Check for excessive blocked IPs (might indicate attack)
    if (securityStats.blockedIPs > 100) {
      status = 'degraded';
    }
    
    // Check for excessive locked users
    if (securityStats.lockedUsers > 50) {
      status = 'degraded';
    }

    return {
      status,
      lastCheck: new Date().toISOString(),
      details: {
        totalSecurityEvents: securityStats.totalEvents,
        blockedIPs: securityStats.blockedIPs,
        lockedUsers: securityStats.lockedUsers,
        recentEventsCount: securityStats.recentEvents.length
      }
    };

  } catch (error) {
    return {
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Security check failed'
    };
  }
}

/**
 * Get system metrics
 */
async function getSystemMetrics(): Promise<{
  activeAlerts: number;
  errorRate: number;
  avgResponseTime: number;
  totalRequests: number;
}> {
  try {
    const alertStats = alertManager.getAlertStatistics();
    
    // Get recent metrics from database
    const supabase = createClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentMetrics } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false });

    const apiMetrics = recentMetrics?.filter(m => m.type === 'api') || [];
    const errorMetrics = recentMetrics?.filter(m => m.type === 'errors') || [];
    
    const totalRequests = apiMetrics.length;
    const errorCount = errorMetrics.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    
    const responseTimes = apiMetrics
      .filter(m => m.name === 'response_time')
      .map(m => parseFloat(m.value) || 0);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      activeAlerts: alertStats.activeAlerts,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      totalRequests
    };

  } catch (error) {
    devLog('error', 'HealthCheck', 'Failed to get system metrics', { error });
    
    return {
      activeAlerts: 0,
      errorRate: 0,
      avgResponseTime: 0,
      totalRequests: 0
    };
  }
}