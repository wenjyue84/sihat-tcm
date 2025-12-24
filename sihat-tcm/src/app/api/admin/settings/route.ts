import { NextRequest, NextResponse } from 'next/server'
import { getAdminSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET - Retrieve settings
export async function GET(request: NextRequest) {
    try {
        const settings = await getAdminSettings()
        return NextResponse.json(settings)
    } catch (error) {
        console.error('[Admin Settings GET] Error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve settings' },
            { status: 500 }
        )
    }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()

        // Map frontend camelCase to DB snake_case
        const dbPayload: any = {
            id: 1, // Singleton row
            updated_at: new Date().toISOString()
        }

        if (body.geminiApiKey !== undefined) dbPayload.gemini_api_key = body.geminiApiKey;
        if (body.medicalHistorySummaryPrompt !== undefined) dbPayload.medical_history_summary_prompt = body.medicalHistorySummaryPrompt;
        if (body.dietaryAdvicePrompt !== undefined) dbPayload.dietary_advice_prompt = body.dietaryAdvicePrompt;
        if (body.backgroundMusicEnabled !== undefined) dbPayload.background_music_enabled = body.backgroundMusicEnabled;
        if (body.backgroundMusicUrl !== undefined) dbPayload.background_music_url = body.backgroundMusicUrl;
        if (body.backgroundMusicVolume !== undefined) dbPayload.background_music_volume = body.backgroundMusicVolume;

        // Use service role client to bypass RLS if needed (though admin should have rights)
        // Upsert ensures we update the existing row or create it
        const { data, error } = await supabaseAdmin
            .from('admin_settings')
            .upsert(dbPayload)
            .select()
            .single()

        if (error) {
            console.error('[Admin Settings PUT] DB Error:', error)
            throw new Error(error.message)
        }

        // Return the updated settings (mapped back to camelCase)
        const updatedSettings = {
            geminiApiKey: data.gemini_api_key,
            medicalHistorySummaryPrompt: data.medical_history_summary_prompt || DEFAULT_SETTINGS.medicalHistorySummaryPrompt,
            dietaryAdvicePrompt: data.dietary_advice_prompt || DEFAULT_SETTINGS.dietaryAdvicePrompt,
            backgroundMusicEnabled: data.background_music_enabled ?? false,
            backgroundMusicUrl: data.background_music_url || '',
            backgroundMusicVolume: data.background_music_volume ?? 0.5
        }

        return NextResponse.json({
            success: true,
            settings: updatedSettings
        })

    } catch (error: any) {
        console.error('[Admin Settings PUT] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update settings: ' + error.message },
            { status: 500 }
        )
    }
}

