/**
 * Client-side logger utility with environment checks.
 * Only logs in development mode to keep production clean.
 *
 * Usage:
 *   import { logger } from '@/lib/logging';
 *   logger.info('MyComponent', 'User clicked button', { userId: 123 });
 *   logger.error('MyComponent', 'Failed to fetch data', error);
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  /** Force logging even in production (use sparingly) */
  force?: boolean;
}

const isDev = process.env.NODE_ENV === "development";

const LOG_COLORS = {
  debug: "#6B7280", // gray
  info: "#3B82F6", // blue
  warn: "#F59E0B", // amber
  error: "#EF4444", // red
} as const;

function formatMessage(level: LogLevel, category: string, message: string): string {
  return `[${level.toUpperCase()}] [${category}] ${message}`;
}

function shouldLog(level: LogLevel, options?: LoggerOptions): boolean {
  if (options?.force) return true;
  if (!isDev) return level === "error"; // Only log errors in production
  return true;
}

function logWithStyle(
  level: LogLevel,
  category: string,
  message: string,
  data?: unknown,
  options?: LoggerOptions
): void {
  if (!shouldLog(level, options)) return;

  const formattedMessage = formatMessage(level, category, message);
  const color = LOG_COLORS[level];
  const style = `color: ${color}; font-weight: bold;`;

  const consoleMethod = level === "debug" ? "log" : level;

  if (typeof window !== "undefined") {
    // Browser environment - use styled console
    if (data !== undefined) {
      console[consoleMethod](`%c${formattedMessage}`, style, data);
    } else {
      console[consoleMethod](`%c${formattedMessage}`, style);
    }
  } else {
    // Server environment (SSR) - plain console
    if (data !== undefined) {
      console[consoleMethod](formattedMessage, data);
    } else {
      console[consoleMethod](formattedMessage);
    }
  }
}

export const logger = {
  /**
   * Debug level - for detailed debugging info, only in development
   */
  debug(category: string, message: string, data?: unknown, options?: LoggerOptions): void {
    logWithStyle("debug", category, message, data, options);
  },

  /**
   * Info level - for general information, only in development
   */
  info(category: string, message: string, data?: unknown, options?: LoggerOptions): void {
    logWithStyle("info", category, message, data, options);
  },

  /**
   * Warn level - for warnings, only in development
   */
  warn(category: string, message: string, data?: unknown, options?: LoggerOptions): void {
    logWithStyle("warn", category, message, data, options);
  },

  /**
   * Error level - for errors, logged in all environments
   */
  error(category: string, message: string, data?: unknown, options?: LoggerOptions): void {
    logWithStyle("error", category, message, data, options);
  },

  /**
   * Group related logs together (development only)
   */
  group(label: string, fn: () => void): void {
    if (!isDev) {
      fn();
      return;
    }
    console.group(label);
    fn();
    console.groupEnd();
  },

  /**
   * Log a table (development only)
   */
  table(category: string, data: unknown[]): void {
    if (!isDev) return;
    console.log(`[TABLE] [${category}]`);
    console.table(data);
  },

  /**
   * Time an operation (development only)
   */
  time(label: string): void {
    if (!isDev) return;
    console.time(label);
  },

  timeEnd(label: string): void {
    if (!isDev) return;
    console.timeEnd(label);
  },
};

/**
 * Create a scoped logger for a specific component/module
 */
export function createLogger(category: string) {
  return {
    debug: (message: string, data?: unknown, options?: LoggerOptions) =>
      logger.debug(category, message, data, options),
    info: (message: string, data?: unknown, options?: LoggerOptions) =>
      logger.info(category, message, data, options),
    warn: (message: string, data?: unknown, options?: LoggerOptions) =>
      logger.warn(category, message, data, options),
    error: (message: string, data?: unknown, options?: LoggerOptions) =>
      logger.error(category, message, data, options),
  };
}

export default logger;
