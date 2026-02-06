/**
 * Deployment System Factory
 * Creates and configures the complete deployment system
 */

import { EventSystem } from "../../events/EventSystem";
import { TestFramework } from "../../testing/TestFramework";
import { FeatureFlagManager } from "../../feature-flags/FeatureFlagManager";
import { DeploymentManager } from "../DeploymentManager";
import { StagingValidator } from "../StagingValidator";
import { ProductionTestSuite } from "../ProductionTestSuite";
import { getFeatureFlagConfig } from "../../feature-flags/RefactoringFlags";
import { PRODUCTION_DEPLOYMENT_PHASES } from "../ProductionDeployment";

export interface DeploymentSystemConfig {
  environment: "development" | "staging" | "production";
  enableMonitoring: boolean;
  enableAutomaticRollback: boolean;
  customHealthChecks?: Record<string, any>;
  customPhases?: any[];
}

export interface DeploymentSystem {
  featureFlagManager: FeatureFlagManager;
  deploymentManager: DeploymentManager;
  stagingValidator: StagingValidator;
  productionTestSuite: ProductionTestSuite;
  eventSystem: EventSystem;
  testFramework: TestFramework;
}

/**
 * Create a complete deployment system with all components configured
 */
export function createDeploymentSystem(config: DeploymentSystemConfig): DeploymentSystem {
  // Initialize core systems
  const eventSystem = new EventSystem();
  const testFramework = new TestFramework();

  // Configure feature flags for environment
  const flagConfig = getFeatureFlagConfig();
  const featureFlagManager = new FeatureFlagManager(flagConfig, eventSystem);

  // Initialize deployment manager
  const deploymentManager = new DeploymentManager(eventSystem, featureFlagManager);

  // Add production deployment phases
  const phases = config.customPhases || PRODUCTION_DEPLOYMENT_PHASES;
  phases.forEach((phase) => {
    deploymentManager.addPhase(phase);
  });

  // Initialize validators and test suites
  const stagingValidator = new StagingValidator(eventSystem, testFramework);
  const productionTestSuite = new ProductionTestSuite(
    eventSystem,
    testFramework,
    featureFlagManager
  );

  // Configure monitoring if enabled
  if (config.enableMonitoring) {
    setupMonitoring(eventSystem, config.environment);
  }

  // Configure automatic rollback if enabled
  if (config.enableAutomaticRollback) {
    setupAutomaticRollback(deploymentManager, eventSystem);
  }

  // Setup event listeners for system integration
  setupSystemIntegration(eventSystem, deploymentManager, stagingValidator, productionTestSuite);

  return {
    featureFlagManager,
    deploymentManager,
    stagingValidator,
    productionTestSuite,
    eventSystem,
    testFramework,
  };
}

/**
 * Setup monitoring for the deployment system
 */
function setupMonitoring(eventSystem: EventSystem, environment: string): void {
  // Listen to deployment events
  eventSystem.on("deployment:phaseStarted", (event) => {
    console.log(`[${environment}] Deployment phase started:`, event.data?.phaseId);
    // Send to monitoring system
  });

  eventSystem.on("deployment:phaseCompleted", (event) => {
    console.log(`[${environment}] Deployment phase completed:`, event.data?.phaseId);
    // Send to monitoring system
  });

  eventSystem.on("deployment:rollbackTriggered", (event) => {
    console.error(`[${environment}] Rollback triggered:`, event.data?.trigger?.description);
    // Send alert to monitoring system
  });

  eventSystem.on("featureFlags:updated", (event) => {
    console.log(`[${environment}] Feature flag updated:`, event.data?.flagKey);
    // Log to monitoring system
  });

  // Listen to validation events
  eventSystem.on("staging:validationCompleted", (event) => {
    console.log(`[${environment}] Staging validation completed:`, event.data?.report?.overallStatus);
    // Send to monitoring system
  });

  eventSystem.on("production:testSuiteCompleted", (event) => {
    console.log(
      `[${environment}] Production test suite completed:`,
      event.data?.suiteResult?.overallStatus
    );
    // Send to monitoring system
  });
}

