// Helper function to retry API calls with exponential backoff for rate limiting
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
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
}


