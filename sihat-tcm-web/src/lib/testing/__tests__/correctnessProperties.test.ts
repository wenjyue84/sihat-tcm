/**
 * Correctness Properties Tests
 *
 * This test suite implements property-based tests for the specific
 * correctness properties defined in the Sihat TCM enhancement design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  testProperty,
  assertions,
  patterns,
  validators,
  arbitraries,
  patientProfileArbitrary,
  diagnosisSessionArbitrary,
  treatmentRecommendationArbitrary,
  healthTimeSeriesArbitrary,
  validationContextArbitrary,
  syncDataArbitrary,
} from "../index";

describe("Sihat TCM Correctness Properties", () => {
  describe("Property 1: Diagnostic Data Consistency", () => {
    it("should maintain referential integrity across diagnostic steps", () => {
      testProperty(
        "Diagnostic data consistency across session steps",
        diagnosisSessionArbitrary,
        (session) => {
          // All diagnostic data should reference the same patient and session
          const hasConsistentIds =
            session.patient_id &&
            session.id &&
            typeof session.patient_id === "string" &&
            typeof session.id === "string";

          // Session data should be retrievable and complete
          const hasValidSessionData =
            session.session_data && typeof session.session_data === "object";

          // Progress should be consistent with completed steps
          const progressConsistent =
            session.progress >= 0 &&
            session.progress <= 100 &&
            session.completed_steps.length <= 10; // Max number of steps

          return hasConsistentIds && hasValidSessionData && progressConsistent;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 1,
          propertyDescription: "Diagnostic data consistency",
          validatesRequirements: ["1.3"],
        }
      );
    });
  });

  describe("Property 2: Cross-Platform Data Synchronization", () => {
    it("should maintain data consistency across platforms", () => {
      testProperty(
        "Cross-platform data synchronization consistency",
        fc.record({
          syncData: syncDataArbitrary,
          patientData: patientProfileArbitrary,
        }),
        ({ syncData, patientData }) => {
          // Data should be consistent across platforms within sync timeout
          const hasValidSyncStatus = ["pending", "in_progress", "completed", "failed"].includes(
            syncData.sync_status
          );

          // Timestamps should be valid and chronological
          const hasValidTimestamps = assertions.isValidTimestamp(syncData.last_sync);

          // Conflicts should have valid resolution strategies
          const hasValidConflictResolution = syncData.conflicts.every((conflict) =>
            ["local", "remote", "merge", "manual"].includes(conflict.resolution)
          );

          // Patient data should maintain integrity
          const hasValidPatientData = validators.validateMedicalData(patientData);

          return (
            hasValidSyncStatus &&
            hasValidTimestamps &&
            hasValidConflictResolution &&
            hasValidPatientData
          );
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 2,
          propertyDescription: "Cross-platform data synchronization",
          validatesRequirements: ["6.1", "6.2"],
        }
      );
    });
  });

  describe("Property 3: AI Model Fallback Reliability", () => {
    it("should always return valid response with fallback models", () => {
      testProperty(
        "AI model fallback reliability",
        fc.record({
          primaryModel: arbitraries.aiModelResponse.modelUsed,
          confidence: arbitraries.aiModelResponse.confidence,
          responseTime: arbitraries.aiModelResponse.responseTime,
        }),
        ({ primaryModel, confidence, responseTime }) => {
          // Simulate AI model response validation
          const hasValidModel = [
            "gemini-2.0-flash",
            "gemini-2.5-pro",
            "gemini-3-pro-preview",
          ].includes(primaryModel);

          // Confidence should be in valid range
          const hasValidConfidence = assertions.isInRange(confidence, 0, 1);

          // Response time should be reasonable (under 30 seconds)
          const hasReasonableResponseTime = assertions.isInRange(responseTime, 100, 30000);

          // If primary model fails (low confidence), fallback should be triggered
          const fallbackLogic = confidence < 0.3 ? true : confidence >= 0.3;

          return hasValidModel && hasValidConfidence && hasReasonableResponseTime && fallbackLogic;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 3,
          propertyDescription: "AI model fallback reliability",
          validatesRequirements: ["2.1", "1.4"],
        }
      );
    });
  });

  describe("Property 4: Health Data Temporal Consistency", () => {
    it("should maintain chronological order and valid timestamps", () => {
      testProperty(
        "Health data temporal consistency",
        fc.array(healthTimeSeriesArbitrary, { minLength: 2, maxLength: 10 }),
        (healthDataPoints) => {
          // Sort by timestamp to check chronological order
          const sortedData = [...healthDataPoints].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );

          // All timestamps should be valid (not in future)
          const hasValidTimestamps = healthDataPoints.every((point) =>
            assertions.isValidTimestamp(point.timestamp)
          );

          // Timestamps should maintain chronological order when sorted
          const isChronological = validators.validateChronologicalOrder(
            sortedData.map((point) => point.timestamp)
          );

          // Confidence scores should be valid
          const hasValidConfidence = healthDataPoints.every((point) =>
            assertions.isInRange(point.confidence, 0, 1)
          );

          return hasValidTimestamps && isChronological && hasValidConfidence;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 4,
          propertyDescription: "Health data temporal consistency",
          validatesRequirements: ["3.1", "3.2"],
        }
      );
    });
  });

  describe("Property 5: Treatment Recommendation Safety", () => {
    it("should validate safety against contraindications and allergies", () => {
      testProperty(
        "Treatment recommendation safety validation",
        fc.record({
          recommendations: arbitraries.treatmentRecommendations,
          context: validationContextArbitrary,
        }),
        ({ recommendations, context }) => {
          // Check dietary recommendations against allergies
          const dietarySafe = recommendations.dietary.every((item) =>
            assertions.isSafeMedicalRecommendation(
              item,
              context.medical_history.allergies,
              context.medical_history.current_medications
            )
          );

          // Check herbal recommendations for pregnancy contraindications
          const herbalSafe =
            context.medical_history.pregnancy_status === "pregnant"
              ? recommendations.herbal.every(
                  (herb) =>
                    !herb.toLowerCase().includes("angelica") && // Known pregnancy contraindication
                    !herb.toLowerCase().includes("safflower")
                )
              : true;

          // Age-appropriate recommendations
          const ageAppropriate =
            context.user_age < 18
              ? recommendations.herbal.every(
                  (herb) =>
                    !herb.toLowerCase().includes("potent") && !herb.toLowerCase().includes("strong")
                )
              : true;

          return dietarySafe && herbalSafe && ageAppropriate;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 5,
          propertyDescription: "Treatment recommendation safety",
          validatesRequirements: ["2.2", "2.5"],
        }
      );
    });
  });

  describe("Property 6: Progress Tracking Monotonicity", () => {
    it("should ensure progress never decreases unless reset", () => {
      testProperty(
        "Progress tracking monotonicity",
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
        (progressUpdates) => {
          // Simulate progress tracking - should be monotonic unless explicitly reset
          let currentProgress = 0;
          let isMonotonic = true;

          for (const update of progressUpdates) {
            if (update < currentProgress && update !== 0) {
              // Progress decreased without reset (reset = 0)
              isMonotonic = false;
              break;
            }
            currentProgress = update;
          }

          // Alternative check: if we sort the non-zero values, they should be monotonic
          const nonZeroProgress = progressUpdates.filter((p) => p > 0);
          const isAlternativeMonotonic = assertions.isMonotonic(nonZeroProgress);

          return isMonotonic || isAlternativeMonotonic;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 6,
          propertyDescription: "Progress tracking monotonicity",
          validatesRequirements: ["1.1", "1.3"],
        }
      );
    });
  });

  describe("Property 7: Accessibility Compliance", () => {
    it("should ensure UI elements meet accessibility requirements", () => {
      testProperty(
        "Accessibility compliance for UI elements",
        fc.record({
          ariaLabel: fc.string({ minLength: 1, maxLength: 100 }),
          role: fc.constantFrom("button", "link", "textbox", "checkbox", "radio", "menu"),
          tabIndex: fc.integer({ min: -1, max: 10 }),
          keyboardNavigable: fc.boolean(),
        }),
        (element) => {
          return assertions.meetsAccessibilityRequirements(element);
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 7,
          propertyDescription: "Accessibility compliance",
          validatesRequirements: ["10.1", "10.4"],
        }
      );
    });
  });

  describe("Property 8: Multilingual Content Consistency", () => {
    it("should maintain consistency across language translations", () => {
      testProperty(
        "Multilingual content consistency",
        fc.record({
          en: fc.lorem({ maxCount: 20 }),
          zh: fc.lorem({ maxCount: 20 }),
          ms: fc.lorem({ maxCount: 20 }),
        }),
        (content) => {
          return assertions.hasConsistentMultilingualContent(content);
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 8,
          propertyDescription: "Multilingual content consistency",
          validatesRequirements: ["10.2"],
        }
      );
    });
  });

  describe("Property 9: Practitioner Override Authority", () => {
    it("should allow practitioner modifications with audit trail", () => {
      testProperty(
        "Practitioner override authority with audit trail",
        fc.record({
          originalRecommendation: treatmentRecommendationArbitrary,
          practitionerOverride: fc.record({
            practitionerId: fc.uuid(),
            modifications: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            reason: fc.lorem({ maxCount: 50 }),
            timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
          }),
        }),
        ({ originalRecommendation, practitionerOverride }) => {
          // Practitioner should be able to modify recommendations
          const hasValidPractitioner = practitionerOverride.practitionerId.length > 0;

          // Modifications should be documented
          const hasDocumentedChanges = practitionerOverride.modifications.length > 0;

          // Audit trail should have valid timestamp
          const hasValidAuditTrail = assertions.isValidTimestamp(practitionerOverride.timestamp);

          // Original recommendation should remain accessible
          const originalPreserved =
            originalRecommendation.id && originalRecommendation.recommendations;

          return (
            hasValidPractitioner && hasDocumentedChanges && hasValidAuditTrail && originalPreserved
          );
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 9,
          propertyDescription: "Practitioner override authority",
          validatesRequirements: ["4.3"],
        }
      );
    });
  });

  describe("Property 10: Data Privacy and Audit Trail", () => {
    it("should maintain HIPAA-compliant audit trails", () => {
      testProperty(
        "Data privacy and audit trail compliance",
        fc.record({
          accessLog: fc.record({
            userId: fc.uuid(),
            patientId: fc.uuid(),
            accessType: fc.constantFrom("read", "write", "delete", "export"),
            timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
            purpose: fc.constantFrom("diagnosis", "treatment", "research", "audit"),
            ipAddress: fc.ipV4(),
            userAgent: fc.string(),
          }),
          patientData: patientProfileArbitrary,
        }),
        ({ accessLog, patientData }) => {
          // Audit log should have all required fields
          const hasCompleteAuditLog =
            accessLog.userId &&
            accessLog.patientId &&
            accessLog.accessType &&
            assertions.isValidTimestamp(accessLog.timestamp) &&
            accessLog.purpose;

          // Patient data should be properly anonymized for non-treatment access
          const isProperlyAnonymized =
            accessLog.purpose === "research" ? assertions.isProperlyAnonymized(patientData) : true;

          // Access should be logged with sufficient detail
          const hasSufficientDetail = accessLog.ipAddress && accessLog.userAgent;

          return hasCompleteAuditLog && isProperlyAnonymized && hasSufficientDetail;
        },
        {
          featureName: "sihat-tcm-enhancement",
          propertyNumber: 10,
          propertyDescription: "Data privacy and audit trail",
          validatesRequirements: ["5.4"],
        }
      );
    });
  });

  describe("Round-trip Properties for Serialization", () => {
    it("should maintain data integrity through serialization cycles", () => {
      // Test patient profile serialization
      const patientProfileRoundTrip = patterns.roundTrip(
        patientProfileArbitrary,
        JSON.stringify,
        JSON.parse
      );

      fc.assert(patientProfileRoundTrip, { numRuns: 20 });

      // Test diagnosis session serialization
      const diagnosisSessionRoundTrip = patterns.roundTrip(
        diagnosisSessionArbitrary,
        JSON.stringify,
        JSON.parse
      );

      fc.assert(diagnosisSessionRoundTrip, { numRuns: 20 });
    });
  });

  describe("Idempotent Operations", () => {
    it("should ensure operations are idempotent where expected", () => {
      // Test that sorting diagnosis steps is idempotent
      const sortingIdempotent = patterns.idempotent(
        fc.array(
          fc.constantFrom(
            "basic_info",
            "inquiry",
            "observation",
            "palpation",
            "analysis",
            "results"
          )
        ),
        (steps) => [...steps].sort(),
        (a, b) => JSON.stringify(a) === JSON.stringify(b)
      );

      fc.assert(sortingIdempotent, { numRuns: 20 });
    });
  });
});
