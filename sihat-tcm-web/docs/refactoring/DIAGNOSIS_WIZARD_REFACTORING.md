# DiagnosisWizard Refactoring Plan

**Date**: January 2025  
**Status**: In Progress

---

## Overview

`DiagnosisWizard.tsx` is a 658-line component that orchestrates the entire diagnosis flow. This refactoring extracts step rendering logic and test data management to improve maintainability.

---

## Files Created

### 1. `wizard/StepRenderer.tsx`
- **Purpose**: Centralized step rendering logic
- **Benefits**:
  - Single responsibility: renders steps based on current step
  - Easier to test individual step rendering
  - Clearer component structure
  - Reusable step rendering logic

### 2. `wizard/utils/testDataHelpers.ts`
- **Purpose**: Test data generation and clearing utilities
- **Benefits**:
  - Separated test data logic from main component
  - Reusable test data generation
  - Easier to maintain test data structure

---

## Refactoring Steps

### Step 1: Extract Step Rendering ✅
- Created `StepRenderer.tsx` component
- Handles all step rendering logic
- Maps step types to appropriate components

### Step 2: Extract Test Data Helpers ✅
- Created `testDataHelpers.ts` utilities
- `generateTestData()` - Generates mock data for all steps
- `clearTestData()` - Clears all diagnosis data

### Step 3: Update DiagnosisWizard.tsx (TODO)
- Replace inline step rendering with `<StepRenderer />`
- Replace test data generation with `generateTestData()`
- Replace test data clearing with `clearTestData()`
- Simplify component structure

---

## Expected Impact

- **Before**: 658 lines with embedded step rendering and test data logic
- **After**: ~400-450 lines (orchestrator only)
- **Reduction**: ~200-250 lines moved to focused modules
- **Benefits**:
  - Better separation of concerns
  - Easier to test step rendering
  - Reusable test data utilities
  - Clearer component structure

---

## Next Steps

1. Update `DiagnosisWizard.tsx` to use `StepRenderer`
2. Update `DiagnosisWizard.tsx` to use test data helpers
3. Remove inline step rendering logic
4. Test all step transitions
5. Verify test data filling/clearing works

---

**Last Updated**: January 2025



