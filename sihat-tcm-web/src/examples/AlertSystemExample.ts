/**
 * Alert System Example
 * 
 * Comprehensive examples demonstrating the refactored alert system.
 * Shows how to use the modular components for monitoring and alerting.
 */

import {
  AlertSystemManager,
  createAlertSystemManager,
  createAlertRuleEngine,
  createMetricCollector,
  createNotificationDispatcher,
  recordMetric,
  sendAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertStatistics,
} from '../lib/monitoring/alerts';
import type {
  AlertRule,
  AlertSeverity,
  AlertCategory,
  NotificationChannel,
  ManualAlertData,
} from '../lib/monitoring/alerts';

/**
 * Example 1: Basic Alert System Setup
 */
export async function basicAlertSystemExample() {
  console.log('=== Basic Alert System Example ===');

  try {
    // Initialize the alert system manager
    const alertSystem = createAlertSystemManager({
      enabled: true,
      healthCheckInterval: 30000, // 30 seconds for demo
    });

    await alertSystem.initialize();
    console.log('✅ Alert system initialized');

    // Get default rules from the rule engine
    const ruleEngine = alertSystem.getRuleEngine();
    const rules = ruleEngine.getRules();
    console.log(`📋 Loaded ${rules.length} default alert rules:`);
    rules.forEach(rule => {
      console.log(`  - ${rule.name} (${rule.severity}): ${rule.description}`);
    });

    // Record some sample metrics using the convenience function
    console.log('📊 Recording sample metrics...');
    recordMetric('api_response_time', 2500);
    recordMetric('error_rate', 2.5);
    recordMetric('database_health', 1);

    // Get metric statistics
    const metricCollector = alertSystem.getMetricCollector();
    const apiStats = metricCollector.getMetricStatistics('api_response_time');
    console.log('📈 API Response Time Stats:', apiStats);

    return { success: true, rules, stats: apiStats };

  } catch (error) {
    console.error('❌ Basic alert system example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 2: Custom Alert Rules
 */
export async function customAlertRulesExample() {
  console.log('=== Custom Alert Rules Example ===');

  try {
    const alertSystem = createAlertSystemManager();
    const ruleEngine = alertSystem.getRuleEngine();

    // Create custom notification channels
    const customChannels: NotificationChannel[] = [
      {
        id: 'custom_slack',
        type: 'slack',
        name: 'Custom Slack Channel',
        config: { 
          channel: '#tcm-alerts',
          webhook: process.env.SLACK_WEBHOOK_URL 
        },
        enabled: true,
      },
      {
        id: 'custom_email',
        type: 'email',
        name: 'TCM Team Email',
        config: { 
          recipients: ['tcm-team@sihat-tcm.com'],
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
          }
        },
        enabled: true,
      },
    ];

    // Create custom alert rules for TCM-specific metrics
    const customRules: AlertRule[] = [
      {
        id: 'tcm_diagnosis_failure_rate',
        name: 'TCM Diagnosis Failure Rate',
        description: 'TCM diagnosis success rate is below acceptable threshold',
        category: 'ai_service',
        severity: 'error',
        condition: {
          metric: 'tcm_diagnosis_success_rate',
          operator: 'lt',
          threshold: 95, // 95%
          timeWindow: 600000, // 10 minutes
          consecutiveFailures: 3,
        },
        enabled: true,
        cooldownPeriod: 900000, // 15 minutes
        escalationDelay: 1800000, // 30 minutes
        notificationChannels: customChannels,
      },
      {
        id: 'user_session_timeout',
        name: 'High User Session Timeout Rate',
        description: 'Users are experiencing frequent session timeouts',
        category: 'user_experience',
        severity: 'warning',
        condition: {
          metric: 'session_timeout_rate',
          operator: 'gt',
          threshold: 10, // 10%
          timeWindow: 300000, // 5 minutes
          consecutiveFailures: 2,
        },
        enabled: true,
        cooldownPeriod: 600000, // 10 minutes
        escalationDelay: 1200000, // 20 minutes
        notificationChannels: [customChannels[0]], // Only Slack
      },
      {
        id: 'gemini_api_quota_exceeded',
        name: 'Gemini API Quota Exceeded',
        description: 'Gemini API quota usage is approaching limits',
        category: 'ai_service',
        severity: 'critical',
        condition: {
          metric: 'gemini_quota_usage_percent',
          operator: 'gt',
          threshold: 90, // 90%
          timeWindow: 60000, // 1 minute
          consecutiveFailures: 1,
        },
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
        escalationDelay: 600000, // 10 minutes
        notificationChannels: customChannels,
      },
    ];

    // Add custom rules to the engine
    customRules.forEach(rule => {
      ruleEngine.addRule(rule);
      console.log(`➕ Added custom rule: ${rule.name}`);
    });

    // Get updated rule statistics
    const stats = ruleEngine.getStatistics();
    console.log('📊 Rule Engine Statistics:', stats);

    return { success: true, customRules, stats };

  } catch (error) {
    console.error('❌ Custom alert rules example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 3: Metric Collection and Alert Triggering
 */
export async function metricCollectionExample() {
  console.log('=== Metric Collection and Alert Triggering Example ===');

  try {
    const alertSystem = createAlertSystemManager();
    await alertSystem.initialize();

    // Simulate metric collection over time
    console.log('📊 Simulating metric collection...');

    const metrics = [
      { name: 'api_response_time', values: [1500, 2000, 3000, 4500, 6000, 8000] },
      { name: 'error_rate', values: [1, 2, 3, 4, 6, 8] },
      { name: 'tcm_diagnosis_success_rate', values: [98, 96, 94, 92, 89, 85] },
      { name: 'gemini_quota_usage_percent', values: [70, 75, 80, 85, 92, 95] },
    ];

    const alerts: any[] = [];

    // Simulate data collection over 6 time periods
    for (let i = 0; i < 6; i++) {
      console.log(`\n⏰ Time period ${i + 1}:`);
      
      // Record metrics for this time period
      for (const metric of metrics) {
        const value = metric.values[i];
        recordMetric(metric.name, value);
        console.log(`  📈 ${metric.name}: ${value}`);
      }

      // Check for any new alerts
      const activeAlerts = getActiveAlerts();
      const newAlerts = activeAlerts.filter(alert => 
        !alerts.some(existing => existing.id === alert.id)
      );

      newAlerts.forEach(alert => {
        console.log(`  🚨 ALERT TRIGGERED: ${alert.title}`);
        console.log(`     Severity: ${alert.severity.toUpperCase()}`);
        console.log(`     Category: ${alert.category}`);
        
        alerts.push({
          id: alert.id,
          rule: alert.title,
          severity: alert.severity,
          timestamp: alert.timestamp,
        });
      });

      // Wait a bit between periods (in real scenario, this would be actual time)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📋 Summary: ${alerts.length} alerts triggered`);
    alerts.forEach((alert, index) => {
      console.log(`  ${index + 1}. ${alert.rule} (${alert.severity})`);
    });

    // Get final statistics
    const finalStats = getAlertStatistics();
    console.log('\n📊 Final Alert Statistics:', finalStats);

    return { success: true, alerts, finalStats };

  } catch (error) {
    console.error('❌ Metric collection example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 4: Notification System Integration
 */
export async function notificationSystemExample() {
  console.log('=== Notification System Integration Example ===');

  try {
    const alertSystem = createAlertSystemManager();
    const notificationDispatcher = alertSystem.getNotificationDispatcher();

    // Create test notification channels
    const testChannels: NotificationChannel[] = [
      {
        id: 'test_console',
        type: 'webhook',
        name: 'Console Logger',
        config: { 
          url: 'http://localhost:3000/api/test-webhook',
          method: 'POST'
        },
        enabled: true,
      },
    ];

    // Send a test alert using the convenience function
    console.log('📧 Testing notification delivery...');

    const testAlertData: ManualAlertData = {
      type: 'test_alert',
      message: 'This is a test alert for demonstration purposes',
      severity: 'warning' as AlertSeverity,
      category: 'system_health' as AlertCategory,
      metadata: {
        testMode: true,
        exampleData: 'This is example metadata',
      },
    };

    const testAlert = await sendAlert(testAlertData);
    console.log('✅ Test alert created:', testAlert.id);

    // Test each channel
    for (const channel of testChannels) {
      console.log(`  Testing ${channel.name} (${channel.type})...`);
      
      try {
        const result = await notificationDispatcher.sendNotificationToChannel(testAlert, channel);
        
        if (result.success) {
          console.log(`  ✅ ${channel.name}: Delivered successfully`);
        } else {
          console.log(`  ❌ ${channel.name}: Failed - ${result.error}`);
        }
      } catch (error) {
        console.log(`  ❌ ${channel.name}: Exception - ${error}`);
      }
    }

    // Test batch notification
    console.log('\n📨 Testing batch notification...');
    const batchResults = await notificationDispatcher.sendNotification(testAlert, testChannels);
    
    console.log(`📊 Batch Results: ${batchResults.length} delivery attempts`);
    batchResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.channelType}: ${result.success ? 'Success' : result.error}`);
    });

    // Resolve the test alert
    resolveAlert(testAlert.id, 'test_system');
    console.log('🔄 Test alert resolved');

    return { success: true, testAlert, batchResults };

  } catch (error) {
    console.error('❌ Notification system example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 5: Advanced Alert Management
 */
export async function advancedAlertManagementExample() {
  console.log('=== Advanced Alert Management Example ===');

  try {
    const alertSystem = createAlertSystemManager();
    const ruleEngine = alertSystem.getRuleEngine();
    const metricCollector = alertSystem.getMetricCollector();

    // Test rule management operations
    console.log('🔧 Testing rule management operations...');

    // Get initial rule count
    const initialRules = ruleEngine.getRules();
    console.log(`📋 Initial rules: ${initialRules.length}`);

    // Disable a rule
    const ruleToDisable = initialRules[0];
    const disabled = ruleEngine.disableRule(ruleToDisable.id);
    console.log(`🔇 Disabled rule "${ruleToDisable.name}": ${disabled}`);

    // Update a rule
    const ruleToUpdate = initialRules[1];
    const updated = ruleEngine.updateRule(ruleToUpdate.id, {
      condition: {
        ...ruleToUpdate.condition,
        threshold: 10000, // Increase threshold
      }
    });
    console.log(`📝 Updated rule "${ruleToUpdate.name}": ${updated}`);

    // Add labels to metrics
    console.log('\n🏷️ Testing labeled metrics...');
    recordMetric('api_response_time', 1500, { 
      service: 'diagnosis',
      region: 'us-east-1' 
    });
    recordMetric('api_response_time', 2500, { 
      service: 'meal-planner',
      region: 'us-east-1' 
    });
    recordMetric('api_response_time', 1800, { 
      service: 'diagnosis',
      region: 'eu-west-1' 
    });

    // Query metrics by labels
    const diagnosisMetrics = metricCollector.getMetricsByLabels({ service: 'diagnosis' });
    console.log(`🔍 Found ${diagnosisMetrics.size} metrics for diagnosis service`);

    // Test metric aggregation
    console.log('\n📊 Testing metric aggregation...');
    
    // Record multiple values for aggregation testing
    for (let i = 0; i < 10; i++) {
      recordMetric('test_metric', Math.random() * 100);
    }

    const avgValue = metricCollector.getAggregatedValue('test_metric', 60000, 'avg');
    const maxValue = metricCollector.getAggregatedValue('test_metric', 60000, 'max');
    const minValue = metricCollector.getAggregatedValue('test_metric', 60000, 'min');

    console.log(`📈 Aggregated values - Avg: ${avgValue?.toFixed(2)}, Max: ${maxValue?.toFixed(2)}, Min: ${minValue?.toFixed(2)}`);

    // Get comprehensive statistics
    const ruleStats = ruleEngine.getStatistics();
    const alertStats = getAlertStatistics();

    console.log('\n📊 Final Statistics:');
    console.log('  Rules:', ruleStats);
    console.log('  Alerts:', alertStats);

    return { 
      success: true, 
      ruleStats, 
      alertStats,
      labeledMetrics: diagnosisMetrics.size,
      aggregatedValues: { avg: avgValue, max: maxValue, min: minValue }
    };

  } catch (error) {
    console.error('❌ Advanced alert management example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 6: Complete Alert System Workflow
 */
export async function completeAlertSystemWorkflow() {
  console.log('=== Complete Alert System Workflow ===');

  try {
    console.log('🚀 Starting complete alert system workflow...');

    // Step 1: Basic setup
    const basicResult = await basicAlertSystemExample();
    if (!basicResult.success) {
      throw new Error('Basic setup failed');
    }

    // Step 2: Custom rules
    const customResult = await customAlertRulesExample();
    if (!customResult.success) {
      throw new Error('Custom rules setup failed');
    }

    // Step 3: Metric collection and alerting
    const metricResult = await metricCollectionExample();
    if (!metricResult.success) {
      throw new Error('Metric collection failed');
    }

    // Step 4: Notification testing
    const notificationResult = await notificationSystemExample();
    if (!notificationResult.success) {
      console.warn('⚠️ Notification testing had issues, but continuing...');
    }

    // Step 5: Advanced management
    const advancedResult = await advancedAlertManagementExample();
    if (!advancedResult.success) {
      throw new Error('Advanced management failed');
    }

    console.log('🎉 Complete alert system workflow completed successfully!');

    return {
      success: true,
      results: {
        basic: basicResult,
        custom: customResult,
        metrics: metricResult,
        notifications: notificationResult,
        advanced: advancedResult,
      }
    };

  } catch (error) {
    console.error('❌ Complete alert system workflow failed:', error);
    return { success: false, error };
  }
}

/**
 * Run all alert system examples
 */
export async function runAllAlertSystemExamples() {
  console.log('🔄 Running all alert system examples...\n');

  const examples = [
    { name: 'Basic Alert System', fn: basicAlertSystemExample },
    { name: 'Custom Alert Rules', fn: customAlertRulesExample },
    { name: 'Metric Collection', fn: metricCollectionExample },
    { name: 'Notification System', fn: notificationSystemExample },
    { name: 'Advanced Management', fn: advancedAlertManagementExample },
    { name: 'Complete Workflow', fn: completeAlertSystemWorkflow },
  ];

  const results = [];

  for (const example of examples) {
    console.log(`\n--- ${example.name} ---`);
    try {
      const result = await example.fn();
      results.push({ name: example.name, ...result });
      console.log(`✅ ${example.name} completed\n`);
    } catch (error) {
      console.error(`❌ ${example.name} failed:`, error);
      results.push({ name: example.name, success: false, error });
    }
  }

  // Summary
  console.log('\n=== ALERT SYSTEM EXAMPLES SUMMARY ===');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });

  return results;
}

// Export individual examples for selective testing
export {
  basicAlertSystemExample,
  customAlertRulesExample,
  metricCollectionExample,
  notificationSystemExample,
  advancedAlertManagementExample,
  completeAlertSystemWorkflow,
};