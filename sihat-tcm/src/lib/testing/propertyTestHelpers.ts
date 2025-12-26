/**
 * Property Test Helpers and Utilities
 * 
 * This module provides helper functions and utilities for writing
 * property-based tests in the Sihat TCM system.
 */

import * as fc from 'fast-check'
import { 
  createPropertyTest, 
  runPropertyTestWithReporting, 
  PBT_CONFIG 
} from './propertyTestFramework'

/**
 * Helper function to create and run a property test with standard configuration
 */
export function testProperty<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  metadata: {
    featureName: string
    propertyNumber: number
    propertyDescription: string
    validatesRequirements: string[]
  },
  config: Partial<typeof PBT_CONFIG> = {}
): void {
  const property = createPropertyTest(name, arbitrary, predicate, metadata)
  runPropertyTestWithReporting(name, property, config)
}

/**
 * Assertion helpers for common property test patterns
 */
export const assertions = {
  /**
   * Assert that a value is within a valid range
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  },

  /**
   * Assert that an array is sorted in ascending order
   */
  isSorted<T>(array: T[], compareFn?: (a: T, b: T) => number): boolean {
    if (array.length <= 1) return true
    
    const compare = compareFn || ((a, b) => a < b ? -1 : a > b ? 1 : 0)
    
    for (let i = 1; i < array.length; i++) {
      if (compare(array[i - 1], array[i]) > 0) {
        return false
      }
    }
    return true
  },

  /**
   * Assert that two arrays have the same elements (order doesn't matter)
   */
  haveSameElements<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false
    
    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    
    return sorted1.every((val, index) => val === sorted2[index])
  },

  /**
   * Assert that a timestamp is valid and not in the future
   */
  isValidTimestamp(timestamp: Date | string | number): boolean {
    const date = new Date(timestamp)
    const now = new Date()
    
    return !isNaN(date.getTime()) && date <= now
  },

  /**
   * Assert that a medical recommendation is safe (basic checks)
   */
  isSafeMedicalRecommendation(
    recommendation: string,
    allergies: string[] = [],
    medications: string[] = []
  ): boolean {
    const lowerRec = recommendation.toLowerCase()
    
    // Check for obvious allergy conflicts
    const hasAllergyConflict = allergies.some(allergy => 
      lowerRec.includes(allergy.toLowerCase())
    )
    
    // Check for dangerous combinations (simplified)
    const dangerousTerms = ['overdose', 'excessive', 'dangerous', 'toxic']
    const hasDangerousTerms = dangerousTerms.some(term => 
      lowerRec.includes(term)
    )
    
    return !hasAllergyConflict && !hasDangerousTerms
  },

  /**
   * Assert that progress values are monotonic (non-decreasing)
   */
  isMonotonic(values: number[]): boolean {
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        return false
      }
    }
    return true
  },

  /**
   * Assert that a data structure maintains referential integrity
   */
  hasReferentialIntegrity(
    data: { id: string; [key: string]: any },
    references: { [key: string]: string[] }
  ): boolean {
    for (const [field, validIds] of Object.entries(references)) {
      if (data[field] && !validIds.includes(data[field])) {
        return false
      }
    }
    return true
  },

  /**
   * Assert that sensitive data is properly anonymized
   */
  isProperlyAnonymized(data: any): boolean {
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/ // Credit card pattern
    ]
    
    const dataString = JSON.stringify(data)
    
    return !sensitivePatterns.some(pattern => pattern.test(dataString))
  },

  /**
   * Assert that accessibility requirements are met
   */
  meetsAccessibilityRequirements(element: {
    ariaLabel?: string
    role?: string
    tabIndex?: number
    keyboardNavigable?: boolean
  }): boolean {
    // Basic accessibility checks
    const hasAriaLabel = Boolean(element.ariaLabel)
    const hasValidRole = Boolean(element.role)
    const isKeyboardNavigable = element.keyboardNavigable !== false
    
    return hasAriaLabel && hasValidRole && isKeyboardNavigable
  },

  /**
   * Assert that multilingual content maintains consistency
   */
  hasConsistentMultilingualContent(
    content: { [language: string]: string }
  ): boolean {
    const languages = Object.keys(content)
    
    // All supported languages should have content
    const requiredLanguages = ['en', 'zh', 'ms']
    const hasAllLanguages = requiredLanguages.every(lang => 
      languages.includes(lang) && content[lang].trim().length > 0
    )
    
    // Content should not be identical across languages (basic check)
    const values = Object.values(content)
    const hasVariation = new Set(values).size > 1
    
    return hasAllLanguages && hasVariation
  }
}

/**
 * Common property test patterns for medical systems
 */
