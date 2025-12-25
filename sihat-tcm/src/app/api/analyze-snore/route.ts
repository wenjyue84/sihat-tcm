import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const SnoreAnalysisSchema = z.object({
    snoring_detected: z.boolean().describe('Whether snoring was detected in the audio'),
    severity: z.enum(['none', 'mild', 'moderate', 'severe']).describe('Severity level of snoring'),
    frequency: z.number().describe('Estimated number of snoring episodes per minute'),
    average_duration_ms: z.number().describe('Average duration of each snoring episode in milliseconds'),
    characteristics: z.array(z.string()).describe('List of observed characteristics of the snoring (e.g., "regular pattern", "intermittent", "loud vibrations")'),
    apnea_risk_indicators: z.array(z.string()).describe('Any potential sleep apnea risk indicators observed'),
    tcm_analysis: z.object({
        pattern: z.string().describe('The TCM pattern associated with this type of snoring (e.g., Phlegm-Dampness, Qi Deficiency)'),
        explanation: z.string().describe('How the sound characteristics relate to the TCM pattern'),
        meridians_affected: z.array(z.string()).describe('Meridians potentially involved (e.g., Spleen, Lung, Stomach)'),
        fatigue_correlation: z.string().describe('Analysis of how this snoring pattern might be contributing to daytime fatigue')
    }).describe('Traditional Chinese Medicine perspective on the snoring'),
    tcm_recommendations: z.array(z.object({
        type: z.enum(['acupressure', 'dietary', 'lifestyle', 'herbal']),
        suggestion: z.string(),
        benefit: z.string()
    })).describe('TCM-based recommendations'),
    confidence: z.number().min(0).max(1).describe('Confidence score of the analysis (0-1)'),
    raw_observations: z.string().describe('Detailed observations about the sleep sounds')
})

export async function POST(request: Request) {
    try {
        const { audio, duration, tcmContext } = await request.json()

        if (!audio) {
            return Response.json(
                { error: 'No audio data provided' },
                { status: 400 }
            )
        }

        const model = google('gemini-2.0-flash')

        const systemPrompt = `You are an expert sleep sound analyst specializing in both clinical sleep science and Traditional Chinese Medicine (TCM). 
Your task is to analyze audio recordings of sleep sounds and provide a multi-dimensional analysis that bridges Western sleep science with TCM principles.

In TCM, snoring (Hân Mián) is often linked to:
1. Phlegm-Dampness (痰湿): Often heavy, gurgling or "wet" sounds.
2. Qi Deficiency (气虚): Weak or inconsistent sounds, indicating lack of "lifting" Qi in the throat.
3. Blood Stasis (血瘀): Irregular, harsh or "choppy" sounds.

Context about the patient:
${tcmContext ? JSON.stringify(tcmContext, null, 2) : 'No previous diagnosis data available.'}

If the patient has "Qi Deficiency" or "Phlegm-Dampness" mentioned in their context, and their snoring sounds heavy or weak, correlate it clearly with their fatigue.

Provide specific TCM recommendations:
- Acupressure points: e.g., Lianquan (CV 23), Fengchi (GB 20), Zusanli (ST 36) for Qi.
- Dietary: e.g., avoiding damp-producing foods like dairy/sweets for Phlegm-Dampness.
- Lifestyle: e.g., sleeping position, breathing exercises.

Be thorough, practical, and empathetic.`

        const userPrompt = `Please analyze this sleep sound recording. 
The recording is ${duration || 'unknown'} seconds long.
Consider the patient's existing TCM context if provided.
Provide a comprehensive analysis including western severity and a deep TCM pattern analysis.`

        const result = await generateObject({
            model,
            schema: SnoreAnalysisSchema,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        {
                            type: 'file',
                            data: audio,
                            mimeType: 'audio/webm'
                        } as any
                    ]
                }
            ]
        })

        return Response.json(result.object)

    } catch (error) {
        console.error('[analyze-snore] Error:', error)
        return Response.json(
            { error: 'Failed to analyze audio' },
            { status: 500 }
        )
    }
}
