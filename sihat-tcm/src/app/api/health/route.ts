import { getCorsHeaders } from '@/lib/cors';

export async function GET(req: Request) {
    return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    }, {
        headers: getCorsHeaders(req)
    });
}

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(req)
    });
}
