/**
 * @fileoverview Deployment Configuration
 * 
 * Centralized configuration for deployment pipeline settings,
 * environment-specific configurations, and deployment strategies.
 * 
 * @author Sihat TCM Development Team
 * @version 3.0
 */

const deploymentConfig = {
  // Environment configurations
  environments: {
    development: {
      name: 'development',
      url: 'http://localhost:3100',
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      ai: {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY
      },
      monitoring: {
        enabled: false,
        logLevel: 'debug'
      },
      features: {
        maintenanceMode: false,
        debugMode: true,
        performanceMonitoring: false
      }
    },
    
    staging: {
      name: 'staging',
      url: 'https://staging.sihat-tcm.com',
      database: {
        url: process.env.STAGING_SUPABASE_URL,
        key: process.env.STAGING_SUPABASE_ANON_KEY,
        serviceKey: process.env.STAGING_SUPABASE_SERVICE_KEY
      },
      ai: {
        provider: 'gemini',
        apiKey: process.env.STAGING_GEMINI_API_KEY
      },
      monitoring: {
        enabled: true,
        logLevel: 'info',
        webhookUrl: process.env.MONITORING_WEBHOOK,
        slackWebhook: process.env.SLACK_WEBHOOK
      },
      features: {
        maintenanceMode: false,
        debugMode: false,
        performanceMonitoring: true
      },
      deployment: {
        healthCheckRetries: 5,
        healthCheckTimeout: 30000,
        rollbackEnabled: true,
        backupEnabled: true
      }
    },
    
    production: {
      name: 'production',
      url: 'https://sihat-tcm.com',
      database: {
        url: process.env.PROD_SUPABASE_URL,
        key: process.env.PROD_SUPABASE_ANON_KEY,
        serviceKey: process.env.PROD_SUPABASE_SERVICE_KEY
      },
      ai: {
        provider: 'gemini',
        apiKey: process.env.PROD_GEMINI_API_KEY
      },
      monitoring: {
        enabled: true,
        logLevel: 'warn',
        webhookUrl: process.env.MONITORING_WEBHOOK,
        slackWebhook: process.env.SLACK_WEBHOOK,
        alertEmail: process.env.ALERT_EMAIL
      },
      features: {
        maintenanceMode: false,
        debugMode: false,
        performanceMonitoring: true,
        errorTracking: true,
        analytics: true
      },
      deployment: {
        healthCheckRetries: 10,
        healthCheckTimeout: 60000,
        rollbackEnabled: true,
        backupEnabled: true,
        maintenanceModeEnabled: true,
        deploymentWindow: {
          enabled: true,
          allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
          allowedHours: { start: 9, end: 17 }, // 9 AM to 5 PM UTC
          timezone: 'UTC'
        }
      },
      security: {
        forceHttps: true,
        corsOrigins: ['https://sihat-tcm.com'],
        rateLimiting: {
          enabled: true,
          apiLimit: 1000,
          aiLimit: 50,
          guestLimit: 100
        }
      }
    }
  },

  // Deployment strategies
  strategies: {
    blueGreen: {
      name: 'Blue-Green Deployment',
      description: 'Deploy to parallel environment, then switch traffic',
      enabled: false, // Not implemented yet
      settings: {
        healthCheckDuration: 300000, // 5 minutes
        trafficSwitchDelay: 60000 // 1 minute
      }
    },
    
    rolling: {
      name: 'Rolling Deployment',
      description: 'Gradual replacement of instances',
      enabled: false, // Not applicable for Vercel
      settings: {
        batchSize: 1,
        healthCheckInterval: 30000
      }
    },
    
    canary: {
      name: 'Canary Deployment',
      description: 'Deploy to subset of users first',
      enabled: false, // Future enhancement
      settings: {
        canaryPercentage: 10,
        monitoringDuration: 600000 // 10 minutes
      }
    },
    
    immediate: {
      name: 'Immediate Deployment',
      description: 'Direct deployment with health checks',
      enabled: true,
      settings: {
        preDeploymentChecks: true,
        postDeploymentMonitoring: true,
        automaticRollback: true
      }
    }
  },

  // Health check configurations
  healthChecks: {
    endpoints: [
      {
        path: '/api/monitoring/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 30000,
        critical: true
      },
      {
        path: '/api/monitoring/metrics',
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        critical: false
      },
      {
        path: '/',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        critical: true,
        contentCheck: 'Sihat TCM'
      }
    ],
    
    database: {
      enabled: true,
      timeout: 15000,
      query: 'SELECT 1',
      critical: true
    },
    
    externalServices: {
      ai: {
        enabled: true,
        timeout: 30000,
        critical: false
      },
      storage: {
        enabled: false,
        timeout: 10000,
        critical: false
      }
    }
  },

  // Monitoring configurations
  monitoring: {
    metrics: {
      collection: {
        interval: 60000, // 1 minute
        batchSize: 100,
        retention: 2592000000 // 30 days
      },
      
      thresholds: {
        responseTime: {
          warning: 2000,
          critical: 5000
        },
        errorRate: {
          warning: 1, // 1%
          critical: 5 // 5%
        },
        availability: {
          warning: 99, // 99%
          critical: 95 // 95%
        }
      }
    },
    
    alerts: {
      channels: {
        slack: {
          enabled: true,
          webhook: process.env.SLACK_WEBHOOK,
          channels: {
            info: '#deployments',
            warning: '#alerts',
            critical: '#production-alerts'
          }
        },
        email: {
          enabled: true,
          recipients: [process.env.ALERT_EMAIL].filter(Boolean)
        },
        webhook: {
          enabled: true,
          url: process.env.MONITORING_WEBHOOK
        }
      },
      
      rules: {
        deploymentFailure: {
          severity: 'critical',
          channels: ['slack', 'email', 'webhook']
        },
        healthCheckFailure: {
          severity: 'critical',
          channels: ['slack', 'email']
        },
        performanceDegradation: {
          severity: 'warning',
          channels: ['slack']
        },
        rollbackTriggered: {
          severity: 'critical',
          channels: ['slack', 'email', 'webhook']
        }
      }
    }
  },

  // Rollback configurations
  rollback: {
    automatic: {
      enabled: true,
      triggers: [
        'healthCheckFailure',
        'criticalErrorThreshold',
        'performanceThreshold'
      ],
      conditions: {
        healthCheckFailures: 3,
        errorRateThreshold: 10, // 10%
        responseTimeThreshold: 10000 // 10 seconds
      }
    },
    
    manual: {
      enabled: true,
      requiresApproval: true,
      approvers: ['admin', 'devops'],
      maxRollbackAge: 2592000000 // 30 days
    },
    
    validation: {
      postRollbackChecks: true,
      verificationTimeout: 300000, // 5 minutes
      requiredSuccessRate: 95 // 95%
    }
  },

  // Backup configurations
  backup: {
    database: {
      enabled: true,
      preDeployment: true,
      retention: 2592000000, // 30 days
      compression: true,
      encryption: true
    },
    
    assets: {
      enabled: false, // Vercel handles this
      retention: 604800000 // 7 days
    },
    
    configuration: {
      enabled: true,
      includeSecrets: false,
      retention: 2592000000 // 30 days
    }
  },

  // Security configurations
  security: {
    deployment: {
      requireSignedCommits: false,
      requireBranchProtection: true,
      requireStatusChecks: true,
      requireReviews: true
    },
    
    secrets: {
      rotation: {
        enabled: false,
        interval: 7776000000 // 90 days
      },
      validation: {
        enabled: true,
        checkExpiry: true
      }
    },
    
    scanning: {
      vulnerabilities: {
        enabled: true,
        failOnHigh: false,
        failOnCritical: true
      },
      secrets: {
        enabled: true,
        failOnDetection: true
      }
    }
  },

  // Performance configurations
  performance: {
    optimization: {
      compression: true,
      minification: true,
      bundleAnalysis: true,
      imageOptimization: true
    },
    
    caching: {
      static: {
        maxAge: 31536000, // 1 year
        immutable: true
      },
      api: {
        maxAge: 3600, // 1 hour
        staleWhileRevalidate: 86400 // 24 hours
      }
    },
    
    monitoring: {
      realUserMonitoring: true,
      syntheticMonitoring: true,
      performanceBudgets: {
        firstContentfulPaint: 2000,
        largestContentfulPaint: 4000,
        cumulativeLayoutShift: 0.1
      }
    }
  }
};

