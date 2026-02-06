"use client";

import {
  Activity,
  AlertTriangle,
  Database,
  MemoryStick,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { useSystemHealth } from "./hooks";
import { StatusIndicator, MetricCard, ErrorList } from "./components";
import { ERROR_THRESHOLDS } from "./constants";

export function SystemHealthDashboard() {
  const {
    dashboardData,
    loading,
    error,
    refreshing,
    autoRefresh,
    showResolvedErrors,
    handleRefresh,
    toggleAutoRefresh,
    toggleShowResolvedErrors,
    toggleErrorResolved,
  } = useSystemHealth();

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
            <Button variant="outline" size="sm" onClick={toggleAutoRefresh}>
              <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "text-green-500" : ""}`} />
              Auto Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
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
          status={
            error_statistics.total_errors === 0
              ? "healthy"
              : error_statistics.total_errors < ERROR_THRESHOLDS.LOW
                ? "degraded"
                : "unhealthy"
          }
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
          status={
            health_metrics.memory.usage_percentage < ERROR_THRESHOLDS.MEMORY_WARNING
              ? "healthy"
              : health_metrics.memory.usage_percentage < ERROR_THRESHOLDS.MEMORY_CRITICAL
                ? "degraded"
                : "unhealthy"
          }
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
                  <Badge className="bg-blue-100 text-blue-800">{error_statistics.low_errors}</Badge>
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Errors</CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleShowResolvedErrors}>
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
}
