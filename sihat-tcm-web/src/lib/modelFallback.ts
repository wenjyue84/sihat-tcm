/**
 * Centralized model fallback logic for AI API routes.
 *
 * This module provides unified fallback handling for Gemini model calls,
 * ensuring consistent error handling and model cascade across all routes.
 */

import { google } from "@ai-sdk/google";
import { streamText, generateText, StreamTextResult, GenerateTextResult } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { getGeminiApiKeyAsync } from "@/lib/settings";
import { devLog, logError, logInfo } from "@/lib/systemLogger";

// Default fallback models ordered by preference
export const DEFAULT_FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

// Advanced fallback models for vision/analysis tasks
export const ADVANCED_FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

// Model status messages (user-friendly, no model names exposed)
export const MODEL_STATUS_MESSAGES: Record<string, string> = {
  "gemini-2.0-flash": "Using rapid analysis...",
  "gemini-1.5-flash": "Using standard analysis...",
};

export interface FallbackOptions {
  /** Primary model to try first */
  primaryModel: string;
  /** List of fallback models to try in order */
  fallbackModels?: string[];
  /** Custom API key (optional, uses env var if not provided) */
  apiKey?: string;
  /** Context identifier for logging */
  context?: string;
  /** Whether to use the async API key fetcher */
  useAsyncApiKey?: boolean;
}

export interface StreamCallOptions {
  system: string;
  messages: Array<{ role: string; content: any }>;
  onFinish?: (completion: { text: string }) => void;
  onError?: (error: Error) => void;
}

export interface GenerateCallOptions {
  system: string;
  messages: Array<{ role: string; content: any }>;
}

/**
 * Execute a streaming text call with automatic fallback.
 *
 * @param options Fallback configuration
 * @param callOptions Stream call parameters
 * @returns StreamTextResult with X-Model-Used header
 */
export async function streamTextWithFallback(
  options: FallbackOptions,
  callOptions: StreamCallOptions
): Promise<Response> {
  const {
    primaryModel,
    fallbackModels = DEFAULT_FALLBACK_MODELS,
    apiKey: providedApiKey,
    context = "API",
    useAsyncApiKey = false,
  } = options;

  const { system, messages, onFinish, onError } = callOptions;

  // Get API key
  let apiKey = providedApiKey || "";
  if (!apiKey && useAsyncApiKey) {
    try {
      apiKey = await getGeminiApiKeyAsync();
    } catch (e) {
      logError(context, "Error fetching API key", { error: e });
    }
  }

  const getProvider = () => (apiKey ? getGoogleProvider(apiKey) : google);

  // Try primary model
  try {
    devLog("info", context, `Calling streamText with model: ${primaryModel}`);

    const provider = getProvider();
    const result = streamText({
      model: typeof provider === "function" ? provider(primaryModel) : google(primaryModel),
      system,
      messages: messages as any,
      onFinish: (completion) => {
        devLog("info", context, `Stream finished. Text length: ${completion.text.length}`);
        onFinish?.(completion);
      },
      onError: (error) => {
        devLog("error", context, "Stream error (primary)", { error });
        onError?.(error as unknown as Error);
      },
    });

    return result.toTextStreamResponse({
      headers: { "X-Model-Used": primaryModel },
    });
  } catch (primaryError: any) {
    logError(context, `Primary model ${primaryModel} failed`, { error: primaryError.message });

    // Try fallback models
    for (const fallbackModel of fallbackModels) {
      if (fallbackModel === primaryModel) continue;

      try {
        devLog("info", context, `Attempting fallback model: ${fallbackModel}`);

        const provider = getProvider();
        const fallbackResult = streamText({
          model: typeof provider === "function" ? provider(fallbackModel) : google(fallbackModel),
          system,
          messages: messages as any,
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
            onError?.(error as unknown as Error);
          },
        });

        return fallbackResult.toTextStreamResponse({
          headers: { "X-Model-Used": `${fallbackModel}-fallback` },
        });
      } catch (fallbackError: any) {
        logError(context, `Fallback ${fallbackModel} also failed`, {
          error: fallbackError.message,
        });
      }
    }

    // All models failed
    throw new Error(`All models failed. Primary error: ${primaryError.message}`);
  }
}

/**
 * Execute a generate text call with ordered fallback and validation.
 * Useful for vision/analysis tasks that need response validation.
 *
 * @param options Fallback configuration
 * @param callOptions Generate call parameters
 * @param validator Optional function to validate the response
 * @returns Object with result text, model index, and status
 */
