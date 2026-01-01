---
paths: "**/*.ts,**/*.tsx"
---

# TypeScript Rules for Sihat TCM

## Strict Typing

- **NEVER** use `any` type - use `unknown` with type guards instead
- **ALWAYS** define explicit return types for functions
- Use type inference for simple variable assignments
- Prefer `interface` over `type` for object shapes (better error messages)

## Path Aliases

Use configured path aliases instead of relative imports:

```typescript
// ✅ Good
import { DiagnosisWizardData } from "@/types/diagnosis";
import { analyzeImage } from "@/api/analyze";

// ❌ Bad
import { DiagnosisWizardData } from "../../../types/diagnosis";
```

## Null Safety

- Use optional chaining (`?.`) for potentially undefined properties
- Use nullish coalescing (`??`) instead of `||` for default values
- Avoid non-null assertions (`!`) unless absolutely certain

```typescript
// ✅ Good
const name = patient?.profile?.name ?? "Unknown";

// ❌ Bad
const name = patient!.profile!.name || "Unknown";
```

## Type Guards

Create type guards for runtime type checking:

```typescript
function isDiagnosisComplete(data: DiagnosisWizardData): data is CompleteDiagnosis {
  return data.basicInfo !== null && data.inquiryData !== null;
}
```

## Generics

- Use descriptive generic names (not just `T`)
- Constrain generics when possible

```typescript
// ✅ Good
function processStep<TStep extends DiagnosisStep>(step: TStep): TStep

// ❌ Bad
function processStep<T>(step: T): T
```

## Enums vs Union Types

- Prefer string literal unions for simple cases
- Use const enums for performance-critical code
- Regular enums for complex cases needing reverse mapping

```typescript
// ✅ Preferred for most cases
type DeviceType = "pulse" | "blood_pressure" | "oxygen" | "temperature";

// ✅ For reverse mapping needs
enum DiagnosisStep {
  BasicInfo = 0,
  Inquiry = 1,
  Visual = 2,
}
```

## Error Handling

- Use the centralized `AppError` class from `@/lib/errors`
- Always include context in error messages
- Type catch blocks properly

```typescript
try {
  await submitDiagnosis(data);
} catch (error) {
  if (error instanceof AppError) {
    handleAppError(error);
  } else {
    throw new AppError("Unknown error during diagnosis submission", { cause: error });
  }
}
```

## Async/Await

- Always handle promise rejections
- Use `Promise.all` for parallel operations
- Avoid mixing `.then()` with `async/await`

## Constants

- Import from `@/lib/constants` instead of hardcoding
- Use `as const` for literal types

```typescript
import { AI_PERFORMANCE_THRESHOLDS } from "@/lib/constants";
```
