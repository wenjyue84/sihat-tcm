# Fix: Gender Selection & Profile Seeding in Diagnosis Wizard

**Date:** 2025-12-26
**Issue:** Patient's "Gender" and other profile information were not pre-filling in the "New Diagnosis" form, even when logged in.

## Root Causes

1.  **Race Condition (Main Issue)**:
    -   The `useEffect` hook responsible for seeding profile data was combined with the persistence check logic.
    -   The effect would exit early if `hasCheckedPersistence` was true.
    -   Since `profile` data from `useAuth` loads asynchronously, it often arrived *after* the initial persistence check had already set `hasCheckedPersistence` to true.
    -   Result: The code block to seed `basic_info` from `profile` was permanently skipped.

2.  **Case Sensitivity Mismatch**:
    -   The `profiles` table in Supabase often stores gender as "Male" or "Female" (capitalized).
    -   The `Select` component in `BasicInfoForm` expects strict lowercase values: "male" or "female".
    -   Result: Even if data was present, the UI showed "Select..." because "Male" !== "male".

## The Fix

### 1. `src/hooks/useDiagnosisWizard.ts`

-   **Split Initialization Effects**: Separated the logic into two distinct `useEffect` hooks:
    1.  **Effect 1**: Runs **only on mount**. Checks `localStorage` for saved progress and sets `hasCheckedPersistence`.
    2.  **Effect 2**: Runs whenever `profile` or `hasCheckedPersistence` changes. Properly seeds `data.basic_info` if:
        -   Persistence check is done (`hasCheckedPersistence` is true).
        -   `profile` is available.
        -   Form is currently empty (`!data.basic_info`).
        -   No pending resumed session exists.

-   **Data Normalization**: Added `.toLowerCase()` to the gender field during seeding.

```typescript
// Fixed Code Snippet
// 2. Seed Data from Profile (runs when profile loads, if no saved state found/resumed)
useEffect(() => {
    if (hasCheckedPersistence && profile && !data.basic_info && !pendingResumeState) {
        setData((prev) => ({
            ...prev,
            basic_info: {
                name: profile.full_name || undefined,
                age: profile.age || undefined,
                gender: profile.gender ? profile.gender.toLowerCase() : undefined, // Fix: Normalize case
                height: profile.height || undefined,
                weight: profile.weight || undefined,
            }
        }))
    }
}, [hasCheckedPersistence, profile, data.basic_info, pendingResumeState])
```

### 2. `src/components/diagnosis/BasicInfoForm.tsx`

-   Added a fallback `.toLowerCase()` check ensures that even if `initialData` comes from a different source (like a raw mock), the component will render the dropdown value safely.

## Future Reference & Rules

1.  **Async Initialization**: Never assume `useAuth` or other context data is available immediately on mount. Always split initialization logic if it depends on multiple async sources (e.g., LocalStorage + API/Context).
2.  **Strict Typing for Selects**: Helper components like `Select` or `RadioGroup` often depend on exact string matching. **Always normalize data** (trim, lowercase) at the boundary before feeding it into UI state.
3.  **Dependency Arrays**: Be careful with `useEffect` dependencies. If you use a flag (like `hasCheckedPersistence`) to gate logic, ensure the logic can still run if the data (`profile`) updates *after* the flag flips.
