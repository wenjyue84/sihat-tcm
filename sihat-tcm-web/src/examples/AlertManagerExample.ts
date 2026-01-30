/**
 * @fileoverview Alert Manager System Usage Examples
 * 
 * Demonstrates how to use the refactored modular alert management system
 * for monitoring, alerting, and incident management in Sihat TCM.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { 
  AlertManager, 
  MetricCollector, 
  AlertRuleEngine, 
  NotificationDispatcher,
  IncidentManager 
} from "@/lib/monitoring/alerts";
import type { 
  AlertRule, 
  NotificationChannel, 
  Alert,
  AlertSeverity 
} from "@/lib/monitoring/alerts";

/**
 * Example 1: Basic alert manager usage
 */
export function basicAlertManagerExample() {
  const alertManager = AlertManager.getInstance();

  // Record metrics that will be evaluated against alert rules
  const recordSystemMetrics = () => {
    // API performance metrics
    alertManager.recordMetric("api_response_time", 3500); // milliseconds
    alertManager.recordMetric("error_rate", 2.5); // percentage
    
    // Database health
    alertManager.recordMetric("database_health", 1); // 1 = healthy, 0 = unhealthy
    
    // AI service metrics
    alertManager.recordMetric("ai_success_rate", 95); // percentage
    
    // Security metrics
    alertManager.recordMetric("failed_login_attempts", 3);
  };

  // Send manual alert
  const sendManualAlert = async () => {
    await alertManager.sendAlert({
      type: "system_maintenance",
      message: "Scheduled maintenance starting in 30 minutes",
      severity: "warning",
      metadata: {
        maintenanceWindow: "2024-01-15 02:00-04:00 UTC",
        affectedServices: ["api", "database"],
      },
    });
  };

  return {
    recordSystemMetrics,
    sendManualAlert,
    getActiveAlerts: () => alertManager.getActiveAlerts(),
    getStatistics: () => alertManager.getAlertStatistics(),
  };
}

/**
 * Example 2: Custom alert rules
 */
export function customAlertRulesExample() {
  const alertManager = AlertManager.getInstance();

  // Create custom alert rule for TCM-specific metrics
  const createTCMAlertRule = (): AlertRule => ({
    id: "tcm_diagnosis_failure_rate",
    name: "High TCM Diagnosis Failure Rate",
    description: "TCM diagnosis success rate has dropped below acceptable threshold",
    category: "ai_service",
    severity: "error",
    condition: {
      metric: "tcm_diagnosis_success_rate",
      operator: "lt",
      threshold: 85, // 85%
      timeWindow: 600000, // 10 minutes
      consecutiveFailures: 3,
    },
    enabled: true,
    cooldownPeriod: 900000, // 15 minutes
    escalationDelay: 1800000, // 30 minutes
    notificationChannels: [
      {
        type: "slack",
        config: { channel: "#tcm-alerts" },
        enabled: true,
      },
      {
        type: "email",
        config: { recipients: ["tcm-team@sihat-tcm.com"] },
        enabled: true,
      },
    ],
  });

  // Add the custom rule
  const addCustomRule = () => {
    const rule = createTCMAlertRule();
    alertManager.addAlertRule(rule);
    console.log("Added custom TCM alert rule");
  };

  // Test the rule by recording metrics
  const testCustomRule = () => {
    // Simulate declining diagnosis success rate
    alertManager.recordMetric("tcm_diagnosis_success_rate", 82); // Below threshold
    alertManager.recordMetric("tcm_diagnosis_success_rate", 80); // Still below
    alertManager.recordMetric("tcm_diagnosis_success_rate", 78); // Third consecutive failure
  };

  return {
    addCustomRule,
    testCustomRule,
    getAllRules: () => alertManager.getAllAlertRules(),
  };
}

/**
 * Example 3: Using individual components
 */
