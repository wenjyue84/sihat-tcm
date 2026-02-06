/**
 * Client-safe System Logger
 *
 * This module provides logging utilities that can be safely imported
 * in both client and server components.
 *
 * For server-side logging with database persistence, use system-logger.ts instead.
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";

/**
 * Console-only logging for development/debugging (synchronous).
 * Use this when you don't need database persistence.
 * Safe to use in both client and server components.
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
