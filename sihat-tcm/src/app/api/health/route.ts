import { getCorsHeaders } from '@/lib/cors';
import { createClient } from '@/lib/supabase/server';

// Use performance.now() if available (Node.js 16+), otherwise fallback to Date.now()
const getPerformanceNow = (): number => {
    if (typeof performance !== 'undefined' && performance.now) {
        return performance.now();
    }
    return Date.now();
};

interface HealthCheckResult {
    status: 'ok' | 'slow' | 'down';
    responseTime: number;
    message?: string;
}

interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    environment: string;
    checks: {
        database: HealthCheckResult;
        aiApi: {
            gemini: HealthCheckResult;
            claude: HealthCheckResult;
        };
        memory: {
            used: number;
            total: number;
            percentage: number;
            status: 'ok' | 'warning' | 'critical';
        };
    };
    responseTime: number;
}

/**
 * Check database connectivity with a lightweight query
 */
async function checkDatabase(): Promise<HealthCheckResult> {
    const startTime = getPerformanceNow();
    try {
        const supabase = await createClient();
        // Use a lightweight query - just check if we can connect
        const { error } = await supabase
            .from('system_logs')
            .select('id')
            .limit(1);

        const responseTime = getPerformanceNow() - startTime;

        if (error) {
            return {
                status: 'down',
                responseTime: Math.round(responseTime),
                message: error.message,
            };
        }

        // Consider slow if > 2 seconds
        const status = responseTime > 2000 ? 'slow' : 'ok';
        return {
            status,
            responseTime: Math.round(responseTime),
        };
    } catch (error) {
        const responseTime = getPerformanceNow() - startTime;
        return {
            status: 'down',
            responseTime: Math.round(responseTime),
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check AI API availability by verifying API keys exist
 * Note: We don't make actual API calls to avoid costs, just check if keys are configured
 */
function checkAIAPI(): { gemini: HealthCheckResult; claude: HealthCheckResult } {
    const startTime = getPerformanceNow();

    // Check Gemini API key
    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiStatus: HealthCheckResult = {
        status: geminiKey && geminiKey.length > 0 ? 'ok' : 'down',
        responseTime: Math.round(performance.now() - startTime),
        message: geminiKey ? undefined : 'GEMINI_API_KEY not configured',
    };

    // Check Claude/Anthropic API key
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const claudeStatus: HealthCheckResult = {
        status: claudeKey && claudeKey.length > 0 ? 'ok' : 'down',
        responseTime: Math.round(getPerformanceNow() - startTime),
        message: claudeKey ? undefined : 'ANTHROPIC_API_KEY not configured',
    };

    return {
        gemini: geminiStatus,
        claude: claudeStatus,
    };
}

/**
 * Get memory usage information
 */
function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
    status: 'ok' | 'warning' | 'critical';
} {
    if (typeof process === 'undefined' || !process.memoryUsage) {
        // Client-side or unsupported environment
        return {
            used: 0,
            total: 0,
            percentage: 0,
            status: 'ok',
        };
    }

    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    // Determine status based on memory usage
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (percentage > 90) {
        status = 'critical';
    } else if (percentage > 75) {
        status = 'warning';
    }

    return {
        used: Math.round(used / 1024 / 1024), // Convert to MB
        total: Math.round(total / 1024 / 1024), // Convert to MB
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
        status,
    };
}

/**
 * Determine overall health status based on individual checks
 */
function determineOverallStatus(checks: HealthResponse['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    // Unhealthy if database is down
    if (checks.database.status === 'down') {
        return 'unhealthy';
    }

    // Unhealthy if both AI APIs are down
    if (checks.aiApi.gemini.status === 'down' && checks.aiApi.claude.status === 'down') {
        return 'unhealthy';
    }

    // Degraded if database is slow, or memory is critical, or one AI API is down
    if (
        checks.database.status === 'slow' ||
        checks.memory.status === 'critical' ||
        (checks.aiApi.gemini.status === 'down' || checks.aiApi.claude.status === 'down')
    ) {
        return 'degraded';
    }

    // Degraded if memory is warning
    if (checks.memory.status === 'warning') {
        return 'degraded';
    }

    return 'healthy';
}

export async function GET(req: Request) {
    const overallStartTime = getPerformanceNow();

    try {
        // Run all checks in parallel for faster response
        const [databaseCheck, aiApiCheck] = await Promise.all([
            checkDatabase(),
            Promise.resolve(checkAIAPI()), // Already synchronous, but keeping pattern consistent
        ]);

        const memoryUsage = getMemoryUsage();
        const overallResponseTime = Math.round(getPerformanceNow() - overallStartTime);

        const checks: HealthResponse['checks'] = {
            database: databaseCheck,
            aiApi: aiApiCheck,
            memory: memoryUsage,
        };

        const overallStatus = determineOverallStatus(checks);

        const response: HealthResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            checks,
            responseTime: overallResponseTime,
        };

        // Return 200 even if degraded/unhealthy - let monitoring systems interpret the status
        // Only return 500 for actual server errors
        return Response.json(response, {
            headers: getCorsHeaders(req),
        });
    } catch (error) {
        // If health check itself fails, return unhealthy status
        const overallResponseTime = Math.round(getPerformanceNow() - overallStartTime);
        const errorResponse: HealthResponse = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            checks: {
                database: {
                    status: 'down',
                    responseTime: 0,
                    message: 'Health check failed',
                },
                aiApi: {
                    gemini: {
                        status: 'down',
                        responseTime: 0,
                        message: 'Health check failed',
                    },
                    claude: {
                        status: 'down',
                        responseTime: 0,
                        message: 'Health check failed',
                    },
                },
                memory: {
                    used: 0,
                    total: 0,
                    percentage: 0,
                    status: 'critical',
                },
            },
            responseTime: overallResponseTime,
        };

        return Response.json(errorResponse, {
            status: 500,
            headers: getCorsHeaders(req),
        });
    }
}

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(req),
    });
}
