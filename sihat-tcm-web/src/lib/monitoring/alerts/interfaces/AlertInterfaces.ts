/**
 * Alert System Interfaces
 * 
 * Comprehensive type definitions for the Sihat TCM alert management system.
 */

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "error" | "critical";

/**
 * Alert categories
 */
export type AlertCategory =
  | "system_health"
  | "api_performance"
  | "database"
  | "ai_service"
  | "security"
  | "user_experience"
  | "business_metric";

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  source: string;
  timestamp: number;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  escalated?: boolean;
  escalatedAt?: number;
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: AlertCondition;
  enabled: boolean;
  cooldownPeriod: number; // milliseconds
  escalationDelay: number; // milliseconds
  notificationChannels: NotificationChannel[];
}

/**
 * Alert condition interface
 */
export interface AlertCondition {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "contains" | "not_contains";
  threshold: number | string;
  timeWindow: number; // milliseconds
  consecutiveFailures?: number;
}

/**
 * Notification channel interface
 */
export interface NotificationChannel {
  type: "slack" | "email" | "sms" | "webhook" | "pagerduty";
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Incident interface
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: "open" | "investigating" | "resolved" | "closed";
  alerts: Alert[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  timeline: IncidentTimelineEntry[];
}

/**
 * Incident timeline entry
 */
export interface IncidentTimelineEntry {
  timestamp: number;
  action: string;
  description: string;
  user?: string;
  metadata?: Record<string, any>;
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  value: number;
  timestamp: number;
}

/**
 * Alert statistics
 */
export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
}

/**
 * Manual alert data
 */
export interface ManualAlertData {
  type: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, any>;
}

/**
 * Alert evaluation context
 */
export interface AlertEvaluationContext {
  metric: string;
  value: number;
  timestamp: number;
  history: MetricDataPoint[];
}

/**
 * Notification context
 */
export interface NotificationContext {
  alert: Alert;
  channels: NotificationChannel[];
  escalated?: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  database: "healthy" | "unhealthy";
  api: "healthy" | "unhealthy";
  responseTime: number;
  timestamp: number;
}

/**
 * Alert manager configuration
 */
export interface AlertManagerConfig {
  enabled: boolean;
  healthCheckInterval: number;
  staleAlertThreshold: number;
  maxMetricHistory: number;
}

/**
 * Alert event types
 */
export type AlertEventType = 
  | "alert_triggered"
  | "alert_resolved"
  | "alert_escalated"
  | "incident_created"
  | "incident_updated"
  | "incident_resolved";

/**
 * Alert event
 */
export interface AlertEvent {
  type: AlertEventType;
  alertId?: string;
  incidentId?: string;
  data: any;
  timestamp: number;
}