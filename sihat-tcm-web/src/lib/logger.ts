import pino from 'pino';

/**
 * Centralized logger instance with PII redaction and environment-aware formatting.
 *
 * Features:
 * - Development: Pretty-printed console logs for readability
 * - Production: Structured JSON logs for log aggregation services
 * - Automatic redaction of sensitive fields (password, token, patient_ic, phone, etc.)
 * - Prevents PII leakage in production logs
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * logger.error({ err, context: 'diagnosis' }, 'Failed to analyze image');
 * logger.warn({ patientIc: 'REDACTED' }, 'Sensitive data access'); // patient_ic will be auto-redacted
 * ```
 */

interface LoggerConfig {
    level: string;
    redact: {
        paths: string[];
        censor: string;
    };
    formatters?: {
        level?: (label: string) => { level: string };
    };
    transport?: {
        target: string;
        options: {
            colorize?: boolean;
            translateTime?: string;
            ignore?: string;
            singleLine?: boolean;
        };
    };
}

// Sensitive fields that must be redacted in all logs
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'patient_ic',
    'patientIc',
    'phone',
    'phoneNumber',
    'phone_number',
    'ic_number',
    'icNumber',
    'nric',
    'passport',
    'email', // Optional: Remove if you need to log emails for debugging
    'secret',
];

// Base configuration shared across all environments
const baseConfig: LoggerConfig = {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: SENSITIVE_FIELDS,
        censor: '[REDACTED]', // What to show instead of the actual value
    },
};

// Create logger based on environment
const createLogger = (): pino.Logger => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';

    if (isTest) {
        // Silent logging during tests (or use 'debug' if you need test logs)
        return pino({
            ...baseConfig,
            level: 'silent',
        });
    }

    if (isDevelopment) {
        // Pretty logging for development
        return pino({
            ...baseConfig,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                    singleLine: false,
                },
            },
        });
    }

    // Production: Structured JSON logs
    return pino({
        ...baseConfig,
        formatters: {
            level: (label) => {
                return { level: label };
            },
        },
    });
};

// Export the singleton logger instance
export const logger = createLogger();

// Type-safe logging helpers for common patterns
export const loggers = {
    /**
     * Log API request start
     */
    apiStart: (method: string, path: string, metadata?: Record<string, unknown>) => {
        logger.info({ method, path, ...metadata }, `API ${method} ${path} - Start`);
    },

    /**
     * Log API request success
     */
    apiSuccess: (method: string, path: string, durationMs: number, metadata?: Record<string, unknown>) => {
        logger.info({ method, path, durationMs, ...metadata }, `API ${method} ${path} - Success`);
    },

    /**
     * Log API request error
     */
    apiError: (method: string, path: string, error: Error, metadata?: Record<string, unknown>) => {
        logger.error({ method, path, err: error, ...metadata }, `API ${method} ${path} - Error`);
    },

    /**
     * Log AI/LLM interactions
     */
    aiInteraction: (action: string, model: string, metadata?: Record<string, unknown>) => {
        logger.info({ action, model, ...metadata }, `AI ${action} using ${model}`);
    },

    /**
     * Log database operations
     */
    dbOperation: (operation: string, table: string, metadata?: Record<string, unknown>) => {
        logger.debug({ operation, table, ...metadata }, `DB ${operation} on ${table}`);
    },

    /**
     * Log authentication events
     */
    authEvent: (event: string, userId?: string, metadata?: Record<string, unknown>) => {
        logger.info({ event, userId, ...metadata }, `Auth: ${event}`);
    },

    /**
     * Log security-related events
     */
    securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, unknown>) => {
        const logFn = severity === 'critical' || severity === 'high' ? logger.error : logger.warn;
        logFn({ event, severity, ...metadata }, `Security: ${event}`);
    },
};

// Re-export logger methods for convenience
export const { info, warn, error, debug, trace, fatal } = logger;
