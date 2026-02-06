/**
 * Test Suite Runner Implementation
 *
 * Comprehensive test suite execution with parallel processing,
 * lifecycle management, and detailed reporting.
 */

import {
  BaseTest,
  TestSuite,
  TestRunner,
  TestResult,
  TestExecutionReport,
  TestRunConfiguration,
  TestCategory,
  TestPriority,
  TestFilter,
  TestReporter,
  TestSummary,
  TestTrends,
  TrendDataPoint,
} from "../interfaces/TestInterfaces";

import { createPropertyTestRunner } from "./PropertyTestRunner";
import { ErrorFactory } from "../../errors/AppError";

/** Local log helper to avoid server-only systemLogger import */
function devLog(message: string, metadata?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    if (metadata) {
      console.log(message, metadata);
    } else {
      console.log(message);
    }
  }
}

/** Local error log helper */
function logError(message: string, error?: unknown): void {
  console.error(message, error);
}

/**
 * Enhanced test suite runner with advanced features
 */
export class EnhancedTestSuiteRunner implements TestRunner {
  private readonly context: string;
  private readonly config: TestSuiteRunnerConfig;
  private readonly propertyTestRunner = createPropertyTestRunner();

  // Execution state
  private _isRunning = false;
  private isPaused = false;
  private shouldCancel = false;
  private currentExecution: Promise<TestExecutionReport> | null = null;

  // Performance tracking
  private executionHistory: TestExecutionReport[] = [];

  constructor(context: string = "TestSuiteRunner", config: Partial<TestSuiteRunnerConfig> = {}) {
    this.context = context;
    this.config = {
      defaultTimeout: 30000,
      maxConcurrency: 4,
      retryFailedTests: true,
      maxRetries: 2,
      stopOnFirstFailure: false,
      enableTrends: true,
      historySize: 100,
      ...config,
    };
  }

