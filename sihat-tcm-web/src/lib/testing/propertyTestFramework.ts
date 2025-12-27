/**
 * Property-Based Testing Framework for Sihat TCM
 *
 * This framework provides utilities for property-based testing using fast-check,
 * specifically tailored for medical and TCM-related scenarios.
 */

import * as fc from "fast-check";

// Configuration for property-based tests
export const PBT_CONFIG = {
  // Minimum iterations as specified in design document
  numRuns: 100,
  // Enable shrinking for better counterexample minimization
  endOnFailure: true,
  // Seed for reproducible tests (can be overridden)
  seed: 42,
  // Verbose output for debugging
  verbose: false,
} as const;

/**
 * Property test runner with standardized configuration
 */
export function runPropertyTest<T>(
  property: Parameters<typeof fc.assert<T>>[0],
  config: Partial<typeof PBT_CONFIG> = {}
): void {
  const testConfig = { ...PBT_CONFIG, ...config };
  fc.assert(property, testConfig);
}

/**
 * Creates a property test with standard configuration and metadata
 */
export function createPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  metadata: {
    featureName: string;
    propertyNumber: number;
    propertyDescription: string;
    validatesRequirements: string[];
  }
) {
  const property = fc.property(arbitrary, predicate);

  // Add metadata as comments for traceability
  const comment = `
    **Feature: ${metadata.featureName}, Property ${metadata.propertyNumber}: ${metadata.propertyDescription}**
    Validates: Requirements ${metadata.validatesRequirements.join(", ")}
  `;

  // Store metadata for reporting
  (property as any).__metadata = {
    name,
    comment,
    ...metadata,
  };

  return property;
}

/**
 * Test result reporter for property-based tests
 */
export class PropertyTestReporter {
  private results: Array<{
    name: string;
    status: "passed" | "failed";
    metadata?: any;
    error?: Error;
    counterexample?: any;
    timestamp: Date;
  }> = [];

  recordResult(
    name: string,
    status: "passed" | "failed",
    metadata?: any,
    error?: Error,
    counterexample?: any
  ): void {
    this.results.push({
      name,
      status,
      metadata,
      error,
      counterexample,
      timestamp: new Date(),
    });
  }

  generateReport(): string {
    const passed = this.results.filter((r) => r.status === "passed").length;
    const failed = this.results.filter((r) => r.status === "failed").length;
    const total = this.results.length;

    let report = `
Property-Based Test Report
=========================
Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}%

`;

    if (failed > 0) {
      report += "Failed Tests:\n";
      this.results
        .filter((r) => r.status === "failed")
        .forEach((result) => {
          report += `
- ${result.name}
  Error: ${result.error?.message || "Unknown error"}
  Counterexample: ${JSON.stringify(result.counterexample, null, 2)}
  Metadata: ${JSON.stringify(result.metadata, null, 2)}
`;
        });
    }

    return report;
  }

  getFailedTests(): Array<{ name: string; error?: Error; counterexample?: any }> {
    return this.results
      .filter((r) => r.status === "failed")
      .map((r) => ({
        name: r.name,
        error: r.error,
        counterexample: r.counterexample,
      }));
  }

  clear(): void {
    this.results = [];
  }
}

// Global reporter instance
export const globalReporter = new PropertyTestReporter();

/**
 * Enhanced property test runner with reporting
 */
export function runPropertyTestWithReporting<T>(
  name: string,
  property: Parameters<typeof fc.assert<T>>[0],
  config: Partial<typeof PBT_CONFIG> = {}
): void {
  const testConfig = { ...PBT_CONFIG, ...config };

  try {
    fc.assert(property, testConfig);
    globalReporter.recordResult(name, "passed", (property as any).__metadata);
  } catch (error) {
    const counterexample =
      error instanceof Error && "counterexample" in error
        ? (error as any).counterexample
        : undefined;

    globalReporter.recordResult(
      name,
      "failed",
      (property as any).__metadata,
      error as Error,
      counterexample
    );
    throw error;
  }
}
