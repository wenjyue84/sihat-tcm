# Test Runner Refactoring

This directory contains the refactored test-runner page, split from the original 3232-line file.

## Structure

- `types.ts` - Type definitions (TestStatus, TestCategory, TestResult)
- `constants.ts` - Constants (MOCK_IMAGE, MOCK_AUDIO, TEST_CATEGORIES)
- `testDefinitions.ts` - Initial test definitions array (to be extracted from original)
- `utils.ts` - Utility functions (retryWithBackoff)
- `testExecutors/` - Test execution logic split by category
  - `index.ts` - Main executor router
  - `coreUtilities.ts` - Core utilities tests
  - `basicInfo.ts` - Step 1 tests
  - `tcmInquiry.ts` - Step 2 tests
  - `tongueAnalysis.ts` - Step 3 tests
  - `faceAnalysis.ts` - Step 4 tests
  - `voiceAnalysis.ts` - Step 5 tests
  - `pulseCheck.ts` - Step 6 tests
  - `smartConnect.ts` - Step 7 tests
  - `reportGeneration.ts` - Step 8 tests
  - `systemHealth.ts` - System health tests
- `components/` - UI components
  - `TestFilters.tsx` - Filter controls
  - `TestList.tsx` - Test list display
  - `TestItem.tsx` - Individual test item
  - `TestStats.tsx` - Statistics display
  - `TroubleshootingPanel.tsx` - Troubleshooting assistant panel
- `page.tsx` - Main page component

## Next Steps

1. Extract test definitions array (lines 67-802) to `testDefinitions.ts`
2. Extract test execution switch cases to category-specific files in `testExecutors/`
3. Extract UI components to `components/`
4. Refactor main `page.tsx` to import and use all modules
5. Delete original `test-runner/page.tsx`



