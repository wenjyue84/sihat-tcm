/**
 * LEGACY FILE - Kept for backward compatibility with API routes.
 *
 * For new code, please use:
 * - Client components: import { supabase } from '@/lib/supabase/client'
 * - Server actions/routes: import { createClient } from '@/lib/supabase/server'
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { devLog } from './systemLogger'

const getSupabaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) {
        devLog('warn', 'Supabase', 'Invalid or missing NEXT_PUBLIC_SUPABASE_URL, using placeholder.')
        return 'https://placeholder.supabase.co'
    }
    return url
}

const getSupabaseKey = () => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
        devLog('warn', 'Supabase', 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY, using placeholder.')
        return 'placeholder'
    }
    return key
}

/**
 * Basic Supabase client for API routes that don't need user authentication.
 * Used primarily for fetching public data like system prompts.
 * 
 * For authenticated operations, use:
 * - Client: @/lib/supabase/client
 * - Server: @/lib/supabase/server
 */
export const supabase = createSupabaseClient(getSupabaseUrl(), getSupabaseKey())
