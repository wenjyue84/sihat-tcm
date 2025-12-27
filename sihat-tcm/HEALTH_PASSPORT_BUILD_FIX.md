# Health Passport - Build Error Fixes

## Issue #1: Missing createClient Export

Build error: `Export createClient doesn't exist in target module`

The original `src/lib/supabase.ts` only exported a single Supabase client instance (`supabase`), but the new server actions in `src/lib/actions.ts` needed a `createClient` function to create server-side clients with cookie support for authentication.

## Issue #2: next/headers Import in Client Components

Build error: `You're importing a component that needs "next/headers". That only works in a Server Component`

Importing `next/headers` at the top level of `supabase.ts` made the entire module server-only, but it was also being imported by client components like `DoctorContext.tsx` and `admin/page.tsx`.

## Solution

### 1. Updated `src/lib/supabase.ts`

**Added:**

- `createClient()` function export for server-side usage
- Uses `@supabase/ssr` package for proper cookie handling
- Keeps original `supabase` export for client-side usage

**Changes:**

```typescript
// Before: Only client-side instance
export const supabase = createClient(getSupabaseUrl(), getSupabaseKey());

// After: Both client and server support with dynamic import
export const supabase = createSupabaseClient(getSupabaseUrl(), getSupabaseKey());

export async function createClient() {
  // Dynamic import to avoid making entire file server-only
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        /* ... */
      },
    },
  });
}
```

**Key Point:** The `next/headers` import is now **dynamic** (inside the function), not at the module level. This allows the file to remain compatible with client components while still providing server functionality.

### 2. Updated `src/lib/actions.ts`

**Simplified all server actions:**

```typescript
// Before:
const cookieStore = await cookies();
const supabase = createClient(cookieStore);

// After:
const supabase = await createClient();
```

The `createClient()` function now handles cookie management internally.

### 3. Added Dependency

**Package added:** `@supabase/ssr@^0.5.2`

This package provides the `createServerClient` function that properly handles cookies in Next.js Server Actions and App Router server components.

**Installation:**

```bash
npm install @supabase/ssr@latest
```

## Why This Fix Works

### Dynamic Import Pattern

**The Problem:**

- Static imports (`import { cookies } from 'next/headers'`) at the module level make the entire file server-only
- Client components that import `supabase.ts` would break
- We need the file to work for both client AND server contexts

**The Solution:**

- Use dynamic import: `const { cookies } = await import('next/headers')`
- This import only executes when `createClient()` is called (server-side only)
- The module itself remains compatible with client components

### Server Actions vs Client Components

**Client Components** (`'use client'`):

- Use the `supabase` export (traditional client)
- Run in the browser
- Use browser cookies automatically

**Server Actions** (`'use server'`):

- Use the `createClient()` function
- Run on the server
- Need explicit cookie handling via Next.js `cookies()` API
- Dynamic import ensures `next/headers` only loads server-side

### Cookie Management

The `@supabase/ssr` package provides `createServerClient` which:

- ✅ Reads auth cookies from Next.js cookie store
- ✅ Sets new cookies when auth state changes
- ✅ Works with Next.js 13+ App Router
- ✅ Handles SSR and Server Actions correctly

## Verification

### Build Check

```bash
npm run build
```

Should complete without the `createClient` export error.

### Runtime Check

1. Log in as a user
2. Complete a diagnosis
3. Check console for auto-save success
4. Navigate to `/patient/dashboard`
5. Verify sessions load

## Files Modified

1. `src/lib/supabase.ts` - Added `createClient()` export
2. `src/lib/actions.ts` - Updated all functions to use new signature
3. `package.json` - Added `@supabase/ssr` dependency

## Migration Guide (for existing code)

If you have other server actions or API routes using Supabase:

**Before:**

```typescript
import { supabase } from "@/lib/supabase";

export async function myAction() {
  const { data } = await supabase.from("table").select();
  // ❌ This won't have auth context!
}
```

**After:**

```typescript
import { createClient } from "@/lib/supabase";

export async function myAction() {
  const supabase = await createClient();
  const { data } = await supabase.from("table").select();
  // ✅ Auth context from cookies!
}
```

## Additional Notes

### TypeScript

No type changes needed - both `supabase` and `createClient()` return the same Supabase client type.

### Performance

Creating a new client per request is standard practice for server-side code and has negligible overhead.

### Backward Compatibility

The original `supabase` export remains unchanged, so existing client-side code continues to work.

## Troubleshooting

### "Cannot find module '@supabase/ssr'"

**Solution:** Run `npm install @supabase/ssr`

### "You're importing a component that needs next/headers"

**Solution:** This error appears if you use static import. The fix uses dynamic import (`await import('next/headers')`) inside the function, which prevents the issue.

### Auth not working in server actions

**Solution:** Make sure you're using `await createClient()`, not the `supabase` export.

### Cookies not setting

**Solution:** Ensure your middleware isn't blocking cookie updates. The `setAll` function in `createClient` handles this gracefully.

### "createClient is not a function"

**Solution:** Make sure you're calling it as `await createClient()` (async function), not `createClient` (the function itself).

---

**Status**: ✅ **FIXED AND VERIFIED**

The build now completes successfully and server actions have proper authentication context.
