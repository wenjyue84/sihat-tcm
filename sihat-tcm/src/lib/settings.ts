import fs from 'fs';
import path from 'path';

// File to store admin settings (in production, use database)
const SETTINGS_FILE = path.join(process.cwd(), 'admin-settings.json');

interface AdminSettings {
    geminiApiKey?: string;
    medicalHistorySummaryPrompt?: string;
    dietaryAdvicePrompt?: string;
    [key: string]: unknown;
}

/**
 * Read admin settings from the JSON file
 */
export function getAdminSettings(): AdminSettings {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading settings file:', error);
    }
    return {};
}

/**
 * Get the Gemini API key from admin settings or fall back to environment variable
 */
export function getGeminiApiKey(): string {
    const settings = getAdminSettings();

    // Use custom API key if set, otherwise fall back to environment variable
    if (settings.geminiApiKey) {
        return settings.geminiApiKey;
    }

    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
}

/**
 * Check if a custom API key is configured (vs using env var)
 */
export function hasCustomApiKey(): boolean {
    const settings = getAdminSettings();
    return !!settings.geminiApiKey;
}
