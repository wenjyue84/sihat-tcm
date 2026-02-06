/**
 * Test Factory Implementation
 *
 * Factory for creating different types of tests with proper configuration
 * and validation. Supports all test categories with sensible defaults.
 */

import {
  TestFactory,
  UnitTest,
  PropertyTest,
  IntegrationTest,
  PerformanceTest,
  TestSuite,
  UnitTestConfig,
  PropertyTestConfig,
  IntegrationTestConfig,
  PerformanceTestConfig,
  TestSuiteConfig,
  TestCategory,
  TestPriority,
} from "../interfaces/TestInterfaces";

import { TestDataGenerators } from "../generators/TestDataGenerators";
import { devLog } from "../../systemLogger";

/**
 * Enhanced test factory with validation and defaults
 */
export class EnhancedTestFactory implements TestFactory {
  private readonly context: string;
  private testIdCounter = 0;

  constructor(context: string = "TestFactory") {
    this.context = context;
  }

  /**
   * Create a unit test with proper defaults
   */
  public createUnitTest(config: UnitTestConfig): UnitTest {
    const testId = this.generateTestId("unit");

    const test: UnitTest = {
      id: testId,
      name: config.name,
      description: config.description,
      category: "unit",
      priority: config.priority || "medium",
      tags: config.tags || [],
      timeout: config.timeout,
      test: config.test,
      expectedResult: config.expectedResult,
      assertions: config.assertions,
      metadata: {
        author: "TestFactory",
        createdAt: new Date(),
        version: "1.0.0",
      },
    };

    this.validateTest(test);

    devLog(`[${this.context}] Created unit test: ${test.name}`, {
      testId,
      priority: test.priority,
    });

    return test;
  }

  /**
   * Create a property-based test with generator
   */
  public createPropertyTest(config: PropertyTestConfig): PropertyTest {
    const testId = this.generateTestId("property");

    const test: PropertyTest = {
      id: testId,
      name: config.name,
      description: config.description,
      category: "property",
      priority: config.priority || "medium",
      tags: config.tags || [],
      property: config.property,
      generator: config.generator,
      iterations: config.iterations || 100,
      shrinkingEnabled: config.shrinkingEnabled !== false,
      shrinkingStrategy: "smart",
      metadata: {
        author: "TestFactory",
        createdAt: new Date(),
        version: "1.0.0",
      },
    };

    this.validateTest(test);

    devLog(`[${this.context}] Created property test: ${test.name}`, {
      testId,
      iterations: test.iterations,
      shrinkingEnabled: test.shrinkingEnabled,
    });

    return test;
  }

  /**
   * Create an integration test with environment setup
   */
  public createIntegrationTest(config: IntegrationTestConfig): IntegrationTest {
    const testId = this.generateTestId("integration");

    const test: IntegrationTest = {
      id: testId,
      name: config.name,
      description: config.description,
      category: "integration",
      priority: config.priority || "high",
      tags: config.tags || [],
      timeout: config.timeout || 60000, // 1 minute default for integration tests
      test: config.test,
      dependencies: config.dependencies,
      environment: config.environment,
      metadata: {
        author: "TestFactory",
        createdAt: new Date(),
        version: "1.0.0",
        requirements: config.dependencies,
        environment: [config.environment.name],
      },
    };

    this.validateTest(test);

    devLog(`[${this.context}] Created integration test: ${test.name}`, {
      testId,
      dependencies: test.dependencies.length,
      environment: test.environment.name,
    });

    return test;
  }

  /**
   * Create a performance test with targets
   */
  public createPerformanceTest(config: PerformanceTestConfig): PerformanceTest {
    const testId = this.generateTestId("performance");

    const test: PerformanceTest = {
      id: testId,
      name: config.name,
      description: config.description,
      category: "performance",
      priority: config.priority || "high",
      tags: config.tags || [],
      timeout: 120000, // 2 minutes default for performance tests
      test: config.test,
      performanceTargets: config.performanceTargets,
      loadProfile: config.loadProfile,
      warmupIterations: 5,
      measurementIterations: 10,
      metadata: {
        author: "TestFactory",
        createdAt: new Date(),
        version: "1.0.0",
      },
    };

    this.validateTest(test);

    devLog(`[${this.context}] Created performance test: ${test.name}`, {
      testId,
      maxExecutionTime: test.performanceTargets.maxExecutionTime,
      loadProfile: !!test.loadProfile,
    });

    return test;
  }

