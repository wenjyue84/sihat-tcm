/**
 * Rate Limiting Library for Sihat TCM API Protection
 * Supports 3 levels of protection that can be configured from admin dashboard
 */

// Security protection levels
export type SecurityLevel = 1 | 2 | 3;

export interface SecurityConfig {
    level: SecurityLevel;
    rateLimitPerMinute: number;
    rateLimitPerDay: number;
    requireAuth: boolean;
    trackPerUser: boolean;
}

// Default security configurations for each level
export const SECURITY_LEVELS: Record<SecurityLevel, SecurityConfig> = {
    1: {
        level: 1,
        rateLimitPerMinute: 20,
        rateLimitPerDay: 500,
        requireAuth: false,
        trackPerUser: false,
    },
    2: {
        level: 2,
        rateLimitPerMinute: 30,
        rateLimitPerDay: 300,
        requireAuth: true,
        trackPerUser: false,
    },
    3: {
        level: 3,
        rateLimitPerMinute: 15,
        rateLimitPerDay: 100,
        requireAuth: true,
        trackPerUser: true,
    },
};

// In-memory rate limit store (for serverless, consider using Redis/Upstash in production)
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface DailyLimitEntry {
    count: number;
    resetTime: number;
}

// Global stores - these persist across requests in the same serverless instance
const minuteStore = new Map<string, RateLimitEntry>();
const dailyStore = new Map<string, DailyLimitEntry>();

// Cleanup old entries periodically
const cleanupInterval = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < cleanupInterval) return;

    lastCleanup = now;

    for (const [key, entry] of minuteStore.entries()) {
        if (now > entry.resetTime) {
            minuteStore.delete(key);
        }
    }

    for (const [key, entry] of dailyStore.entries()) {
        if (now > entry.resetTime) {
            dailyStore.delete(key);
        }
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number; // seconds until reset
    limit: number;
    reason?: string;
}

/**
 * Check rate limit for an identifier (IP or user ID)
 */
export function checkRateLimit(
    identifier: string,
    config: SecurityConfig
): RateLimitResult {
    cleanup();

    const now = Date.now();
    const minuteKey = `minute:${identifier}`;
    const dailyKey = `daily:${identifier}`;

    // Check minute limit
    let minuteEntry = minuteStore.get(minuteKey);
    if (!minuteEntry || now > minuteEntry.resetTime) {
        minuteEntry = { count: 0, resetTime: now + 60000 };
        minuteStore.set(minuteKey, minuteEntry);
    }

    // Check daily limit
    let dailyEntry = dailyStore.get(dailyKey);
    if (!dailyEntry || now > dailyEntry.resetTime) {
        const midnightToday = new Date();
        midnightToday.setHours(24, 0, 0, 0);
        dailyEntry = { count: 0, resetTime: midnightToday.getTime() };
        dailyStore.set(dailyKey, dailyEntry);
    }

    // Check if daily limit exceeded
    if (dailyEntry.count >= config.rateLimitPerDay) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((dailyEntry.resetTime - now) / 1000),
            limit: config.rateLimitPerDay,
            reason: 'Daily request limit exceeded',
        };
    }

    // Check if minute limit exceeded
    if (minuteEntry.count >= config.rateLimitPerMinute) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((minuteEntry.resetTime - now) / 1000),
            limit: config.rateLimitPerMinute,
            reason: 'Rate limit exceeded. Please wait before making more requests.',
        };
    }

    // Increment counters
    minuteEntry.count++;
    dailyEntry.count++;

    return {
        allowed: true,
        remaining: config.rateLimitPerMinute - minuteEntry.count,
        resetIn: Math.ceil((minuteEntry.resetTime - now) / 1000),
        limit: config.rateLimitPerMinute,
    };
}

/**
 * Get the identifier for rate limiting based on request
 */
export function getIdentifier(request: Request, userId?: string, trackPerUser?: boolean): string {
    if (trackPerUser && userId) {
        return `user:${userId}`;
    }

    // Use IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `ip:${ip}`;
}

/**
 * API routes that use Gemini and should be rate limited
 */
export const PROTECTED_API_ROUTES = [
    '/api/chat',
    '/api/report-chat',
    '/api/western-chat',
    '/api/consult',
    '/api/analyze-image',
    '/api/analyze-audio',
    '/api/summarize-inquiry',
    '/api/validate-medicine',
    '/api/test-gemini',
    '/api/test-image',
    '/api/extract-text',
    '/api/generate-infographic',
];

/**
 * Check if a path is a protected API route
 */
export function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get current usage stats for an identifier
 */
export function getUsageStats(identifier: string): {
    minuteUsage: number;
    dailyUsage: number;
    minuteLimit: number;
    dailyLimit: number;
} | null {
    const minuteEntry = minuteStore.get(`minute:${identifier}`);
    const dailyEntry = dailyStore.get(`daily:${identifier}`);

    if (!minuteEntry && !dailyEntry) {
        return null;
    }

    return {
        minuteUsage: minuteEntry?.count || 0,
        dailyUsage: dailyEntry?.count || 0,
        minuteLimit: 0, // Will be filled by caller
        dailyLimit: 0,
    };
}
