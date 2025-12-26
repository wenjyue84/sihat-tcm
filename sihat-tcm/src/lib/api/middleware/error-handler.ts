/**
 * Centralized API Error Handler
 * 
 * Provides consistent error handling across all API routes.
 * This reduces code duplication and ensures uniform error responses.
 */

import { devLog } from '@/lib/systemLogger';
import { parseApiError } from '@/lib/modelFallback';
import { getCorsHeaders } from '@/lib/cors';

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
  [key: string]: unknown; // Allow additional fields for specific routes
}

/**
 * Standard error response format
 */
export function createErrorResponse(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>
): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  devLog('error', context, 'Request error', { error: errorMessage });

  const { userFriendlyError, errorCode } = parseApiError(error);

  const response: ApiErrorResponse = {
    error: userFriendlyError,
    code: errorCode,
    ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    ...additionalData,
  };

  return new Response(JSON.stringify(response), {
    status: 500,
    headers: {
      ...getCorsHeaders(new Request('http://localhost')),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Wraps an API handler with consistent error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
  context: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, context);
    }
  };
}

/**
 * Creates a standardized error response with custom status code
 */
export function createErrorResponseWithStatus(
  error: unknown,
  context: string,
  status: number = 500,
  additionalData?: Record<string, unknown>
): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  devLog('error', context, 'Request error', { error: errorMessage, status });

  const { userFriendlyError, errorCode } = parseApiError(error);

  const response: ApiErrorResponse = {
    error: userFriendlyError,
    code: errorCode,
    ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    ...additionalData,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      ...getCorsHeaders(new Request('http://localhost')),
      'Content-Type': 'application/json',
    },
  });
}

