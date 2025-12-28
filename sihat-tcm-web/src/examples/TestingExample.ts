/**
 * Example usage of the new modular Testing Framework
 */

import {
  TestFramework,
  TestFactory,
  TestDataGenerators,
  PropertyTestRunner,
  TestSuiteRunner,
  defaultTestFramework,
  createPropertyTest,
  createUnitTest,
  createIntegrationTest
} from '../lib/testing';

import type {
  TestSuite,
  PropertyTest,
  UnitTest,
  TestResult
} from '../lib/testing';

/**
 * Example 1: Using the default framework (simplest approach)
 */
export async function basicTestingExample() {
  // Create a simple test suite
  const suite: TestSuite = {
    name: 'Basic AI Router Tests',
    description: 'Simple tests for AI model routing functionality',
    tests: [
      createPropertyTest(
        'Model Selection Consistency',
        async (input) => {
          // Mock test: ensure model selection is consistent
          const selectedModel = 'gemini-2.0-flash'; // Simplified
          return typeof selectedModel === 'string' && selectedModel.length > 0;
        },
        TestDataGenerators.aiRequest(),
        {
          iterations: 25,
          priority: 'high',
          tags: ['ai', 'consistency']
        }
      ),
      createUnitTest(
        'Basic Configuration Validation',
        async () => {
          // Mock unit test
          const config = { enablePerformanceMonitoring: true };
          return {
            testId: 'config-test',
            success: config.enablePerformanceMonitoring === true,
            executionTime: 10
          };
        },
        {
          priority: 'medium',
          tags: ['config', 'validation']
        }
      )
    ]
  };

  // Run the test suite
  const report = await defaultTestFramework.runTestSuite(suite);
  console.log('Basic test results:', {
    totalTests: report.totalTests,
    successRate: `${report.summary.successRate.toFixed(1)}%`,
    avgTime: `${report.summary.averageExecutionTime.toFixed(0)}ms`
  });

  return report;
}

/**
 * Example 2: Using modular components for advanced control
 */
export async function advancedTestingExample() {
  // Create specialized test framework
  const framework = new TestFramework();
  
  // Generate comprehensive test suite
  const comprehensiveSuite = framework.createComprehensiveTestSuite();
  
  // Add custom tests
  const customTests = [
    createPropertyTest(
      'TCM Diagnosis Consistency',
      async (input) => {
        // Mock TCM diagnosis validation
        const diagnosis = {
          constitution: input.constitution,
          recommendations: ['herb1', 'herb2'],
          confidence: 0.85
        };
        
        return diagnosis.confidence > 0.5 && 
               diagnosis.recommendations.length > 0 &&
               typeof diagnosis.constitution === 'string';
      },
      TestDataGenerators.tcmData(),
      {
        description: 'TCM diagnosis should be consistent and valid',
        iterations: 40,
        priority: 'critical',
        tags: ['tcm', 'diagnosis', 'consistency']
      }
    ),
    createIntegrationTest(
      'Database Connection Test',
      async () => {
        // Mock database connection test
        const connected = true; // Simulate connection check
        return {
          testId: 'db-connection',
          success: connected,
          executionTime: 150,
          metadata: { connectionPool: 'active', latency: '15ms' }
        };
      },
      ['database', 'supabase'],
      'development',
      {
        description: 'Verify database connectivity and performance',
        priority: 'critical',
        tags: ['database', 'integration'],
        timeout: 5000
      }
    )
  ];

  // Add custom tests to suite
  comprehensiveSuite.tests.push(...customTests);

  // Run with detailed reporting
  const report = await framework.runTestSuite(comprehensiveSuite);
  
  console.log('Advanced test results:', {
    suite: report.suiteName,
    duration: `${report.totalExecutionTime}ms`,
    results: {
      total: report.totalTests,
      passed: report.passedTests,
      failed: report.failedTests,
      successRate: `${report.summary.successRate.toFixed(1)}%`
    },
    performance: {
      avgTime: `${report.summary.averageExecutionTime.toFixed(0)}ms`,
      slowTests: report.summary.performanceIssues,
      criticalFailures: report.summary.criticalFailures
    }
  });

  return report;
}

/**
 * Example 3: Using individual components for maximum flexibility
 */
export async function componentBasedTestingExample() {
  // Create individual components
  const propertyRunner = new PropertyTestRunner();
  const suiteRunner = new TestSuiteRunner();

  // Create custom property test
  const customPropertyTest: PropertyTest = {
    id: 'custom-prop-test',
    name: 'Custom Notification Validation',
    description: 'Validate notification data structure and content',
    category: 'property',
    priority: 'high',
    tags: ['notification', 'validation', 'custom'],
    property: async (input) => {
      // Custom validation logic
      const hasRequiredFields = input.title && input.body && input.category;
      const validCategory = ['health', 'medication', 'exercise', 'diet', 'sleep', 'appointments']
        .includes(input.category);
      const validPriority = ['low', 'normal', 'high', 'urgent'].includes(input.priority);
      
      return hasRequiredFields && validCategory && validPriority;
    },
    generator: TestDataGenerators.notificationRequest(),
    iterations: 50,
    shrinkingEnabled: true
  };

  // Run individual property test
  const propertyResult = await propertyRunner.runPropertyTest(customPropertyTest);
  console.log('Property test result:', {
    success: propertyResult.success,
    iterations: propertyResult.iterations,
    executionTime: `${propertyResult.executionTime}ms`,
    counterExample: propertyResult.counterExample
  });

  // Create and run a focused test suite
  const focusedSuite: TestSuite = {
    name: 'Focused Component Tests',
    description: 'Targeted tests for specific components',
    tests: [customPropertyTest],
    beforeAll: async () => {
      console.log('Setting up focused test environment...');
    },
    afterAll: async () => {
      console.log('Cleaning up focused test environment...');
    }
  };

  const suiteResult = await suiteRunner.runTestSuite(focusedSuite);
  console.log('Focused suite result:', suiteResult.summary);

  return { propertyResult, suiteResult };
}

