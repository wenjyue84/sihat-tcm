# React Hooks Patterns

> **Last Updated:** 2026-02-06
> **PR:** —
> **Context:** Fixed infinite loop in TCM Inquiry page caused by unstable callback references

## Infinite Loops from Unstable Callbacks

### Problem
Creating new arrow functions in useEffect that get passed to a store's `setState` causes infinite re-renders when the store compares functions by reference.

**Location:** `useDiagnosisWizard.ts:158`, `InquiryChatStep/index.tsx:114`, `UploadReportsStep.tsx:86`, `ChooseDoctorStep.tsx:42`, `AudioRecorder.tsx:166`

**Symptom:**
```
Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

Hundreds of rapid re-renders visible in server logs:
```
GET / 200 in 218ms
GET / 200 in 222ms
GET / 200 in 239ms
... (continues indefinitely)
```

### Root Cause

#### Bad Pattern 1: New arrow functions every render
```typescript
useEffect(() => {
  setNavigationState({
    onNext: () => nextStep(step),  // ❌ New function every time!
    onBack: () => prevStep(step),   // ❌ New function every time!
    showNext: true,
    showBack: !!onBack,
  });
}, [step, setNavigationState, nextStep, prevStep]);
```

**Why it fails:**
1. `nextStep` and `prevStep` are stable (from `useCallback`)
2. But the arrow functions `() => nextStep(step)` are NEW on every render
3. Store compares `current.onNext !== state.onNext` (reference comparison)
4. Always sees them as "changed" → updates state → re-render → new arrows → repeat

#### Bad Pattern 2: Boolean coercion in dependencies
```typescript
}, [step, setNavigationState, !!onBack]);
//                               ^^^^^^^^ ❌ Creates new boolean every render!
```

**Why it fails:**
- `!!onBack` creates a new boolean primitive on every render
- Triggers the effect even when `onBack` hasn't actually changed
- Combined with Pattern 1, causes infinite loops

### Solution: Stable References with Refs + useCallback

```typescript
// 1. Use refs to store current values
const stepRef = useRef(step);
const nextStepRef = useRef(nextStep);
const prevStepRef = useRef(prevStep);

// 2. Keep refs in sync
useEffect(() => {
  stepRef.current = step;
  nextStepRef.current = nextStep;
  prevStepRef.current = prevStep;
}, [step, nextStep, prevStep]);

// 3. Create stable callbacks with EMPTY dependencies
const handleNext = useCallback(() => {
  nextStepRef.current(stepRef.current);
}, []); // ✅ Empty array = stable forever

const handleBack = useCallback(() => {
  prevStepRef.current(stepRef.current);
}, []); // ✅ Empty array = stable forever

// 4. Use stable callbacks, exclude from dependencies
useEffect(() => {
  setNavigationState({
    onNext: handleNext,  // ✅ Same reference every time
    onBack: handleBack,  // ✅ Same reference every time
    showNext: true,
    showBack: !!onBack,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [step, setNavigationState]);
// ✅ handleNext/handleBack excluded - they're truly stable
```

**Key principle:** The callback references never change, but they always access the latest values via refs.

## Boolean Coercion in Dependencies

### Problem
```typescript
}, [displayMessagesCount, setNavigationState, !!onBack]);
//                                              ^^^^^^^^ ❌
```

Every render creates a new boolean, triggering the effect unnecessarily.

### Solution 1: Remove from dependencies (if using refs)
```typescript
const hasBackRef = useRef(!!onBack);

useEffect(() => {
  hasBackRef.current = !!onBack;
}, [onBack]);

useEffect(() => {
  const hasBack = !!onBack;
  setNavigationState({
    showBack: hasBack,
    // ...
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [step, setNavigationState]);
```

### Solution 2: Compute inside effect
```typescript
useEffect(() => {
  const hasBack = !!onBack;  // ✅ Compute locally
  setNavigationState({
    showBack: hasBack,
    // ...
  });
}, [onBack, setNavigationState]);  // ✅ Depend on onBack directly
```

## Files Fixed

| File | Issue | Lines |
|------|-------|-------|
| `useDiagnosisWizard.ts` | Unstable arrow functions + added refs | 140-174 |
| `InquiryChatStep/index.tsx` | `!!onBack` in deps + used ref | 100-123 |
| `UploadReportsStep.tsx` | `!!onBack` in deps | 86-96 |
| `ChooseDoctorStep.tsx` | `!!onBack` in deps | 42-50 |
| `AudioRecorder.tsx` | `!!onBack` in deps | 166-176 |

## Prevention Checklist

When writing useEffect with setState/store updates:

- [ ] Are you creating new arrow functions? → Use refs + useCallback
- [ ] Are you using `!!someValue` in deps? → Compute inside or use ref
- [ ] Are callbacks in deps truly stable? → Check their useCallback deps
- [ ] Could this trigger a re-render loop? → Trace the update cycle
- [ ] ESLint complaining about deps? → Understand WHY before suppressing

## Related

- [Diagnosis Flow](../diagnosis/4-examination-flow.md) - Navigation state management
- [Error Handling](error-handling.md) - ErrorBoundary catches infinite loops
- [Type Safety](type-safety.md) - Proper typing prevents some hook issues

## References

- React Docs: [useEffect dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)
- React Docs: [useCallback](https://react.dev/reference/react/useCallback)
- Kent C. Dodds: [useCallback/useMemo](https://kentcdodds.com/blog/usememo-and-usecallback)
