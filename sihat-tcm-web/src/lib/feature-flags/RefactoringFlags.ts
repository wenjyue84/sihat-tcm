/**
 * Refactoring Feature Flags Configuration
 * Defines flags for gradual rollout of refactored components
 */

import { FeatureFlagConfig } from "./FeatureFlagManager";

export const REFACTORING_FLAGS = {
  // AI System Flags
  AI_MODEL_ROUTER_V2: "ai_model_router_v2",
  AI_COMPLEXITY_ANALYZER: "ai_complexity_analyzer",
  AI_PERFORMANCE_MONITOR: "ai_performance_monitor",
  AI_MODEL_FACTORY: "ai_model_factory",

  // Event System Flags
  EVENT_SYSTEM_V2: "event_system_v2",
  EVENT_HISTORY_TRACKING: "event_history_tracking",
  EVENT_PRIORITIZATION: "event_prioritization",

  // Command System Flags
  COMMAND_SYSTEM_V2: "command_system_v2",
  COMMAND_UNDO_REDO: "command_undo_redo",
  COMMAND_BATCH_EXECUTION: "command_batch_execution",
  COMMAND_QUEUE_PRIORITY: "command_queue_priority",

  // Testing Framework Flags
  PROPERTY_BASED_TESTING: "property_based_testing",
  TEST_DATA_GENERATORS: "test_data_generators",
  TEST_SUITE_RUNNER_V2: "test_suite_runner_v2",

  // Notification System Flags
  NOTIFICATION_SYSTEM_V2: "notification_system_v2",
  NOTIFICATION_SCHEDULING: "notification_scheduling",
  NOTIFICATION_PREFERENCES: "notification_preferences",
  NOTIFICATION_TEMPLATES: "notification_templates",

  // Personalization System Flags
  PERSONALIZATION_ENGINE_V2: "personalization_engine_v2",
  CULTURAL_CONTEXT_BUILDER: "cultural_context_builder",
  HEALTH_HISTORY_ANALYZER: "health_history_analyzer",
  RECOMMENDATION_GENERATOR: "recommendation_generator",

  // Medical Safety Flags
  MEDICAL_SAFETY_VALIDATOR: "medical_safety_validator",
  EMERGENCY_DETECTOR: "emergency_detector",
  DRUG_INTERACTION_ANALYZER: "drug_interaction_analyzer",
  ALLERGY_CHECKER: "allergy_checker",

  // Device Integration Flags
  DEVICE_INTEGRATION_V2: "device_integration_v2",
  DEVICE_SCANNER: "device_scanner",
  HEALTH_DATA_PROVIDER: "health_data_provider",
  SENSOR_MANAGER: "sensor_manager",

  // Camera System Flags
  CAMERA_SYSTEM_V2: "camera_system_v2",
  CAMERA_GESTURE_HANDLER: "camera_gesture_handler",
  IMAGE_OPTIMIZER: "image_optimizer",

  // Audio System Flags
  AUDIO_RECORDER_V2: "audio_recorder_v2",
  AUDIO_ANALYZER: "audio_analyzer",

  // Voice System Flags
  VOICE_COMMAND_HANDLER: "voice_command_handler",
  SPEECH_RECOGNITION: "speech_recognition",
  SPEECH_SYNTHESIS: "speech_synthesis",

  // Monitoring & Alerts Flags
  MONITORING_SYSTEM_V2: "monitoring_system_v2",
  ALERT_RULE_ENGINE: "alert_rule_engine",
  METRIC_COLLECTOR: "metric_collector",

  // Accessibility Flags
  ACCESSIBILITY_SYSTEM: "accessibility_system",
  FOCUS_MANAGER: "focus_manager",
  STYLE_MANAGER: "style_manager",

  // Store Management Flags
  ZUSTAND_STORES: "zustand_stores",
  DIAGNOSIS_PROGRESS_STORE: "diagnosis_progress_store",
  AUTH_STORE: "auth_store",
  LANGUAGE_STORE: "language_store",
} as const;

export type RefactoringFlagKey = (typeof REFACTORING_FLAGS)[keyof typeof REFACTORING_FLAGS];

/**
 * Development Environment Configuration
 */
