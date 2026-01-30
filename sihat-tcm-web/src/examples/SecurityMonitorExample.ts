/**
 * @fileoverview Security Monitor System Usage Examples
 * 
 * Demonstrates how to use the refactored modular security monitoring system
 * for threat detection, event tracking, and security analysis in Sihat TCM.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { 
  SecurityMonitor, 
  EventTracker, 
  SecurityRuleEngine, 
  ThreatAnalyzer 
} from "@/lib/monitoring/security";
import type { 
  SecurityEvent, 
  SecurityRule, 
  SecurityEventType,
  ThreatAssessment 
} from "@/lib/monitoring/security";

/**
 * Example 1: Basic security monitoring usage
 */
export function basicSecurityMonitoringExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Record various security events
  const recordSecurityEvents = () => {
    // Login attempt
    securityMonitor.recordEvent({
      type: "login_attempt",
      severity: "low",
      description: "User attempting to log in",
      userId: "user123",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      endpoint: "/api/auth/login",
      method: "POST",
    });

    // Failed login
    securityMonitor.recordEvent({
      type: "login_failure",
      severity: "medium",
      description: "Failed login attempt with incorrect password",
      userId: "user123",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      endpoint: "/api/auth/login",
      method: "POST",
    });

    // Suspicious activity
    securityMonitor.recordEvent({
      type: "suspicious_activity",
      severity: "high",
      description: "Multiple rapid requests from same IP",
      ipAddress: "10.0.0.50",
      userAgent: "curl/7.68.0",
      endpoint: "/api/users",
      method: "GET",
    });

    // SQL injection attempt
    securityMonitor.recordEvent({
      type: "injection_attempt",
      severity: "critical",
      description: "SQL injection detected in user input",
      ipAddress: "203.0.113.45",
      userAgent: "sqlmap/1.0",
      endpoint: "/api/search",
      method: "POST",
      payload: {
        query: "'; DROP TABLE users; --"
      },
    });
  };

  // Check security status
  const checkSecurityStatus = () => {
    // Check if IP is blocked
    const isBlocked = securityMonitor.isIPBlocked("203.0.113.45");
    console.log("IP blocked:", isBlocked);

    // Check if user is locked
    const isLocked = securityMonitor.isUserLocked("user123");
    console.log("User locked:", isLocked);

    // Get security statistics
    const stats = securityMonitor.getSecurityStatistics();
    console.log("Security stats:", stats);
  };

  return {
    recordSecurityEvents,
    checkSecurityStatus,
    getStatistics: () => securityMonitor.getSecurityStatistics(),
  };
}

/**
 * Example 2: Custom security rules
 */
export function customSecurityRulesExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Create custom security rule for TCM-specific threats
  const createTCMSecurityRule = (): SecurityRule => ({
    id: "tcm_data_scraping",
    name: "TCM Data Scraping Detection",
    description: "Detect systematic attempts to scrape TCM diagnostic data",
    type: "data_access",
    condition: (event, context) => {
      // Check for rapid access to diagnostic endpoints
      const recentEvents = context.recentEvents.filter(
        e => e.ipAddress === event.ipAddress &&
             e.endpoint?.includes("/api/diagnosis") &&
             e.timestamp > Date.now() - 300000 // Last 5 minutes
      );
      
      return recentEvents.length > 20; // More than 20 diagnostic requests in 5 minutes
    },
    action: async (event, context) => {
      // Block IP and send alert
      const ipInfo = context.ipTracking.get(event.ipAddress);
      if (ipInfo) {
        ipInfo.isBlocked = true;
        ipInfo.blockedUntil = Date.now() + 7200000; // 2 hours
      }
      
      console.log(`Blocked IP ${event.ipAddress} for TCM data scraping`);
    },
    enabled: true,
    severity: "high",
    priority: 1,
  });

  // Add the custom rule
  const addCustomRule = () => {
    const rule = createTCMSecurityRule();
    securityMonitor.addSecurityRule(rule);
    console.log("Added custom TCM security rule");
  };

  // Test the rule
  const testCustomRule = () => {
    // Simulate rapid diagnostic requests
    for (let i = 0; i < 25; i++) {
      securityMonitor.recordEvent({
        type: "data_access",
        severity: "low",
        description: `Diagnostic data request ${i + 1}`,
        ipAddress: "198.51.100.10",
        endpoint: "/api/diagnosis/analyze",
        method: "POST",
      });
    }
  };

  return {
    addCustomRule,
    testCustomRule,
    getAllRules: () => securityMonitor.getSecurityRules(),
  };
}

