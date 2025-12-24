/**
 * Supabase Client Export Index
 * 
 * Usage:
 * - Client components: import { supabase } from '@/lib/supabase/client'
 * - Server actions/API routes: import { createClient } from '@/lib/supabase/server'
 * - Middleware: import { updateSession } from '@/lib/supabase/middleware'
 */

export { supabase, createClient as createBrowserClient } from './client'
export { createClient } from './server'
export { updateSession } from './middleware'
