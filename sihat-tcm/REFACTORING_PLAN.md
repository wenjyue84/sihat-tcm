# Sihat TCM - Codebase Refactoring Plan

> **Goal**: Transform a "vibe coding" codebase into a maintainable, scalable system that's easier to extend with new features.

## 📊 Current State Analysis

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

## 🎯 Refactoring Principles

1. **Safety First**: Incremental changes with backward compatibility
2. **No Breaking Changes**: Maintain existing functionality
3. **Test as You Go**: Verify after each phase
4. **Documentation**: Update docs alongside code changes
5. **Feature Parity**: All existing features must continue working

---

## 📋 Phase-by-Phase Plan

### **Phase 1: API Route Standardization** (Week 1-2)

**Goal**: Extract common patterns into reusable middleware and utilities.

#### 1.1 Create API Middleware Layer

**New Structure:**

```
src/lib/api/
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   ├── cors.ts          # CORS handler (enhance existing)
│   ├── error-handler.ts # Centralized error handling
│   ├── rate-limit.ts    # Rate limiting
│   └── validator.ts     # Request validation wrapper
├── handlers/
│   ├── stream-handler.ts # AI streaming response handler
│   └── response-handler.ts # Standard response formatter
└── types/
    └── api.ts           # API-specific types
```

**Benefits:**

- Reduce code duplication by ~60%
- Consistent error handling
- Easier to add new routes
- Better type safety

**Migration Strategy:**

1. Create middleware utilities (non-breaking)
2. Update one route at a time (chat, consult, analyze-image)
3. Test each route after migration
4. Gradually migrate remaining routes

#### 1.2 Create Route Base Classes/Utilities

**Example Pattern:**

```typescript
// src/lib/api/handlers/base-handler.ts
export class BaseApiHandler {
  protected async handleRequest(
    req: Request,
    handler: (body: any) => Promise<Response>
  ): Promise<Response> {
    try {
      // Common validation, auth, CORS
      const body = await req.json();
      return await handler(body);
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected handleError(error: unknown): Response {
    // Centralized error handling
  }
}
```

#### 1.3 Group Related Routes

**New Structure:**

```
src/app/api/
├── ai/              # AI-related routes
│   ├── chat/
│   ├── consult/
│   ├── analyze-image/
│   └── analyze-audio/
├── patient/         # Patient data routes
│   ├── history/
│   └── reports/
├── admin/           # Admin routes (already exists)
└── health/          # Health check routes
```

---

### **Phase 2: Lib Directory Reorganization** (Week 2-3)

**Goal**: Organize utilities into feature-based modules.

#### 2.1 New Structure

```
src/lib/
├── ai/                    # AI-related utilities
│   ├── providers/
│   │   ├── google.ts
│   │   └── anthropic.ts   # For Claude migration
│   ├── prompts/
│   │   ├── loader.ts
│   │   └── system-prompts.ts
│   ├── fallback.ts
│   └── router.ts
├── database/              # Database utilities
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   └── migrations/
├── validation/            # Validation utilities
│   ├── schemas.ts
│   ├── validators.ts
│   └── error-formatter.ts
├── monitoring/            # Already exists, keep
├── translations/          # Already exists, keep
├── testing/               # Already exists, keep
└── utils/                 # General utilities
    ├── error-utils.ts
    ├── logger.ts
    └── cors.ts
```

#### 2.2 Migration Steps

1. Create new directory structure
2. Move files incrementally
3. Update imports (use find/replace carefully)
4. Run tests after each move

---

### **Phase 3: Component Organization** (Week 3-4)

**Goal**: Better component structure with clear feature boundaries.

#### 3.1 Current vs. Proposed Structure

**Current:**

```
components/
├── diagnosis/        # 98 files (too large)
├── patient/          # 18 files
├── meal-planner/     # 7 files
└── ui/              # 41 files
```

**Proposed:**

```
components/
├── features/         # Feature-based components
│   ├── diagnosis/
│   │   ├── wizard/
│   │   ├── steps/
│   │   ├── analysis/
│   │   └── report/
│   ├── patient/
│   │   ├── dashboard/
│   │   ├── history/
│   │   └── profile/
│   ├── meal-planner/
│   └── qi-dose/
├── shared/           # Shared components
│   ├── layout/
│   ├── forms/
│   └── feedback/
└── ui/               # Base UI components (keep as-is)
```

#### 3.2 Component Audit

1. **Identify Duplicates**
   - Search for similar component names
   - Check for duplicated logic
   - Consolidate where possible

2. **Extract Shared Logic**
   - Create custom hooks for common patterns
   - Extract shared utilities

3. **Create Component Index Files**
   ```typescript
   // components/features/diagnosis/index.ts
   export { DiagnosisWizard } from "./wizard/DiagnosisWizard";
   export { InquiryStep } from "./steps/InquiryStep";
   // ... etc
   ```

---

### **Phase 4: Context & State Management** (Week 4)

