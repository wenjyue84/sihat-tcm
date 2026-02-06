/**
 * Alert System Manager
 *
 * Main orchestrator that integrates all alert system components.
 * Provides a unified interface for the complete alert management system.
 */

import { AlertRuleEngine } from "./core/AlertRuleEngine";
import { MetricCollector } from "./core/MetricCollector";
import { NotificationDispatcher } from "./notifications/NotificationDispatcher";
import {
  Alert,
  AlertRule,
  AlertSeverity,
  AlertCategory,
  AlertManager as IAlertManager,
  AlertManagerConfig,
  AlertStatistics,
  ManualAlertData,
  NotificationChannel,
  HealthCheckResult,
  Incident,
  IncidentManager,
  IncidentTimelineEntry,
} from "./interfaces/AlertInterfaces";
import { devLog, logError } from "@/lib/systemLogger";
import { ErrorFactory } from "@/lib/errors/AppError";

/**
 * Incident Manager Implementation
 */
class IncidentManagerImpl implements IncidentManager {
  private incidents: Map<string, Incident> = new Map();
  private readonly context = "IncidentManager";

  async createIncident(alert: Alert): Promise<Incident> {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
          id: `timeline_${Date.now()}`,
          timestamp: Date.now(),
          action: "incident_created",
          description: `Incident created from alert: ${alert.title}`,
          metadata: { alertId: alert.id },
        },
      ],
    };

    this.incidents.set(incidentId, incident);
    devLog("warn", this.context, `New incident created: ${incidentId}`, {
      severity: incident.severity,
      category: alert.category,
    });

    return incident;
  }

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<boolean> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    Object.assign(incident, updates, { updatedAt: Date.now() });
    devLog("info", this.context, `Incident updated: ${incidentId}`);
    return true;
  }

  async resolveIncident(incidentId: string, resolvedBy?: string): Promise<boolean> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    incident.status = "resolved";
    incident.resolvedAt = Date.now();
    incident.updatedAt = Date.now();

    await this.addTimelineEntry(incidentId, {
      timestamp: Date.now(),
      action: "incident_resolved",
      description: "Incident resolved",
      user: resolvedBy,
    });

    devLog("info", this.context, `Incident resolved: ${incidentId}`, { resolvedBy });
    return true;
  }

  async addAlertToIncident(incidentId: string, alert: Alert): Promise<boolean> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    incident.alerts.push(alert);
    incident.updatedAt = Date.now();

    // Escalate severity if needed
    if (this.getSeverityLevel(alert.severity) > this.getSeverityLevel(incident.severity)) {
      const previousSeverity = incident.severity;
      incident.severity = alert.severity;

      await this.addTimelineEntry(incidentId, {
        timestamp: Date.now(),
        action: "severity_escalated",
        description: `Incident severity escalated to ${alert.severity}`,
        metadata: { previousSeverity, newSeverity: alert.severity },
      });
    }

    await this.addTimelineEntry(incidentId, {
      timestamp: Date.now(),
      action: "alert_added",
      description: `Added alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });

    return true;
  }

  async addTimelineEntry(
    incidentId: string,
    entry: Omit<IncidentTimelineEntry, "id">
  ): Promise<boolean> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    const timelineEntry: IncidentTimelineEntry = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
    };

    incident.timeline.push(timelineEntry);
    incident.updatedAt = Date.now();
    return true;
  }

  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  getOpenIncidents(): Incident[] {
    return Array.from(this.incidents.values()).filter((incident) => incident.status === "open");
  }

  getIncidentsByAlert(alertId: string): Incident[] {
    return Array.from(this.incidents.values()).filter((incident) =>
      incident.alerts.some((alert) => alert.id === alertId)
    );
  }

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
}

/**
 * Main Alert System Manager
 */
export class AlertSystemManager implements IAlertManager {
  private static instance: AlertSystemManager;

  private ruleEngine: AlertRuleEngine;
  private metricCollector: MetricCollector;
  private notificationDispatcher: NotificationDispatcher;
  private incidentManager: IncidentManager;

  private alerts: Map<string, Alert> = new Map();
  private config: AlertManagerConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly context = "AlertSystemManager";

  private constructor(config?: Partial<AlertManagerConfig>) {
    this.config = {
      enabled: true,
      defaultCooldownPeriod: 600000, // 10 minutes
      defaultEscalationDelay: 1800000, // 30 minutes
      maxAlertsPerRule: 100,
      metricRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      incidentRetentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      healthCheckInterval: 60000, // 1 minute
      staleAlertThreshold: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    this.metricCollector = new MetricCollector();
    this.ruleEngine = new AlertRuleEngine(this.metricCollector);
    this.notificationDispatcher = new NotificationDispatcher();
    this.incidentManager = new IncidentManagerImpl();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<AlertManagerConfig>): AlertSystemManager {
    if (!AlertSystemManager.instance) {
      AlertSystemManager.instance = new AlertSystemManager(config);
    }
    return AlertSystemManager.instance;
  }

  /**
   * Initialize the alert system
   */
  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      devLog("info", this.context, "Alert system disabled by configuration");
      return;
    }

    try {
      devLog("info", this.context, "Initializing alert system...");

      // Start health checks
      if (this.config.healthCheckInterval && this.config.healthCheckInterval > 0) {
        this.startHealthChecks();
      }

      // Start cleanup processes
      this.startCleanupProcesses();

      devLog("info", this.context, "Alert system initialized successfully");
    } catch (error) {
      logError(this.context, "Failed to initialize alert system", { error: String(error) });
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: "initialize",
      });
    }
  }

  /**
   * Record a metric value
   */
  public recordMetric(metric: string, value: number, labels?: Record<string, string>): void {
    if (!this.config.enabled) return;

    try {
      this.metricCollector.recordMetric(metric, value);

      // Evaluate alert rules for this metric
      const triggeredAlerts = this.ruleEngine.checkRulesForMetric(metric, value, Date.now());

      // Process triggered alerts
      for (const alert of triggeredAlerts) {
        this.alerts.set(alert.id, alert);

        // Send notifications
        const rule = this.ruleEngine.getRule(alert.metadata?.ruleId as string);
        if (rule) {
          this.notificationDispatcher.sendNotifications(alert, rule.notificationChannels);
        }

        // Create incident if severity is error or critical
        if (alert.severity === "error" || alert.severity === "critical") {
          this.createOrUpdateIncident(alert);
        }
      }
    } catch (error) {
      logError(this.context, "Failed to record metric", { error: String(error) });
    }
  }

  /**
   * Send a manual alert
   */
  public async sendAlert(alertData: ManualAlertData): Promise<Alert> {
    try {
      const timestamp = Date.now();
      const alertId = `manual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

      const alert: Alert = {
        id: alertId,
        title: alertData.type.replace(/_/g, " ").toUpperCase(),
        description: alertData.message,
        severity: alertData.severity,
        category: alertData.category || "system_health",
        status: "active",
        source: alertData.source || "Manual",
        timestamp,
        metadata: alertData.metadata,
      };

      this.alerts.set(alertId, alert);

      devLog("warn", this.context, `Manual alert triggered: ${alert.title}`, {
        alertId,
        severity: alert.severity,
      });

      // Send notifications
      await this.sendAlertNotifications(alert);

      // Create incident if severity is error or critical
      if (alert.severity === "error" || alert.severity === "critical") {
        await this.createOrUpdateIncident(alert);
      }

      return alert;
    } catch (error) {
      logError(this.context, "Failed to send manual alert", { error: String(error) });
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: "sendAlert",
      });
    }
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, resolvedBy?: string): boolean {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert || alert.resolved) {
        return false;
      }

      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      alert.status = "resolved";

      devLog("info", this.context, `Alert resolved: ${alertId}`, { resolvedBy });
      return true;
    } catch (error) {
      logError(this.context, "Failed to resolve alert", { error: String(error) });
      return false;
    }
  }

  /**
   * Suppress an alert
   */
  public suppressAlert(alertId: string, duration: number, reason?: string): boolean {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        return false;
      }

      alert.suppressedUntil = Date.now() + duration;
      alert.status = "suppressed";

      if (!alert.metadata) {
        alert.metadata = {};
      }
      alert.metadata.suppressionReason = reason;

      devLog("info", this.context, `Alert suppressed: ${alertId}`, {
        duration,
        reason,
        suppressedUntil: alert.suppressedUntil,
      });

      return true;
    } catch (error) {
      logError(this.context, "Failed to suppress alert", { error: String(error) });
      return false;
    }
  }

  /**
   * Escalate an alert
   */
  public async escalateAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert || alert.resolved || alert.escalated) {
        return false;
      }

      alert.escalated = true;
      alert.escalatedAt = Date.now();
      alert.status = "escalated";

      devLog("warn", this.context, `Alert escalated: ${alertId}`);

      // Send escalation notifications
      await this.sendEscalationNotifications(alert);

      return true;
    } catch (error) {
      logError(this.context, "Failed to escalate alert", { error: String(error) });
      return false;
    }
  }

  /**
   * Get a specific alert
   */
  public getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) =>
        !alert.resolved &&
        alert.status === "active" &&
        (!alert.suppressedUntil || alert.suppressedUntil < Date.now())
    );
  }

  /**
   * Get alert history
   */
  public getAlertHistory(timeRange?: { start: number; end: number }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (timeRange) {
      alerts = alerts.filter(
        (alert) => alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
      );
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get alert statistics
   */
  public getStatistics(): AlertStatistics {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = this.getActiveAlerts();
    const resolvedAlerts = allAlerts.filter((alert) => alert.resolved);
    const escalatedAlerts = allAlerts.filter((alert) => alert.escalated);
    const suppressedAlerts = allAlerts.filter(
      (alert) => alert.suppressedUntil && alert.suppressedUntil > Date.now()
    );

    const alertsBySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    const alertsByCategory: Record<AlertCategory, number> = {
      system_health: 0,
      api_performance: 0,
      database: 0,
      ai_service: 0,
      security: 0,
      user_experience: 0,
      business_metric: 0,
    };

    allAlerts.forEach((alert) => {
      alertsBySeverity[alert.severity]++;
      alertsByCategory[alert.category]++;
    });

    // Calculate MTTR (Mean Time To Resolution)
    const resolvedAlertsWithTime = resolvedAlerts.filter(
      (alert) => alert.resolvedAt && alert.timestamp
    );
    const totalResolutionTime = resolvedAlertsWithTime.reduce(
      (sum, alert) => sum + (alert.resolvedAt! - alert.timestamp),
      0
    );
    const mttr =
      resolvedAlertsWithTime.length > 0 ? totalResolutionTime / resolvedAlertsWithTime.length : 0;

    // Calculate MTBF (Mean Time Between Failures) - simplified
    const mtbf =
      allAlerts.length > 1
        ? (Date.now() - Math.min(...allAlerts.map((a) => a.timestamp))) / allAlerts.length
        : 0;

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      escalatedAlerts: escalatedAlerts.length,
      suppressedAlerts: suppressedAlerts.length,
      alertsBySeverity,
      alertsByCategory,
      openIncidents: this.incidentManager.getOpenIncidents().length,
      averageResolutionTime: mttr,
      mttr,
      mtbf,
    };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(config: Partial<AlertManagerConfig>): void {
    this.config = { ...this.config, ...config };
    devLog("info", this.context, "Configuration updated", { config });
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      devLog("info", this.context, "Alert system cleanup completed");
    } catch (error) {
      logError(this.context, "Failed to cleanup alert system", { error: String(error) });
    }
  }

  /**
   * Handle triggered alert from rule evaluation
   */
  // TODO: removed in refactoring - alert triggering now handled directly in recordMetric

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: Alert): Promise<void> {
    const defaultChannels: NotificationChannel[] = [
      {
        id: "default_slack",
        type: "slack",
        name: "Default Slack",
        config: {
          channel: alert.severity === "critical" ? "#critical-alerts" : "#alerts",
        },
        enabled: true,
      },
    ];

    await this.notificationDispatcher.sendNotifications(alert, defaultChannels);
  }

  /**
   * Send escalation notifications
   */
  private async sendEscalationNotifications(alert: Alert): Promise<void> {
    const escalationChannels: NotificationChannel[] = [
      {
        id: "escalation_email",
        type: "email",
        name: "Escalation Email",
        config: {
          recipients: ["oncall@sihat-tcm.com", "management@sihat-tcm.com"],
        },
        enabled: true,
      },
    ];

    await this.notificationDispatcher.sendNotifications(alert, escalationChannels);
  }

  /**
   * Create or update incident
   */
  private async createOrUpdateIncident(alert: Alert): Promise<void> {
    // Look for existing open incident with same category
    const existingIncidents = this.incidentManager.getOpenIncidents();
    const existingIncident = existingIncidents.find((incident) =>
      incident.alerts.some((a) => a.category === alert.category)
    );

    if (existingIncident) {
      await this.incidentManager.addAlertToIncident(existingIncident.id, alert);
    } else {
      await this.incidentManager.createIncident(alert);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval || 60000);
  }

  /**
   * Start cleanup processes
   */
  private startCleanupProcesses(): void {
    // Clean up old data every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldData();
      },
      60 * 60 * 1000
    );
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthResults: HealthCheckResult[] = [];

      // Check API health
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch("/api/health", {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        healthResults.push({
          service: "api",
          healthy: response.ok,
          responseTime,
          timestamp: Date.now(),
        });

        this.recordMetric("api_response_time", responseTime);
        this.recordMetric("api_health", response.ok ? 1 : 0);
      } catch (error) {
        healthResults.push({
          service: "api",
          healthy: false,
          error: String(error),
          timestamp: Date.now(),
        });
        this.recordMetric("api_response_time", 30000); // Timeout value
        this.recordMetric("api_health", 0);
      }

      // Record health check results
      healthResults.forEach((result) => {
        this.recordMetric(`${result.service}_health`, result.healthy ? 1 : 0);
        if (result.responseTime) {
          this.recordMetric(`${result.service}_response_time`, result.responseTime);
        }
      });
    } catch (error) {
      logError(this.context, "Health check failed", { error: String(error) });
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = Date.now();

    // Clean up old alerts
    const alertsToRemove: string[] = [];
    for (const [alertId, alert] of this.alerts.entries()) {
      if (
        alert.resolved &&
        alert.resolvedAt &&
        now - alert.resolvedAt > (this.config.alertRetentionPeriod || 7 * 24 * 60 * 60 * 1000)
      ) {
        alertsToRemove.push(alertId);
      } else if (!alert.resolved && now - alert.timestamp > (this.config.staleAlertThreshold || 24 * 60 * 60 * 1000)) {
        // Auto-resolve stale alerts
        this.resolveAlert(alertId, "system_auto_resolve");
      }
    }

    alertsToRemove.forEach((alertId) => {
      this.alerts.delete(alertId);
    });

    if (alertsToRemove.length > 0) {
      devLog("info", this.context, `Cleaned up ${alertsToRemove.length} old alerts`);
    }

    // Metric collector handles its own cleanup via periodic timer
  }

  /**
   * Get rule engine (for advanced usage)
   */
  public getRuleEngine(): AlertRuleEngine {
    return this.ruleEngine;
  }

  /**
   * Get metric collector (for advanced usage)
   */
  public getMetricCollector(): MetricCollector {
    return this.metricCollector;
  }

  /**
   * Get notification dispatcher (for advanced usage)
   */
  public getNotificationDispatcher(): NotificationDispatcher {
    return this.notificationDispatcher;
  }

  /**
   * Get incident manager (for advanced usage)
   */
  public getIncidentManager(): IncidentManager {
    return this.incidentManager;
  }
}

/**
 * Global alert system manager instance
 */
export const alertSystemManager = AlertSystemManager.getInstance();

/**
 * Convenience functions for common operations
 */
export const recordMetric = (metric: string, value: number, labels?: Record<string, string>) =>
  alertSystemManager.recordMetric(metric, value, labels);

export const sendAlert = (alertData: ManualAlertData) => alertSystemManager.sendAlert(alertData);

export const resolveAlert = (alertId: string, resolvedBy?: string) =>
  alertSystemManager.resolveAlert(alertId, resolvedBy);

export const getActiveAlerts = () => alertSystemManager.getActiveAlerts();

export const getAlertStatistics = () => alertSystemManager.getStatistics();
