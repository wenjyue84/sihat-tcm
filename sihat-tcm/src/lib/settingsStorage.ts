import { supabaseAdmin } from './supabaseAdmin'
import { DEFAULT_SETTINGS, AdminSettings } from './settings'
import { devLog } from './systemLogger'

/**
 * Read settings from Supabase with hardcoded default fallback (Vercel-ready)
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
                    ...DEFAULT_SETTINGS,
                    geminiApiKey: data.gemini_api_key,
                    medicalHistorySummaryPrompt: data.medical_history_summary_prompt || DEFAULT_SETTINGS.medicalHistorySummaryPrompt,
                    dietaryAdvicePrompt: data.dietary_advice_prompt || DEFAULT_SETTINGS.dietaryAdvicePrompt,
                    backgroundMusicEnabled: data.background_music_enabled ?? false,
                    backgroundMusicUrl: data.background_music_url || '',
                    backgroundMusicVolume: data.background_music_volume ?? 0.5
                }
                devLog('info', 'SettingsStorage', 'Loaded from Supabase')
                return settings
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is fine
                devLog('warn', 'SettingsStorage', 'Supabase read error', { error })
            }
        } catch (error) {
            devLog('warn', 'SettingsStorage', 'Supabase read failed, using defaults', { error })
        }
    }

    // Fallback to hardcoded defaults (Vercel has no persistent disk)
    devLog('info', 'SettingsStorage', 'Using hardcoded default settings')
    return DEFAULT_SETTINGS
}

/**
 * Save settings to Supabase (Vercel-ready, no file writing)
 */
export async function saveSettingsWithFallback(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
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
                devLog('info', 'SettingsStorage', 'Successfully saved to Supabase')
                return { success: true }
            } else {
                devLog('error', 'SettingsStorage', 'Supabase save failed', { error })
                return { success: false, error: error.message }
            }
        } catch (error: any) {
            devLog('error', 'SettingsStorage', 'Supabase save exception', { error })
            return { success: false, error: error.message || 'Unknown error' }
        }
    }

    return {
        success: false,
        error: 'Supabase admin client not initialized. Cannot save settings in serverless environment.'
    }
}
