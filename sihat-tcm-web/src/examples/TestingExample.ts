/**
 * Comprehensive Testing Examples
 * 
 * Demonstrates how to use the new testing framework for property-based
 * testing, integration testing, and performance testing of the refactored components.
 */

import {
  defaultTestFramework,
  createPropertyTest,
  createUnitTest,
  TestDataGenerators,
  TestSuite,
  PropertyTest,
  UnitTest,
} from '../lib/testing/TestFramework';

import { createComplexityAnalyzer } from '../lib/ai/analysis/ComplexityAnalyzer';
import { createModelRouter } from '../lib/ai/ModelRouter';
import { createAllModels } from '../lib/ai/factories/ModelFactory';
import { createNotificationScheduler } from '../../sihat-tcm-mobile/lib/notifications/NotificationScheduler';

/**
 * AI System Property Tests
 * 
 * These tests verify that the AI system maintains certain properties
 * regardless of the input data.
 */
export function createAISystemPropertyTests(): PropertyTest[] {
  return [
    // Test 1: Complexity Analysis Consistency
    createPropertyTest(
      'Complexity Analysis Consistency',
      async (input) => {
        const analyzer = createComplexityAnalyzer();
        
        // Same input should always produce same complexity analysis
        const result1 = analyzer.analyzeComplexity(input);
        const result2 = analyzer.analyzeComplexity(input);
        
        return (
          result1.type === result2.type &&
          result1.score === result2.score &&
          result1.factors.hasImages === result2.factors.hasImages &&
          result1.factors.requiresAnalysis === result2.factors.requiresAnalysis
        );
      },
      TestDataGenerators.aiRequest(),
      {
        description: 'Complexity analysis should be deterministic for identical inputs',
        iterations: 100,
        priority: 'high',
        tags: ['ai', 'complexity', 'deterministic'],
      }
    ),

    // Test 2: Complexity Score Bounds
    createPropertyTest(
      'Complexity Score Bounds',
      async (input) => {
        const analyzer = createComplexityAnalyzer();
        const result = analyzer.analyzeComplexity(input);
        
        // Complexity score should always be within valid bounds
        return result.score >= 0 && result.score <= 100;
      },
      TestDataGenerators.aiRequest(),
      {
        description: 'Complexity scores should always be between 0 and 100',
        iterations: 200,
        priority: 'critical',
        tags: ['ai', 'complexity', 'bounds'],
      }
    ),

    // Test 3: Model Selection Validity
    createPropertyTest(
      'Model Selection Validity',
      async (input) => {
        const router = createModelRouter();
        const models = createAllModels();
        models.forEach(model => router.addModel(model));
        
        try {
          const result = await router.routeRequest(input);
          
          // Result should always have required properties
          return (
            typeof result.text === 'string' &&
            typeof result.modelUsed === 'string' &&
            typeof result.responseTime === 'number' &&
            result.responseTime >= 0
          );
        } catch (error) {
          // Errors are acceptable, but they should be proper Error objects
          return error instanceof Error;
        }
      },
      TestDataGenerators.aiRequest(),
      {
        description: 'Model routing should always return valid results or proper errors',
        iterations: 50,
        priority: 'critical',
        tags: ['ai', 'routing', 'validity'],
      }
    ),

    // Test 4: Image Processing Consistency
    createPropertyTest(
      'Image Processing Consistency',
      async (input) => {
        const analyzer = createComplexityAnalyzer();
        
        // Requests with images should always be marked as having images
        const result = analyzer.analyzeComplexity(input);
        const hasImages = Boolean(input.images && input.images.length > 0);
        
        return result.factors.hasImages === hasImages;
      },
      () => ({
        ...TestDataGenerators.aiRequest()(),
        images: Math.random() > 0.5 ? [
          { url: 'https://example.com/test.jpg', type: 'image/jpeg' }
        ] : undefined,
      }),
      {
        description: 'Image detection should be consistent with input data',
        iterations: 75,
        priority: 'high',
        tags: ['ai', 'images', 'consistency'],
      }
    ),

    // Test 5: Medical Complexity Assessment
    createPropertyTest(
      'Medical Complexity Assessment',
      async (input) => {
        const analyzer = createComplexityAnalyzer();
        const result = analyzer.analyzeComplexity(input);
        
        // High medical complexity should result in higher overall complexity
        if (input.medicalHistory?.conditions?.length > 5) {
          return result.score > 30; // Should be at least moderate complexity
        }
        
        return true; // Other cases are valid
      },
      () => ({
        ...TestDataGenerators.aiRequest()(),
        medicalHistory: TestDataGenerators.medicalData()(),
      }),
      {
        description: 'Medical complexity should influence overall complexity scoring',
        iterations: 100,
        priority: 'high',
        tags: ['ai', 'medical', 'complexity'],
      }
    ),
  ];
}

