/**
 * @fileoverview Alert Manager Orchestrator
 *
 * Main orchestrator for the alert management system.
 * Coordinates metric collection, rule evaluation, notifications, and incident management.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import { MetricCollector } from "./core/MetricCollector";
import { AlertRuleEngine } from "./core/AlertRuleEngine";
import { NotificationDispatcher } from "./notifications/NotificationDispatcher";
import { IncidentManager } from "./core/IncidentManager";
import type {
  Alert,
  AlertRule,
  Incident,
  AlertSeverity,
  AlertStatistics,
  AlertManagerConfig,
} from "./interfaces/AlertInterfaces";

/**
 * Main alert manager class that orchestrates all alert system components
 */
export class AlertManager {
  private static instance: AlertManager;
  private metricCollector: MetricCollector;
  private ruleEngine: AlertRuleEngine;
  private notificationDispatcher: NotificationDispatcher;
  private incidentManager: IncidentManager;
  private alerts: Map<string, Alert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: AlertManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      enabled: process.env.ENABLE_ALERTING === "true",
      maxEventsInMemory: 10000,
      cleanupInterval: 3600000, // 1 hour
      defaultCooldownPeriod: 600000, // 10 minutes
      defaultEscalationDelay: 1800000, // 30 minutes
    };

    this.metricCollector = new MetricCollector();
    this.ruleEngine = new AlertRuleEngine(this.metricCollector);
    this.notificationDispatcher = new NotificationDispatcher();
    this.incidentManager = new IncidentManager();

    if (this.config.enabled) {
      this.startPeriodicTasks();
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
   * Record metric value and check alert rules
   */
  public recordMetric(metric: string, value: number): void {
    if (!this.config.enabled) return;

    const timestamp = Date.now();

    // Record the metric
    this.metricCollector.recordMetric(metric, value);

    // Check alert rules for this metric
    const triggeredAlerts = this.ruleEngine.checkRulesForMetric(metric, value, timestamp);

    // Process triggered alerts
    triggeredAlerts.forEach((alert) => {
      this.processAlert(alert);
    });
  }

  /**
   * Send a manual alert
   */
  public async sendAlert(alertData: {
    type: string;
    message: string;
    severity: AlertSeverity;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.config.enabled) return;

    const timestamp = Date.now();
    const alertId = `manual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      title: alertData.type.replace(/_/g, " ").toUpperCase(),
      description: alertData.message,
      severity: alertData.severity,
      category: "system_health",
      source: "Manual",
      timestamp,
      metadata: alertData.metadata,
    };

    await this.processAlert(alert);
  }

  /**
   * Process a triggered alert
   */
  private async processAlert(alert: Alert): Promise<void> {
    // Store the alert
    this.alerts.set(alert.id, alert);

    devLog("warn", "AlertManager", `Alert triggered: ${alert.title}`, {
      alertId: alert.id,
      severity: alert.severity,
      category: alert.category,
    });

    // Get the rule to determine notification channels
    const rule = this.ruleEngine.getRule(alert.metadata?.ruleId);
    const notificationChannels = rule?.notificationChannels || [
      {
        type: "slack",
        config: { channel: alert.severity === "critical" ? "#critical-alerts" : "#alerts" },
        enabled: true,
      },
    ];

    // Create or update incident for error/critical alerts
    let incident: Incident | undefined;
    if (alert.severity === "error" || alert.severity === "critical") {
      incident = await this.incidentManager.createOrUpdateIncident(alert);
    }

    // Send notifications
    await this.notificationDispatcher.sendNotifications(alert, notificationChannels, incident);

    // Schedule escalation if configured
    if (rule?.escalationDelay && rule.escalationDelay > 0) {
      this.scheduleEscalation(alert.id, rule.escalationDelay);
    }

    // Cleanup old alerts if needed
    if (this.alerts.size > this.config.maxEventsInMemory) {
      this.cleanupOldAlerts();
    }
  }

  /**
   * Schedule alert escalation
   */
  private scheduleEscalation(alertId: string, delay: number): void {
    const timer = setTimeout(() => {
      this.escalateAlert(alertId);
    }, delay);

    this.escalationTimers.set(alertId, timer);
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

    // Send escalation notifications
    if (process.env.ESCALATION_WEBHOOK) {
      try {
        await fetch(process.env.ESCALATION_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "alert_escalation",
            alert,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        devLog("error", "AlertManager", "Failed to send escalation webhook", { error });
      }
    }

    // Clean up escalation timer
    this.escalationTimers.delete(alertId);
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

    // Cancel escalation if scheduled
    const escalationTimer = this.escalationTimers.get(alertId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alertId);
    }

    devLog("info", "AlertManager", `Alert resolved: ${alertId}`, { resolvedBy });

    return true;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert by ID
   */
  public getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get open incidents
   */
  public getOpenIncidents(): Incident[] {
    return this.incidentManager.getOpenIncidents();
  }

  /**
   * Get incident by ID
   */
  public getIncident(incidentId: string): Incident | undefined {
    return this.incidentManager.getIncident(incidentId);
  }

  /**
   * Update incident status
   */
  public updateIncidentStatus(
    incidentId: string,
    status: Incident["status"],
    user?: string,
    notes?: string
  ): boolean {
    return this.incidentManager.updateIncidentStatus(incidentId, status, user, notes);
  }

  /**
   * Assign incident
   */
  public assignIncident(incidentId: string, assignee: string, user?: string): boolean {
    return this.incidentManager.assignIncident(incidentId, assignee, user);
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.ruleEngine.addRule(rule);
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): boolean {
    return this.ruleEngine.removeRule(ruleId);
  }

  /**
   * Get alert rule
   */
  public getAlertRule(ruleId: string): AlertRule | undefined {
    return this.ruleEngine.getRule(ruleId);
  }

  /**
   * Get all alert rules
   */
  public getAllAlertRules(): AlertRule[] {
    return this.ruleEngine.getAllRules();
  }

  /**
   * Enable/disable alert rule
   */
  public setAlertRuleEnabled(ruleId: string, enabled: boolean): boolean {
    return this.ruleEngine.setRuleEnabled(ruleId, enabled);
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): AlertStatistics {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter((alert) => !alert.resolved);
    const resolvedAlerts = allAlerts.filter((alert) => alert.resolved);
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical");
    const openIncidents = this.incidentManager.getOpenIncidents();

    const alertsByCategory = {} as Record<string, number>;
    const alertsBySeverity = {} as Record<AlertSeverity, number>;

    allAlerts.forEach((alert) => {
      alertsByCategory[alert.category] = (alertsByCategory[alert.category] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      criticalAlerts: criticalAlerts.length,
      openIncidents: openIncidents.length,
      alertsByCategory: alertsByCategory as any,
      alertsBySeverity,
    };
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Health check every minute
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Cleanup every hour
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldAlerts();
      this.incidentManager.cleanupOldIncidents();
      this.incidentManager.autoResolveStaleIncidents();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check API health
      const startTime = Date.now();
      const healthResponse = await fetch("/api/health");
      const responseTime = Date.now() - startTime;

      this.recordMetric("api_response_time", responseTime);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();

        // Record database health
        this.recordMetric("database_health", healthData.database === "healthy" ? 1 : 0);

        // Record other health metrics
        if (healthData.ai_service) {
          this.recordMetric("ai_success_rate", healthData.ai_service.success_rate || 0);
        }
      } else {
        this.recordMetric("database_health", 0);
        this.recordMetric("api_response_time", 30000); // Timeout value
      }
    } catch (error) {
      devLog("error", "AlertManager", "Health check failed", { error });
      this.recordMetric("api_response_time", 30000);
      this.recordMetric("database_health", 0);
    }
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const initialCount = this.alerts.size;

    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffTime) {
        this.alerts.delete(alertId);

        // Cancel any pending escalation
        const escalationTimer = this.escalationTimers.get(alertId);
        if (escalationTimer) {
          clearTimeout(escalationTimer);
          this.escalationTimers.delete(alertId);
        }
      }
    }

    const removedCount = initialCount - this.alerts.size;
    if (removedCount > 0) {
      devLog("info", "AlertManager", `Cleaned up ${removedCount} old alerts`);
    }
  }

  /**
   * Test notification channel
   */
  public async testNotificationChannel(channel: any): Promise<boolean> {
    return this.notificationDispatcher.testChannel(channel);
  }

  /**
   * Export system data
   */
  public exportData(): {
    alerts: Alert[];
    incidents: Incident[];
    rules: AlertRule[];
    metrics: Record<string, any>;
    statistics: AlertStatistics;
  } {
    return {
      alerts: this.getAllAlerts(),
      incidents: this.incidentManager.getAllIncidents(),
      rules: this.ruleEngine.getAllRules(),
      metrics: this.metricCollector.exportMetrics(),
      statistics: this.getAlertStatistics(),
    };
  }

  /**
   * Shutdown and cleanup
   */
  public shutdown(): void {
    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Clear escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    // Cleanup components
    this.metricCollector.destroy();

    devLog("info", "AlertManager", "Alert manager shutdown complete");
  }
}

/**
 * Global alert manager instance
 */
export const alertManager = AlertManager.getInstance();
