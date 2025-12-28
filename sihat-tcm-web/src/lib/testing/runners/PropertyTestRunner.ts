/**
 * Property-based test runner with shrinking capabilities
 */

import { PropertyTest, TestResult } from '../interfaces/TestInterfaces';

export class PropertyTestRunner {
  private readonly context = 'PropertyTestRunner';

  /**
   * Run a property test with shrinking
   */
  async runPropertyTest(test: PropertyTest): Promise<TestResult> {
    const startTime = Date.now();
    const iterations = test.iterations || 100;

    try {
      console.log(`[${this.context}] Running property test: ${test.name}`, {
        iterations,
        shrinkingEnabled: test.shrinkingEnabled,
      });

      // Run the property test
      for (let i = 0; i < iterations; i++) {
        const input = test.generator();
        const result = await test.property(input);

        if (!result) {
          // Property failed, try to shrink the counterexample
          const counterExample = test.shrinkingEnabled 
            ? await this.shrinkCounterExample(test, input)
            : input;

          return {
            testId: test.id,
            success: false,
            executionTime: Date.now() - startTime,
            iterations: i + 1,
            counterExample,
            error: new Error(`Property failed with input: ${JSON.stringify(counterExample)}`),
          };
        }
      }

      return {
        testId: test.id,
        success: true,
        executionTime: Date.now() - startTime,
        iterations,
      };

    } catch (error) {
      return {
        testId: test.id,
        success: false,
        executionTime: Date.now() - startTime,
        error: error as Error,
      };
    }
  }

  /**
   * Shrink counterexample to find minimal failing case
   */
  private async shrinkCounterExample(test: PropertyTest, counterExample: any): Promise<any> {
    // Simple shrinking strategy - this could be made more sophisticated
    if (typeof counterExample === 'number') {
      return this.shrinkNumber(test, counterExample);
    } else if (typeof counterExample === 'string') {
      return this.shrinkString(test, counterExample);
    } else if (Array.isArray(counterExample)) {
      return this.shrinkArray(test, counterExample);
    } else if (typeof counterExample === 'object') {
      return this.shrinkObject(test, counterExample);
    }

    return counterExample;
  }

  private async shrinkNumber(test: PropertyTest, value: number): Promise<number> {
    let current = value;
    
    // Try smaller absolute values
    while (Math.abs(current) > 0) {
      const smaller = Math.floor(current / 2);
      if (await test.property(smaller) === false) {
        current = smaller;
      } else {
        break;
      }
    }

    return current;
  }

  private async shrinkString(test: PropertyTest, value: string): Promise<string> {
    let current = value;
    
    // Try shorter strings
    while (current.length > 0) {
      const shorter = current.substring(0, Math.floor(current.length / 2));
      if (await test.property(shorter) === false) {
        current = shorter;
      } else {
        break;
      }
    }

    return current;
  }

  private async shrinkArray(test: PropertyTest, value: any[]): Promise<any[]> {
    let current = [...value];
    
    // Try smaller arrays
    while (current.length > 0) {
      const smaller = current.slice(0, Math.floor(current.length / 2));
      if (await test.property(smaller) === false) {
        current = smaller;
      } else {
        break;
      }
    }

    return current;
  }

  private async shrinkObject(test: PropertyTest, value: any): Promise<any> {
    // For objects, try removing properties
    const keys = Object.keys(value);
    let current = { ...value };

    for (const key of keys) {
      const without = { ...current };
      delete without[key];
      
      if (await test.property(without) === false) {
        current = without;
      }
    }

    return current;
  }
}