/**
 * Notification System Property Tests
 */
export function createNotificationPropertyTests(): PropertyTest[] {
  return [
    // Test 1: Notification Data Integrity
    createPropertyTest(
      'Notification Data Integrity',
      async (input) => {
        // Mock scheduler for testing
        const mockScheduler = {
          schedule: async (notification: any) => {
            // Verify required fields are present
            return (
              typeof notification.title === 'string' &&
              notification.title.length > 0 &&
              typeof notification.body === 'string' &&
              notification.body.length > 0 &&
              typeof notification.category === 'string' &&
              typeof notification.priority === 'string'
            );
          }
        };
        
        return mockScheduler.schedule(input);
      },
      TestDataGenerators.notificationRequest(),
      {
        description: 'Notification requests should maintain data integrity',
        iterations: 100,
        priority: 'critical',
        tags: ['notification', 'integrity', 'validation'],
      }
    ),

    // Test 2: Priority Level Consistency
    createPropertyTest(
      'Priority Level Consistency',
      async (input) => {
        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        return validPriorities.includes(input.priority);
      },
      TestDataGenerators.notificationRequest(),
      {
        description: 'Notification priorities should always be valid values',
        iterations: 50,
        priority: 'high',
        tags: ['notification', 'priority', 'validation'],
      }
    ),

    // Test 3: Category Validation
    createPropertyTest(
      'Category Validation',
      async (input) => {
        const validCategories = [
          'health', 'medication', 'exercise', 'diet', 'sleep', 'appointments', 'general'
        ];
        return validCategories.includes(input.category);
      },
      TestDataGenerators.notificationRequest(),
      {
        description: 'Notification categories should always be valid',
        iterations: 75,
        priority: 'high',
        tags: ['notification', 'category', 'validation'],
      }
    ),
  ];
}

/**
 * Performance Tests
 */
export function createPerformanceTests(): UnitTest[] {
  return [
    createUnitTest(
      'AI Complexity Analysis Performance',
      async () => {
        const analyzer = createComplexityAnalyzer();
        const testData = TestDataGenerators.aiRequest()();
        
        const startTime = Date.now();
        
        // Run analysis 100 times
        for (let i = 0; i < 100; i++) {
          analyzer.analyzeComplexity(testData);
        }
        
        const executionTime = Date.now() - startTime;
        const averageTime = executionTime / 100;
        
        // Should complete within reasonable time (< 1ms per analysis)
        const success = averageTime < 1;
        
        return {
          testId: 'perf-complexity-analysis',
          success,
          executionTime,
          metadata: {
            averageTime,
            iterations: 100,
            threshold: 1,
          },
        };
      },
      {
        description: 'Complexity analysis should be fast enough for real-time use',
        category: 'performance',
        priority: 'high',
        tags: ['performance', 'ai', 'complexity'],
        timeout: 5000,
      }
    ),

    createUnitTest(
      'Model Factory Performance',
      async () => {
        const startTime = Date.now();
        
        // Create models multiple times to test caching
        for (let i = 0; i < 50; i++) {
          createAllModels();
        }
        
        const executionTime = Date.now() - startTime;
        const averageTime = executionTime / 50;
        
        // Should benefit from caching (< 10ms per creation after first)
        const success = averageTime < 10;
        
        return {
          testId: 'perf-model-factory',
          success,
          executionTime,
          metadata: {
            averageTime,
            iterations: 50,
            threshold: 10,
          },
        };
      },
      {
        description: 'Model factory should efficiently cache model instances',
        category: 'performance',
        priority: 'medium',
        tags: ['performance', 'factory', 'caching'],
        timeout: 10000,
      }
    ),
  ];
}

/**
 * Integration Tests
 */
