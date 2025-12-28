import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, Bug, PlayCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDiagnostics, TestSuite } from "@/hooks/useDiagnostics";

interface DiagnosticsTabProps {
  testSuites: TestSuite[];
}

export function DiagnosticsTab({ testSuites }: DiagnosticsTabProps) {
  const router = useRouter();
  const { diagnosticsResults, runningTests, runTestSuite, runAllTests } =
    useDiagnostics(testSuites);

  const categories = [
    "Core Features",
    "AI Features",
    "Safety Systems",
    "Performance",
    "Accessibility",
    "Testing Infrastructure",
    "Correctness Validation",
    "Property-Based Testing",
    "Unit Testing",
    "Integration Testing",
    "Performance Testing",
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">System Diagnostics</h2>
          <p className="text-sm text-gray-400 mt-1">
            Automated test suites and system validation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
            onClick={runAllTests}
            disabled={Object.values(runningTests).some(Boolean)}
          >
            {Object.values(runningTests).some(Boolean) ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => router.push("/(dev)/test-accessibility")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manual Testing
          </Button>
        </div>
      </div>

      {/* Test Categories */}
      {categories.map((category) => {
        const categoryTests = testSuites.filter((test) => test.category === category);
        if (categoryTests.length === 0) return null;

        return (
          <Card key={category} className="bg-[#0f0f11] border-white/10">
            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-violet-100">
                    {category}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-1">
                    {categoryTests.length} test suite{categoryTests.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {categoryTests.map((test) => {
                    const result = diagnosticsResults[test.id];
                    const isRunning = runningTests[test.id];

                    if (isRunning)
                      return (
                        <div
                          key={test.id}
                          className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                        />
                      );
                    if (!result)
                      return <div key={test.id} className="w-2 h-2 bg-gray-600 rounded-full" />;
                    if (result.status === "passed")
                      return (
                        <div key={test.id} className="w-2 h-2 bg-emerald-500 rounded-full" />
                      );
                    if (result.status === "failed" || result.status === "error")
                      return <div key={test.id} className="w-2 h-2 bg-red-500 rounded-full" />;
                    return <div key={test.id} className="w-2 h-2 bg-gray-600 rounded-full" />;
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {categoryTests.map((test) => {
                  const result = diagnosticsResults[test.id];
                  const isRunning = runningTests[test.id];

                  return (
                    <div
                      key={test.id}
                      className="p-6 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-white">{test.name}</h4>
                            {isRunning && (
                              <div className="flex items-center gap-2 text-amber-400">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Running...</span>
                              </div>
                            )}
                            {result && !isRunning && (
                              <div
                                className={`flex items-center gap-2 text-xs ${
                                  result.status === "passed"
                                    ? "text-emerald-400"
                                    : result.status === "failed"
                                      ? "text-red-400"
                                      : result.status === "error"
                                        ? "text-red-400"
                                        : "text-gray-400"
                                }`}
                              >
                                {result.status === "passed" && (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                {(result.status === "failed" || result.status === "error") && (
                                  <Bug className="w-3 h-3" />
                                )}
                                <span className="capitalize">{result.status}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{test.description}</p>

                          {result && !isRunning && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {result.passed !== undefined && (
                                <div>
                                  <span className="text-gray-500">Passed:</span>
                                  <span className="ml-2 text-emerald-400 font-mono">
                                    {result.passed}
                                  </span>
                                </div>
                              )}
                              {result.failed !== undefined && (
                                <div>
                                  <span className="text-gray-500">Failed:</span>
                                  <span className="ml-2 text-red-400 font-mono">
                                    {result.failed}
                                  </span>
                                </div>
                              )}
                              {result.duration && (
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <span className="ml-2 text-gray-300 font-mono">
                                    {result.duration}
                                  </span>
                                </div>
                              )}
                              {result.coverage && (
                                <div>
                                  <span className="text-gray-500">Coverage:</span>
                                  <span className="ml-2 text-blue-400 font-mono">
                                    {result.coverage}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {result?.error && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-xs text-red-400 font-mono">{result.error}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => runTestSuite(test.id)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <PlayCircle className="w-3 h-3" />
                            )}
                          </Button>
                          {result?.timestamp && (
                            <span className="text-xs text-gray-600 font-mono">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5">
                        <details className="group/details">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 flex items-center gap-2">
                            <span>Test Command</span>
                            <span className="text-gray-600 group-open/details:rotate-90 transition-transform">
                              ▶
                            </span>
                          </summary>
                          <div className="mt-2 p-2 bg-black/20 rounded border border-white/5">
                            <code className="text-xs text-gray-300 font-mono">
                              {test.testCommand}
                            </code>
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Test Summary */}
      {Object.keys(diagnosticsResults).length > 0 && (
        <Card className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-violet-500/20">
          <CardHeader>
            <CardTitle className="text-base text-violet-100">Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {
                    Object.values(diagnosticsResults).filter((r) => r.status === "passed")
                      .length
                  }
                </div>
                <div className="text-xs text-gray-400">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {
                    Object.values(diagnosticsResults).filter(
                      (r) => r.status === "failed" || r.status === "error"
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">
                  {Object.values(diagnosticsResults).reduce(
                    (acc, r) => acc + (r.passed || 0),
                    0
                  )}
                </div>
                <div className="text-xs text-gray-400">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(
                    Object.values(diagnosticsResults).reduce((acc, r) => {
                      if (r.coverage) {
                        const coverage = parseInt(r.coverage.replace("%", ""));
                        return acc + coverage;
                      }
                      return acc;
                    }, 0) / Object.keys(diagnosticsResults).length
                  ) || 0}
                  %
                </div>
                <div className="text-xs text-gray-400">Avg Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

