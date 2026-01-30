# Test Routes Migration Guide

**Date**: January 2025  
**Status**: Ready for Execution

## Overview

Move all test pages from production routes (`src/app/test-*/`) to the development route group (`src/app/(dev)/test-*/`).

## Test Pages to Move (18 files)

1. `test-accessibility/page.tsx` → `(dev)/test-accessibility/page.tsx`
2. `test-basic-info/page.tsx` → `(dev)/test-basic-info/page.tsx`
3. `test-button-toggle/page.tsx` → `(dev)/test-button-toggle/page.tsx`
4. `test-camera/page.tsx` → `(dev)/test-camera/page.tsx`
5. `test-chat/page.tsx` → `(dev)/test-chat/page.tsx`
6. `test-contrast/page.tsx` → `(dev)/test-contrast/page.tsx`
7. `test-gemini/page.tsx` → `(dev)/test-gemini/page.tsx`
8. `test-glass-card/page.tsx` → `(dev)/test-glass-card/page.tsx`
9. `test-image/page.tsx` → `(dev)/test-image/page.tsx`
10. `test-inquiry/page.tsx` → `(dev)/test-inquiry/page.tsx`
11. `test-mobile-layout/page.tsx` → `(dev)/test-mobile-layout/page.tsx`
12. `test-models/page.tsx` → `(dev)/test-models/page.tsx`
13. `test-pdf/page.tsx` → `(dev)/test-pdf/page.tsx`
14. `test-prompts/page.tsx` → `(dev)/test-prompts/page.tsx`
15. `test-pulse/page.tsx` → `(dev)/test-pulse/page.tsx`
16. `test-report/page.tsx` → `(dev)/test-report/page.tsx`
17. `test-report-chat/page.tsx` → `(dev)/test-report-chat/page.tsx`
18. `test-welcome-sheet/page.tsx` → `(dev)/test-welcome-sheet/page.tsx`

**Note**: `test-runner/page.tsx` is already in `(dev)/test-runner/`

## Migration Steps

### Option 1: Manual Move (Recommended)

1. Create directories in `(dev)` for each test route
2. Move each `page.tsx` file to its new location
3. Delete old directories
4. Test that routes still work at `/dev/test-*` instead of `/test-*`

### Option 2: Script-Based Move

```bash
# Run from sihat-tcm-web directory
cd src/app
mkdir -p "(dev)"

# Move each test directory
for dir in test-*; do
  if [ -d "$dir" ] && [ "$dir" != "test-runner" ]; then
    mv "$dir" "(dev)/$dir"
  fi
done
```

## Route Changes

**Before**: Routes accessible at `/test-*`  
**After**: Routes accessible at `/dev/test-*`

## Impact

- ✅ Cleaner production code structure
- ✅ Test routes clearly separated from production
- ✅ Better organization
- ⚠️ **Breaking Change**: Any bookmarks or links to `/test-*` will need updating

## Verification

After migration, verify:
- [ ] All test pages load at `/dev/test-*` routes
- [ ] No broken imports
- [ ] Developer dashboard still works
- [ ] No production routes reference test pages

## Rollback

If needed, move files back to `src/app/test-*/` directories.

---

**Status**: Documented - Ready for manual execution or script automation



