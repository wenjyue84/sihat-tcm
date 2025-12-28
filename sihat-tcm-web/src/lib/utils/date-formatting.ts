/**
 * Date Formatting Utilities
 * 
 * Shared utilities for formatting dates consistently across the application.
 */

/**
 * Maps language codes to locale strings for date formatting.
 */
const localeMap: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  ms: "ms-MY",
};

/**
 * Formats a date string to a readable format.
 * 
 * @param dateString - ISO date string or date string
 * @param options - Formatting options
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatDate("2024-01-15") // "Jan 15, 2024"
 * formatDate("2024-01-15", { includeTime: true }) // "Jan 15, 2024, 10:30 AM"
 * formatDate("2024-01-15", { format: "short" }) // "1/15/2024"
 * formatDate("2024-01-15", { language: "zh" }) // Uses Chinese locale
 * ```
 */
export function formatDate(
  dateString: string,
  options: {
    includeTime?: boolean;
    format?: "long" | "short" | "relative" | "full";
    locale?: string;
    language?: "en" | "zh" | "ms";
  } = {}
): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }

    const { 
      includeTime = false, 
      format = "long", 
      locale,
      language 
    } = options;

    // Determine locale: language code takes precedence, then explicit locale, then default
    const finalLocale = language 
      ? localeMap[language] || "en-US"
      : locale || "en-US";

    if (format === "relative") {
      return formatRelativeDate(date);
    }

    if (format === "short") {
      return date.toLocaleDateString(finalLocale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        ...(includeTime && {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    }

    if (format === "full") {
      return date.toLocaleDateString(finalLocale, {
        month: "long",
        day: "numeric",
        year: "numeric",
        ...(includeTime && {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    }

    // Default: long format (short month name)
    return date.toLocaleDateString(finalLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime && {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    });
  } catch (error) {
    console.warn("[formatDate] Error formatting date:", error);
    return dateString; // Return original on error
  }
}

/**
 * Formats a date as a relative time string (e.g., "2 days ago", "in 3 hours").
 * 
 * @param date - Date object or date string
 * @returns Relative time string
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  }
}

/**
 * Formats a date range (start and end dates).
 * 
 * @param startDate - Start date string
 * @param endDate - End date string (optional)
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string,
  endDate?: string
): string {
  const start = formatDate(startDate, { format: "short" });
  
  if (!endDate) {
    return start;
  }

  const end = formatDate(endDate, { format: "short" });
  
  // If same date, return single date
  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}

/**
 * Formats a date for use in file names (YYYY-MM-DD).
 * 
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForFilename(date: Date | string = new Date()): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

