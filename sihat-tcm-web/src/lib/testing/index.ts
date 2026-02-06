/**
 * Testing Framework - Main Export
 *
 * Centralized exports for the testing framework with clean architecture.
 * Provides easy access to all testing components.
 */

// Core interfaces
export * from "./interfaces/TestInterfaces";

// Data generators
export * from "./generators/TestDataGenerators";

// Test runners
export * from "./runners/PropertyTestRunner";
export * from "./runners/TestSuiteRunner";

// Test factories
export * from "./factories/TestFactory";

// Main testing framework
export * from "./TestFramework";

// Property test helpers
export * from "./propertyTestHelpers";

// Medical data generators
export * from "./medicalDataGenerators";

// Re-export commonly used types and functions
export type {
  BaseTest,
  PropertyTest,
  UnitTest,
  IntegrationTest,
  PerformanceTest,
  TestSuite,
  TestResult,
  TestExecutionReport,
  TestRunner,
  PropertyTestRunner,
  TestFactory,
} from "./interfaces/TestInterfaces";

export {
  PrimitiveGenerators,
  CollectionGenerators,
  CombinatorialGenerators,
  TCMGenerators,
  GeneratorUtils,
  TestDataGenerators,
} from "./generators/TestDataGenerators";

export { createPropertyTestRunner, defaultPropertyTestRunner } from "./runners/PropertyTestRunner";

export { createTestSuiteRunner, defaultTestSuiteRunner } from "./runners/TestSuiteRunner";

export { createTestFactory, defaultTestFactory, TestFactoryHelpers } from "./factories/TestFactory";

export {
  createTestFramework,
  defaultTestFramework,
  runTest,
  runTestSuite,
  runPropertyTest,
  createPropertyTest,
  createUnitTest,
} from "./TestFramework";

// Re-export specific helpers used in tests
export { testProperty, assertions, patterns, validators } from "./propertyTestHelpers";

export {
  arbitraries,
  patientProfileArbitrary,
  diagnosisSessionArbitrary,
  treatmentRecommendationArbitrary,
  healthTimeSeriesArbitrary,
  validationContextArbitrary,
  syncDataArbitrary,
} from "./medicalDataGenerators";