/**
 * Example 3: Threat analysis
 */
export function threatAnalysisExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Analyze IP threat
  const analyzeIPThreat = (ipAddress: string) => {
    const assessment = securityMonitor.analyzeIPThreat(ipAddress);
    
    if (assessment) {
      console.log(`IP Threat Assessment for ${ipAddress}:`, {
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        factors: assessment.factors,
        recommendations: assessment.recommendations,
        immediateActions: assessment.immediateActions,
      });
    }
    
    return assessment;
  };

  // Analyze user threat
  const analyzeUserThreat = (userId: string) => {
    const assessment = securityMonitor.analyzeUserThreat(userId);
    
    if (assessment) {
      console.log(`User Threat Assessment for ${userId}:`, {
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        factors: assessment.factors,
        recommendations: assessment.recommendations,
        immediateActions: assessment.immediateActions,
      });
    }
    
    return assessment;
  };

  // Generate comprehensive threat report
  const generateThreatReport = () => {
    const report = securityMonitor.generateThreatReport();
    
    console.log("Comprehensive Threat Report:", {
      summary: report.summary,
      topThreats: {
        criticalIPs: report.topThreats.ips.slice(0, 5),
        criticalUsers: report.topThreats.users.slice(0, 5),
      },
      attackPatterns: report.attackPatterns.map((p: any) => p.name),
      topRecommendations: report.recommendations.slice(0, 10),
    });
    
    return report;
  };

  return {
    analyzeIPThreat,
    analyzeUserThreat,
    generateThreatReport,
  };
}

/**
 * Example 4: Using individual components
 */
export function individualComponentsExample() {
  // Use event tracker directly
  const eventTracker = new EventTracker();
  
  const useEventTracker = () => {
    // Record events
    const event = eventTracker.recordEvent({
      type: "login_failure",
      severity: "medium",
      description: "Failed login attempt",
      userId: "testuser",
      ipAddress: "192.168.1.200",
    });

    // Get events by various criteria
    const ipEvents = eventTracker.getEventsByIP("192.168.1.200");
    const userEvents = eventTracker.getEventsByUser("testuser");
    const recentEvents = eventTracker.getRecentEvents(10);
    
    // Search events
    const searchResults = eventTracker.searchEvents({
      type: "login_failure",
      severity: "medium",
      startTime: Date.now() - 3600000, // Last hour
      limit: 20,
    });

    return {
      event,
      ipEvents,
      userEvents,
      recentEvents,
      searchResults,
    };
  };

  // Use threat analyzer directly
  const threatAnalyzer = new ThreatAnalyzer();
  
  const useThreatAnalyzer = () => {
    // Get attack patterns
    const patterns = threatAnalyzer.getAllAttackPatterns();
    
    // Analyze specific pattern
    const sqlInjectionPattern = threatAnalyzer.getAttackPattern("sql_injection_attack");
    
    return {
      patterns,
      sqlInjectionPattern,
    };
  };

  return {
    useEventTracker,
    useThreatAnalyzer,
  };
}

/**
 * Example 5: Security alerts management
 */
export function securityAlertsExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Get security alerts
  const getSecurityAlerts = () => {
    // Get all unresolved alerts
    const unresolvedAlerts = securityMonitor.getSecurityAlerts({
      resolved: false,
      limit: 50,
    });

    // Get critical alerts
    const criticalAlerts = securityMonitor.getSecurityAlerts({
      severity: "critical",
      limit: 20,
    });

    // Get alerts by rule
    const injectionAlerts = securityMonitor.getSecurityAlerts({
      ruleId: "sql_injection_attempt",
      limit: 10,
    });

    return {
      unresolvedAlerts,
      criticalAlerts,
      injectionAlerts,
    };
  };

  // Manage alerts
  const manageAlerts = () => {
    const alerts = securityMonitor.getSecurityAlerts({ limit: 5 });
    
    if (alerts.length > 0) {
      const alert = alerts[0];
      
      // Acknowledge alert
      const acknowledged = securityMonitor.acknowledgeAlert(alert.id, "security-team");
      console.log("Alert acknowledged:", acknowledged);
      
      // Resolve alert after investigation
      setTimeout(() => {
        const resolved = securityMonitor.resolveAlert(alert.id, "security-team");
        console.log("Alert resolved:", resolved);
      }, 5000);
    }
  };

  return {
    getSecurityAlerts,
    manageAlerts,
  };
}

