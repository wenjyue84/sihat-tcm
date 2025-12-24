import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) {
        console.warn('Invalid or missing NEXT_PUBLIC_SUPABASE_URL, using placeholder.')
        return 'https://placeholder.supabase.co'
    }
    return url
}

const getSupabaseKey = () => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
        console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY, using placeholder.')
        return 'placeholder'
    }
    return key
}

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Must be called inside an async function as it uses next/headers.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        getSupabaseUrl(),
        getSupabaseKey(),
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
