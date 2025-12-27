/**
 * AI Streaming Response Handler
 *
 * Provides consistent handling for AI streaming responses
 * with fallback support and proper error handling.
 */

import { streamText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { getGeminiApiKeyAsync } from "@/lib/settings";
import { devLog } from "@/lib/systemLogger";
import { streamTextWithFallback } from "@/lib/modelFallback";
import { getCorsHeaders } from "@/lib/cors";

export interface StreamOptions {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  fallbackModels?: string[];
  context?: string;
  onFinish?: (completion: { text: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Creates a streaming text response with fallback support
 */
export async function createStreamResponse(
  options: StreamOptions,
  req: Request
): Promise<Response> {
  const {
    model,
    systemPrompt,
    messages,
    fallbackModels = ["gemini-1.5-flash"],
    context = "API",
    onFinish,
    onError,
  } = options;

  try {
    const apiKey = await getGeminiApiKeyAsync();
    const google = getGoogleProvider(apiKey);

    // If fallback models are specified, use streamTextWithFallback
    if (fallbackModels.length > 0) {
      return await streamTextWithFallback(
        {
          primaryModel: model,
          fallbackModels,
          context,
          useAsyncApiKey: true,
        },
        {
          system: systemPrompt,
          messages,
          onFinish: (completion) => {
            devLog("info", context, `Stream finished. Text length: ${completion.text.length}`);
            onFinish?.(completion);
          },
          onError: (error) => {
            devLog("error", context, "Stream error", { error: error.message });
            onError?.(error);
          },
        }
      );
    }

    // Otherwise, use direct streamText
    const result = streamText({
      model: google(model),
      system: systemPrompt,
      messages,
      onFinish: (completion) => {
        devLog("info", context, `Stream finished. Text length: ${completion.text.length}`);
        onFinish?.(completion);
      },
      onError: (error) => {
        devLog("error", context, "Stream error", { error });
        onError?.(error);
      },
    });

    return result.toTextStreamResponse({
      headers: {
        ...getCorsHeaders(req),
        "X-Model-Used": model,
      },
    });
  } catch (primaryError: unknown) {
    devLog("error", context, `Primary model ${model} failed`, { error: primaryError });

    // Fallback to first fallback model
    if (fallbackModels.length > 0) {
      const fallbackModel = fallbackModels[0];
      devLog("info", context, `Falling back to ${fallbackModel}`);

      try {
        const apiKey = await getGeminiApiKeyAsync();
        const googleFallback = getGoogleProvider(apiKey);
        const fallbackResult = streamText({
          model: googleFallback(fallbackModel),
          system: systemPrompt,
          messages,
          onFinish: (completion) => {
            devLog(
              "info",
              context,
              `Fallback stream finished. Text length: ${completion.text.length}`
            );
            onFinish?.(completion);
          },
          onError: (error) => {
            devLog("error", context, "Stream error (fallback)", { error });
            onError?.(error);
          },
        });

        return fallbackResult.toTextStreamResponse({
          headers: {
            ...getCorsHeaders(req),
            "X-Model-Used": `${fallbackModel}-fallback`,
          },
        });
      } catch (fallbackError) {
        devLog("error", context, "Fallback also failed", { error: fallbackError });
        throw fallbackError;
      }
    }

    throw primaryError;
  }
}