export const patterns = {
  /**
   * Round-trip property: serialize then deserialize should return original
   */
  roundTrip<T>(
    arbitrary: fc.Arbitrary<T>,
    serialize: (value: T) => string,
    deserialize: (serialized: string) => T,
    equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ): fc.Property<T> {
    return fc.property(arbitrary, (original) => {
      const serialized = serialize(original)
      const deserialized = deserialize(serialized)
      return equals(original, deserialized)
    })
  },

  /**
   * Idempotence property: applying operation twice should equal applying once
   */
  idempotent<T>(
    arbitrary: fc.Arbitrary<T>,
    operation: (value: T) => T,
    equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ): fc.Property<T> {
    return fc.property(arbitrary, (value) => {
      const once = operation(value)
      const twice = operation(once)
      return equals(once, twice)
    })
  },

  /**
   * Monotonicity property: function should preserve order
   */
  monotonic<T, U>(
    arbitrary: fc.Arbitrary<T>,
    fn: (value: T) => U,
    compare: (a: T, b: T) => number,
    compareResult: (a: U, b: U) => number
  ): fc.Property<[T, T]> {
    return fc.property(fc.tuple(arbitrary, arbitrary), ([a, b]) => {
      if (compare(a, b) <= 0) {
        const resultA = fn(a)
        const resultB = fn(b)
        return compareResult(resultA, resultB) <= 0
      }
      return true
    })
  },

  /**
   * Invariant property: certain conditions should always hold
   */
  invariant<T>(
    arbitrary: fc.Arbitrary<T>,
    operation: (value: T) => T,
    condition: (value: T) => boolean
  ): fc.Property<T> {
    return fc.property(arbitrary, (value) => {
      if (condition(value)) {
        const result = operation(value)
        return condition(result)
      }
      return true
    })
  },

  /**
   * Commutativity property: order of operations shouldn't matter
   */
  commutative<T>(
    arbitrary: fc.Arbitrary<T>,
    operation: (a: T, b: T) => T,
    equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ): fc.Property<[T, T]> {
    return fc.property(fc.tuple(arbitrary, arbitrary), ([a, b]) => {
      const result1 = operation(a, b)
      const result2 = operation(b, a)
      return equals(result1, result2)
    })
  },

  /**
   * Associativity property: grouping shouldn't matter
   */
  associative<T>(
    arbitrary: fc.Arbitrary<T>,
    operation: (a: T, b: T) => T,
    equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ): fc.Property<[T, T, T]> {
    return fc.property(fc.tuple(arbitrary, arbitrary, arbitrary), ([a, b, c]) => {
      const result1 = operation(operation(a, b), c)
      const result2 = operation(a, operation(b, c))
      return equals(result1, result2)
    })
  }
}

/**
 * Utility functions for test data validation
 */
export const validators = {
  /**
   * Validate that medical data follows expected schema
   */
  validateMedicalData(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      data.id.length > 0
    )
  },

  /**
   * Validate that timestamps are in correct chronological order
   */
  validateChronologicalOrder(timestamps: Date[]): boolean {
    return assertions.isSorted(timestamps, (a, b) => a.getTime() - b.getTime())
  },

  /**
   * Validate that health metrics are within physiologically possible ranges
   */
  validateHealthMetrics(metrics: {
    heartRate?: number
    bloodPressure?: { systolic: number; diastolic: number }
    temperature?: number
    oxygenSaturation?: number
  }): boolean {
    if (metrics.heartRate && !assertions.isInRange(metrics.heartRate, 30, 200)) {
      return false
    }
    
    if (metrics.bloodPressure) {
      const { systolic, diastolic } = metrics.bloodPressure
      if (!assertions.isInRange(systolic, 70, 250) || 
          !assertions.isInRange(diastolic, 40, 150) ||
          systolic <= diastolic) {
        return false
      }
    }
    
    if (metrics.temperature && !assertions.isInRange(metrics.temperature, 32, 45)) {
      return false
    }
    
    if (metrics.oxygenSaturation && !assertions.isInRange(metrics.oxygenSaturation, 70, 100)) {
      return false
    }
    
    return true
  },

  /**
   * Validate that user input is properly sanitized
   */
  validateSanitizedInput(input: string): boolean {
    // Check for common XSS patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(input))
  }
}

/**
 * Test data cleanup utilities
 */
export const cleanup = {
  /**
   * Remove test data from database (mock implementation)
   */
  async cleanupTestData(testIds: string[]): Promise<void> {
    // In a real implementation, this would clean up test data from the database
    console.log(`Cleaning up test data for IDs: ${testIds.join(', ')}`)
  },

  /**
   * Reset global test state
   */
  resetTestState(): void {
    // Reset any global state that might affect tests
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      window.sessionStorage.clear()
    }
  }
}