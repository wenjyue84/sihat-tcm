import { streamText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { getGeminiApiKeyAsync } from "@/lib/settings";
import { devLog } from "@/lib/systemLogger";
import { getSystemPrompt } from "@/lib/promptLoader";
import {
  prependLanguageInstruction,
  normalizeLanguage,
} from "@/lib/translations/languageInstructions";
import { parseApiError } from "@/lib/modelFallback";
import { getCorsHeaders } from "@/lib/cors";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, language: rawLanguage, model, profile } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const language = normalizeLanguage(rawLanguage || "en");
    const selectedModel = model || "gemini-2.0-flash";

    devLog("info", "API/heart-companion", "Request received", {
      messageCount: messages.length,
      language,
      model: selectedModel,
      hasProfile: !!profile,
    });

    // Fetch system prompt using centralized loader
    let systemPrompt = await getSystemPrompt("heart_companion");

    // Add language instructions
    systemPrompt = prependLanguageInstruction(systemPrompt, "basic", language);

    // Add profile context if available
    if (profile) {
      systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
                           USER CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Name: ${profile.name || "Friend"}
${profile.age ? `Age: ${profile.age}` : ""}
${profile.gender ? `Gender: ${profile.gender}` : ""}

**INSTRUCTION:** Use this information to personalize your responses naturally. Address them by name when appropriate, but keep it friendly and casual.`;
    }

    // Filter out system messages
    const filteredMessages = messages.filter((m: any) => m.role !== "system");

    devLog("debug", "API/heart-companion", "Filtered messages", {
      count: filteredMessages.length,
    });

    let apiKey = "";
    try {
      apiKey = await getGeminiApiKeyAsync();
      devLog("debug", "API/heart-companion", `API Key loaded: ${apiKey ? "OK" : "MISSING"}`);
    } catch (e) {
      devLog("error", "API/heart-companion", "Error fetching API key", { error: e });
    }

    try {
      const google = getGoogleProvider(apiKey);
      const result = streamText({
        model: google(selectedModel),
        system: systemPrompt,
        messages: filteredMessages,
        temperature: 0.8, // Slightly higher for more natural, friendly responses
        onFinish: (completion) => {
          devLog("info", "API/heart-companion", `Stream finished. Text length: ${completion.text.length}`);
        },
        onError: (error) => {
          devLog("error", "API/heart-companion", "Stream error (primary)", { error });
        },
      });

      devLog("debug", "API/heart-companion", "streamText called, returning stream response");
      return result.toTextStreamResponse({
        headers: {
          ...getCorsHeaders(req),
          "X-Model-Used": selectedModel,
        },
      });
    } catch (primaryError: any) {
      devLog("error", "API/heart-companion", `Primary model ${selectedModel} failed`, {
        error: primaryError,
      });

      // Fallback to 1.5 Flash
      devLog("info", "API/heart-companion", "Falling back to gemini-1.5-flash");
      const googleFallback = getGoogleProvider(apiKey);
      const fallbackResult = streamText({
        model: googleFallback("gemini-1.5-flash"),
        system: systemPrompt,
        messages: filteredMessages,
        temperature: 0.8,
        onFinish: (completion) => {
          devLog(
            "info",
            "API/heart-companion",
            `Fallback stream finished. Text length: ${completion.text.length}`
          );
        },
        onError: (error) => {
          devLog("error", "API/heart-companion", "Stream error (fallback)", { error });
        },
      });
      return fallbackResult.toTextStreamResponse({
        headers: {
          ...getCorsHeaders(req),
          "X-Model-Used": "gemini-1.5-flash-fallback",
        },
      });
    }
  } catch (error: any) {
    devLog("error", "API/heart-companion", "Request error", { error });

    const { userFriendlyError, errorCode } = parseApiError(error);

    return new Response(
      JSON.stringify({
        error: userFriendlyError,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

