import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { devLog } from "@/lib/systemLogger";
import { getLanguageInstruction, normalizeLanguage } from "@/lib/translations/languageInstructions";
import { DEFAULT_FALLBACK_MODELS } from "@/lib/modelFallback";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";
import {
  reportChatRequestSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validations";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validation = validateRequest(reportChatRequestSchema, body);
    if (!validation.success) {
      devLog("warn", "API/report-chat", "Validation failed", { error: validation.error });
      return validationErrorResponse(validation.error, validation.details);
    }

    const { messages, reportData, patientInfo, language: rawLanguage, model } = validation.data;
    const language = normalizeLanguage(rawLanguage);

    devLog("info", "API/report-chat", `Received request`, { model, language });

    // Build context from the report data
    const reportContext = buildReportContext(reportData, patientInfo);

    // Get language instruction using centralized utility
    const languageInstruction = getLanguageInstruction("friendly", language);

    const systemPrompt = `${languageInstruction}

You are a helpful TCM (Traditional Chinese Medicine) assistant helping a patient understand their diagnosis report.

═══════════════════════════════════════════════════════════════════════════════
                          PATIENT'S TCM DIAGNOSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

${reportContext}

═══════════════════════════════════════════════════════════════════════════════

YOUR ROLE:
1. Answer questions about the patient's TCM diagnosis in an easy-to-understand way
2. Explain medical/TCM terminology simply
3. Provide educational context about TCM concepts (Yin/Yang, Qi, Five Elements, etc.)
4. Clarify the reasoning behind food recommendations, lifestyle advice, and treatments
5. Be encouraging and supportive while maintaining accuracy
6. If asked about something not in the report, politely explain you can only discuss the current diagnosis

GUIDELINES:
- Keep responses concise but informative (2-4 paragraphs max)
- Use analogies to explain complex TCM concepts
- Be empathetic and reassuring
- Do NOT provide medical advice beyond what's in the report
- Encourage them to consult a licensed TCM practitioner for personalized treatment
- Never diagnose new conditions or change the assessment

Remember: You're here to help them understand their existing report, not to conduct new consultations.`;

    // Convert messages to the format expected by the model
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    devLog("info", "API/report-chat", `Calling streamText with model: ${model}`);

    // Try the requested model first
    try {
      const result = streamText({
        model: google(model),
        system: systemPrompt,
        messages: formattedMessages,
        onFinish: (completion) => {
          devLog("info", "API/report-chat", `Stream finished with ${model}`, {
            textLength: completion.text.length,
          });
        },
      });

      return result.toTextStreamResponse();
    } catch (primaryError: any) {
      devLog("error", "API/report-chat", `Primary model ${model} failed`, {
        error: primaryError.message,
      });

      // Try fallback models in order using centralized fallback list
      for (const fallbackModel of DEFAULT_FALLBACK_MODELS) {
        // Skip if it's the same as the failed model
        if (fallbackModel === model) continue;

        try {
          devLog("info", "API/report-chat", `Attempting fallback model: ${fallbackModel}`);
          const fallbackResult = streamText({
            model: google(fallbackModel),
            system: systemPrompt,
            messages: formattedMessages,
            onFinish: (completion) => {
              devLog("info", "API/report-chat", `Fallback ${fallbackModel} finished`, {
                textLength: completion.text.length,
              });
            },
          });

          return fallbackResult.toTextStreamResponse();
        } catch (fallbackError: any) {
          devLog("error", "API/report-chat", `Fallback ${fallbackModel} also failed`, {
            error: fallbackError.message,
          });
          // Continue to next fallback
        }
      }

      // All models failed
      throw new Error(`All models failed. Primary error: ${primaryError.message}`);
    }
  } catch (error: unknown) {
    return createErrorResponse(error, "API/report-chat");
  }
}

