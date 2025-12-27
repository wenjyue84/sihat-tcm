# Code Review Guidelines - Sihat TCM Medical Application

## Overview

This document provides guidelines for conducting code reviews on the Sihat TCM platform, balancing medical safety requirements with development velocity.

---

## 🎯 Code Review Philosophy

**Core Principle:** Code reviews are about **collaboration** and **quality**, not criticism.

**Goals:**

1. Ensure medical safety and data integrity
2. Maintain code quality and consistency
3. Share knowledge across the team
4. Catch bugs early
5. Improve overall system design

---

## ⚡ Quick Review Checklist

Use this checklist for every PR:

### Medical Safety (Critical) 🏥

- [ ] Patient data handling is secure and compliant
- [ ] Medical logic is accurate and validated
- [ ] Error handling prevents data loss or corruption
- [ ] Sensitive data is never logged or exposed
- [ ] HIPAA/privacy requirements are met

### Functionality ✅

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error messages are clear and helpful
- [ ] No regressions introduced

### Code Quality 📝

- [ ] Code is readable and maintainable
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] TypeScript types are properly used
- [ ] Comments explain "why", not "what"

### Testing 🧪

- [ ] Unit tests cover critical logic
- [ ] Integration tests for API routes
- [ ] Property-based tests for medical algorithms
- [ ] Manual testing documented

### Security 🔒

- [ ] No hardcoded secrets or API keys
- [ ] Input validation is present
- [ ] SQL injection prevented
- [ ] XSS vulnerabilities addressed
- [ ] Authentication/authorization checked

### Performance ⚡

- [ ] No unnecessary re-renders
- [ ] Database queries are optimized
- [ ] No memory leaks
- [ ] Bundle size impact is acceptable

---

## 📋 Detailed Review Guidelines

### 1. Medical Safety Review (CRITICAL)

**Patient Data Handling:**

```typescript
// ❌ BAD - Patient data in logs
console.log("Patient data:", patientData);

// ✅ GOOD - No sensitive data in logs
console.log("Processing patient diagnosis for session ID:", sessionId);
```

**Medical Logic:**

```typescript
// ❌ BAD - Hardcoded medical values
if (bloodPressure > 140) {
  return "high";
}

// ✅ GOOD - Validated against medical standards
import { BLOOD_PRESSURE_THRESHOLDS } from "@/lib/medical-standards";

if (bloodPressure > BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.HIGH) {
  return analyzeTCMPattern(patientData);
}
```

**Error Handling:**

```typescript
// ❌ BAD - Silent failure
try {
  await saveDiagnosis(data);
} catch (error) {
  // Silent error
}

// ✅ GOOD - Proper error handling
try {
  await saveDiagnosis(data);
} catch (error) {
  logger.error("Failed to save diagnosis", { sessionId, error });
  toast.error("Unable to save diagnosis. Please try again.");
  throw error; // Re-throw for caller to handle
}
```

---

### 2. TypeScript Type Safety

**Strict Typing:**

```typescript
// ❌ BAD - Using 'any'
function processDiagnosis(data: any) {
  return data.findings;
}

// ✅ GOOD - Explicit types
interface DiagnosisData {
  findings: ObservationFinding[];
  confidence: number;
  timestamp: string;
}

function processDiagnosis(data: DiagnosisData): ObservationFinding[] {
  return data.findings;
}
```

**Interface vs Type:**

```typescript
// ✅ GOOD - Use interfaces for object shapes (project rule)
interface PatientInfo {
  name: string;
  age: number;
  gender: Gender;
}

// Only use 'type' for unions, intersections, or primitives
type Gender = "male" | "female" | "other";
type PatientId = string | number;
```

---

### 3. Code Organization

**Component Structure:**

```typescript
// ✅ GOOD - Organized component structure
interface DiagnosisCardProps {
  title: string;
  observations: string[];
  confidence: number;
}

export function DiagnosisCard({ title, observations, confidence }: DiagnosisCardProps) {
  // Early returns for edge cases
  if (!observations.length) {
    return <EmptyState message="No observations available" />;
  }

  // Main render logic
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardContent>
        {observations.map((obs, i) => (
          <ObservationItem key={i} text={obs} />
        ))}
        <ConfidenceIndicator value={confidence} />
      </CardContent>
    </Card>
  );
}
```

**Business Logic Extraction:**

