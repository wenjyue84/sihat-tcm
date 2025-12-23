import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Language instruction templates
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
    en: `You MUST respond entirely in English. Be clear, friendly, and educational.`,
    zh: `你必须完全使用简体中文回复。语言要清晰、友好、有教育性。`,
    ms: `Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan bersifat mendidik.`,
};

// Fallback model cascade - if primary model fails, try these in order
const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
];

export async function POST(req: Request) {
    try {
        // Accept 'model' directly like /api/chat does (this is the working pattern)
        const { messages, reportData, patientInfo, language = 'en', model = 'gemini-2.0-flash' } = await req.json();

        console.log(`[API /api/report-chat] Received request with model: ${model}, language: ${language}`);

        // Build context from the report data
        const reportContext = buildReportContext(reportData, patientInfo);

        const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

        const systemPrompt = `${languageInstruction}

You are a helpful TCM (Traditional Chinese Medicine) assistant helping a patient understand their diagnosis report.

═══════════════════════════════════════════════════════════════════════════════
                          PATIENT'S TCM DIAGNOSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

${reportContext}

═══════════════════════════════════════════════════════════════════════════════

YOUR ROLE:
1. Answer questions about the patient's TCM diagnosis in an easy-to-understand way
2. Explain medical/TCM terminology simply
3. Provide educational context about TCM concepts (Yin/Yang, Qi, Five Elements, etc.)
4. Clarify the reasoning behind food recommendations, lifestyle advice, and treatments
5. Be encouraging and supportive while maintaining accuracy
6. If asked about something not in the report, politely explain you can only discuss the current diagnosis

GUIDELINES:
- Keep responses concise but informative (2-4 paragraphs max)
- Use analogies to explain complex TCM concepts
- Be empathetic and reassuring
- Do NOT provide medical advice beyond what's in the report
- Encourage them to consult a licensed TCM practitioner for personalized treatment
- Never diagnose new conditions or change the assessment

Remember: You're here to help them understand their existing report, not to conduct new consultations.`;

        // Convert messages to the format expected by the model
        const formattedMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.content
        }));

        console.log(`[API /api/report-chat] Calling streamText with model: ${model}`);

        // Try the requested model first
        try {
            const result = streamText({
                model: google(model),
                system: systemPrompt,
                messages: formattedMessages,
                onFinish: (completion) => {
                    console.log(`[API /api/report-chat] Stream finished with ${model}. Text length: ${completion.text.length}`);
                },
            });

            return result.toTextStreamResponse();
        } catch (primaryError: any) {
            console.error(`[API /api/report-chat] Primary model ${model} failed:`, primaryError.message);

            // Try fallback models in order
            for (const fallbackModel of FALLBACK_MODELS) {
                // Skip if it's the same as the failed model
                if (fallbackModel === model) continue;

                try {
                    console.log(`[API /api/report-chat] Attempting fallback model: ${fallbackModel}`);
                    const fallbackResult = streamText({
                        model: google(fallbackModel),
                        system: systemPrompt,
                        messages: formattedMessages,
                        onFinish: (completion) => {
                            console.log(`[API /api/report-chat] Fallback ${fallbackModel} finished. Text length: ${completion.text.length}`);
                        },
                    });

                    return fallbackResult.toTextStreamResponse();
                } catch (fallbackError: any) {
                    console.error(`[API /api/report-chat] Fallback ${fallbackModel} also failed:`, fallbackError.message);
                    // Continue to next fallback
                }
            }

            // All models failed
            throw new Error(`All models failed. Primary error: ${primaryError.message}`);
        }
    } catch (error: any) {
        console.error("[API /api/report-chat] Fatal Error:", error);
        return new Response(JSON.stringify({
            error: error.message || 'Report chat API error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function buildReportContext(reportData: any, patientInfo: any): string {
    let context = '';

    // Patient Information
    if (patientInfo) {
        context += `PATIENT INFORMATION:
- Name: ${patientInfo.name || 'Not provided'}
- Age: ${patientInfo.age || 'Not provided'}
- Gender: ${patientInfo.gender || 'Not provided'}
- Chief Complaint: ${patientInfo.symptoms || 'Not provided'}
`;
    }

    // Diagnosis
    if (reportData.diagnosis) {
        const diagnosis = typeof reportData.diagnosis === 'string'
            ? reportData.diagnosis
            : reportData.diagnosis.primary_pattern || JSON.stringify(reportData.diagnosis);
        context += `\nMAIN DIAGNOSIS (辨证): ${diagnosis}\n`;

        if (typeof reportData.diagnosis === 'object') {
            if (reportData.diagnosis.secondary_patterns?.length > 0) {
                context += `Secondary Patterns: ${reportData.diagnosis.secondary_patterns.join(', ')}\n`;
            }
            if (reportData.diagnosis.affected_organs?.length > 0) {
                context += `Affected Organs: ${reportData.diagnosis.affected_organs.join(', ')}\n`;
            }
        }
    }

    // Constitution
    if (reportData.constitution) {
        const constitution = typeof reportData.constitution === 'string'
            ? reportData.constitution
            : reportData.constitution.type || JSON.stringify(reportData.constitution);
        context += `\nCONSTITUTION TYPE: ${constitution}\n`;

        if (typeof reportData.constitution === 'object' && reportData.constitution.description) {
            context += `Description: ${reportData.constitution.description}\n`;
        }
    }

    // Analysis
    if (reportData.analysis) {
        const analysis = typeof reportData.analysis === 'string'
            ? reportData.analysis
            : reportData.analysis.summary || JSON.stringify(reportData.analysis);
        context += `\nFINAL ANALYSIS (综合诊断): ${analysis}\n`;

        if (typeof reportData.analysis === 'object' && reportData.analysis.pattern_rationale) {
            context += `Rationale: ${reportData.analysis.pattern_rationale}\n`;
        }
    }

    // Recommendations
    if (reportData.recommendations) {
        context += '\nRECOMMENDATIONS:\n';

        if (reportData.recommendations.food_therapy?.beneficial?.length > 0) {
            context += `- Beneficial Foods: ${reportData.recommendations.food_therapy.beneficial.join(', ')}\n`;
        }
        if (reportData.recommendations.food || [].length > 0) {
            context += `- Recommended Foods: ${reportData.recommendations.food.join(', ')}\n`;
        }
        if (reportData.recommendations.food_therapy?.avoid?.length > 0) {
            context += `- Foods to Avoid: ${reportData.recommendations.food_therapy.avoid.join(', ')}\n`;
        }
        if (reportData.recommendations.avoid?.length > 0) {
            context += `- Avoid: ${reportData.recommendations.avoid.join(', ')}\n`;
        }
        if (reportData.recommendations.lifestyle?.length > 0) {
            context += `- Lifestyle Advice: ${reportData.recommendations.lifestyle.join('; ')}\n`;
        }
        if (reportData.recommendations.acupoints?.length > 0) {
            context += `- Acupressure Points: ${reportData.recommendations.acupoints.join(', ')}\n`;
        }
        if (reportData.recommendations.exercise?.length > 0) {
            context += `- Exercise: ${reportData.recommendations.exercise.join('; ')}\n`;
        }
        if (reportData.recommendations.sleep_guidance) {
            context += `- Sleep Guidance: ${reportData.recommendations.sleep_guidance}\n`;
        }
        if (reportData.recommendations.emotional_care) {
            context += `- Emotional Wellness: ${reportData.recommendations.emotional_care}\n`;
        }
        if (reportData.recommendations.herbal_formulas?.length > 0) {
            context += `- Herbal Formulas: ${reportData.recommendations.herbal_formulas.map((f: any) => f.name).join(', ')}\n`;
        }
    }

    // Precautions
    if (reportData.precautions) {
        context += '\nPRECAUTIONS:\n';
        if (reportData.precautions.warning_signs?.length > 0) {
            context += `- Warning Signs: ${reportData.precautions.warning_signs.join('; ')}\n`;
        }
        if (reportData.precautions.contraindications?.length > 0) {
            context += `- Contraindications: ${reportData.precautions.contraindications.join('; ')}\n`;
        }
    }

    // Follow-up
    if (reportData.follow_up) {
        context += '\nFOLLOW-UP:\n';
        if (reportData.follow_up.timeline) {
            context += `- Timeline: ${reportData.follow_up.timeline}\n`;
        }
        if (reportData.follow_up.expected_improvement) {
            context += `- Expected Improvement: ${reportData.follow_up.expected_improvement}\n`;
        }
    }

    return context;
}
