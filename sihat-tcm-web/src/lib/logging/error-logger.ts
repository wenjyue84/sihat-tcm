/**
 * @fileoverview Client-Side Error Logger
 *
 * Utility for logging errors to the system monitoring API from client-side code.
 * Provides a simple interface for tracking errors, user actions, and system events.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { LogErrorRequest, ErrorSeverity } from "@/types/monitoring";

/**
 * Error logger configuration
 */
interface ErrorLoggerConfig {
  apiEndpoint: string;
  enableConsoleLog: boolean;
  enableAutoCapture: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorLoggerConfig = {
  apiEndpoint: "/api/admin/system-health",
  enableConsoleLog: true,
  enableAutoCapture: true,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Error context for additional information
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  severity?: ErrorSeverity;
}

/**
 * Error Logger Class
 */
class ErrorLogger {
  private config: ErrorLoggerConfig;
  private sessionId: string;
  private isInitialized: boolean = false;

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (typeof window !== "undefined" && this.config.enableAutoCapture) {
      this.setupAutoCapture();
    }
  }

  /**
   * Initialize the error logger
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") {
      return;
    }

    this.setupAutoCapture();
    this.isInitialized = true;

    if (this.config.enableConsoleLog) {
      console.log("ErrorLogger initialized with session:", this.sessionId);
    }
  }

  /**
   * Log an error manually
   */
  public async logError(
    error: Error | string,
    context: ErrorContext = {}
  ): Promise<string | null> {
    try {
      const errorData = this.prepareErrorData(error, context);
      const errorId = await this.sendErrorToAPI(errorData);

      if (this.config.enableConsoleLog) {
        console.log("Error logged:", errorId, errorData);
      }

      return errorId;
    } catch (loggingError) {
      if (this.config.enableConsoleLog) {
        console.error("Failed to log error:", loggingError);
      }
      return null;
    }
  }

  /**
   * Log a user action that resulted in an error
   */
  public async logUserActionError(
    action: string,
    error: Error | string,
    context: Omit<ErrorContext, "action"> = {}
  ): Promise<string | null> {
    return this.logError(error, {
      ...context,
      action,
      severity: context.severity || "medium",
    });
  }

  /**
   * Log a network/API error
   */
  public async logNetworkError(
    endpoint: string,
    error: Error | string,
    context: ErrorContext = {}
  ): Promise<string | null> {
    return this.logError(error, {
      ...context,
      component: "NetworkRequest",
      action: `API_${endpoint}`,
      severity: context.severity || "high",
      metadata: {
        ...context.metadata,
        endpoint,
        networkError: true,
      },
    });
  }

  /**
   * Log a validation error
   */
  public async logValidationError(
    field: string,
    error: Error | string,
    context: ErrorContext = {}
  ): Promise<string | null> {
    return this.logError(error, {
      ...context,
      component: "Validation",
      action: `VALIDATE_${field}`,
      severity: context.severity || "low",
      metadata: {
        ...context.metadata,
        field,
        validationError: true,
      },
    });
  }

  /**
   * Log a performance issue
   */
  public async logPerformanceIssue(
    operation: string,
    duration: number,
    threshold: number,
    context: ErrorContext = {}
  ): Promise<string | null> {
    const error = `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`;
    
    return this.logError(error, {
      ...context,
      component: "Performance",
      action: `SLOW_${operation}`,
      severity: context.severity || "medium",
      metadata: {
        ...context.metadata,
        duration,
        threshold,
        performanceIssue: true,
      },
    });
  }

  /**
   * Setup automatic error capture
   */
  private setupAutoCapture(): void {
    // Capture unhandled JavaScript errors
    window.addEventListener("error", (event) => {
      this.logError(event.error || event.message, {
        component: "GlobalErrorHandler",
        action: "UNHANDLED_ERROR",
        severity: "high",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          autoCapture: true,
        },
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError(event.reason, {
        component: "GlobalErrorHandler",
        action: "UNHANDLED_PROMISE_REJECTION",
        severity: "high",
        metadata: {
          autoCapture: true,
          promiseRejection: true,
        },
      });
    });

    // Capture network errors (fetch failures)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log failed HTTP requests
        if (!response.ok) {
          this.logNetworkError(
            args[0] as string,
            `HTTP ${response.status}: ${response.statusText}`,
            {
              severity: response.status >= 500 ? "high" : "medium",
              metadata: {
                status: response.status,
                statusText: response.statusText,
                autoCapture: true,
              },
            }
          );
        }
        
        return response;
      } catch (error) {
        this.logNetworkError(
          args[0] as string,
          error as Error,
          {
            severity: "critical",
            metadata: {
              autoCapture: true,
              fetchError: true,
            },
          }
        );
        throw error;
      }
    };
  }

  /**
   * Prepare error data for API
   */
  private prepareErrorData(
    error: Error | string,
    context: ErrorContext
  ): LogErrorRequest {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    
    return {
      error_type: errorObj.name || "ClientError",
      message: errorObj.message,
      stack_trace: errorObj.stack,
      component: context.component,
      user_id: context.userId || this.getUserId(),
      session_id: context.sessionId || this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      severity: context.severity || "medium",
      metadata: {
        ...context.metadata,
        action: context.action,
        clientSide: true,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        viewport: typeof window !== "undefined" ? {
          width: window.innerWidth,
          height: window.innerHeight,
        } : undefined,
      },
    };
  }

  /**
   * Send error data to API with retry logic
   */
  private async sendErrorToAPI(
    errorData: LogErrorRequest,
    attempt: number = 1
  ): Promise<string | null> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.error_id || null;
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.sendErrorToAPI(errorData, attempt + 1);
      }

      // Log to console as fallback
      if (this.config.enableConsoleLog) {
        console.error("Failed to send error to API after retries:", error, errorData);
      }

      return null;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Get user ID from authentication context
   */
  private getUserId(): string | undefined {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      // Try to get from Supabase auth
      const authData = localStorage.getItem("supabase.auth.token");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ErrorLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Initialize error logger (call this in your app initialization)
 */
export const initializeErrorLogger = (config?: Partial<ErrorLoggerConfig>) => {
  if (config) {
    errorLogger.updateConfig(config);
  }
  errorLogger.initialize();
};

/**
 * Convenience functions for common error logging scenarios
 */
export const logError = (error: Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, context);

export const logUserActionError = (action: string, error: Error | string, context?: Omit<ErrorContext, "action">) =>
  errorLogger.logUserActionError(action, error, context);

export const logNetworkError = (endpoint: string, error: Error | string, context?: ErrorContext) =>
  errorLogger.logNetworkError(endpoint, error, context);

export const logValidationError = (field: string, error: Error | string, context?: ErrorContext) =>
  errorLogger.logValidationError(field, error, context);

export const logPerformanceIssue = (operation: string, duration: number, threshold: number, context?: ErrorContext) =>
  errorLogger.logPerformanceIssue(operation, duration, threshold, context);

/**
 * Higher-order function to wrap async functions with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await errorLogger.logError(error as Error, {
        ...context,
        action: context.action || fn.name || "WRAPPED_FUNCTION",
      });
      throw error;
    }
  }) as T;
}

/**
 * Decorator for class methods (if using TypeScript decorators)
 */
export function LogErrors(context: ErrorContext = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        await errorLogger.logError(error as Error, {
          ...context,
          component: context.component || target.constructor.name,
          action: context.action || propertyName,
        });
        throw error;
      }
    };
  };
}