```typescript
// ❌ BAD - Business logic in component
function DiagnosisForm() {
  const handleSubmit = async (data) => {
    // 100 lines of complex logic here...
  };
}

// ✅ GOOD - Extract to custom hook or service
// hooks/useDiagnosisSubmission.ts
export function useDiagnosisSubmission() {
  const saveDiagnosis = async (data: DiagnosisFormData) => {
    // Complex logic here
  };

  return { saveDiagnosis, isLoading, error };
}

// Component stays simple
function DiagnosisForm() {
  const { saveDiagnosis, isLoading } = useDiagnosisSubmission();

  return <Form onSubmit={saveDiagnosis} isLoading={isLoading} />;
}
```

---

### 4. API Route Best Practices

**Proper Error Handling:**

```typescript
// app/api/analyze-image/route.ts
export async function POST(req: Request) {
  try {
    const { imageBase64, analysisType } = await req.json();

    // Validation
    if (!imageBase64 || !analysisType) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Business logic
    const result = await analyzeImage(imageBase64, analysisType);

    return Response.json(result);
  } catch (error) {
    logger.error("Image analysis failed", { error });

    return Response.json({ error: "Failed to analyze image. Please try again." }, { status: 500 });
  }
}
```

**Rate Limiting:**

```typescript
// ✅ GOOD - Implement rate limiting for AI endpoints
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rateLimitResult = await rateLimit(req);

  if (!rateLimitResult.success) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  // Continue with request...
}
```

---

### 5. Performance Considerations

**Avoid Unnecessary Re-renders:**

```typescript
// ❌ BAD - Inline functions and objects create new references
<Button onClick={() => handleClick(id)}>Click</Button>

// ✅ GOOD - Use useCallback and useMemo
const handleClick = useCallback(() => {
  processData(id);
}, [id]);

<Button onClick={handleClick}>Click</Button>
```

**Database Queries:**

```typescript
// ❌ BAD - N+1 query problem
const sessions = await supabase.from("sessions").select("*");
for (const session of sessions) {
  const diagnoses = await supabase.from("diagnoses").select("*").eq("session_id", session.id);
}

// ✅ GOOD - Single query with join
const sessions = await supabase
  .from("sessions")
  .select("*, diagnoses(*)")
  .order("created_at", { ascending: false });
```

---

### 6. Security Review

**Environment Variables:**

```typescript
// ❌ BAD - Exposing server-side secrets to client
<div>API Key: {process.env.GEMINI_API_KEY}</div>

// ✅ GOOD - Only NEXT_PUBLIC_ vars are exposed to client
<div>App URL: {process.env.NEXT_PUBLIC_APP_URL}</div>
```

**SQL Injection Prevention:**

```typescript
// ❌ BAD - Raw SQL with user input
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;

// ✅ GOOD - Parameterized queries (Supabase does this automatically)
const { data } = await supabase.from("users").select("*").eq("email", userEmail);
```

**XSS Prevention:**

```typescript
// ❌ BAD - Rendering unescaped HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD - React automatically escapes strings
<div>{userInput}</div>

// If you need Markdown, use a sanitizer
import ReactMarkdown from 'react-markdown';
<ReactMarkdown>{userInput}</ReactMarkdown>
```

---

## 🚦 Review Severity Levels

Use these labels when reviewing:

### 🔴 BLOCKER (Must fix before merge)

- Security vulnerabilities
- Patient data leaks
- Breaking changes without migration
- Missing critical error handling
- Type safety violations (using `any`)

### 🟡 MAJOR (Should fix before merge)

- Code duplication
- Poor naming conventions
- Missing tests for critical logic
- Performance issues
- Accessibility issues

### 🟢 MINOR (Nice to have)

- Code style improvements (Prettier handles most)
- Better variable names
- Additional comments
- Refactoring suggestions

### 💡 SUGGESTION (Optional)

- Alternative approaches
- Future enhancements
- Educational notes

---

## 💬 Review Comment Examples

### ❌ BAD Comments (Vague, Demanding)

```
"This is wrong."
"Change this."
"Why did you do it this way?"
```

### ✅ GOOD Comments (Specific, Collaborative)

**Blocker:**

```
🔴 BLOCKER: Patient data is being logged on line 42.
This violates our privacy policy. Please remove or mask sensitive fields.

Suggestion:
logger.info('Diagnosis saved', { sessionId, timestamp });
```

**Major:**

```
🟡 MAJOR: This query could cause N+1 problem as the user list grows.
Consider using a single query with a join to fetch all data at once.

Example: https://supabase.com/docs/guides/api/joins
```

**Minor:**

```
🟢 MINOR: Consider extracting this logic into a `useDiagnosisAnalysis` hook
for better reusability and testability.

Not blocking, but would improve maintainability.
```

