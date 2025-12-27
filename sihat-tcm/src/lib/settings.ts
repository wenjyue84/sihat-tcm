import { supabaseAdmin } from "./supabaseAdmin";
import { devLog } from "./systemLogger";

// Default settings
export const DEFAULT_SETTINGS = {
  medicalHistorySummaryPrompt: `You are a medical assistant helping patients summarize their medical history for doctor consultations.

Based on the patient's previous TCM diagnosis reports and uploaded medical documents, create a clear, concise medical history summary that:

1. Lists main health complaints and patterns
2. Mentions relevant TCM diagnoses and syndrome patterns
3. Notes important findings from medical reports
4. Highlights chronic conditions or ongoing treatments
5. Uses simple, patient-friendly language

The summary should be 3-5 sentences that the patient can easily share with their doctor.

Previous Diagnosis History:
{inquiries}

Medical Reports:
{reports}

Generate a concise medical history summary:`,
  dietaryAdvicePrompt: `You are a TCM dietary expert capable of advising patients on what foods to eat or avoid based on their diagnosis.

Context:
Patient Profile: {profile}
Latest Diagnosis: {diagnosis}
Latest Dietary Advice: {advice}

User Question: {question}

Please answer the user's question based on the above context.
If the food is beneficial, explain why in TCM terms (e.g., tonifies Qi, clears heat).
If the food should be avoided, explain why (e.g., adds dampness, too cold).
If it depends, explain the conditions.
Keep the answer concise and helpful.`,
};

export interface AdminSettings {
  geminiApiKey?: string;
  medicalHistorySummaryPrompt?: string;
  dietaryAdvicePrompt?: string;
  backgroundMusicEnabled?: boolean;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  [key: string]: unknown;
}

/**
 * Fetch admin settings from Supabase with file fallback (Server-side only)
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    // Use the new storage system with fallback
    const { getSettingsWithFallback } = await import("./settingsStorage");
    return await getSettingsWithFallback();
  } catch (error) {
    devLog("error", "Settings", "Error fetching settings", { error });
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get the Gemini API key from Environment
 */
export async function getGeminiApiKeyAsync(): Promise<string> {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

/**
 * Sync helper for Env var only
 */
export function getGeminiApiKeyEnv(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

/**
 * @deprecated Use getGeminiApiKeyAsync instead
 */
export function getGeminiApiKey(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

/**
 * Check if a custom API key is configured (Always false in env-only mode)
 */
export function hasCustomApiKey(): boolean {
  return false;
}
