/**
 * @fileoverview Security Rule Engine
 *
 * Manages security rules, evaluates threats, and triggers appropriate responses.
 * Provides real-time threat detection and automated security responses.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type {
  SecurityRule,
  SecurityEvent,
  SecurityContext,
  SecurityAlert,
  SecurityEventType,
} from "../interfaces/SecurityInterfaces";

/**
 * Security rule engine for threat detection and response
 */
export class SecurityRuleEngine {
  private rules: Map<string, SecurityRule> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private readonly maxAlertsInMemory: number = 5000;

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: SecurityRule[] = [
      {
        id: "multiple_failed_logins",
        name: "Multiple Failed Login Attempts",
        description: "Detect multiple failed login attempts from same IP",
        type: "login_failure",
        condition: (event, context) => {
          const ipInfo = context.ipTracking.get(event.ipAddress);
          return ipInfo ? ipInfo.failedLogins >= 5 : false;
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, context);
          await this.createAlert(
            "multiple_failed_logins",
            event,
            "high",
            `Blocked IP ${event.ipAddress} after ${context.ipTracking.get(event.ipAddress)?.failedLogins} failed login attempts`
          );
        },
        enabled: true,
        severity: "high",
        priority: 1,
      },
      {
        id: "suspicious_login_location",
        name: "Suspicious Login Location",
        description: "Detect login from unusual location",
        type: "login_success",
        condition: (event, context) => {
          if (!event.userId) return false;
          const userProfile = context.userProfiles.get(event.userId);
          return userProfile ? !userProfile.knownIPs.includes(event.ipAddress) : false;
        },
        action: async (event, context) => {
          await this.createAlert(
            "suspicious_login_location",
            event,
            "medium",
            `User ${event.userId} logged in from new location: ${event.ipAddress}`
          );
        },
        enabled: true,
        severity: "medium",
        priority: 2,
      },
      {
        id: "rapid_requests",
        name: "Rapid API Requests",
        description: "Detect rapid API requests indicating potential abuse",
        type: "api_abuse",
        condition: (event, context) => {
          const recentEvents = context.recentEvents.filter(
            (e) => e.ipAddress === event.ipAddress && e.timestamp > Date.now() - 60000 // Last minute
          );
          return recentEvents.length > 100; // More than 100 requests per minute
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, context, 1800000); // 30 minutes
          await this.createAlert(
            "rapid_requests",
            event,
            "high",
            `Blocked IP ${event.ipAddress} for API abuse - ${context.recentEvents.filter((e) => e.ipAddress === event.ipAddress).length} requests in last minute`
          );
        },
        enabled: true,
        severity: "high",
        priority: 1,
      },
      {
        id: "sql_injection_attempt",
        name: "SQL Injection Attempt",
        description: "Detect potential SQL injection in request payload",
        type: "injection_attempt",
        condition: (event, context) => {
          if (!event.payload) return false;

          const payload = JSON.stringify(event.payload).toLowerCase();
          const sqlPatterns = [
            "union select",
            "drop table",
            "insert into",
            "delete from",
            "update set",
            "-- ",
            "; --",
            "xp_cmdshell",
            "sp_executesql",
            "' or '1'='1",
            "' or 1=1",
            "admin'--",
            "' union select",
          ];

          return sqlPatterns.some((pattern) => payload.includes(pattern));
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, context, 7200000); // 2 hours
          await this.createAlert(
            "sql_injection_attempt",
            event,
            "critical",
            `Critical: SQL injection attempt detected from ${event.ipAddress}`
          );
        },
        enabled: true,
        severity: "critical",
        priority: 0,
      },
      {
        id: "xss_attempt",
        name: "XSS Attempt",
        description: "Detect potential XSS in request payload",
        type: "xss_attempt",
        condition: (event, context) => {
          if (!event.payload) return false;

          const payload = JSON.stringify(event.payload).toLowerCase();
          const xssPatterns = [
            "<script",
            "javascript:",
            "onload=",
            "onerror=",
            "onclick=",
            "eval(",
            "alert(",
            "document.cookie",
            "window.location",
            "<iframe",
            "<object",
            "<embed",
          ];

          return xssPatterns.some((pattern) => payload.includes(pattern));
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, context, 3600000); // 1 hour
          await this.createAlert(
            "xss_attempt",
            event,
            "high",
            `XSS attempt detected from ${event.ipAddress}`
          );
        },
        enabled: true,
        severity: "high",
        priority: 1,
      },
      {
        id: "privilege_escalation",
        name: "Privilege Escalation Attempt",
        description: "Detect attempts to access admin endpoints without proper authorization",
        type: "privilege_escalation",
        condition: (event, context) => {
          return !!(
            event.endpoint?.startsWith("/api/admin") && event.metadata?.userRole !== "admin"
          );
        },
        action: async (event, context) => {
          await this.createAlert(
            "privilege_escalation",
            event,
            "high",
            `Privilege escalation attempt: User ${event.userId || "anonymous"} tried to access ${event.endpoint}`
          );
        },
        enabled: true,
        severity: "high",
        priority: 1,
      },
      {
        id: "account_enumeration",
        name: "Account Enumeration Attempt",
        description: "Detect systematic attempts to enumerate user accounts",
        type: "login_failure",
        condition: (event, context) => {
          const recentFailures = context.recentEvents.filter(
            (e) =>
              e.type === "login_failure" &&
              e.ipAddress === event.ipAddress &&
              e.timestamp > Date.now() - 300000 // Last 5 minutes
          );

          // Check for different usernames from same IP
          const uniqueUsers = new Set(recentFailures.map((e) => e.userId).filter(Boolean));
          return uniqueUsers.size >= 10; // 10 different usernames in 5 minutes
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, context, 3600000); // 1 hour
          await this.createAlert(
            "account_enumeration",
            event,
            "high",
            `Account enumeration detected from ${event.ipAddress}`
          );
        },
        enabled: true,
        severity: "high",
        priority: 1,
      },
    ];

    defaultRules.forEach((rule) => {
      this.rules.set(rule.id, rule);
    });

    devLog(
      "info",
      "SecurityRuleEngine",
      `Initialized ${defaultRules.length} default security rules`
    );
  }

  /**
   * Add or update a security rule
   */
  public addRule(rule: SecurityRule): void {
    this.rules.set(rule.id, rule);
    devLog("info", "SecurityRuleEngine", `Added/updated security rule: ${rule.id}`);
  }

  /**
   * Remove a security rule
   */
  public removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      devLog("info", "SecurityRuleEngine", `Removed security rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get a security rule by ID
   */
  public getRule(ruleId: string): SecurityRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all security rules
   */
  public getAllRules(): SecurityRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable or disable a rule
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      devLog("info", "SecurityRuleEngine", `Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);
      return true;
    }
    return false;
  }

  /**
   * Evaluate security rules for an event
   */
  public async evaluateRules(
    event: SecurityEvent,
    context: SecurityContext
  ): Promise<SecurityAlert[]> {
    const triggeredAlerts: SecurityAlert[] = [];

    // Get rules sorted by priority (lower number = higher priority)
    const sortedRules = Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      try {
        // Check if rule applies to this event type
        if (rule.type !== event.type) continue;

        // Evaluate rule condition
        if (rule.condition(event, context)) {
          devLog("warn", "SecurityRuleEngine", `Security rule triggered: ${rule.name}`, {
            ruleId: rule.id,
            eventId: event.id,
            severity: rule.severity,
          });

          // Execute rule action
          await rule.action(event, context);
        }
      } catch (error) {
        devLog("error", "SecurityRuleEngine", `Error evaluating security rule: ${rule.id}`, {
          error,
        });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Block IP address
   */
  private async blockIP(
    ipAddress: string,
    context: SecurityContext,
    duration: number = 3600000 // 1 hour default
  ): Promise<void> {
    const ipInfo = context.ipTracking.get(ipAddress);
    if (ipInfo) {
      ipInfo.isBlocked = true;
      ipInfo.blockedUntil = Date.now() + duration;
    }

    context.blockedIPs.add(ipAddress);

    devLog("warn", "SecurityRuleEngine", `IP address blocked: ${ipAddress}`, {
      duration: duration / 1000 / 60, // minutes
      blockedUntil: new Date(Date.now() + duration).toISOString(),
    });

    // Store in database for persistence
    try {
      await fetch("/api/security/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddress,
          blockedUntil: Date.now() + duration,
          reason: "Automated security block",
        }),
      });
    } catch (error) {
      devLog("error", "SecurityRuleEngine", "Failed to persist IP block", { error });
    }
  }

  /**
   * Create security alert
   */
  private async createAlert(
    ruleId: string,
    event: SecurityEvent,
    severity: "low" | "medium" | "high" | "critical",
    message: string
  ): Promise<SecurityAlert> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: SecurityAlert = {
      id: alertId,
      ruleId,
      event,
      severity,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);

    // Send to external alerting system
    await this.sendSecurityAlert(alert);

    // Cleanup old alerts if needed
    if (this.alerts.size > this.maxAlertsInMemory) {
      this.cleanupOldAlerts();
    }

    return alert;
  }

  /**
   * Send security alert to external systems
   */
  private async sendSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Send to webhook if configured
      if (process.env.SECURITY_WEBHOOK) {
        await fetch(process.env.SECURITY_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "security_alert",
            alert,
            timestamp: Date.now(),
            service: "sihat-tcm",
          }),
        });
      }

      // Send to Slack for critical alerts
      if (alert.severity === "critical" && process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "#security-alerts",
            text: `🚨 CRITICAL SECURITY ALERT: ${alert.message}`,
            attachments: [
              {
                color: "danger",
                fields: [
                  {
                    title: "Rule",
                    value: alert.ruleId,
                    short: true,
                  },
                  {
                    title: "Severity",
                    value: alert.severity.toUpperCase(),
                    short: true,
                  },
                  {
                    title: "IP Address",
                    value: alert.event.ipAddress,
                    short: true,
                  },
                  {
                    title: "User ID",
                    value: alert.event.userId || "Anonymous",
                    short: true,
                  },
                  {
                    title: "Event Type",
                    value: alert.event.type,
                    short: true,
                  },
                  {
                    title: "Timestamp",
                    value: new Date(alert.timestamp).toISOString(),
                    short: true,
                  },
                ],
              },
            ],
          }),
        });
      }
    } catch (error) {
      devLog("error", "SecurityRuleEngine", "Failed to send security alert", { error });
    }
  }

  /**
   * Get security alerts
   */
  public getAlerts(criteria?: {
    severity?: string;
    ruleId?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
  }): SecurityAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (criteria) {
      if (criteria.severity) {
        alerts = alerts.filter((alert) => alert.severity === criteria.severity);
      }
      if (criteria.ruleId) {
        alerts = alerts.filter((alert) => alert.ruleId === criteria.ruleId);
      }
      if (criteria.acknowledged !== undefined) {
        alerts = alerts.filter((alert) => alert.acknowledged === criteria.acknowledged);
      }
      if (criteria.resolved !== undefined) {
        alerts = alerts.filter((alert) => alert.resolved === criteria.resolved);
      }
      if (criteria.limit) {
        alerts = alerts.slice(-criteria.limit);
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();

      devLog("info", "SecurityRuleEngine", `Alert acknowledged: ${alertId}`, { acknowledgedBy });
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = Date.now();

      devLog("info", "SecurityRuleEngine", `Alert resolved: ${alertId}`, { resolvedBy });
      return true;
    }
    return false;
  }

  /**
   * Get rule statistics
   */
  public getRuleStatistics(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByType: Record<SecurityEventType, number>;
    rulesBySeverity: Record<string, number>;
    alertsByRule: Record<string, number>;
  } {
    const allRules = Array.from(this.rules.values());
    const enabledRules = allRules.filter((rule) => rule.enabled);

    const rulesByType = {} as Record<SecurityEventType, number>;
    const rulesBySeverity = {} as Record<string, number>;
    const alertsByRule = {} as Record<string, number>;

    allRules.forEach((rule) => {
      rulesByType[rule.type] = (rulesByType[rule.type] || 0) + 1;
      rulesBySeverity[rule.severity] = (rulesBySeverity[rule.severity] || 0) + 1;
    });

    Array.from(this.alerts.values()).forEach((alert) => {
      alertsByRule[alert.ruleId] = (alertsByRule[alert.ruleId] || 0) + 1;
    });

    return {
      totalRules: allRules.length,
      enabledRules: enabledRules.length,
      disabledRules: allRules.length - enabledRules.length,
      rulesByType,
      rulesBySeverity,
      alertsByRule,
    };
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const initialCount = this.alerts.size;

    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffTime) {
        this.alerts.delete(alertId);
      }
    }

    const removedCount = initialCount - this.alerts.size;
    if (removedCount > 0) {
      devLog("info", "SecurityRuleEngine", `Cleaned up ${removedCount} old security alerts`);
    }
  }

  /**
   * Export rules and alerts
   */
  public exportData(): {
    rules: SecurityRule[];
    alerts: SecurityAlert[];
  } {
    return {
      rules: Array.from(this.rules.values()),
      alerts: Array.from(this.alerts.values()),
    };
  }
}
