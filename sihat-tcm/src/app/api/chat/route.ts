import { streamText } from 'ai';
import { supabase } from '@/lib/supabase';
import { INTERACTIVE_CHAT_PROMPT } from '@/lib/systemPrompts';
import { getGoogleProvider } from '@/lib/googleProvider';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Language instruction templates for chat responses
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
    en: `
LANGUAGE REQUIREMENT: You MUST respond entirely in English. Ask questions and provide all responses in clear, simple English.
`,
    zh: `
语言要求：你必须完全使用中文回复。所有问诊对话必须使用简体中文。
请使用简单易懂的中文，确保老年患者能够理解。不要使用英文或马来文。
`,
    ms: `
KEPERLUAN BAHASA: Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Tanya soalan dan berikan semua respons dalam Bahasa Malaysia yang jelas dan mudah.
`,
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, basicInfo, model = 'gemini-1.5-pro', language = 'en' } = body;

        console.log("[API /api/chat] Request received:", {
            messageCount: messages?.length,
            hasBasicInfo: !!basicInfo,
            firstMsgRole: messages?.[0]?.role,
            model: model,
            language: language
        });

        // Fetch custom system prompt from admin database (uses 'doctor_chat' role)
        let customPrompt = '';
        try {
            const { data } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor_chat')
                .single();
            if (data && data.prompt_text) customPrompt = data.prompt_text;
        } catch (e) {
            console.error("Error fetching chat system prompt", e);
        }

        // Use the database prompt if available, otherwise use the library default
        let systemPrompt = customPrompt || INTERACTIVE_CHAT_PROMPT;

        // Add language instructions to the system prompt
        const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
        systemPrompt = languageInstruction + '\n\n' + systemPrompt;

        // Add patient information context
        if (basicInfo) {
            const height = basicInfo.height ? Number(basicInfo.height) : null;
            const weight = basicInfo.weight ? Number(basicInfo.weight) : null;
            const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : null;

            systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
                          患者信息 PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

Name: ${basicInfo.name || 'Not provided'}
Age: ${basicInfo.age || 'Not provided'}
Gender: ${basicInfo.gender || 'Not provided'}
Height: ${height ? height + ' cm' : 'Not provided'}
Weight: ${weight ? weight + ' kg' : 'Not provided'}
${bmi ? `BMI: ${bmi}` : ''}
Chief Complaint: ${basicInfo.symptoms || 'Not provided'}
Symptom Duration: ${basicInfo.symptomDuration || 'Not provided'}

**INSTRUCTION:** Use this information as context. Build upon their chief complaint with your first question. Do NOT repeat this information back to the patient.`;
        }

        // Filter out system messages from the messages array
        const filteredMessages = messages?.filter((m: any) => m.role !== 'system') || [];

        console.log("[API /api/chat] Filtered messages count:", filteredMessages.length);
        console.log("[API /api/chat] First filtered message:", filteredMessages[0]);

        // Create language-appropriate initial message if no messages
        if (filteredMessages.length === 0) {
            const initialMessages: Record<string, string> = {
                en: 'Please start the consultation by asking me relevant questions about my symptoms.',
                zh: '请开始问诊，询问我有关症状的相关问题。',
                ms: 'Sila mulakan perundingan dengan bertanya soalan berkaitan gejala saya.',
            };
            filteredMessages.push({
                role: 'user',
                content: initialMessages[language] || initialMessages.en
            });
        }

        console.log("[API /api/chat] Calling streamText with model:", model);

        try {
            const result = streamText({
                model: google(model),
                system: systemPrompt,
                messages: filteredMessages,
                onFinish: (completion) => {
                    console.log("[API /api/chat] Stream finished. Text length:", completion.text.length);
                },
                onError: (error) => {
                    console.error("[API /api/chat] Stream error (primary):", error);
                },
            });

            console.log("[API /api/chat] streamText called, returning stream response");
            return result.toTextStreamResponse({
                headers: {
                    'X-Model-Used': model
                }
            });
        } catch (primaryError: any) {
            console.error(`[API /api/chat] Primary model ${model} failed:`, primaryError);

            // Fallback to 1.5 Flash
            console.log(`[API /api/chat] Falling back to gemini-1.5-flash`);
            const fallbackResult = streamText({
                model: google('gemini-1.5-flash'),
                system: systemPrompt,
                messages: filteredMessages,
                onFinish: (completion) => {
                    console.log("[API /api/chat] Fallback stream finished. Text length:", completion.text.length);
                },
                onError: (error) => {
                    console.error("[API /api/chat] Stream error (fallback):", error);
                },
            });
            return fallbackResult.toTextStreamResponse({
                headers: {
                    'X-Model-Used': 'gemini-1.5-flash-fallback'
                }
            });
        }
    } catch (error: any) {
        console.error("[API /api/chat] Error:", error);

        // Detect specific API key errors
        const errorMessage = error.message || error.toString() || '';
        let userFriendlyError = 'Chat API error';
        let errorCode = 'CHAT_ERROR';

        if (errorMessage.includes('leaked') || errorMessage.includes('API key was reported')) {
            userFriendlyError = 'API key has been flagged as leaked. Please generate a new API key from Google AI Studio and update your .env.local file.';
            errorCode = 'API_KEY_LEAKED';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('API_KEY_INVALID')) {
            userFriendlyError = 'Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env.local file.';
            errorCode = 'API_KEY_INVALID';
        } else if (errorMessage.includes('quota') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429')) {
            userFriendlyError = 'API quota exceeded. Please wait a moment or check your Google AI Studio billing.';
            errorCode = 'API_QUOTA_EXCEEDED';
        } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            userFriendlyError = 'AI model not available. Please try again or contact support.';
            errorCode = 'MODEL_NOT_FOUND';
        }

        return new Response(JSON.stringify({
            error: userFriendlyError,
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
