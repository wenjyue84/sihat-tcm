/**
 * @fileoverview Deployment Status API
 * 
 * Provides real-time deployment status information, health metrics,
 * and deployment history for monitoring dashboards.
 * 
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/systemLogger';
import { createClient } from '@/lib/supabase/server';
import { performanceMonitor } from '@/lib/monitoring/performanceMonitor';

/**
 * Deployment status information
 */
interface DeploymentStatus {
  environment: string;
  version: string;
  commit: string;
  deployedAt: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'deploying' | 'maintenance';
  uptime: number;
  health: {
    overall: string;
    components: Record<string, any>;
    lastCheck: string;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
  deployment: {
    strategy: string;
    duration?: number;
    rollbackAvailable: boolean;
    lastRollback?: string;
  };
}

/**
 * GET /api/deployment/status
 * 
 * Get current deployment status and health information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || process.env.NODE_ENV || 'development';
    
    devLog('info', 'DeploymentStatus', `Getting deployment status for ${environment}`);

    // Get basic deployment information
    const deploymentInfo = await getDeploymentInfo(environment);
    
    // Get health status
    const healthStatus = await getHealthStatus();
    
    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics();
    
    // Get deployment history
    const deploymentHistory = await getDeploymentHistory(environment);

    const status: DeploymentStatus = {
      environment,
      version: process.env.npm_package_version || '3.0.0',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
      deployedAt: deploymentInfo.deployedAt,
      status: determineOverallStatus(healthStatus, performanceMetrics),
      uptime: process.uptime(),
      health: healthStatus,
      metrics: performanceMetrics,
      deployment: {
        strategy: 'immediate',
        duration: deploymentInfo.duration,
        rollbackAvailable: deploymentHistory.length > 1,
        lastRollback: deploymentHistory.find(d => d.type === 'rollback')?.timestamp
      }
    };

    return NextResponse.json({
      success: true,
      status,
      history: deploymentHistory.slice(0, 10), // Last 10 deployments
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('error', 'DeploymentStatus', 'Failed to get deployment status', { error });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get deployment status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/deployment/status
 * 
 * Update deployment status (for CI/CD pipeline)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      environment, 
      version, 
      commit, 
      status, 
      type = 'deployment',
      metadata = {} 
    } = body;

    if (!environment || !version || !commit) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: environment, version, commit'
      }, { status: 400 });
    }

    devLog('info', 'DeploymentStatus', `Recording deployment status update`, {
      environment,
      version,
      commit,
      status,
      type
    });

    // Store deployment record
    const supabase = createClient();
    
    const { error } = await supabase
      .from('deployment_history')
      .insert({
        environment,
        version,
        commit_sha: commit,
        status,
        type,
        metadata,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      devLog('error', 'DeploymentStatus', 'Failed to store deployment record', { error });
      return NextResponse.json({
        success: false,
        error: 'Failed to store deployment record'
      }, { status: 500 });
    }

    // Send notifications for important status changes
    if (status === 'success' || status === 'failure' || type === 'rollback') {
      await sendDeploymentNotification({
        environment,
        version,
        commit,
        status,
        type,
        metadata
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment status updated',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('error', 'DeploymentStatus', 'Failed to update deployment status', { error });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update deployment status'
    }, { status: 500 });
  }
}

/**
 * Get deployment information
 */
async function getDeploymentInfo(environment: string): Promise<{
  deployedAt: string;
  duration?: number;
}> {
  try {
    const supabase = createClient();
    
    const { data: latestDeployment } = await supabase
      .from('deployment_history')
      .select('*')
      .eq('environment', environment)
      .eq('status', 'success')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (latestDeployment) {
      return {
        deployedAt: latestDeployment.timestamp,
        duration: latestDeployment.metadata?.duration
      };
    }

    // Fallback to process start time
    const startTime = new Date(Date.now() - process.uptime() * 1000);
    return {
      deployedAt: startTime.toISOString()
    };

  } catch (error) {
    devLog('warn', 'DeploymentStatus', 'Could not get deployment info', { error });
    
    // Fallback to process start time
    const startTime = new Date(Date.now() - process.uptime() * 1000);
    return {
      deployedAt: startTime.toISOString()
    };
  }
}

/**
 * Get health status
 */
async function getHealthStatus(): Promise<{
  overall: string;
  components: Record<string, any>;
  lastCheck: string;
}> {
  try {
    // Make internal health check request
    const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'}/api/monitoring/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Internal-Health-Check'
      }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      return {
        overall: healthData.status,
        components: healthData.components,
        lastCheck: healthData.timestamp
      };
    }

