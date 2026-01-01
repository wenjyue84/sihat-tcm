/**
 * Alert Rule Engine
 * 
 * Manages alert rules, evaluates conditions, and triggers alerts
 * based on metric data and configured thresholds.
 */

import {
  AlertRule,
  AlertCondition,
  AlertEvaluationContext,
  Alert,
  AlertSeverity,
  AlertCategory,
  MetricDataPoint
} from '../interfaces/AlertInterfaces';
import { devLog } from '@/lib/systemLogger';

export class AlertRuleEngine {
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private readonly context: string = 'AlertRuleEngine';

  constructor() {
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

    devLog("info", this.context, `Initialized ${defaultRules.length} default alert rules`);
  }

  /**
   * Add or update alert rule
   */
  public addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    devLog("info", this.context, `Alert rule added/updated: ${rule.id}`);
  }

  /**
   * Remove alert rule
   */
  public removeRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      devLog("info", this.context, `Alert rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Enable/disable alert rule
   */
  public toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      devLog("info", this.context, `Alert rule ${enabled ? 'enabled' : 'disabled'}: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  public getAllRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get enabled alert rules
   */
  public getEnabledRules(): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(rule => rule.enabled);
  }

  /**
   * Get rules for specific metric
   */
  public getRulesForMetric(metric: string): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(
      rule => rule.enabled && rule.condition.metric === metric
    );
  }

  /**
   * Evaluate metric against alert rules
   */
  public evaluateMetric(context: AlertEvaluationContext): Alert[] {
    const triggeredAlerts: Alert[] = [];
    const rulesForMetric = this.getRulesForMetric(context.metric);

    for (const rule of rulesForMetric) {
      // Check cooldown period
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert && context.timestamp - lastAlert < rule.cooldownPeriod) {
        continue;
      }

      if (this.evaluateCondition(rule.condition, context)) {
        const alert = this.createAlert(rule, context);
        triggeredAlerts.push(alert);
        this.lastAlertTime.set(rule.id, context.timestamp);

        devLog("warn", this.context, `Alert triggered: ${rule.name}`, {
          alertId: alert.id,
          severity: rule.severity,
          value: context.value,
          threshold: rule.condition.threshold,
        });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: AlertCondition, context: AlertEvaluationContext): boolean {
    const { value, timestamp, history } = context;

    // Get values within time window
    const windowStart = timestamp - condition.timeWindow;
    const windowValues = history.filter((entry) => entry.timestamp >= windowStart);

    if (windowValues.length === 0) return false;

    // Check if condition is met
    let conditionMet = this.checkConditionOperator(condition, value);

    if (!conditionMet) return false;

    // Check consecutive failures if specified
    if (condition.consecutiveFailures && condition.consecutiveFailures > 1) {
      const recentValues = windowValues.slice(-condition.consecutiveFailures);
      if (recentValues.length < condition.consecutiveFailures) return false;

      return recentValues.every((entry) => 
        this.checkConditionOperator(condition, entry.value)
      );
    }

    return true;
  }

  /**
   * Check condition operator
   */
  private checkConditionOperator(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case "gt":
        return value > (condition.threshold as number);
      case "lt":
        return value < (condition.threshold as number);
      case "gte":
        return value >= (condition.threshold as number);
      case "lte":
        return value <= (condition.threshold as number);
      case "eq":
        return value === (condition.threshold as number);
      case "contains":
        return String(value).includes(String(condition.threshold));
      case "not_contains":
        return !String(value).includes(String(condition.threshold));
      default:
        return false;
    }
  }

  /**
   * Create alert from rule and context
   */
  private createAlert(rule: AlertRule, context: AlertEvaluationContext): Alert {
    const alertId = `${rule.id}_${context.timestamp}`;

    return {
      id: alertId,
      title: rule.name,
      description: `${rule.description}. Current value: ${context.value}, Threshold: ${rule.condition.threshold}`,
      severity: rule.severity,
      category: rule.category,
      source: "AlertRuleEngine",
      timestamp: context.timestamp,
      metadata: {
        ruleId: rule.id,
        metric: rule.condition.metric,
        value: context.value,
        threshold: rule.condition.threshold,
        operator: rule.condition.operator,
      },
    };
  }

  /**
   * Get rule by ID
   */
  public getRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Get rules by category
   */
  public getRulesByCategory(category: AlertCategory): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(rule => rule.category === category);
  }

  /**
   * Get rules by severity
   */
  public getRulesBySeverity(severity: AlertSeverity): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(rule => rule.severity === severity);
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
    const enabledRules = allRules.filter(rule => rule.enabled);
    const disabledRules = allRules.filter(rule => !rule.enabled);

    const rulesByCategory = allRules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<AlertCategory, number>);

    const rulesBySeverity = allRules.reduce((acc, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    return {
      totalRules: allRules.length,
      enabledRules: enabledRules.length,
      disabledRules: disabledRules.length,
      rulesByCategory,
      rulesBySeverity,
    };
  }

  /**
   * Clear cooldown for rule (for testing or manual override)
   */
  public clearCooldown(ruleId: string): void {
    this.lastAlertTime.delete(ruleId);
    devLog("info", this.context, `Cooldown cleared for rule: ${ruleId}`);
  }

  /**
   * Clear all cooldowns
   */
  public clearAllCooldowns(): void {
    this.lastAlertTime.clear();
    devLog("info", this.context, "All rule cooldowns cleared");
  }
}