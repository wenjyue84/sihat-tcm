# Testing Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Run all tests
npm test

# Run property-based tests
npm run test:pbt

# Run with coverage
npm run test:coverage

# Generate test report
npm run test:pbt-report
```

## 🧪 Test Categories

| Category           | Command                                     | Description                       |
| ------------------ | ------------------------------------------- | --------------------------------- |
| **Property-Based** | `npm run test:pbt`                          | Correctness properties validation |
| **Unit Tests**     | `npm test -- --run`                         | Individual component testing      |
| **Integration**    | `npm test -- --testPathPattern=integration` | End-to-end workflows              |
| **Performance**    | `npm test -- --testPathPattern=performance` | Benchmarking tests                |
| **Accessibility**  | `npm test -- accessibilityManager.test.ts`  | WCAG compliance                   |

## 🎯 Property Test Framework

### Core Commands

```bash
# Framework validation
npm test -- propertyTestFramework.test.ts --run

# Correctness properties
npm test -- correctnessProperties.test.ts --run

# All property tests with verbose output
npm run test:pbt -- --verbose
```

### Key Files

- `src/lib/testing/propertyTestFramework.ts` - Core framework
- `src/lib/testing/medicalDataGenerators.ts` - Data generators
- `src/lib/testing/propertyTestHelpers.ts` - Utilities
- `src/lib/testing/__tests__/` - Framework tests

## 📊 Developer Portal

### Access

1. Navigate to `/developer`
2. Click "Testing Suite" tab
3. Run tests with real-time monitoring

### Features

- ✅ Run individual test suites
- 📈 View real-time progress
- 📋 Generate HTML/JSON reports
- 🔍 Analyze failure patterns

## 🛠️ Specific Test Suites

```bash
# Medical safety validation
npm test -- medicalSafetyValidator.test.ts --run

# Image quality assessment
npm test -- imageQualityValidator.test.ts --run

# AI model routing
npm test -- aiModelRouter.test.ts --run

# Platform optimization
npm test -- platformOptimizer.test.ts --run

# Voice commands
npm test -- voiceCommandHandler.test.ts --run

# Accessibility features
npm test -- accessibilityManager.test.ts --run
```

## 📈 Report Generation

### HTML Reports

```bash
# Via script
node scripts/run-property-tests.js --format html

# Via API
curl "http://localhost:3100/api/developer/test-report?format=html"
```

### JSON Reports

```bash
# Via script
node scripts/run-property-tests.js --format json

# Via API
curl "http://localhost:3100/api/developer/test-report?format=json"
```

## 🔧 Configuration

### Property Test Config

```typescript
// src/lib/testing/propertyTestFramework.ts
export const PBT_CONFIG = {
  numRuns: 100, // Test iterations
  endOnFailure: true, // Stop on first failure
  seed: 42, // Reproducible runs
  verbose: false, // Debug output
};
```

### Vitest Config

```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    testTimeout: 30000, // Increased for property tests
  },
});
```

## 🚨 Troubleshooting

### Common Issues

| Issue                 | Solution                             |
| --------------------- | ------------------------------------ |
| Property test timeout | Reduce `numRuns` or optimize logic   |
| Generator errors      | Use `fc.record()` for nested objects |
| Memory issues         | Reduce test data size                |
| Flaky tests           | Check for race conditions            |

### Debug Commands

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- propertyTestFramework.test.ts --verbose

# Run with reduced iterations for debugging
# (modify PBT_CONFIG.numRuns temporarily)
```

## 📋 Correctness Properties

The system validates these key properties:

1. **Diagnostic Data Consistency** - Referential integrity
2. **Cross-Platform Synchronization** - Data consistency
3. **AI Model Fallback Reliability** - Automatic fallback
4. **Health Data Temporal Consistency** - Chronological order
5. **Treatment Recommendation Safety** - Medical validation
6. **Progress Tracking Monotonicity** - Non-decreasing progress
7. **Accessibility Compliance** - WCAG 2.1 AA standards
8. **Multilingual Content Consistency** - Translation accuracy

## 🎯 Success Metrics

- **Target Coverage**: 80%+ for new code
- **Property Test Success**: 95%+ pass rate
- **Safety Tests**: 100% pass rate required
- **Performance**: No regression allowed

## 📚 Documentation

- [Comprehensive Testing Guide](./COMPREHENSIVE_TESTING_GUIDE.md)
- [Property Testing README](../src/lib/testing/README.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Documentation](./DEVELOPER_DOCUMENTATION.md)

---

**💡 Pro Tip**: Use the Developer Portal Testing Suite for interactive test management and real-time monitoring!
