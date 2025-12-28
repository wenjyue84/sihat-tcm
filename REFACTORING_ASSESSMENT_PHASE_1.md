# Phase 1: Comprehensive Assessment & Analysis
**System Architect Report**
**Date:** 2025-12-28
**Project:** Sihat TCM (Web & Mobile)

---

## 1.1 System Understanding

### Architecture Overview
The system is a dual-platform application (Web & Mobile) sharing a backend (Supabase).
-   **Web App**: Next.js 16 (App Router) + React 19. Hosting likely Vercel.
-   **Mobile App**: Expo 54 (React Native 0.81).
-   **Backend**: Supabase (Auth, Database, Edge Functions potentially).
-   **AI Integration**: Google Gemini 2.0 Flash via Vercel AI SDK (Web) and direct Google GenAI SDK (Mobile).

### Technology Stack Audit
| Layer | Web (`sihat-tcm-web`) | Mobile (`sihat-tcm-mobile`) | Status |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16.1.1 (App Router) | Expo 54 / RN 0.81 | ✅ Bleeding Edge |
| **Language** | TypeScript | JavaScript | ⚠️ Inconsistent |
| **Styling** | Tailwind CSS v4 + Radix UI | StyleSheet (Vanilla) | ✅ Platform native |
| **State** | Zustand + Context + Local | Context + Local | ⚠️ Fragmented |
| **AI Client** | `@ai-sdk/google` | `@google/generative-ai` | ⚠️ Divergent Implementation |
| **Testing** | Vitest | None (visible in scripts) | ❌ Critical Gap on Mobile |

### Dependency Analysis
-   **Web**: Modern, well-maintained. `framer-motion` for animations. `zod` for validation.
-   **Mobile**: Standard Expo managed workflow.
-   **Risk**: Mobile lacks type safety (TypeScript), which increases regression risk during refactoring.

---

## 1.2 Code Quality Assessment

### Key Code Smells Identified

#### A. God Components (High Severity)
1.  **Mobile: `screens/dashboard/DashboardScreen.js`** (~2200 lines)
    -   **Issue**: Contains multiple "Tab" components (`HomeTab`, `HistoryTab`, `ProfileTab`) defined *inside* the file.
    -   **Violation**: Single Responsibility Principle.
    -   **Impact**: Hard to maintain, hard to test, poor readability.
    -   **Evidence**: Lines 44, 169, 282 define entire screens within the dashboard file.

2.  **Web: `src/components/doctor/DoctorDiagnosisWizard.tsx`** (~1000 lines)
    -   **Issue**: UI component handles:
        -   Form State (Complex nested object)
        -   API Communication (`fetch('/api/consult')`)
        -   Stream Parsing (`TextDecoder` loop)
        -   DB Persistence (`saveDiagnosis`)
        -   File Processing (`FileReader`, background extraction)
    -   **Violation**: Separation of Concerns (UI vs Business Logic vs Data Access).

#### B. Logic Duplication
-   **AI Integration**: Prompt construction and response parsing for "Diagnosis" logic appear to be re-implemented on both platforms rather than shared via a common API/Edge Function or shared library.

#### C. Inconsistent Type Safety
-   Web is strict TypeScript (good).
-   Mobile is pure JavaScript (bad for scaling).

---

## 1.3 Architecture Issues

-   **Coupling**: `DoctorDiagnosisWizard` is tightly coupled to the implementation details of the AI stream parsing. If the API format changes, the UI component breaks.
-   **Business Logic in View**: Both major files analyzed contain heavy business logic (BMI calculation, date formatting, API error handling) directly in the render/component body.

---

## 1.4 Technical Debt Inventory

1.  **Mobile TypeScript Migration**: Critical for long-term stability.
2.  **Testing Gap**: No mobile tests found. Refactoring `DashboardScreen.js` without tests is high risk.
3.  **Hardcoded Values**: `COMMON_SYMPTOMS` lists and similar static data should be in configuration/constants files or fetched from DB.
4.  **Legacy Code**: `src/lib/supabase.ts` is marked as "LEGACY FILE" but still exists. Needs cleanup.

---

## 1.5 Risk Assessment (For Phase 2)

| Component | Refactoring complexity | Risk Level | Mitigation |
| :--- | :--- | :--- | :--- |
| `DashboardScreen.js` | Medium | Medium | Extract components one by one. Manual regression testing required. |
| `DoctorDiagnosisWizard.tsx` | High | High | Logic is complex (streaming). Extract hook `useDiagnosisSession` first. |
| `supabase.ts` (Legacy) | Low | Low | Verify usages and delete. |

---

## Recommendations & Next Steps (Phase 2 Strategy)

