import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File to store admin settings (in production, use database)
const SETTINGS_FILE = path.join(process.cwd(), 'admin-settings.json')

// Default settings
const DEFAULT_SETTINGS = {
    medicalHistorySummaryPrompt: `You are a medical assistant helping patients summarize their medical history for doctor consultations.

Based on the patient's previous TCM diagnosis reports and uploaded medical documents, create a clear, concise medical history summary that:

1. Lists main health complaints and patterns
2. Mentions relevant TCM diagnoses and syndrome patterns
3. Notes important findings from medical reports
4. Highlights chronic conditions or ongoing treatments
5. Uses simple, patient-friendly language

The summary should be 3-5 sentences that the patient can easily share with their doctor.

Previous Diagnosis History:
{inquiries}

Medical Reports:
{reports}

Generate a concise medical history summary:`,
    dietaryAdvicePrompt: `You are a TCM dietary expert capable of advising patients on what foods to eat or avoid based on their diagnosis.

Context:
Patient Profile: {profile}
Latest Diagnosis: {diagnosis}
Latest Dietary Advice: {advice}

User Question: {question}

Please answer the user's question based on the above context.
If the food is beneficial, explain why in TCM terms (e.g., tonifies Qi, clears heat).
If the food should be avoided, explain why (e.g., adds dampness, too cold).
If it depends, explain the conditions.
Keep the answer concise and helpful.`
}

// Helper to read settings
function getSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
            return JSON.parse(data)
        }
    } catch (error) {
        console.error('Error reading settings file:', error)
    }
    return DEFAULT_SETTINGS
}

// Helper to save settings
function saveSettings(settings: any) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
        return true
    } catch (error) {
        console.error('Error saving settings file:', error)
        return false
    }
}

// GET - Retrieve settings
export async function GET(request: NextRequest) {
    try {
        const settings = getSettings()
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

        // Get current settings
        const currentSettings = getSettings()

        // Merge with new settings
        const updatedSettings = {
            ...currentSettings,
            ...body
        }

        // Save to file
        const success = saveSettings(updatedSettings)

        if (success) {
            return NextResponse.json({
                success: true,
                settings: updatedSettings
            })
        } else {
            return NextResponse.json(
                { error: 'Failed to save settings' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('[Admin Settings PUT] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