/**
 * Get configuration for specific environment
 */
function getEnvironmentConfig(environment) {
  const config = deploymentConfig.environments[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}

/**
 * Get deployment strategy configuration
 */
function getDeploymentStrategy(strategyName = 'immediate') {
  const strategy = deploymentConfig.strategies[strategyName];
  if (!strategy) {
    throw new Error(`Unknown deployment strategy: ${strategyName}`);
  }
  return strategy;
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(environment) {
  const config = getEnvironmentConfig(environment);
  const errors = [];

  // Check required database configuration
  if (!config.database.url) {
    errors.push(`Missing database URL for ${environment}`);
  }
  if (!config.database.key) {
    errors.push(`Missing database key for ${environment}`);
  }

  // Check AI configuration
  if (!config.ai.apiKey) {
    errors.push(`Missing AI API key for ${environment}`);
  }

  // Check monitoring configuration for non-development environments
  if (environment !== 'development') {
    if (config.monitoring.enabled && !config.monitoring.webhookUrl) {
      errors.push(`Missing monitoring webhook URL for ${environment}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get health check configuration for environment
 */
function getHealthCheckConfig(environment) {
  const envConfig = getEnvironmentConfig(environment);
  const healthConfig = { ...deploymentConfig.healthChecks };
  
  // Update URLs with environment-specific base URL
  healthConfig.endpoints = healthConfig.endpoints.map(endpoint => ({
    ...endpoint,
    url: `${envConfig.url}${endpoint.path}`
  }));

  return healthConfig;
}

/**
 * Get monitoring configuration for environment
 */
function getMonitoringConfig(environment) {
  const envConfig = getEnvironmentConfig(environment);
  const monitoringConfig = { ...deploymentConfig.monitoring };
  
  // Override with environment-specific settings
  if (envConfig.monitoring) {
    monitoringConfig.enabled = envConfig.monitoring.enabled;
    monitoringConfig.logLevel = envConfig.monitoring.logLevel;
    
    if (envConfig.monitoring.webhookUrl) {
      monitoringConfig.alerts.channels.webhook.url = envConfig.monitoring.webhookUrl;
    }
    
    if (envConfig.monitoring.slackWebhook) {
      monitoringConfig.alerts.channels.slack.webhook = envConfig.monitoring.slackWebhook;
    }
  }

  return monitoringConfig;
}

module.exports = {
  deploymentConfig,
  getEnvironmentConfig,
  getDeploymentStrategy,
  validateEnvironmentConfig,
  getHealthCheckConfig,
  getMonitoringConfig
};