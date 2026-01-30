/**
 * Error Reporter for Sihat TCM Mobile
 * 
 * Centralized error logging and reporting utility that mirrors the web ErrorLogger pattern.
 * Provides consistent error handling across the mobile application.
 * 
 * Features:
 * - Structured error logging with context
 * - Network error handling
 * - User action error tracking
 * - Offline error queuing with AsyncStorage
 * - Development console output with formatted details
 * - Production-ready error reporting hooks
 * 
 * Usage:
 *   import { logError, logNetworkError, logUserActionError } from './errorReporter';
 *   
 *   try {
 *     await someAsyncOperation();
 *   } catch (error) {
 *     logError(error, { component: 'DiagnosisScreen', action: 'fetchDiagnosis' });
 *   }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const CONFIG = {
    MAX_QUEUED_ERRORS: 50,
    QUEUE_STORAGE_KEY: '@error_queue',
    IS_DEVELOPMENT: __DEV__,
    // Set to your monitoring endpoint in production
    MONITORING_ENDPOINT: null,
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    DEBUG: 'debug',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
};

/**
 * Formats the current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Safely extracts error message from various error types
 * @param {Error|string|unknown} error - The error to extract message from
 * @returns {string} The error message
 */
const extractErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'Unknown error';
};

/**
 * Safely extracts stack trace from an error
 * @param {Error|unknown} error - The error to extract stack from
 * @returns {string|null} The stack trace or null
 */
const extractStack = (error) => {
    if (error instanceof Error && error.stack) {
        return error.stack;
    }
    return null;
};

/**
 * Creates a structured error log entry
 * @param {Error|string|unknown} error - The error to log
 * @param {Object} context - Additional context about the error
 * @returns {Object} Structured error entry
 */
const createErrorEntry = (error, context = {}) => ({
    timestamp: getTimestamp(),
    message: extractErrorMessage(error),
    stack: extractStack(error),
    severity: context.severity || ErrorSeverity.ERROR,
    context: {
        component: context.component || 'Unknown',
        action: context.action || 'Unknown',
        userId: context.userId || null,
        sessionId: context.sessionId || null,
        ...context,
    },
    platform: 'mobile',
    appVersion: context.appVersion || '1.0.0',
});

/**
 * Logs an error to the console in development mode
 * @param {Object} errorEntry - The structured error entry
 */
const logToConsole = (errorEntry) => {
    if (!CONFIG.IS_DEVELOPMENT) return;

    const { severity, message, context, stack } = errorEntry;
    const prefix = `[${severity.toUpperCase()}]`;
    const componentInfo = context.component ? ` [${context.component}]` : '';
    const actionInfo = context.action ? ` (${context.action})` : '';

    console.group(`${prefix}${componentInfo}${actionInfo}`);
    console.log('Message:', message);
    console.log('Timestamp:', errorEntry.timestamp);

    if (Object.keys(context).length > 2) {
        console.log('Context:', context);
    }

    if (stack) {
        console.log('Stack:', stack);
    }

    console.groupEnd();
};

/**
 * Queues an error for later submission when offline
 * @param {Object} errorEntry - The structured error entry
 */
const queueError = async (errorEntry) => {
    try {
        const queuedJson = await AsyncStorage.getItem(CONFIG.QUEUE_STORAGE_KEY);
        const queued = queuedJson ? JSON.parse(queuedJson) : [];

        // Add new error to queue
        queued.push(errorEntry);

        // Trim queue if too large
        const trimmedQueue = queued.slice(-CONFIG.MAX_QUEUED_ERRORS);

        await AsyncStorage.setItem(CONFIG.QUEUE_STORAGE_KEY, JSON.stringify(trimmedQueue));
    } catch (queueError) {
        // Silently fail - we don't want error logging to cause more errors
        if (CONFIG.IS_DEVELOPMENT) {
            console.warn('[ErrorReporter] Failed to queue error:', queueError);
        }
    }
};

/**
 * Sends error to monitoring endpoint (production)
 * @param {Object} errorEntry - The structured error entry
 */
const sendToMonitoring = async (errorEntry) => {
    if (!CONFIG.MONITORING_ENDPOINT) return;

    try {
        const response = await fetch(CONFIG.MONITORING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorEntry),
        });

        if (!response.ok) {
            throw new Error(`Monitoring endpoint returned ${response.status}`);
        }
    } catch (sendError) {
        // Queue for later if sending fails
        await queueError(errorEntry);
    }
};

