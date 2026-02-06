/**
 * @fileoverview Alert Rule Engine
 *
 * Manages alert rules, evaluates conditions, and triggers alerts
 * based on metric thresholds and business logic.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type {
  AlertRule,
  AlertCondition,
  Alert,
  AlertCategory,
  AlertSeverity,
  AlertEvaluationContext,
  MetricHistoryEntry,
} from "../interfaces/AlertInterfaces";
import { MetricCollector } from "./MetricCollector";

/**
 * Alert rule engine for evaluating conditions and triggering alerts
 */
export class AlertRuleEngine {
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private metricCollector: MetricCollector;

  constructor(metricCollector: MetricCollector) {
    this.metricCollector = metricCollector;
    this.initializeDefaultRules();
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
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });

    devLog("info", "AlertRuleEngine", `Initialized ${defaultRules.length} default alert rules`);
  }

  /**
   * Add or update an alert rule
   */
  public addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    devLog("info", "AlertRuleEngine", `Added/updated alert rule: ${rule.id}`);
  }

  /**
   * Remove an alert rule
   */
  public removeRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      devLog("info", "AlertRuleEngine", `Removed alert rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get an alert rule by ID
   */
  public getRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Get all alert rules
   */
  public getAllRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Enable or disable a rule
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      devLog("info", "AlertRuleEngine", `Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);
      return true;
    }
    return false;
  }

  /**
   * Check alert rules for a specific metric
   */
  public checkRulesForMetric(metric: string, value: number | string, timestamp: number): Alert[] {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.condition.metric !== metric) {
        continue;
      }

      // Check cooldown period
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert && timestamp - lastAlert < rule.cooldownPeriod) {
        continue;
      }

      // Evaluate the rule condition
      if (this.evaluateCondition(rule.condition, metric, value, timestamp)) {
        const alert = this.createAlert(rule, value, timestamp);
        triggeredAlerts.push(alert);
        this.lastAlertTime.set(rule.id, timestamp);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    condition: AlertCondition,
    metric: string,
    value: number | string,
    timestamp: number
  ): boolean {
    const history = this.metricCollector.getMetricWindow(metric, condition.timeWindow, timestamp);

    if (history.length === 0) return false;

    // Check if current condition is met
    let conditionMet = false;

    if (typeof value === "number" && typeof condition.threshold === "number") {
      switch (condition.operator) {
        case "gt":
          conditionMet = value > condition.threshold;
          break;
        case "lt":
          conditionMet = value < condition.threshold;
          break;
        case "gte":
          conditionMet = value >= condition.threshold;
          break;
        case "lte":
          conditionMet = value <= condition.threshold;
          break;
        case "eq":
          conditionMet = value === condition.threshold;
          break;
      }
    } else {
      // String-based conditions
      const stringValue = String(value);
      const stringThreshold = String(condition.threshold);

      switch (condition.operator) {
        case "contains":
          conditionMet = stringValue.includes(stringThreshold);
          break;
        case "not_contains":
          conditionMet = !stringValue.includes(stringThreshold);
          break;
        case "eq":
          conditionMet = stringValue === stringThreshold;
          break;
      }
    }

    if (!conditionMet) return false;

    // Check consecutive failures if specified
    if (condition.consecutiveFailures && condition.consecutiveFailures > 1) {
      return this.metricCollector.hasConsecutiveFailures(
        metric,
        condition.threshold as number,
        condition.operator as any,
        condition.consecutiveFailures,
        condition.timeWindow
      );
    }

    return true;
  }

  /**
   * Create alert from rule and current values
   */
  private createAlert(rule: AlertRule, value: number | string, timestamp: number): Alert {
    const alertId = `${rule.id}_${timestamp}`;

    return {
      id: alertId,
      title: rule.name,
      description: `${rule.description}. Current value: ${value}, Threshold: ${rule.condition.threshold}`,
      severity: rule.severity,
      category: rule.category,
      source: "AlertRuleEngine",
      timestamp,
      metadata: {
        ruleId: rule.id,
        metric: rule.condition.metric,
        value,
        threshold: rule.condition.threshold,
        operator: rule.condition.operator,
      },
    };
  }

  /**
   * Get rules by category
   */
  public getRulesByCategory(category: AlertCategory): AlertRule[] {
    return Array.from(this.alertRules.values()).filter((rule) => rule.category === category);
  }

  /**
   * Get rules by severity
   */
  public getRulesBySeverity(severity: AlertSeverity): AlertRule[] {
    return Array.from(this.alertRules.values()).filter((rule) => rule.severity === severity);
  }

  /**
   * Get enabled rules
   */
  public getEnabledRules(): AlertRule[] {
    return Array.from(this.alertRules.values()).filter((rule) => rule.enabled);
  }

  /**
   * Validate rule configuration
   */
  public validateRule(rule: AlertRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id || rule.id.trim() === "") {
      errors.push("Rule ID is required");
    }

    if (!rule.name || rule.name.trim() === "") {
      errors.push("Rule name is required");
    }

    if (!rule.condition.metric || rule.condition.metric.trim() === "") {
      errors.push("Metric name is required");
    }

    if (rule.condition.timeWindow <= 0) {
      errors.push("Time window must be positive");
    }

    if (rule.cooldownPeriod < 0) {
      errors.push("Cooldown period cannot be negative");
    }

    if (rule.escalationDelay < 0) {
      errors.push("Escalation delay cannot be negative");
    }

    if (!rule.notificationChannels || rule.notificationChannels.length === 0) {
      errors.push("At least one notification channel is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get rule statistics
   */
  public getRuleStatistics(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByCategory: Record<AlertCategory, number>;
    rulesBySeverity: Record<AlertSeverity, number>;
  } {
    const allRules = Array.from(this.alertRules.values());
    const enabledRules = allRules.filter((rule) => rule.enabled);

    const rulesByCategory = {} as Record<AlertCategory, number>;
    const rulesBySeverity = {} as Record<AlertSeverity, number>;

    allRules.forEach((rule) => {
      rulesByCategory[rule.category] = (rulesByCategory[rule.category] || 0) + 1;
      rulesBySeverity[rule.severity] = (rulesBySeverity[rule.severity] || 0) + 1;
    });

    return {
      totalRules: allRules.length,
      enabledRules: enabledRules.length,
      disabledRules: allRules.length - enabledRules.length,
      rulesByCategory,
      rulesBySeverity,
    };
  }

  /**
   * Export rules configuration
   */
  public exportRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Import rules configuration
   */
  public importRules(rules: AlertRule[]): { imported: number; errors: string[] } {
    let imported = 0;
    const errors: string[] = [];

    rules.forEach((rule) => {
      const validation = this.validateRule(rule);
      if (validation.valid) {
        this.alertRules.set(rule.id, rule);
        imported++;
      } else {
        errors.push(`Rule ${rule.id}: ${validation.errors.join(", ")}`);
      }
    });

    devLog("info", "AlertRuleEngine", `Imported ${imported} rules, ${errors.length} errors`);

    return { imported, errors };
  }
}
