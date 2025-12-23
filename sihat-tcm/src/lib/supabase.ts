import { createClient } from '@supabase/supabase-js'

const getSupabaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) {
        console.warn('Invalid or missing NEXT_PUBLIC_SUPABASE_URL, using placeholder.')
        return 'https://placeholder.supabase.co'
    }
    return url
}

const getSupabaseKey = () => {
    let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
        console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY, using placeholder.')
        return 'placeholder'
    }
    return key
}

export const supabase = createClient(getSupabaseUrl(), getSupabaseKey())
