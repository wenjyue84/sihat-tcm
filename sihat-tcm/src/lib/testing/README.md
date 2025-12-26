# Property-Based Testing Framework for Sihat TCM

## Overview

This directory contains a comprehensive property-based testing framework specifically designed for the Sihat TCM enhancement project. The framework uses **fast-check** to implement property-based testing with medical scenario generators and analysis tools.

## Framework Components

### Core Framework (`propertyTestFramework.ts`)
- **PBT_CONFIG**: Standard configuration with 100 iterations minimum
- **PropertyTestReporter**: Tracks test results and generates reports
- **createPropertyTest**: Creates property tests with metadata for traceability
- **runPropertyTestWithReporting**: Executes tests with comprehensive reporting

### Medical Data Generators (`medicalDataGenerators.ts`)
- **Patient Profiles**: Realistic patient demographic and medical history data
- **Diagnosis Sessions**: Multi-step diagnostic workflow data
- **Treatment Recommendations**: TCM treatment and safety validation data
- **Health Time Series**: Longitudinal health tracking data
- **IoT/Device Data**: Wearable and sensor integration data
- **Cross-Platform Sync**: Multi-device synchronization scenarios

### Test Helpers (`propertyTestHelpers.ts`)
- **Assertions**: Common validation patterns for medical systems
- **Patterns**: Property test patterns (round-trip, idempotent, monotonic, etc.)
- **Validators**: Medical data validation utilities
- **Cleanup**: Test data management utilities

### Test Analysis (`testResultAnalysis.ts`)
- **PropertyTestAnalyzer**: Analyzes test results and identifies failure patterns
- **Report Generation**: HTML, JSON, and console report formats
- **Failure Pattern Recognition**: Categorizes and suggests fixes for common issues
- **Recommendations**: Actionable insights for test improvement

## Usage Examples

### Basic Property Test
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

### Round-Trip Property
```typescript
import { patterns } from '@/lib/testing'

const roundTripProperty = patterns.roundTrip(
  patientProfileArbitrary,
  JSON.stringify,
  JSON.parse
)

fc.assert(roundTripProperty, { numRuns: 100 })
```

### Medical Safety Validation
```typescript
import { assertions, validationContextArbitrary } from '@/lib/testing'

testProperty(
  'Treatment safety validation',
  fc.record({
    recommendations: arbitraries.treatmentRecommendations,
    context: validationContextArbitrary
  }),
  ({ recommendations, context }) => {
    return recommendations.dietary.every(item =>
      assertions.isSafeMedicalRecommendation(
        item,
        context.medical_history.allergies,
        context.medical_history.current_medications
      )
    )
  },
  // ... metadata
)
```

## Running Tests

### Command Line
```bash
# Run all property-based tests
npm run test:pbt

# Run with coverage
npm run test:coverage

# Generate reports
npm run test:pbt-report

# Generate HTML report
node scripts/run-property-tests.js --format html --output reports/pbt-report.html
```

### Programmatic
```typescript
import { generateTestReport } from '@/lib/testing/testResultAnalysis'

// Run tests and generate console report
generateTestReport('console')

// Generate HTML report
const htmlReport = generateTestReport('html')
```

## Correctness Properties Implemented

The framework implements property-based tests for all 13 correctness properties defined in the design document:

1. **Diagnostic Data Consistency** - Referential integrity across diagnostic steps
2. **Cross-Platform Data Synchronization** - Data consistency across web/mobile
3. **AI Model Fallback Reliability** - Automatic fallback with valid responses
4. **Health Data Temporal Consistency** - Chronological order and valid timestamps
5. **Treatment Recommendation Safety** - Contraindication and allergy validation
6. **Progress Tracking Monotonicity** - Non-decreasing progress values
7. **Accessibility Compliance** - WCAG 2.1 AA compliance validation
8. **Multilingual Content Consistency** - Translation accuracy preservation
9. **Practitioner Override Authority** - Audit trail for practitioner modifications
10. **Data Privacy and Audit Trail** - HIPAA-compliant logging
11. **IoT Data Integration Consistency** - Device data validation and integrity
12. **Gamification Progress Integrity** - Achievement and progress validation
13. **Social Privacy Protection** - Community interaction privacy controls

