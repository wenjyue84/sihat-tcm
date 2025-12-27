/**
 * Testing Dashboard Component
 *
 * Comprehensive testing interface for the developer portal that includes
 * property-based testing, unit tests, integration tests, and performance monitoring.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  Bug,
  AlertTriangle,
  BarChart3,
  FileText,
  Download,
  ExternalLink,
  Zap,
  Shield,
  Target,
  Activity,
} from "lucide-react";

interface TestResult {
  status: "passed" | "failed" | "error" | "running";
  passed?: number;
  failed?: number;
  total?: number;
  duration?: string;
  coverage?: string;
  timestamp?: string;
  error?: string;
  output?: string;
  propertyFailures?: Array<{
    property: string;
    counterexample: any;
    shrunk: boolean;
  }>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  testCommand: string;
  propertyBased?: boolean;
  requirements?: string[];
}

const TEST_CATEGORIES = {
  "Property-Based Testing": {
    icon: Target,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    description: "Correctness properties and invariant validation",
  },
  "Unit Testing": {
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    description: "Individual component and function testing",
  },
  "Integration Testing": {
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    description: "End-to-end workflow and API testing",
  },
  "Safety Systems": {
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10",
    description: "Medical safety and validation systems",
  },
  "Performance Testing": {
    icon: BarChart3,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    description: "Performance benchmarking and optimization",
  },
};

export default function TestingDashboard() {
  const [testResults, setTestResults] = useState<{ [key: string]: TestResult }>({});
  const [runningTests, setRunningTests] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [testReport, setTestReport] = useState<string | null>(null);

  const testSuites: TestSuite[] = [
    // Property-Based Testing
    {
      id: "propertyTestFramework",
      name: "Property Test Framework",
      description: "Core property-based testing infrastructure validation",
      category: "Property-Based Testing",
      testCommand: "npm test -- propertyTestFramework.test.ts --run",
      propertyBased: true,
      requirements: ["13.1"],
    },
    {
      id: "correctnessProperties",
      name: "Correctness Properties",
      description: "System correctness properties from design document",
      category: "Property-Based Testing",
      testCommand: "npm test -- correctnessProperties.test.ts --run",
      propertyBased: true,
      requirements: ["1.3", "2.1", "3.1", "4.3", "5.4", "6.1", "10.1"],
    },
    {
      id: "propertyTests",
      name: "All Property Tests",
      description: "Complete property-based testing suite",
      category: "Property-Based Testing",
      testCommand: "npm run test:pbt",
      propertyBased: true,
      requirements: ["All"],
    },

    // Unit Testing
    {
      id: "accessibility",
      name: "Accessibility Manager",
      description: "WCAG 2.1 AA compliance and accessibility features",
      category: "Unit Testing",
      testCommand: "npm test -- accessibilityManager.test.ts --run",
      requirements: ["10.1", "10.4"],
    },
    {
      id: "imageQuality",
      name: "Image Quality Validator",
      description: "Real-time image quality assessment",
      category: "Unit Testing",
      testCommand: "npm test -- imageQualityValidator.test.ts --run",
      requirements: ["1.2"],
    },
    {
      id: "aiModelRouter",
      name: "AI Model Router",
      description: "Intelligent AI model selection and fallback",
      category: "Unit Testing",
      testCommand: "npm test -- aiModelRouter.test.ts --run",
      requirements: ["2.1", "1.4"],
    },
    {
      id: "platformOptimizer",
      name: "Platform Optimizer",
      description: "Cross-platform performance optimization",
      category: "Unit Testing",
      testCommand: "npm test -- platformOptimizer.test.ts --run",
      requirements: ["6.2"],
    },
    {
      id: "voiceCommandHandler",
      name: "Voice Command Handler",
      description: "Voice recognition and command processing",
      category: "Unit Testing",
      testCommand: "npm test -- voiceCommandHandler.test.ts --run",
      requirements: ["10.3"],
    },

    // Safety Systems
    {
      id: "medicalSafety",
      name: "Medical Safety Validator",
      description: "Treatment recommendation safety validation",
      category: "Safety Systems",
      testCommand: "npm test -- medicalSafetyValidator.test.ts --run",
      requirements: ["2.2", "2.5"],
    },

    // Integration Testing
    {
      id: "integrationTests",
      name: "Integration Tests",
      description: "End-to-end workflow and API integration testing",
      category: "Integration Testing",
      testCommand: "npm test -- --run --testPathPattern=integration",
      requirements: ["All workflows"],
    },

    // Performance Testing
    {
      id: "performanceTests",
      name: "Performance Tests",
      description: "Performance benchmarking and optimization tests",
      category: "Performance Testing",
      testCommand: "npm test -- --run --testPathPattern=performance",
      requirements: ["5.1", "5.3"],
    },
  ];

  const filteredTestSuites =
    selectedCategory === "all"
      ? testSuites
      : testSuites.filter((suite) => suite.category === selectedCategory);

  const runTest = async (testId: string) => {
    setRunningTests((prev) => ({ ...prev, [testId]: true }));

    try {
      const response = await fetch("/api/developer/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setTestResults((prev) => ({ ...prev, [testId]: result }));
    } catch (error) {
      setTestResults((prev) => ({
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
    for (const testSuite of filteredTestSuites) {
      if (!runningTests[testSuite.id]) {
        await runTest(testSuite.id);
        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch("/api/developer/test-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: testResults,
          format: "html",
        }),
      });

      if (response.ok) {
        const report = await response.text();
        setTestReport(report);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  const getTestStats = () => {
    const results = Object.values(testResults);
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed" || r.status === "error").length;
    const total = results.length;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { passed, failed, total, successRate };
  };

  const stats = getTestStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Testing Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Comprehensive test suite management and property-based testing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-400">{stats.passed}</div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">{stats.failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-300">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{stats.successRate}%</div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={runAllTests}
            disabled={Object.values(runningTests).some(Boolean)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
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
            variant="outline"
            onClick={generateReport}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Categories</option>
            {Object.keys(TEST_CATEGORIES).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Categories */}
      <Tabs defaultValue="suites" className="space-y-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="suites" className="data-[state=active]:bg-violet-600">
            Test Suites
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-violet-600">
            Property Tests
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-violet-600">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suites" className="space-y-6">
          {Object.entries(TEST_CATEGORIES).map(([category, config]) => {
            const categoryTests = filteredTestSuites.filter((test) =>
              selectedCategory === "all" ? test.category === category : true
            );

            if (categoryTests.length === 0) return null;

            const Icon = config.icon;

            return (
              <Card key={category} className="bg-gray-900 border-gray-700">
                <CardHeader className="border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white">{category}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {config.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {categoryTests.map((test) => {
                        const result = testResults[test.id];
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
                        return <div key={test.id} className="w-2 h-2 bg-red-500 rounded-full" />;
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-700">
                    {categoryTests.map((test) => {
                      const result = testResults[test.id];
                      const isRunning = runningTests[test.id];

                      return (
                        <div
                          key={test.id}
                          className="p-6 hover:bg-gray-800/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-white">{test.name}</h4>
                                {test.propertyBased && (
                                  <span className="px-2 py-1 text-xs bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30">
                                    Property-Based
                                  </span>
                                )}
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

                              {test.requirements && (
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs text-gray-500">Validates:</span>
                                  <div className="flex gap-1">
                                    {test.requirements.map((req) => (
                                      <span
                                        key={req}
                                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                                      >
                                        {req}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

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
                                onClick={() => runTest(test.id)}
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
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                Property-Based Testing Overview
              </CardTitle>
              <CardDescription>
                Correctness properties validation using fast-check framework
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Framework Features</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• 100+ iterations per property test</li>
                    <li>• Automatic counterexample shrinking</li>
                    <li>• Medical scenario data generators</li>
                    <li>• Comprehensive failure analysis</li>
                    <li>• Requirements traceability</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-3">Correctness Properties</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Diagnostic data consistency</li>
                    <li>• Cross-platform synchronization</li>
                    <li>• AI model fallback reliability</li>
                    <li>• Health data temporal consistency</li>
                    <li>• Treatment recommendation safety</li>
                    <li>• Progress tracking monotonicity</li>
                    <li>• Accessibility compliance</li>
                    <li>• Multilingual content consistency</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Test Reports</CardTitle>
                  <CardDescription>Comprehensive test analysis and reporting</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateReport}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/api/developer/test-report?format=json")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    JSON Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {testReport ? (
                <div
                  className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: testReport }}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p>No test report generated yet</p>
                  <p className="text-sm mt-2">
                    Run some tests and click "Generate Report" to see detailed analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
