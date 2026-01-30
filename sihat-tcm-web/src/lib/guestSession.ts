/**
 * Guest Session Management
 *
 * Utilities for managing guest diagnosis sessions
 * Guest sessions are stored in sessionStorage and can be migrated to authenticated users
 */

/**
 * Generate a UUID v4 with fallback for environments where crypto.randomUUID() is unavailable
 * (older browsers, non-HTTPS contexts, or SSR)
 */
function generateUUID(): string {
  // Try native crypto.randomUUID first (most efficient)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback: use crypto.getRandomValues if available
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version (4) and variant (10xx) bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback: Math.random (less secure but functional)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a unique session token for guest users
 */
export function generateGuestSessionToken(): string {
  return generateUUID();
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

