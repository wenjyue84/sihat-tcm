# Sihat TCM Refactoring Guide

**Version**: 1.0  
**Last Updated**: December 2024

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Refactoring Principles](#refactoring-principles)
4. [Quick Wins](#quick-wins)
5. [Phase-by-Phase Plan](#phase-by-phase-plan)
6. [Migration Examples](#migration-examples)
7. [Success Metrics](#success-metrics)

---

## Overview

**Goal**: Transform the codebase into a maintainable, scalable system that's easier to extend with new features.

### What's Been Done

1. **Comprehensive Refactoring Plan** - Complete 6-week phased plan
2. **API Middleware Layer** (Phase 1 - Started)
   - Created `src/lib/api/middleware/` with error handling and validation utilities
   - Key utilities: `createErrorResponse()`, `validateRequestBody()`, `createStreamResponse()`

---

## Current State Analysis

### Codebase Metrics

- **API Routes**: 30+ routes with duplicated patterns
- **Components**: 196 files (some duplication likely)
- **Lib Files**: 68 files (needs better organization)
- **Contexts**: 7 contexts (potential for consolidation)
- **Test Routes**: 15+ test pages (should be cleaned up)

### Identified Pain Points

1. **API Route Duplication**
   - Repeated error handling patterns
   - Duplicated CORS header logic
   - Similar validation patterns
   - Inconsistent Supabase client creation

2. **Component Organization**
   - Large flat structure (196 files)
   - Feature-based organization exists but inconsistent
   - Some components may be duplicated

3. **Lib Directory Structure**
   - 68 files in root `lib/` directory
   - Some subdirectories exist but not comprehensive
   - Utility functions scattered

4. **Type Safety**
   - Types exist but may not be comprehensive
   - Some `any` types in error handling

5. **Test Infrastructure**
   - Many test routes in production code
   - Should be moved to proper test files

---

## Refactoring Principles

1. **Safety First**: Incremental changes with backward compatibility
2. **No Breaking Changes**: Maintain existing functionality
3. **Test as You Go**: Verify after each phase
4. **Documentation**: Update docs alongside code changes
5. **Feature Parity**: All existing features must continue working

---

## Quick Wins

### Can Do Right Now (30 minutes - 2 hours each)

#### 1. Fix Error Type Safety (30 min)
**Files**: All API routes with `catch (error: any)`

**Change**:
```typescript
// Before
catch (error: any) {

// After  
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
```

**Impact**: Better type safety, ~20 files

#### 2. Use Existing Error Handler (1 hour)
**Files**: `chat/route.ts`, `heart-companion/route.ts`, `analyze-image/route.ts`, `western-chat/route.ts`

**Change**:
```typescript
// Before
catch (error: any) {
  devLog("error", "API/chat", "Request error", { error });
  const { userFriendlyError, errorCode } = parseApiError(error);
  return new Response(JSON.stringify({...}), {...});
}

// After
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

catch (error: unknown) {
  return createErrorResponse(error, "API/chat");
}
```

**Impact**: 4 routes, ~60 lines saved per route

#### 3. Create Component Index Files (2 hours)
**Files**: Create `index.ts` in major component directories

**Example**:
```typescript
// components/diagnosis/index.ts
export { DiagnosisWizard } from "./DiagnosisWizard";
export { BasicInfoForm } from "./BasicInfoForm";
export { InquiryWizard } from "./InquiryWizard";
```

**Directories to create**:
- `components/diagnosis/index.ts`
- `components/patient/index.ts`
- `components/doctor/index.ts`
- `components/ui/index.ts`

**Impact**: Cleaner imports, better tree-shaking

#### 4. Move Test Routes (1 hour)
**Action**: Move test routes to `/dev` route group

**Files to move**:
- `app/test-chat/page.tsx` → `app/(dev)/test-chat/page.tsx`
- `app/test-gemini/page.tsx` → `app/(dev)/test-gemini/page.tsx`
- And 10+ more...

**Impact**: Cleaner production code structure

#### 5. Extract Shared OPTIONS Handler (30 min)
**Create**: `src/lib/api/middleware/cors-handler.ts`

```typescript
export function createOptionsHandler() {
  return async (req: Request) => {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  };
}
```

**Usage**: Replace 15+ OPTIONS handlers with this

---

## Phase-by-Phase Plan

### Phase 1: API Route Standardization (Week 1-2)

**Goal**: Extract common patterns into reusable middleware and utilities.

#### 1.1 Create API Middleware Layer

**New Structure**:
```
src/lib/api/
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   ├── cors.ts          # CORS handler
│   ├── error-handler.ts # Centralized error handling ✅
│   ├── rate-limit.ts    # Rate limiting
│   └── validator.ts     # Request validation wrapper ✅
├── handlers/
│   ├── stream-handler.ts # AI streaming response handler ✅
│   └── response-handler.ts # Standard response formatter
└── types/
    └── api.ts           # API-specific types
```

**Benefits**:
- Reduce code duplication by ~60%
- Consistent error handling
- Easier to add new routes
- Better type safety

**Migration Strategy**:
1. Create middleware utilities (non-breaking) ✅
2. Update one route at a time (chat, consult, analyze-image)
3. Test each route after migration
4. Gradually migrate remaining routes

### Phase 2: Lib Directory Reorganization (Week 3-4)

**Goal**: Organize utility functions into logical directories.

**New Structure**:
```
src/lib/
├── api/              # API utilities (already started)
├── tcm/              # TCM-specific utilities
├── utils/            # General utilities
├── validation/       # Validation schemas
└── constants/        # Constants and configs
```

### Phase 3: Component Organization (Week 5-6)

**Goal**: Improve component structure and reduce duplication.

**Actions**:
- Create component index files
- Move test routes to `/dev` group
- Split large components (UnifiedDashboard, useDiagnosisWizard)
- Extract shared hooks

---

## Migration Examples

### Example: Migrating API Route Error Handling

#### Before: Original Route

```typescript
// src/app/api/chat/route.ts (BEFORE)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ... handler logic ...
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
}
```

#### After: Using Middleware

```typescript
// src/app/api/chat/route.ts (AFTER)
import { createErrorResponse } from "@/lib/api/middleware/error-handler";
import { validateRequestBody } from "@/lib/api/middleware/request-validator";

export async function POST(req: Request) {
  try {
    const body = await validateRequestBody(req, chatRequestSchema);
    // ... handler logic ...
  } catch (error: unknown) {
    return createErrorResponse(error, "API/chat");
  }
}
```

**Benefits**:
- Reduced from ~20 lines to 1 line for error handling
- Consistent error format across all routes
- Better type safety
- Easier to maintain

---

## Success Metrics

### Code Quality

- [ ] API route code reduced by 40%+ (less duplication)
- [ ] All routes use consistent error handling
- [ ] New routes can be added in <30 minutes

### Developer Experience

- [ ] New developers can find code easily
- [ ] Code review time reduced
- [ ] Fewer bugs from inconsistent patterns

### Maintainability

- [ ] Changes to error handling affect all routes automatically
- [ ] Clear file organization
- [ ] Comprehensive documentation

---

## Next Steps

### Immediate (This Week)

1. **Review** refactoring plan with team
2. **Test** the new API middleware on one route
3. **Decide** which phase to prioritize

### Short Term (Next 2 Weeks)

1. **Phase 1**: Complete API middleware migration
   - Migrate 2-3 routes as proof of concept
   - Test thoroughly
   - Gradually migrate remaining routes

2. **Phase 2**: Start lib directory reorganization
   - Create new directory structure
   - Move files incrementally
   - Update imports

### Medium Term (Next Month)

1. **Phase 3**: Component organization
2. **Phase 4**: Context consolidation
3. **Phase 5**: Cleanup and standards

---

## Important Notes

### Safety First

- ✅ All changes are **backward compatible**
- ✅ Old code continues to work
- ✅ Migrate incrementally, test after each change
- ✅ Keep old code until new code is verified

### Migration Strategy

1. **Create new utilities** (done ✅)
2. **Test on one route** (next step)
3. **Migrate similar routes** in batches
4. **Remove old patterns** only after all routes migrated

### Don't Rush

- Take time to test each migration
- Review code changes carefully
- Update documentation as you go
- Get team feedback

---

**Last Updated**: December 2024  
**Status**: Phase 1 Started - API Middleware Created  
**Next Milestone**: Migrate first route to use new middleware


