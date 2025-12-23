import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limit storage (in-memory for edge runtime)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const dailyLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration cache
let securityConfig: {
    level: number;
    rateLimitPerMinute: number;
    rateLimitPerDay: number;
    requireAuth: boolean;
    trackPerUser: boolean;
    lastFetched: number;
} | null = null;

const CONFIG_CACHE_DURATION = 60000; // 1 minute cache

// Default security levels
const SECURITY_LEVELS = {
    1: { level: 1, rateLimitPerMinute: 20, rateLimitPerDay: 500, requireAuth: false, trackPerUser: false },
    2: { level: 2, rateLimitPerMinute: 30, rateLimitPerDay: 300, requireAuth: true, trackPerUser: false },
    3: { level: 3, rateLimitPerMinute: 15, rateLimitPerDay: 100, requireAuth: true, trackPerUser: true },
};

// Protected API routes that use Gemini
const PROTECTED_ROUTES = [
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

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

async function getSecurityConfig() {
    const now = Date.now();

    // Return cached config if still valid
    if (securityConfig && (now - securityConfig.lastFetched) < CONFIG_CACHE_DURATION) {
        return securityConfig;
    }

    // Try to fetch from Supabase
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            // Return default Level 1 if no Supabase
            return { ...SECURITY_LEVELS[1], lastFetched: now };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data } = await supabase
            .from('system_prompts')
            .select('config')
            .eq('role', 'security_config')
            .single();

        if (data?.config) {
            const level = data.config.level as 1 | 2 | 3;
            const baseConfig = SECURITY_LEVELS[level] || SECURITY_LEVELS[1];

            securityConfig = {
                ...baseConfig,
                // Allow custom overrides from config
                rateLimitPerMinute: data.config.rateLimitPerMinute || baseConfig.rateLimitPerMinute,
                rateLimitPerDay: data.config.rateLimitPerDay || baseConfig.rateLimitPerDay,
                lastFetched: now,
            };
            return securityConfig;
        }
    } catch (error) {
        console.error('[Middleware] Error fetching security config:', error);
    }

    // Default to Level 1
    securityConfig = { ...SECURITY_LEVELS[1], lastFetched: now };
    return securityConfig;
}

function checkRateLimit(
    identifier: string,
    config: { rateLimitPerMinute: number; rateLimitPerDay: number }
): { allowed: boolean; remaining: number; resetIn: number; reason?: string } {
    const now = Date.now();
    const minuteKey = `min:${identifier}`;
    const dailyKey = `day:${identifier}`;

    // Check/reset minute limit
    let minuteEntry = rateLimitStore.get(minuteKey);
    if (!minuteEntry || now > minuteEntry.resetTime) {
        minuteEntry = { count: 0, resetTime: now + 60000 };
        rateLimitStore.set(minuteKey, minuteEntry);
    }

    // Check/reset daily limit
    let dailyEntry = dailyLimitStore.get(dailyKey);
    if (!dailyEntry || now > dailyEntry.resetTime) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        dailyEntry = { count: 0, resetTime: midnight.getTime() };
        dailyLimitStore.set(dailyKey, dailyEntry);
    }

    // Check daily limit first
    if (dailyEntry.count >= config.rateLimitPerDay) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((dailyEntry.resetTime - now) / 1000),
            reason: `Daily limit of ${config.rateLimitPerDay} requests exceeded. Resets at midnight.`,
        };
    }

    // Check minute limit
    if (minuteEntry.count >= config.rateLimitPerMinute) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((minuteEntry.resetTime - now) / 1000),
            reason: `Rate limit of ${config.rateLimitPerMinute}/min exceeded. Please wait ${Math.ceil((minuteEntry.resetTime - now) / 1000)} seconds.`,
        };
    }

    // Increment counters
    minuteEntry.count++;
    dailyEntry.count++;

    return {
        allowed: true,
        remaining: config.rateLimitPerMinute - minuteEntry.count,
        resetIn: Math.ceil((minuteEntry.resetTime - now) / 1000),
    };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only process protected API routes
    if (!isProtectedRoute(pathname)) {
        return NextResponse.next();
    }

    console.log(`[Middleware] Processing protected route: ${pathname}`);

    // Get security configuration
    const config = await getSecurityConfig();
    console.log(`[Middleware] Security Level: ${config.level}`);

    // Get identifier for rate limiting
    let identifier = getClientIP(request);
    let userId: string | null = null;

    // For Level 2 & 3: Check authentication
    if (config.requireAuth) {
        // Try to get auth token from cookie or header
        const authHeader = request.headers.get('authorization');
        const supabaseToken = request.cookies.get('sb-access-token')?.value;

        if (!authHeader && !supabaseToken) {
            // Check for Supabase auth cookie pattern
            const cookies = request.cookies.getAll();
            const authCookie = cookies.find(c => c.name.includes('auth-token'));

            if (!authCookie) {
                console.log(`[Middleware] Auth required but no token found`);
                return NextResponse.json(
                    {
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED',
                        message: 'Please log in to use this feature.',
                    },
                    { status: 401 }
                );
            }
        }

        // For Level 3: Track per user instead of per IP
        if (config.trackPerUser) {
            // Extract user ID from token if possible
            // For now, use IP + a marker to indicate authenticated user
            identifier = `auth:${identifier}`;
        }
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier, config);

    if (!rateLimitResult.allowed) {
        console.log(`[Middleware] Rate limit exceeded for ${identifier}: ${rateLimitResult.reason}`);
        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: rateLimitResult.reason,
                retryAfter: rateLimitResult.resetIn,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimitResult.resetIn),
                    'X-RateLimit-Limit': String(config.rateLimitPerMinute),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(rateLimitResult.resetIn),
                },
            }
        );
    }

    // Add rate limit headers to successful response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.rateLimitPerMinute));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetIn));
    response.headers.set('X-Security-Level', String(config.level));

    return response;
}

// Configure which routes the middleware applies to
export const config = {
    matcher: '/api/:path*',
};
