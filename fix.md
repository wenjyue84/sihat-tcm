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

---

# Fix: Modal Centering Issue in Chrome Browser

**Date:** 2025-01-27
**Issue:** Dialog modals (especially the validation prompt modal in UploadReportsStep) were appearing on the left side of the screen instead of being centered, particularly in Chrome browser.

## Root Causes

1.  **Tailwind Transform Classes Not Reliable in Chrome**:
    -   The Dialog component was using Tailwind classes `top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2` for centering.
    -   Chrome sometimes doesn't apply these transform utilities consistently, especially when combined with Radix UI's animation classes.
    -   Result: Modal appeared on the left side instead of being centered.

2.  **Viewport Constraints Missing**:
    -   Initial implementation lacked proper `max-height` constraints.
    -   Modals could overflow viewport boundaries, making them appear cut off or mispositioned.

## The Fix

### `src/components/ui/dialog.tsx`

-   **Replaced Tailwind Classes with Inline Styles**: Removed Tailwind positioning classes and used explicit inline styles for reliable cross-browser centering.
-   **Added Viewport Constraints**: Added `max-h-[calc(100vh-2rem)]` to ensure modals stay within viewport bounds.
-   **Added Overflow Handling**: Added `overflow-y-auto` to make content scrollable when it exceeds viewport height.

```typescript
// Fixed Code Snippet
<DialogPrimitive.Content
  data-slot="dialog-content"
  className={cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] gap-4 rounded-lg border p-4 sm:p-6 shadow-lg duration-200 sm:max-w-lg grid overflow-y-auto",
    className
  )}
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    ...props.style
  }}
  {...props}
>
```

### Key Changes

1.  **Explicit Inline Styles**: Using inline `style` prop ensures the transform is applied consistently across all browsers, especially Chrome.
2.  **Viewport Height Constraint**: `max-h-[calc(100vh-2rem)]` prevents modals from exceeding viewport boundaries.
3.  **Scrollable Content**: `overflow-y-auto` allows content to scroll when it's taller than the viewport.
4.  **Preserved Custom Styles**: The spread `...props.style` allows components to override positioning if needed for special cases.

## Future Reference & Rules

1.  **Browser-Specific CSS Issues**: When Tailwind utilities don't work consistently (especially transforms), use explicit inline styles for critical positioning.
2.  **Modal/Dialog Best Practices**: Always constrain modals to viewport dimensions (`max-h-[calc(100vh-2rem)]`) and make content scrollable when needed.
3.  **Cross-Browser Testing**: Test modal positioning in Chrome, Firefox, and Safari, as transform behavior can vary.
4.  **Inline Styles for Critical Layout**: For positioning that must work reliably, inline styles have higher specificity and are less likely to be overridden by conflicting CSS.
