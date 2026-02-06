# Error Handling Patterns

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #patterns #error-handling #architecture

## What This Is

Centralized error handling patterns using the `AppError` system with context tracking. Current consistency: 95%.

## Common Mistakes & Fixes

### 1. Generic Error Messages

**Problem:**
- Errors like "Something went wrong" don't help debugging
- No context about what operation failed
- User can't take meaningful action

**Root Cause:**
- Quick error handling without context
- Copy-paste error patterns

**Fix:**
```typescript
// ❌ Wrong - Generic, unhelpful
throw new Error("Something went wrong");

// ✅ Correct - Specific, actionable
throw new AppError(
  "Failed to save diagnosis session",
  {
    code: "SESSION_SAVE_FAILED",
    context: { sessionId, userId },
    userMessage: "We couldn't save your diagnosis. Please check your internet connection and try again.",
  }
);
```

**Prevention:**
- Always provide operation context
- Include user-friendly message
- Add error code for tracking
- Include relevant IDs (userId, sessionId, etc.)

---

### 2. Swallowed Errors

**Problem:**
- Errors caught but not logged or reported
- Silent failures make debugging impossible
- Users stuck without feedback

**Root Cause:**
- Empty catch blocks
- Overly defensive programming

**Fix:**
```typescript
// ❌ Wrong - Error disappears
try {
  await saveSession(data);
} catch (error) {
  // Nothing happens!
}

// ✅ Correct - Log and handle
try {
  await saveSession(data);
} catch (error) {
  console.error("Session save failed:", error);

  // Show user-friendly message
  toast.error("Couldn't save your session. Changes may be lost.");

  // Optional: Report to error tracking service
  reportError(error, { context: "session-save" });

  // Rethrow if caller needs to know
  throw error;
}
```

**Prevention:**
- Never use empty catch blocks
- Always log errors to console
- Consider error tracking service (Sentry, etc.)
- Provide user feedback

---

### 3. Missing Error Boundaries

**Problem:**
- Unhandled errors crash entire React app
- White screen of death for users
- No fallback UI

**Root Cause:**
- Error boundaries not implemented
- Only top-level boundary, none for components

**Fix:**
```typescript
// Add Error Boundary component
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap critical components
<ErrorBoundary
  fallback={<DiagnosisErrorFallback />}
  onError={(error, errorInfo) => {
    console.error("Diagnosis wizard error:", error, errorInfo);
  }}
>
  <DiagnosisWizard />
</ErrorBoundary>
```

**Prevention:**
- Wrap each major feature with Error Boundary
- Provide meaningful fallback UI
- Log errors for debugging
- Test error scenarios

---

### 4. Async Error Handling Issues

**Problem:**
- Promises rejected without `.catch()`
- Unhandled promise rejections
- React state updates after unmount

**Root Cause:**
- Forgetting to handle async errors
- Not cleaning up in useEffect

**Fix:**
```typescript
// ❌ Wrong - Unhandled rejection
useEffect(() => {
  fetchDiagnosisData(sessionId); // Promise not handled!
}, [sessionId]);

// ✅ Correct - Proper async handling
useEffect(() => {
  let cancelled = false;

  const loadData = async () => {
    try {
      const data = await fetchDiagnosisData(sessionId);
      if (!cancelled) {
        setDiagnosisData(data);
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Failed to load diagnosis:", error);
        setError(error);
      }
    }
  };

  loadData();

  return () => {
    cancelled = true; // Prevent state updates after unmount
  };
}, [sessionId]);
```

**Prevention:**
- Always handle async errors in useEffect
- Use cleanup function to prevent state updates after unmount
- Consider using React Query for data fetching (handles this automatically)

---

## AppError System

### Usage Pattern

```typescript
import { AppError } from "@/lib/errors";

// Create typed error
throw new AppError(
  "Operation description",
  {
    code: "ERROR_CODE",           // Trackable code
    context: { key: "value" },    // Debug info
    userMessage: "User message",  // Friendly message
    statusCode: 400,              // HTTP status (optional)
  }
);
```

### Error Codes Convention

Format: `<DOMAIN>_<ACTION>_<RESULT>`

Examples:
- `SESSION_SAVE_FAILED`
- `DEVICE_CONNECTION_TIMEOUT`
- `AUTH_TOKEN_EXPIRED`
- `VALIDATION_INVALID_INPUT`

---

## Best Practices

### 1. Error Boundary Hierarchy

```
App
├── ErrorBoundary (global fallback)
│   ├── DiagnosisPage
│   │   └── ErrorBoundary (diagnosis-specific)
│   │       └── DiagnosisWizard
│   └── PatientDashboard
│       └── ErrorBoundary (dashboard-specific)
│           └── PatientCharts
```

### 2. User-Friendly Messages

```typescript
// Map technical errors to user messages
const ERROR_MESSAGES: Record<string, string> = {
  SESSION_SAVE_FAILED: "We couldn't save your session. Please check your connection.",
  DEVICE_CONNECTION_TIMEOUT: "Device not responding. Please check it's powered on.",
  AUTH_TOKEN_EXPIRED: "Your session expired. Please log in again.",
};
```

### 3. Error Logging Levels

```typescript
enum ErrorLevel {
  INFO = "info",       // Expected errors (validation failures)
  WARNING = "warning", // Recoverable errors (retry succeeded)
  ERROR = "error",     // Unexpected errors (need investigation)
  CRITICAL = "critical" // System failures (need immediate attention)
}
```

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-01-12 | AppError centralized system | Consistent error handling across app | #70 |
| 2026-01-18 | Error boundaries per feature | Prevent full app crashes | #76 |
| 2026-02-03 | Error tracking integration | Monitor production errors | #100 |

## Related Files

- `sihat-tcm-web/src/lib/errors/AppError.ts` - Error class definition
- `sihat-tcm-web/src/components/ErrorBoundary.tsx` - React Error Boundary
- `sihat-tcm-web/src/lib/errors/index.ts` - Error utilities

## Related Notes

- [Type Safety](./type-safety.md) - Type-safe error patterns
- [IoT Connection Wizard](../diagnosis/iot-connection-wizard.md) - Device error handling
- [Session Recovery](../diagnosis/session-recovery.md) - Error recovery patterns

## Testing Checklist

- [ ] Error boundaries render fallback UI
- [ ] AppError includes all context
- [ ] User messages are friendly
- [ ] Errors logged to console
- [ ] Async errors handled in useEffect
- [ ] No unhandled promise rejections

## Metrics

**Current Status:**
- Error handling consistency: 95%
- Components with Error Boundaries: 12/15 (80%)
- Unhandled promise rejections: 0
- Generic error messages remaining: 3

**Goal:**
- 100% consistency
- Error Boundary on every major feature
- Zero unhandled rejections
- Zero generic error messages

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation from refactoring reports | Claude |
