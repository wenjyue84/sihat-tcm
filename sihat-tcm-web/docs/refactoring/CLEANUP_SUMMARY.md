# Large Files Cleanup Summary

**Date**: January 2025  
**Status**: In Progress

## ✅ Files Removed

### Migration Scripts (One-Time Use)
1. ✅ `src/app/api/migrate-music/route.ts` - **Deleted** (94 lines)
2. ✅ `src/app/api/migrate-medical-history/route.ts` - **Deleted** (103 lines)

**Total Removed**: ~200 lines

---

## 📋 Files to Remove/Move

### Test API Routes (Development Only)

Move these to `(dev)` route group or delete if not needed:

1. **`src/app/api/test-gemini/route.ts`** (48 lines)
   - Used by: `test-gemini/page.tsx`
   - **Action**: Move to `src/app/api/(dev)/test-gemini/route.ts`

2. **`src/app/api/test-image/route.ts`** (111 lines)
   - Used by: `test-image/page.tsx`
   - **Action**: Move to `src/app/api/(dev)/test-image/route.ts`

### Test Pages (19 files - Move to Dev Route Group)

All these test pages should be moved from production routes to `(dev)`:

```
src/app/test-*/page.tsx → src/app/(dev)/test-*/page.tsx
```

1. `test-accessibility/page.tsx`
2. `test-basic-info/page.tsx`
3. `test-button-toggle/page.tsx`
4. `test-camera/page.tsx`
5. `test-chat/page.tsx`
6. `test-contrast/page.tsx`
7. `test-gemini/page.tsx`
8. `test-glass-card/page.tsx`
9. `test-image/page.tsx`
10. `test-inquiry/page.tsx`
11. `test-mobile-layout/page.tsx`
12. `test-models/page.tsx`
13. `test-pdf/page.tsx`
14. `test-prompts/page.tsx`
15. `test-pulse/page.tsx`
16. `test-report/page.tsx`
17. `test-report-chat/page.tsx`
18. `test-welcome-sheet/page.tsx`

**Note**: `test-runner/page.tsx` is already in `(dev)` route group ✅

---

## 📚 Documentation Consolidation

### Redundant Documentation Files

These refactoring docs can be consolidated:

**In `docs/refactoring/`:**
- `COMPLETED_REFACTORINGS.md` - Can merge into main summary
- `FINAL_REFACTORING_REPORT.md` - Can merge into main summary
- `REFACTORING_PROGRESS.md` - Can merge into main summary
- `REFACTORING_SUMMARY.md` - Keep as main summary
- `MIDDLE_RISK_REFACTORING_CANDIDATES.md` - Keep (useful reference)
- `LARGE_FILES_CLEANUP.md` - Keep (this file)
- `TEST_ROUTES_MIGRATION.md` - Can merge into main summary
- `DATE_FORMATTING_MIGRATION.md` - Can merge into main summary
- `TYPE_SAFETY_IMPROVEMENTS.md` - Can merge into main summary
- `AI_TYPE_SAFETY_IMPROVEMENTS.md` - Can merge into main summary
- `LIB_DIRECTORY_ORGANIZATION.md` - Can merge into main summary
- `DIAGNOSIS_WIZARD_REFACTORING.md` - Keep if contains unique info

**In `docs/`:**
- `REFACTORING_OPPORTUNITIES.md` - Keep (main reference)
- `REFACTORING_GUIDE.md` - Review if redundant with REFACTORING_OPPORTUNITIES.md

**Action**: Consolidate completed refactorings into single `REFACTORING_SUMMARY.md`

---

## 🎯 Quick Wins for File Removal

### Safe to Delete (If Not Used)

1. **Old migration scripts** (if migrations completed):
   - Check `scripts/` directory for old migration files
   - Check `migrations/` directory for completed migrations

2. **Test files in wrong locations**:
   - Any `.test.ts` files in `src/app/` (should be in `__tests__/` or `src/`)

3. **Duplicate utility files**:
   - Check for duplicate implementations of same functions

---

## 📊 Impact Summary

- **Removed**: 2 files (~200 lines)
- **To Move**: 19 test pages + 2 test routes
- **To Consolidate**: ~10 documentation files
- **Potential Cleanup**: ~5000+ lines (test pages + docs)

---

## Next Steps

1. ✅ Remove migration scripts (DONE)
2. Move test routes to `(dev)` route group
3. Move test pages to `(dev)` route group  
4. Consolidate documentation files
5. Review and remove any unused scripts



