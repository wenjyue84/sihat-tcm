import { google } from "@ai-sdk/google";
import { streamText, generateText } from "ai";
import { devLog } from "@/lib/systemLogger";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, model = "gemini-2.0-flash", testMode } = body;

    // Simple connectivity test - just verify API key works
    if (testMode || !prompt) {
      devLog("info", "TestGemini", "Running connectivity test");
      const result = await generateText({
        model: google(model),
        prompt: 'Reply with just the word "ok"',
      });
      return Response.json({
        success: true,
        message: "Gemini API is working",
        model: model,
      });
    }

    // Normal streaming mode
    devLog("info", "TestGemini", `Testing model (stream): ${model}`);

    const result = streamText({
      model: google(model),
      messages: [{ role: "user", content: prompt }],
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error(`[test-gemini] FAILED:`, error.message);
    return Response.json(
      {
        success: false,
        error: error.message || "API test failed",
      },
      { status: 500 }
    );
  }
}
