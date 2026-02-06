/**
 * Server-side System Logger
 *
 * This module provides logging utilities with database persistence.
 * IMPORTANT: Only import this in server components and API routes.
 *
 * For client components, use: import { devLog } from "@/lib/logging/client-safe"
 */

import { createClient } from "@/lib/supabase/server";

// Re-export devLog from client-safe module for backward compatibility
export { devLog } from "./client-safe";
export type { LogLevel } from "./client-safe";

export interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
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
