---
paths: "**/*.tsx,**/components/**/*,**/screens/**/*"
---

# React Rules for Sihat TCM

## Component Structure

### Server vs Client Components

```typescript
// Client components need this directive
"use client";

// Server components (default in Next.js App Router) - no directive needed
```

- Use Server Components by default
- Add `"use client"` only when using: hooks, browser APIs, event handlers, or client-side state

### Component Organization

```typescript
// 1. Imports
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface PatientCardProps {
  patient: Patient;
  onSelect: (id: string) => void;
}

// 3. Component
export function PatientCard({ patient, onSelect }: PatientCardProps) {
  // 4. Hooks first
  const [isLoading, setIsLoading] = useState(false);

  // 5. Derived state
  const displayName = patient.name || "Anonymous";

  // 6. Effects
  useEffect(() => {
    // ...
  }, []);

  // 7. Handlers
  const handleClick = () => onSelect(patient.id);

  // 8. Render
  return <div onClick={handleClick}>{displayName}</div>;
}
```

## Hooks

### Custom Hooks

- Prefix with `use` (e.g., `useInquiryWizardState`)
- Extract complex logic into custom hooks
- Return stable references with `useCallback` and `useMemo`

```typescript
// ✅ Good - custom hook for diagnosis state
function useInquiryWizardState(initialData?: InquiryData) {
  const [state, setState] = useState(initialData);

  const updateField = useCallback((field: keyof InquiryData, value: unknown) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  return { state, updateField };
}
```

### Dependency Arrays

- **ALWAYS** include all dependencies
- Use ESLint rules to catch missing dependencies
- Extract stable functions with `useCallback` to prevent re-renders

## State Management

### Local State
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic

### Global State (Zustand)
- Access stores via hooks
- Keep stores focused and small
- Use selectors for performance

```typescript
import { useDiagnosisStore } from "@/stores/diagnosis";

function Component() {
  // ✅ Good - select only what you need
  const currentStep = useDiagnosisStore(state => state.currentStep);

  // ❌ Bad - subscribes to entire store
  const store = useDiagnosisStore();
}
```

## Forms

- Use controlled components
- Validate on blur and submit
- Show loading states during submission
- Handle errors gracefully

## Loading & Error States

**ALWAYS** handle these three states:

```typescript
function DiagnosisList() {
  const { data, isLoading, error } = useDiagnoses();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data?.length) return <EmptyState />;

  return <List items={data} />;
}
```

## Accessibility

- Use semantic HTML elements
- Include `aria-*` attributes where needed
- Ensure keyboard navigation works
- Test with screen readers

## Performance

- Use `React.memo` for expensive pure components
- Lazy load routes and heavy components
- Avoid inline object/function definitions in JSX

```typescript
// ❌ Bad - creates new object every render
<Component style={{ color: "red" }} />

// ✅ Good - stable reference
const styles = { color: "red" };
<Component style={styles} />
```

## Testing

- Test user behavior, not implementation
- Use React Testing Library
- Mock API calls, not components
