/**
 * API Utilities
 * 
 * Centralized utilities for API route development.
 * 
 * @example
 * ```typescript
 * import { withErrorHandler, validateRequestBody } from '@/lib/api';
 * 
 * export async function POST(req: Request) {
 *   return withErrorHandler(async () => {
 *     const validation = await validateRequestBody(req, schema, 'API/endpoint');
 *     if (!validation.success) return validation.response;
 *     
 *     // Your handler logic
 *   }, 'API/endpoint')();
 * }
 * ```
 */

export * from './middleware';
export * from './handlers';

