import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Language instruction templates
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
    en: `You MUST respond entirely in English. Be clear, friendly, and professional.`,
    zh: `你必须完全使用简体中文回复。语言要清晰、友好、专业。`,
    ms: `Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan profesional.`,
};

// Fallback model cascade
const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
];

export async function POST(req: Request) {
    try {
        const {
            messages,
            systemPrompt,
            tcmReportData,
            patientInfo,
            model = 'gemini-2.0-flash',
            language = 'en'
        } = await req.json();

        console.log(`[API /api/western-chat] Received request with model: ${model}, language: ${language}`);
        console.log(`[API /api/western-chat] Messages count: ${messages?.length}`);

        // Build the full system prompt with language instructions
        const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

        // Build TCM context from report data
        const tcmContext = buildTCMContext(tcmReportData, patientInfo);

        const fullSystemPrompt = `${languageInstruction}

${systemPrompt}

═══════════════════════════════════════════════════════════════════════════════
                          PATIENT'S TCM DIAGNOSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

${tcmContext}

═══════════════════════════════════════════════════════════════════════════════`;

        // Format messages for the API
        const formattedMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content
        }));

        console.log(`[API /api/western-chat] Calling streamText with model: ${model}`);

        // Try the requested model first
        try {
            const result = streamText({
                model: google(model),
                system: fullSystemPrompt,
                messages: formattedMessages,
                onFinish: (completion) => {
                    console.log(`[API /api/western-chat] Stream finished with ${model}. Text length: ${completion.text.length}`);
                },
            });

            return result.toTextStreamResponse();
        } catch (primaryError: unknown) {
            const errorMessage = primaryError instanceof Error ? primaryError.message : 'Unknown error';
            console.error(`[API /api/western-chat] Primary model ${model} failed:`, errorMessage);

            // Try fallback models in order
            for (const fallbackModel of FALLBACK_MODELS) {
                if (fallbackModel === model) continue;

                try {
                    console.log(`[API /api/western-chat] Attempting fallback model: ${fallbackModel}`);
                    const fallbackResult = streamText({
                        model: google(fallbackModel),
                        system: fullSystemPrompt,
                        messages: formattedMessages,
                        onFinish: (completion) => {
                            console.log(`[API /api/western-chat] Fallback ${fallbackModel} finished. Text length: ${completion.text.length}`);
                        },
                    });

                    return fallbackResult.toTextStreamResponse();
                } catch (fallbackError: unknown) {
                    const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                    console.error(`[API /api/western-chat] Fallback ${fallbackModel} also failed:`, fallbackErrorMessage);
                }
            }

            throw new Error(`All models failed. Primary error: ${errorMessage}`);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Western chat API error';
        console.error("[API /api/western-chat] Fatal Error:", error);
        return new Response(JSON.stringify({
            error: errorMessage
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function buildTCMContext(reportData: Record<string, unknown> | undefined, patientInfo: Record<string, unknown> | undefined): string {
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

    if (!reportData) {
        return context + '\n(No TCM diagnosis report data available)';
    }

    // Diagnosis
    if (reportData.diagnosis) {
        const diagnosis = typeof reportData.diagnosis === 'string'
            ? reportData.diagnosis
            : (reportData.diagnosis as Record<string, unknown>)?.primary_pattern || JSON.stringify(reportData.diagnosis);
        context += `\nTCM DIAGNOSIS (辨证): ${diagnosis}\n`;

        if (typeof reportData.diagnosis === 'object' && reportData.diagnosis !== null) {
            const diagnosisObj = reportData.diagnosis as Record<string, unknown>;
            if (Array.isArray(diagnosisObj.secondary_patterns) && diagnosisObj.secondary_patterns.length > 0) {
                context += `Secondary Patterns: ${diagnosisObj.secondary_patterns.join(', ')}\n`;
            }
            if (Array.isArray(diagnosisObj.affected_organs) && diagnosisObj.affected_organs.length > 0) {
                context += `Affected Organs: ${diagnosisObj.affected_organs.join(', ')}\n`;
            }
        }
    }

    // Constitution
    if (reportData.constitution) {
        const constitution = typeof reportData.constitution === 'string'
            ? reportData.constitution
            : (reportData.constitution as Record<string, unknown>)?.type || JSON.stringify(reportData.constitution);
        context += `\nCONSTITUTION TYPE: ${constitution}\n`;

        if (typeof reportData.constitution === 'object' && reportData.constitution !== null) {
            const constitutionObj = reportData.constitution as Record<string, unknown>;
            if (constitutionObj.description) {
                context += `Description: ${constitutionObj.description}\n`;
            }
        }
    }

    // Analysis
    if (reportData.analysis) {
        const analysis = typeof reportData.analysis === 'string'
            ? reportData.analysis
            : (reportData.analysis as Record<string, unknown>)?.summary || JSON.stringify(reportData.analysis);
        context += `\nFINAL ANALYSIS (综合诊断): ${analysis}\n`;

        if (typeof reportData.analysis === 'object' && reportData.analysis !== null) {
            const analysisObj = reportData.analysis as Record<string, unknown>;
            if (analysisObj.pattern_rationale) {
                context += `Rationale: ${analysisObj.pattern_rationale}\n`;
            }
        }
    }

    // Recommendations (summarized for Western doctor context)
    if (reportData.recommendations && typeof reportData.recommendations === 'object') {
        const recs = reportData.recommendations as Record<string, unknown>;
        context += '\nTCM RECOMMENDATIONS (Summary):\n';

        if (recs.food_therapy && typeof recs.food_therapy === 'object') {
            const foodTherapy = recs.food_therapy as Record<string, unknown>;
            if (Array.isArray(foodTherapy.beneficial) && foodTherapy.beneficial.length > 0) {
                context += `- Beneficial Foods: ${foodTherapy.beneficial.slice(0, 5).join(', ')}\n`;
            }
        }
        if (Array.isArray(recs.lifestyle) && recs.lifestyle.length > 0) {
            context += `- Lifestyle Advice: ${recs.lifestyle.slice(0, 3).join('; ')}\n`;
        }
    }

    return context;
}
