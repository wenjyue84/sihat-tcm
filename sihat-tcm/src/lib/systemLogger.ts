import { createClient } from "@/lib/supabase/server";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Console-only logging for development/debugging (synchronous).
 * Use this when you don't need database persistence.
 */
export function devLog(
  level: LogLevel,
  category: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!isDev && level !== "error") return;

  const prefix = `[${level.toUpperCase()}] [${category}]`;
  const consoleMethod = level === "debug" ? "log" : level;

  if (metadata) {
    console[consoleMethod](prefix, message, metadata);
  } else {
    console[consoleMethod](prefix, message);
  }
}

/**
 * Insert a log entry into the system_logs table.
 * This function is fire-and-forget to avoid blocking API responses.
 */
export async function log(entry: LogEntry): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("system_logs").insert({
      level: entry.level,
      category: entry.category,
      message: entry.message,
      metadata: entry.metadata || {},
      user_id: entry.userId || null,
    });

    if (error) {
      // Fallback to console if DB insert fails
      console.error("[SystemLogger] Failed to insert log:", error.message);
      console.log(`[${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`);
    }
  } catch (err) {
    // Silent failure - don't let logging break the app
    console.error("[SystemLogger] Exception:", err);
  }
}

/**
 * Log an info-level message
 */
export async function logInfo(
  category: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return log({ level: "info", category, message, metadata, userId });
}

/**
 * Log a warning-level message
 */
export async function logWarn(
  category: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return log({ level: "warn", category, message, metadata, userId });
}

/**
 * Log an error-level message
 */
export async function logError(
  category: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return log({ level: "error", category, message, metadata, userId });
}

/**
 * Log a debug-level message (typically only in development)
 */
export async function logDebug(
  category: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  // Only log debug messages in development
  if (process.env.NODE_ENV !== "production") {
    return log({ level: "debug", category, message, metadata, userId });
  }
}
