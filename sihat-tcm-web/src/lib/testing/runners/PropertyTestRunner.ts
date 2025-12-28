/**
 * Property Test Runner Implementation
 * 
 * Advanced property-based testing with intelligent shrinking,
 * counterexample minimization, and comprehensive reporting.
 */

import {
  PropertyTest,
  PropertyTestRunner,
  TestResult,
  DataGenerator,
  ShrinkingStrategy,
} from '../interfaces/TestInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Enhanced property test runner with shrinking capabilities
 */
export class EnhancedPropertyTestRunner implements PropertyTestRunner {
  private readonly context: string;
  private readonly config: PropertyTestRunnerConfig;

  constructor(context: string = 'PropertyTestRunner', config: Partial<PropertyTestRunnerConfig> = {}) {
    this.context = context;
    this.config = {
      defaultIterations: 100,
      maxShrinkingAttempts: 100,
      shrinkingTimeout: 30000,
      enableDetailedLogging: false,
      randomSeed: Date.now(),
      ...config,
    };
  }

  /**
   * Run a property-based test with shrinking
   */
  public async runPropertyTest(test: PropertyTest): Promise<TestResult> {
    const startTime = Date.now();
    const iterations = test.iterations || this.config.defaultIterations;

    try {
      devLog(`[${this.context}] Running property test: ${test.name}`, {
        iterations,
        shrinkingEnabled: test.shrinkingEnabled,
      });

      // Set up random seed for reproducibility
      this.seedRandom(this.config.randomSeed);

      let counterExample: any = null;
      let shrinkingSteps = 0;
      let successfulIterations = 0;

      // Run the property test iterations
      for (let i = 0; i < iterations; i++) {
        try {
          const input = test.generator();

          // Check precondition if provided
          if (test.precondition && !test.precondition(input)) {
            continue; // Skip this iteration
          }

          // Run the property function
          const propertyResult = await test.property(input);

          if (!propertyResult) {
            // Property failed - we found a counterexample
            counterExample = input;
            
            devLog(`[${this.context}] Counterexample found at iteration ${i + 1}`, {
              counterExample: this.sanitizeForLogging(input),
            });
            
            break;
          }

          successfulIterations++;

          // Check postcondition if provided
          if (test.postcondition && !test.postcondition(input)) {
            throw new Error('Postcondition failed');
          }

        } catch (error) {
          // Property threw an exception - treat as counterexample
          counterExample = test.generator();
          
          logError(`[${this.context}] Property test threw exception at iteration ${i + 1}`, error);
          break;
        }
      }

      // If we found a counterexample and shrinking is enabled, try to shrink it
      if (counterExample && test.shrinkingEnabled !== false) {
        const shrinkResult = await this.shrinkCounterExample(test, counterExample);
        counterExample = shrinkResult.shrunkExample;
        shrinkingSteps = shrinkResult.steps;
      }

      const executionTime = Date.now() - startTime;
      const success = counterExample === null;

      const result: TestResult = {
        testId: test.id,
        success,
        executionTime,
        iterations: successfulIterations,
        counterExample,
        shrinkingSteps,
        metadata: {
          totalIterations: iterations,
          shrinkingEnabled: test.shrinkingEnabled !== false,
          strategy: test.shrinkingStrategy || 'smart',
        },
      };

      if (!success) {
        result.error = new Error(`Property failed with counterexample: ${JSON.stringify(counterExample)}`);
      }

      devLog(`[${this.context}] Property test completed: ${test.name}`, {
        success,
        iterations: successfulIterations,
        shrinkingSteps,
        executionTime,
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
          action: 'runPropertyTest',
          metadata: { testName: test.name },
        }),
        iterations: 0,
      };
    }
  }

  /**
   * Shrink a counterexample to find the minimal failing case
   */
  public async shrinkCounterExample(test: PropertyTest, counterExample: any): Promise<{ shrunkExample: any; steps: number }> {
    const strategy = test.shrinkingStrategy || 'smart';
    const maxAttempts = this.config.maxShrinkingAttempts;
    const timeout = this.config.shrinkingTimeout;
    
    const startTime = Date.now();
    let currentExample = counterExample;
    let steps = 0;

    try {
      devLog(`[${this.context}] Starting shrinking with strategy: ${strategy}`, {
        originalExample: this.sanitizeForLogging(counterExample),
      });

      while (steps < maxAttempts && (Date.now() - startTime) < timeout) {
        const candidates = this.generateShrinkingCandidates(currentExample, strategy);
        let foundSmallerExample = false;

        for (const candidate of candidates) {
          try {
            // Check if the candidate still fails the property
            const propertyResult = await test.property(candidate);
            
            if (!propertyResult) {
              // This candidate also fails, so it's a valid shrink
              if (this.isSmallerExample(candidate, currentExample)) {
                currentExample = candidate;
                foundSmallerExample = true;
                steps++;
                
                if (this.config.enableDetailedLogging) {
                  devLog(`[${this.context}] Shrinking step ${steps}`, {
                    candidate: this.sanitizeForLogging(candidate),
                  });
                }
                
                break; // Try shrinking this new example further
              }
            }
          } catch (error) {
            // If the candidate throws an exception, it's also a valid counterexample
            if (this.isSmallerExample(candidate, currentExample)) {
              currentExample = candidate;
              foundSmallerExample = true;
              steps++;
              break;
            }
          }
        }

        if (!foundSmallerExample) {
          // No smaller example found, we're done
          break;
        }
      }

      devLog(`[${this.context}] Shrinking completed`, {
        steps,
        finalExample: this.sanitizeForLogging(currentExample),
        executionTime: Date.now() - startTime,
      });

      return { shrunkExample: currentExample, steps };

    } catch (error) {
      logError(`[${this.context}] Error during shrinking`, error);
      return { shrunkExample: counterExample, steps };
    }
  }

  /**
   * Generate test data using the provided generator
   */
  public generateTestData<T>(generator: DataGenerator<T>, count: number): T[] {
    const data: T[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        data.push(generator());
      } catch (error) {
        logError(`[${this.context}] Error generating test data at index ${i}`, error);
        // Continue with other generations
      }
    }
    
    return data;
  }

  // Private helper methods

  /**
   * Generate shrinking candidates based on strategy
   */
  private generateShrinkingCandidates(example: any, strategy: ShrinkingStrategy): any[] {
    switch (strategy) {
      case 'aggressive':
        return this.generateAggressiveCandidates(example);
      case 'conservative':
        return this.generateConservativeCandidates(example);
      case 'smart':
        return this.generateSmartCandidates(example);
      case 'none':
      default:
        return [];
    }
  }

  /**
   * Generate aggressive shrinking candidates (many variations)
   */
  private generateAggressiveCandidates(example: any): any[] {
    const candidates: any[] = [];

    if (typeof example === 'number') {
      // For numbers, try smaller values
      if (example > 0) {
        candidates.push(0, Math.floor(example / 2), example - 1);
      } else if (example < 0) {
        candidates.push(0, Math.ceil(example / 2), example + 1);
      }
    } else if (typeof example === 'string') {
      // For strings, try shorter versions
      if (example.length > 0) {
        candidates.push('', example.slice(0, -1), example.slice(1));
        if (example.length > 2) {
          candidates.push(example.slice(0, Math.floor(example.length / 2)));
        }
      }
    } else if (Array.isArray(example)) {
      // For arrays, try smaller arrays
      if (example.length > 0) {
        candidates.push([]);
        if (example.length > 1) {
          candidates.push(example.slice(0, -1), example.slice(1));
          candidates.push(example.slice(0, Math.floor(example.length / 2)));
        }
        // Try removing individual elements
        for (let i = 0; i < example.length; i++) {
          candidates.push([...example.slice(0, i), ...example.slice(i + 1)]);
        }
      }
    } else if (typeof example === 'object' && example !== null) {
      // For objects, try removing properties
      const keys = Object.keys(example);
      if (keys.length > 0) {
        candidates.push({});
        // Try removing each property
        for (const key of keys) {
          const { [key]: removed, ...rest } = example;
          candidates.push(rest);
        }
      }
    }

    return candidates;
  }

  /**
   * Generate conservative shrinking candidates (fewer, safer variations)
   */
  private generateConservativeCandidates(example: any): any[] {
    const candidates: any[] = [];

    if (typeof example === 'number') {
      if (example > 0) {
        candidates.push(0, example - 1);
      } else if (example < 0) {
        candidates.push(0, example + 1);
      }
    } else if (typeof example === 'string') {
      if (example.length > 0) {
        candidates.push('', example.slice(0, -1));
      }
    } else if (Array.isArray(example)) {
      if (example.length > 0) {
        candidates.push([], example.slice(0, -1));
      }
    } else if (typeof example === 'object' && example !== null) {
      const keys = Object.keys(example);
      if (keys.length > 0) {
        candidates.push({});
      }
    }

    return candidates;
  }

  /**
   * Generate smart shrinking candidates (balanced approach)
   */
  private generateSmartCandidates(example: any): any[] {
    const candidates: any[] = [];

    if (typeof example === 'number') {
      if (example > 0) {
        candidates.push(0);
        if (example > 1) {
          candidates.push(1, Math.floor(example / 2), example - 1);
        }
      } else if (example < 0) {
        candidates.push(0);
        if (example < -1) {
          candidates.push(-1, Math.ceil(example / 2), example + 1);
        }
      }
    } else if (typeof example === 'string') {
      if (example.length > 0) {
        candidates.push('');
        if (example.length > 1) {
          candidates.push(example.slice(0, -1));
          if (example.length > 4) {
            candidates.push(example.slice(0, Math.floor(example.length / 2)));
          }
        }
      }
    } else if (Array.isArray(example)) {
      if (example.length > 0) {
        candidates.push([]);
        if (example.length > 1) {
          candidates.push(example.slice(0, -1));
          if (example.length > 4) {
            candidates.push(example.slice(0, Math.floor(example.length / 2)));
          }
        }
      }
    } else if (typeof example === 'object' && example !== null) {
      const keys = Object.keys(example);
      if (keys.length > 0) {
        candidates.push({});
        if (keys.length > 1) {
          // Try removing the last property
          const { [keys[keys.length - 1]]: removed, ...rest } = example;
          candidates.push(rest);
        }
      }
    }

    return candidates;
  }

  /**
   * Check if one example is "smaller" than another
   */
  private isSmallerExample(candidate: any, current: any): boolean {
    // Simple heuristic for "smaller" - could be made more sophisticated
    const candidateSize = this.getExampleSize(candidate);
    const currentSize = this.getExampleSize(current);
    
    return candidateSize < currentSize;
  }

  /**
   * Get a rough "size" measure for an example
   */
  private getExampleSize(example: any): number {
    if (typeof example === 'number') {
      return Math.abs(example);
    } else if (typeof example === 'string') {
      return example.length;
    } else if (Array.isArray(example)) {
      return example.length + example.reduce((sum, item) => sum + this.getExampleSize(item), 0);
    } else if (typeof example === 'object' && example !== null) {
      return Object.keys(example).length + 
        Object.values(example).reduce((sum, value) => sum + this.getExampleSize(value), 0);
    } else {
      return 1;
    }
  }

  /**
   * Sanitize example for logging (remove sensitive data, limit size)
   */
  private sanitizeForLogging(example: any): any {
    try {
      const serialized = JSON.stringify(example);
      if (serialized.length > 1000) {
        return serialized.substring(0, 1000) + '... [truncated]';
      }
      return example;
    } catch (error) {
      return '[unserializable object]';
    }
  }

  /**
   * Seed the random number generator for reproducible tests
   */
  private seedRandom(seed: number): void {
    // Simple seeded random implementation
    // In a real implementation, you might want to use a more sophisticated PRNG
    let currentSeed = seed;
    
    Math.random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }
}

/**
 * Property test runner configuration
 */
export interface PropertyTestRunnerConfig {
  defaultIterations: number;
  maxShrinkingAttempts: number;
  shrinkingTimeout: number;
  enableDetailedLogging: boolean;
  randomSeed: number;
}

/**
 * Factory function for creating property test runner
 */
export function createPropertyTestRunner(
  context?: string,
  config?: Partial<PropertyTestRunnerConfig>
): PropertyTestRunner {
  return new EnhancedPropertyTestRunner(context, config);
}

/**
 * Default property test runner instance
 */
export const defaultPropertyTestRunner = new EnhancedPropertyTestRunner();