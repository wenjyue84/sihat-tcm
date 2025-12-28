import { useState } from "react";

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCommand: string;
  category: string;
}

export function useDiagnostics(testSuites: TestSuite[]) {
  const [diagnosticsResults, setDiagnosticsResults] = useState<{ [key: string]: any }>({});
  const [runningTests, setRunningTests] = useState<{ [key: string]: boolean }>({});

  const runTestSuite = async (testId: string) => {
    setRunningTests((prev) => ({ ...prev, [testId]: true }));

    try {
      const response = await fetch("/api/developer/run-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setDiagnosticsResults((prev) => ({
        ...prev,
        [testId]: result,
      }));
    } catch (error) {
      setDiagnosticsResults((prev) => ({
        ...prev,
        [testId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Test execution failed",
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setRunningTests((prev) => ({ ...prev, [testId]: false }));
    }
  };

  const runAllTests = async () => {
    for (const testSuite of testSuites) {
      if (!runningTests[testSuite.id]) {
        await runTestSuite(testSuite.id);
        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  return {
    diagnosticsResults,
    runningTests,
    runTestSuite,
    runAllTests,
  };
}

