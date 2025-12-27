/**
 * Property-Based Testing Framework - Main Export
 *
 * This module exports all the property-based testing utilities
 * for the Sihat TCM system.
 */

// Core framework
export {
  PBT_CONFIG,
  runPropertyTest,
  createPropertyTest,
  PropertyTestReporter,
  globalReporter,
  runPropertyTestWithReporting,
} from "./propertyTestFramework";

// Medical data generators
export {
  arbitraries,
  medicalHistoryArbitrary,
  patientProfileArbitrary,
  diagnosisSessionArbitrary,
  treatmentRecommendationArbitrary,
  healthTimeSeriesArbitrary,
  validationContextArbitrary,
  imageQualityDataArbitrary,
  syncDataArbitrary,
} from "./medicalDataGenerators";

// Test helpers and patterns
export { testProperty, assertions, patterns, validators, cleanup } from "./propertyTestHelpers";

// Re-export fast-check for convenience
export * as fc from "fast-check";
