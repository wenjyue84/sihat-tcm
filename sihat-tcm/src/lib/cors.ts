/**
 * CORS utility for Sihat TCM API routes
 * Provides standard headers for mobile cross-origin requests
 */

export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', // In production, consider restricting to specific domains
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Returns CORS headers, optionally matching the request origin
 */
export function getCorsHeaders(request?: Request) {
    const origin = request?.headers.get('origin') || '*';

    // For development, allow everything. For production, you can check against a whitelist.
    return {
        ...CORS_HEADERS,
        'Access-Control-Allow-Origin': origin,
    };
}

/**
 * Standard OPTIONS handler for preflight requests
 */
export async function handleOptions(request: Request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
    });
}
