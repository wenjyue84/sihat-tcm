import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Required system prompt roles for the AI to function correctly
const REQUIRED_PROMPT_ROLES = [
    'doctor_chat',
    'doctor_tongue',
    'doctor_face',
    'doctor_body',
    'doctor_listening',
    'doctor_inquiry_summary',
    'doctor_final',
];

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({
                connected: false,
                error: 'Supabase configuration missing',
                promptsStatus: [],
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Test connection with a simple query
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (testError) {
            return NextResponse.json({
                connected: false,
                error: testError.message,
                promptsStatus: [],
            });
        }

        // Check system prompts
        const { data: prompts, error: promptsError } = await supabase
            .from('system_prompts')
            .select('role, prompt_text')
            .in('role', REQUIRED_PROMPT_ROLES);

        const existingRoles = new Set(prompts?.map(p => p.role) || []);

        const promptsStatus = REQUIRED_PROMPT_ROLES.map(role => ({
            role,
            exists: existingRoles.has(role),
            hasContent: prompts?.find(p => p.role === role)?.prompt_text?.length > 0 || false,
        }));

        // Count users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Count admin users
        const { count: adminCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin');

        // Count diagnosis sessions
        const { count: diagnosisCount } = await supabase
            .from('diagnosis_sessions')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            connected: true,
            promptsStatus,
            stats: {
                totalUsers: userCount || 0,
                adminUsers: adminCount || 0,
                totalDiagnoses: diagnosisCount || 0,
            },
        });

    } catch (error) {
        console.error('Database health check error:', error);
        return NextResponse.json({
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            promptsStatus: [],
        }, { status: 500 });
    }
}