/**
 * Example 4: Data generator showcase
 */
export async function dataGeneratorExample() {
  console.log('=== Data Generator Examples ===');

  // Generate various test data
  const samples = {
    aiRequest: TestDataGenerators.aiRequest()(),
    notificationRequest: TestDataGenerators.notificationRequest()(),
    medicalData: TestDataGenerators.medicalData()(),
    tcmData: TestDataGenerators.tcmData()(),
    userProfile: TestDataGenerators.userProfile()(),
    
    // Custom generators
    customString: TestDataGenerators.string(5, 15)(),
    customArray: TestDataGenerators.array(TestDataGenerators.integer(1, 100), 3, 8)(),
    customObject: TestDataGenerators.object({
      name: TestDataGenerators.string(3, 20),
      age: TestDataGenerators.integer(18, 65),
      active: () => Math.random() > 0.5
    })()
  };

  console.log('Generated test data samples:', samples);
  return samples;
}

/**
 * Example 5: Performance and load testing
 */
export async function performanceTestingExample() {
  const performanceTests = TestFactory.createPerformanceTests();
  
  // Add custom performance tests
  const loadTest = createPropertyTest(
    'High Load Handling',
    async (input) => {
      const startTime = Date.now();
      
      // Simulate processing multiple requests
      const promises = Array.from({ length: 10 }, () => 
        new Promise(resolve => setTimeout(resolve, Math.random() * 50))
      );
      
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      return totalTime < 500; // Should handle 10 concurrent requests in under 500ms
    },
    TestDataGenerators.aiRequest(),
    {
      description: 'System should handle concurrent requests efficiently',
      iterations: 20,
      priority: 'medium',
      tags: ['performance', 'load', 'concurrent']
    }
  );

  const performanceSuite: TestSuite = {
    name: 'Performance Test Suite',
    description: 'Tests focused on system performance and scalability',
    tests: [...performanceTests, loadTest]
  };

  const report = await defaultTestFramework.runTestSuite(performanceSuite);
  
  console.log('Performance test results:', {
    performanceIssues: report.summary.performanceIssues,
    averageTime: `${report.summary.averageExecutionTime.toFixed(0)}ms`,
    slowestTest: Math.max(...report.results.map(r => r.executionTime)),
    fastestTest: Math.min(...report.results.map(r => r.executionTime))
  });

  return report;
}

/**
 * Example 6: Error handling and edge cases
 */
export async function errorHandlingTestExample() {
  const errorTests = [
    createPropertyTest(
      'Error Recovery',
      async (input) => {
        try {
          // Simulate operation that might fail
          if (Math.random() < 0.1) {
            throw new Error('Simulated failure');
          }
          return true;
        } catch (error) {
          // Test error recovery
          console.log('Recovered from error:', error.message);
          return true; // Recovery successful
        }
      },
      TestDataGenerators.aiRequest(),
      {
        description: 'System should gracefully handle and recover from errors',
        iterations: 100,
        priority: 'high',
        tags: ['error-handling', 'recovery', 'resilience']
      }
    ),
    createUnitTest(
      'Invalid Input Handling',
      async () => {
        // Test with invalid inputs
        const invalidInputs = [null, undefined, '', {}, []];
        let handledCorrectly = 0;
        
        for (const input of invalidInputs) {
          try {
            // Mock validation function
            const isValid = input && typeof input === 'object' && Object.keys(input).length > 0;
            if (!isValid) {
              handledCorrectly++;
            }
          } catch (error) {
            handledCorrectly++; // Error handling counts as correct
          }
        }
        
        return {
          testId: 'invalid-input-test',
          success: handledCorrectly === invalidInputs.length,
          executionTime: 5,
          metadata: { handledInputs: handledCorrectly, totalInputs: invalidInputs.length }
        };
      },
      {
        description: 'System should properly validate and handle invalid inputs',
        priority: 'high',
        tags: ['validation', 'error-handling', 'edge-cases']
      }
    )
  ];

  const errorSuite: TestSuite = {
    name: 'Error Handling Test Suite',
    description: 'Tests for error handling and edge case scenarios',
    tests: errorTests
  };

  const report = await defaultTestFramework.runTestSuite(errorSuite);
  console.log('Error handling test results:', report.summary);

  return report;
}

// Export all examples for easy testing
export const testingExamples = {
  basicTestingExample,
  advancedTestingExample,
  componentBasedTestingExample,
  dataGeneratorExample,
  performanceTestingExample,
  errorHandlingTestExample
};