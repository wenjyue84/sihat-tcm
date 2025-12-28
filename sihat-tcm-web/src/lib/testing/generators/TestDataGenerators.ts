/**
 * Data generators for property-based testing
 */

export class TestDataGenerators {
  /**
   * Generate random integers within range
   */
  static integer(min: number = -1000, max: number = 1000): () => number {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random strings
   */
  static string(minLength: number = 0, maxLength: number = 100): () => string {
    return () => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
  }

  /**
   * Generate random arrays
   */
  static array<T>(generator: () => T, minLength: number = 0, maxLength: number = 10): () => T[] {
    return () => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      return Array.from({ length }, generator);
    };
  }

  /**
   * Generate random objects
   */
  static object(schema: Record<string, () => any>): () => Record<string, any> {
    return () => {
      const result: Record<string, any> = {};
      for (const [key, generator] of Object.entries(schema)) {
        result[key] = generator();
      }
      return result;
    };
  }

  /**
   * Generate AI request data for testing
   */
  static aiRequest(): () => any {
    return () => ({
      messages: TestDataGenerators.array(
        () => ({
          role: Math.random() > 0.5 ? 'user' : 'assistant',
          content: TestDataGenerators.string(10, 200)(),
        }),
        1,
        20
      )(),
      images: Math.random() > 0.7 ? TestDataGenerators.array(
        () => ({
          url: `https://example.com/image${Math.floor(Math.random() * 1000)}.jpg`,
          type: 'image/jpeg',
        }),
        1,
        5
      )() : undefined,
      requiresAnalysis: Math.random() > 0.5,
      requiresPersonalization: Math.random() > 0.3,
      urgency: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
    });
  }

  /**
   * Generate notification data for testing
   */
  static notificationRequest(): () => any {
    return () => ({
      title: TestDataGenerators.string(5, 50)(),
      body: TestDataGenerators.string(10, 200)(),
      category: ['health', 'medication', 'exercise', 'diet', 'sleep', 'appointments'][
        Math.floor(Math.random() * 6)
      ],
      priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
      data: TestDataGenerators.object({
        type: () => 'test',
        timestamp: () => Date.now(),
      })(),
    });
  }

  /**
   * Generate medical data for testing
   */
  static medicalData(): () => any {
    return () => ({
      conditions: TestDataGenerators.array(
        () => TestDataGenerators.string(5, 30)(),
        0,
        5
      )(),
      medications: TestDataGenerators.array(
        () => ({
          name: TestDataGenerators.string(5, 20)(),
          dosage: TestDataGenerators.string(3, 10)(),
          frequency: ['daily', 'twice daily', 'weekly'][Math.floor(Math.random() * 3)],
        }),
        0,
        8
      )(),
      allergies: TestDataGenerators.array(
        () => TestDataGenerators.string(3, 15)(),
        0,
        3
      )(),
      symptoms: TestDataGenerators.array(
        () => ({
          name: TestDataGenerators.string(5, 25)(),
          severity: TestDataGenerators.integer(1, 10)(),
          duration: TestDataGenerators.string(3, 15)(),
        }),
        1,
        10
      )(),
    });
  }

  /**
   * Generate TCM-specific test data
   */
  static tcmData(): () => any {
    return () => ({
      constitution: ['qi-deficiency', 'yang-deficiency', 'yin-deficiency', 'blood-stasis', 'phlegm-dampness'][
        Math.floor(Math.random() * 5)
      ],
      tongueObservation: {
        color: ['pale', 'red', 'dark-red', 'purple'][Math.floor(Math.random() * 4)],
        coating: ['thin-white', 'thick-white', 'yellow', 'greasy'][Math.floor(Math.random() * 4)],
        texture: ['tender', 'normal', 'stiff'][Math.floor(Math.random() * 3)],
      },
      pulseObservation: {
        rate: ['slow', 'normal', 'rapid'][Math.floor(Math.random() * 3)],
        strength: ['weak', 'normal', 'strong'][Math.floor(Math.random() * 3)],
        quality: ['thready', 'wiry', 'slippery', 'choppy'][Math.floor(Math.random() * 4)],
      },
      symptoms: TestDataGenerators.array(
        () => ({
          name: TestDataGenerators.string(5, 25)(),
          severity: TestDataGenerators.integer(1, 10)(),
          duration: TestDataGenerators.string(3, 15)(),
          pattern: ['heat', 'cold', 'deficiency', 'excess'][Math.floor(Math.random() * 4)],
        }),
        1,
        8
      )(),
    });
  }

  /**
   * Generate user profile data for testing
   */
  static userProfile(): () => any {
    return () => ({
      age: TestDataGenerators.integer(18, 80)(),
      gender: ['male', 'female', 'other'][Math.floor(Math.random() * 3)],
      height: TestDataGenerators.integer(150, 200)(),
      weight: TestDataGenerators.integer(40, 120)(),
      activityLevel: ['sedentary', 'light', 'moderate', 'active', 'very-active'][
        Math.floor(Math.random() * 5)
      ],
      preferences: {
        language: ['en', 'zh', 'ms'][Math.floor(Math.random() * 3)],
        notifications: Math.random() > 0.3,
        dataSharing: Math.random() > 0.5,
      },
    });
  }
}