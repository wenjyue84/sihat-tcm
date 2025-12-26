import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is developer or admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['developer', 'admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const level = searchParams.get('level');
        const category = searchParams.get('category');
        const since = searchParams.get('since');

        // Build query
        let query = supabase
            .from('system_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(Math.min(limit, 200)); // Cap at 200 to prevent abuse

        if (level && ['info', 'warn', 'error', 'debug'].includes(level)) {
            query = query.eq('level', level);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (since) {
            query = query.gt('timestamp', since);
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error('[API/logs] Query error:', error);
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        return NextResponse.json({
            logs: logs || [],
            count: logs?.length || 0,
            fetchedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[API/logs] Exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Allow inserting logs via API (useful for client-side logging)
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { level, category, message, metadata, userId } = body;

        if (!level || !category || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: level, category, message' },
                { status: 400 }
            );
        }

        if (!['info', 'warn', 'error', 'debug'].includes(level)) {
            return NextResponse.json(
                { error: 'Invalid level. Must be: info, warn, error, or debug' },
                { status: 400 }
            );
        }

        const { error } = await supabase.from('system_logs').insert({
            level,
            category,
            message,
            metadata: metadata || {},
            user_id: userId || null,
        });

        if (error) {
            console.error('[API/logs] Insert error:', error);
            return NextResponse.json({ error: 'Failed to insert log' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[API/logs] Exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
