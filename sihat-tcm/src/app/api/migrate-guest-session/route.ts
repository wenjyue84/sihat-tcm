import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { migrateGuestSessionToUser } from '@/lib/actions'

/**
 * POST /api/migrate-guest-session
 * Migrate a guest diagnosis session to an authenticated user account
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { sessionToken } = body

        if (!sessionToken) {
            return NextResponse.json(
                { success: false, error: 'Session token is required' },
                { status: 400 }
            )
        }

        // Migrate the guest session
        const result = await migrateGuestSessionToUser(sessionToken, user.id)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            data: result.data
        })
    } catch (error: unknown) {
        console.error('[migrate-guest-session] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to migrate guest session'
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        )
    }
}