export async function generateTextWithFallback<T = string>(
  options: FallbackOptions,
  callOptions: GenerateCallOptions,
  validator?: (text: string) => { valid: boolean; parsed?: T }
): Promise<{
  text: string;
  parsed?: T;
  modelUsed: number;
  modelId: string;
  status: string;
}> {
  const {
    primaryModel,
    fallbackModels = ADVANCED_FALLBACK_MODELS,
    apiKey: providedApiKey,
    context = "API",
    useAsyncApiKey = false,
  } = options;

  const { system, messages } = callOptions;

  // Get API key
  let apiKey = providedApiKey || "";
  if (!apiKey && useAsyncApiKey) {
    try {
      apiKey = await getGeminiApiKeyAsync();
    } catch (e) {
      logError(context, "Error fetching API key", { error: e });
    }
  }

  const getProvider = () => (apiKey ? getGoogleProvider(apiKey) : google);

  // Build the model order: primary first, then fallbacks
  const modelOrder = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

  for (let i = 0; i < modelOrder.length; i++) {
    const modelId = modelOrder[i];
    devLog("info", context, `Trying model ${i + 1}/${modelOrder.length}: ${modelId}`);

    try {
      const provider = getProvider();
      const result = await generateText({
        model: typeof provider === "function" ? provider(modelId) : (provider as any)(modelId),
        system,
        messages: messages as any,
      });

      const text = result.text;
      devLog("debug", context, `Model ${modelId} response length: ${text?.length}`);

      if (!text || text.trim() === "") {
        devLog("warn", context, `Model ${modelId} returned empty response, trying next...`);
        continue;
      }

      // If a validator is provided, use it
      if (validator) {
        const validation = validator(text);
        if (validation.valid) {
          logInfo(context, `Analysis completed with model ${i + 1}`, { modelId });
          return {
            text,
            parsed: validation.parsed,
            modelUsed: i + 1,
            modelId,
            status: MODEL_STATUS_MESSAGES[modelId] || "Analysis complete",
          };
        }
        devLog("warn", context, `Model ${modelId} response failed validation, trying next...`);
        continue;
      }

      // No validator, return successful response
      return {
        text,
        modelUsed: i + 1,
        modelId,
        status: MODEL_STATUS_MESSAGES[modelId] || "Analysis complete",
      };
    } catch (modelError: any) {
      logError(context, `Model ${modelId} failed`, { error: modelError.message });
    }
  }

  // All models failed
  throw new Error(`All models failed for ${context}`);
}

/**
 * Parse and categorize API errors into user-friendly messages.
 */
export interface ParsedApiError {
  userFriendlyError: string;
  errorCode: string;
}

export function parseApiError(error: Error | string): ParsedApiError {
  const errorMessage = typeof error === "string" ? error : error.message || error.toString() || "";

  if (errorMessage.includes("leaked") || errorMessage.includes("API key was reported")) {
    return {
      userFriendlyError:
        "API key has been flagged as leaked. Please generate a new API key from Google AI Studio and update your .env.local file.",
      errorCode: "API_KEY_LEAKED",
    };
  }

  if (errorMessage.includes("invalid") || errorMessage.includes("API_KEY_INVALID")) {
    return {
      userFriendlyError:
        "Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env.local file.",
      errorCode: "API_KEY_INVALID",
    };
  }

  if (
    errorMessage.includes("quota") ||
    errorMessage.includes("RATE_LIMIT") ||
    errorMessage.includes("429")
  ) {
    return {
      userFriendlyError:
        "API quota exceeded. Please wait a moment or check your Google AI Studio billing.",
      errorCode: "API_QUOTA_EXCEEDED",
    };
  }

  if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
    return {
      userFriendlyError: "AI model not available. Please try again or contact support.",
      errorCode: "MODEL_NOT_FOUND",
    };
  }

  return {
    userFriendlyError: "An error occurred. Please try again.",
    errorCode: "UNKNOWN_ERROR",
  };
}

/**
 * Build a standard error response for API routes.
 */
export function buildErrorResponse(
  error: Error | string,
  defaultMessage = "API error",
  includeDetails = process.env.NODE_ENV === "development"
): Response {
  const { userFriendlyError, errorCode } = parseApiError(error);
  const errorMessage = typeof error === "string" ? error : error.message || "";

  return new Response(
    JSON.stringify({
      error: userFriendlyError || defaultMessage,
      code: errorCode,
      details: includeDetails ? errorMessage : undefined,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