## Test Results Analysis

The framework includes sophisticated analysis capabilities:

### Failure Pattern Recognition
- **Property Assertion Failures**: Logic issues in property definitions
- **Type/Null Reference Errors**: Data generator or validation issues
- **Range/Boundary Errors**: Invalid data ranges or edge cases
- **Network/API Errors**: External dependency failures
- **Data Validation Errors**: Schema or constraint violations

### Automated Recommendations
- Success rate analysis and improvement suggestions
- Pattern-specific debugging guidance
- Performance optimization recommendations
- Test complexity adjustment suggestions

### Report Formats
- **Console**: Quick feedback during development
- **JSON**: Machine-readable results for CI/CD integration
- **HTML**: Comprehensive visual reports for stakeholders

## Configuration

### Test Configuration (`PBT_CONFIG`)
```typescript
export const PBT_CONFIG = {
  numRuns: 100,        // Minimum iterations per property
  endOnFailure: true,  // Stop on first failure for debugging
  seed: 42,           // Reproducible test runs
  verbose: false      // Detailed output control
}
```

### Custom Configuration
```typescript
testProperty(
  'Custom test',
  arbitrary,
  predicate,
  metadata,
  { numRuns: 200, verbose: true } // Override defaults
)
```

## Integration with Existing Tests

The property-based testing framework integrates seamlessly with the existing Vitest setup:

- **Setup**: Automatic initialization in `setupTests.ts`
- **Reporting**: Global reporter tracks results across test suites
- **Configuration**: Extended Vitest config for property test files
- **Scripts**: New npm scripts for property-specific testing

## Best Practices

### Property Design
1. **Focus on invariants** that should always hold
2. **Use round-trip properties** for serialization/parsing
3. **Test edge cases** with boundary value generators
4. **Validate safety constraints** for medical recommendations
5. **Ensure temporal consistency** for time-series data

### Data Generation
1. **Generate realistic data** that matches production scenarios
2. **Include edge cases** in generators (empty arrays, null values, etc.)
3. **Respect domain constraints** (valid age ranges, medical codes, etc.)
4. **Use appropriate distributions** for realistic test scenarios

### Debugging Failures
1. **Analyze counterexamples** to understand failure patterns
2. **Use shrinking** to find minimal failing cases
3. **Check property logic** before assuming code bugs
4. **Validate generators** produce expected data ranges

## Future Enhancements

### Planned Features
- **Performance benchmarking** integration
- **Mutation testing** for property validation
- **Automated test generation** from API schemas
- **Integration with external medical databases**
- **Real-time monitoring** of production property violations

### Extension Points
- **Custom generators** for specific medical scenarios
- **Domain-specific assertions** for TCM concepts
- **Integration adapters** for external healthcare systems
- **Compliance validators** for medical regulations

## Troubleshooting

### Common Issues

#### Generator Errors
```
Error: Invalid parameter encountered at index X: expecting an Arbitrary
```
**Solution**: Ensure nested objects use `fc.record()` wrapper

#### Property Failures
```
Property failed after N tests
```
**Solution**: Analyze counterexample and verify property logic

#### Timeout Issues
```
Test timeout exceeded
```
**Solution**: Reduce `numRuns` or optimize test logic

### Debug Mode
Enable verbose logging for detailed failure analysis:
```typescript
testProperty(name, arbitrary, predicate, metadata, { verbose: true })
```

## Contributing

When adding new property tests:

1. **Follow naming conventions**: Use descriptive test names
2. **Include metadata**: Feature name, property number, requirements
3. **Document properties**: Explain what the property validates
4. **Add generators**: Create realistic data generators for new domains
5. **Update documentation**: Keep this README current with new features

## Resources

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [TCM Medical Standards](https://www.who.int/traditional-complementary-integrative-medicine)
- [HIPAA Compliance Guidelines](https://www.hhs.gov/hipaa/index.html)