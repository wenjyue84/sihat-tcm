/**
 * Test suite runner with comprehensive reporting
 */

import { TestSuite, TestResult, TestReport, PropertyTest, UnitTest, IntegrationTest } from '../interfaces/TestInterfaces';
import { PropertyTestRunner } from './PropertyTestRunner';

export class TestSuiteRunner {
  private propertyRunner = new PropertyTestRunner();
  private readonly context = 'TestSuiteRunner';

  /**
   * Run a complete test suite
   */
  async runTestSuite(suite: TestSuite): Promise<TestReport> {
    const startTime = new Date();
    const results: TestResult[] = [];

    try {
      console.log(`[${this.context}] Running test suite: ${suite.name}`);

      // Run beforeAll hook
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Run each test
      for (const test of suite.tests) {
        try {
          // Run beforeEach hook
          if (suite.beforeEach) {
            await suite.beforeEach();
          }

          // Run the test
          const result = await this.runSingleTest(test);
          results.push(result);

          // Run afterEach hook
          if (suite.afterEach) {
            await suite.afterEach();
          }

        } catch (error) {
          results.push({
            testId: test.id,
            success: false,
            executionTime: 0,
            error: error as Error,
          });
        }
      }

      // Run afterAll hook
      if (suite.afterAll) {
        await suite.afterAll();
      }

    } catch (error) {
      console.error(`[${this.context}] Test suite failed`, error);
    }

    const endTime = new Date();
    return this.generateReport(suite, startTime, endTime, results);
  }

  /**
   * Run a single test
   */
  private async runSingleTest(test: PropertyTest | UnitTest | IntegrationTest): Promise<TestResult> {
    const timeout = test.timeout || 30000;

    try {
      // Setup
      if (test.setup) {
        await test.setup();
      }

      // Run test with timeout
      const result = await Promise.race([
        this.executeTest(test),
        new Promise<TestResult>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), timeout)
        ),
      ]);

      // Teardown
      if (test.teardown) {
        await test.teardown();
      }

      return result;

    } catch (error) {
      return {
        testId: test.id,
        success: false,
        executionTime: 0,
        error: error as Error,
      };
    }
  }

  /**
   * Execute test based on type
   */
  private async executeTest(test: PropertyTest | UnitTest | IntegrationTest): Promise<TestResult> {
    if ('property' in test) {
      return this.propertyRunner.runPropertyTest(test);
    } else {
      const startTime = Date.now();
      const result = await test.test();
      
      if ('success' in result) {
        return result;
      } else {
        return {
          testId: test.id,
          success: true,
          executionTime: Date.now() - startTime,
        };
      }
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(
    suite: TestSuite,
    startTime: Date,
    endTime: Date,
    results: TestResult[]
  ): TestReport {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    const skippedTests = 0; // Could be implemented

    const totalExecutionTime = endTime.getTime() - startTime.getTime();
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;

    const criticalFailures = results.filter(r => 
      !r.success && suite.tests.find(t => t.id === r.testId)?.priority === 'critical'
    ).length;

    const performanceIssues = results.filter(r => 
      r.executionTime > 5000 // Tests taking more than 5 seconds
    ).length;

    return {
      suiteId: `suite-${Date.now()}`,
      suiteName: suite.name,
      startTime,
      endTime,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalExecutionTime,
      results,
      summary: {
        successRate: (passedTests / totalTests) * 100,
        averageExecutionTime,
        criticalFailures,
        performanceIssues,
      },
    };
  }
}