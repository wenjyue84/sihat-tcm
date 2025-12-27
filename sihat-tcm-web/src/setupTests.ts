import "@testing-library/jest-dom";

// Property-based testing setup
import { globalReporter } from "@/lib/testing/propertyTestFramework";

// Clear property test results before each test suite
import { beforeEach, afterAll } from "vitest";

beforeEach(() => {
  globalReporter.clear();
});

// Log property test results after test completion
afterAll(() => {
  const failedTests = globalReporter.getFailedTests();
  if (failedTests.length > 0) {
    console.log("\n=== Property-Based Test Failures ===");
    failedTests.forEach((test) => {
      console.log(`❌ ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error.message}`);
      }
      if (test.counterexample) {
        console.log(`   Counterexample: ${JSON.stringify(test.counterexample, null, 2)}`);
      }
    });
    console.log("=====================================\n");
  }
});
