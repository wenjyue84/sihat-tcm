# Comprehensive Testing Guide for Sihat TCM

## Overview

This guide provides complete documentation for the comprehensive testing infrastructure implemented in the Sihat TCM system. The testing framework includes property-based testing, unit tests, integration tests, performance testing, and accessibility validation.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Property-Based Testing Framework](#property-based-testing-framework)
3. [Developer Portal Testing Suite](#developer-portal-testing-suite)
4. [Test Categories and Suites](#test-categories-and-suites)
5. [Running Tests](#running-tests)
6. [Test Reports and Analysis](#test-reports-and-analysis)
7. [Continuous Integration](#continuous-integration)
8. [Troubleshooting](#troubleshooting)

## Testing Architecture

The Sihat TCM testing infrastructure is built on multiple layers:

### Core Testing Stack
- **Test Runner**: Vitest with React Testing Library
- **Property-Based Testing**: fast-check framework
- **UI Testing**: React Testing Library with jest-dom
- **API Testing**: Supertest with Next.js API routes
- **Performance Testing**: Custom benchmarking utilities
- **Accessibility Testing**: jest-axe and manual testing tools

### Testing Framework Structure
```
src/lib/testing/
├── propertyTestFramework.ts     # Core PBT framework
├── medicalDataGenerators.ts     # Medical scenario generators
├── propertyTestHelpers.ts       # Test utilities and patterns
├── testResultAnalysis.ts        # Result analysis and reporting
├── __tests__/                   # Framework validation tests
└── README.md                    # Framework documentation
```

## Property-Based Testing Framework

### Overview
Property-based testing validates system correctness by testing properties that should hold true across all valid inputs, rather than testing specific examples.

### Key Features
- **100+ iterations per property test** (configurable)
- **Automatic counterexample shrinking** for minimal failing cases
- **Medical scenario data generators** for realistic test data
- **Comprehensive failure analysis** with pattern recognition
- **Requirements traceability** linking tests to specifications

### Framework Configuration
```typescript
export const PBT_CONFIG = {
  numRuns: 100,        // Minimum iterations per property
  endOnFailure: true,  // Stop on first failure for debugging
  seed: 42,           // Reproducible test runs
  verbose: false      // Detailed output control
}
```

### Creating Property Tests
```typescript
import { testProperty, arbitraries } from '@/lib/testing'

testProperty(
  'Patient age consistency',
  patientProfileArbitrary,
  (profile) => profile.age === profile.medical_history.age,
  {
    featureName: 'sihat-tcm-enhancement',
    propertyNumber: 1,
    propertyDescription: 'Patient age consistency across profile data',
    validatesRequirements: ['1.3']
  }
)
```

### Medical Data Generators
The framework includes specialized generators for medical scenarios:

- **Patient Profiles**: Demographics, medical history, TCM constitution
- **Diagnosis Sessions**: Multi-step diagnostic workflow data
- **Treatment Recommendations**: TCM treatments with safety constraints
- **Health Time Series**: Longitudinal health tracking data
- **IoT Device Data**: Wearable and sensor integration scenarios

## Developer Portal Testing Suite

### Accessing the Testing Dashboard
1. Navigate to `/developer` (requires developer role)
2. Click on the "Testing Suite" tab
3. Access comprehensive testing interface with:
   - Test suite management
   - Property-based testing overview
   - Real-time test execution
   - Report generation

### Testing Dashboard Features

#### Test Categories
- **Property-Based Testing**: Correctness properties validation
- **Unit Testing**: Individual component testing
- **Integration Testing**: End-to-end workflow testing
- **Safety Systems**: Medical safety validation
- **Performance Testing**: Benchmarking and optimization

#### Real-Time Test Execution
- Run individual test suites
- Execute all tests in a category
- Monitor test progress with live updates
- View detailed results and metrics

#### Report Generation
- HTML reports with visual analysis
- JSON reports for CI/CD integration
- Failure pattern recognition
- Automated recommendations

## Test Categories and Suites

### Property-Based Testing
| Test Suite | Description | Validates |
|------------|-------------|-----------|
| Property Test Framework | Core PBT infrastructure validation | Framework integrity |
| Correctness Properties | System correctness properties | Requirements 1.3, 2.1, 3.1, 4.3, 5.4, 6.1, 10.1 |
| All Property Tests | Complete property-based testing suite | All system properties |

### Unit Testing
| Test Suite | Description | Validates |
|------------|-------------|-----------|
| Accessibility Manager | WCAG 2.1 AA compliance | Requirements 10.1, 10.4 |
| Image Quality Validator | Real-time image quality assessment | Requirement 1.2 |
| AI Model Router | Intelligent AI model selection | Requirements 2.1, 1.4 |
| Platform Optimizer | Cross-platform optimization | Requirement 6.2 |
| Voice Command Handler | Voice recognition processing | Requirement 10.3 |

### Safety Systems
| Test Suite | Description | Validates |
|------------|-------------|-----------|
| Medical Safety Validator | Treatment safety validation | Requirements 2.2, 2.5 |

### Integration Testing
| Test Suite | Description | Validates |
|------------|-------------|-----------|
| Integration Tests | End-to-end workflow testing | All system workflows |

### Performance Testing
| Test Suite | Description | Validates |
|------------|-------------|-----------|
| Performance Tests | Benchmarking and optimization | Requirements 5.1, 5.3 |

## Running Tests

### Command Line Interface

#### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests only
npm run test:pbt

# Run with coverage
npm run test:coverage

# Generate property test reports
npm run test:pbt-report
```

#### Specific Test Suites
```bash
# Run accessibility tests
npm test -- accessibilityManager.test.ts --run

# Run property-based testing framework tests
npm test -- propertyTestFramework.test.ts --run

# Run correctness properties tests
npm test -- correctnessProperties.test.ts --run

# Run all property tests with verbose output
npm run test:pbt -- --verbose
```

### Developer Portal Interface

#### Running Individual Tests
1. Navigate to Developer Portal → Testing Suite
2. Select test category or use "All Categories"
3. Click the play button next to any test suite
4. Monitor real-time progress and results

#### Running All Tests
1. Click "Run All Tests" button
2. Tests execute sequentially with progress indicators
3. View comprehensive results in the dashboard
4. Generate reports for detailed analysis

### API Integration
```typescript
// Run tests programmatically
const response = await fetch('/api/developer/run-tests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testId: 'propertyTests' })
})

const result = await response.json()
console.log(result.status, result.passed, result.failed)
```

## Test Reports and Analysis

### Report Formats

#### HTML Reports
- Visual dashboard with charts and graphs
- Detailed test suite breakdown
- Property-based testing analysis
- Failure pattern recognition
- Automated recommendations

#### JSON Reports
- Machine-readable format for CI/CD
- Complete test metadata
- Structured failure information
- Performance metrics
- Coverage data

### Generating Reports

#### Via Developer Portal
1. Run tests through the Testing Dashboard
2. Click "Generate Report" button
3. Choose HTML or JSON format
4. Download or view in browser

#### Via API
```bash
# Generate HTML report
curl -X GET "http://localhost:3100/api/developer/test-report?format=html"

# Generate JSON report
curl -X GET "http://localhost:3100/api/developer/test-report?format=json"
```

#### Via Command Line
```bash
# Generate property test report
node scripts/run-property-tests.js --format html --output reports/pbt-report.html

# Generate JSON report
node scripts/run-property-tests.js --format json --output reports/pbt-results.json
```

### Report Analysis Features

#### Failure Pattern Recognition
- **Property Assertion Failures**: Logic issues in property definitions
- **Type/Null Reference Errors**: Data generator or validation issues
- **Range/Boundary Errors**: Invalid data ranges or edge cases
- **Network/API Errors**: External dependency failures
- **Data Validation Errors**: Schema or constraint violations

#### Automated Recommendations
- Success rate analysis and improvement suggestions
- Pattern-specific debugging guidance
- Performance optimization recommendations
- Test complexity adjustment suggestions

## Continuous Integration

### GitHub Actions Integration
The testing framework integrates with CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --run --coverage
      
      - name: Run property-based tests
        run: npm run test:pbt
      
      - name: Generate test report
        run: node scripts/run-property-tests.js --format json --output test-results.json
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json
```

### Test Quality Gates
- **Minimum 80% test coverage** for new code
- **All property tests must pass** before deployment
- **No failing safety validation tests** allowed
- **Performance regression detection** with benchmarking

## Troubleshooting

### Common Issues

#### Property Test Failures
```
Property failed after N tests
Counterexample: [input data]
```
**Solution**: 
1. Analyze the counterexample to understand the failure
2. Check if the property logic is correct
3. Verify that data generators produce valid inputs
4. Consider edge cases in the property definition

#### Generator Errors
```
Error: Invalid parameter encountered at index X: expecting an Arbitrary
```
**Solution**: 
1. Ensure nested objects use `fc.record()` wrapper
2. Check that all arbitraries are properly defined
3. Verify import statements for generators

#### Test Timeouts
```
Test timeout exceeded
```
**Solution**: 
1. Reduce `numRuns` in PBT configuration
2. Optimize test logic for performance
3. Check for infinite loops in generators
4. Increase timeout for complex tests

#### Memory Issues
```
JavaScript heap out of memory
```
**Solution**: 
1. Reduce test data size in generators
2. Clear test data between runs
3. Use `cleanup.resetTestState()` utility
4. Run tests in smaller batches

### Debug Mode
Enable verbose logging for detailed failure analysis:

```typescript
// In test files
testProperty(name, arbitrary, predicate, metadata, { 
  verbose: true,
  numRuns: 10  // Reduce for debugging
})
```

### Performance Optimization
- **Reduce iterations** for development testing
- **Use focused test runs** with specific patterns
- **Optimize data generators** for realistic but minimal data
- **Implement test parallelization** for large suites

### Getting Help
1. Check the [Testing Framework README](src/lib/testing/README.md)
2. Review test failure patterns in the Developer Portal
3. Use the automated recommendations in test reports
4. Consult the property-based testing documentation

## Best Practices

### Property Design
1. **Focus on invariants** that should always hold
2. **Use round-trip properties** for serialization/parsing
3. **Test edge cases** with boundary value generators
4. **Validate safety constraints** for medical recommendations
5. **Ensure temporal consistency** for time-series data

### Test Organization
1. **Group tests by feature domain** (diagnosis, patient, admin)
2. **Use descriptive test names** that explain the property
3. **Include requirements traceability** in test metadata
4. **Document complex properties** with examples
5. **Maintain test data generators** with realistic scenarios

### Continuous Improvement
1. **Monitor test success rates** and investigate patterns
2. **Add new properties** as system complexity grows
3. **Refine generators** based on production data patterns
4. **Update tests** when requirements change
5. **Share knowledge** through documentation and examples

## Conclusion

The comprehensive testing infrastructure for Sihat TCM provides robust validation of system correctness, safety, and performance. By combining property-based testing with traditional unit and integration tests, the system ensures high-quality healthcare software that meets stringent medical safety requirements.

The Developer Portal provides an intuitive interface for managing and executing tests, while the automated reporting system offers insights for continuous improvement. This testing framework serves as a foundation for maintaining system reliability as the platform evolves.