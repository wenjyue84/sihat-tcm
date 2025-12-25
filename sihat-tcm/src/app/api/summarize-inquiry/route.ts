import { getGoogleProvider } from '@/lib/googleProvider';
import { generateText } from 'ai';
import { INQUIRY_SUMMARY_PROMPT } from '@/lib/systemPrompts';
import { supabase } from '@/lib/supabase';
import { getGeminiApiKeyAsync } from '@/lib/settings';
import { devLog } from '@/lib/systemLogger';
import { summarizeInquiryRequestSchema, validateRequest, validationErrorResponse } from '@/lib/validations';

export const maxDuration = 60;

export async function POST(req: Request) {
    const startTime = Date.now();
    devLog('info', 'API/summarize-inquiry', 'Request started');

    try {
        const body = await req.json();

        // Validate request body with Zod
        const validation = validateRequest(summarizeInquiryRequestSchema, body);
        if (!validation.success) {
            devLog('warn', 'API/summarize-inquiry', 'Validation failed', { error: validation.error });
            return validationErrorResponse(validation.error, validation.details);
        }

        // Model is now passed from frontend based on doctor level selection:
        // - Master (名医): gemini-3-pro-preview
        // - Expert (专家): gemini-2.5-pro
        // - Physician (医师): gemini-2.0-flash
        const { chatHistory, reportFiles, medicineFiles, basicInfo, language, model } = validation.data;
        devLog('info', 'API/summarize-inquiry', 'Request params', { language, model, chatHistoryLength: chatHistory?.length || 0 });

        // Fetch custom prompt from admin (if exists)
        let customPrompt = '';
        try {
            devLog('debug', 'API/summarize-inquiry', 'Fetching custom prompt...');
            const { data: promptData } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor_inquiry_summary')
                .single();
            if (promptData && promptData.prompt_text) {
                customPrompt = promptData.prompt_text;
                devLog('debug', 'API/summarize-inquiry', 'Using custom prompt from admin');
            }
        } catch {
            devLog('debug', 'API/summarize-inquiry', 'No custom prompt found, using default');
        }

        // Use custom prompt if set, otherwise use default
        const systemPrompt = customPrompt || INQUIRY_SUMMARY_PROMPT;

        // Build comprehensive user prompt with patient data
        let userPrompt = `
═══════════════════════════════════════════════════════════════════════════════
                           PATIENT DATA FOR SUMMARY
═══════════════════════════════════════════════════════════════════════════════

## Patient Basic Info:
- Name: ${basicInfo?.name || 'Not provided'}
- Age: ${basicInfo?.age || 'Not provided'}
- Gender: ${basicInfo?.gender || 'Not provided'}
- Chief Complaint: ${basicInfo?.symptoms || 'Not provided'}
- Symptom Duration: ${basicInfo?.symptomDuration || 'Not provided'}

## Uploaded Medical Reports:
${(reportFiles?.length || 0) > 0
                ? (reportFiles || []).map((f: any) => `- ${f.name}:\n${f.extractedText || 'No text extracted'}`).join('\n\n')
                : 'None uploaded'}

## Current Medications (from uploaded images):
${(medicineFiles?.length || 0) > 0
                ? (medicineFiles || []).map((f: any) => `- ${f.name}: ${f.extractedText || 'No medication info extracted'}`).join('\n')
                : 'None uploaded'}

## Complete Chat History (问诊记录):
${chatHistory.map((m: any) => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n')}

═══════════════════════════════════════════════════════════════════════════════
                          INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Please generate a comprehensive yet concise medical summary based on the above data.
Respond in ${language === 'zh' ? 'Chinese (Simplified/简体中文)' : language === 'ms' ? 'Malay (Bahasa Malaysia)' : 'English'}.
Follow the structured format specified in your system prompt.
`;

        devLog('info', 'API/summarize-inquiry', 'Calling Gemini API...');
        const generateStartTime = Date.now();
        const apiKey = await getGeminiApiKeyAsync();

        devLog('debug', 'API/summarize-inquiry', `API Key loaded: ${apiKey ? 'OK' : 'MISSING'}`);

        if (!apiKey) {
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables');
        }

        const google = getGoogleProvider(apiKey);

        let text;
        try {
            // Try primary model
            const result = await generateText({
                model: google(model),
                system: systemPrompt,
                prompt: userPrompt,
            });
            text = result.text;
        } catch (primaryError: any) {
            devLog('error', 'API/summarize-inquiry', `Primary model ${model} failed`, { error: primaryError.message });

            // Fallback to gemini-1.5-flash
            const fallbackModel = 'gemini-1.5-flash';
            devLog('info', 'API/summarize-inquiry', `Attempting fallback to ${fallbackModel}...`);

            try {
                const fallbackResult = await generateText({
                    model: google(fallbackModel),
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                text = fallbackResult.text;
                devLog('info', 'API/summarize-inquiry', `Fallback to ${fallbackModel} successful`);
            } catch (fallbackError: any) {
                devLog('error', 'API/summarize-inquiry', `Fallback model ${fallbackModel} also failed`, { error: fallbackError.message });
                throw primaryError; // Throw the original error to be handled by the outer catch
            }
        }

        const generateDuration = Date.now() - generateStartTime;
        devLog('info', 'API/summarize-inquiry', `Gemini API responded in ${generateDuration}ms`);

        const totalDuration = Date.now() - startTime;
        devLog('info', 'API/summarize-inquiry', `Total request completed in ${totalDuration}ms`);

        return new Response(JSON.stringify({
            summary: text,
            timing: {
                total: totalDuration,
                generation: generateDuration
            }
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        devLog('error', 'API/summarize-inquiry', `FAILED after ${duration}ms`, { error: error.message });

        // Determine which step failed and provide specific error messages
        let step = 'unknown';
        let errorMessage = error.message || 'An unknown error occurred';
        let errorCode = 'GENERATION_FAILED';

        // Check for API key specific errors
        if (errorMessage.includes('leaked') || errorMessage.includes('API key was reported')) {
            step = 'api_key';
            errorCode = 'API_KEY_LEAKED';
            errorMessage = 'API key has been flagged as leaked. Please generate a new API key from Google AI Studio and update your .env.local file.';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('API_KEY_INVALID')) {
            step = 'api_key';
            errorCode = 'API_KEY_INVALID';
            errorMessage = 'Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env.local file.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429')) {
            step = 'rate_limit';
            errorCode = 'API_QUOTA_EXCEEDED';
            errorMessage = 'API quota exceeded. Please wait a moment or check your Google AI Studio billing.';
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            step = 'connection';
            errorMessage = 'Failed to connect to AI service';
        } else if (errorMessage.includes('timeout')) {
            step = 'timeout';
            errorMessage = 'Request timed out while generating summary';
        } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            step = 'model';
            errorCode = 'MODEL_NOT_FOUND';
            errorMessage = 'AI model not available. Please try again or contact support.';
        } else {
            step = 'generation';
        }

        return new Response(JSON.stringify({
            error: errorMessage,
            code: errorCode,
            step: step,
            duration: duration,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
