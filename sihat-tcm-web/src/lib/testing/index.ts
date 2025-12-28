/**
 * Testing Framework - Modular Architecture
 * 
 * This is the new modular approach to testing framework.
 * Use these exports for new code instead of the monolithic TestFramework.ts
 */

// Main framework
export { TestFramework, defaultTestFramework } from './TestFramework';

// Core interfaces
export type {
  TestCase,
  PropertyTest,
  UnitTest,
  IntegrationTest,
  TestResult,
  TestCoverage,
  TestSuite,
  TestReport,
  TestCategory,
  TestPriority
} from './interfaces/TestInterfaces';

// Specialized components
export { TestDataGenerators } from './generators/TestDataGenerators';
export { PropertyTestRunner } from './runners/PropertyTestRunner';
export { TestSuiteRunner } from './runners/TestSuiteRunner';
export { TestFactory } from './factories/TestFactory';

// Convenience functions
export {
  createPropertyTest,
  createUnitTest,
  createIntegrationTest
} from './TestFramework';

// Convenience function for quick setup
export function createTestFramework(): TestFramework {
  return new TestFramework();
}