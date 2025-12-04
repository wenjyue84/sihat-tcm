import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return Response.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not set' }, { status: 500 });
        }

        const { text } = await generateText({
            model: google('gemini-1.5-pro-latest'),
            prompt: prompt,
        });

        return Response.json({ result: text });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