  /**
   * Run a single test
   */
  public async runTest(test: BaseTest): Promise<TestResult> {
    const startTime = Date.now();

    try {
      devLog(`[${this.context}] Running test: ${test.name}`, {
        category: test.category,
        priority: test.priority,
      });

      // Setup phase
      if (test.setup) {
        await test.setup();
      }

      let result: TestResult;

      // Execute based on test category
      switch (test.category) {
        case "property":
          result = await this.propertyTestRunner.runPropertyTest(test as any);
          break;
        case "unit":
        case "integration":
        case "performance":
        case "security":
        case "e2e":
        default:
          result = await this.runStandardTest(test);
          break;
      }

      // Teardown phase
      if (test.teardown) {
        try {
          await test.teardown();
        } catch (teardownError) {
          logError(`[${this.context}] Teardown failed for test: ${test.name}`, teardownError);
          // Don't fail the test for teardown errors, but log them
        }
      }

      devLog(`[${this.context}] Test completed: ${test.name}`, {
        success: result.success,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        testId: test.id,
        success: false,
        executionTime,
        error: ErrorFactory.fromUnknownError(error, {
          component: this.context,
          action: "runTest",
          metadata: { testName: test.name },
        }),
      };
    }
  }

  /**
   * Run a complete test suite
   */
  public async runSuite(suite: TestSuite): Promise<TestExecutionReport> {
    const config: TestRunConfiguration = {
      parallel: suite.configuration.parallel,
      maxConcurrency: suite.configuration.maxConcurrency || this.config.maxConcurrency,
      timeout: suite.configuration.timeout,
      retryFailedTests: suite.configuration.retryFailedTests,
      maxRetries: suite.configuration.maxRetries,
      stopOnFirstFailure: suite.configuration.stopOnFirstFailure,
      randomizeOrder: suite.configuration.randomizeOrder,
      seed: suite.configuration.seed,
    };

    return this.runTests(suite.tests, config, suite);
  }

  /**
   * Run multiple tests with configuration
   */
  public async runTests(
    tests: BaseTest[],
    configuration?: TestRunConfiguration,
    suite?: TestSuite
  ): Promise<TestExecutionReport> {
    if (this._isRunning) {
      throw new Error("Test runner is already running");
    }

    const config = {
      parallel: true,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.defaultTimeout,
      retryFailedTests: this.config.retryFailedTests,
      maxRetries: this.config.maxRetries,
      stopOnFirstFailure: this.config.stopOnFirstFailure,
      randomizeOrder: false,
      ...configuration,
    };

    this._isRunning = true;
    this.shouldCancel = false;
    this.isPaused = false;

    const startTime = new Date();
    const suiteId = suite?.id || `suite-${Date.now()}`;
    const suiteName = suite?.name || "Ad-hoc Test Run";

    try {
      devLog(`[${this.context}] Starting test suite: ${suiteName}`, {
        testCount: tests.length,
        parallel: config.parallel,
        maxConcurrency: config.maxConcurrency,
      });

      // Execute suite beforeAll hook
      if (suite?.beforeAll) {
        await suite.beforeAll();
      }

      // Filter and prepare tests
      let testsToRun = [...tests];

      if (config.filter) {
        testsToRun = this.applyFilter(testsToRun, config.filter);
      }

      if (config.randomizeOrder) {
        testsToRun = this.shuffleTests(testsToRun, config.seed);
      }

      // Sort by priority (higher priority first)
      testsToRun.sort(
        (a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
      );

      // Execute tests
      const results = await this.executeTests(testsToRun, config, suite);

      // Execute suite afterAll hook
      if (suite?.afterAll) {
        try {
          await suite.afterAll();
        } catch (error) {
          logError(`[${this.context}] Suite afterAll hook failed`, error);
        }
      }

      const endTime = new Date();
      const totalExecutionTime = endTime.getTime() - startTime.getTime();

      // Generate report
      const report = this.generateReport(
        suiteId,
        suiteName,
        startTime,
        endTime,
        tests.length,
        results,
        totalExecutionTime
      );

      // Store in history
      if (this.config.enableTrends) {
        this.executionHistory.unshift(report);
        if (this.executionHistory.length > this.config.historySize) {
          this.executionHistory = this.executionHistory.slice(0, this.config.historySize);
        }
      }

      devLog(`[${this.context}] Test suite completed: ${suiteName}`, {
        totalTests: report.totalTests,
        passedTests: report.passedTests,
        failedTests: report.failedTests,
        executionTime: totalExecutionTime,
      });

      return report;
    } catch (error) {
      const endTime = new Date();
      const totalExecutionTime = endTime.getTime() - startTime.getTime();

      logError(`[${this.context}] Test suite execution failed: ${suiteName}`, error);

      return {
        suiteId,
        suiteName,
        startTime,
        endTime,
        totalTests: tests.length,
        passedTests: 0,
        failedTests: tests.length,
        skippedTests: 0,
        totalExecutionTime,
        results: [],
        summary: {
          successRate: 0,
          averageExecutionTime: 0,
          criticalFailures: 1,
          performanceIssues: 0,
          coveragePercentage: 0,
          regressions: 0,
          improvements: 0,
        },
      };
    } finally {
      this._isRunning = false;
      this.currentExecution = null;
    }
  }

  /**
   * Run tests by category
   */
  public async runByCategory(category: TestCategory): Promise<TestExecutionReport> {
    // This would typically get tests from a registry or database
    // For now, we'll return an empty report
    return this.runTests([], {
      parallel: true,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.defaultTimeout,
      retryFailedTests: this.config.retryFailedTests,
      maxRetries: this.config.maxRetries,
      stopOnFirstFailure: this.config.stopOnFirstFailure,
      randomizeOrder: false,
      filter: { categories: [category] },
    });
  }

  /**
   * Run tests by tags
   */
  public async runByTags(tags: string[]): Promise<TestExecutionReport> {
    return this.runTests([], {
      parallel: true,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.defaultTimeout,
      retryFailedTests: this.config.retryFailedTests,
      maxRetries: this.config.maxRetries,
      stopOnFirstFailure: this.config.stopOnFirstFailure,
      randomizeOrder: false,
      filter: { tags },
    });
  }

  /**
   * Run tests by priority
   */
  public async runByPriority(priority: TestPriority): Promise<TestExecutionReport> {
    return this.runTests([], {
      parallel: true,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.defaultTimeout,
      retryFailedTests: this.config.retryFailedTests,
      maxRetries: this.config.maxRetries,
      stopOnFirstFailure: this.config.stopOnFirstFailure,
      randomizeOrder: false,
      filter: { priorities: [priority] },
    });
  }

  /**
   * Check if runner is currently running
   */
  public isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Cancel current execution
   */
  public async cancel(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    this.shouldCancel = true;
    devLog(`[${this.context}] Test execution cancellation requested`);

    // Wait for current execution to finish
    if (this.currentExecution) {
      try {
        await this.currentExecution;
      } catch (error) {
        // Ignore errors during cancellation
      }
    }
  }

  /**
   * Pause current execution
   */
  public async pause(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    this.isPaused = true;
    devLog(`[${this.context}] Test execution paused`);
  }

  /**
   * Resume paused execution
   */
  public async resume(): Promise<void> {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;
    devLog(`[${this.context}] Test execution resumed`);
  }

  /**
   * Get execution trends
   */
  public getExecutionTrends(): TestTrends {
    if (!this.config.enableTrends || this.executionHistory.length === 0) {
      return {
        successRateTrend: [],
        executionTimeTrend: [],
        coverageTrend: [],
      };
    }

    const successRateTrend: TrendDataPoint[] = this.executionHistory.map((report) => ({
      timestamp: report.startTime,
      value: report.summary.successRate,
    }));

    const executionTimeTrend: TrendDataPoint[] = this.executionHistory.map((report) => ({
      timestamp: report.startTime,
      value: report.summary.averageExecutionTime,
    }));

    const coverageTrend: TrendDataPoint[] = this.executionHistory.map((report) => ({
      timestamp: report.startTime,
      value: report.summary.coveragePercentage,
    }));

    return {
      successRateTrend,
      executionTimeTrend,
      coverageTrend,
    };
  }

  // Private helper methods

  /**
   * Run a standard (non-property) test
   */
  private async runStandardTest(test: BaseTest): Promise<TestResult> {
    const startTime = Date.now();
    const timeout = test.timeout || this.config.defaultTimeout;

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.executeTestFunction(test),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Test timeout")), timeout)
        ),
      ]);