/**
 * Setup automatic rollback based on system events
 */
function setupAutomaticRollback(
  deploymentManager: DeploymentManager,
  eventSystem: EventSystem
): void {
  eventSystem.on("deployment:criticalFailure", async (data) => {
    console.error("Critical failure detected, initiating automatic rollback:", data);

    try {
      await deploymentManager.rollbackPhase(
        data.phaseId,
        `Critical failure: ${data.result.message}`
      );
    } catch (error) {
      console.error("Automatic rollback failed:", error);
      // Escalate to manual intervention
      eventSystem.emit("deployment:escalateToManual", {
        phaseId: data.phaseId,
        reason: "Automatic rollback failed",
        originalFailure: data,
        rollbackError: error,
      });
    }
  });

  eventSystem.on("staging:criticalFailure", async (data) => {
    console.error("Critical staging failure detected:", data);

    // Block deployment progression
    eventSystem.emit("deployment:blockProgression", {
      reason: "Critical staging validation failure",
      details: data,
    });
  });
}

/**
 * Setup integration between system components
 */
function setupSystemIntegration(
  eventSystem: EventSystem,
  deploymentManager: DeploymentManager,
  stagingValidator: StagingValidator,
  productionTestSuite: ProductionTestSuite
): void {
  // Auto-run staging validation before deployment phases
  eventSystem.on("deployment:phaseStarted", async (data) => {
    try {
      console.log(`Running staging validation for phase: ${data.phaseId}`);
      const validationResult = await stagingValidator.runValidation(`staging_${data.phaseId}`);

      if (validationResult.overallStatus === "failed") {
        eventSystem.emit("deployment:validationFailed", {
          phaseId: data.phaseId,
          validationResult,
        });

        // Trigger rollback if validation fails
        await deploymentManager.rollbackPhase(data.phaseId, "Staging validation failed");
      }
    } catch (error) {
      console.error("Staging validation error:", error);
      eventSystem.emit("deployment:validationError", {
        phaseId: data.phaseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Auto-run production tests during deployment
  eventSystem.on("deployment:phaseStarted", async (data) => {
    try {
      console.log(`Running production tests for phase: ${data.phaseId}`);
      const testResult = await productionTestSuite.runTestSuite(data.phaseId, "production");

      if (testResult.overallStatus === "failed" || testResult.criticalFailures > 0) {
        eventSystem.emit("deployment:testsFailed", {
          phaseId: data.phaseId,
          testResult,
        });

        // Trigger rollback if critical tests fail
        await deploymentManager.rollbackPhase(data.phaseId, "Production tests failed");
      }
    } catch (error) {
      console.error("Production test error:", error);
      eventSystem.emit("deployment:testError", {
        phaseId: data.phaseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Feature flag synchronization
  eventSystem.on("featureFlags:updated", (data) => {
    // Notify all components of flag changes
    eventSystem.emit("system:featureFlagChanged", {
      flagKey: data.flagKey,
      previousFlag: data.previousFlag,
      updatedFlag: data.updatedFlag,
    });
  });
}

/**
 * Create deployment system with default configuration
 */
export function createDefaultDeploymentSystem(
  environment: "development" | "staging" | "production"
): DeploymentSystem {
  const config: DeploymentSystemConfig = {
    environment,
    enableMonitoring: environment !== "development",
    enableAutomaticRollback: environment === "production",
  };

  return createDeploymentSystem(config);
}

/**
 * Create deployment system for testing
 */
export function createTestDeploymentSystem(): DeploymentSystem {
  const config: DeploymentSystemConfig = {
    environment: "development",
    enableMonitoring: false,
    enableAutomaticRollback: false,
  };

  return createDeploymentSystem(config);
}
