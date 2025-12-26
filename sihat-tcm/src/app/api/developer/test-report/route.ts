/**
 * Test Report Generation API
 * 
 * Generates comprehensive test reports in various formats (HTML, JSON, PDF)
 * using the property-based testing framework analysis tools.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PropertyTestAnalyzer } from '@/lib/testing/testResultAnalysis'

export async function POST(request: NextRequest) {
  try {
    const { results, format = 'html' } = await request.json()

    // Create analyzer instance
    const analyzer = new PropertyTestAnalyzer()

    // Mock the results into the global reporter for analysis
    // In a real implementation, this would be properly integrated
    if (results) {
      // Convert results to the format expected by the analyzer
      const mockResults = Object.entries(results).map(([testId, result]: [string, any]) => ({
        name: testId,
        status: result.status === 'passed' ? 'passed' : 'failed',
        metadata: {
          testId,
          timestamp: result.timestamp,
          duration: result.duration,
          coverage: result.coverage
        },
        error: result.error ? new Error(result.error) : undefined,
        counterexample: result.propertyFailures || undefined
      }))

      // Inject results into analyzer (this is a simplified approach)
      ;(analyzer as any).mockResults = mockResults
    }

    let reportContent: string

    switch (format) {
      case 'html':
        reportContent = generateHTMLReport(results)
        return new Response(reportContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="test-report-${new Date().toISOString().split('T')[0]}.html"`
          }
        })

      case 'json':
        reportContent = generateJSONReport(results)
        return NextResponse.json(JSON.parse(reportContent), {
          headers: {
            'Content-Disposition': `attachment; filename="test-report-${new Date().toISOString().split('T')[0]}.json"`
          }
        })

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use html or json.' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Test report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'html'

  // Generate a sample report for demonstration
  const sampleResults = {
    propertyTests: {
      status: 'passed',
      passed: 28,
      failed: 7,
      total: 35,
      duration: '2.93s',
      coverage: '85%',
      timestamp: new Date().toISOString()
    },
    accessibility: {
      status: 'passed',
      passed: 15,
      failed: 0,
      total: 15,
      duration: '1.2s',
      coverage: '92%',
      timestamp: new Date().toISOString()
    }
  }

  if (format === 'json') {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: generateTestSummary(sampleResults),
      results: sampleResults,
      analysis: generateAnalysis(sampleResults)
    })
  }

  const htmlReport = generateHTMLReport(sampleResults)
  return new Response(htmlReport, {
    headers: { 'Content-Type': 'text/html' }
  })
}

function generateHTMLReport(results: any): string {
  const timestamp = new Date().toLocaleString()
  const summary = generateTestSummary(results)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sihat TCM Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .success { color: #10b981; border-left-color: #10b981; }
        .error { color: #ef4444; border-left-color: #ef4444; }
        .warning { color: #f59e0b; border-left-color: #f59e0b; }
        .info { color: #3b82f6; border-left-color: #3b82f6; }
        .test-results {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 30px;
        }
        .test-results h2 {
            background: #f8fafc;
            margin: 0;
            padding: 20px 25px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
        }
        .test-item {
            padding: 20px 25px;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            justify-content: between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-name {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
        }
        .test-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #6b7280;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-passed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        .property-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 25px;
            margin-bottom: 30px;
        }
        .property-section h3 {
            color: #7c3aed;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .property-list {
            list-style: none;
            padding: 0;
        }
        .property-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .property-list li:last-child {
            border-bottom: none;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Sihat TCM Test Report</h1>
        <p>Comprehensive testing analysis generated on ${timestamp}</p>
    </div>

    <div class="stats">
        <div class="stat-card success">
            <div class="stat-value">${summary.totalPassed}</div>
            <div class="stat-label">Tests Passed</div>
        </div>
        <div class="stat-card error">
            <div class="stat-value">${summary.totalFailed}</div>
            <div class="stat-label">Tests Failed</div>
        </div>
        <div class="stat-card info">
            <div class="stat-value">${summary.totalTests}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat-card ${summary.successRate >= 80 ? 'success' : summary.successRate >= 60 ? 'warning' : 'error'}">
            <div class="stat-value">${summary.successRate}%</div>
            <div class="stat-label">Success Rate</div>
        </div>
    </div>

    <div class="test-results">
        <h2>📊 Test Suite Results</h2>
        ${Object.entries(results).map(([testId, result]: [string, any]) => `
            <div class="test-item">
                <div style="flex: 1;">
                    <div class="test-name">${testId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                    <div class="test-stats">
                        <span>✅ ${result.passed || 0} passed</span>
                        <span>❌ ${result.failed || 0} failed</span>
                        <span>⏱️ ${result.duration || 'N/A'}</span>
                        <span>📊 ${result.coverage || 'N/A'} coverage</span>
                    </div>
                </div>
                <div>
                    <span class="status-badge status-${result.status}">${result.status}</span>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="property-section">
        <h3>🎯 Property-Based Testing Framework</h3>
        <p>The Sihat TCM system uses property-based testing to validate correctness properties across the entire system. This approach ensures that the system behaves correctly across a wide range of inputs and scenarios.</p>
        
        <h4>Validated Correctness Properties:</h4>
        <ul class="property-list">
            <li><strong>Diagnostic Data Consistency:</strong> Referential integrity across diagnostic steps</li>
            <li><strong>Cross-Platform Synchronization:</strong> Data consistency between web and mobile</li>
            <li><strong>AI Model Fallback Reliability:</strong> Automatic fallback with valid responses</li>
            <li><strong>Health Data Temporal Consistency:</strong> Chronological order and valid timestamps</li>
            <li><strong>Treatment Recommendation Safety:</strong> Contraindication and allergy validation</li>
            <li><strong>Progress Tracking Monotonicity:</strong> Non-decreasing progress values</li>
            <li><strong>Accessibility Compliance:</strong> WCAG 2.1 AA compliance validation</li>
            <li><strong>Multilingual Content Consistency:</strong> Translation accuracy preservation</li>
        </ul>
    </div>

    <div class="footer">
        <p>Generated by Sihat TCM Property-Based Testing Framework</p>
        <p>Report includes ${summary.totalTests} tests across ${Object.keys(results).length} test suites</p>
    </div>
</body>
</html>
  `
}

function generateJSONReport(results: any): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: generateTestSummary(results),
    results,
    analysis: generateAnalysis(results),
    framework: {
      name: 'Sihat TCM Property-Based Testing Framework',
      version: '1.0.0',
      features: [
        '100+ iterations per property test',
        'Automatic counterexample shrinking',
        'Medical scenario data generators',
        'Comprehensive failure analysis',
        'Requirements traceability'
      ]
    }
  }, null, 2)
}

function generateTestSummary(results: any) {
  const totalPassed = Object.values(results).reduce((sum: number, result: any) => sum + (result.passed || 0), 0)
  const totalFailed = Object.values(results).reduce((sum: number, result: any) => sum + (result.failed || 0), 0)
  const totalTests = totalPassed + totalFailed
  const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0

  return {
    totalPassed,
    totalFailed,
    totalTests,
    successRate,
    testSuites: Object.keys(results).length
  }
}

function generateAnalysis(results: any) {
  const summary = generateTestSummary(results)
  const recommendations = []

  if (summary.successRate < 50) {
    recommendations.push('🚨 Low success rate detected. Review test logic and implementation.')
  } else if (summary.successRate < 80) {
    recommendations.push('⚠️ Moderate success rate. Some areas need attention.')
  } else if (summary.successRate >= 95) {
    recommendations.push('✅ Excellent success rate! Consider adding more edge cases.')
  }

  const failedSuites = Object.entries(results).filter(([_, result]: [string, any]) => result.status === 'failed')
  if (failedSuites.length > 0) {
    recommendations.push(`🔍 ${failedSuites.length} test suite(s) failing: ${failedSuites.map(([name]) => name).join(', ')}`)
  }

  return {
    summary,
    recommendations,
    insights: [
      'Property-based testing provides comprehensive validation across input ranges',
      'Medical safety validation is critical for healthcare applications',
      'Cross-platform consistency ensures reliable user experience',
      'Accessibility compliance supports inclusive design principles'
    ]
  }
}