export function individualComponentsExample() {
  // Use metric collector directly
  const metricCollector = new MetricCollector();
  
  const useMetricCollector = () => {
    // Record various metrics
    metricCollector.recordMetric("user_sessions", 150);
    metricCollector.recordMetric("memory_usage", 75.5);
    metricCollector.recordMetric("cpu_usage", 45.2);

    // Get metric statistics
    const stats = metricCollector.getMetricStatistics("user_sessions", 3600000); // Last hour
    console.log("User sessions stats:", stats);

    // Check for consecutive failures
    const hasFailures = metricCollector.hasConsecutiveFailures(
      "memory_usage",
      80, // threshold
      "gt", // greater than
      3, // consecutive count
      1800000 // 30 minutes
    );
    
    return { stats, hasFailures };
  };

  // Use notification dispatcher directly
  const notificationDispatcher = new NotificationDispatcher();
  
  const testNotifications = async () => {
    const testChannel: NotificationChannel = {
      type: "slack",
      config: { channel: "#test-alerts" },
      enabled: true,
    };

    const success = await notificationDispatcher.testChannel(testChannel);
    console.log("Notification test result:", success);
    
    return success;
  };

  return {
    useMetricCollector,
    testNotifications,
  };
}

/**
 * Example 4: Incident management
 */
export function incidentManagementExample() {
  const alertManager = AlertManager.getInstance();

  // Create a critical alert that will trigger an incident
  const createCriticalAlert = async () => {
    await alertManager.sendAlert({
      type: "database_outage",
      message: "Primary database is not responding",
      severity: "critical",
      metadata: {
        database: "primary-postgres",
        lastResponse: Date.now() - 300000, // 5 minutes ago
        affectedUsers: 1500,
      },
    });
  };

  // Manage incident lifecycle
  const manageIncident = () => {
    const incidents = alertManager.getOpenIncidents();
    
    if (incidents.length > 0) {
      const incident = incidents[0];
      
      // Assign incident to engineer
      alertManager.assignIncident(incident.id, "john.doe@sihat-tcm.com", "system");
      
      // Update incident status
      alertManager.updateIncidentStatus(
        incident.id, 
        "investigating", 
        "john.doe@sihat-tcm.com",
        "Started investigating database connectivity issues"
      );
      
      // Later, resolve the incident
      setTimeout(() => {
        alertManager.updateIncidentStatus(
          incident.id, 
          "resolved", 
          "john.doe@sihat-tcm.com",
          "Database connectivity restored after failover to secondary"
        );
      }, 30000); // Simulate 30 second resolution
    }
  };

  return {
    createCriticalAlert,
    manageIncident,
    getOpenIncidents: () => alertManager.getOpenIncidents(),
  };
}

/**
 * Example 5: Health monitoring integration
 */
export function healthMonitoringExample() {
  const alertManager = AlertManager.getInstance();

  // Simulate health check results
  const performHealthChecks = async () => {
    try {
      // Check API health
      const apiStart = Date.now();
      const apiResponse = await fetch("/api/health");
      const apiTime = Date.now() - apiStart;
      
      alertManager.recordMetric("api_response_time", apiTime);
      
      if (apiResponse.ok) {
        const healthData = await apiResponse.json();
        
        // Record component health
        alertManager.recordMetric("database_health", healthData.database === "healthy" ? 1 : 0);
        alertManager.recordMetric("ai_service_health", healthData.ai_service === "healthy" ? 1 : 0);
        
        // Record performance metrics
        if (healthData.metrics) {
          alertManager.recordMetric("memory_usage", healthData.metrics.memory_usage || 0);
          alertManager.recordMetric("cpu_usage", healthData.metrics.cpu_usage || 0);
        }
      } else {
        // API is down
        alertManager.recordMetric("api_health", 0);
      }
    } catch (error) {
      // Health check failed
      alertManager.recordMetric("api_health", 0);
      alertManager.recordMetric("api_response_time", 30000); // Timeout
    }
  };

  // Set up periodic health monitoring
  const startHealthMonitoring = () => {
    const interval = setInterval(performHealthChecks, 60000); // Every minute
    
    // Return cleanup function
    return () => clearInterval(interval);
  };

  return {
    performHealthChecks,
    startHealthMonitoring,
  };
}

/**
 * Example 6: Advanced notification configuration
 */
