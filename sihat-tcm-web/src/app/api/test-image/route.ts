import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { devLog } from "@/lib/systemLogger";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { image, model } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({
          error: "No image provided",
          observation: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are an expert TCM (Traditional Chinese Medicine) practitioner performing Wang Zhen (望診) - visual inspection.

CRITICAL: You MUST describe what you see in the image in detail. Describe:
- Colors (specific shades)
- Textures and surfaces
- Shapes and patterns
- Any notable features or markings

Return ONLY a JSON object:
{
  "observation": "Your detailed description of what you see in the image",
  "potential_issues": ["Issue 1", "Issue 2", "Issue 3"]
}`;

    const prompt =
      "Analyze this image. Describe exactly what you see in detail - colors, shapes, textures, and any notable features.";

    devLog("info", "API/test-image", `Calling model: ${model}`);
    const startTime = Date.now();

    const result = await generateText({
      model: google(model),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: image },
          ],
        },
      ],
    });

    const duration = Date.now() - startTime;
    const text = result.text;
    devLog("info", "API/test-image", `Model ${model} responded in ${duration}ms`, {
      preview: text?.substring(0, 200),
    });

    // Try to parse JSON
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const data = JSON.parse(cleanJson);
      return new Response(
        JSON.stringify({
          model,
          duration,
          observation: data.observation || text,
          potential_issues: data.potential_issues || [],
          raw: text,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch {
      return new Response(
        JSON.stringify({
          model,
          duration,
          observation: text,
          potential_issues: [],
          raw: text,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    const errorResponse = createErrorResponse(error, "API/test-image");
    const errorBody = await errorResponse.json();
    return new Response(
      JSON.stringify({
        ...errorBody,
        observation: null,
      }),
      {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
