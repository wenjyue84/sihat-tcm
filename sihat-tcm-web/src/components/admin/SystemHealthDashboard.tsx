"use client";

/**
 * @fileoverview System Health Dashboard Component
 *
 * Comprehensive admin dashboard for monitoring system health, errors,
 * and performance metrics in real-time.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  MemoryStick,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Users,
  XCircle,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  SystemHealthDashboardData,
  SystemError,
  ErrorSeverity,
} from "@/types/monitoring";
import { formatDistanceToNow } from "date-fns";

/**
 * Status indicator component
 */
const StatusIndicator: React.FC<{
  status: "healthy" | "degraded" | "unhealthy";
  size?: "sm" | "md" | "lg";
}> = ({ status, size = "md" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const statusConfig = {
    healthy: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
    degraded: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-100" },
    unhealthy: { icon: XCircle, color: "text-red-500", bg: "bg-red-100" },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bg}`}>
      <Icon className={`${sizeClasses[size]} ${config.color}`} />
      <span className={`text-sm font-medium capitalize ${config.color}`}>
        {status}
      </span>
    </div>
  );
};

/**
 * Error severity badge component
 */
const SeverityBadge: React.FC<{ severity: ErrorSeverity }> = ({ severity }) => {
  const severityConfig = {
    low: { color: "bg-blue-100 text-blue-800", label: "Low" },
    medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
    high: { color: "bg-orange-100 text-orange-800", label: "High" },
    critical: { color: "bg-red-100 text-red-800", label: "Critical" },
  };

  const config = severityConfig[severity];

  return (
    <Badge className={`${config.color} text-xs`}>
      {config.label}
    </Badge>
  );
};

/**
 * Metric card component
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "healthy" | "degraded" | "unhealthy";
}> = ({ title, value, icon: Icon, trend, status }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold">{value}</p>
              {status && <StatusIndicator status={status} size="sm" />}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp
                  className={`w-3 h-3 ${
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={`text-xs ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-muted rounded-full">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Error list component
 */
const ErrorList: React.FC<{
  errors: SystemError[];
  showResolved?: boolean;
  onToggleResolved?: (errorId: string) => void;
}> = ({ errors, showResolved = false, onToggleResolved }) => {
  const [showStackTrace, setShowStackTrace] = useState<Record<string, boolean>>({});

  const toggleStackTrace = (errorId: string) => {
    setShowStackTrace(prev => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  const filteredErrors = showResolved 
    ? errors 
    : errors.filter(error => !error.resolved);

  if (filteredErrors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p>No {showResolved ? "" : "unresolved "}errors found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredErrors.map((error) => (
        <Card key={error.id} className={error.resolved ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <SeverityBadge severity={error.severity} />
                  <Badge variant="outline" className="text-xs">
                    {error.error_type}
                  </Badge>
                  {error.component && (
                    <Badge variant="secondary" className="text-xs">
                      {error.component}
                    </Badge>
                  )}
                  {error.resolved && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Resolved
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {error.message}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                  </span>
                  {error.user_id && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      User: {error.user_id.slice(0, 8)}...
                    </span>
                  )}
                  {error.url && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {new URL(error.url).pathname}
                    </span>
                  )}
                </div>

                {error.stack_trace && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStackTrace(error.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {showStackTrace[error.id] ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hide Stack Trace
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Show Stack Trace
                        </>
                      )}
                    </Button>
                    
                    {showStackTrace[error.id] && (
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                        {error.stack_trace}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {onToggleResolved && (
                  <Button
                    variant={error.resolved ? "secondary" : "default"}
                    size="sm"
                    onClick={() => onToggleResolved(error.id)}
                    className="text-xs"
                  >
                    {error.resolved ? "Mark Unresolved" : "Mark Resolved"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Main System Health Dashboard component
 */
export const SystemHealthDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<SystemHealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showResolvedErrors, setShowResolvedErrors] = useState(false);

  /**
   * Fetch dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/system-health");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Toggle error resolved status
   */
  const toggleErrorResolved = async (errorId: string) => {
    // This would implement the error resolution API call
    console.log("Toggle resolved status for error:", errorId);
    // For now, just refresh the data
    await fetchDashboardData();
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    fetchDashboardData();
  };

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading system health data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { error_statistics, health_metrics, recent_errors, system_info } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance, errors, and health metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <StatusIndicator status={dashboardData.overall_status} size="lg" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "text-green-500" : ""}`} />
              Auto Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Errors (24h)"
          value={error_statistics.total_errors}
          icon={AlertTriangle}
          status={error_statistics.total_errors === 0 ? "healthy" : 
                  error_statistics.total_errors < 10 ? "degraded" : "unhealthy"}
        />
        
        <MetricCard
          title="Critical Errors"
          value={error_statistics.critical_errors}
          icon={XCircle}
          status={error_statistics.critical_errors === 0 ? "healthy" : "unhealthy"}
        />
        
        <MetricCard
          title="Database Response"
          value={`${health_metrics.database.response_time}ms`}
          icon={Database}
          status={health_metrics.database.status}
        />
        
        <MetricCard
          title="Memory Usage"
          value={`${health_metrics.memory.usage_percentage}%`}
          icon={MemoryStick}
          status={health_metrics.memory.usage_percentage < 75 ? "healthy" : 
                  health_metrics.memory.usage_percentage < 90 ? "degraded" : "unhealthy"}
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="errors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="errors">Error Monitoring</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        {/* Error Monitoring Tab */}
        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Error Statistics */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Error Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Critical</span>
                  <Badge className="bg-red-100 text-red-800">
                    {error_statistics.critical_errors}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {error_statistics.high_errors}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medium</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {error_statistics.medium_errors}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {error_statistics.low_errors}
                  </Badge>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Resolved</span>
                  <Badge className="bg-green-100 text-green-800">
                    {error_statistics.resolved_errors}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Errors */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Errors</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResolvedErrors(!showResolvedErrors)}
                  >
                    {showResolvedErrors ? "Hide Resolved" : "Show Resolved"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ErrorList
                  errors={recent_errors}
                  showResolved={showResolvedErrors}
                  onToggleResolved={toggleErrorResolved}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusIndicator status={health_metrics.database.status} />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{health_metrics.database.response_time}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Queries (24h)</span>
                    <span>{health_metrics.database.query_count_24h}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  API Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusIndicator status={health_metrics.api.status} />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Response</span>
                    <span>{health_metrics.api.avg_response_time}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Requests (24h)</span>
                    <span>{health_metrics.api.total_requests_24h}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{health_metrics.memory.usage_percentage}%</span>
                  </div>
                  <Progress value={health_metrics.memory.usage_percentage} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{health_metrics.memory.used_mb} MB used</span>
                    <span>{health_metrics.memory.total_mb} MB total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Performance metrics will be displayed here once data is available.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Application</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Version</span>
                      <span>{system_info.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environment</span>
                      <span className="capitalize">{system_info.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span>{Math.round(system_info.uptime / 3600)}h</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Runtime</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Node.js</span>
                      <span>{system_info.node_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap Used</span>
                      <span>{Math.round(system_info.memory_usage.heapUsed / 1024 / 1024)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap Total</span>
                      <span>{Math.round(system_info.memory_usage.heapTotal / 1024 / 1024)} MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};