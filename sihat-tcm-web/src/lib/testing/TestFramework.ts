/**
 * Refactored Testing Framework - Main orchestrator
 *
 * This is the new modular version that delegates to specialized components.
 * The original large file has been broken down into focused modules.
 */

import {
  TestSuite,
  TestReport,
  PropertyTest,
  UnitTest,
  IntegrationTest,
} from "./interfaces/TestInterfaces";
import { TestSuiteRunner } from "./runners/TestSuiteRunner";
import { TestFactory } from "./factories/TestFactory";
import { TestDataGenerators } from "./generators/TestDataGenerators";

export class TestFramework {
  private suiteRunner = new TestSuiteRunner();
  private readonly context = "TestFramework";

  /**
   * Run a complete test suite
   */
  async runTestSuite(suite: TestSuite): Promise<TestReport> {
    return this.suiteRunner.runTestSuite(suite);
  }

  /**
   * Create AI model router property tests
   */
  createAIModelRouterTests(): PropertyTest[] {
    return TestFactory.createAIModelRouterTests();
  }

  /**
   * Create notification system property tests
   */
  createNotificationTests(): PropertyTest[] {
    return TestFactory.createNotificationTests();
  }

  /**
   * Create TCM-specific tests
   */
  createTCMTests(): PropertyTest[] {
    return TestFactory.createTCMTests();
  }

  /**
   * Create performance tests
   */
  createPerformanceTests(): PropertyTest[] {
    return TestFactory.createPerformanceTests();
  }

  /**
   * Create a comprehensive test suite for the entire application
   */
  createComprehensiveTestSuite(): TestSuite {
    return {
      name: "Sihat TCM Comprehensive Test Suite",
      description: "Complete property-based and unit tests for the Sihat TCM application",
      tests: [
        ...this.createAIModelRouterTests(),
        ...this.createNotificationTests(),
        ...this.createTCMTests(),
        ...this.createPerformanceTests(),
      ],
      beforeAll: async () => {
        console.log("Setting up comprehensive test environment...");
      },
      afterAll: async () => {
        console.log("Cleaning up test environment...");
      },
    };
  }
}

// Re-export key components for convenience
export { TestFactory } from "./factories/TestFactory";
export { TestDataGenerators } from "./generators/TestDataGenerators";
export { PropertyTestRunner } from "./runners/PropertyTestRunner";
export { TestSuiteRunner } from "./runners/TestSuiteRunner";

// Re-export interfaces
export * from "./interfaces/TestInterfaces";

// Convenience functions (maintaining backward compatibility)
export const createPropertyTest = TestFactory.createPropertyTest;
export const createUnitTest = TestFactory.createUnitTest;
export const createIntegrationTest = TestFactory.createIntegrationTest;

// Default instance
export const defaultTestFramework = new TestFramework();
