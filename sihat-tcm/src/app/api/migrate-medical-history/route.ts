import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    try {
        // Create Supabase admin client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        console.log('[Migration] Starting medical_history column migration...')

        // First, check if the column exists
        const { data: columns, error: checkError } = await supabase
            .from('profiles')
            .select('medical_history')
            .limit(1)

        if (!checkError) {
            console.log('[Migration] Column already exists!')
            return NextResponse.json({
                success: true,
                message: 'Column medical_history already exists',
                alreadyExists: true
            })
        }

        // If we get a "column does not exist" error, we need to add it
        console.log('[Migration] Column does not exist, attempting to add...')
        console.log('[Migration] Error:', checkError)

        // Try to execute raw SQL to add the column
        // Note: This requires the service role key with proper permissions
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
                ALTER TABLE public.profiles
                ADD COLUMN IF NOT EXISTS medical_history TEXT;
            `
        })

        if (error) {
            console.error('[Migration] Failed to add column via RPC:', error)

            // Return instructions for manual fix
            return NextResponse.json({
                success: false,
                error: 'Unable to add column automatically',
                message: 'Please run the SQL manually in Supabase Dashboard',
                sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_history TEXT;`,
                instructions: [
                    '1. Go to https://supabase.com/dashboard',
                    '2. Select your project',
                    '3. Click "SQL Editor" in the left sidebar',
                    '4. Paste the SQL above and click "Run"'
                ],
                errorDetails: error
            }, { status: 500 })
        }

        console.log('[Migration] Column added successfully!')

        return NextResponse.json({
            success: true,
            message: 'Column medical_history added successfully',
            data
        })

    } catch (error: any) {
        console.error('[Migration] Unexpected error:', error)
        return NextResponse.json({
            success: false,
            error: 'Migration failed',
            message: error.message,
            sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_history TEXT;`,
            instructions: [
                '1. Go to https://supabase.com/dashboard',
                '2. Select your project',
                '3. Click "SQL Editor" in the left sidebar',
                '4. Paste the SQL above and click "Run"'
            ]
        }, { status: 500 })
    }
}
