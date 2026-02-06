# Testing Quick Reference

> Quick reference guide for all testing needs in Sihat TCM.

## Table of Contents

1. [Quick Start Commands](#quick-start-commands)
2. [Test Categories](#test-categories)
3. [Feature-Specific Testing](#feature-specific-testing)
4. [Property Test Framework](#property-test-framework)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start Commands

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

---

## Test Categories

| Category           | Command                                     | Description                       |
| ------------------ | ------------------------------------------- | --------------------------------- |
| **Property-Based** | `npm run test:pbt`                          | Correctness properties validation |
| **Unit Tests**     | `npm test -- --run`                         | Individual component testing      |
| **Integration**    | `npm test -- --testPathPattern=integration` | End-to-end workflows              |
| **Performance**    | `npm test -- --testPathPattern=performance` | Benchmarking tests                |
| **Accessibility**  | `npm test -- accessibilityManager.test.ts`  | WCAG compliance                   |

---

## Feature-Specific Testing

### Diagnosis Data Recording

**Quick Test:**

```bash
cd sihat-tcm
npm run test:run -- src/lib/__tests__/diagnosis-schema.test.ts src/types/__tests__/database-types.test.ts src/lib/__tests__/diagnosis-data-collection.test.ts src/lib/__tests__/guest-session.test.ts src/components/patient/__tests__/DiagnosisInputDataViewer.test.tsx
```

**Expected:** ✅ 76 tests passed

**Manual Testing:**

1. **Authenticated User Flow:**
   - Login and complete a diagnosis
   - Check Patient Portal (`/patient/dashboard`)
   - Verify history card shows badges (Inquiry, Tongue, Face, Voice, Pulse)
   - Click diagnosis → verify "Input Data" section appears

2. **Guest User Flow:**
   - Complete diagnosis without login
   - Check browser DevTools → Session Storage
   - Verify `guest_session_token` exists
   - Check database: `SELECT * FROM guest_diagnosis_sessions ORDER BY created_at DESC LIMIT 1;`

**Verification Checklist:**

- [ ] Migration runs successfully
- [ ] New columns exist in `diagnosis_sessions`
- [ ] `guest_diagnosis_sessions` table exists
- [ ] All input data is collected during diagnosis
- [ ] Data is saved to database (authenticated)
- [ ] Guest sessions are created (unauthenticated)
- [ ] History cards show input data indicators
- [ ] Input data viewer displays all sections

### Specific Test Suites

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

---

## Property Test Framework

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

### Configuration

```typescript
// src/lib/testing/propertyTestFramework.ts
export const PBT_CONFIG = {
  numRuns: 100, // Test iterations
  endOnFailure: true, // Stop on first failure
  seed: 42, // Reproducible runs
  verbose: false, // Debug output
};
```

### Correctness Properties

The system validates these key properties:

1. **Diagnostic Data Consistency** - Referential integrity
2. **Cross-Platform Synchronization** - Data consistency
3. **AI Model Fallback Reliability** - Automatic fallback
4. **Health Data Temporal Consistency** - Chronological order
5. **Treatment Recommendation Safety** - Medical validation
6. **Progress Tracking Monotonicity** - Non-decreasing progress
7. **Accessibility Compliance** - WCAG 2.1 AA standards
8. **Multilingual Content Consistency** - Translation accuracy

---

## Developer Portal

### Access

1. Navigate to `/developer`
2. Click "Testing Suite" tab
3. Run tests with real-time monitoring

### Features

- ✅ Run individual test suites
- 📈 View real-time progress
- 📋 Generate HTML/JSON reports
- 🔍 Analyze failure patterns

### Report Generation

**HTML Reports:**

```bash
# Via script
node scripts/run-property-tests.js --format html

# Via API
curl "http://localhost:3100/api/developer/test-report?format=html"
```

**JSON Reports:**

```bash
# Via script
node scripts/run-property-tests.js --format json

# Via API
curl "http://localhost:3100/api/developer/test-report?format=json"
```

---

## Troubleshooting

### Common Issues

| Issue                    | Solution                             |
| ------------------------ | ------------------------------------ |
| Property test timeout    | Reduce `numRuns` or optimize logic   |
| Generator errors         | Use `fc.record()` for nested objects |
| Memory issues            | Reduce test data size                |
| Flaky tests              | Check for race conditions            |
| "Column does not exist"  | Run the migration SQL file           |
| Input data not showing   | Check browser console, verify DB     |
| Guest session not saving | Check RLS policies                   |

### Debug Commands

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- propertyTestFramework.test.ts --verbose

# Run with reduced iterations for debugging
# (modify PBT_CONFIG.numRuns temporarily)
```

---

## Success Metrics

- **Target Coverage**: 80%+ for new code
- **Property Test Success**: 95%+ pass rate
- **Safety Tests**: 100% pass rate required
- **Performance**: No regression allowed

---

## Related Documentation

- [Comprehensive Testing Guide](../COMPREHENSIVE_TESTING_GUIDE.md)
- [Property Testing README](../../src/lib/testing/README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Developer Documentation](../DEVELOPER_DOCUMENTATION.md)

---

**💡 Pro Tip**: Use the Developer Portal Testing Suite for interactive test management and real-time monitoring!
