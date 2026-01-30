/**
 * @fileoverview Security Monitor Orchestrator
 * 
 * Main orchestrator for the security monitoring system.
 * Coordinates event tracking, rule evaluation, threat analysis, and response actions.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import { EventTracker } from "./core/EventTracker";
import { SecurityRuleEngine } from "./core/SecurityRuleEngine";
import { ThreatAnalyzer } from "./analysis/ThreatAnalyzer";
import type { 
  SecurityEvent, 
  SecurityEventType, 
  SecurityContext, 
  SecurityStatistics,
  SecurityConfig,
  ThreatAssessment,
  SecurityAlert 
} from "./interfaces/SecurityInterfaces";

/**
 * Main security monitor class that orchestrates all security system components
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventTracker: EventTracker;
  private ruleEngine: SecurityRuleEngine;
  private threatAnalyzer: ThreatAnalyzer;
  private config: SecurityConfig;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      enabled: process.env.ENABLE_SECURITY_MONITORING === "true",
      maxEventsInMemory: 10000,
      cleanupInterval: 3600000, // 1 hour
      ipBlockDuration: 3600000, // 1 hour
      userLockDuration: 1800000, // 30 minutes
      maxFailedLogins: 5,
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      alertThresholds: {
        low: 20,
        medium: 40,
        high: 60,
        critical: 80,
      },
    };

    this.eventTracker = new EventTracker();
    this.ruleEngine = new SecurityRuleEngine();
    this.threatAnalyzer = new ThreatAnalyzer();

    if (this.config.enabled) {
      this.startPeriodicTasks();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Record security event and process it through the security pipeline
   */
  public recordEvent(event: Omit<SecurityEvent, "id" | "timestamp">): void {
    if (!this.config.enabled) return;

    // Record the event
    const securityEvent = this.eventTracker.recordEvent(event);

    // Build security context
    const context = this.buildSecurityContext();

    // Evaluate security rules
    this.ruleEngine.evaluateRules(securityEvent, context).catch(error => {
      devLog("error", "SecurityMonitor", "Error evaluating security rules", { error });
    });

    devLog("info", "SecurityMonitor", `Security event processed: ${event.type}`, {
      eventId: securityEvent.id,
      severity: event.severity,
      ipAddress: event.ipAddress,
      userId: event.userId,
    });
  }

  /**
   * Build security context for rule evaluation
   */
  private buildSecurityContext(): SecurityContext {
    const ipTracking = new Map();
    const userProfiles = new Map();
    const blockedIPs = new Set<string>();
    const lockedUsers = new Set<string>();

    // Populate IP tracking
    this.eventTracker.getAllIPInfo().forEach(ip => {
      ipTracking.set(ip.ipAddress, ip);
      if (ip.isBlocked) {
        blockedIPs.add(ip.ipAddress);
      }
    });

    // Populate user profiles
    this.eventTracker.getAllUserProfiles().forEach(user => {
      userProfiles.set(user.userId, user);
      if (user.isLocked) {
        lockedUsers.add(user.userId);
      }
    });

    return {
      ipTracking,
      userProfiles,
      recentEvents: this.eventTracker.getRecentEvents(1000),
      blockedIPs,
      lockedUsers,
    };
  }

  /**
   * Check if IP is blocked
   */
  public isIPBlocked(ipAddress: string): boolean {
    const ipInfo = this.eventTracker.getIPInfo(ipAddress);
    if (!ipInfo || !ipInfo.isBlocked) return false;

    // Check if block has expired
    if (ipInfo.blockedUntil && Date.now() > ipInfo.blockedUntil) {
      ipInfo.isBlocked = false;
      ipInfo.blockedUntil = undefined;
      return false;
    }

    return true;
  }

  /**
   * Check if user is locked
   */
  public isUserLocked(userId: string): boolean {
    const profile = this.eventTracker.getUserProfile(userId);
    if (!profile || !profile.isLocked) return false;

    // Check if lock has expired
    if (profile.lockedUntil && Date.now() > profile.lockedUntil) {
      profile.isLocked = false;
      profile.lockedUntil = undefined;
      profile.failedLoginAttempts = 0;
      return false;
    }

    return true;
  }

  /**
   * Analyze threat for IP address
   */
  public analyzeIPThreat(ipAddress: string): ThreatAssessment | null {
    const ipInfo = this.eventTracker.getIPInfo(ipAddress);
    if (!ipInfo) return null;

    const recentEvents = this.eventTracker.getEventsByIP(ipAddress, 100);
    return this.threatAnalyzer.analyzeIPThreat(ipInfo, recentEvents);
  }

  /**
   * Analyze threat for user
   */
  public analyzeUserThreat(userId: string): ThreatAssessment | null {
    const userProfile = this.eventTracker.getUserProfile(userId);
    if (!userProfile) return null;

    const recentEvents = this.eventTracker.getEventsByUser(userId, 100);
    return this.threatAnalyzer.analyzeUserThreat(userProfile, recentEvents);
  }

  /**
   * Get security statistics
   */
  public getSecurityStatistics(): SecurityStatistics {
    const eventStats = this.eventTracker.getEventStatistics();
    const ruleStats = this.ruleEngine.getRuleStatistics();
    const allIPInfo = this.eventTracker.getAllIPInfo();
    const allUserProfiles = this.eventTracker.getAllUserProfiles();

    const topRiskyIPs = allIPInfo
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    const topRiskyUsers = allUserProfiles
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      totalEvents: eventStats.totalEvents,
      eventsByType: eventStats.eventsByType,
      eventsBySeverity: eventStats.eventsBySeverity,
      blockedIPs: allIPInfo.filter(ip => ip.isBlocked).length,
      lockedUsers: allUserProfiles.filter(user => user.isLocked).length,
      recentEvents: this.eventTracker.getRecentEvents(50),
      topRiskyIPs,
      topRiskyUsers,
      alertsByRule: ruleStats.alertsByRule,
    };
  }

  /**
   * Get security alerts
   */
  public getSecurityAlerts(criteria?: {
    severity?: string;
    ruleId?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
  }): SecurityAlert[] {
    return this.ruleEngine.getAlerts(criteria);
  }

  /**
   * Acknowledge security alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    return this.ruleEngine.acknowledgeAlert(alertId, acknowledgedBy);
  }

  /**
   * Resolve security alert
   */
  public resolveAlert(alertId: string, resolvedBy: string): boolean {
    return this.ruleEngine.resolveAlert(alertId, resolvedBy);
  }

  /**
   * Generate comprehensive threat report
   */
  public generateThreatReport(): any {
    const recentEvents = this.eventTracker.getRecentEvents(5000);
    const ipTracking = this.eventTracker.getAllIPInfo();
    const userProfiles = this.eventTracker.getAllUserProfiles();

    return this.threatAnalyzer.generateThreatReport(recentEvents, ipTracking, userProfiles);
  }

  /**
   * Search security events
   */
  public searchEvents(criteria: {
    type?: SecurityEventType;
    severity?: string;
    ipAddress?: string;
    userId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    return this.eventTracker.searchEvents(criteria);
  }

  /**
   * Get events by IP address
   */
  public getEventsByIP(ipAddress: string, limit?: number): SecurityEvent[] {
    return this.eventTracker.getEventsByIP(ipAddress, limit);
  }

  /**
   * Get events by user
   */
  public getEventsByUser(userId: string, limit?: number): SecurityEvent[] {
    return this.eventTracker.getEventsByUser(userId, limit);
  }

  /**
   * Get IP information
   */
  public getIPInfo(ipAddress: string) {
    return this.eventTracker.getIPInfo(ipAddress);
  }

  /**
   * Get user security profile
   */
  public getUserProfile(userId: string) {
    return this.eventTracker.getUserProfile(userId);
  }

  /**
   * Add custom security rule
   */
  public addSecurityRule(rule: any): void {
    this.ruleEngine.addRule(rule);
  }

  /**
   * Remove security rule
   */
  public removeSecurityRule(ruleId: string): boolean {
    return this.ruleEngine.removeRule(ruleId);
  }

  /**
   * Enable/disable security rule
   */
  public setSecurityRuleEnabled(ruleId: string, enabled: boolean): boolean {
    return this.ruleEngine.setRuleEnabled(ruleId, enabled);
  }

  /**
   * Get all security rules
   */
  public getSecurityRules() {
    return this.ruleEngine.getAllRules();
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    this.cleanupTimer = setInterval(() => {
      this.performMaintenance();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform maintenance tasks
   */
  private performMaintenance(): void {
    devLog("info", "SecurityMonitor", "Performing security maintenance tasks");

    // Maintenance tasks are handled by individual components
    // This method can be extended for additional maintenance
  }

  /**
   * Export security data
   */
  public exportSecurityData(): {
    events: any[];
    ipTracking: any[];
    userProfiles: any[];
    rules: any[];
    alerts: any[];
    statistics: SecurityStatistics;
  } {
    const eventData = this.eventTracker.exportData();
    const ruleData = this.ruleEngine.exportData();

    return {
      events: eventData.events,
      ipTracking: eventData.ipTracking,
      userProfiles: eventData.userProfiles,
      rules: ruleData.rules,
      alerts: ruleData.alerts,
      statistics: this.getSecurityStatistics(),
    };
  }

  /**
   * Import security data
   */
  public importSecurityData(data: {
    events?: any[];
    ipTracking?: any[];
    userProfiles?: any[];
  }): void {
    this.eventTracker.importData(data);
    devLog("info", "SecurityMonitor", "Imported security data");
  }

  /**
   * Shutdown and cleanup
   */
  public shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.eventTracker.destroy();

    devLog("info", "SecurityMonitor", "Security monitor shutdown complete");
  }
}

/**
 * Global security monitor instance
 */
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * Middleware for automatic security monitoring
 */
export function createSecurityMiddleware() {
  return (req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    
    // Check if IP is blocked
    if (securityMonitor.isIPBlocked(clientIP)) {
      return res.status(403).json({ error: "IP address is blocked" });
    }

    // Record request event
    securityMonitor.recordEvent({
      type: "data_access",
      severity: "low",
      description: `API request to ${req.url}`,
      userId: req.user?.id,
      ipAddress: clientIP,
      userAgent: req.headers["user-agent"],
      endpoint: req.url,
      method: req.method,
      payload: req.method === "POST" ? req.body : undefined,
    });

    next();
  };
}