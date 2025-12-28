/**
 * Test Data Generators
 * 
 * Comprehensive collection of data generators for property-based testing
 * with domain-specific generators for Sihat TCM application.
 */

import { DataGenerator } from '../interfaces/TestInterfaces';

/**
 * Basic primitive generators
 */
export class PrimitiveGenerators {
  /**
   * Generate random integers within range
   */
  static integer(min: number = -1000, max: number = 1000): DataGenerator<number> {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate positive integers
   */
  static positiveInteger(max: number = 1000): DataGenerator<number> {
    return () => Math.floor(Math.random() * max) + 1;
  }

  /**
   * Generate floating point numbers
   */
  static float(min: number = -1000, max: number = 1000): DataGenerator<number> {
    return () => Math.random() * (max - min) + min;
  }

  /**
   * Generate boolean values
   */
  static boolean(): DataGenerator<boolean> {
    return () => Math.random() > 0.5;
  }

  /**
   * Generate strings with configurable length and character set
   */
  static string(
    minLength: number = 0, 
    maxLength: number = 100, 
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): DataGenerator<string> {
    return () => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return result;
    };
  }

  /**
   * Generate alphanumeric strings
   */
  static alphanumeric(minLength: number = 1, maxLength: number = 50): DataGenerator<string> {
    return PrimitiveGenerators.string(minLength, maxLength, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  /**
   * Generate alphabetic strings
   */
  static alphabetic(minLength: number = 1, maxLength: number = 50): DataGenerator<string> {
    return PrimitiveGenerators.string(minLength, maxLength, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
  }

  /**
   * Generate numeric strings
   */
  static numeric(minLength: number = 1, maxLength: number = 10): DataGenerator<string> {
    return PrimitiveGenerators.string(minLength, maxLength, '0123456789');
  }

  /**
   * Generate dates within a range
   */
  static date(start?: Date, end?: Date): DataGenerator<Date> {
    const startTime = start ? start.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago
    const endTime = end ? end.getTime() : Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year from now
    
    return () => new Date(startTime + Math.random() * (endTime - startTime));
  }

  /**
   * Generate UUIDs (mock implementation)
   */
  static uuid(): DataGenerator<string> {
    return () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }

  /**
   * Generate email addresses
   */
  static email(): DataGenerator<string> {
    const domains = ['example.com', 'test.org', 'demo.net', 'sample.io'];
    return () => {
      const username = PrimitiveGenerators.alphanumeric(3, 15)();
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${username}@${domain}`;
    };
  }

  /**
   * Generate URLs
   */
  static url(): DataGenerator<string> {
    const protocols = ['http', 'https'];
    const domains = ['example.com', 'test.org', 'demo.net'];
    const paths = ['', '/api', '/v1', '/users', '/data'];
    
    return () => {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const path = paths[Math.floor(Math.random() * paths.length)];
      return `${protocol}://${domain}${path}`;
    };
  }
}

/**
 * Collection generators for arrays, objects, etc.
 */
export class CollectionGenerators {
  /**
   * Generate arrays with configurable element generator
   */
  static array<T>(
    elementGenerator: DataGenerator<T>, 
    minLength: number = 0, 
    maxLength: number = 10
  ): DataGenerator<T[]> {
    return () => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      return Array.from({ length }, elementGenerator);
    };
  }

  /**
   * Generate non-empty arrays
   */
  static nonEmptyArray<T>(
    elementGenerator: DataGenerator<T>, 
    maxLength: number = 10
  ): DataGenerator<T[]> {
    return CollectionGenerators.array(elementGenerator, 1, maxLength);
  }

  /**
   * Generate objects with specified schema
   */
  static object<T extends Record<string, any>>(
    schema: { [K in keyof T]: DataGenerator<T[K]> }
  ): DataGenerator<T> {
    return () => {
      const result = {} as T;
      for (const [key, generator] of Object.entries(schema)) {
        result[key as keyof T] = generator();
      }
      return result;
    };
  }

  /**
   * Generate partial objects (some properties may be undefined)
   */
  static partialObject<T extends Record<string, any>>(
    schema: { [K in keyof T]: DataGenerator<T[K]> },
    probability: number = 0.7
  ): DataGenerator<Partial<T>> {
    return () => {
      const result = {} as Partial<T>;
      for (const [key, generator] of Object.entries(schema)) {
        if (Math.random() < probability) {
          result[key as keyof T] = generator();
        }
      }
      return result;
    };
  }

  /**
   * Generate maps with key-value pairs
   */
  static map<K, V>(
    keyGenerator: DataGenerator<K>,
    valueGenerator: DataGenerator<V>,
    minSize: number = 0,
    maxSize: number = 10
  ): DataGenerator<Map<K, V>> {
    return () => {
      const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      const map = new Map<K, V>();
      for (let i = 0; i < size; i++) {
        map.set(keyGenerator(), valueGenerator());
      }
      return map;
    };
  }

  /**
   * Generate sets with unique elements
   */
  static set<T>(
    elementGenerator: DataGenerator<T>,
    minSize: number = 0,
    maxSize: number = 10
  ): DataGenerator<Set<T>> {
    return () => {
      const targetSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      const set = new Set<T>();
      let attempts = 0;
      const maxAttempts = targetSize * 10; // Prevent infinite loops
      
      while (set.size < targetSize && attempts < maxAttempts) {
        set.add(elementGenerator());
        attempts++;
      }
      
      return set;
    };
  }
}

/**
 * Combinatorial generators for complex data patterns
 */
export class CombinatorialGenerators {
  /**
   * Choose one generator from a list
   */
  static oneOf<T>(...generators: DataGenerator<T>[]): DataGenerator<T> {
    return () => {
      const generator = generators[Math.floor(Math.random() * generators.length)];
      return generator();
    };
  }

  /**
   * Weighted choice of generators
   */
  static frequency<T>(
    weightedGenerators: Array<{ weight: number; generator: DataGenerator<T> }>
  ): DataGenerator<T> {
    const totalWeight = weightedGenerators.reduce((sum, wg) => sum + wg.weight, 0);
    
    return () => {
      let random = Math.random() * totalWeight;
      for (const { weight, generator } of weightedGenerators) {
        random -= weight;
        if (random <= 0) {
          return generator();
        }
      }
      // Fallback to last generator
      return weightedGenerators[weightedGenerators.length - 1].generator();
    };
  }

  /**
   * Generate tuples with different types
   */
  static tuple<T extends readonly unknown[]>(
    ...generators: { [K in keyof T]: DataGenerator<T[K]> }
  ): DataGenerator<T> {
    return () => generators.map(gen => gen()) as T;
  }

  /**
   * Generate optional values (may be undefined)
   */
  static optional<T>(generator: DataGenerator<T>, probability: number = 0.5): DataGenerator<T | undefined> {
    return () => Math.random() < probability ? generator() : undefined;
  }

  /**
   * Generate nullable values (may be null)
   */
  static nullable<T>(generator: DataGenerator<T>, probability: number = 0.1): DataGenerator<T | null> {
    return () => Math.random() < probability ? null : generator();
  }

  /**
   * Generate recursive structures with depth limit
   */
  static recursive<T>(
    baseGenerator: DataGenerator<T>,
    recursiveGenerator: (gen: DataGenerator<T>) => DataGenerator<T>,
    maxDepth: number = 5
  ): DataGenerator<T> {
    const generate = (depth: number): DataGenerator<T> => {
      if (depth >= maxDepth) {
        return baseGenerator;
      }
      return CombinatorialGenerators.oneOf(
        baseGenerator,
        recursiveGenerator(generate(depth + 1))
      );
    };
    
    return generate(0);
  }
}

/**
 * Domain-specific generators for Sihat TCM
 */
export class TCMGenerators {
  /**
   * Generate AI request data
   */
  static aiRequest(): DataGenerator<any> {
    return CollectionGenerators.object({
      messages: CollectionGenerators.array(
        CollectionGenerators.object({
          role: CombinatorialGenerators.oneOf(
            () => 'user',
            () => 'assistant',
            () => 'system'
          ),
          content: PrimitiveGenerators.string(10, 500),
        }),
        1,
        20
      ),
      images: CombinatorialGenerators.optional(
        CollectionGenerators.array(
          CollectionGenerators.object({
            url: PrimitiveGenerators.url(),
            type: CombinatorialGenerators.oneOf(
              () => 'tongue',
              () => 'face',
              () => 'pulse',
              () => 'general'
            ),
          }),
          1,
          5
        )
      ),
      requiresAnalysis: PrimitiveGenerators.boolean(),
      requiresPersonalization: PrimitiveGenerators.boolean(),
      urgency: CombinatorialGenerators.oneOf(
        () => 'low',
        () => 'normal',
        () => 'high',
        () => 'urgent'
      ),
      language: CombinatorialGenerators.oneOf(
        () => 'en',
        () => 'zh',
        () => 'ms'
      ),
      medicalSpecialty: CombinatorialGenerators.optional(
        () => 'tcm'
      ),
    });
  }

  /**
   * Generate notification request data
   */
  static notificationRequest(): DataGenerator<any> {
    return CollectionGenerators.object({
      title: PrimitiveGenerators.string(5, 100),
      body: PrimitiveGenerators.string(10, 500),
      category: CombinatorialGenerators.oneOf(
        () => 'health',
        () => 'medication',
        () => 'exercise',
        () => 'diet',
        () => 'sleep',
        () => 'appointments',
        () => 'general'
      ),
      priority: CombinatorialGenerators.oneOf(
        () => 'low',
        () => 'normal',
        () => 'high',
        () => 'urgent'
      ),
      data: CombinatorialGenerators.optional(
        CollectionGenerators.object({
          type: PrimitiveGenerators.alphanumeric(3, 20),
          timestamp: PrimitiveGenerators.date(),
          metadata: CombinatorialGenerators.optional(
            CollectionGenerators.object({
              source: PrimitiveGenerators.alphanumeric(3, 15),
              version: PrimitiveGenerators.string(1, 10, '0123456789.'),
            })
          ),
        })
      ),
    });
  }

  /**
   * Generate medical history data
   */
  static medicalHistory(): DataGenerator<any> {
    return CollectionGenerators.object({
      conditions: CollectionGenerators.array(
        PrimitiveGenerators.string(5, 50),
        0,
        8
      ),
      medications: CollectionGenerators.array(
        CollectionGenerators.object({
          name: PrimitiveGenerators.string(5, 30),
          dosage: PrimitiveGenerators.string(3, 15),
          frequency: CombinatorialGenerators.oneOf(
            () => 'daily',
            () => 'twice daily',
            () => 'three times daily',
            () => 'weekly',
            () => 'as needed'
          ),
          startDate: PrimitiveGenerators.date(
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            new Date()
          ),
        }),
        0,
        10
      ),
      allergies: CollectionGenerators.array(
        PrimitiveGenerators.string(3, 25),
        0,
        5
      ),
      symptoms: CollectionGenerators.array(
        CollectionGenerators.object({
          name: PrimitiveGenerators.string(5, 40),
          severity: PrimitiveGenerators.integer(1, 10),
          duration: PrimitiveGenerators.string(3, 20),
          onset: PrimitiveGenerators.date(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
          ),
        }),
        1,
        15
      ),
      familyHistory: CombinatorialGenerators.optional(
        CollectionGenerators.array(
          CollectionGenerators.object({
            relation: CombinatorialGenerators.oneOf(
              () => 'parent',
              () => 'sibling',
              () => 'grandparent',
              () => 'aunt/uncle',
              () => 'cousin'
            ),
            condition: PrimitiveGenerators.string(5, 30),
          }),
          0,
          5
        )
      ),
    });
  }

  /**
   * Generate TCM constitution data
   */
  static tcmConstitution(): DataGenerator<any> {
    const constitutions = [
      'balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency',
      'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation', 'special_diathesis'
    ];
    
    return CollectionGenerators.object({
      constitution: CombinatorialGenerators.oneOf(
        ...constitutions.map(c => () => c)
      ),
      score: PrimitiveGenerators.integer(1, 100),
      confidence: PrimitiveGenerators.float(0, 1),
      symptoms: CollectionGenerators.array(
        PrimitiveGenerators.string(5, 30),
        1,
        10
      ),
      recommendations: CollectionGenerators.array(
        CollectionGenerators.object({
          type: CombinatorialGenerators.oneOf(
            () => 'diet',
            () => 'exercise',
            () => 'lifestyle',
            () => 'herbal',
            () => 'acupuncture'
          ),
          description: PrimitiveGenerators.string(10, 100),
          priority: CombinatorialGenerators.oneOf(
            () => 'low',
            () => 'medium',
            () => 'high'
          ),
        }),
        1,
        8
      ),
      seasonalAdvice: CombinatorialGenerators.optional(
        CollectionGenerators.object({
          season: CombinatorialGenerators.oneOf(
            () => 'spring',
            () => 'summer',
            () => 'autumn',
            () => 'winter'
          ),
          advice: PrimitiveGenerators.string(20, 200),
        })
      ),
    });
  }

  /**
   * Generate diagnostic session data
   */
  static diagnosticSession(): DataGenerator<any> {
    return CollectionGenerators.object({
      sessionId: PrimitiveGenerators.uuid(),
      patientId: PrimitiveGenerators.uuid(),
      practitionerId: CombinatorialGenerators.optional(PrimitiveGenerators.uuid()),
      startTime: PrimitiveGenerators.date(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      diagnosticType: CombinatorialGenerators.oneOf(
        () => 'observation',
        () => 'listening',
        () => 'inquiry',
        () => 'palpation',
        () => 'comprehensive'
      ),
      observations: CombinatorialGenerators.optional(
        CollectionGenerators.object({
          tongue: CollectionGenerators.object({
            color: CombinatorialGenerators.oneOf(
              () => 'pale',
              () => 'red',
              () => 'dark_red',
              () => 'purple'
            ),
            coating: CombinatorialGenerators.oneOf(
              () => 'thin_white',
              () => 'thick_white',
              () => 'yellow',
              () => 'greasy'
            ),
            texture: CombinatorialGenerators.oneOf(
              () => 'normal',
              () => 'swollen',
              () => 'thin',
              () => 'cracked'
            ),
          }),
          complexion: CombinatorialGenerators.oneOf(
            () => 'bright',
            () => 'pale',
            () => 'sallow',
            () => 'flushed'
          ),
        })
      ),
      pulse: CombinatorialGenerators.optional(
        CollectionGenerators.object({
          rate: PrimitiveGenerators.integer(50, 120),
          rhythm: CombinatorialGenerators.oneOf(
            () => 'regular',
            () => 'irregular',
            () => 'intermittent'
          ),
          strength: CombinatorialGenerators.oneOf(
            () => 'weak',
            () => 'normal',
            () => 'strong',
            () => 'bounding'
          ),
          quality: CombinatorialGenerators.oneOf(
            () => 'floating',
            () => 'deep',
            () => 'rapid',
            () => 'slow',
            () => 'slippery',
            () => 'wiry'
          ),
        })
      ),
      status: CombinatorialGenerators.oneOf(
        () => 'in_progress',
        () => 'completed',
        () => 'cancelled'
      ),
    });
  }

  /**
   * Generate performance metrics data
   */
  static performanceMetrics(): DataGenerator<any> {
    return CollectionGenerators.object({
      modelId: PrimitiveGenerators.alphanumeric(5, 20),
      requestType: CombinatorialGenerators.oneOf(
        () => 'simple',
        () => 'moderate',
        () => 'complex',
        () => 'advanced'
      ),
      responseTime: PrimitiveGenerators.integer(100, 10000),
      success: PrimitiveGenerators.boolean(),
      timestamp: PrimitiveGenerators.date(),
      tokenCount: CombinatorialGenerators.optional(
        PrimitiveGenerators.integer(10, 5000)
      ),
      costEstimate: CombinatorialGenerators.optional(
        PrimitiveGenerators.float(0.001, 1.0)
      ),
      retryCount: CombinatorialGenerators.optional(
        PrimitiveGenerators.integer(0, 3)
      ),
      errorType: CombinatorialGenerators.optional(
        CombinatorialGenerators.oneOf(
          () => 'timeout',
          () => 'rate_limit',
          () => 'network_error',
          () => 'validation_error',
          () => 'server_error'
        )
      ),
    });
  }
}

/**
 * Utility functions for generators
 */
export class GeneratorUtils {
  /**
   * Create a generator that always returns the same value
   */
  static constant<T>(value: T): DataGenerator<T> {
    return () => value;
  }

  /**
   * Create a generator from a list of values
   */
  static elements<T>(...values: T[]): DataGenerator<T> {
    return () => values[Math.floor(Math.random() * values.length)];
  }

  /**
   * Create a generator that applies a function to another generator's output
   */
  static map<T, U>(generator: DataGenerator<T>, fn: (value: T) => U): DataGenerator<U> {
    return () => fn(generator());
  }

  /**
   * Create a generator that filters another generator's output
   */
  static filter<T>(
    generator: DataGenerator<T>, 
    predicate: (value: T) => boolean,
    maxAttempts: number = 100
  ): DataGenerator<T> {
    return () => {
      for (let i = 0; i < maxAttempts; i++) {
        const value = generator();
        if (predicate(value)) {
          return value;
        }
      }
      throw new Error(`Failed to generate valid value after ${maxAttempts} attempts`);
    };
  }

  /**
   * Create a generator that combines multiple generators
   */
  static combine<T>(...generators: DataGenerator<T>[]): DataGenerator<T[]> {
    return () => generators.map(gen => gen());
  }

  /**
   * Create a seeded random generator for reproducible tests
   */
  static seeded(seed: number): {
    integer: (min?: number, max?: number) => DataGenerator<number>;
    float: (min?: number, max?: number) => DataGenerator<number>;
    boolean: () => DataGenerator<boolean>;
  } {
    let currentSeed = seed;
    
    const random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    return {
      integer: (min = -1000, max = 1000) => () => Math.floor(random() * (max - min + 1)) + min,
      float: (min = -1000, max = 1000) => () => random() * (max - min) + min,
      boolean: () => () => random() > 0.5,
    };
  }
}

/**
 * Export all generators for easy access
 */
export const TestDataGenerators = {
  ...PrimitiveGenerators,
  ...CollectionGenerators,
  ...CombinatorialGenerators,
  ...TCMGenerators,
  ...GeneratorUtils,
};