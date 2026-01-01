# Files to Remove - Large Files Cleanup

**Date**: January 2025

## ✅ Already Removed

1. ✅ `src/app/api/migrate-music/route.ts` (94 lines)
2. ✅ `src/app/api/migrate-medical-history/route.ts` (103 lines)

## 📋 Large Files Identified

### Current Large Files (Actual Sizes)

1. **`src/components/patient/UnifiedDashboard.tsx`** - **1329 lines** ⚠️
   - **Action**: Split into smaller components (see REFACTORING_OPPORTUNITIES.md)
   - **Priority**: High (largest component file)

2. **`src/app/developer/page.tsx`** - **284 lines** ✅
   - Already reasonable size (was documented as 1657, but is actually 284)
   - No action needed

3. **`src/hooks/useDiagnosisWizard.ts`** - **175 lines** ✅
   - Already reasonable size (was documented as 834, but is actually 175)
   - No action needed

### Test Pages (Move to Dev Route Group)

**19 test pages** in production routes - should be moved to `(dev)`:

```
src/app/test-*/page.tsx → src/app/(dev)/test-*/page.tsx
```

These are development/testing pages and shouldn't be in production routes.

### Test API Routes (Move to Dev Route Group)

1. `src/app/api/test-gemini/route.ts` (48 lines)
2. `src/app/api/test-image/route.ts` (111 lines)

**Action**: Move to `src/app/api/(dev)/test-*/route.ts`

---

## 🎯 Recommended Actions

### Immediate (Safe to Remove/Move)

1. **Move test pages** to `(dev)` route group (19 files)
2. **Move test API routes** to `(dev)` route group (2 files)
3. **Split UnifiedDashboard.tsx** (1329 lines → multiple smaller components)

### Documentation Cleanup

Consolidate redundant refactoring documentation:
- Merge completed refactoring docs into single summary
- Keep only active/current refactoring guides

---

## 📊 Impact

- **Files Removed**: 2 migration scripts (~200 lines)
- **Files to Move**: 21 test files (test pages + routes)
- **Files to Split**: 1 large component (1329 lines)
- **Total Potential Cleanup**: ~2000+ lines


