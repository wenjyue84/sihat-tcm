/**
 * Developer Test Runner API
 *
 * This endpoint allows the developer dashboard to run automated test suites
 * and return the results in real-time.
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Test suite configurations
const TEST_SUITES = {
  accessibility: {
    name: "Accessibility Manager",
    command: "npm test -- accessibilityManager.test.ts --run --reporter=json",
    timeout: 30000,
  },
  imageQuality: {
    name: "Image Quality Validator",
    command: "npm test -- imageQualityValidator.test.ts --run --reporter=json",
    timeout: 20000,
  },
  medicalSafety: {
    name: "Medical Safety Validator",
    command: "npm test -- medicalSafetyValidator.test.ts --run --reporter=json",
    timeout: 25000,
  },
  aiModelRouter: {
    name: "AI Model Router",
    command: "npm test -- aiModelRouter.test.ts --run --reporter=json",
    timeout: 20000,
  },
  platformOptimizer: {
    name: "Platform Optimizer",
    command: "npm test -- platformOptimizer.test.ts --run --reporter=json",
    timeout: 15000,
  },
  voiceCommandHandler: {
    name: "Voice Command Handler",
    command: "npm test -- voiceCommandHandler.test.ts --run --reporter=json",
    timeout: 20000,
  },
  propertyTestFramework: {
    name: "Property Test Framework",
    command: "npm test -- propertyTestFramework.test.ts --run --reporter=json",
    timeout: 45000,
  },
  correctnessProperties: {
    name: "Correctness Properties",
    command: "npm test -- correctnessProperties.test.ts --run --reporter=json",
    timeout: 90000,
  },
  propertyTests: {
    name: "All Property-Based Tests",
    command: "npm run test:pbt --reporter=json",
    timeout: 120000,
  },
  unitTests: {
    name: "Unit Test Suite",
    command: "npm test -- --run --reporter=json",
    timeout: 60000,
  },
  integrationTests: {
    name: "Integration Tests",
    command: "npm test -- --run --testPathPattern=integration --reporter=json",
    timeout: 90000,
  },
  performanceTests: {
    name: "Performance Tests",
    command: "npm test -- --run --testPathPattern=performance --reporter=json",
    timeout: 120000,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { testId } = await request.json();

    if (!testId || !TEST_SUITES[testId as keyof typeof TEST_SUITES]) {
      return NextResponse.json({ error: "Invalid test suite ID" }, { status: 400 });
    }

    const testSuite = TEST_SUITES[testId as keyof typeof TEST_SUITES];
    const startTime = Date.now();

    try {
      // Run the test command
      const { stdout, stderr } = await execAsync(testSuite.command, {
        timeout: testSuite.timeout,
        cwd: process.cwd(),
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

      // Try to parse JSON output from test runner
      let testResults;
      try {
        // Look for JSON in the output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          testResults = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        // Fallback to parsing text output
        testResults = parseTextOutput(stdout);
      }

      // Extract test statistics
      const passed = testResults?.numPassedTests || extractNumber(stdout, /(\d+) passed/) || 0;
      const failed = testResults?.numFailedTests || extractNumber(stdout, /(\d+) failed/) || 0;
      const total = testResults?.numTotalTests || passed + failed;

      // Calculate coverage if available
      let coverage = "0%";
      const coverageMatch = stdout.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*(\d+\.?\d*)/m);
      if (coverageMatch) {
        coverage = coverageMatch[1] + "%";
      }

      return NextResponse.json({
        status: failed === 0 ? "passed" : "failed",
        passed,
        failed,
        total,
        duration,
        coverage,
        timestamp: new Date().toISOString(),
        command: testSuite.command,
        output: stdout,
        error: stderr || null,
      });
    } catch (execError: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

      return NextResponse.json({
        status: "error",
        error: execError.message || "Test execution failed",
        duration,
        timestamp: new Date().toISOString(),
        command: testSuite.command,
        output: execError.stdout || "",
        stderr: execError.stderr || "",
      });
    }
  } catch (error) {
    console.error("Test runner API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    availableTests: Object.keys(TEST_SUITES),
    testSuites: TEST_SUITES,
  });
}

// Helper function to extract numbers from text output
function extractNumber(text: string, regex: RegExp): number | null {
  const match = text.match(regex);
  return match ? parseInt(match[1], 10) : null;
}

// Helper function to parse text-based test output
function parseTextOutput(output: string) {
  const lines = output.split("\n");
  let passed = 0;
  let failed = 0;

  for (const line of lines) {
    if (line.includes("✓") || line.includes("PASS")) {
      passed++;
    } else if (line.includes("✗") || line.includes("FAIL")) {
      failed++;
    }
  }

  return {
    numPassedTests: passed,
    numFailedTests: failed,
    numTotalTests: passed + failed,
  };
}
