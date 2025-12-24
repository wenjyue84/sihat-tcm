import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const getSupabaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) {
        return 'https://placeholder.supabase.co'
    }
    return url
}

const getSupabaseKey = () => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
        return 'placeholder'
    }
    return key
}

/**
 * Updates the Supabase auth session on each request.
 * This ensures tokens are refreshed before they expire.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        getSupabaseUrl(),
        getSupabaseKey(),
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE
    // This refreshes the auth session if it's expired and updates cookies
    // Calling getUser() is critical for the session refresh to work
    await supabase.auth.getUser()

    return supabaseResponse
}
