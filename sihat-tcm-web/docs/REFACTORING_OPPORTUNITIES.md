# Refactoring Opportunities Analysis

**Date**: January 2025  
**Status**: Comprehensive Analysis - Ready for Implementation

## Executive Summary

Your web app has **significant refactoring opportunities** across multiple areas. While some infrastructure has been created (API middleware), it's **not being used yet**. Here's what can be improved:

### Quick Wins (Can Do Today)

- ✅ **18 API routes** still use `catch (error: any)` - can use existing middleware
- ✅ **19 test pages** in production - should move to `/dev` route group
- ✅ **0 routes** using `createErrorResponse` - middleware exists but unused
- ✅ **Component index files** missing - cleaner imports needed

### Medium Effort (This Week)

- 🔄 **Large files** need splitting (3 files >1000 lines)
- 🔄 **Component organization** - create index files
- 🔄 **Lib directory** - better organization

### Long Term (This Month)

- 📋 **Context consolidation** - 7 contexts may overlap
- 📋 **Type safety improvements** - eliminate remaining `any` types
- 📋 **Test infrastructure** - proper test organization

---

## 1. API Route Refactoring (HIGH PRIORITY)

### Current State

- ✅ **Middleware created**: `src/lib/api/middleware/error-handler.ts` exists
- ❌ **Not being used**: 0 routes use `createErrorResponse`
- ❌ **18 routes** still use `catch (error: any)` pattern
- ❌ **45 API routes** total - all need standardization

### Files Needing Refactoring

#### Routes with `catch (error: any)` (18 files):

1. `src/app/api/chat/route.ts`
2. `src/app/api/analyze-image/route.ts`
3. `src/app/api/analyze-audio/route.ts`
4. `src/app/api/report-chat/route.ts`
5. `src/app/api/heart-companion/route.ts`
6. `src/app/api/summarize-reports/route.ts`
7. `src/app/api/summarize-medical-history/route.ts`
8. `src/app/api/migrate-music/route.ts`
9. `src/app/api/migrate-medical-history/route.ts`
10. `src/app/api/test-gemini/route.ts`
11. `src/app/api/admin/settings/route.ts`
12. `src/app/api/validate-medicine/route.ts`
13. `src/app/api/test-image/route.ts`
14. `src/app/api/summarize-inquiry/route.ts`
15. `src/app/api/generate-infographic/route.ts`
16. `src/app/api/config/gemini-key/route.ts`
17. `src/app/api/ask-dietary-advice/route.ts`
18. `src/app/api/admin/upload-apk/route.ts`

### Refactoring Pattern

**Before:**

```typescript
} catch (error: any) {
  devLog("error", "API/chat", "Request error", { error });
  const { userFriendlyError, errorCode } = parseApiError(error);
  return new Response(
    JSON.stringify({
      error: userFriendlyError,
      code: errorCode,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    }),
    {
      status: 500,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/json",
      },
    }
  );
}
```

**After:**

```typescript
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

} catch (error: unknown) {
  return createErrorResponse(error, "API/chat");
}
```

**Impact**:

- Reduces ~20 lines to 1 line per route
- 18 routes × ~20 lines = **~360 lines of code eliminated**
- Better type safety (`unknown` instead of `any`)
- Consistent error handling across all routes

### Implementation Plan

1. **Phase 1** (2 hours): Migrate 4 high-traffic routes
   - `chat/route.ts`
   - `analyze-image/route.ts`
   - `analyze-audio/route.ts`
   - `report-chat/route.ts`

2. **Phase 2** (3 hours): Migrate remaining 14 routes
   - Test each route after migration
   - Verify error responses are consistent

3. **Phase 3** (1 hour): Create OPTIONS handler utility
   - Extract common CORS OPTIONS pattern
   - Use in all routes

---

## 2. Test Routes Cleanup (MEDIUM PRIORITY)

### Current State

