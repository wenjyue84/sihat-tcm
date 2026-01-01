/**
 * Data Extraction Utilities
 * 
 * Shared utilities for extracting and formatting data from various sources.
 * These functions handle type coercion and provide safe fallbacks.
 */

/**
 * Extracts a string value from various data types with a fallback.
 * 
 * Handles:
 * - String values (returns as-is)
 * - Objects with common fields (primary_pattern, type, summary)
 * - Objects that can be stringified
 * - Null/undefined (returns fallback)
 * 
 * @param val - The value to extract a string from
 * @param fallback - Default value if extraction fails (default: "")
 * @returns A string representation of the value
 * 
 * @example
 * ```typescript
 * extractString("hello") // "hello"
 * extractString({ primary_pattern: "Qi Deficiency" }) // "Qi Deficiency"
 * extractString(null) // ""
 * extractString(null, "N/A") // "N/A"
 * ```
 */
export function extractString(
  val: unknown,
  fallback: string = ""
): string {
  if (!val) return fallback;
  
  if (typeof val === "string") return val;
  
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    
    // Check for common structured data fields
    if (obj.primary_pattern) return String(obj.primary_pattern);
    if (obj.type) return String(obj.type);
    if (obj.summary) return String(obj.summary);
    
    // Convert object to formatted string
    return Object.entries(obj)
      .map(
        ([key, value]) =>
          `${key.replace(/_/g, " ")}: ${typeof value === "string" ? value : JSON.stringify(value)}`
      )
      .join("\n");
  }
  
  return String(val);
}

/**
 * Extracts a number value from various data types with a fallback.
 * 
 * @param val - The value to extract a number from
 * @param fallback - Default value if extraction fails (default: 0)
 * @returns A number representation of the value
 */
export function extractNumber(
  val: unknown,
  fallback: number = 0
): number {
  if (val === null || val === undefined) return fallback;
  
  if (typeof val === "number") {
    return isNaN(val) ? fallback : val;
  }
  
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  
  return fallback;
}

/**
 * Extracts a boolean value from various data types with a fallback.
 * 
 * @param val - The value to extract a boolean from
 * @param fallback - Default value if extraction fails (default: false)
 * @returns A boolean representation of the value
 */
export function extractBoolean(
  val: unknown,
  fallback: boolean = false
): boolean {
  if (val === null || val === undefined) return fallback;
  
  if (typeof val === "boolean") return val;
  
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  
  if (typeof val === "number") {
    return val !== 0;
  }
  
  return fallback;
}

/**
 * Safely extracts an array from various data types.
 * 
 * @param val - The value to extract an array from
 * @param fallback - Default value if extraction fails (default: [])
 * @returns An array representation of the value
 */
export function extractArray<T>(
  val: unknown,
  fallback: T[] = []
): T[] {
  if (val === null || val === undefined) return fallback;
  
  if (Array.isArray(val)) return val;
  
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  
  return fallback;
}


