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
        // - Master (名医): gemini-1.5-pro
        // - Expert (专家): gemini-1.5-flash
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

        devLog('info', 'API/summarize-inquiry', 'Calling Gemini API with fallback support...');
        const apiKey = await getGeminiApiKeyAsync();

        if (!apiKey) {
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables');
        }

        const { generateTextWithFallback } = await import('@/lib/modelFallback');

        const result = await generateTextWithFallback({
            primaryModel: model,
            context: 'API/summarize-inquiry',
            useAsyncApiKey: true
        }, {
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }] as any // generateTextWithFallback expects messages array
        });

        const totalDuration = Date.now() - startTime;
        devLog('info', 'API/summarize-inquiry', `Total request completed in ${totalDuration}ms using model: ${result.modelId}`);

        return new Response(JSON.stringify({
            summary: result.text,
            modelUsed: result.modelId,
            timing: {
                total: totalDuration
            }
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        devLog('error', 'API/summarize-inquiry', `FAILED after ${duration}ms`, { error: error.message });

        const { parseApiError } = await import('@/lib/modelFallback');
        const { userFriendlyError, errorCode } = parseApiError(error);

        // Map errorCode back to step for frontend compatibility
        let step = 'generation';
        if (errorCode === 'API_KEY_INVALID' || errorCode === 'API_KEY_LEAKED') step = 'api_key';
        else if (errorCode === 'API_QUOTA_EXCEEDED') step = 'rate_limit';
        else if (errorCode === 'MODEL_NOT_FOUND') step = 'model';
        else if (error.message?.includes('fetch') || error.message?.includes('network')) step = 'connection';
        else if (error.message?.includes('timeout')) step = 'timeout';

        return new Response(JSON.stringify({
            error: userFriendlyError,
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