function buildReportContext(reportData: any, patientInfo: any): string {
  let context = "";

  // Patient Information
  if (patientInfo) {
    context += `PATIENT INFORMATION:
- Name: ${patientInfo.name || "Not provided"}
- Age: ${patientInfo.age || "Not provided"}
- Gender: ${patientInfo.gender || "Not provided"}
- Chief Complaint: ${patientInfo.symptoms || "Not provided"}
`;
  }

  // Diagnosis
  if (reportData.diagnosis) {
    const diagnosis =
      typeof reportData.diagnosis === "string"
        ? reportData.diagnosis
        : reportData.diagnosis.primary_pattern || JSON.stringify(reportData.diagnosis);
    context += `\nMAIN DIAGNOSIS (辨证): ${diagnosis}\n`;

    if (typeof reportData.diagnosis === "object") {
      if (reportData.diagnosis.secondary_patterns?.length > 0) {
        context += `Secondary Patterns: ${reportData.diagnosis.secondary_patterns.join(", ")}\n`;
      }
      if (reportData.diagnosis.affected_organs?.length > 0) {
        context += `Affected Organs: ${reportData.diagnosis.affected_organs.join(", ")}\n`;
      }
    }
  }

  // Constitution
  if (reportData.constitution) {
    const constitution =
      typeof reportData.constitution === "string"
        ? reportData.constitution
        : reportData.constitution.type || JSON.stringify(reportData.constitution);
    context += `\nCONSTITUTION TYPE: ${constitution}\n`;

    if (typeof reportData.constitution === "object" && reportData.constitution.description) {
      context += `Description: ${reportData.constitution.description}\n`;
    }
  }

  // Analysis
  if (reportData.analysis) {
    const analysis =
      typeof reportData.analysis === "string"
        ? reportData.analysis
        : reportData.analysis.summary || JSON.stringify(reportData.analysis);
    context += `\nFINAL ANALYSIS (综合诊断): ${analysis}\n`;

    if (typeof reportData.analysis === "object" && reportData.analysis.pattern_rationale) {
      context += `Rationale: ${reportData.analysis.pattern_rationale}\n`;
    }
  }

  // Recommendations
  if (reportData.recommendations) {
    context += "\nRECOMMENDATIONS:\n";

    if (reportData.recommendations.food_therapy?.beneficial?.length > 0) {
      context += `- Beneficial Foods: ${reportData.recommendations.food_therapy.beneficial.join(", ")}\n`;
    }
    if (reportData.recommendations.food || [].length > 0) {
      context += `- Recommended Foods: ${reportData.recommendations.food.join(", ")}\n`;
    }
    if (reportData.recommendations.food_therapy?.avoid?.length > 0) {
      context += `- Foods to Avoid: ${reportData.recommendations.food_therapy.avoid.join(", ")}\n`;
    }
    if (reportData.recommendations.avoid?.length > 0) {
      context += `- Avoid: ${reportData.recommendations.avoid.join(", ")}\n`;
    }
    if (reportData.recommendations.lifestyle?.length > 0) {
      context += `- Lifestyle Advice: ${reportData.recommendations.lifestyle.join("; ")}\n`;
    }
    if (reportData.recommendations.acupoints?.length > 0) {
      context += `- Acupressure Points: ${reportData.recommendations.acupoints.join(", ")}\n`;
    }
    if (reportData.recommendations.exercise?.length > 0) {
      context += `- Exercise: ${reportData.recommendations.exercise.join("; ")}\n`;
    }
    if (reportData.recommendations.sleep_guidance) {
      context += `- Sleep Guidance: ${reportData.recommendations.sleep_guidance}\n`;
    }
    if (reportData.recommendations.emotional_care) {
      context += `- Emotional Wellness: ${reportData.recommendations.emotional_care}\n`;
    }
    if (reportData.recommendations.herbal_formulas?.length > 0) {
      context += `- Herbal Formulas: ${reportData.recommendations.herbal_formulas.map((f: any) => f.name).join(", ")}\n`;
    }
  }

  // Precautions
  if (reportData.precautions) {
    context += "\nPRECAUTIONS:\n";
    if (reportData.precautions.warning_signs?.length > 0) {
      context += `- Warning Signs: ${reportData.precautions.warning_signs.join("; ")}\n`;
    }
    if (reportData.precautions.contraindications?.length > 0) {
      context += `- Contraindications: ${reportData.precautions.contraindications.join("; ")}\n`;
    }
  }

  // Follow-up
  if (reportData.follow_up) {
    context += "\nFOLLOW-UP:\n";
    if (reportData.follow_up.timeline) {
      context += `- Timeline: ${reportData.follow_up.timeline}\n`;
    }
    if (reportData.follow_up.expected_improvement) {
      context += `- Expected Improvement: ${reportData.follow_up.expected_improvement}\n`;
    }
  }

  return context;
}
