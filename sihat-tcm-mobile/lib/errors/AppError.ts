/**
 * Enhanced Application Error System for Mobile
 * 
 * Provides structured error handling with proper typing and context
 * Synchronized with web application error system
 */

import { ERROR_CODES } from '../../constants';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  deviceInfo?: {
    platform: string;
    version: string | number;
    model?: string;
  };
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  context?: ErrorContext;
  originalError?: Error;
  timestamp: number;
  stack?: string;
}

/**
 * Base Application Error Class for Mobile
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly timestamp: number;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    context?: ErrorContext,
    originalError?: Error,
    isOperational = true
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = Date.now();
    this.isOperational = isOperational;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } as any,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ERROR_CODES.AUTHENTICATION_ERROR:
        return 'Please log in to continue.';
      case ERROR_CODES.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ERROR_CODES.NOT_FOUND:
        return 'The requested resource was not found.';
      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please try again later.';
      case ERROR_CODES.AI_MODEL_ERROR:
        return 'AI service is temporarily unavailable. Please try again.';
      case ERROR_CODES.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      case ERROR_CODES.NOTIFICATION_ERROR:
        return 'Notification service is temporarily unavailable.';
      case ERROR_CODES.DEVICE_ERROR:
        return 'Device connection error. Please check your device settings.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.VALIDATION_ERROR, message, context, originalError);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.AUTHENTICATION_ERROR, message, context, originalError);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.AUTHORIZATION_ERROR, message, context, originalError);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.NOT_FOUND, message, context, originalError);
    this.name = 'NotFoundError';
  }
}

/**
 * AI Model Error
 */
export class AIModelError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.AI_MODEL_ERROR, message, context, originalError);
    this.name = 'AIModelError';
  }
}

/**
 * Network Error
 */
export class NetworkError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.NETWORK_ERROR, message, context, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, context, originalError);
    this.name = 'RateLimitError';
  }
}

/**
 * Notification Error
 */
export class NotificationError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.NOTIFICATION_ERROR, message, context, originalError);
    this.name = 'NotificationError';
  }
}

/**
 * Device Error
 */
export class DeviceError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(ERROR_CODES.DEVICE_ERROR, message, context, originalError);
    this.name = 'DeviceError';
  }
}

/**
 * Error Factory for creating appropriate error types
 */
export class ErrorFactory {
  static createFromCode(
    code: string,
    message: string,
    context?: ErrorContext,
    originalError?: Error
  ): AppError {
    switch (code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return new ValidationError(message, context, originalError);
      case ERROR_CODES.AUTHENTICATION_ERROR:
        return new AuthenticationError(message, context, originalError);
      case ERROR_CODES.AUTHORIZATION_ERROR:
        return new AuthorizationError(message, context, originalError);
      case ERROR_CODES.NOT_FOUND:
        return new NotFoundError(message, context, originalError);
      case ERROR_CODES.AI_MODEL_ERROR:
        return new AIModelError(message, context, originalError);
      case ERROR_CODES.NETWORK_ERROR:
        return new NetworkError(message, context, originalError);
      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        return new RateLimitError(message, context, originalError);
      case ERROR_CODES.NOTIFICATION_ERROR:
        return new NotificationError(message, context, originalError);
      case ERROR_CODES.DEVICE_ERROR:
        return new DeviceError(message, context, originalError);
      default:
        return new AppError(code, message, context, originalError);
    }
  }

  static fromUnknownError(
    error: unknown,
    context?: ErrorContext,
    defaultMessage = 'An unexpected error occurred'
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        error.message || defaultMessage,
        context,
        error
      );
    }

    return new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      defaultMessage,
      context
    );
  }
}

/**
 * Error Handler Utility for Mobile
 */
export class ErrorHandler {
  /**
   * Handle error with appropriate logging and user notification
   */
  static handle(error: AppError, options?: {
    showToUser?: boolean;
    logToConsole?: boolean;
    reportToService?: boolean;
  }): void {
    const {
      showToUser = true,
      logToConsole = true,
      reportToService = true,
    } = options || {};

    // Log to console in development
    if (logToConsole && __DEV__) {
      console.error('AppError:', error.toJSON());
    }

    // Report to error reporting service (Crashlytics, Sentry, etc.)
    if (reportToService && error.isOperational) {
      this.reportError(error);
    }

    // Show user-friendly message (via toast or alert)
    if (showToUser) {
      this.showUserError(error);
    }
  }

  /**
   * Report error to external service
   */
  private static reportError(error: AppError): void {
    // In a real application, you would send this to your error reporting service
    // For now, we'll just log it
    console.log('Reporting error to service:', error.toJSON());
    
    // Example: Crashlytics.recordError(error);
    // Example: Sentry.captureException(error);
  }

  /**
   * Show user-friendly error message
   */
  private static showUserError(error: AppError): void {
    // In a real application, you would show this via toast/notification system
    // This would be implemented by the UI layer
    console.log('User error message:', error.getUserMessage());
  }
}

/**
 * Async error wrapper for better error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = ErrorFactory.fromUnknownError(error, context as ErrorContext);
      ErrorHandler.handle(appError);
      throw appError;
    }
  };
}

/**
 * Sync error wrapper
 */
export function withSyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => R,
  context?: Partial<ErrorContext>
) {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      const appError = ErrorFactory.fromUnknownError(error, context as ErrorContext);
      ErrorHandler.handle(appError);
      throw appError;
    }
  };
}