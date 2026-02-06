import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getImageAnalysisPrompt } from "@/lib/systemPrompts";
import {
  ENHANCED_TONGUE_USER_PROMPT,
  ENHANCED_TONGUE_SYSTEM_PROMPT,
} from "@/lib/enhancedTonguePrompt";
import { logInfo, logError, devLog } from "@/lib/systemLogger";
import {
  analyzeImageRequestSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validations";
import { fetchCustomPrompt } from "@/lib/promptLoader";
import { ADVANCED_FALLBACK_MODELS, MODEL_STATUS_MESSAGES } from "@/lib/modelFallback";
import { getCorsHeaders } from "@/lib/cors";
import { createErrorResponseWithStatus } from "@/lib/api/middleware/error-handler";

export const maxDuration = 120;

function isValidObservation(text: string): boolean {
  if (!text || text.trim().length < 50) return false;
  const invalidPatterns = [
    "cannot analyze",
    "unable to analyze",
    "no observation",
    "unclear image",
    "cannot see",
    "not visible",
    "I cannot",
    "I'm unable",
    "sorry",
  ];
  const lowerText = text.toLowerCase();
  return !invalidPatterns.some((pattern) => lowerText.includes(pattern));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validation = validateRequest(analyzeImageRequestSchema, body);
    if (!validation.success) {
      devLog("warn", "API/analyze-image", "Validation failed", { error: validation.error });
      return validationErrorResponse(validation.error, validation.details);
    }

    const { image, type, symptoms, mainComplaint } = validation.data;

    // Log the analysis request
    logInfo("ImageProc", `Image analysis started for type: ${type || "unknown"}`, {
      imageType: type,
      hasSymptoms: !!symptoms,
      hasMainComplaint: !!mainComplaint,
    });

    // Fetch custom image analysis prompt using centralized loader
    const customPrompt = await fetchCustomPrompt("doctor_image");

    // Get the appropriate prompt based on image type
    const imageType = type === "tongue" ? "tongue" : type === "face" ? "face" : "other";
    const { system: defaultSystemPrompt, user: defaultUserPrompt } =
      getImageAnalysisPrompt(imageType);

    // For tongue analysis, use enhanced prompts (unless custom prompt is set)
    // This ensures we get the analysis_tags format with confidence levels
    let systemPrompt: string;
    let userPrompt: string;

    if (type === "tongue" && !customPrompt) {
      // Use enhanced prompts for detailed analysis_tags
      systemPrompt = ENHANCED_TONGUE_SYSTEM_PROMPT;
      userPrompt = ENHANCED_TONGUE_USER_PROMPT;
      devLog("debug", "API/analyze-image", "Using ENHANCED tongue prompts for analysis_tags");
    } else {
      // Use custom prompt if set, otherwise use default from library
      systemPrompt = customPrompt || defaultSystemPrompt;
      userPrompt = defaultUserPrompt;
    }

    // Add patient context to user prompt if available
    if (symptoms || mainComplaint) {
      userPrompt += `\n\nPATIENT CONTEXT:\nMain Complaint: ${mainComplaint || "Not provided"}\nSymptoms: ${symptoms || "Not provided"}`;
    }

    // Try each model in order until we get a valid result using centralized fallback list
    for (let i = 0; i < ADVANCED_FALLBACK_MODELS.length; i++) {
      const modelId = ADVANCED_FALLBACK_MODELS[i];
      devLog(
        "info",
        "API/analyze-image",
        `Trying model ${i + 1}/${ADVANCED_FALLBACK_MODELS.length}: ${modelId}`
      );

      try {
        const result = await generateText({
          model: google(modelId),
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image", image: image },
              ],
            },
          ],
        });

        const text = result.text;
        devLog("debug", "API/analyze-image", `Model ${modelId} response`, {
          preview: text?.substring(0, 200),
        });

        if (!text || text.trim() === "") {
          devLog(
            "warn",
            "API/analyze-image",
            `Model ${modelId} returned empty response, trying next...`
          );
          continue;
        }

        // Clean up and parse
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();

        try {
          const data = JSON.parse(cleanJson);

          // Check for confidence-based validation
          const confidence = data.confidence ?? 100; // Default to 100 for backward compatibility
          const isValidImage = data.is_valid_image ?? true;
          const imageDescription = data.image_description || "";

          devLog("debug", "API/analyze-image", `Model ${modelId} analysis`, {
            confidence,
            isValidImage,
            imageDescription,
          });

          // If confidence is too low or image is invalid, return appropriate response
          if (!isValidImage || confidence < 60) {
            devLog("warn", "API/analyze-image", `Image not valid for ${type} analysis`, {
              confidence,
            });
            return new Response(
              JSON.stringify({
                observation: "",
                potential_issues: [],
                modelUsed: i + 1,
                status: "invalid_image",
                confidence: confidence,
                image_description: imageDescription,
                message: `This image does not appear to contain a ${type}. Detected: ${imageDescription || "unrecognized content"}`,
              }),
              {
                headers: {
                  ...getCorsHeaders(req),
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const observation = data.observation || data.analysis || data.description || text;

          // Log analysis_tags for debugging
          devLog(
            "debug",
            "API/analyze-image",
            `analysis_tags found: ${data.analysis_tags?.length || 0}`,
            {
              firstTag: data.analysis_tags?.[0]?.title,
            }
          );

          if (isValidObservation(observation)) {
            // Log successful analysis
            logInfo("AI", `Image analysis completed with model ${i + 1}`, {
              modelUsed: modelId,
              confidence,
              imageType: type,
              analysisTagsCount: data.analysis_tags?.length || 0,
            });

            return new Response(
              JSON.stringify({
                observation,
                potential_issues:
                  data.potential_issues ||
                  data.issues ||
                  data.indications ||
                  data.pattern_suggestions ||
                  [],
                modelUsed: i + 1,
                status: MODEL_STATUS_MESSAGES[modelId] || "Analysis complete",
                confidence: confidence,
                image_description: imageDescription,
                // Enhanced tongue analysis fields
                analysis_tags: data.analysis_tags || [],
                tcm_indicators: data.tcm_indicators || [],
                pattern_suggestions: data.pattern_suggestions || [],
                notes: data.notes || "",
              }),
              {
                headers: {
                  ...getCorsHeaders(req),
                  "Content-Type": "application/json",
                },
              }
            );
          }
          devLog(
            "warn",
            "API/analyze-image",
            `Model ${modelId} returned invalid observation, trying next...`
          );
        } catch {
          // JSON parse failed, check if raw text is valid
          if (isValidObservation(text)) {
            return new Response(
              JSON.stringify({
                observation: text,
                potential_issues: [],
                modelUsed: i + 1,
                status: MODEL_STATUS_MESSAGES[modelId] || "Analysis complete",
                confidence: 100, // Assume high confidence for raw text responses
              }),
              {
                headers: {
                  ...getCorsHeaders(req),
                  "Content-Type": "application/json",
                },
              }
            );
          }
        }
      } catch (modelError: any) {
        devLog("error", "API/analyze-image", `Model ${modelId} failed`, {
          error: modelError.message,
        });
        // Continue to next model
      }
    }

    // All models failed
    return new Response(
      JSON.stringify({
        observation:
          "Unable to analyze the image at this time. The visual inspection results will be reviewed manually.",
        potential_issues: [],
        modelUsed: 0,
        status: "Analysis pending",
      }),
      {
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("ImageProc", `Image analysis failed: ${errorMessage}`, { error: errorMessage });
    return createErrorResponseWithStatus(error, "API/analyze-image", 200, {
      observation: `Analysis encountered an issue. Please continue and we'll review the image later.`,
      potential_issues: [],
      modelUsed: 0,
      status: "error",
      error: errorMessage,
    });
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
