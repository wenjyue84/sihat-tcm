# Testing Patterns

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #testing #vitest #property-based-testing

## What This Is

Testing patterns and best practices for Sihat TCM using Vitest and property-based testing with fast-check.

## Common Mistakes & Fixes

### 1. Forgetting to Mock Supabase Client

**Problem:**
- Tests try to connect to real Supabase database
- Tests fail in CI/CD environment
- Slow test execution

**Root Cause:**
- No mock setup for Supabase client
- Tests using real API calls

**Fix:**
```typescript
import { vi } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      update: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));
```

**Prevention:**
- Always mock external services in unit tests
- Use integration tests for real database interactions
- Create reusable mock setup utilities

---

### 2. Not Testing Error States

**Problem:**
- Tests only cover happy path
- Error handling bugs slip through
- Users encounter unhandled errors

**Root Cause:**
- Focus on successful flows
- Error testing seems harder
- Missing error boundary tests

**Fix:**
```typescript
import { expect, test } from "vitest";

test("handles API error gracefully", async () => {
  // Setup mock to throw error
  const mockError = new Error("API connection failed");
  vi.mocked(supabase.from).mockImplementationOnce(() => {
    throw mockError;
  });

  // Test error handling
  const result = await fetchDiagnosisData("test-id");

  expect(result.error).toBe(mockError);
  expect(result.data).toBeNull();
});

test("error boundary catches component errors", () => {
  // Render component that throws
  const ThrowingComponent = () => {
    throw new Error("Test error");
  };

  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText("Error occurred")).toBeInTheDocument();
});
```

**Prevention:**
- Test both success and failure cases
- Use property-based testing to find edge cases
- Test error boundaries for critical components

---

### 3. Property-Based Tests Too Slow

**Problem:**
- Property tests take > 30 seconds
- CI/CD pipeline timeout
- Developers skip running tests

**Root Cause:**
- Too many examples (default: 100)
- Complex generators
- Missing timeout configuration

**Fix:**
```typescript
import { fc, test } from "@fast-check/vitest";

// Configure timeout and examples
test.prop({
  examples: 50, // Reduce from default 100
  timeout: 10000 // 10 seconds max
})([
  fc.record({
    bpm: fc.integer({ min: 40, max: 200 }),
    quality: fc.constantFrom("weak", "moderate", "strong")
  })
], "validates pulse data correctly", (pulseData) => {
  const result = validatePulseData(pulseData);
  expect(result.isValid).toBe(true);
});
```

**Prevention:**
- Set reasonable timeout (10-30 seconds)
- Reduce examples for complex generators
- Use `.verbose()` to identify slow cases
- Run property tests separately: `npm run test:pbt`

---

### 4. Missing Cleanup in Tests

**Problem:**
- Tests interfere with each other
- Flaky test failures
- State persists between tests

**Root Cause:**
- No cleanup in `afterEach`
- Shared mutable state
- Timers not cleared

**Fix:**
```typescript
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers();
  vi.restoreAllMocks();

  // Clear localStorage
  localStorage.clear();

  // Cleanup React components
  cleanup();
});
```

**Prevention:**
- Always use `beforeEach`/`afterEach` hooks
- Clear mocks, timers, localStorage
- Use React Testing Library's `cleanup()`

---

## Best Practices

### 1. Test File Structure

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest";

describe("DiagnosisWizard", () => {
  // Setup
  beforeEach(() => {
    // Reset state
  });

  afterEach(() => {
    // Cleanup
  });

  describe("navigation", () => {
    test("advances to next step on valid data", () => {
      // Test implementation
    });

    test("prevents advance on invalid data", () => {
      // Test implementation
    });
  });

  describe("data persistence", () => {
    test("saves draft on step completion", async () => {
      // Test implementation
    });
  });
});
```

### 2. Property-Based Testing Generators

```typescript
import { fc } from "@fast-check/vitest";

// Reusable generators
const deviceDataGenerator = fc.record({
  type: fc.constantFrom("pulse", "blood_pressure", "oxygen"),
  value: fc.integer({ min: 0, max: 300 }),
  timestamp: fc.date(),
  quality: fc.constantFrom("good", "fair", "poor")
});

const patientGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  age: fc.integer({ min: 0, max: 120 }),
  gender: fc.constantFrom("male", "female", "other")
});
```

### 3. Testing Async Functions

```typescript
test("fetches diagnosis data", async () => {
  const sessionId = "test-session-123";

  // Use await for async operations
  const result = await fetchDiagnosisData(sessionId);

  expect(result.data).toBeDefined();
  expect(result.error).toBeNull();
});
```

### 4. Component Testing Pattern

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submits diagnosis on button click", async () => {
  const user = userEvent.setup();
  const mockSubmit = vi.fn();

  render(<DiagnosisForm onSubmit={mockSubmit} />);

  // Fill form
  await user.type(screen.getByLabelText("Name"), "Test Patient");

  // Submit
  await user.click(screen.getByRole("button", { name: "Submit" }));

  // Verify
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test Patient" })
    );
  });
});
```

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-01-08 | Vitest over Jest | Faster, better ESM support, Vite integration | #62 |
| 2026-01-12 | Property-based testing with fast-check | Find edge cases automatically | #68 |
| 2026-01-20 | Separate command for property tests | Long-running, not for every commit | #80 |

## Related Files

- `sihat-tcm-web/vitest.config.ts` - Vitest configuration
- `sihat-tcm-web/src/**/*.test.ts` - Test files
- `sihat-tcm-web/src/lib/testing/` - Property-based tests

## Related Notes

- [Type Safety](./type-safety.md) - Type-safe test setup
- [Error Handling](./error-handling.md) - Testing error boundaries
- [IoT Connection Wizard](../diagnosis/iot-connection-wizard.md) - Device testing

## Commands

```bash
# Run tests in watch mode
npm run test

# Single test run (CI)
npm run test:run

# Property-based tests only
npm run test:pbt

# Coverage report
npm run test:coverage
```

## Vitest Configuration

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"]
    }
  }
});
```

## Testing Checklist

- [ ] Unit tests for utilities
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API routes
- [ ] Property-based tests for validation logic
- [ ] Error boundary tests
- [ ] Mock all external services
- [ ] Cleanup in `afterEach`
- [ ] Coverage > 80% for critical paths

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation | Claude |
