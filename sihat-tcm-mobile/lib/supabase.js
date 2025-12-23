
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Move these to environment variables (e.g. .env) for production
const SUPABASE_URL = 'https://jvokcruuowmvpthubjqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b2tjcnV1b3dtdnB0aHVianFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ2MDQsImV4cCI6MjA4MDQyMDYwNH0.-pjLCO6kJzNSdZukCWkBk35KRmzPZTW7EEsMEvsO-ZI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

/**
 * Fetches a system prompt from the database.
 * If fetching fails, returns the provided fallback.
 * @param {string} role - The role key in the system_prompts table.
 * @param {string} fallback - The hardcoded fallback prompt.
 * @returns {Promise<string>}
 */
export const getSystemPrompt = async (role, fallback) => {
    try {
        const { data, error } = await supabase
            .from('system_prompts')
            .select('prompt_text')
            .eq('role', role)
            .single();

        if (error || !data) {
            console.warn(`Failed to fetch prompt for ${role}, using fallback.`);
            return fallback;
        }

        return data.prompt_text;
    } catch (err) {
        console.error(`Error fetching prompt for ${role}:`, err);
        return fallback;
    }
};