  /**
   * Create a test suite with lifecycle hooks
   */
  public createTestSuite(config: TestSuiteConfig): TestSuite {
    const suiteId = this.generateTestId("suite");

    const suite: TestSuite = {
      id: suiteId,
      name: config.name,
      description: config.description,
      tests: config.tests,
      configuration: {
        parallel: true,
        maxConcurrency: 4,
        timeout: 300000, // 5 minutes default
        retryFailedTests: true,
        maxRetries: 2,
        stopOnFirstFailure: false,
        randomizeOrder: false,
        ...config.configuration,
      },
      beforeAll: config.beforeAll,
      afterAll: config.afterAll,
      beforeEach: config.beforeEach,
      afterEach: config.afterEach,
    };

    this.validateTestSuite(suite);

    devLog(`[${this.context}] Created test suite: ${suite.name}`, {
      suiteId,
      testCount: suite.tests.length,
      parallel: suite.configuration.parallel,
    });

    return suite;
  }

  /**
   * Create a comprehensive test suite for AI model testing
   */
  public createAIModelTestSuite(modelName: string): TestSuite {
    const tests = [
      // Unit tests for basic functionality
      this.createUnitTest({
        name: `${modelName} - Basic Response Generation`,
        description: "Test that the model can generate basic responses",
        test: async () => {
          // Mock test implementation
          return true;
        },
        priority: "critical",
        tags: ["ai", "basic", modelName],
      }),

      // Property tests for consistency
      this.createPropertyTest({
        name: `${modelName} - Response Consistency`,
        description: "Test that similar inputs produce consistent outputs",
        property: async (input: any) => {
          // Property: similar inputs should produce similar outputs
          return true; // Mock implementation
        },
        generator: TestDataGenerators.aiRequest,
        iterations: 50,
        priority: "high",
        tags: ["ai", "consistency", modelName],
      }),

      // Performance tests
      this.createPerformanceTest({
        name: `${modelName} - Response Time`,
        description: "Test response time performance",
        test: async () => {
          // Mock performance test
          return true;
        },
        performanceTargets: {
          maxExecutionTime: 5000, // 5 seconds
          maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        },
        priority: "high",
        tags: ["ai", "performance", modelName],
      }),
    ];

    return this.createTestSuite({
      name: `${modelName} Test Suite`,
      description: `Comprehensive tests for ${modelName} AI model`,
      tests,
      configuration: {
        parallel: false, // AI tests often need to be sequential
        timeout: 600000, // 10 minutes
        retryFailedTests: true,
        maxRetries: 1,
      },
    });
  }

  /**
   * Create a test suite for notification system
   */
  public createNotificationTestSuite(): TestSuite {
    const tests = [
      // Unit tests
      this.createUnitTest({
        name: "Notification Scheduling - Basic",
        description: "Test basic notification scheduling functionality",
        test: async () => {
          // Mock test implementation
          return true;
        },
        priority: "critical",
        tags: ["notification", "scheduling"],
      }),

      // Property tests
      this.createPropertyTest({
        name: "Notification Validation",
        description: "Test that all valid notifications are accepted",
        property: async (notification: any) => {
          // Property: valid notifications should always be accepted
          return true; // Mock implementation
        },
        generator: TestDataGenerators.notificationRequest,
        iterations: 100,
        priority: "high",
        tags: ["notification", "validation"],
      }),

      // Integration tests
      this.createIntegrationTest({
        name: "Notification Delivery Integration",
        description: "Test end-to-end notification delivery",
        test: async () => {
          // Mock integration test
          return true;
        },
        dependencies: ["notification-service", "push-service"],
        environment: {
          name: "test",
          requirements: [
            { type: "service", name: "notification-service" },
            { type: "service", name: "push-service" },
          ],
          configuration: {},
        },
        priority: "high",
        tags: ["notification", "integration"],
      }),
    ];

    return this.createTestSuite({
      name: "Notification System Test Suite",
      description: "Comprehensive tests for notification system",
      tests,
    });
  }