    return {
      overall: 'unknown',
      components: {},
      lastCheck: new Date().toISOString()
    };

  } catch (error) {
    devLog('warn', 'DeploymentStatus', 'Health check failed', { error });
    
    return {
      overall: 'unknown',
      components: {},
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(): Promise<{
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
}> {
  try {
    const supabase = createClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Get recent metrics
    const { data: metrics } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false });

    if (!metrics || metrics.length === 0) {
      return {
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        availability: 100
      };
    }

    // Calculate metrics
    const apiMetrics = metrics.filter(m => m.type === 'api');
    const errorMetrics = metrics.filter(m => m.type === 'errors');
    
    const responseTimes = apiMetrics
      .filter(m => m.name === 'response_time')
      .map(m => parseFloat(m.value) || 0);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const totalRequests = apiMetrics.length;
    const errorCount = errorMetrics.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    
    const throughput = totalRequests; // Requests per hour
    const availability = totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 100;

    return {
      responseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      throughput,
      availability: Math.round(availability * 100) / 100
    };

  } catch (error) {
    devLog('warn', 'DeploymentStatus', 'Could not get performance metrics', { error });
    
    return {
      responseTime: 0,
      errorRate: 0,
      throughput: 0,
      availability: 100
    };
  }
}

/**
 * Get deployment history
 */
async function getDeploymentHistory(environment: string): Promise<Array<{
  timestamp: string;
  version: string;
  commit: string;
  status: string;
  type: string;
  duration?: number;
}>> {
  try {
    const supabase = createClient();
    
    const { data: history } = await supabase
      .from('deployment_history')
      .select('*')
      .eq('environment', environment)
      .order('timestamp', { ascending: false })
      .limit(20);

    return (history || []).map(record => ({
      timestamp: record.timestamp,
      version: record.version,
      commit: record.commit_sha,
      status: record.status,
      type: record.type,
      duration: record.metadata?.duration
    }));

  } catch (error) {
    devLog('warn', 'DeploymentStatus', 'Could not get deployment history', { error });
    return [];
  }
}

/**
 * Determine overall status based on health and performance
 */
function determineOverallStatus(
  health: { overall: string },
  metrics: { errorRate: number; responseTime: number; availability: number }
): 'healthy' | 'degraded' | 'unhealthy' | 'deploying' | 'maintenance' {
  
  // Check for maintenance mode
  if (process.env.MAINTENANCE_MODE === 'true') {
    return 'maintenance';
  }

  // Check health status first
  if (health.overall === 'unhealthy') {
    return 'unhealthy';
  }

  // Check performance metrics
  if (metrics.errorRate > 5 || metrics.availability < 95) {
    return 'unhealthy';
  }

  if (metrics.errorRate > 1 || metrics.responseTime > 5000 || metrics.availability < 99) {
    return 'degraded';
  }

  if (health.overall === 'degraded') {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Send deployment notification
 */
async function sendDeploymentNotification(deploymentInfo: {
  environment: string;
  version: string;
  commit: string;
  status: string;
  type: string;
  metadata: any;
}): Promise<void> {
  try {
    const { environment, version, commit, status, type, metadata } = deploymentInfo;
    
    // Determine notification severity and emoji
    let emoji = '📦';
    let color = 'good';
    
    if (type === 'rollback') {
      emoji = '🔄';
      color = 'warning';
    } else if (status === 'failure') {
      emoji = '❌';
      color = 'danger';
    } else if (status === 'success') {
      emoji = '✅';
      color = 'good';
    }

    // Send Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `${emoji} Deployment ${type} ${status}`,
          attachments: [{
            color,
            fields: [
              {
                title: 'Environment',
                value: environment,
                short: true
              },
              {
                title: 'Version',
                value: version,
                short: true
              },
              {
                title: 'Commit',
                value: commit.substring(0, 8),
                short: true
              },
              {
                title: 'Status',
                value: status,
                short: true
              },
              {
                title: 'Type',
                value: type,
                short: true
              },
              {
                title: 'Duration',
                value: metadata.duration ? `${metadata.duration}ms` : 'N/A',
                short: true
              }
            ]
          }]
        })
      });
    }

    // Send to monitoring webhook
    if (process.env.MONITORING_WEBHOOK) {
      await fetch(process.env.MONITORING_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'deployment_notification',
          ...deploymentInfo,
          timestamp: new Date().toISOString()
        })
      });
    }

  } catch (error) {
    devLog('error', 'DeploymentStatus', 'Failed to send deployment notification', { error });
  }
}