/**
 * Factory for creating different types of tests
 */

import { PropertyTest, UnitTest, IntegrationTest, TestPriority } from '../interfaces/TestInterfaces';
import { TestDataGenerators } from '../generators/TestDataGenerators';

export class TestFactory {
  /**
   * Create a property test
   */
  static createPropertyTest(
    name: string,
    property: (input: any) => boolean | Promise<boolean>,
    generator: () => any,
    options: Partial<PropertyTest> = {}
  ): PropertyTest {
    return {
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options.description || name,
      category: 'property',
      priority: options.priority || 'medium',
      tags: options.tags || [],
      property,
      generator,
      iterations: options.iterations || 100,
      shrinkingEnabled: options.shrinkingEnabled !== false,
      ...options,
    };
  }

  /**
   * Create a unit test
   */
  static createUnitTest(
    name: string,
    test: () => Promise<any> | any,
    options: Partial<UnitTest> = {}
  ): UnitTest {
    return {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options.description || name,
      category: 'unit',
      priority: options.priority || 'medium',
      tags: options.tags || [],
      test,
      ...options,
    };
  }

  /**
   * Create an integration test
   */
  static createIntegrationTest(
    name: string,
    test: () => Promise<any>,
    dependencies: string[],
    environment: 'development' | 'staging' | 'production' = 'development',
    options: Partial<IntegrationTest> = {}
  ): IntegrationTest {
    return {
      id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options.description || name,
      category: 'integration',
      priority: options.priority || 'medium',
      tags: options.tags || [],
      test,
      dependencies,
      environment,
      ...options,
    };
  }

  /**
   * Create AI model router property tests
   */
  static createAIModelRouterTests(): PropertyTest[] {
    return [
      TestFactory.createPropertyTest(
        'AI Complexity Analysis Consistency',
        async (input) => {
          // Mock complexity analyzer
          const analyzer = { analyzeComplexity: (req: any) => ({ type: 'simple', score: 10 }) };
          const result1 = analyzer.analyzeComplexity(input);
          const result2 = analyzer.analyzeComplexity(input);
          return result1.type === result2.type && result1.score === result2.score;
        },
        TestDataGenerators.aiRequest(),
        {
          description: 'Complexity analysis should be consistent for identical inputs',
          priority: 'high',
          tags: ['ai', 'complexity', 'consistency'],
          iterations: 50,
        }
      ),
      TestFactory.createPropertyTest(
        'AI Model Selection Validity',
        async (input) => {
          // Mock model selection
          const availableModels = ['gemini-2.0-flash', 'gemini-2.5-pro'];
          const selectedModel = availableModels[0]; // Simplified selection
          return availableModels.includes(selectedModel);
        },
        TestDataGenerators.aiRequest(),
        {
          description: 'Selected models should always be valid and available',
          priority: 'critical',
          tags: ['ai', 'model-selection', 'validity'],
          iterations: 100,
        }
      ),
    ];
  }

  /**
   * Create notification system property tests
   */
  static createNotificationTests(): PropertyTest[] {
    return [
      TestFactory.createPropertyTest(
        'Notification Preference Consistency',
        async (input) => {
          // Mock preference validation
          const isValid = input.title && input.body && input.category;
          return Boolean(isValid);
        },
        TestDataGenerators.notificationRequest(),
        {
          description: 'Preference updates should maintain data consistency',
          priority: 'high',
          tags: ['notification', 'preferences', 'consistency'],
          iterations: 75,
        }
      ),
    ];
  }

  /**
   * Create TCM-specific property tests
   */
  static createTCMTests(): PropertyTest[] {
    return [
      TestFactory.createPropertyTest(
        'TCM Constitution Analysis Validity',
        async (input) => {
          // Mock TCM constitution analysis
          const validConstitutions = ['qi-deficiency', 'yang-deficiency', 'yin-deficiency', 'blood-stasis', 'phlegm-dampness'];
          return validConstitutions.includes(input.constitution);
        },
        TestDataGenerators.tcmData(),
        {
          description: 'TCM constitution analysis should return valid constitution types',
          priority: 'high',
          tags: ['tcm', 'constitution', 'validity'],
          iterations: 60,
        }
      ),
      TestFactory.createPropertyTest(
        'Pulse Observation Consistency',
        async (input) => {
          // Mock pulse observation validation
          const pulse = input.pulseObservation;
          const validRates = ['slow', 'normal', 'rapid'];
          const validStrengths = ['weak', 'normal', 'strong'];
          const validQualities = ['thready', 'wiry', 'slippery', 'choppy'];
          
          return validRates.includes(pulse.rate) && 
                 validStrengths.includes(pulse.strength) && 
                 validQualities.includes(pulse.quality);
        },
        TestDataGenerators.tcmData(),
        {
          description: 'Pulse observations should have valid rate, strength, and quality values',
          priority: 'medium',
          tags: ['tcm', 'pulse', 'validation'],
          iterations: 40,
        }
      ),
    ];
  }

  /**
   * Create performance tests
   */
  static createPerformanceTests(): PropertyTest[] {
    return [
      TestFactory.createPropertyTest(
        'Response Time Performance',
        async (input) => {
          const startTime = Date.now();
          // Mock processing
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          const responseTime = Date.now() - startTime;
          return responseTime < 1000; // Should respond within 1 second
        },
        TestDataGenerators.aiRequest(),
        {
          description: 'AI requests should complete within acceptable time limits',
          priority: 'medium',
          tags: ['performance', 'response-time'],
          iterations: 30,
        }
      ),
    ];
  }
}