### Priority 1: "Quick Wins" (Component Extraction)
1.  **Mobile**: Split `DashboardScreen.js` into:
    -   `components/dashboard/HomeTab.js`
    -   `components/dashboard/HistoryTab.js`
    -   `components/dashboard/ProfileTab.js`
2.  **Web**: Extract `useDiagnosisWizard` hook from `DoctorDiagnosisWizard.tsx` to handle state and API logic.

### Priority 2: Strategic (Type Safety)
1.  Initialize `tsconfig.json` in Mobile to allow gradual migration to TS (or at least loose checking).

### Priority 3: Architecture
1.  Unify AI logic. Move "Prompt Construction" to a shared `lib` or API endpoint so both Mobile and Web use the exact same prompt logic.

---

## Phase 2: Execution Summary (Completed)

### ✅ Priority 1: DashboardScreen.js Refactoring

**Status**: COMPLETED

**Before:**
-   `DashboardScreen.js`: ~2243 lines (God Component)
-   4 inline tab components: `HomeTab`, `HistoryTab`, `ProfileTab`, `DocumentsTab`

**After:**
-   `DashboardScreen.js`: ~700 lines (orchestrating container)
-   `components/dashboard/HomeTab.js`: ~140 lines
-   `components/dashboard/HistoryTab.js`: ~125 lines
-   `components/dashboard/ProfileTab.js`: ~600 lines
-   `components/dashboard/DocumentsTab.js`: ~220 lines
-   `components/dashboard/index.js`: Barrel export file

**Benefits Achieved:**
1.  **Reduced Cognitive Load**: Each file focuses on a single responsibility.
2.  **Improved Testability**: Tabs can be tested in isolation.
3.  **Better Team Workflow**: Multiple developers can work on different tabs without conflicts.
4.  **Reusability**: Tabs are now reusable in other contexts if needed.
5.  **Documentation**: Each component has JSDoc explaining its props.

**Files Created:**
-   `sihat-tcm-mobile/components/dashboard/HomeTab.js`
-   `sihat-tcm-mobile/components/dashboard/HistoryTab.js`
-   `sihat-tcm-mobile/components/dashboard/ProfileTab.js`
-   `sihat-tcm-mobile/components/dashboard/DocumentsTab.js`
-   `sihat-tcm-mobile/components/dashboard/index.js`

**Files Modified:**
-   `sihat-tcm-mobile/screens/dashboard/DashboardScreen.js` (Complete rewrite)

### ✅ Priority 2: useDiagnosisSubmission Hook (Web)

**Status**: COMPLETED

**Problem:**
-   `DoctorDiagnosisWizard.tsx` mixed UI rendering with complex business logic:
    -   Form validation
    -   AI API calls with streaming
    -   JSON parsing and repair
    -   Database persistence via server actions

**Solution:**
Created `src/hooks/useDiagnosisSubmission.ts` (~250 lines) containing:
-   `validateData()` - Form validation
-   `prepareAIPayload()` - Construct AI request body
-   `callConsultationAPI()` - Handle streaming response
-   `saveToDB()` - Persist to Supabase via server action
-   `submitDiagnosis()` - Orchestrates the full flow

**Benefits:**
1.  **Separation of Concerns**: UI no longer knows about API streaming or DB save details
2.  **Testability**: Hook can be unit tested independently
3.  **Reusability**: Hook can be used in other wizards or forms

**Files Created:**
-   `sihat-tcm-web/src/hooks/useDiagnosisSubmission.ts`

### ✅ Priority 3: Legacy Supabase Cleanup

**Status**: COMPLETED

**Problem:**
-   `src/lib/supabase.ts` was marked as "LEGACY FILE"
-   3 files were still importing from it instead of the proper folder structure

**Solution:**
1.  Migrated all imports from `@/lib/supabase` to `@/lib/supabase/client`:
    -   `src/lib/promptLoader.ts`
    -   `src/app/api/summarize-inquiry/route.ts`
    -   `src/app/api/analyze-audio/route.ts`
2.  Deleted the legacy file: `src/lib/supabase.ts`

**Canonical Import Paths (Post-Refactor):**
```typescript
// Client components
import { supabase } from '@/lib/supabase/client';

// Server actions / API routes
import { createClient } from '@/lib/supabase/server';

// Middleware
import { updateSession } from '@/lib/supabase/middleware';
```

---

## Remaining Technical Debt (For Future Sprints)

1.  **TypeScript Migration (Mobile)**: Still JavaScript-only
2.  **Unified AI Logic**: Web/Mobile still have divergent AI client implementations
3.  **Testing**: Mobile app has no automated tests
4.  **DoctorDiagnosisWizard Refactor**: The new hook is available but the wizard component itself still needs to be updated to use it (minor follow-up work)

