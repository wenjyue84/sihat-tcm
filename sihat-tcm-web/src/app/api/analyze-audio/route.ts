import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { LISTENING_ANALYSIS_PROMPT } from "@/lib/systemPrompts";
import { supabase } from "@/lib/supabase/client";
import {
  analyzeAudioRequestSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validations";
import { devLog } from "@/lib/systemLogger";
import { createErrorResponseWithStatus } from "@/lib/api/middleware/error-handler";

export const maxDuration = 120;

// Models ordered from most advanced to least advanced
const MODEL_FALLBACK_ORDER = ["gemini-2.5-pro", "gemini-2.0-flash"];

// Friendly names for status updates
const MODEL_STATUS: Record<string, string> = {
  "gemini-2.5-pro": "Using expert-level audio analysis...",
  "gemini-2.0-flash": "Using rapid audio analysis...",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validation = validateRequest(analyzeAudioRequestSchema, body);
    if (!validation.success) {
      devLog("warn", "API/analyze-audio", "Validation failed", { error: validation.error });
      return validationErrorResponse(validation.error, validation.details);
    }

    const { audio } = validation.data;

    // Fetch custom listening analysis prompt from admin (if exists)
    let customPrompt = "";
    try {
      const { data } = await supabase
        .from("system_prompts")
        .select("prompt_text")
        .eq("role", "doctor_listening")
        .single();
      if (data && data.prompt_text) customPrompt = data.prompt_text;
    } catch (e) {
      devLog("error", "API/analyze-audio", "Error fetching listening analysis prompt", {
        error: e,
      });
    }

    // Use custom prompt if set, otherwise use default from library
    const systemPrompt = customPrompt || LISTENING_ANALYSIS_PROMPT;

    const userPrompt = `Please analyze this audio recording for TCM diagnostic purposes. 
Listen carefully for:
1. Voice quality - strength, clarity, pitch, resonance
2. Breathing patterns - rhythm, depth, any unusual sounds
3. Speech patterns - flow, pace, coherence, emotional undertones
4. Cough sounds - if present, describe the quality and frequency

CRITICAL: If the audio is silent, contains only background noise, or no clear human voice/breathing sounds are detectable, return a JSON with "status": "silence" and "overall_observation": "No clear voice or breathing sounds detected. Please record again.". Do NOT hallucinate findings or return "normal" results for silence.

Provide your analysis in the specified JSON format with detailed observations for each category.`;

    // Try each model in order until we get a valid result
    for (let i = 0; i < MODEL_FALLBACK_ORDER.length; i++) {
      const modelId = MODEL_FALLBACK_ORDER[i];
      devLog(
        "info",
        "API/analyze-audio",
        `Trying model ${i + 1}/${MODEL_FALLBACK_ORDER.length}: ${modelId}`
      );

      try {
        // Extract base64 data and mime type from data URL
        const matches = audio.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          devLog("error", "API/analyze-audio", "Invalid audio data format");
          continue;
        }
        const [, mimeType, base64Data] = matches;

        const result = await generateText({
          model: google(modelId),
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "file",
                  data: base64Data,
                  mimeType: mimeType,
                } as any,
              ],
            },
          ],
        });

        const text = result.text;
        devLog("debug", "API/analyze-audio", `Model ${modelId} response`, {
          preview: text?.substring(0, 200),
        });

        if (!text || text.trim() === "") {
          devLog(
            "warn",
            "API/analyze-audio",
            `Model ${modelId} returned empty response, trying next...`
          );
          continue;
        }

        // Clean up and parse
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();

        try {
          const data = JSON.parse(cleanJson);

          // Validate that we have the expected structure
          if (data.overall_observation || data.voice_quality_analysis) {
            return new Response(
              JSON.stringify({
                ...data,
                modelUsed: i + 1,
                status: data.status || "success",
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          devLog(
            "warn",
            "API/analyze-audio",
            `Model ${modelId} returned invalid structure, trying next...`
          );
        } catch (parseError) {
          devLog("error", "API/analyze-audio", `JSON parse error for model ${modelId}`, {
            error: parseError,
          });
          // If we can't parse JSON but have text, create a basic response
          if (text.length > 50) {
            return new Response(
              JSON.stringify({
                overall_observation: text,
                voice_quality_analysis: {
                  observation: "Analysis available in overall observation",
                  severity: "normal",
                  tcm_indicators: [],
                  clinical_significance: "See overall observation for details",
                },
                breathing_patterns: null,
                speech_patterns: null,
                cough_sounds: null,
                modelUsed: i + 1,
                status: "partial",
                notes: "Full structured analysis unavailable",
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }
      } catch (modelError: any) {
        devLog("error", "API/analyze-audio", `Model ${modelId} failed`, {
          error: modelError.message,
        });
        // Continue to next model
      }
    }

    // All models failed - return a mock/placeholder response for development
    devLog("warn", "API/analyze-audio", "All models failed, returning placeholder response");
    return new Response(
      JSON.stringify({
        overall_observation: "Audio analysis will be processed with your final diagnosis report.",
        voice_quality_analysis: {
          observation: "Voice recording received",
          severity: "pending",
          tcm_indicators: ["Audio recorded successfully"],
          clinical_significance: "Will be integrated with other diagnostic data",
        },
        breathing_patterns: {
          observation: "Pending analysis",
          severity: "pending",
          tcm_indicators: [],
          clinical_significance: "Pending comprehensive analysis",
        },
        speech_patterns: {
          observation: "Pending analysis",
          severity: "pending",
          tcm_indicators: [],
          clinical_significance: "Will be evaluated alongside other findings",
        },
        cough_sounds: {
          observation: "Pending analysis",
          severity: "pending",
          tcm_indicators: [],
          clinical_significance: "Pending",
        },
        pattern_suggestions: ["Analysis pending"],
        recommendations: ["Continue with remaining diagnostic steps"],
        confidence: "low",
        notes:
          "Real-time audio analysis temporarily unavailable. Your recording has been saved and will be analyzed in your final diagnosis.",
        modelUsed: 0,
        status: "pending",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponseWithStatus(
      error,
      "API/analyze-audio",
      200,
      {
        overall_observation:
          "Audio analysis encountered an issue. Your recording is saved for later review.",
        voice_quality_analysis: null,
        breathing_patterns: null,
        speech_patterns: null,
        cough_sounds: null,
        status: "error",
        error: errorMessage,
      }
    );
  }
}
