# Middle-Risk Refactoring Candidates

**Date**: January 2025  
**Status**: Identified - Ready for Review

## Overview

This document identifies **middle-risk** refactoring opportunities - files that have moderate complexity, code duplication, or maintainability issues but are not critical enough to be high-risk, nor trivial enough to be low-risk. These are ideal candidates for incremental refactoring that improves code quality without major architectural changes.

---

## Criteria for Middle-Risk Files

- **Moderate complexity**: Not too simple, not too complex
- **Code duplication**: Functions/logic repeated across files
- **Type safety issues**: Using `any` types where better types exist
- **Inconsistent patterns**: Not following established patterns
- **Moderate size**: 200-800 lines (not massive, but could be split)
- **Non-critical**: Not core infrastructure, but frequently used

---

## 1. API Routes with Error Handling Issues (18 files)

**Risk Level**: ⚠️ **Medium**  
**Impact**: High (affects all API routes)  
**Effort**: Low-Medium (2-4 hours total)

### Files

1. `src/app/api/ask-dietary-advice/route.ts` (76 lines)
   - Uses `catch (error: any)`
   - Has file system operations that could be abstracted
   - Simple prompt template logic

2. `src/app/api/validate-medicine/route.ts` (56 lines)
   - Uses `catch (error: any)`
   - JSON parsing logic could be extracted
   - Simple validation logic

3. `src/app/api/summarize-reports/route.ts`
   - Uses `catch (error: any)`
   - Similar pattern to other summarize routes

4. `src/app/api/summarize-medical-history/route.ts`
   - Uses `catch (error: any)`
   - Duplicate pattern with summarize-reports

5. `src/app/api/summarize-inquiry/route.ts`
   - Uses `catch (error: any)`
   - Similar to other summarize routes

6. `src/app/api/heart-companion/route.ts`
   - Uses `catch (error: any)`
   - Moderate complexity

7. `src/app/api/generate-infographic/route.ts`
   - Uses `catch (error: any)`
   - Image generation logic

8. `src/app/api/migrate-music/route.ts`
   - Uses `catch (error: any)`
   - Migration script (could be moved to scripts/)

9. `src/app/api/migrate-medical-history/route.ts`
   - Uses `catch (error: any)`
   - Migration script (could be moved to scripts/)

10. `src/app/api/test-gemini/route.ts`
    - Uses `catch (error: any)`
    - Test route (should be in `/dev`)

11. `src/app/api/test-image/route.ts`
    - Uses `catch (error: any)`
    - Test route (should be in `/dev`)

12. `src/app/api/admin/settings/route.ts`
    - Uses `catch (error: any)`
    - Admin functionality

13. `src/app/api/admin/upload-apk/route.ts`
    - Uses `catch (error: any)`
    - File upload logic

14. `src/app/api/config/gemini-key/route.ts`
    - Uses `catch (error: any)`
    - Configuration management

15. `src/app/api/chat/route.ts`
    - Uses `catch (error: any)`
    - High-traffic route

16. `src/app/api/analyze-image/route.ts`
    - Uses `catch (error: any)`
    - High-traffic route

17. `src/app/api/analyze-audio/route.ts`
    - Uses `catch (error: any)`
    - High-traffic route

18. `src/app/api/report-chat/route.ts`
    - Uses `catch (error: any)`
    - High-traffic route

### Refactoring Pattern

**Before:**

```typescript
} catch (error: any) {
  devLog("error", "API/route", "Error message", { error });
  return NextResponse.json(
    { error: error.message || "Failed" },
    { status: 500 }
  );
}
```

**After:**

```typescript
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

} catch (error: unknown) {
  return createErrorResponse(error, "API/route");
}
```

**Benefits:**

- Consistent error handling
- Better type safety (`unknown` vs `any`)
- Reduced code duplication (~20 lines → 1 line per route)
- Centralized error response format

---

## 2. Duplicate Utility Functions