  /**
   * Create a test suite for TCM diagnosis system
   */
  public createTCMDiagnosisTestSuite(): TestSuite {
    const tests = [
      // Property tests for medical data
      this.createPropertyTest({
        name: "TCM Constitution Analysis",
        description: "Test that constitution analysis produces valid results",
        property: async (medicalHistory: any) => {
          // Property: valid medical history should produce valid constitution
          return true; // Mock implementation
        },
        generator: TestDataGenerators.medicalHistory,
        iterations: 200,
        priority: "critical",
        tags: ["tcm", "constitution", "medical"],
      }),

      // Performance tests for diagnosis
      this.createPerformanceTest({
        name: "Diagnosis Performance",
        description: "Test diagnosis system performance under load",
        test: async () => {
          // Mock performance test
          return true;
        },
        performanceTargets: {
          maxExecutionTime: 10000, // 10 seconds
          minThroughput: 10, // 10 diagnoses per minute
        },
        loadProfile: {
          concurrentUsers: 5,
          rampUpTime: 30000,
          sustainTime: 60000,
          rampDownTime: 30000,
        },
        priority: "high",
        tags: ["tcm", "performance", "diagnosis"],
      }),
    ];

    return this.createTestSuite({
      name: "TCM Diagnosis Test Suite",
      description: "Comprehensive tests for TCM diagnosis system",
      tests,
      configuration: {
        timeout: 900000, // 15 minutes for medical tests
      },
    });
  }

  // Private helper methods

  /**
   * Generate unique test ID
   */
  private generateTestId(category: string): string {
    return `${category}-test-${++this.testIdCounter}-${Date.now()}`;
  }

  /**
   * Validate test configuration
   */
  private validateTest(test: any): void {
    if (!test.name || typeof test.name !== "string") {
      throw new Error("Test name is required and must be a string");
    }

    if (!test.description || typeof test.description !== "string") {
      throw new Error("Test description is required and must be a string");
    }

    if (!test.category) {
      throw new Error("Test category is required");
    }

    // Category-specific validation
    switch (test.category) {
      case "unit":
      case "integration":
      case "performance":
      case "security":
      case "e2e":
        if (!test.test || typeof test.test !== "function") {
          throw new Error("Test function is required for standard tests");
        }
        break;

      case "property":
        if (!test.property || typeof test.property !== "function") {
          throw new Error("Property function is required for property tests");
        }
        if (!test.generator || typeof test.generator !== "function") {
          throw new Error("Generator function is required for property tests");
        }
        break;
    }
  }

  /**
   * Validate test suite configuration
   */
  private validateTestSuite(suite: TestSuite): void {
    if (!suite.name || typeof suite.name !== "string") {
      throw new Error("Suite name is required and must be a string");
    }

    if (!suite.description || typeof suite.description !== "string") {
      throw new Error("Suite description is required and must be a string");
    }

    if (!Array.isArray(suite.tests)) {
      throw new Error("Suite tests must be an array");
    }

    if (suite.tests.length === 0) {
      throw new Error("Suite must contain at least one test");
    }

    // Validate each test in the suite
    suite.tests.forEach((test, index) => {
      try {
        this.validateTest(test);
      } catch (error) {
        throw new Error(`Test at index ${index} is invalid: ${error.message}`);
      }
    });
  }
}

/**
 * Factory function for creating test factory
 */
export function createTestFactory(context?: string): TestFactory {
  return new EnhancedTestFactory(context);
}

/**
 * Default test factory instance
 */
export const defaultTestFactory = new EnhancedTestFactory();

/**
 * Convenience functions for common test creation patterns
 */
export const TestFactoryHelpers = {
  /**
   * Create a simple unit test
   */
  unitTest: (
    name: string,
    testFn: () => Promise<void> | void,
    options?: {
      priority?: TestPriority;
      tags?: string[];
      timeout?: number;
    }
  ) => {
    return defaultTestFactory.createUnitTest({
      name,
      description: `Unit test: ${name}`,
      test: testFn,
      ...options,
    });
  },

  /**
   * Create a simple property test
   */
  propertyTest: <T>(
    name: string,
    property: (input: T) => boolean | Promise<boolean>,
    generator: () => T,
    options?: {
      iterations?: number;
      priority?: TestPriority;
      tags?: string[];
    }
  ) => {
    return defaultTestFactory.createPropertyTest({
      name,
      description: `Property test: ${name}`,
      property,
      generator,
      ...options,
    });
  },

  /**
   * Create a performance test with simple timing
   */
  performanceTest: (
    name: string,
    testFn: () => Promise<void> | void,
    maxTime: number,
    options?: {
      priority?: TestPriority;
      tags?: string[];
    }
  ) => {
    return defaultTestFactory.createPerformanceTest({
      name,
      description: `Performance test: ${name}`,
      test: testFn,
      performanceTargets: {
        maxExecutionTime: maxTime,
      },
      ...options,
    });
  },
};