export const developmentConfig: FeatureFlagConfig = {
  environment: "development",
  defaultEnabled: true,
  flags: {
    // AI System - Full rollout in development
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: {
      key: REFACTORING_FLAGS.AI_MODEL_ROUTER_V2,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Enhanced AI Model Router with intelligent selection",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [REFACTORING_FLAGS.AI_COMPLEXITY_ANALYZER]: {
      key: REFACTORING_FLAGS.AI_COMPLEXITY_ANALYZER,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Sophisticated request complexity analysis",
      dependencies: [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [REFACTORING_FLAGS.AI_PERFORMANCE_MONITOR]: {
      key: REFACTORING_FLAGS.AI_PERFORMANCE_MONITOR,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Comprehensive AI performance monitoring",
      dependencies: [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Event System - Full rollout in development
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: {
      key: REFACTORING_FLAGS.EVENT_SYSTEM_V2,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Enhanced event system with prioritization and history",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Command System - Full rollout in development
    [REFACTORING_FLAGS.COMMAND_SYSTEM_V2]: {
      key: REFACTORING_FLAGS.COMMAND_SYSTEM_V2,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Enhanced command system with undo/redo support",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Testing Framework - Full rollout in development
    [REFACTORING_FLAGS.PROPERTY_BASED_TESTING]: {
      key: REFACTORING_FLAGS.PROPERTY_BASED_TESTING,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Property-based testing framework with shrinking",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Medical Safety - Full rollout in development
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: {
      key: REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR,
      enabled: true,
      rolloutPercentage: 100,
      environment: "development",
      description: "Comprehensive medical safety validation",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

/**
 * Staging Environment Configuration
 */
export const stagingConfig: FeatureFlagConfig = {
  environment: "staging",
  defaultEnabled: false,
  flags: {
    // AI System - Gradual rollout in staging
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: {
      key: REFACTORING_FLAGS.AI_MODEL_ROUTER_V2,
      enabled: true,
      rolloutPercentage: 50,
      environment: "staging",
      description: "Enhanced AI Model Router with intelligent selection",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [REFACTORING_FLAGS.AI_COMPLEXITY_ANALYZER]: {
      key: REFACTORING_FLAGS.AI_COMPLEXITY_ANALYZER,
      enabled: true,
      rolloutPercentage: 30,
      environment: "staging",
      description: "Sophisticated request complexity analysis",
      dependencies: [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Event System - Conservative rollout
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: {
      key: REFACTORING_FLAGS.EVENT_SYSTEM_V2,
      enabled: true,
      rolloutPercentage: 25,
      environment: "staging",
      description: "Enhanced event system with prioritization and history",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Command System - Limited rollout
    [REFACTORING_FLAGS.COMMAND_SYSTEM_V2]: {
      key: REFACTORING_FLAGS.COMMAND_SYSTEM_V2,
      enabled: true,
      rolloutPercentage: 20,
      environment: "staging",
      description: "Enhanced command system with undo/redo support",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Medical Safety - High priority, higher rollout
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: {
      key: REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR,
      enabled: true,
      rolloutPercentage: 75,
      environment: "staging",
      description: "Comprehensive medical safety validation",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

/**
 * Production Environment Configuration
 */
export const productionConfig: FeatureFlagConfig = {
  environment: "production",
  defaultEnabled: false,
  flags: {
    // AI System - Very conservative rollout
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: {
      key: REFACTORING_FLAGS.AI_MODEL_ROUTER_V2,
      enabled: true,
      rolloutPercentage: 5,
      environment: "production",
      description: "Enhanced AI Model Router with intelligent selection",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Medical Safety - Priority rollout for safety
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: {
      key: REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR,
      enabled: true,
      rolloutPercentage: 25,
      environment: "production",
      description: "Comprehensive medical safety validation",
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Event System - Minimal rollout
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: {
      key: REFACTORING_FLAGS.EVENT_SYSTEM_V2,
      enabled: false,
      rolloutPercentage: 0,
      environment: "production",
      description: "Enhanced event system with prioritization and history",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

/**
 * Get configuration for current environment
 */
export function getFeatureFlagConfig(): FeatureFlagConfig {
  const environment = process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
      return productionConfig;
    case "staging":
      return stagingConfig;
    case "development":
    default:
      return developmentConfig;
  }
}

/**
 * Rollout schedule for gradual deployment
 */
export const rolloutSchedule = {
  week1: {
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: 25,
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: 5,
  },
  week2: {
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: 50,
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: 10,
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: 5,
  },
  week3: {
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: 75,
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: 25,
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: 15,
    [REFACTORING_FLAGS.COMMAND_SYSTEM_V2]: 5,
  },
  week4: {
    [REFACTORING_FLAGS.MEDICAL_SAFETY_VALIDATOR]: 100,
    [REFACTORING_FLAGS.AI_MODEL_ROUTER_V2]: 50,
    [REFACTORING_FLAGS.EVENT_SYSTEM_V2]: 30,
    [REFACTORING_FLAGS.COMMAND_SYSTEM_V2]: 15,
  },
};