**Risk Level**: ⚠️ **Medium**  
**Impact**: Medium (affects maintainability)  
**Effort**: Low (1-2 hours)

### `extractString` Function Duplication

**Found in:**

1. `src/components/diagnosis/report/utils.ts` (web)
2. `sihat-tcm-mobile/screens/diagnosis/ResultsStep.js` (mobile)

**Issue**: Same function logic duplicated across web and mobile codebases.

**Refactoring:**

- Create shared utility: `src/lib/utils/data-extraction.ts`
- Export `extractString` with proper TypeScript types
- Update both web and mobile to use shared utility
- Consider creating a shared package if mobile uses TypeScript

**Code:**

```typescript
// src/lib/utils/data-extraction.ts
export function extractString(val: unknown, fallback: string = ""): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.primary_pattern) return String(obj.primary_pattern);
    if (obj.type) return String(obj.type);
    if (obj.summary) return String(obj.summary);
    return Object.entries(obj)
      .map(
        ([key, value]) =>
          `${key.replace(/_/g, " ")}: ${typeof value === "string" ? value : JSON.stringify(value)}`
      )
      .join("\n");
  }
  return String(val);
}
```

---

## 3. PDF Generation Utility

**Risk Level**: ⚠️ **Medium**  
**Impact**: Medium (affects report generation)  
**Effort**: Medium (2-3 hours)

### File: `src/components/diagnosis/report/utils.ts` (243 lines)

**Issues:**

- Large `downloadPDF` function (150+ lines)
- Mixed concerns: PDF generation, formatting, translations
- Hard to test individual parts
- `any` types used for data parameters

**Refactoring Strategy:**

```
src/components/diagnosis/report/
├── utils.ts (keep translations and small helpers)
├── pdf/
│   ├── pdfGenerator.ts (main PDF generation logic)
│   ├── pdfFormatter.ts (formatting helpers)
│   ├── pdfSections.ts (section builders)
│   └── types.ts (TypeScript interfaces)
```

**Benefits:**

- Better separation of concerns
- Easier to test
- Better type safety
- Reusable PDF section builders

---

## 4. AI Model Router - Performance Methods

**Risk Level**: ⚠️ **Medium**  
**Impact**: Low-Medium (internal tooling)  
**Effort**: Low (1-2 hours)

### File: `src/lib/aiModelRouter.ts` (576 lines)

**Issues:**

- `getRouterStats()` method uses `any[]` for `recentPerformance`
- Performance tracking logic could be extracted
- Some methods are quite long (50+ lines)

**Refactoring:**

- Extract performance tracking to separate class: `ModelPerformanceTracker`
- Create proper types for performance metrics
- Split large methods into smaller, focused methods

**Suggested Structure:**

```
src/lib/ai/
├── aiModelRouter.ts (main routing logic)
├── modelPerformanceTracker.ts (performance tracking)
└── types.ts (shared types)
```

---

## 5. Component Organization - Missing Index Files

**Risk Level**: ⚠️ **Low-Medium**  
**Impact**: Low (developer experience)  
**Effort**: Low (30 minutes per directory)

### Directories Needing Index Files

1. `src/components/diagnosis/` - 40+ files
2. `src/components/patient/` - 30+ files
3. `src/components/doctor/` - 20+ files
4. `src/components/admin/` - 10+ files
5. `src/components/ui/` - 15+ files

**Refactoring:**
Create `index.ts` files that export all public components:

```typescript
// src/components/diagnosis/index.ts
export { DiagnosisWizard } from "./DiagnosisWizard";
export { BasicInfoForm } from "./BasicInfoForm";
export { DiagnosisReport } from "./DiagnosisReport";
// ... all public exports
```

**Benefits:**

- Cleaner imports: `import { DiagnosisWizard } from "@/components/diagnosis"`
- Better tree-shaking
- Easier refactoring (change internal structure without breaking imports)

---

## 6. Lib Directory Organization

**Risk Level**: ⚠️ **Low-Medium**  
**Impact**: Low (developer experience)  
**Effort**: Medium (3-4 hours)

