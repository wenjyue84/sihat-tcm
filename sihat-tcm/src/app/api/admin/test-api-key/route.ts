import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
    try {
        const { apiKey } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        // Create a provider with the test API key
        const google = createGoogleGenerativeAI({ apiKey });

        // Make a simple test call
        const result = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: 'Say "API key is valid" in exactly those words.',
        });

        return NextResponse.json({
            success: true,
            message: 'API key is valid and working',
            response: result.text.substring(0, 50)
        });
    } catch (error: unknown) {
        console.error('[Test API Key] Error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check for common API key errors
        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check and try again.' },
                { status: 401 }
            );
        }

        if (errorMessage.includes('quota') || errorMessage.includes('RATE_LIMIT')) {
            return NextResponse.json(
                { error: 'API key is valid but has quota/rate limit issues.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: `Failed to validate API key: ${errorMessage}` },
            { status: 500 }
        );
    }
}
