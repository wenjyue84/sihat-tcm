# Sihat TCM - Codebase Improvement Prompts

> **Generated**: 2026-01-02
> **Based on**: Comprehensive codebase review

Use these prompts with your AI assistant to systematically improve the codebase.

---

## 🔴 High Priority

### 1. Add Mobile Testing Infrastructure
```
Set up Jest and React Native Testing Library in sihat-tcm-mobile. Create:
1. A basic test configuration (jest.config.js)
2. Test setup file with React Native mocks
3. Example tests for:
   - A simple component (e.g., GlassCard)
   - A screen (e.g., OnboardingScreen)
   - A utility function (e.g., lib/googleAI.js)
4. Add test scripts to package.json

Follow React Native Testing Library best practices and ensure tests can run with `npm test`.
```

### 2. Fix Type Errors in Test Files
```
Fix all TypeScript compilation errors in the test files. Run `npm run type-check` and systematically resolve:
1. The 37 errors in src/lib/testing/__tests__/correctnessProperties.test.ts
2. Any other test file compilation errors

Ensure all tests pass with `npm run test:run` after fixes.
```

### 3. Refactor `isGuest` Variable Naming
```
In sihat-tcm-mobile/App.js, the `isGuest` state variable is misleading - it actually means "should show main app" or "is authenticated/ready". 

Refactor this to use clearer naming:
1. Rename `isGuest` to `isAppReady` or `showMainApp`
2. Rename `setIsGuest` accordingly
3. Update all usages in the file
4. Update any comments to reflect the true purpose
5. Keep backward compatibility if this state is passed to child components
```

---

## 🟡 Medium Priority

### 4. Create Shared Colors Constant (Mobile)
```
In sihat-tcm-mobile/constants/, create a Colors.js file that:
1. Re-exports the color values from themes.js for convenience
2. Matches the pattern documented in GEMINI.md
3. Provides a simple flat export structure like:
   export const Colors = { background, text, accent, error, ... }
4. Update App.js to use Colors instead of hardcoded hex values

This aligns the codebase with the documented rules in GEMINI.md.
```

### 5. Extract Shared Doctor Components
```
From the Doctor Dashboard (src/app/doctor/page.tsx) and Doctor Reports (src/app/doctor/reports/page.tsx), extract shared components:

1. Create src/components/doctor/shared/InquiryReportDialog.tsx
   - Accept inquiry data as props
   - Handle dialog open/close state
   - Display full report with styling

2. Create src/components/doctor/shared/InquiryCard.tsx
   - Support variants: 'dashboard' and 'reports' for different styling
   - Accept onClick, patient info, diagnosis summary as props
   - Include flag/priority indicator

3. Create src/lib/utils/patientProfileResolver.ts
   - Extract the manual join logic for profiles + patients
   - Handle missing columns gracefully (42703 errors)

4. Update both pages to use these shared components
```

### 6. Extract Magic Numbers to Constants
```
In sihat-tcm-web/src/app/api/consult/route.ts, extract magic numbers and strings to named constants:

1. Create src/lib/constants/consult.ts with:
   - MIN_INQUIRY_SUMMARY_LENGTH = 50 (line 251)
   - MAX_DURATION_SECONDS = 60
   - Any other magic values in the file

2. Add JSDoc comments explaining WHY each threshold was chosen

3. Update route.ts to import and use these constants
```

### 7. Create Mobile Error Reporter
```
Create sihat-tcm-mobile/lib/errorReporter.js that mirrors the web ErrorLogger pattern:

1. Functions to export:
   - logError(error, context)
   - logNetworkError(endpoint, error)
   - logUserActionError(action, error)

2. In development: console.error with formatted output
3. In production: optionally send to a monitoring endpoint
4. Use AsyncStorage to queue errors if offline

Replace console.warn/console.error calls in App.js and other files with this utility.
```

---

## 🟢 Low Priority

### 8. Clean Up App.js Imports
```
In sihat-tcm-mobile/App.js, reorganize the imports:

1. Move all imports to the top of the file (before any code)
2. Group imports in this order:
   - React and React Native core
   - Expo packages
   - Third-party libraries
   - Local components
   - Local utilities/constants
3. Remove the ResultsDockTest import (it's commented out in usage)
4. Add a blank line between each import group
```

### 9. Reduce Large File Sizes
```
The following files are candidates for refactoring due to size:

1. src/hooks/useCameraHeartRate.ts (19KB)
   - Extract signal processing logic to lib/heartRate/signalProcessor.ts
   - Extract camera management to a separate hook
   - Keep the main hook as an orchestrator

2. src/app/api/consult/route.ts (669 lines)
   - Extract diagnosisInfo string building to lib/api/consult/buildDiagnosisInfo.ts
   - Extract report options parsing to lib/api/consult/parseReportOptions.ts
   - Keep route.ts focused on request handling

Provide a refactoring plan and implement iteratively.
```

### 10. Add Missing JSDoc to Mobile Code
```
Add JSDoc documentation to key mobile files:

1. lib/googleAI.js - Already has good docs ✓
2. lib/supabase.js - Add module-level and function docs
3. lib/biometricAuth.js - Add function parameter and return docs
4. screens/diagnosis/DiagnosisScreen.js - Add component props docs

Follow the same style as the web codebase's ErrorLogger documentation.
```

### 11. Consolidate Refactoring Documentation
```
The root directory has many refactoring-related .md files:
- REFACTORING_PLAN.md
- REFACTORING_PROGRESS_REPORT.md
- REFACTORING_COMPLETION_REPORT.md
- REFACTORING_ASSESSMENT_PHASE_1.md
- REFACTORING_FINAL_SUMMARY.md
- REFACTORING_FINAL_COMPLETION_SUMMARY.md
- COMPREHENSIVE_REFACTORING_SUMMARY.md
- REFACTORING_INTEGRATION_GUIDE.md
- REFACTORING_PROMPT.md

Consolidate these into:
1. docs/refactoring/HISTORY.md - Archived decisions and completed work
2. docs/refactoring/CURRENT_STATUS.md - What's done, what's pending
3. Delete the root-level files after migration

Keep only essential documentation in the root directory.
```

---

## 🔧 Maintenance Prompts

### Run Periodically

#### Code Quality Check
```
Run a code quality check on the Sihat TCM codebase:
1. Run `npm run type-check` in sihat-tcm-web and fix any errors
2. Run `npm run lint` and fix warnings
3. Run `npm run test:run` and ensure all tests pass
4. Check for any new large files (>500 lines) that need refactoring
```

#### Dependency Audit
```
Audit dependencies in both sihat-tcm-web and sihat-tcm-mobile:
1. Run `npm audit` in both directories
2. Update any packages with known vulnerabilities
3. Check for major version updates to core packages (Next.js, Expo, React)
4. Update package.json if safe to do so
```

#### Documentation Sync
```
Ensure documentation is in sync with code:
1. Check if GEMINI.md rules match actual code patterns
2. Verify SUPABASE_SCHEMA.md reflects current database structure
3. Update any outdated examples or file paths
4. Add documentation for any new features added since last sync
```

---

## ✅ Completion Checklist

- [ ] Mobile testing infrastructure added
- [ ] Type errors in tests fixed
- [ ] `isGuest` renamed to clearer name
- [ ] Colors.js created for mobile
- [ ] Shared doctor components extracted
- [ ] Magic numbers extracted to constants
- [ ] Mobile error reporter created
- [ ] App.js imports cleaned up
- [ ] Large files refactored
- [ ] JSDoc added to mobile code
- [ ] Refactoring docs consolidated
