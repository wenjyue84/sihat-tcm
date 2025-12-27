/**
 * Centralized error handling system for Sihat TCM.
 *
 * Provides standardized error types with proper HTTP status codes and logging context.
 * Distinguishes between operational errors (expected, recoverable) and programming errors (bugs).
 *
 * Usage:
 * ```typescript
 * import { AppError, ErrorCode } from '@/lib/exceptions';
 *
 * // Throw a specific error
 * throw new AppError(
 *   'Failed to analyze image: AI service timeout',
 *   ErrorCode.AI_SERVICE_TIMEOUT,
 *   503
 * );
 *
 * // In API routes
 * try {
 *   // ... operation
 * } catch (error) {
 *   if (error instanceof AppError) {
 *     return Response.json(
 *       { error: error.message, code: error.code },
 *       { status: error.statusCode }
 *     );
 *   }
 *   // Handle unexpected errors
 *   return Response.json(
 *     { error: 'Internal server error' },
 *     { status: 500 }
 *   );
 * }
 * ```
 */

/**
 * Base application error class
 */
export class AppError extends Error {
    /**
     * Creates a new AppError instance
     *
     * @param message - Human-readable error message (shown to developers, not end users)
     * @param code - Machine-readable error code for client handling
     * @param statusCode - HTTP status code (default: 500)
     * @param isOperational - True if this is an expected error (e.g., validation failure, API timeout)
     *                        False if this is a programming error/bug that should crash the process
     * @param metadata - Additional context for debugging (automatically redacted by logger)
     */
    constructor(
        public message: string,
        public code: string,
        public statusCode: number = 500,
        public isOperational: boolean = true,
        public metadata?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }

        // Ensure prototype chain is correct (TypeScript requirement)
        Object.setPrototypeOf(this, AppError.prototype);
    }

    /**
     * Converts error to a JSON-serializable object for API responses
     */
    toJSON(): {
        error: string;
        code: string;
        statusCode: number;
        metadata?: Record<string, unknown>;
    } {
        return {
            error: this.message,
            code: this.code,
            statusCode: this.statusCode,
            ...(this.metadata && { metadata: this.metadata }),
        };
    }
}

/**
 * Standard error codes used throughout the application
 * Format: [DOMAIN]_[SPECIFIC_ERROR]
 */
export const ErrorCode = {
    // AI/LLM Service Errors (5xx)
    AI_SERVICE_TIMEOUT: 'AI_SERVICE_TIMEOUT',
    AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
    AI_RATE_LIMIT_EXCEEDED: 'AI_RATE_LIMIT_EXCEEDED',
    AI_CONTENT_POLICY_VIOLATION: 'AI_CONTENT_POLICY_VIOLATION',
    AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
    AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',

    // Authentication & Authorization Errors (401, 403)
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

    // Validation Errors (400)
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',

    // Resource Errors (404, 409)
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

    // Database Errors (500)
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_QUERY_FAILED: 'DB_QUERY_FAILED',
    DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
    DB_TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',

    // File/Upload Errors (400, 413)
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED',

    // External Service Errors (502, 503, 504)
    EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
    EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

    // Business Logic Errors (400, 422)
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
    INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

    // Medical Domain Errors (400, 422)
    DIAGNOSIS_INCOMPLETE_DATA: 'DIAGNOSIS_INCOMPLETE_DATA',
    DIAGNOSIS_INVALID_OBSERVATION: 'DIAGNOSIS_INVALID_OBSERVATION',
    MEDICAL_HISTORY_INVALID: 'MEDICAL_HISTORY_INVALID',

    // Rate Limiting (429)
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // Generic Errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * TypeScript type for all error codes
 */
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ============================================================
// Specialized Error Classes (for common patterns)
// ============================================================

/**
 * Validation error - thrown when client input is invalid
 */
export class ValidationError extends AppError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, ErrorCode.VALIDATION_FAILED, 400, true, metadata);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Authentication error - thrown when user is not authenticated
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required', metadata?: Record<string, unknown>) {
        super(message, ErrorCode.AUTH_UNAUTHORIZED, 401, true, metadata);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Authorization error - thrown when user lacks permissions
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions', metadata?: Record<string, unknown>) {
        super(message, ErrorCode.AUTH_FORBIDDEN, 403, true, metadata);
        this.name = 'AuthorizationError';
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}

/**
 * Not found error - thrown when a resource doesn't exist
 */
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string | number, metadata?: Record<string, unknown>) {
        const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
        super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, true, { resource, id, ...metadata });
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * Conflict error - thrown when a resource already exists
 */
export class ConflictError extends AppError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, ErrorCode.RESOURCE_ALREADY_EXISTS, 409, true, metadata);
        this.name = 'ConflictError';
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * Rate limit error - thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
    constructor(
        message: string = 'Rate limit exceeded. Please try again later.',
        retryAfter?: number,
        metadata?: Record<string, unknown>
    ) {
        super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, { retryAfter, ...metadata });
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * AI service error - thrown when AI/LLM operations fail
 */
export class AIServiceError extends AppError {
    constructor(message: string, code: string = ErrorCode.AI_SERVICE_UNAVAILABLE, metadata?: Record<string, unknown>) {
        const statusCode = code === ErrorCode.AI_RATE_LIMIT_EXCEEDED ? 429 : 503;
        super(message, code, statusCode, true, metadata);
        this.name = 'AIServiceError';
        Object.setPrototypeOf(this, AIServiceError.prototype);
    }
}

/**
 * Database error - thrown when database operations fail
 */
export class DatabaseError extends AppError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, ErrorCode.DB_QUERY_FAILED, 500, true, metadata);
        this.name = 'DatabaseError';
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/**
 * External service error - thrown when third-party APIs fail
 */
export class ExternalServiceError extends AppError {
    constructor(
        service: string,
        message: string,
        code: string = ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        metadata?: Record<string, unknown>
    ) {
        super(message, code, 503, true, { service, ...metadata });
        this.name = 'ExternalServiceError';
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}

// ============================================================
// Error Handler Utilities
// ============================================================

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Type guard to check if an error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
    if (isAppError(error)) {
        return error.isOperational;
    }
    return false;
}

/**
 * Convert any error to AppError for consistent handling
 */
export function toAppError(error: unknown): AppError {
    if (isAppError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR, 500, false, {
            originalError: error.name,
            stack: error.stack,
        });
    }

    return new AppError(
        'An unexpected error occurred',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
        false,
        {
            originalError: String(error),
        }
    );
}

/**
 * Helper to create standardized API error responses
 */
export function createErrorResponse(
    error: unknown,
    options?: {
        /** Whether to include stack trace (only in development) */
        includeStack?: boolean;
        /** Whether to include metadata */
        includeMetadata?: boolean;
    }
): Response {
    const appError = toAppError(error);
    const isDevelopment = process.env.NODE_ENV === 'development';

    const body: Record<string, unknown> = {
        error: appError.message,
        code: appError.code,
    };

    if (options?.includeMetadata && appError.metadata) {
        body.metadata = appError.metadata;
    }

    if (options?.includeStack && isDevelopment && appError.stack) {
        body.stack = appError.stack;
    }

    return Response.json(body, {
        status: appError.statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