/**
 * Example 6: Security middleware integration
 */
export function securityMiddlewareExample() {
  // This would typically be used in Express.js or Next.js API routes
  
  const setupSecurityMiddleware = () => {
    // Import the middleware
    // import { createSecurityMiddleware } from "@/lib/monitoring/security";
    
    // Use in Express app
    // app.use(createSecurityMiddleware());
    
    // Or in Next.js API route
    const handler = (req: any, res: any) => {
      // Security monitoring is automatically applied via middleware
      
      // Your API logic here
      res.json({ message: "API response" });
    };
    
    return handler;
  };

  // Manual security event recording in API routes
  const recordAPISecurityEvent = (req: any, eventType: SecurityEventType) => {
    const securityMonitor = SecurityMonitor.getInstance();
    
    securityMonitor.recordEvent({
      type: eventType,
      severity: eventType === "injection_attempt" ? "critical" : "medium",
      description: `${eventType} detected in API request`,
      userId: req.user?.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      endpoint: req.url,
      method: req.method,
      payload: req.body,
    });
  };

  return {
    setupSecurityMiddleware,
    recordAPISecurityEvent,
  };
}

/**
 * Example 7: Real-time security monitoring
 */
export function realTimeMonitoringExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Set up real-time monitoring dashboard
  const setupRealTimeMonitoring = () => {
    const monitoringInterval = setInterval(() => {
      const stats = securityMonitor.getSecurityStatistics();
      const alerts = securityMonitor.getSecurityAlerts({
        resolved: false,
        limit: 10,
      });

      // Update dashboard with current stats
      console.log("Real-time Security Stats:", {
        totalEvents: stats.totalEvents,
        blockedIPs: stats.blockedIPs,
        lockedUsers: stats.lockedUsers,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === "critical").length,
      });

      // Check for immediate threats
      const threatReport = securityMonitor.generateThreatReport();
      if (threatReport.summary.criticalThreats > 0) {
        console.log("🚨 CRITICAL THREATS DETECTED:", threatReport.summary);
      }
    }, 30000); // Every 30 seconds

    // Return cleanup function
    return () => clearInterval(monitoringInterval);
  };

  // Set up automated response system
  const setupAutomatedResponse = () => {
    // This would typically integrate with external systems
    const responseInterval = setInterval(() => {
      const criticalAlerts = securityMonitor.getSecurityAlerts({
        severity: "critical",
        acknowledged: false,
        limit: 5,
      });

      criticalAlerts.forEach(alert => {
        // Automated response actions
        console.log(`Automated response for critical alert: ${alert.id}`);
        
        // Could trigger:
        // - Automatic IP blocking
        // - User account suspension
        // - Notification to security team
        // - Integration with SIEM systems
      });
    }, 60000); // Every minute

    return () => clearInterval(responseInterval);
  };

  return {
    setupRealTimeMonitoring,
    setupAutomatedResponse,
  };
}

/**
 * Example 8: Security reporting and analytics
 */
export function securityReportingExample() {
  const securityMonitor = SecurityMonitor.getInstance();

  // Generate daily security report
  const generateDailyReport = () => {
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);

    const dailyEvents = securityMonitor.searchEvents({
      startTime: yesterday,
      endTime: now,
    });

    const report = {
      period: {
        start: new Date(yesterday).toISOString(),
        end: new Date(now).toISOString(),
      },
      summary: {
        totalEvents: dailyEvents.length,
        eventsByType: dailyEvents.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        eventsBySeverity: dailyEvents.reduce((acc, event) => {
          acc[event.severity] = (acc[event.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      threats: securityMonitor.generateThreatReport(),
      alerts: securityMonitor.getSecurityAlerts({
        limit: 100,
      }),
    };

    console.log("Daily Security Report:", report);
    return report;
  };

  // Export security data for external analysis
  const exportSecurityData = () => {
    const data = securityMonitor.exportSecurityData();
    
    // Could save to file or send to analytics service
    console.log("Exported Security Data:", {
      eventCount: data.events.length,
      ipCount: data.ipTracking.length,
      userCount: data.userProfiles.length,
      ruleCount: data.rules.length,
      alertCount: data.alerts.length,
    });

    return data;
  };

  return {
    generateDailyReport,
    exportSecurityData,
  };
}