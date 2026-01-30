/**
 * @fileoverview Alert System Interfaces
 * 
 * Core interfaces and types for the alert management system.
 * Defines the structure for alerts, rules, incidents, and notifications.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
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
 * Metric history entry
 */
export interface MetricHistoryEntry {
  value: number;
  timestamp: number;
}

/**
 * Alert statistics interface
 */
export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  alertsByCategory: Record<AlertCategory, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
}

/**
 * Alert manager configuration
 */
export interface AlertManagerConfig {
  enabled: boolean;
  maxEventsInMemory: number;
  cleanupInterval: number;
  defaultCooldownPeriod: number;
  defaultEscalationDelay: number;
}

/**
 * Notification context for templating
 */
export interface NotificationContext {
  alert: Alert;
  incident?: Incident;
  service: string;
  environment: string;
  timestamp: number;
}

/**
 * Alert evaluation context
 */
export interface AlertEvaluationContext {
  metric: string;
  value: number | string;
  timestamp: number;
  history: MetricHistoryEntry[];
  rule: AlertRule;
}

/**
 * Escalation configuration
 */
export interface EscalationConfig {
  enabled: boolean;
  delay: number;
  channels: NotificationChannel[];
  autoAssign?: string;
}