/**
 * Main error logging function
 * 
 * @param {Error|string|unknown} error - The error to log
 * @param {Object} context - Additional context for the error
 * @param {string} context.component - Component where error occurred
 * @param {string} context.action - Action that caused the error
 * @param {string} context.severity - Error severity level
 * @param {string} context.userId - User ID if available
 * 
 * @example
 * logError(error, { component: 'DiagnosisScreen', action: 'submitDiagnosis' });
 */
export const logError = async (error, context = {}) => {
    const errorEntry = createErrorEntry(error, context);

    // Always log to console in development
    logToConsole(errorEntry);

    // In production, send to monitoring
    if (!CONFIG.IS_DEVELOPMENT) {
        await sendToMonitoring(errorEntry);
    }

    return errorEntry;
};

/**
 * Logs a network-related error with endpoint information
 * 
 * @param {string} endpoint - The API endpoint that failed
 * @param {Error|string|unknown} error - The network error
 * @param {Object} additionalContext - Any additional context
 * 
 * @example
 * logNetworkError('/api/diagnosis', error, { method: 'POST', payload: data });
 */
export const logNetworkError = async (endpoint, error, additionalContext = {}) => {
    const context = {
        component: 'Network',
        action: `Request to ${endpoint}`,
        severity: ErrorSeverity.ERROR,
        endpoint,
        ...additionalContext,
    };

    return logError(error, context);
};

/**
 * Logs an error caused by a user action
 * 
 * @param {string} action - Description of the user action
 * @param {Error|string|unknown} error - The error that occurred
 * @param {Object} additionalContext - Any additional context
 * 
 * @example
 * logUserActionError('Captured tongue image', error, { imageSize: size });
 */
export const logUserActionError = async (action, error, additionalContext = {}) => {
    const context = {
        component: 'UserAction',
        action,
        severity: ErrorSeverity.WARNING,
        ...additionalContext,
    };

    return logError(error, context);
};

/**
 * Logs a warning (non-critical issue)
 * 
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 * 
 * @example
 * logWarning('API response was slow', { responseTime: 5000 });
 */
export const logWarning = async (message, context = {}) => {
    return logError(message, {
        ...context,
        severity: ErrorSeverity.WARNING,
    });
};

/**
 * Logs a critical error that requires immediate attention
 * 
 * @param {Error|string|unknown} error - The critical error
 * @param {Object} context - Additional context
 * 
 * @example
 * logCritical(error, { component: 'Auth', action: 'tokenRefresh' });
 */
export const logCritical = async (error, context = {}) => {
    return logError(error, {
        ...context,
        severity: ErrorSeverity.CRITICAL,
    });
};

/**
 * Retrieves and clears queued errors
 * Useful for batch sending when coming back online
 * 
 * @returns {Promise<Array>} Array of queued error entries
 */
export const getAndClearQueuedErrors = async () => {
    try {
        const queuedJson = await AsyncStorage.getItem(CONFIG.QUEUE_STORAGE_KEY);
        const queued = queuedJson ? JSON.parse(queuedJson) : [];

        // Clear the queue
        await AsyncStorage.removeItem(CONFIG.QUEUE_STORAGE_KEY);

        return queued;
    } catch (error) {
        if (CONFIG.IS_DEVELOPMENT) {
            console.warn('[ErrorReporter] Failed to get queued errors:', error);
        }
        return [];
    }
};

/**
 * Sends all queued errors to the monitoring endpoint
 * Call this when the app comes back online
 * 
 * @returns {Promise<number>} Number of errors sent
 */
export const flushQueuedErrors = async () => {
    if (!CONFIG.MONITORING_ENDPOINT) return 0;

    const errors = await getAndClearQueuedErrors();

    if (errors.length === 0) return 0;

    try {
        const response = await fetch(CONFIG.MONITORING_ENDPOINT + '/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ errors }),
        });

        if (!response.ok) {
            // Re-queue errors if sending fails
            for (const error of errors) {
                await queueError(error);
            }
            return 0;
        }

        return errors.length;
    } catch (sendError) {
        // Re-queue errors if sending fails
        for (const error of errors) {
            await queueError(error);
        }
        return 0;
    }
};

// Default export for convenience
export default {
    logError,
    logNetworkError,
    logUserActionError,
    logWarning,
    logCritical,
    getAndClearQueuedErrors,
    flushQueuedErrors,
    ErrorSeverity,
};
