"use client";

import { createBrowserClient } from "@supabase/ssr";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.startsWith("http")) {
    console.warn("Invalid or missing NEXT_PUBLIC_SUPABASE_URL, using placeholder.");
    return "https://placeholder.supabase.co";
  }
  return url;
};

const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY, using placeholder.");
    return "placeholder";
  }
  return key;
};

/**
 * Creates a Supabase client for browser/client components.
 * Uses @supabase/ssr to properly sync auth state via cookies.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseKey());
}

// Default export for backward compatibility
export const supabase = createClient();
