import { streamText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { getGeminiApiKeyAsync } from "@/lib/settings";
import { devLog } from "@/lib/systemLogger";
import { chatRequestSchema, validateRequest, validationErrorResponse } from "@/lib/validations";
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

    // Validate request body with Zod
    const validation = validateRequest(chatRequestSchema, body);
    if (!validation.success) {
      devLog("warn", "API/chat", "Validation failed", { error: validation.error });
      return validationErrorResponse(validation.error, validation.details);
    }

    const { messages, basicInfo, model, language: rawLanguage } = validation.data;
    const language = normalizeLanguage(rawLanguage);

    devLog("info", "API/chat", "Request received", {
      messageCount: messages?.length,
      hasBasicInfo: !!basicInfo,
      firstMsgRole: messages?.[0]?.role,
      model: model,
      language: language,
    });

    // Fetch system prompt using centralized loader
    let systemPrompt = await getSystemPrompt("doctor_chat");

    // Add language instructions using centralized utility
    systemPrompt = prependLanguageInstruction(systemPrompt, "basic", language);

    // Add patient information context
    if (basicInfo) {
      const height = basicInfo.height ? Number(basicInfo.height) : null;
      const weight = basicInfo.weight ? Number(basicInfo.weight) : null;
      const bmi = height && weight ? (weight / (height / 100) ** 2).toFixed(1) : null;

      systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
                          患者信息 PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

Name: ${basicInfo.name || "Not provided"}
Age: ${basicInfo.age || "Not provided"}
Gender: ${basicInfo.gender || "Not provided"}
Height: ${height ? height + " cm" : "Not provided"}
Weight: ${weight ? weight + " kg" : "Not provided"}
${bmi ? `BMI: ${bmi}` : ""}
Chief Complaint: ${basicInfo.symptoms || "Not provided"}
Symptom Duration: ${basicInfo.symptomDuration || "Not provided"}

**INSTRUCTION:** Use this information as context. Build upon their chief complaint with your first question. Do NOT repeat this information back to the patient.`;
    }

    // Filter out system messages from the messages array
    const filteredMessages = messages?.filter((m: any) => m.role !== "system") || [];

    devLog("debug", "API/chat", "Filtered messages", {
      count: filteredMessages.length,
      first: filteredMessages[0],
    });

    // Create language-appropriate initial message if no messages
    if (filteredMessages.length === 0) {
      const initialMessages: Record<string, string> = {
        en: "Please start the consultation by asking me relevant questions about my symptoms.",
        zh: "请开始问诊，询问我有关症状的相关问题。",
        ms: "Sila mulakan perundingan dengan bertanya soalan berkaitan gejala saya.",
      };
      filteredMessages.push({
        role: "user",
        content: initialMessages[language] || initialMessages.en,
      });
    }

    devLog("info", "API/chat", `Calling streamText with model: ${model}`);

    let apiKey = "";
    try {
      apiKey = await getGeminiApiKeyAsync();
      devLog("debug", "API/chat", `API Key loaded: ${apiKey ? "OK" : "MISSING"}`);
    } catch (e) {
      devLog("error", "API/chat", "Error fetching API key", { error: e });
    }

    try {
      const google = getGoogleProvider(apiKey);
      const result = streamText({
        model: google(model),
        system: systemPrompt,
        messages: filteredMessages,
        onFinish: (completion) => {
          devLog("info", "API/chat", `Stream finished. Text length: ${completion.text.length}`);
        },
        onError: (error) => {
          devLog("error", "API/chat", "Stream error (primary)", { error });
        },
      });

      devLog("debug", "API/chat", "streamText called, returning stream response");
      return result.toTextStreamResponse({
        headers: {
          ...getCorsHeaders(req),
          "X-Model-Used": model,
        },
      });
    } catch (primaryError: any) {
      devLog("error", "API/chat", `Primary model ${model} failed`, { error: primaryError });

      // Fallback to 1.5 Flash
      devLog("info", "API/chat", "Falling back to gemini-1.5-flash");
      const googleFallback = getGoogleProvider(apiKey);
      const fallbackResult = streamText({
        model: googleFallback("gemini-1.5-flash"),
        system: systemPrompt,
        messages: filteredMessages,
        onFinish: (completion) => {
          devLog(
            "info",
            "API/chat",
            `Fallback stream finished. Text length: ${completion.text.length}`
          );
        },
        onError: (error) => {
          devLog("error", "API/chat", "Stream error (fallback)", { error });
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
    devLog("error", "API/chat", "Request error", { error });

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
