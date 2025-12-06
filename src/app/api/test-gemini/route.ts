import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    const startTime = Date.now();

    try {
        const { prompt, model = 'gemini-1.5-flash' } = await req.json();
        console.log(`[test-gemini] Testing model: ${model}`);
        console.log('[test-gemini] Prompt:', prompt?.substring(0, 100) + '...');

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return Response.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not set' }, { status: 500 });
        }
        console.log('[test-gemini] API key found, length:', process.env.GOOGLE_GENERATIVE_AI_API_KEY.length);

        console.log(`[test-gemini] Calling ${model}...`);
        const { text } = await generateText({
            model: google(model),
            messages: [{ role: 'user', content: prompt }],
        });

        const duration = Date.now() - startTime;
        console.log(`[test-gemini] Success with ${model}! Response received in ${duration}ms`);
        console.log('[test-gemini] Response length:', text?.length);

        return Response.json({ result: text, durationMs: duration, model });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[test-gemini] FAILED after ${duration}ms:`, error.message);
        console.error('[test-gemini] Full error:', error);
        return Response.json({ error: error.message, durationMs: duration }, { status: 500 });
    }
}
