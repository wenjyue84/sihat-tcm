import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getGeminiApiKey } from './settings';

/**
 * Get a Google provider instance configured with the appropriate API key.
 * Uses custom API key from admin settings if available, otherwise falls back to env var.
 */
export function getGoogleProvider() {
    const apiKey = getGeminiApiKey();
    return createGoogleGenerativeAI({ apiKey });
}
