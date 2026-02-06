/**
 * Deployment System - Main Export
 * Comprehensive deployment management for production rollout
 */

// Core deployment components
export { FeatureFlagManager } from "../feature-flags/FeatureFlagManager";
export { DeploymentManager } from "./DeploymentManager";
export { StagingValidator } from "./StagingValidator";
export { ProductionTestSuite } from "./ProductionTestSuite";

// Feature flag configurations
export {
  REFACTORING_FLAGS,
  getFeatureFlagConfig,
  developmentConfig,
  stagingConfig,
  productionConfig,
  rolloutSchedule,
} from "../feature-flags/RefactoringFlags";

// Production deployment configurations
export {
  PRODUCTION_DEPLOYMENT_PHASES,
  PRODUCTION_HEALTH_CHECKS,
  DEPLOYMENT_TIMELINE,
  EMERGENCY_ROLLBACK_PROCEDURES,
  SUCCESS_METRICS,
} from "./ProductionDeployment";

// Type definitions
export type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagContext,
  RefactoringFlagKey,
} from "../feature-flags/FeatureFlagManager";

export type {
  DeploymentPhase,
  RollbackTrigger,
  DeploymentMetrics,
  HealthCheck,
} from "./DeploymentManager";

export type {
  ValidationSuite,
  ValidationTest,
  ValidationResult,
  ValidationReport,
  ValidationSummary,
} from "./StagingValidator";

export type {
  ProductionTest,
  TestContext,
  TestResult,
  TestSuiteResult,
} from "./ProductionTestSuite";

// Utility functions
export { createDeploymentSystem } from "./utils/DeploymentSystemFactory";
export { validateDeploymentReadiness } from "./utils/DeploymentValidator";
export { generateDeploymentReport } from "./utils/ReportGenerator";

// Constants
export const DEPLOYMENT_CONSTANTS = {
  MAX_ROLLOUT_PERCENTAGE: 100,
  MIN_ROLLOUT_PERCENTAGE: 0,
  DEFAULT_HEALTH_CHECK_TIMEOUT: 5000,
  DEFAULT_HEALTH_CHECK_RETRIES: 3,
  EMERGENCY_ROLLBACK_THRESHOLD: 10.0, // 10% error rate
  CRITICAL_RESPONSE_TIME_THRESHOLD: 5000, // 5 seconds
  MIN_USER_SATISFACTION_THRESHOLD: 70, // 70%

  // Phase durations in minutes
  PHASE_DURATIONS: {
    MEDICAL_SAFETY: 120,
    AI_CORE: 180,
    EVENT_COMMAND: 150,
    PERSONALIZATION: 120,
    DEVICE_MOBILE: 180,
    ADVANCED: 150,
    FULL_ROLLOUT: 240,
  },

  // Rollback timeframes in minutes
  ROLLBACK_TIMEFRAMES: {
    IMMEDIATE: 5,
    RAPID: 15,
    CONTROLLED: 30,
  },
} as const;
