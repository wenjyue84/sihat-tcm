// API Configuration for Sihat TCM Mobile
// The API key can be fetched from the admin dashboard or use a local fallback

// Server URL - update this to your deployed URL in production
const WEB_SERVER_URL = __DEV__
  ? 'http://192.168.0.5:3000' // Local dev server IP
  : 'https://YOUR_PRODUCTION_URL.vercel.app'; // Update this for production

// Local fallback API key (used if server is unreachable)
const FALLBACK_API_KEY = 'AIzaSyDunuw1wCDTmnuQr9KTMeuKG7v8YypVmxg';

// Cached API key (fetched from server)
let cachedApiKey = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // Cache for 5 minutes

/**
 * Fetch the API key from the web server's admin dashboard
 * This ensures both web and mobile use the same API key
 */
export async function fetchApiKey() {
  try {
    // Check cache first
    if (cachedApiKey && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      return cachedApiKey;
    }

    console.log('[apiConfig] Fetching API key from server...');
    const response = await fetch(`${WEB_SERVER_URL}/api/config/gemini-key`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000, // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.apiKey) {
      console.log('[apiConfig] API key fetched from:', data.source);
      cachedApiKey = data.apiKey;
      lastFetchTime = Date.now();
      return data.apiKey;
    } else {
      throw new Error(data.error || 'No API key in response');
    }
  } catch (error) {
    console.warn('[apiConfig] Failed to fetch API key from server:', error.message);
    console.log('[apiConfig] Using fallback API key');
    return FALLBACK_API_KEY;
  }
}

/**
 * Get the current API key (sync version for backward compatibility)
 * Returns cached key or fallback
 */
export function getApiKeySync() {
  return cachedApiKey || FALLBACK_API_KEY;
}

export const API_CONFIG = {
  // Web server URL for API key fetching
  WEB_SERVER_URL,

  // Google Generative AI - use getApiKeySync() or fetchApiKey()
  GOOGLE_API_KEY: FALLBACK_API_KEY, // Default fallback, will be updated dynamically

  // Supabase
  SUPABASE_URL: 'https://jvokcruuowmvpthubjqh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b2tjcnV1b3dtdnB0aHVianFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ2MDQsImV4cCI6MjA4MDQyMDYwNH0.-pjLCO6kJzNSdZukCWkBk35KRmzPZTW7EEsMEvsO-ZI',

  // AI Model Configuration
  DEFAULT_MODEL: 'gemini-2.0-flash',
  FALLBACK_MODEL: 'gemini-1.5-flash-latest',
};

import {
  TCM_CONSULTATION_PROMPT,
  MEDICAL_REPORT_PROMPT,
  MEDICINE_ANALYSIS_PROMPT
} from '../constants/SystemPrompts';

export {
  TCM_CONSULTATION_PROMPT,
  MEDICAL_REPORT_PROMPT,
  MEDICINE_ANALYSIS_PROMPT
};