- ❌ **19 test pages** in production routes
- ❌ Located in `src/app/test-*/page.tsx`
- ❌ Should be in `src/app/(dev)/test-*/page.tsx`

### Test Pages to Move

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
18. `test-runner/page.tsx` (3232 lines!)
19. `test-welcome-sheet/page.tsx`

### Implementation

1. Create `src/app/(dev)/` directory
2. Move all test pages
3. Update any internal links/references
4. Add route group protection (optional - require dev mode)

**Impact**: Cleaner production code structure, better organization

---

## 3. Large File Splitting (HIGH PRIORITY)

### Files Over 1000 Lines

#### 1. `src/app/developer/page.tsx` - **1657 lines**

**Issues**:

- Massive component with multiple concerns
- Mixing UI, state, and logic
- Hard to maintain and test

**Refactoring Strategy**:

```
src/app/developer/
├── page.tsx (main orchestrator, ~200 lines)
├── components/
│   ├── SystemInfoCard.tsx
│   ├── DatabaseStatusCard.tsx
│   ├── DeploymentStatusCard.tsx
│   ├── UpdatesTimeline.tsx
│   ├── DeveloperMenu.tsx
│   └── MobileMenu.tsx
└── hooks/
    ├── useSystemInfo.ts
    ├── useDatabaseStatus.ts
    └── useDeploymentStatus.ts
```

#### 2. `src/components/patient/UnifiedDashboard.tsx` - **1367 lines**

**Issues**:

- Too many responsibilities
- Complex state management
- Many imported sub-components already exist

**Refactoring Strategy**:

```
src/components/patient/
├── UnifiedDashboard.tsx (main, ~300 lines)
├── sections/
│   ├── ProfileSection.tsx
│   ├── DocumentsSection.tsx
│   ├── HealthJourneySection.tsx
│   ├── MealPlannerSection.tsx
│   └── SettingsSection.tsx
└── hooks/
    ├── usePatientDashboard.ts
    ├── useProfileManagement.ts
    └── useDocumentManagement.ts
```

#### 3. `src/hooks/useDiagnosisWizard.ts` - **834 lines**

**Issues**:

- Very large hook
- Multiple concerns mixed
- Hard to test individual parts

**Refactoring Strategy**:

```
src/hooks/diagnosis/
├── useDiagnosisWizard.ts (main orchestrator, ~200 lines)
├── useDiagnosisState.ts
├── useDiagnosisNavigation.ts
├── useImageAnalysis.ts
├── useConsultationSubmission.ts
└── utils/
    ├── reportGenerator.ts
    ├── scoreCalculator.ts
    └── jsonRepair.ts
```

#### 4. `src/app/test-runner/page.tsx` - **3232 lines** ⚠️

**Issues**:

- Extremely large test page
- Should be split or moved to proper test infrastructure

**Recommendation**:

- Move to `(dev)/test-runner/`
- Split into multiple test suites
- Consider using proper testing framework instead

---

## 4. Component Organization (MEDIUM PRIORITY)

### Missing Index Files

Create `index.ts` files for cleaner imports:

#### Priority 1: Major Component Directories

```
src/components/
├── diagnosis/
│   └── index.ts  ← Create this
├── patient/
│   └── index.ts  ← Create this
├── doctor/
│   └── index.ts  ← Create this
├── admin/
│   └── index.ts  ← Create this
└── ui/
    └── index.ts  ← Create this
```

**Example `diagnosis/index.ts`:**

```typescript
export { DiagnosisWizard } from "./DiagnosisWizard";
export { BasicInfoForm } from "./BasicInfoForm";
export { InquiryWizard } from "./InquiryWizard";
export { DiagnosisReport } from "./DiagnosisReport";
// ... all exports
```

**Benefits**:

- Cleaner imports: `import { DiagnosisWizard } from "@/components/diagnosis"`
- Better tree-shaking
- Easier refactoring (change internal structure without breaking imports)

---

## 5. Lib Directory Organization (LOW PRIORITY)

### Current State