**Suggestion:**

```
💡 SUGGESTION: You could simplify this with optional chaining:
const confidence = analysisResult?.confidence ?? 0;

Feel free to keep your current approach if you prefer.
```

---

## 🎯 What to Focus On

### High Priority (Always Review)

1. Medical safety and data integrity
2. Security vulnerabilities
3. Breaking changes
4. Error handling for critical paths
5. TypeScript type safety

### Medium Priority (Review when time permits)

1. Code organization and structure
2. Performance implications
3. Test coverage
4. Accessibility
5. User experience

### Low Priority (Automated by tools)

1. Code formatting (Prettier handles this)
2. Basic linting (ESLint handles this)
3. TypeScript compilation (CI checks this)

---

## ⏱️ Review Time Guidelines

### Small PR (< 100 lines)

- **Expected time:** 10-15 minutes
- **Focus:** Functionality and safety

### Medium PR (100-500 lines)

- **Expected time:** 20-40 minutes
- **Focus:** Architecture and design patterns

### Large PR (> 500 lines)

- **Expected time:** 1-2 hours
- **Suggestion:** Ask author to split into smaller PRs

**Rule of Thumb:** If a PR takes more than 2 hours to review, it's too large.

---

## 🤝 Review Process

### As a Reviewer

1. **Read the PR description** - Understand the context
2. **Check CI status** - All automated checks should pass
3. **Review code files** - Start with critical files first
4. **Test locally** (for important changes) - Pull the branch and test
5. **Leave constructive feedback** - Be specific and helpful
6. **Approve or request changes** - Be clear about severity

### As an Author

1. **Write a clear PR description** - What, why, and how
2. **Self-review first** - Catch obvious issues before requesting review
3. **Keep PRs small** - Easier to review and less risky
4. **Respond to feedback** - Address comments or explain your reasoning
5. **Request re-review** - After making changes

---

## 📊 PR Description Template

Use this template for your PRs:

```markdown
## 🎯 What does this PR do?

[Brief description of the change]

## 🏥 Medical Safety Impact

- [ ] No impact on patient data
- [ ] Affects medical logic (describe how)
- [ ] Changes data storage (migration needed?)

## 🧪 Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

**Manual Test Steps:**

1. Navigate to...
2. Click...
3. Verify...

## 🔗 Related Issues

Closes #123
Relates to #456

## 📸 Screenshots (if applicable)

[Add screenshots for UI changes]

## ⚠️ Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe migration path)

## 📝 Checklist

- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Changelog updated (if needed)
```

---

## 🛑 Common Issues to Watch For

### 1. **Missing Error Boundaries**

```typescript
// Add error boundaries for component trees
<ErrorBoundary fallback={<ErrorMessage />}>
  <DiagnosisForm />
</ErrorBoundary>
```

### 2. **Unhandled Promise Rejections**

```typescript
// ❌ BAD
async function fetchData() {
  const result = await api.getData(); // Can throw
  return result;
}

// ✅ GOOD
async function fetchData() {
  try {
    const result = await api.getData();
    return result;
  } catch (error) {
    logger.error("Failed to fetch data", { error });
    throw error;
  }
}
```

### 3. **Memory Leaks**

```typescript
// ❌ BAD - Event listener not cleaned up
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);

// ✅ GOOD - Cleanup function
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [handleResize]);
```

### 4. **Circular Dependencies**

```typescript
// ❌ BAD - Colors imported from App.js (mobile)
import { Colors } from "../App";

// ✅ GOOD - Colors from constants
import { Colors } from "../constants/Colors";
```

---

## 🎓 Learning Opportunities

Code reviews are a chance to:

- Learn new patterns and techniques
- Share knowledge across the team
- Improve code quality together
- Build team culture

**Remember:** Everyone makes mistakes. The goal is continuous improvement!

---

## 📚 Additional Resources

- [Project Code Rules](/.agent/GEMINI.md)
- [Development Workflow](/PHASE8_IMPLEMENTATION_SUMMARY.md)
- [Developer Manual](/DEVELOPER_MANUAL.md)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Next.js Documentation](https://nextjs.org/docs)

---

## ✨ Summary

Good code reviews:

- ✅ Focus on medical safety first
- ✅ Are specific and constructive
- ✅ Balance perfectionism with pragmatism
- ✅ Foster collaboration and learning
- ✅ Improve code quality over time

Remember: **Code reviews are about code, not people.** Be kind, be thorough, and help each other build a better product! 🚀
