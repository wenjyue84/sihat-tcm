/**
 * Test Result Analysis and Reporting
 *
 * This module provides utilities for analyzing property-based test results,
 * generating reports, and providing insights for test failures.
 */

import { globalReporter } from "./propertyTestFramework";

export interface TestAnalysis {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  failurePatterns: FailurePattern[];
  recommendations: string[];
}

export interface FailurePattern {
  pattern: string;
  frequency: number;
  examples: string[];
  suggestedFix: string;
}

/**
 * Analyzes property test results and provides insights
 */
export class PropertyTestAnalyzer {
  /**
   * Analyzes all test results and generates comprehensive report
   */
  analyzeResults(): TestAnalysis {
    const results = globalReporter["results"] || [];

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.status === "passed").length;
    const failedTests = results.filter((r) => r.status === "failed").length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const failurePatterns = this.identifyFailurePatterns(
      results.filter((r) => r.status === "failed")
    );
    const recommendations = this.generateRecommendations(failurePatterns, successRate);

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      failurePatterns,
      recommendations,
    };
  }

  /**
   * Identifies common patterns in test failures
   */
  private identifyFailurePatterns(failedResults: any[]): FailurePattern[] {
    const patterns: Map<string, { count: number; examples: string[]; errors: Error[] }> = new Map();

    failedResults.forEach((result) => {
      const errorMessage = result.error?.message || "Unknown error";
      const pattern = this.categorizeError(errorMessage);

      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, examples: [], errors: [] });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      patternData.examples.push(result.name);
      patternData.errors.push(result.error);
    });

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      examples: data.examples.slice(0, 3), // Show first 3 examples
      suggestedFix: this.getSuggestedFix(pattern, data.errors),
    }));
  }

  /**
   * Categorizes error messages into common patterns
   */
  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes("Property failed")) {
      return "Property Assertion Failure";
    }
    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      return "Test Timeout";
    }
    if (errorMessage.includes("TypeError") || errorMessage.includes("undefined")) {
      return "Type/Null Reference Error";
    }
    if (errorMessage.includes("range") || errorMessage.includes("bound")) {
      return "Range/Boundary Error";
    }
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return "Network/API Error";
    }
    if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
      return "Data Validation Error";
    }
    return "Other Error";
  }

  /**
   * Provides suggested fixes for common error patterns
   */
  private getSuggestedFix(pattern: string, errors: Error[]): string {
    switch (pattern) {
      case "Property Assertion Failure":
        return "Review the property logic and ensure it correctly represents the intended behavior. Consider edge cases and boundary conditions.";

      case "Test Timeout":
        return "Reduce the number of test iterations or optimize the test logic. Consider using smaller data generators.";

      case "Type/Null Reference Error":
        return "Add null checks and type guards. Ensure data generators produce valid data structures.";

      case "Range/Boundary Error":
        return "Review the valid ranges for your data generators and ensure boundary conditions are handled correctly.";

      case "Network/API Error":
        return "Mock external dependencies or add proper error handling for network failures.";

      case "Data Validation Error":
        return "Review data validation logic and ensure generators produce data that meets validation requirements.";

      default:
        return "Review the specific error messages and stack traces for more detailed debugging information.";
    }
  }

  /**
   * Generates recommendations based on test results
   */
  private generateRecommendations(
    failurePatterns: FailurePattern[],
    successRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 50) {
      recommendations.push(
        "🚨 Low success rate detected. Consider reviewing test logic and data generators."
      );
    } else if (successRate < 80) {
      recommendations.push("⚠️ Moderate success rate. Some properties may need refinement.");
    } else if (successRate >= 95) {
      recommendations.push(
        "✅ Excellent success rate! Consider adding more edge cases or complex scenarios."
      );
    }

    // Pattern-specific recommendations
    failurePatterns.forEach((pattern) => {
      if (pattern.frequency > 3) {
        recommendations.push(
          `🔍 Frequent ${pattern.pattern} detected (${pattern.frequency} occurrences). ${pattern.suggestedFix}`
        );
      }
    });

    // General recommendations
    if (failurePatterns.length === 0 && successRate === 100) {
      recommendations.push(
        "🎯 All tests passing! Consider increasing test complexity or adding more properties."
      );
    }

    if (failurePatterns.some((p) => p.pattern === "Test Timeout")) {
      recommendations.push(
        "⏱️ Consider reducing PBT_CONFIG.numRuns for complex properties or optimizing test performance."
      );
    }

    return recommendations;
  }

  /**
   * Generates a detailed HTML report
   */
  generateHTMLReport(): string {
    const analysis = this.analyzeResults();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Property-Based Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .pattern { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .recommendation { margin: 5px 0; padding: 8px; background: #e9ecef; border-radius: 4px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="header">
        <h1>Property-Based Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <h2>Test Metrics</h2>
    <div class="metric">
        <strong>Total Tests:</strong> ${analysis.totalTests}
    </div>
    <div class="metric">
        <strong>Passed:</strong> <span class="success">${analysis.passedTests}</span>
    </div>
    <div class="metric">
        <strong>Failed:</strong> <span class="danger">${analysis.failedTests}</span>
    </div>
    <div class="metric">
        <strong>Success Rate:</strong> 
        <span class="${analysis.successRate >= 80 ? "success" : analysis.successRate >= 50 ? "warning" : "danger"}">
            ${analysis.successRate.toFixed(2)}%
        </span>
    </div>
    
    ${
      analysis.failurePatterns.length > 0
        ? `
    <h2>Failure Patterns</h2>
    ${analysis.failurePatterns
      .map(
        (pattern) => `
        <div class="pattern">
            <h3>${pattern.pattern} (${pattern.frequency} occurrences)</h3>
            <p><strong>Examples:</strong> ${pattern.examples.join(", ")}</p>
            <p><strong>Suggested Fix:</strong> ${pattern.suggestedFix}</p>
        </div>
    `
      )
      .join("")}
    `
        : ""
    }
    
    <h2>Recommendations</h2>
    ${analysis.recommendations
      .map(
        (rec) => `
        <div class="recommendation">${rec}</div>
    `
      )
      .join("")}
    
    <h2>Detailed Report</h2>
    <pre>${globalReporter.generateReport()}</pre>
</body>
</html>
    `;
  }

  /**
   * Exports test results to JSON format
   */
  exportToJSON(): string {
    const analysis = this.analyzeResults();
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        analysis,
        rawResults: globalReporter["results"] || [],
      },
      null,
      2
    );
  }
}

/**
 * Utility function to generate and save test report
 */
export function generateTestReport(format: "html" | "json" | "console" = "console"): string {
  const analyzer = new PropertyTestAnalyzer();

  switch (format) {
    case "html":
      return analyzer.generateHTMLReport();
    case "json":
      return analyzer.exportToJSON();
    case "console":
    default:
      const analysis = analyzer.analyzeResults();
      console.log("\n=== Property-Based Test Analysis ===");
      console.log(`Total Tests: ${analysis.totalTests}`);
      console.log(`Success Rate: ${analysis.successRate.toFixed(2)}%`);

      if (analysis.failurePatterns.length > 0) {
        console.log("\nFailure Patterns:");
        analysis.failurePatterns.forEach((pattern) => {
          console.log(`- ${pattern.pattern}: ${pattern.frequency} occurrences`);
        });
      }

      if (analysis.recommendations.length > 0) {
        console.log("\nRecommendations:");
        analysis.recommendations.forEach((rec) => {
          console.log(`- ${rec}`);
        });
      }
      console.log("=====================================\n");

      return globalReporter.generateReport();
  }
}
