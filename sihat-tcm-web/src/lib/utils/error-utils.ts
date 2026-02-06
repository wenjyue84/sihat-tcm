/**
 * Error Handling Utilities
 *
 * Helper functions for type-safe error handling
 *
 * Moved from errorUtils.ts for better organization
 */

/**
 * Safely extract error message from unknown error type
 * @param error - The error to extract message from
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

/**
 * Check if error is an instance of Error
 * @param error - The error to check
 * @returns True if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
