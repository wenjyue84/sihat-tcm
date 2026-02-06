/**
 * CORS utility for Sihat TCM API routes
 * Provides standard headers for mobile cross-origin requests
 */

// Allowed origins - add your production domains here
const ALLOWED_ORIGINS = [
  "http://localhost:3100",
  "http://localhost:3000",
  "http://127.0.0.1:3100",
  "http://127.0.0.1:3000",
  // Production domains
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.CORS_ALLOWED_ORIGIN,
  // Vercel preview deployments
  /^https:\/\/sihat-tcm.*\.vercel\.app$/,
].filter(Boolean);

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Development: allow localhost
  if (process.env.NODE_ENV === "development") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-App-Token",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Returns CORS headers with validated origin
 */
export function getCorsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") ?? null;
  const allowedOrigin = isOriginAllowed(origin) ? origin : null;

  return {
    ...CORS_HEADERS,
    // Only set if origin is allowed, otherwise omit (browser will block)
    ...(allowedOrigin && { "Access-Control-Allow-Origin": allowedOrigin }),
    "Access-Control-Allow-Credentials": "true",
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
