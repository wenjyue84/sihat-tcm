/**
 * Centralized prompt loading utilities for AI API routes.
 *
 * This module provides a unified way to fetch custom system prompts from
 * the database with fallback to library defaults.
 */

import { supabase } from "@/lib/supabase/client";
import { devLog, logError } from "@/lib/systemLogger";
import {
  INTERACTIVE_CHAT_PROMPT,
  FINAL_ANALYSIS_PROMPT,
  LISTENING_ANALYSIS_PROMPT,
  INQUIRY_SUMMARY_PROMPT,
  HEART_COMPANION_PROMPT,
  getImageAnalysisPrompt,
} from "@/lib/systemPrompts";

/**
 * Prompt role identifiers used in the database.
 * Maps to the 'role' column in the system_prompts table.
 */
export type PromptRole =
  | "doctor_chat"
  | "doctor_final"
  | "doctor_image"
  | "doctor_listening"
  | "doctor_inquiry_summary"
  | "doctor_report_chat"
  | "doctor_western_chat"
  | "heart_companion";

/**
 * Default prompts from the library, keyed by role.
 */
const DEFAULT_PROMPTS: Partial<Record<PromptRole, string>> = {
  doctor_chat: INTERACTIVE_CHAT_PROMPT,
  doctor_final: FINAL_ANALYSIS_PROMPT,
  doctor_listening: LISTENING_ANALYSIS_PROMPT,
  doctor_inquiry_summary: INQUIRY_SUMMARY_PROMPT,
  heart_companion: HEART_COMPANION_PROMPT,
};

/**
 * In-memory cache for system prompts to reduce database hits.
 * Cache entries expire after 5 minutes.
 */
interface CacheEntry {
  prompt: string;
  timestamp: number;
}

const promptCache = new Map<PromptRole, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the prompt cache. Useful after admin updates prompts.
 */
export function clearPromptCache(): void {
  promptCache.clear();
  devLog("info", "PromptLoader", "Prompt cache cleared");
}

/**
 * Clear a specific prompt from the cache.
 */
export function clearPromptCacheEntry(role: PromptRole): void {
  promptCache.delete(role);
  devLog("debug", "PromptLoader", `Cache entry cleared for role: ${role}`);
}

/**
 * Check if a cached entry is still valid.
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Fetch a custom system prompt from the database.
 *
 * @param role The prompt role identifier
 * @param useCache Whether to use cached values (default: true)
 * @returns The prompt text, or null if not found
 */
export async function fetchCustomPrompt(role: PromptRole, useCache = true): Promise<string | null> {
  // Check cache first
  if (useCache) {
    const cached = promptCache.get(role);
    if (isCacheValid(cached)) {
      devLog("debug", "PromptLoader", `Cache hit for role: ${role}`);
      return cached!.prompt;
    }
  }

  try {
    const { data, error } = await supabase
      .from("system_prompts")
      .select("prompt_text")
      .eq("role", role)
      .single();

    if (error) {
      // Not found is expected for roles without custom prompts
      if (error.code !== "PGRST116") {
        devLog("warn", "PromptLoader", `Error fetching prompt for ${role}`, {
          error: error.message,
        });
      }
      return null;
    }

    if (data?.prompt_text) {
      // Update cache
      promptCache.set(role, {
        prompt: data.prompt_text,
        timestamp: Date.now(),
      });
      devLog("debug", "PromptLoader", `Loaded custom prompt for role: ${role}`);
      return data.prompt_text;
    }

    return null;
  } catch (e) {
    logError("PromptLoader", `Exception fetching prompt for ${role}`, { error: e });
    return null;
  }
}

/**
 * Get a system prompt with database override support.
 *
 * First checks the database for a custom prompt. If not found,
 * returns the default prompt from the library.
 *
 * @param role The prompt role identifier
 * @param defaultPrompt Optional override for the default prompt
 * @returns The prompt text (custom or default)
 */
export async function getSystemPrompt(role: PromptRole, defaultPrompt?: string): Promise<string> {
  const customPrompt = await fetchCustomPrompt(role);

  if (customPrompt) {
    return customPrompt;
  }

  // Use provided default or fall back to library default
  return defaultPrompt || DEFAULT_PROMPTS[role] || "";
}

/**
 * Get the image analysis prompt based on image type.
 *
 * @param imageType Type of image (tongue, face, other)
 * @returns Object containing system and user prompts
 */
export async function getImagePrompt(
  imageType: "tongue" | "face" | "other"
): Promise<{ system: string; user: string }> {
  // Try to get custom prompt from database
  const customPrompt = await fetchCustomPrompt("doctor_image");

  // Get default prompts from library
  const { system: defaultSystem, user: defaultUser } = getImageAnalysisPrompt(imageType);

  return {
    system: customPrompt || defaultSystem,
    user: defaultUser,
  };
}

/**
 * Prompt loading options for batch operations.
 */
export interface PromptLoadOptions {
  /** Whether to use cached values */
  useCache?: boolean;
  /** Custom default prompt if database has none */
  defaultPrompt?: string;
}

/**
 * Load multiple prompts in parallel.
 *
 * @param roles Array of prompt roles to load
 * @param options Loading options
 * @returns Map of role to prompt text
 */
export async function loadPrompts(
  roles: PromptRole[],
  options: PromptLoadOptions = {}
): Promise<Map<PromptRole, string>> {
  const { useCache = true } = options;

  const results = await Promise.all(
    roles.map(async (role) => {
      const prompt = await getSystemPrompt(role);
      return [role, prompt] as const;
    })
  );

  return new Map(results);
}

/**
 * Preload commonly used prompts into cache.
 * Call this during app initialization or on admin login.
 */
export async function preloadCommonPrompts(): Promise<void> {
  const commonRoles: PromptRole[] = [
    "doctor_chat",
    "doctor_final",
    "doctor_image",
    "doctor_listening",
  ];

  devLog("info", "PromptLoader", "Preloading common prompts...");

  await Promise.all(commonRoles.map((role) => fetchCustomPrompt(role, false)));

  devLog("info", "PromptLoader", "Common prompts preloaded");
}