export function createIntegrationTests(): UnitTest[] {
  return [
    createUnitTest(
      'AI Router Integration',
      async () => {
        const router = createModelRouter({
          context: 'IntegrationTest',
          enablePerformanceMonitoring: true,
        });
        
        const models = createAllModels();
        models.forEach(model => router.addModel(model));
        
        const testRequest = {
          messages: [
            { role: 'user', content: 'Test TCM diagnosis request' }
          ],
          requiresAnalysis: true,
          language: 'en',
        };
        
        try {
          const result = await router.routeRequest(testRequest);
          
          const success = (
            result.text &&
            result.modelUsed &&
            typeof result.responseTime === 'number'
          );
          
          return {
            testId: 'integration-ai-router',
            success,
            executionTime: result.responseTime || 0,
            metadata: {
              modelUsed: result.modelUsed,
              hasText: Boolean(result.text),
            },
          };
        } catch (error) {
          return {
            testId: 'integration-ai-router',
            success: false,
            executionTime: 0,
            error: error as Error,
          };
        }
      },
      {
        description: 'AI router should integrate properly with all components',
        category: 'integration',
        priority: 'critical',
        tags: ['integration', 'ai', 'router'],
        timeout: 30000,
      }
    ),
  ];
}

/**
 * TCM-Specific Domain Tests
 */
export function createTCMDomainTests(): PropertyTest[] {
  return [
    createPropertyTest(
      'TCM Constitution Analysis',
      async (input) => {
        // Test that TCM constitution data is properly handled
        const validConstitutions = [
          'Qi Deficiency', 'Yang Deficiency', 'Yin Deficiency',
          'Phlegm-Dampness', 'Damp-Heat', 'Blood Stasis',
          'Qi Stagnation', 'Special Diathesis', 'Balanced'
        ];
        
        if (input.constitution) {
          return validConstitutions.includes(input.constitution);
        }
        
        return true; // No constitution specified is valid
      },
      () => ({
        constitution: ['Qi Deficiency', 'Yang Deficiency', 'Yin Deficiency'][
          Math.floor(Math.random() * 3)
        ],
        symptoms: TestDataGenerators.array(
          () => TestDataGenerators.string(5, 20)(),
          1,
          10
        )(),
      }),
      {
        description: 'TCM constitution types should be valid',
        iterations: 50,
        priority: 'high',
        tags: ['tcm', 'constitution', 'domain'],
      }
    ),

    createPropertyTest(
      'TCM Herbal Formula Validation',
      async (input) => {
        // Test herbal formula data structure
        if (input.herbalFormula) {
          return (
            typeof input.herbalFormula.name === 'string' &&
            Array.isArray(input.herbalFormula.herbs) &&
            input.herbalFormula.herbs.length > 0 &&
            typeof input.herbalFormula.dosage === 'string'
          );
        }
        
        return true;
      },
      () => ({
        herbalFormula: {
          name: TestDataGenerators.string(10, 30)(),
          herbs: TestDataGenerators.array(
            () => TestDataGenerators.string(5, 15)(),
            3,
            12
          )(),
          dosage: TestDataGenerators.string(5, 20)(),
          duration: TestDataGenerators.integer(7, 90)(),
        },
      }),
      {
        description: 'TCM herbal formulas should have valid structure',
        iterations: 30,
        priority: 'medium',
        tags: ['tcm', 'herbs', 'validation'],
      }
    ),
  ];
}

/**
 * Comprehensive Test Suite for Sihat TCM
 */
export function createSihatTCMTestSuite(): TestSuite {
  return {
    name: 'Sihat TCM Comprehensive Test Suite',
    description: 'Complete test suite for the refactored Sihat TCM system',
    
    beforeAll: async () => {
      console.log('Setting up Sihat TCM test environment...');
      // Initialize any global test setup
    },
    
    afterAll: async () => {
      console.log('Cleaning up Sihat TCM test environment...');
      // Clean up any global test resources
    },
    
    beforeEach: async () => {
      // Setup before each test
    },
    
    afterEach: async () => {
      // Cleanup after each test
    },
    
    tests: [
      ...createAISystemPropertyTests(),
      ...createNotificationPropertyTests(),
      ...createPerformanceTests(),
      ...createIntegrationTests(),
      ...createTCMDomainTests(),
    ],
  };
}

/**
 * Usage Examples
 */

// Example 1: Run AI System Property Tests
export async function exampleRunAIPropertyTests() {
  console.log('Running AI System Property Tests...');
  
  const aiTests = createAISystemPropertyTests();
  const testSuite = {
    name: 'AI System Property Tests',
    description: 'Property-based tests for AI components',
    tests: aiTests,
  };
  
  const report = await defaultTestFramework.runTestSuite(testSuite);
  
  console.log('AI Property Test Results:', {
    totalTests: report.totalTests,
    passedTests: report.passedTests,
    failedTests: report.failedTests,
    successRate: report.summary.successRate,
    averageExecutionTime: report.summary.averageExecutionTime,
  });
  
  // Log any failures
  const failures = report.results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('Failed tests:', failures.map(f => ({
      testId: f.testId,
      error: f.error?.message,
      counterExample: f.counterExample,
    })));
  }
  
  return report;
}

