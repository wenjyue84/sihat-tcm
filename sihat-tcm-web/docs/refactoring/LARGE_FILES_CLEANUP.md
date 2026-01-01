# Large Files Cleanup Plan

**Date**: January 2025  
**Purpose**: Remove or reorganize large files to improve codebase maintainability

## Files Removed ✅

### Migration Scripts (One-Time Use)
1. ✅ **`src/app/api/migrate-music/route.ts`** - Deleted
   - One-time migration script (94 lines)
   - Comment says "DELETE THIS FILE after running the migration once"
   - Migration already completed

2. ✅ **`src/app/api/migrate-medical-history/route.ts`** - Deleted
   - One-time migration script (103 lines)
   - Database column migration already completed

**Total Removed**: ~200 lines

---

## Files to Remove/Move (Recommended)

### Test Routes (Development Only)

These test API routes should be moved to `(dev)` route group or removed if not actively used:

1. **`src/app/api/test-gemini/route.ts`** (48 lines)
   - Test endpoint for Gemini API connectivity
   - **Action**: Move to `src/app/api/(dev)/test-gemini/route.ts` or delete if not needed

2. **`src/app/api/test-image/route.ts`** (111 lines)
   - Test endpoint for image analysis
   - **Action**: Move to `src/app/api/(dev)/test-image/route.ts` or delete if not needed

### Test Pages (Should be in Dev Route Group)

**19 test pages** currently in production routes that should be moved to `(dev)`:

1. `src/app/test-accessibility/page.tsx`
2. `src/app/test-basic-info/page.tsx`
3. `src/app/test-button-toggle/page.tsx`
4. `src/app/test-camera/page.tsx`
5. `src/app/test-chat/page.tsx`
6. `src/app/test-contrast/page.tsx`
7. `src/app/test-gemini/page.tsx`
8. `src/app/test-glass-card/page.tsx`
9. `src/app/test-image/page.tsx`
10. `src/app/test-inquiry/page.tsx`
11. `src/app/test-mobile-layout/page.tsx`
12. `src/app/test-models/page.tsx`
13. `src/app/test-pdf/page.tsx`
14. `src/app/test-prompts/page.tsx`
15. `src/app/test-pulse/page.tsx`
16. `src/app/test-report/page.tsx`
17. `src/app/test-report-chat/page.tsx`
18. `src/app/test-runner/page.tsx` ⚠️ **3232 lines!**
19. `src/app/test-welcome-sheet/page.tsx`

**Action**: Move all to `src/app/(dev)/test-*/page.tsx`

**Note**: `test-runner/page.tsx` is extremely large (3232 lines) and should be:
- Split into multiple test suites, OR
- Moved to proper test infrastructure (Vitest/Jest), OR
- Deleted if not actively used

---

## Large Component Files (Consider Splitting)

These are large but functional - consider splitting rather than deleting:

1. **`src/app/developer/page.tsx`** - 1657 lines
   - **Action**: Split into smaller components (see REFACTORING_OPPORTUNITIES.md)

2. **`src/components/patient/UnifiedDashboard.tsx`** - 1367 lines
   - **Action**: Split into section components (see REFACTORING_OPPORTUNITIES.md)

3. **`src/hooks/useDiagnosisWizard.ts`** - 834 lines
   - **Action**: Split into smaller hooks (see REFACTORING_OPPORTUNITIES.md)

---

## Documentation Files (Review for Redundancy)

Check if these documentation files are redundant:

- `docs/REFACTORING_OPPORTUNITIES.md`
- `docs/REFACTORING_GUIDE.md`
- `docs/refactoring/REFACTORING_SUMMARY.md`
- `docs/refactoring/COMPLETED_REFACTORINGS.md`
- `docs/refactoring/FINAL_REFACTORING_REPORT.md`
- `docs/refactoring/REFACTORING_PROGRESS.md`

**Action**: Consolidate into single comprehensive refactoring document

---

## Next Steps

1. ✅ **Completed**: Removed migration scripts
2. **Next**: Move test routes to `(dev)` route group
3. **Next**: Move test pages to `(dev)` route group
4. **Next**: Consider splitting or removing `test-runner/page.tsx` (3232 lines)
5. **Next**: Consolidate documentation files

---

## Impact

- **Files Removed**: 2 migration scripts (~200 lines)
- **Potential Cleanup**: 19 test pages + 2 test routes
- **Largest File**: `test-runner/page.tsx` (3232 lines) - high priority for cleanup


