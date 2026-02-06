# Type Safety Patterns

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #typescript #patterns #type-safety

## What This Is

Type safety patterns and learnings from enforcing strict TypeScript across Sihat TCM. Current score: 98%, zero `any` types in production code.

## Common Mistakes & Fixes

### 1. Using `any` Type

**Problem:**
- Type errors bypassed with `any`
- Runtime errors not caught by TypeScript
- Loss of IntelliSense and type checking

**Root Cause:**
- Quick fix mentality during development
- Complex types seem too difficult to define
- Lack of understanding of TypeScript utilities

**Fix:**
```typescript
// ❌ Wrong
const handleData = (data: any) => {
  console.log(data.name); // No type checking
};

// ✅ Correct - Use unknown and type guard
const handleData = (data: unknown) => {
  if (isValidData(data)) {
    console.log(data.name); // Type-safe
  }
};

function isValidData(data: unknown): data is { name: string } {
  return typeof data === "object" && data !== null && "name" in data;
}

// ✅ Or use generics
function handleData<T extends { name: string }>(data: T) {
  console.log(data.name);
}
```

**Prevention:**
- Enable `noImplicitAny` in tsconfig.json (already enabled)
- Use ESLint rule: `@typescript-eslint/no-explicit-any: error`
- Use `unknown` when type is truly unknown, then narrow with type guards
- Leverage TypeScript utility types: `Partial`, `Pick`, `Omit`, `Record`

---

### 2. Magic Numbers Scattered in Code

**Problem:**
- Hardcoded values (timeouts, limits, thresholds) everywhere
- Inconsistent values across components
- Hard to update when requirements change

**Root Cause:**
- No centralized constants file initially
- Quick prototyping without cleanup

**Fix:**
- Refactoring eliminated 47 magic numbers → moved to `src/lib/constants/index.ts`

```typescript
// ❌ Wrong
setTimeout(() => { /* ... */ }, 30000); // What is 30000?
if (bpm > 200) { /* ... */ } // Why 200?

// ✅ Correct
import { TIMEOUTS, DEVICE_LIMITS } from "@/lib/constants";

setTimeout(() => { /* ... */ }, TIMEOUTS.SESSION_TIMEOUT);
if (bpm > DEVICE_LIMITS.PULSE.MAX) { /* ... */ }
```

**Prevention:**
- Always import from constants file
- Never hardcode timeouts, limits, or thresholds
- Document why each constant value was chosen
- Use enums for related constants

---

### 3. Incomplete Type Definitions

**Problem:**
- Types missing optional properties
- Runtime errors when accessing undefined properties
- Type definitions don't match actual API responses

**Root Cause:**
- Types defined before full API understanding
- Copy-paste from incomplete examples
- Missing validation at boundaries

**Fix:**
```typescript
// ❌ Wrong - Assumes all properties exist
interface UserData {
  name: string;
  email: string;
  phone: string; // Might not exist!
}

// ✅ Correct - Mark optional properties
interface UserData {
  name: string;
  email: string;
  phone?: string; // Optional
}

// Or use required/optional split
interface UserDataRequired {
  name: string;
  email: string;
}

interface UserDataOptional {
  phone?: string;
  avatar?: string;
}

type UserData = UserDataRequired & UserDataOptional;
```

**Prevention:**
- Validate API responses at boundaries (use Zod or similar)
- Mark properties as optional (`?`) if they might not exist
- Use utility types: `Required<T>`, `Partial<T>`
- Test with incomplete data to catch missing optionals

---

### 4. Type Assertions Without Validation

**Problem:**
- `as` type assertions used without runtime checks
- Runtime errors when assumption is wrong

**Root Cause:**
- Overconfidence in data shape
- Bypassing TypeScript errors quickly

**Fix:**
```typescript
// ❌ Wrong - Dangerous assertion
const data = response.data as DiagnosisData; // What if it's not?

// ✅ Correct - Validate before asserting
function isDiagnosisData(data: unknown): data is DiagnosisData {
  // Runtime validation
  return (
    typeof data === "object" &&
    data !== null &&
    "basicInfo" in data &&
    "inquiryData" in data
  );
}

const data = response.data;
if (isDiagnosisData(data)) {
  // Type-safe usage
  console.log(data.basicInfo);
} else {
  throw new Error("Invalid diagnosis data");
}
```

**Prevention:**
- Avoid `as` assertions unless absolutely necessary
- Always validate data at system boundaries (API, localStorage, user input)
- Use type guards (`is` keyword) for runtime validation
- Consider using Zod schemas for complex validation

---

## Best Practices

### 1. Strict Mode Configuration

**tsconfig.json** (already enabled):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 2. Type Guard Pattern

```typescript
// Reusable type guard
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

// Usage
const items = [1, null, 2, null, 3].filter(isNotNull); // Type: number[]
```

### 3. Discriminated Unions

```typescript
// For complex state management
type LoadingState = { status: "loading" };
type SuccessState = { status: "success"; data: DiagnosisData };
type ErrorState = { status: "error"; error: string };

type RequestState = LoadingState | SuccessState | ErrorState;

function handleState(state: RequestState) {
  switch (state.status) {
    case "loading":
      // state is LoadingState
      return <Spinner />;
    case "success":
      // state is SuccessState, data is available
      return <DiagnosisResults data={state.data} />;
    case "error":
      // state is ErrorState, error is available
      return <ErrorMessage message={state.error} />;
  }
}
```

### 4. Const Assertions

```typescript
// Make objects deeply readonly
const DEVICE_TYPES = ["pulse", "bloodPressure", "oxygen"] as const;
type DeviceType = typeof DEVICE_TYPES[number]; // "pulse" | "bloodPressure" | "oxygen"

// Better than:
type DeviceType = "pulse" | "bloodPressure" | "oxygen"; // Must maintain manually
```

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-02-06 | Strict mode enabled | Catch errors at compile time, not runtime | — |
| 2026-02-06 | Zero `any` policy | Enforce complete type coverage | — |
| 2026-02-06 | Centralized constants | Eliminated 47 magic numbers | — |

## Related Files

- `sihat-tcm-web/tsconfig.json` - TypeScript configuration
- `sihat-tcm-web/src/types/diagnosis.ts` - Core type definitions
- `sihat-tcm-web/src/lib/constants/index.ts` - Centralized constants

## Related Notes

- [Error Handling](./error-handling.md) - Type-safe error patterns
- [Testing](./testing.md) - Property-based testing with types
- [IoT Connection Wizard](../diagnosis/iot-connection-wizard.md) - Device type validation

## Metrics

**Current Status:**
- Type safety score: 98%
- `any` types in production: 0
- Magic numbers eliminated: 47
- Strict mode violations: 0

**Goal:**
- Maintain 100% type safety
- Zero `any` types forever
- All constants centralized

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation from refactoring reports | Claude |
