/**
 * Guest Session Management
 *
 * Utilities for managing guest diagnosis sessions
 * Guest sessions are stored in sessionStorage and can be migrated to authenticated users
 */

/**
 * Generate a unique session token for guest users
 */
export function generateGuestSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Save guest session token to sessionStorage
 * @param token - The session token to save
 */
export function saveGuestSessionToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("guest_session_token", token);
  }
}

/**
 * Get guest session token from sessionStorage
 * @returns The session token or null if not found
 */
export function getGuestSessionToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("guest_session_token");
  }
  return null;
}

/**
 * Clear guest session token from sessionStorage
 */
export function clearGuestSessionToken(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("guest_session_token");
  }
}

/**
 * Check if a session token exists
 * @returns True if a guest session token exists
 */
export function hasGuestSessionToken(): boolean {
  return getGuestSessionToken() !== null;
}
