import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getGeminiApiKey } from "@/lib/settings";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { apiKey, useSavedKey } = await request.json();

    // Determine which key to test
    let keyToTest: string;

    if (useSavedKey) {
      // Test the saved key from settings
      keyToTest = getGeminiApiKey();
      if (!keyToTest) {
        return NextResponse.json({ error: "No saved API key found" }, { status: 400 });
      }
    } else if (apiKey) {
      keyToTest = apiKey;
    } else {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Create a provider with the test API key
    const google = createGoogleGenerativeAI({ apiKey: keyToTest });

    // Make a simple test call
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: 'Say "API key is valid" in exactly those words.',
    });

    return NextResponse.json({
      success: true,
      message: "API key is valid and working",
      response: result.text.substring(0, 50),
    });
  } catch (error: unknown) {
    console.error("[Test API Key] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check for common API key errors
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid")) {
      return NextResponse.json(
        { error: "Invalid API key. Please check and try again." },
        { status: 401 }
      );
    }

    if (errorMessage.includes("quota") || errorMessage.includes("RATE_LIMIT")) {
      return NextResponse.json(
        { error: "API key is valid but has quota/rate limit issues." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Failed to validate API key: ${errorMessage}` },
      { status: 500 }
    );
  }
}
