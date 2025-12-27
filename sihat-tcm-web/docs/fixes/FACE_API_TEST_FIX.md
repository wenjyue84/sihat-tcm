# Face Analysis API Test - 429 Rate Limit Fix

## Issue Summary

**Test ID**: `face_api_endpoint`
**Error**: API returned 429 (Rate Limit Exceeded)
**Category**: Step 4: Face Analysis

## Root Cause

The test was failing due to **Gemini API rate limiting**. When multiple tests run in quick succession, each making API calls to Gemini models (`gemini-1.5-pro`, `gemini-2.0-flash`), the API quota is exceeded, resulting in a 429 error.

### Why This Happens

- Multiple tests execute sequentially with only 500ms delay between them
- Each image analysis test calls the Gemini API (potentially multiple times with model fallback)
- The free tier of Gemini API has rate limits (requests per minute)
- Previous tests in the suite had already consumed the quota by the time Face Analysis runs

## Solution Implemented

### 1. **Retry Mechanism with Exponential Backoff**

Added a `retryWithBackoff` helper function that:

- Automatically retries failed API calls up to 3 times
- Only retries on 429 (rate limit) errors
- Uses exponential backoff delays: 1s → 2s → 4s
- Throws the error immediately if it's not a rate limit issue

```typescript
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes("429") || error.message?.includes("rate limit");
      const isLastAttempt = attempt === maxRetries;

      if (!isRateLimit || isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `Rate limit hit, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry failed");
};
```

### 2. **Longer Delays Between API-Intensive Tests**

Modified the test runner to add longer delays between API-heavy tests:

- **API tests** (Analysis, Generation): 2 seconds delay
- **Other tests**: 500ms delay (original)

```typescript
const isApiTest = test.category.includes("Analysis") || test.category.includes("Generation");
const delay = isApiTest ? 2000 : 500;
await new Promise((resolve) => setTimeout(resolve, delay));
```

## Benefits

✅ **Automatic recovery** from rate limit errors
✅ **No manual intervention** needed
✅ **Graceful degradation** - still fails after 3 retries if issue persists
✅ **Better test reliability** in CI/CD pipelines
✅ **Reduced API quota consumption** with intelligent delays

## Testing

To verify the fix:

1. Run the automated test suite from the test runner page
2. The Face Analysis API test should now pass or retry gracefully
3. Check the console for retry messages if rate limiting occurs

## Alternative Solutions (if issue persists)

If rate limiting continues to be a problem:

### Option 1: Increase Gemini API Quota

- Upgrade to a paid Gemini API plan with higher rate limits
- Check your quota at: https://aistudio.google.com/app/apikey

### Option 2: Run Tests in Parallel Batches

- Split tests into groups
- Add delays between batches

### Option 3: Skip API Tests in CI/CD

- Use environment variable to skip heavy API tests
- Only run them manually or on a schedule

### Option 4: Use Mock Responses for Tests

- Implement mock API responses for test runner
- Only hit real API for integration tests

## Files Modified

- `sihat-tcm-web/src/app/test-runner/page.tsx` - Added retry logic and intelligent delays

## Related Code

- `/api/analyze-image/route.ts` - The endpoint being tested
- `src/lib/modelFallback.ts` - Already has fallback logic for model errors
