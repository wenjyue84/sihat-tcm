import { z } from "zod";

// ============================================================================
// SHARED VALIDATION SCHEMAS FOR API ROUTES
// ============================================================================

// Moved from validations.ts for better organization

// Supported languages
export const languageSchema = z.enum(["en", "zh", "ms"]).default("en");

// Supported Gemini models
export const modelSchema = z
  .string()
  .refine((val) => val.startsWith("gemini-") || val === "", {
    message: "Invalid model name - must be a Gemini model",
  })
  .default("gemini-2.0-flash");

// Base64 data URI pattern (for images/audio)
const dataUriRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+);base64,[A-Za-z0-9+/]+=*$/;

export const base64DataUriSchema = z
  .string()
  .refine((val) => dataUriRegex.test(val), {
    message: "Invalid data URI format - expected base64 encoded data",
  });

// ============================================================================
// CHAT MESSAGE SCHEMAS
// ============================================================================

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const chatMessagesSchema = z.array(chatMessageSchema).min(0);

// ============================================================================
// BASIC INFO SCHEMA (Patient Information)
// ============================================================================

export const basicInfoSchema = z
  .object({
    name: z.string().optional(),
    age: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional(),
    height: z.union([z.string(), z.number()]).optional(),
    weight: z.union([z.string(), z.number()]).optional(),
    symptoms: z.string().optional(),
    symptomDuration: z.string().optional(),
  })
  .optional();

// ============================================================================
// API ROUTE SCHEMAS
// ============================================================================

// /api/chat - Interactive consultation chat
export const chatRequestSchema = z.object({
  messages: chatMessagesSchema,
  basicInfo: basicInfoSchema,
  model: modelSchema,
  language: languageSchema,
});

// /api/analyze-image - Image analysis (tongue, face, body)
export const analyzeImageRequestSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  type: z.enum(["tongue", "face", "body", "other"]).optional(),
  symptoms: z.string().optional(),
  mainComplaint: z.string().optional(),
});

// /api/analyze-audio - Voice/breathing analysis
export const analyzeAudioRequestSchema = z.object({
  audio: z.string().min(1, "Audio data is required"),
});

// /api/summarize-inquiry - Summarize chat history
export const summarizeInquiryRequestSchema = z.object({
  chatHistory: z.array(chatMessageSchema).min(1, "Chat history is required"),
  reportFiles: z
    .array(
      z.object({
        name: z.string(),
        extractedText: z.string().optional(),
      })
    )
    .optional(),
  medicineFiles: z
    .array(
      z.object({
        name: z.string(),
        extractedText: z.string().optional(),
      })
    )
    .optional(),
  basicInfo: basicInfoSchema,
  language: languageSchema,
  model: modelSchema,
});

// /api/report-chat - Report Q&A
export const reportChatRequestSchema = z.object({
  messages: chatMessagesSchema.min(1, "At least one message is required"),
  reportData: z.record(z.string(), z.any()).optional(),
  patientInfo: basicInfoSchema,
  language: languageSchema,
  model: modelSchema,
});

// /api/consult - Final diagnosis synthesis (complex nested structure)
export const consultRequestSchema = z.object({
  data: z
    .object({
      basic_info: z.record(z.string(), z.any()).optional(),
      verified_summaries: z.record(z.string(), z.any()).optional(),
      wen_inquiry: z.string().optional(),
      wen_chat: z.array(z.any()).optional(),
      qie: z.record(z.string(), z.any()).optional(),
      wang_tongue: z.record(z.string(), z.any()).optional(),
      wang_face: z.record(z.string(), z.any()).optional(),
      wang_body: z.record(z.string(), z.any()).optional(),
      wen_audio: z.record(z.string(), z.any()).optional(),
      smart_connect: z.record(z.string(), z.any()).optional(),
      report_options: z.record(z.string(), z.any()).optional(),
    })
    .passthrough(),
  prompt: z.string().optional(),
  model: modelSchema,
  language: languageSchema,
});

// /api/extract-text - OCR for documents
export const extractTextRequestSchema = z.object({
  file: z.string().min(1, "File data is required"),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  mode: z.enum(["medical_report", "medicine", "general"]).optional(),
  language: languageSchema,
});

// /api/validate-medicine - Medicine validation
export const validateMedicineRequestSchema = z.object({
  text: z.string().min(1, "Medicine text is required"),
  language: languageSchema,
});

// /api/generate-infographic - Report visualization
export const generateInfographicRequestSchema = z.object({
  prompt: z.string().optional(),
  style: z.string().optional(),
  reportData: z.record(z.string(), z.any()).optional(),
  patientInfo: basicInfoSchema,
});

// /api/admin/assistant & /api/developer/assistant - Admin/Developer chatbot
export const assistantRequestSchema = z.object({
  messages: chatMessagesSchema.min(1, "At least one message is required"),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError["issues"] };

/**
 * Validates request body against a Zod schema
 * Returns a standardized result object
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message
  const errorMessages = result.error.issues
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join("; ");

  return {
    success: false,
    error: errorMessages || "Validation failed",
    details: result.error.issues,
  };
}

/**
 * Creates a 400 Bad Request response for validation errors
 */
export function validationErrorResponse(error: string, details?: z.ZodError["issues"]) {
  return new Response(
    JSON.stringify({
      error: "Validation Error",
      message: error,
      code: "VALIDATION_ERROR",
      details: process.env.NODE_ENV === "development" ? details : undefined,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}