      const executionTime = Date.now() - startTime;

      return {
        testId: test.id,
        success: true,
        executionTime,
        metadata: {
          category: test.category,
          priority: test.priority,
          tags: test.tags,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        testId: test.id,
        success: false,
        executionTime,
        error: error as Error,
        metadata: {
          category: test.category,
          priority: test.priority,
          tags: test.tags,
        },
      };
    }
  }

  /**
   * Execute the test function based on test type
   */
  private async executeTestFunction(test: BaseTest): Promise<any> {
    // This is a simplified implementation
    // In a real implementation, you'd handle different test types appropriately
    if ("test" in test && typeof test.test === "function") {
      return await test.test();
    }

    throw new Error("Test function not found or not callable");
  }

  /**
   * Execute tests with concurrency control
   */
  private async executeTests(
    tests: BaseTest[],
    config: TestRunConfiguration,
    suite?: TestSuite
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    if (config.parallel) {
      // Parallel execution with concurrency limit
      const semaphore = new Semaphore(config.maxConcurrency);

      const promises = tests.map(async (test) => {
        await semaphore.acquire();

        try {
          // Check for cancellation
          if (this.shouldCancel) {
            throw new Error("Test execution cancelled");
          }

          // Wait if paused
          while (this.isPaused && !this.shouldCancel) {
            await this.delay(100);
          }

          // Execute beforeEach hook
          if (suite?.beforeEach) {
            await suite.beforeEach();
          }

          // Run the test with retries
          let result = await this.runTestWithRetries(test, config);

          // Execute afterEach hook
          if (suite?.afterEach) {
            try {
              await suite.afterEach();
            } catch (error) {
              logError(`[${this.context}] afterEach hook failed`, error);
            }
          }

          // Check if we should stop on first failure
          if (!result.success && config.stopOnFirstFailure) {
            this.shouldCancel = true;
          }

          return result;
        } finally {
          semaphore.release();
        }
      });

      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
    } else {
      // Sequential execution
      for (const test of tests) {
        // Check for cancellation
        if (this.shouldCancel) {
          break;
        }

        // Wait if paused
        while (this.isPaused && !this.shouldCancel) {
          await this.delay(100);
        }

        // Execute beforeEach hook
        if (suite?.beforeEach) {
          await suite.beforeEach();
        }

        // Run the test with retries
        const result = await this.runTestWithRetries(test, config);
        results.push(result);

        // Execute afterEach hook
        if (suite?.afterEach) {
          try {
            await suite.afterEach();
          } catch (error) {
            logError(`[${this.context}] afterEach hook failed`, error);
          }
        }

        // Check if we should stop on first failure
        if (!result.success && config.stopOnFirstFailure) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Run test with retry logic
   */
  private async runTestWithRetries(
    test: BaseTest,
    config: TestRunConfiguration
  ): Promise<TestResult> {
    let lastResult: TestResult | null = null;
    const maxAttempts = config.retryFailedTests ? config.maxRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.runTest(test);

        if (result.success || !config.retryFailedTests) {
          return result;
        }

        lastResult = result;

        if (attempt < maxAttempts - 1) {
          devLog(
            `[${this.context}] Retrying test: ${test.name} (attempt ${attempt + 2}/${maxAttempts})`
          );
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      } catch (error) {
        lastResult = {
          testId: test.id,
          success: false,
          executionTime: 0,
          error: error as Error,
        };
      }
    }

    return lastResult!;
  }

  /**
   * Apply filter to tests
   */
  private applyFilter(tests: BaseTest[], filter: TestFilter): BaseTest[] {
    return tests.filter((test) => {
      // Filter by categories
      if (filter.categories && !filter.categories.includes(test.category)) {
        return false;
      }

      // Filter by priorities
      if (filter.priorities && !filter.priorities.includes(test.priority)) {
        return false;
      }

      // Filter by tags
      if (filter.tags && !filter.tags.some((tag) => test.tags.includes(tag))) {
        return false;
      }

      // Filter by name pattern
      if (filter.namePattern && !filter.namePattern.test(test.name)) {
        return false;
      }

      // Exclude categories
      if (filter.excludeCategories && filter.excludeCategories.includes(test.category)) {
        return false;
      }

      // Exclude tags
      if (filter.excludeTags && filter.excludeTags.some((tag) => test.tags.includes(tag))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Shuffle tests for randomized execution
   */
  private shuffleTests(tests: BaseTest[], seed?: number): BaseTest[] {
    const shuffled = [...tests];
    const random = seed ? this.createSeededRandom(seed) : Math.random;

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Create seeded random function
   */
  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Get numeric value for priority
   */
  private getPriorityValue(priority: TestPriority): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[priority] || 2;
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(
    suiteId: string,
    suiteName: string,
    startTime: Date,
    endTime: Date,
    totalTests: number,
    results: TestResult[],
    totalExecutionTime: number
  ): TestExecutionReport {
    const passedTests = results.filter((r) => r.success).length;
    const failedTests = results.filter((r) => !r.success).length;
    const skippedTests = totalTests - results.length;

    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    const averageExecutionTime =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
        : 0;

    const criticalFailures = results.filter(
      (r) => !r.success && r.metadata?.priority === "critical"
    ).length;

    const summary: TestSummary = {
      successRate,
      averageExecutionTime,
      criticalFailures,
      performanceIssues: 0, // Would be calculated based on performance thresholds
      coveragePercentage: 0, // Would be calculated from coverage data
      regressions: 0, // Would be calculated by comparing with previous runs
      improvements: 0, // Would be calculated by comparing with previous runs
    };

    const trends = this.config.enableTrends ? this.getExecutionTrends() : undefined;

    return {
      suiteId,
      suiteName,
      startTime,
      endTime,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalExecutionTime,
      results,
      summary,
      trends,
    };
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * Test suite runner configuration
 */
export interface TestSuiteRunnerConfig {
  defaultTimeout: number;
  maxConcurrency: number;
  retryFailedTests: boolean;
  maxRetries: number;
  stopOnFirstFailure: boolean;
  enableTrends: boolean;
  historySize: number;
}

/**
 * Factory function for creating test suite runner
 */
export function createTestSuiteRunner(
  context?: string,
  config?: Partial<TestSuiteRunnerConfig>
): TestRunner {
  return new EnhancedTestSuiteRunner(context, config);
}

/**
 * Default test suite runner instance
 */
export const defaultTestSuiteRunner = new EnhancedTestSuiteRunner();