**Goal**: Consolidate contexts and improve state management.

#### 4.1 Context Audit

**Current Contexts:**

- `AuthContext`
- `DoctorContext`
- `LanguageContext`
- `OnboardingContext`
- `DiagnosisProgressContext`
- `AccessibilityContext`
- `DeveloperContext`

**Analysis:**

- Some contexts may be combinable
- Consider Zustand for complex state (already in dependencies)
- Keep contexts that are truly global

#### 4.2 Proposed Structure

```
src/contexts/
├── AuthContext.tsx        # Keep (core)
├── LanguageContext.tsx    # Keep (core)
├── AppContext.tsx         # New: Combine non-critical contexts
└── providers.tsx         # Centralized provider composition
```

---

### **Phase 5: Cleanup & Standards** (Week 5)

#### 5.1 Remove Test Routes

**Action:**

- Move test pages to `/test` or `/dev` route group
- Or remove if no longer needed
- Keep only essential test utilities

**Routes to Clean:**

- `/test-chat`
- `/test-gemini`
- `/test-image`
- `/test-report`
- `/test-runner`
- etc.

#### 5.2 Establish Coding Standards

**Create:**

- `.eslintrc` rules (enhance existing)
- TypeScript strict mode configuration
- Component naming conventions
- File structure guidelines
- PR template with checklist

#### 5.3 Documentation

**Update:**

- `DEVELOPER_MANUAL.md` with new structure
- API documentation
- Component documentation
- Migration guides

---

## 🔄 Migration Strategy (Safe & Incremental)

### Step 1: Create New Structure (Non-Breaking)

- Create new directories
- Add new utilities alongside old ones
- No changes to existing code

### Step 2: Migrate One Route/Module at a Time

- Start with least-used routes
- Test thoroughly after each migration
- Keep old code until new code is verified

### Step 3: Update Imports Gradually

- Use find/replace with caution
- Update imports in batches
- Test after each batch

### Step 4: Remove Old Code

- Only after all imports updated
- Only after thorough testing
- Keep in git history for safety

---

## 📊 Success Metrics

### Code Quality

- [ ] Reduce API route code duplication by 60%+
- [ ] Organize lib directory into <10 feature modules
- [ ] Component structure follows feature boundaries
- [ ] Zero breaking changes to existing functionality

### Maintainability

- [ ] New routes can be added in <30 minutes
- [ ] New features follow established patterns
- [ ] Code review time reduced by 40%
- [ ] Onboarding time for new developers reduced

### Developer Experience

- [ ] Clear file organization
- [ ] Comprehensive documentation
- [ ] Consistent patterns across codebase
- [ ] Easy to find and modify code

---

## 🚨 Risk Mitigation

### Risks

1. **Breaking Changes**: Mitigated by incremental migration
2. **Import Errors**: Mitigated by careful find/replace
3. **Lost Functionality**: Mitigated by thorough testing
4. **Team Confusion**: Mitigated by documentation

### Safety Measures

1. **Git Branches**: One branch per phase
2. **Feature Flags**: Use flags for new patterns
3. **Rollback Plan**: Keep old code until verified
4. **Testing**: Test after each change
5. **Code Review**: Review all migrations

---

## 📅 Timeline

| Phase                           | Duration | Priority | Risk Level |
| ------------------------------- | -------- | -------- | ---------- |
| Phase 1: API Standardization    | 2 weeks  | High     | Low        |
| Phase 2: Lib Reorganization     | 1 week   | High     | Medium     |
| Phase 3: Component Organization | 1 week   | Medium   | Medium     |
| Phase 4: Context Consolidation  | 1 week   | Low      | Low        |
| Phase 5: Cleanup & Standards    | 1 week   | Medium   | Low        |

**Total Estimated Time**: 6 weeks

---

## 🎯 Quick Wins (Do First)

These can be done immediately with minimal risk:

1. **Extract API Error Handler** (2 hours)
   - Create `src/lib/api/middleware/error-handler.ts`
   - Use in 2-3 routes to validate pattern
   - Gradually expand

2. **Create Route Grouping** (1 hour)
   - Move related routes into subdirectories
   - Update imports
   - No code changes needed

3. **Component Index Files** (2 hours)
   - Create index.ts files for major components
   - Improve import paths
   - Better tree-shaking

4. **Remove Unused Test Routes** (1 hour)
   - Identify unused test pages
   - Move to `/dev` or remove
   - Update navigation if needed

---

## 📝 Next Steps

1. **Review this plan** with team
2. **Prioritize phases** based on current needs
3. **Start with Quick Wins** for immediate impact
4. **Begin Phase 1** with API middleware extraction
5. **Track progress** in this document

---

## 🔗 Related Documents

- `DEVELOPER_MANUAL.md` - Current developer guide
- `SYSTEM_ARCHITECTURE.md` - System architecture
- `claude.md` - Claude integration guide

---

**Last Updated**: 2025-01-XX
**Status**: Planning Phase
**Owner**: Development Team
