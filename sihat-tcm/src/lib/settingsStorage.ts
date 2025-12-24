import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabaseAdmin'
import { DEFAULT_SETTINGS, AdminSettings } from './settings'

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'admin-settings.json')

/**
 * Read settings from JSON file (fallback mechanism)
 */
async function readSettingsFromFile(): Promise<AdminSettings> {
    try {
        const fileContent = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8')
        const settings = JSON.parse(fileContent)
        return {
            ...DEFAULT_SETTINGS,
            ...settings,
            // Ensure background music settings exist
            backgroundMusicEnabled: settings.backgroundMusicEnabled ?? false,
            backgroundMusicUrl: settings.backgroundMusicUrl || '',
            backgroundMusicVolume: settings.backgroundMusicVolume ?? 0.5
        }
    } catch (error: any) {
        // File doesn't exist or is invalid - return defaults
        if (error.code === 'ENOENT') {
            console.log('[Settings Storage] Settings file not found, using defaults')
            return DEFAULT_SETTINGS
        }
        console.error('[Settings Storage] Error reading settings file:', error)
        return DEFAULT_SETTINGS
    }
}

/**
 * Write settings to JSON file (fallback mechanism)
 */
async function writeSettingsToFile(settings: Partial<AdminSettings>): Promise<boolean> {
    try {
        // Read existing settings first
        const existing = await readSettingsFromFile()
        const merged = { ...existing, ...settings }
        
        // Ensure background music settings have defaults
        if (merged.backgroundMusicEnabled === undefined) merged.backgroundMusicEnabled = false
        if (!merged.backgroundMusicUrl) merged.backgroundMusicUrl = merged.backgroundMusicUrl || ''
        if (merged.backgroundMusicVolume === undefined) merged.backgroundMusicVolume = 0.5
        
        // Write to file
        await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8')
        console.log('[Settings Storage] Successfully wrote settings to file:', SETTINGS_FILE_PATH)
        return true
    } catch (error: any) {
        // If directory doesn't exist, try to create it (shouldn't happen for project root, but just in case)
        if (error.code === 'ENOENT') {
            try {
                const dir = path.dirname(SETTINGS_FILE_PATH)
                await fs.mkdir(dir, { recursive: true })
                // Retry write
                const existing = await readSettingsFromFile()
                const merged = { ...existing, ...settings }
                await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8')
                console.log('[Settings Storage] Successfully wrote settings to file after creating directory')
                return true
            } catch (retryError) {
                console.error('[Settings Storage] Error writing settings file after retry:', retryError)
                return false
            }
        }
        console.error('[Settings Storage] Error writing settings file:', error)
        return false
    }
}

/**
 * Read settings from Supabase with file fallback
 */
export async function getSettingsWithFallback(): Promise<AdminSettings> {
    // Try Supabase first
    if (supabaseAdmin) {
        try {
            const { data, error } = await supabaseAdmin
                .from('admin_settings')
                .select('*')
                .single()

            if (!error && data) {
                const settings: AdminSettings = {
                    geminiApiKey: data.gemini_api_key,
                    medicalHistorySummaryPrompt: data.medical_history_summary_prompt || DEFAULT_SETTINGS.medicalHistorySummaryPrompt,
                    dietaryAdvicePrompt: data.dietary_advice_prompt || DEFAULT_SETTINGS.dietaryAdvicePrompt,
                    backgroundMusicEnabled: data.background_music_enabled ?? false,
                    backgroundMusicUrl: data.background_music_url || '',
                    backgroundMusicVolume: data.background_music_volume ?? 0.5
                }
                console.log('[Settings Storage] Loaded from Supabase')
                return settings
            }
        } catch (error) {
            console.warn('[Settings Storage] Supabase read failed, falling back to file:', error)
        }
    }

    // Fallback to file
    console.log('[Settings Storage] Using file-based storage')
    return await readSettingsFromFile()
}

/**
 * Save settings to Supabase with file fallback
 */
export async function saveSettingsWithFallback(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    let supabaseSuccess = false

    // Try Supabase first
    if (supabaseAdmin) {
        try {
            const dbPayload: any = {
                id: 1,
                updated_at: new Date().toISOString()
            }

            if (settings.geminiApiKey !== undefined) dbPayload.gemini_api_key = settings.geminiApiKey
            if (settings.medicalHistorySummaryPrompt !== undefined) dbPayload.medical_history_summary_prompt = settings.medicalHistorySummaryPrompt
            if (settings.dietaryAdvicePrompt !== undefined) dbPayload.dietary_advice_prompt = settings.dietaryAdvicePrompt
            if (settings.backgroundMusicEnabled !== undefined) dbPayload.background_music_enabled = settings.backgroundMusicEnabled
            if (settings.backgroundMusicUrl !== undefined) dbPayload.background_music_url = settings.backgroundMusicUrl
            if (settings.backgroundMusicVolume !== undefined) dbPayload.background_music_volume = settings.backgroundMusicVolume

            const { error } = await supabaseAdmin
                .from('admin_settings')
                .upsert(dbPayload)

            if (!error) {
                supabaseSuccess = true
                console.log('[Settings Storage] Saved to Supabase')
            } else {
                console.warn('[Settings Storage] Supabase save failed:', error)
            }
        } catch (error) {
            console.warn('[Settings Storage] Supabase save error, using file fallback:', error)
        }
    }

    // Always save to file as backup (and primary if Supabase fails)
    const fileSuccess = await writeSettingsToFile(settings)

    if (supabaseSuccess || fileSuccess) {
        return { success: true }
    }

    return { 
        success: false, 
        error: 'Failed to save settings to both Supabase and file' 
    }
}