- 68+ files in `src/lib/`
- Some organization exists (`api/`, `supabase/`, `translations/`)
- Many utility files in root

### Proposed Structure

```
src/lib/
├── api/              ✅ Already organized
├── supabase/         ✅ Already organized
├── translations/     ✅ Already organized
├── tcm/              ← New: TCM-specific utilities
│   ├── tcm-utils.ts
│   ├── fiveElementsScoreCalculator.ts
│   ├── medicalHistoryParser.ts
│   └── enhancedTonguePrompt.ts
├── ai/               ← New: AI-related utilities
│   ├── aiModelRouter.ts
│   ├── enhancedAIDiagnosticEngine.ts
│   ├── personalizationEngine.ts
│   ├── medicalSafetyValidator.ts
│   └── modelFallback.ts
├── utils/            ← New: General utilities
│   ├── utils.ts
│   ├── validations.ts
│   ├── errorUtils.ts
│   └── healthMetrics.ts
├── constants/        ← New: Constants and configs
│   ├── doctorLevels.ts
│   ├── systemPrompts.ts
│   └── daily-tips.ts
└── monitoring/       ✅ Already organized
```

**Migration Strategy**:

1. Create new directories
2. Move files incrementally
3. Update imports (use find/replace)
4. Test after each move

---

## 6. Type Safety Improvements (MEDIUM PRIORITY)

### Current Issues

1. **18 API routes** use `catch (error: any)`
2. **Some components** may have `any` types
3. **State management** might have loose types

### Action Items

1. Replace all `error: any` with `error: unknown` (covered in API refactoring)
2. Audit components for `any` types
3. Strengthen type definitions in `types/` directory

---

## 7. Context Consolidation (LOW PRIORITY)

### Current Contexts (7 total)

1. `AuthContext.tsx`
2. `DeveloperContext.tsx`
3. `LanguageContext.tsx`
4. `DiagnosisProgressContext.tsx`
5. `DoctorContext.tsx`
6. `OnboardingContext.tsx`
7. `AccessibilityContext.tsx`

### Analysis Needed

- Check for overlapping concerns
- Consider combining related contexts
- Evaluate if all contexts are necessary

**Note**: This requires careful analysis to avoid breaking changes.

---

## Implementation Priority

### Week 1: Quick Wins

1. ✅ Migrate 4 API routes to use error middleware (2 hours)
2. ✅ Move test routes to `(dev)` group (1 hour)
3. ✅ Create component index files (2 hours)

**Total**: ~5 hours, **~400 lines eliminated**

### Week 2: Medium Effort

1. ✅ Migrate remaining 14 API routes (3 hours)
2. ✅ Split `UnifiedDashboard.tsx` (4 hours)
3. ✅ Split `useDiagnosisWizard.ts` (4 hours)

**Total**: ~11 hours, **better maintainability**

### Week 3-4: Larger Refactors

1. ✅ Split `developer/page.tsx` (6 hours)
2. ✅ Organize lib directory (4 hours)
3. ✅ Type safety audit (4 hours)

**Total**: ~14 hours, **comprehensive improvements**

---

## Success Metrics

### Code Quality

- [ ] API route code reduced by 40%+ (less duplication)
- [ ] All routes use consistent error handling
- [ ] No files over 1000 lines
- [ ] Component index files created

### Developer Experience

- [ ] New routes can be added in <30 minutes
- [ ] Code review time reduced
- [ ] Easier to find and understand code

### Maintainability

- [ ] Changes to error handling affect all routes automatically
- [ ] Clear file organization
- [ ] Better type safety

---

## Next Steps

1. **Review** this document
2. **Prioritize** which refactorings to tackle first
3. **Start** with API route migration (highest impact, lowest risk)
4. **Test** after each change
5. **Document** as you go

---

## Notes

- All refactorings are **backward compatible**
- Can be done incrementally
- Test after each change
- No breaking changes to functionality

**Last Updated**: January 2025  
**Status**: Ready for Implementation
