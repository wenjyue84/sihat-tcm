/**
 * @fileoverview Alert Management System
 *
 * Comprehensive alerting system for Sihat TCM platform.
 * Handles incident detection, escalation, and notification management.
 *
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { devLog } from "@/lib/systemLogger";

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
 * Alert Manager class
 */
export class AlertManager {
  private static instance: AlertManager;
  private alerts: Map<string, Alert> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private metricHistory: Map<string, Array<{ value: number; timestamp: number }>> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.ENABLE_ALERTING === "true";

    if (this.isEnabled) {
      this.initializeDefaultRules();
      this.startPeriodicChecks();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "high_api_response_time",
        name: "High API Response Time",
        description: "API response time exceeds acceptable threshold",
        category: "api_performance",
        severity: "warning",
        condition: {
          metric: "api_response_time",
          operator: "gt",
          threshold: 5000,
          timeWindow: 300000, // 5 minutes
          consecutiveFailures: 3,
        },
        enabled: true,
        cooldownPeriod: 600000, // 10 minutes
        escalationDelay: 1800000, // 30 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#alerts" },
            enabled: true,
          },
        ],
      },
      {
        id: "critical_api_response_time",
        name: "Critical API Response Time",
        description: "API response time is critically high",
        category: "api_performance",
        severity: "critical",
        condition: {
          metric: "api_response_time",
          operator: "gt",
          threshold: 15000,
          timeWindow: 180000, // 3 minutes
          consecutiveFailures: 2,
        },
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
        escalationDelay: 900000, // 15 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#critical-alerts" },
            enabled: true,
          },
          {
            type: "email",
            config: { recipients: ["oncall@sihat-tcm.com"] },
            enabled: true,
          },
        ],
      },
      {
        id: "high_error_rate",
        name: "High Error Rate",
        description: "API error rate exceeds acceptable threshold",
        category: "system_health",
        severity: "error",
        condition: {
          metric: "error_rate",
          operator: "gt",
          threshold: 5, // 5%
          timeWindow: 300000, // 5 minutes
          consecutiveFailures: 2,
        },
        enabled: true,
        cooldownPeriod: 600000, // 10 minutes
        escalationDelay: 1200000, // 20 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#alerts" },
            enabled: true,
          },
        ],
      },
      {
        id: "database_connection_failure",
        name: "Database Connection Failure",
        description: "Unable to connect to database",
        category: "database",
        severity: "critical",
        condition: {
          metric: "database_health",
          operator: "contains",
          threshold: "unhealthy",
          timeWindow: 60000, // 1 minute
          consecutiveFailures: 1,
        },
        enabled: true,
        cooldownPeriod: 180000, // 3 minutes
        escalationDelay: 300000, // 5 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#critical-alerts" },
            enabled: true,
          },
          {
            type: "email",
            config: { recipients: ["oncall@sihat-tcm.com", "dba@sihat-tcm.com"] },
            enabled: true,
          },
        ],
      },
      {
        id: "ai_service_failure",
        name: "AI Service Failure",
        description: "Gemini AI service is failing",
        category: "ai_service",
        severity: "error",
        condition: {
          metric: "ai_success_rate",
          operator: "lt",
          threshold: 90, // 90%
          timeWindow: 600000, // 10 minutes
          consecutiveFailures: 2,
        },
        enabled: true,
        cooldownPeriod: 900000, // 15 minutes
        escalationDelay: 1800000, // 30 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#ai-alerts" },
            enabled: true,
          },
        ],
      },
      {
        id: "security_breach_attempt",
        name: "Security Breach Attempt",
        description: "Potential security breach detected",
        category: "security",
        severity: "critical",
        condition: {
          metric: "failed_login_attempts",
          operator: "gt",
          threshold: 10,
          timeWindow: 300000, // 5 minutes
          consecutiveFailures: 1,
        },
        enabled: true,
        cooldownPeriod: 600000, // 10 minutes
        escalationDelay: 300000, // 5 minutes
        notificationChannels: [
          {
            type: "slack",
            config: { channel: "#security-alerts" },
            enabled: true,
          },
          {
            type: "email",
            config: { recipients: ["security@sihat-tcm.com", "oncall@sihat-tcm.com"] },
            enabled: true,
          },
        ],
      },
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });

    devLog("info", "AlertManager", `Initialized ${defaultRules.length} default alert rules`);
  }

  /**
   * Record metric value
   */
  public recordMetric(metric: string, value: number): void {
    if (!this.isEnabled) return;

    const timestamp = Date.now();

    if (!this.metricHistory.has(metric)) {
      this.metricHistory.set(metric, []);
    }

    const history = this.metricHistory.get(metric)!;
    history.push({ value, timestamp });

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Check alert rules for this metric
    this.checkAlertRules(metric, value, timestamp);
  }

  /**
   * Check alert rules for a metric
   */
  private checkAlertRules(metric: string, value: number, timestamp: number): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.condition.metric !== metric) {
        continue;
      }

      // Check cooldown period
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert && timestamp - lastAlert < rule.cooldownPeriod) {
        continue;
      }

      if (this.evaluateCondition(rule.condition, metric, value, timestamp)) {
        this.triggerAlert(rule, value, timestamp);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    condition: AlertCondition,
    metric: string,
    value: number,
    timestamp: number
  ): boolean {
    const history = this.metricHistory.get(metric);
    if (!history) return false;

    // Get values within time window
    const windowStart = timestamp - condition.timeWindow;
    const windowValues = history.filter((entry) => entry.timestamp >= windowStart);

    if (windowValues.length === 0) return false;

    // Check if condition is met
    let conditionMet = false;

    switch (condition.operator) {
      case "gt":
        conditionMet = value > (condition.threshold as number);
        break;
      case "lt":
        conditionMet = value < (condition.threshold as number);
        break;
      case "gte":
        conditionMet = value >= (condition.threshold as number);
        break;
      case "lte":
        conditionMet = value <= (condition.threshold as number);
        break;
      case "eq":
        conditionMet = value === (condition.threshold as number);
        break;
      case "contains":
        conditionMet = String(value).includes(String(condition.threshold));
        break;
      case "not_contains":
        conditionMet = !String(value).includes(String(condition.threshold));
        break;
    }

    if (!conditionMet) return false;

    // Check consecutive failures if specified
    if (condition.consecutiveFailures && condition.consecutiveFailures > 1) {
      const recentValues = windowValues.slice(-condition.consecutiveFailures);
      if (recentValues.length < condition.consecutiveFailures) return false;

      return recentValues.every((entry) => {
        switch (condition.operator) {
          case "gt":
            return entry.value > (condition.threshold as number);
          case "lt":
            return entry.value < (condition.threshold as number);
          case "gte":
            return entry.value >= (condition.threshold as number);
          case "lte":
            return entry.value <= (condition.threshold as number);
          case "eq":
            return entry.value === (condition.threshold as number);
          case "contains":
            return String(entry.value).includes(String(condition.threshold));
          case "not_contains":
            return !String(entry.value).includes(String(condition.threshold));
          default:
            return false;
        }
      });
    }

    return true;
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule, value: number, timestamp: number): Promise<void> {
    const alertId = `${rule.id}_${timestamp}`;

    const alert: Alert = {
      id: alertId,
      title: rule.name,
      description: `${rule.description}. Current value: ${value}, Threshold: ${rule.condition.threshold}`,
      severity: rule.severity,
      category: rule.category,
      source: "AlertManager",
      timestamp,
      metadata: {
        ruleId: rule.id,
        metric: rule.condition.metric,
        value,
        threshold: rule.condition.threshold,
        operator: rule.condition.operator,
      },
    };

    this.alerts.set(alertId, alert);
    this.lastAlertTime.set(rule.id, timestamp);

    devLog("warn", "AlertManager", `Alert triggered: ${rule.name}`, {
      alertId,
      severity: rule.severity,
      value,
      threshold: rule.condition.threshold,
    });

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);

    // Create or update incident if severity is error or critical
    if (rule.severity === "error" || rule.severity === "critical") {
      await this.createOrUpdateIncident(alert);
    }

    // Schedule escalation if configured
    if (rule.escalationDelay > 0) {
      setTimeout(() => {
        this.escalateAlert(alertId);
      }, rule.escalationDelay);
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    const promises = channels
      .filter((channel) => channel.enabled)
      .map((channel) => this.sendNotification(alert, channel));

    await Promise.allSettled(promises);
  }

  /**
   * Send individual notification
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    try {
      switch (channel.type) {
        case "slack":
          await this.sendSlackNotification(alert, channel.config);
          break;
        case "email":
          await this.sendEmailNotification(alert, channel.config);
          break;
        case "webhook":
          await this.sendWebhookNotification(alert, channel.config);
          break;
        case "pagerduty":
          await this.sendPagerDutyNotification(alert, channel.config);
          break;
        default:
          devLog("warn", "AlertManager", `Unsupported notification channel: ${channel.type}`);
      }
    } catch (error) {
      devLog("error", "AlertManager", `Failed to send ${channel.type} notification`, { error });
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, config: any): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: config.channel || "#alerts",
        text: `${emoji} Alert: ${alert.title}`,
        attachments: [
          {
            color,
            fields: [
              {
                title: "Severity",
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: "Category",
                value: alert.category,
                short: true,
              },
              {
                title: "Description",
                value: alert.description,
                short: false,
              },
              {
                title: "Timestamp",
                value: new Date(alert.timestamp).toISOString(),
                short: true,
              },
              {
                title: "Alert ID",
                value: alert.id,
                short: true,
              },
            ],
          },
        ],
      }),
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, config: any): Promise<void> {
    await fetch("/api/monitoring/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: config.recipients,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: this.generateEmailTemplate(alert),
      }),
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, config: any): Promise<void> {
    await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alert,
        timestamp: Date.now(),
        service: "sihat-tcm",
      }),
    });
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert, config: any): Promise<void> {
    await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routing_key: config.integrationKey,
        event_action: "trigger",
        dedup_key: alert.id,
        payload: {
          summary: alert.title,
          severity: alert.severity,
          source: "sihat-tcm",
          component: alert.category,
          custom_details: alert.metadata,
        },
      }),
    });
  }

  /**
   * Create or update incident
   */
  private async createOrUpdateIncident(alert: Alert): Promise<void> {
    // Look for existing open incident with same category
    const existingIncident = Array.from(this.incidents.values()).find(
      (incident) =>
        incident.status === "open" && incident.alerts.some((a) => a.category === alert.category)
    );

    if (existingIncident) {
      // Add alert to existing incident
      existingIncident.alerts.push(alert);
      existingIncident.updatedAt = Date.now();
      existingIncident.timeline.push({
        timestamp: Date.now(),
        action: "alert_added",
        description: `Added alert: ${alert.title}`,
        metadata: { alertId: alert.id },
      });

      // Escalate severity if needed
      if (
        this.getSeverityLevel(alert.severity) > this.getSeverityLevel(existingIncident.severity)
      ) {
        existingIncident.severity = alert.severity;
        existingIncident.timeline.push({
          timestamp: Date.now(),
          action: "severity_escalated",
          description: `Incident severity escalated to ${alert.severity}`,
          metadata: { previousSeverity: existingIncident.severity, newSeverity: alert.severity },
        });
      }
    } else {
      // Create new incident
      const incidentId = `incident_${Date.now()}`;
      const incident: Incident = {
        id: incidentId,
        title: `${alert.category} - ${alert.title}`,
        description: alert.description,
        severity: alert.severity,
        status: "open",
        alerts: [alert],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timeline: [
          {
            timestamp: Date.now(),
            action: "incident_created",
            description: `Incident created from alert: ${alert.title}`,
            metadata: { alertId: alert.id },
          },
        ],
      };

      this.incidents.set(incidentId, incident);

      devLog("warn", "AlertManager", `New incident created: ${incidentId}`, {
        severity: incident.severity,
        category: alert.category,
      });
    }
  }

  /**
   * Escalate alert
   */
  private async escalateAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved || alert.escalated) return;

    alert.escalated = true;
    alert.escalatedAt = Date.now();

    devLog("warn", "AlertManager", `Alert escalated: ${alertId}`);

    // Send escalation notifications (e.g., to management)
    if (process.env.ESCALATION_WEBHOOK) {
      await fetch(process.env.ESCALATION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "alert_escalation",
          alert,
          timestamp: Date.now(),
        }),
      });
    }
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    alert.resolvedBy = resolvedBy;

    devLog("info", "AlertManager", `Alert resolved: ${alertId}`, { resolvedBy });

    return true;
  }

  /**
   * Get severity level for comparison
   */
  private getSeverityLevel(severity: AlertSeverity): number {
    switch (severity) {
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "critical":
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Get severity color for notifications
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case "info":
        return "#36a64f";
      case "warning":
        return "#ffcc00";
      case "error":
        return "#ff6600";
      case "critical":
        return "#ff0000";
      default:
        return "#cccccc";
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "critical":
        return "🚨";
      default:
        return "📢";
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(alert: Alert): string {
    return `
      <h2>Alert: ${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Category:</strong> ${alert.category}</p>
      <p><strong>Description:</strong> ${alert.description}</p>
      <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toISOString()}</p>
      <p><strong>Alert ID:</strong> ${alert.id}</p>
      ${alert.metadata ? `<p><strong>Metadata:</strong> ${JSON.stringify(alert.metadata, null, 2)}</p>` : ""}
      <hr>
      <p><em>This alert was generated by Sihat TCM monitoring system.</em></p>
    `;
  }

  /**
   * Start periodic checks
   */
  private startPeriodicChecks(): void {
    // Check for stale alerts every 5 minutes
    setInterval(() => {
      this.checkStaleAlerts();
    }, 300000);

    // Health check every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);
  }

  /**
   * Check for stale alerts
   */
  private checkStaleAlerts(): void {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [alertId, alert] of this.alerts.entries()) {
      if (!alert.resolved && now - alert.timestamp > staleThreshold) {
        devLog("warn", "AlertManager", `Stale alert detected: ${alertId}`);
        // Auto-resolve stale alerts
        this.resolveAlert(alertId, "system_auto_resolve");
      }
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check API health
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();

      if (healthData.database !== "healthy") {
        this.recordMetric("database_health", 0);
      } else {
        this.recordMetric("database_health", 1);
      }

      // Record API response time
      const startTime = Date.now();
      await fetch("/api/health");
      const responseTime = Date.now() - startTime;
      this.recordMetric("api_response_time", responseTime);
    } catch (error) {
      devLog("error", "AlertManager", "Health check failed", { error });
      this.recordMetric("api_response_time", 30000); // Timeout value
      this.recordMetric("database_health", 0);
    }
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get open incidents
   */
  public getOpenIncidents(): Incident[] {
    return Array.from(this.incidents.values()).filter((incident) => incident.status === "open");
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    criticalAlerts: number;
    openIncidents: number;
  } {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter((alert) => !alert.resolved);
    const resolvedAlerts = allAlerts.filter((alert) => alert.resolved);
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical");
    const openIncidents = Array.from(this.incidents.values()).filter(
      (incident) => incident.status === "open"
    );

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      criticalAlerts: criticalAlerts.length,
      openIncidents: openIncidents.length,
    };
  }
}

/**
 * Global alert manager instance
 */
export const alertManager = AlertManager.getInstance();