### Current State

- 68+ files in `src/lib/` root
- Some organization exists (`api/`, `translations/`, `monitoring/`)
- Many utility files scattered

### Files to Organize

**AI-related utilities** (should be in `lib/ai/`):

- `aiModelRouter.ts` (576 lines)
- `enhancedAIDiagnosticEngine.ts` (448 lines)
- `personalizationEngine.ts`
- `medicalSafetyValidator.ts`
- `modelFallback.ts`

**TCM-specific utilities** (should be in `lib/tcm/`):

- `tcm-utils.ts`
- `fiveElementsScoreCalculator.ts`
- `medicalHistoryParser.ts`
- `enhancedTonguePrompt.ts`

**General utilities** (should be in `lib/utils/`):

- `validations.ts`
- `errorUtils.ts`
- `healthMetrics.ts`
- `soundscapeUtils.ts`

**Constants** (should be in `lib/constants/`):

- `doctorLevels.ts`
- `systemPrompts.ts`

**Migration Strategy:**

1. Create new directories
2. Move files incrementally (one category at a time)
3. Update imports using find/replace
4. Test after each move
5. Commit after each successful move

---

## 7. Type Safety Improvements

**Risk Level**: ⚠️ **Medium**  
**Impact**: Medium (code quality)  
**Effort**: Low-Medium (2-3 hours)

### Files with `any` Types

1. **API Routes** (18 files) - Already covered in section 1
2. **PDF Utils** - `downloadPDF` function uses `any` for data parameters
3. **AI Model Router** - `getRouterStats()` uses `any[]` for performance data
4. **Component Props** - Some components may have loose types

**Action Items:**

- Replace `error: any` with `error: unknown` in API routes
- Create proper interfaces for PDF data
- Type performance metrics properly
- Audit component props for `any` types

---

## 8. Migration Scripts in API Routes

**Risk Level**: ⚠️ **Medium**  
**Impact**: Low (organization)  
**Effort**: Low (1 hour)

### Files to Move

1. `src/app/api/migrate-music/route.ts`
2. `src/app/api/migrate-medical-history/route.ts`

**Issue**: These are one-time migration scripts that shouldn't be API routes.

**Refactoring:**

- Move to `scripts/migrations/` directory
- Convert to standalone scripts (`.mjs` or `.ts`)
- Remove from API routes
- Document in migration guide

---

## 9. Test Routes in Production

**Risk Level**: ⚠️ **Low-Medium**  
**Impact**: Low (organization)  
**Effort**: Low (1 hour)

### Files to Move

1. `src/app/api/test-gemini/route.ts`
2. `src/app/api/test-image/route.ts`

**Refactoring:**

- Move to `src/app/(dev)/api/test-*/route.ts`
- Or convert to proper test files
- Add route group protection (optional)

---

## Priority Recommendations

### Week 1: Quick Wins (5-6 hours)

1. ✅ Migrate 4-6 API routes to use error middleware
2. ✅ Create component index files for major directories
3. ✅ Extract `extractString` to shared utility

### Week 2: Medium Effort (6-8 hours)

4. ✅ Migrate remaining API routes
5. ✅ Refactor PDF generation utility
6. ✅ Organize lib directory (AI utilities)

### Week 3: Polish (4-5 hours)

7. ✅ Move migration scripts out of API routes
8. ✅ Move test routes to `/dev`
9. ✅ Type safety improvements

---

## Success Metrics

- [ ] All API routes use consistent error handling
- [ ] No duplicate utility functions across codebases
- [ ] Component index files created for major directories
- [ ] Lib directory better organized
- [ ] Reduced `any` types in identified files
- [ ] Migration scripts moved to proper location

---

## Notes

- All refactorings are **backward compatible**
- Can be done incrementally
- Test after each change
- No breaking changes to functionality
- Focus on files that are frequently modified

**Last Updated**: January 2025  
**Status**: Ready for Implementation
