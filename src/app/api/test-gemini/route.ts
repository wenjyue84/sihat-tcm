import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt, model = 'gemini-1.5-pro' } = await req.json();
        console.log(`[test-gemini] Testing model (stream): ${model}`);

        const result = streamText({
            model: google(model),
            messages: [{ role: 'user', content: prompt }],
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error(`[test-gemini] FAILED:`, error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
