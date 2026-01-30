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

---

# Fix: Vercel Build Failure - Invalid `nodeVersion` in `vercel.json`

**Date:** 2025-12-27
**Issue:** Deployment to Vercel failed with the error: `The 'vercel.json' schema validation failed with the following message: should NOT have additional property 'nodeVersion'`.

## Root Causes

1.  **Vercel Schema Change**:
    -   Vercel deprecated and eventually removed support for the `nodeVersion` property within the `vercel.json` configuration file.
    -   The schema validation now strictly rejects any configuration file containing this property.

2.  **Legacy Configuration**:
    -   The project was still using the legacy method of specifying the Node.js version in `vercel.json`.

## The Fix

### 1. `vercel.json`

-   Removed the `"nodeVersion": "22.x"` line from the configuration file.

### 2. `package.json`

-   Added the standard `engines` field to specify the required Node.js version. This is the recommended way for both local development and Vercel deployments.

```json
{
  "engines": {
    "node": "22.x"
  }
}
```

## Future Reference & Rules

1.  **Standard Node Versioning**: Always use the `engines` field in `package.json` to specify Node.js versions. It is recognized by most deployment platforms (Vercel, Heroku, etc.) and package managers.
2.  **Vercel Configuration**: Keep `vercel.json` minimal. Prefer project settings in the Vercel Dashboard or standard files like `package.json` for environment-wide configurations.
3.  **Schema Validation Errors**: When a "schema validation failed" error occurs during deployment, immediately check the documentation for the configuration file (e.g., `vercel.json`) to see if properties have been renamed or removed.

---

# Fix: CI/CD & Security Hardening (Post-Deployment Audit)

**Date:** 2025-12-27
**Issue:** Deployment logs identified Husky errors on CI, React 19 peer dependency conflicts, and 12 security vulnerabilities (6 critical).

## Root Causes

1.  **Husky CI Shell Mismatch**: 
    -   The `prepare` script used bash syntax (`if [ ... ]`), which failed on Windows development machines during local installs.
    -   Vercel environments (CI) lack the `.git` folder in shallow clones, causing Husky to error.
2.  **Security Vulnerabilities**:
    -   `next`: Vulnerable to Server Actions source code exposure and DoS.
    -   `jsonpath-plus` & `dompurify`: Critical RCE and XSS vulnerabilities in transitive dependencies (primarily from TinaCMS/Mermaid).
3.  **Peer Dependency Conflicts**:
    -   Packages like `swagger-ui-react` are not yet fully compatible with React 19 peer dependency ranges.

## The Fix

### 1. Cross-Platform Husky Skip (`package.json`)
Improved the `prepare` script to use Node.js instead of shell-specific syntax. This works on Windows/Linux and safely skips Husky on CI.

```json
"prepare": "node -e \"if (!process.env.CI) try { require('child_process').execSync('husky', {stdio: 'inherit'}) } catch (e) {}\""
```

### 2. Dependency Upgrades & Overrides
- **Upgraded `next` & `eslint-config-next`** to `16.1.1` to resolve high-severity security advisories.
- **Added `overrides`** to force secure versions of deep dependencies:
  - `jsonpath-plus`: Forced to `10.3.0` (Fixes RCE).
  - `dompurify`: Forced to `3.2.4` (Fixes XSS/Prototype Pollution).

### 3. Build Process Optimization
- Recommended use of `--legacy-peer-deps` for local installs to handle React 19 transition period until upstream packages update their dependency ranges.

## Future Reference & Rules

1.  **Cross-Platform Scripts**: Always use Node.js one-liners for `package.json` scripts if they need to run on both Windows (dev) and Linux (CI/Vercel).
2.  **Security Overrides**: Use the `overrides` field in `package.json` to mitigate vulnerabilities in transitive dependencies when the top-level package maintainer is slow to update.
3.  **React 19 Compatibility**: When using bleeding-edge frameworks (Next.js 16 / React 19), expect peer dependency warnings. Document forced overrides rather than downgrading the core framework.

---

# Feature: AI-Assisted SQL Migration Capability

**Date:** 2026-01-03
**Feature:** AI assistants (Claude, Gemini) can now run SQL migrations directly without manual Supabase Dashboard access.

## Setup

1.  **Service Role Key Added**:
    -   Added `SUPABASE_SERVICE_ROLE_KEY` to `sihat-tcm-web/.env.local`
    -   This key has admin privileges to the database.

2.  **Migration Scripts Created**:
    -   `run-migration.mjs` - General migration runner
    -   `seed-test-doctors.mjs` - Create test doctor accounts

3.  **Workflow Created**:
    -   `.agent/workflows/run-sql-migration.md` - Guides AI through migration steps

## Usage

When you need to run SQL:
1. Ask the AI assistant (Claude or Gemini) to run the SQL
2. It will create/use a Node.js script with the service role key
3. Execute the migration and report results

## Example

```bash
# User asks: "Run a migration to add is_approved column"
# AI creates run-migration.mjs and executes:
node run-migration.mjs
```

## Security Notes

1.  **Service Role Key**: Has full admin access. Never commit to git or share publicly.
2.  **Scripts**: Use Supabase client with service role for admin operations.
3.  **Backup**: Always consider backing up data before destructive migrations.

## Future Reference & Rules

1.  **AI Capability**: AI assistants can run SQL migrations via Node.js scripts with the service role key.
2.  **Workflow**: Use `/run-sql-migration` for guided migration steps.
3.  **Documentation**: This capability is documented in `claude.md`, `GEMINI.md`, and `DEVELOPER_GUIDE.md`.

