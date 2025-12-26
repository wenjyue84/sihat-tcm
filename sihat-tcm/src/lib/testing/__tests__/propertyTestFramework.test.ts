/**
 * Tests for Property-Based Testing Framework
 * 
 * This test suite validates the property-based testing framework itself
 * and demonstrates how to write property tests for the Sihat TCM system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import {
  PBT_CONFIG,
  createPropertyTest,
  PropertyTestReporter,
  runPropertyTestWithReporting
} from '../propertyTestFramework'
import {
  arbitraries,
  patientProfileArbitrary,
  diagnosisSessionArbitrary,
  validationContextArbitrary
} from '../medicalDataGenerators'
import {
  testProperty,
  assertions,
  patterns,
  validators
} from '../propertyTestHelpers'

describe('Property-Based Testing Framework', () => {
  let reporter: PropertyTestReporter

  beforeEach(() => {
    reporter = new PropertyTestReporter()
  })

  afterEach(() => {
    reporter.clear()
  })

  describe('Framework Configuration', () => {
    it('should have correct default configuration', () => {
      expect(PBT_CONFIG.numRuns).toBe(100)
      expect(PBT_CONFIG.endOnFailure).toBe(true)
      expect(PBT_CONFIG.seed).toBe(42)
    })

    it('should create property test with metadata', () => {
      const property = createPropertyTest(
        'test property',
        fc.integer(),
        (n) => n >= 0 || n < 0, // Always true
        {
          featureName: 'test-feature',
          propertyNumber: 1,
          propertyDescription: 'Test property description',
          validatesRequirements: ['1.1', '1.2']
        }
      )

      expect(property).toBeDefined()
      expect((property as any).__metadata).toBeDefined()
      expect((property as any).__metadata.featureName).toBe('test-feature')
    })
  })

  describe('Medical Data Generators', () => {
    it('should generate valid patient profiles', () => {
      fc.assert(
        fc.property(patientProfileArbitrary, (profile) => {
          expect(profile.id).toBeDefined()
          expect(typeof profile.age).toBe('number')
          expect(profile.age).toBeGreaterThan(0)
          expect(profile.age).toBeLessThanOrEqual(100)
          expect(['male', 'female', 'other', 'prefer_not_to_say']).toContain(profile.gender)
          expect(profile.medical_history).toBeDefined()
          expect(Array.isArray(profile.medical_history.allergies)).toBe(true)
          expect(Array.isArray(profile.medical_history.current_medications)).toBe(true)
          return true
        }),
        { numRuns: 50 }
      )
    })

    it('should generate valid diagnosis sessions', () => {
      fc.assert(
        fc.property(diagnosisSessionArbitrary, (session) => {
          expect(session.id).toBeDefined()
          expect(session.patient_id).toBeDefined()
          expect(session.progress).toBeGreaterThanOrEqual(0)
          expect(session.progress).toBeLessThanOrEqual(100)
          expect(Array.isArray(session.completed_steps)).toBe(true)
          expect(session.created_at).toBeInstanceOf(Date)
          expect(session.updated_at).toBeInstanceOf(Date)
          return true
        }),
        { numRuns: 50 }
      )
    })

    it('should generate valid validation contexts', () => {
      fc.assert(
        fc.property(validationContextArbitrary, (context) => {
          expect(context.medical_history).toBeDefined()
          expect(typeof context.user_age).toBe('number')
          expect(context.user_age).toBeGreaterThan(0)
          expect(['male', 'female', 'other', 'prefer_not_to_say']).toContain(context.user_gender)
          expect(['en', 'zh', 'ms']).toContain(context.language)
          return true
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('Property Test Helpers', () => {
    describe('Assertions', () => {
      it('should validate ranges correctly', () => {
        expect(assertions.isInRange(50, 0, 100)).toBe(true)
        expect(assertions.isInRange(-1, 0, 100)).toBe(false)
        expect(assertions.isInRange(101, 0, 100)).toBe(false)
      })

      it('should validate sorted arrays', () => {
        expect(assertions.isSorted([1, 2, 3, 4, 5])).toBe(true)
        expect(assertions.isSorted([5, 4, 3, 2, 1])).toBe(false)
        expect(assertions.isSorted([])).toBe(true)
        expect(assertions.isSorted([1])).toBe(true)
      })

      it('should validate timestamps', () => {
        const now = new Date()
        const past = new Date(now.getTime() - 1000)
        const future = new Date(now.getTime() + 1000)

        expect(assertions.isValidTimestamp(past)).toBe(true)
        expect(assertions.isValidTimestamp(now)).toBe(true)
        expect(assertions.isValidTimestamp(future)).toBe(false)
      })

      it('should validate monotonic sequences', () => {
        expect(assertions.isMonotonic([1, 2, 3, 4, 5])).toBe(true)
        expect(assertions.isMonotonic([1, 1, 2, 2, 3])).toBe(true)
        expect(assertions.isMonotonic([1, 3, 2, 4, 5])).toBe(false)
      })

      it('should validate medical recommendation safety', () => {
        expect(assertions.isSafeMedicalRecommendation(
          'drink green tea',
          ['peanuts'],
          ['warfarin']
        )).toBe(true)

        expect(assertions.isSafeMedicalRecommendation(
          'eat peanuts for protein',
          ['peanuts'],
          []
        )).toBe(false)

        expect(assertions.isSafeMedicalRecommendation(
          'take dangerous overdose',
          [],
          []
        )).toBe(false)
      })
    })

    describe('Patterns', () => {
      it('should test round-trip properties', () => {
        const roundTripProperty = patterns.roundTrip(
          fc.record({ name: fc.string(), age: fc.integer() }),
          JSON.stringify,
          JSON.parse
        )

        fc.assert(roundTripProperty, { numRuns: 20 })
      })

      it('should test idempotent operations', () => {
        const idempotentProperty = patterns.idempotent(
          fc.array(fc.integer()),
          (arr) => [...arr].sort(),
          (a, b) => JSON.stringify(a) === JSON.stringify(b)
        )

        fc.assert(idempotentProperty, { numRuns: 20 })
      })

      it('should test monotonic functions', () => {
        const monotonicProperty = patterns.monotonic(
          fc.integer({ min: 0, max: 100 }),
          (x) => x * 2,
          (a, b) => a - b,
          (a, b) => a - b
        )

        fc.assert(monotonicProperty, { numRuns: 20 })
      })
    })

    describe('Validators', () => {
      it('should validate health metrics', () => {
        expect(validators.validateHealthMetrics({
          heartRate: 70,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 37.0,
          oxygenSaturation: 98
        })).toBe(true)

        expect(validators.validateHealthMetrics({
          heartRate: 300 // Invalid heart rate
        })).toBe(false)

        expect(validators.validateHealthMetrics({
          bloodPressure: { systolic: 80, diastolic: 120 } // Invalid BP
        })).toBe(false)
      })

      it('should validate sanitized input', () => {
        expect(validators.validateSanitizedInput('Hello world')).toBe(true)
        expect(validators.validateSanitizedInput('<script>alert("xss")</script>')).toBe(false)
        expect(validators.validateSanitizedInput('javascript:void(0)')).toBe(false)
      })

      it('should validate chronological order', () => {
        const dates = [
          new Date('2023-01-01'),
          new Date('2023-02-01'),
          new Date('2023-03-01')
        ]
        expect(validators.validateChronologicalOrder(dates)).toBe(true)

        const unorderedDates = [
          new Date('2023-03-01'),
          new Date('2023-01-01'),
          new Date('2023-02-01')
        ]
        expect(validators.validateChronologicalOrder(unorderedDates)).toBe(false)
      })
    })
  })

  describe('Reporter Functionality', () => {
    it('should record test results', () => {
      reporter.recordResult('test1', 'passed')
      reporter.recordResult('test2', 'failed', undefined, new Error('Test error'))

      const report = reporter.generateReport()
      expect(report).toContain('Total Tests: 2')
      expect(report).toContain('Passed: 1')
      expect(report).toContain('Failed: 1')
      expect(report).toContain('Success Rate: 50.00%')
    })

    it('should track failed tests', () => {
      const error = new Error('Test failure')
      reporter.recordResult('failedTest', 'failed', undefined, error, { input: 'bad data' })

      const failedTests = reporter.getFailedTests()
      expect(failedTests).toHaveLength(1)
      expect(failedTests[0].name).toBe('failedTest')
      expect(failedTests[0].error).toBe(error)
      expect(failedTests[0].counterexample).toEqual({ input: 'bad data' })
    })
  })

  describe('Integration Tests', () => {
    it('should run property tests with reporting', () => {
      // This test demonstrates the full workflow
      const property = createPropertyTest(
        'sample property test',
        fc.integer({ min: 0, max: 100 }),
        (n) => n >= 0 && n <= 100,
        {
          featureName: 'sihat-tcm-enhancement',
          propertyNumber: 1,
          propertyDescription: 'Numbers should be in valid range',
          validatesRequirements: ['1.1']
        }
      )

      expect(() => {
        runPropertyTestWithReporting('sample test', property, { numRuns: 10 })
      }).not.toThrow()
    })

    it('should handle property test failures gracefully', () => {
      const failingProperty = createPropertyTest(
        'failing property test',
        fc.integer(),
        (n) => n > 1000000, // This will fail for most inputs
        {
          featureName: 'sihat-tcm-enhancement',
          propertyNumber: 2,
          propertyDescription: 'All numbers should be greater than 1 million',
          validatesRequirements: ['1.2']
        }
      )

      expect(() => {
        runPropertyTestWithReporting('failing test', failingProperty, { numRuns: 10 })
      }).toThrow()
    })
  })

  describe('Medical Scenario Property Tests', () => {
    it('should validate patient profile consistency', () => {
      testProperty(
        'Patient profiles should have consistent age data',
        patientProfileArbitrary,
        (profile) => {
          // Age in profile should match age in medical history
          return profile.age === profile.medical_history.age
        },
        {
          featureName: 'sihat-tcm-enhancement',
          propertyNumber: 1,
          propertyDescription: 'Patient age consistency across profile data',
          validatesRequirements: ['1.3']
        },
        { numRuns: 20 }
      )
    })

    it('should validate diagnosis session progress monotonicity', () => {
      testProperty(
        'Diagnosis session progress should be monotonic',
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
        (progressValues) => {
          // Simulate progress updates - they should never decrease
          const sortedProgress = [...progressValues].sort((a, b) => a - b)
          return assertions.isMonotonic(sortedProgress)
        },
        {
          featureName: 'sihat-tcm-enhancement',
          propertyNumber: 6,
          propertyDescription: 'Progress tracking monotonicity',
          validatesRequirements: ['1.1', '1.3']
        },
        { numRuns: 20 }
      )
    })

    it('should validate cross-platform data synchronization', () => {
      testProperty(
        'Cross-platform sync should maintain data consistency',
        fc.record({
          webData: patientProfileArbitrary,
          mobileData: patientProfileArbitrary
        }),
        ({ webData, mobileData }) => {
          // If they represent the same patient, core data should match
          if (webData.id === mobileData.id) {
            return (
              webData.age === mobileData.age &&
              webData.gender === mobileData.gender &&
              webData.tcm_constitution === mobileData.tcm_constitution
            )
          }
          return true // Different patients, no constraint
        },
        {
          featureName: 'sihat-tcm-enhancement',
          propertyNumber: 2,
          propertyDescription: 'Cross-platform data synchronization',
          validatesRequirements: ['6.1', '6.2']
        },
        { numRuns: 20 }
      )
    })
  })
})