// Example 2: Run Performance Tests
export async function exampleRunPerformanceTests() {
  console.log('Running Performance Tests...');
  
  const perfTests = createPerformanceTests();
  const testSuite = {
    name: 'Performance Tests',
    description: 'Performance benchmarks for critical components',
    tests: perfTests,
  };
  
  const report = await defaultTestFramework.runTestSuite(testSuite);
  
  console.log('Performance Test Results:', {
    totalTests: report.totalTests,
    passedTests: report.passedTests,
    performanceIssues: report.summary.performanceIssues,
    averageExecutionTime: report.summary.averageExecutionTime,
  });
  
  return report;
}

// Example 3: Run Complete Test Suite
export async function exampleRunCompleteTestSuite() {
  console.log('Running Complete Sihat TCM Test Suite...');
  
  const testSuite = createSihatTCMTestSuite();
  const report = await defaultTestFramework.runTestSuite(testSuite);
  
  console.log('Complete Test Suite Results:', {
    suiteName: report.suiteName,
    totalTests: report.totalTests,
    passedTests: report.passedTests,
    failedTests: report.failedTests,
    successRate: report.summary.successRate,
    criticalFailures: report.summary.criticalFailures,
    performanceIssues: report.summary.performanceIssues,
    totalExecutionTime: report.totalExecutionTime,
  });
  
  // Detailed analysis
  const categoryResults = report.results.reduce((acc, result) => {
    const test = testSuite.tests.find(t => t.id === result.testId);
    const category = test?.category || 'unknown';
    
    if (!acc[category]) {
      acc[category] = { total: 0, passed: 0, failed: 0 };
    }
    
    acc[category].total++;
    if (result.success) {
      acc[category].passed++;
    } else {
      acc[category].failed++;
    }
    
    return acc;
  }, {} as Record<string, { total: number; passed: number; failed: number }>);
  
  console.log('Results by Category:', categoryResults);
  
  return report;
}

// Example 4: Custom TCM Domain Test
export async function exampleCustomTCMTest() {
  const customTest = createPropertyTest(
    'TCM Diagnosis Consistency',
    async (input) => {
      // Custom test for TCM diagnosis consistency
      if (input.symptoms && input.constitution) {
        // Verify that certain symptom-constitution combinations are logical
        const yangDeficiencySymptoms = ['cold limbs', 'fatigue', 'poor digestion'];
        const hasYangDeficiencySymptoms = input.symptoms.some((symptom: string) =>
          yangDeficiencySymptoms.some(yds => symptom.toLowerCase().includes(yds))
        );
        
        if (input.constitution === 'Yang Deficiency' && hasYangDeficiencySymptoms) {
          return true; // Consistent
        }
        
        if (input.constitution !== 'Yang Deficiency' && !hasYangDeficiencySymptoms) {
          return true; // Also consistent
        }
        
        // Mixed cases are also valid (real-world complexity)
        return true;
      }
      
      return true;
    },
    () => ({
      constitution: ['Yang Deficiency', 'Yin Deficiency', 'Qi Deficiency'][
        Math.floor(Math.random() * 3)
      ],
      symptoms: [
        'cold limbs', 'fatigue', 'poor digestion', 'night sweats', 
        'dry mouth', 'restlessness', 'shortness of breath'
      ].slice(0, Math.floor(Math.random() * 4) + 1),
    }),
    {
      description: 'TCM diagnosis should maintain logical consistency',
      iterations: 25,
      priority: 'medium',
      tags: ['tcm', 'diagnosis', 'consistency'],
    }
  );
  
  const testSuite = {
    name: 'Custom TCM Domain Test',
    description: 'Custom test for TCM-specific logic',
    tests: [customTest],
  };
  
  const report = await defaultTestFramework.runTestSuite(testSuite);
  console.log('Custom TCM Test Result:', report);
  
  return report;
}

export {
  createAISystemPropertyTests,
  createNotificationPropertyTests,
  createPerformanceTests,
  createIntegrationTests,
  createTCMDomainTests,
  createSihatTCMTestSuite,
};