export function advancedNotificationExample() {
  const alertManager = AlertManager.getInstance();

  // Create rule with multiple notification channels
  const createMultiChannelRule = (): AlertRule => ({
    id: "critical_system_failure",
    name: "Critical System Failure",
    description: "Multiple system components are failing",
    category: "system_health",
    severity: "critical",
    condition: {
      metric: "system_health_score",
      operator: "lt",
      threshold: 50,
      timeWindow: 300000, // 5 minutes
      consecutiveFailures: 2,
    },
    enabled: true,
    cooldownPeriod: 300000, // 5 minutes
    escalationDelay: 600000, // 10 minutes
    notificationChannels: [
      {
        type: "slack",
        config: { 
          channel: "#critical-alerts",
          mention: "@oncall-engineer" 
        },
        enabled: true,
      },
      {
        type: "email",
        config: { 
          recipients: [
            "oncall@sihat-tcm.com",
            "cto@sihat-tcm.com"
          ]
        },
        enabled: true,
      },
      {
        type: "pagerduty",
        config: { 
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY 
        },
        enabled: process.env.NODE_ENV === "production",
      },
      {
        type: "webhook",
        config: { 
          url: "https://monitoring.sihat-tcm.com/webhooks/alerts",
          headers: {
            "Authorization": `Bearer ${process.env.MONITORING_API_KEY}`
          }
        },
        enabled: true,
      },
    ],
  });

  const setupAdvancedAlerting = () => {
    const rule = createMultiChannelRule();
    alertManager.addAlertRule(rule);
    
    // Test the rule
    alertManager.recordMetric("system_health_score", 45); // Below threshold
    alertManager.recordMetric("system_health_score", 40); // Second consecutive failure
  };

  return {
    setupAdvancedAlerting,
    createMultiChannelRule,
  };
}

/**
 * Example 7: Alert analytics and reporting
 */
export function alertAnalyticsExample() {
  const alertManager = AlertManager.getInstance();

  // Generate alert report
  const generateAlertReport = () => {
    const stats = alertManager.getAlertStatistics();
    const alerts = alertManager.getAllAlerts();
    const incidents = alertManager.getOpenIncidents();

    // Calculate additional metrics
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentAlerts = alerts.filter(alert => alert.timestamp > last24Hours);
    
    const alertsByHour = recentAlerts.reduce((acc, alert) => {
      const hour = new Date(alert.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const report = {
      summary: stats,
      trends: {
        alertsByHour,
        peakHour: Object.entries(alertsByHour)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 0,
      },
      activeIncidents: incidents.map(incident => ({
        id: incident.id,
        severity: incident.severity,
        age: Date.now() - incident.createdAt,
        alertCount: incident.alerts.length,
      })),
      topAlertCategories: Object.entries(stats.alertsByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
    };

    return report;
  };

  // Export data for external analysis
  const exportAlertData = () => {
    const data = alertManager.exportData();
    
    // Could save to file or send to analytics service
    console.log("Exported alert data:", {
      alertCount: data.alerts.length,
      incidentCount: data.incidents.length,
      ruleCount: data.rules.length,
      metricCount: Object.keys(data.metrics).length,
    });

    return data;
  };

  return {
    generateAlertReport,
    exportAlertData,
  };
}

/**
 * Example 8: Testing and validation
 */
export function testingExample() {
  const alertManager = AlertManager.getInstance();

  // Test alert rule validation
  const testRuleValidation = () => {
    const invalidRule: Partial<AlertRule> = {
      id: "", // Invalid: empty ID
      name: "Test Rule",
      // Missing required fields
    };

    // This would fail validation in a real implementation
    console.log("Testing rule validation with invalid rule");
  };

  // Test notification channels
  const testAllChannels = async () => {
    const channels: NotificationChannel[] = [
      {
        type: "slack",
        config: { channel: "#test" },
        enabled: true,
      },
      {
        type: "email",
        config: { recipients: ["test@example.com"] },
        enabled: true,
      },
    ];

    const results = await Promise.all(
      channels.map(channel => alertManager.testNotificationChannel(channel))
    );

    return results;
  };

  // Simulate alert scenarios
  const simulateAlertScenarios = () => {
    // Scenario 1: Gradual performance degradation
    setTimeout(() => alertManager.recordMetric("api_response_time", 4000), 1000);
    setTimeout(() => alertManager.recordMetric("api_response_time", 5500), 2000);
    setTimeout(() => alertManager.recordMetric("api_response_time", 7000), 3000);

    // Scenario 2: Sudden critical failure
    setTimeout(() => alertManager.recordMetric("database_health", 0), 5000);

    // Scenario 3: Recovery
    setTimeout(() => alertManager.recordMetric("database_health", 1), 10000);
    setTimeout(() => alertManager.recordMetric("api_response_time", 2000), 11000);
  };

  return {
    testRuleValidation,
    testAllChannels,
    simulateAlertScenarios,
  };
}