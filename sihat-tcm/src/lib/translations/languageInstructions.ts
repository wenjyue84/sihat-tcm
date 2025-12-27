/**
 * Centralized language instruction templates for AI API routes.
 *
 * This module provides standardized language enforcement instructions
 * to ensure consistent multilingual responses from AI models.
 */

export type SupportedLanguage = "en" | "zh" | "ms";

/**
 * Basic language instructions for conversational AI responses.
 * Used for chat, inquiry, and general interaction endpoints.
 */
export const BASIC_LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: `
LANGUAGE REQUIREMENT: You MUST respond entirely in English. Ask questions and provide all responses in clear, simple English.
`,
  zh: `
语言要求：你必须完全使用中文回复。所有问诊对话必须使用简体中文。
请使用简单易懂的中文，确保老年患者能够理解。不要使用英文或马来文。
`,
  ms: `
KEPERLUAN BAHASA: Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Tanya soalan dan berikan semua respons dalam Bahasa Malaysia yang jelas dan mudah.
`,
};

/**
 * Strict language instructions that explicitly prohibit code-switching.
 * Used for diagnosis reports and formal documentation.
 */
export const STRICT_LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: `
IMPORTANT: You MUST respond entirely in English. All text, including section headers, diagnosis terms, food names, and recommendations must be in English.
- DO NOT use any Chinese characters.
- DO NOT use Pinyin.
- DO NOT provide bilingual terms (e.g., do NOT write "Qi Deficiency (气虚)", just write "Qi Deficiency").
- Translate all TCM terms into standard English medical/TCM terminology.
`,
  zh: `
重要提示：你必须完全使用中文回复。所有文字，包括标题、诊断术语、食物名称和建议都必须使用中文。
- 不要使用英文。
- 不要使用拼音。
- 不要提供双语术语（例如，不要写 "Spleen Qi Deficiency (脾气虚)"，只写 "脾气虚"）。
请确保所有内容对不懂英文的老年华人用户友好。使用简体中文。
`,
  ms: `
PENTING: Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Semua teks, termasuk tajuk seksyen, terma diagnosis, nama makanan, dan cadangan mesti dalam Bahasa Malaysia. Jangan gunakan huruf Cina atau perkataan Inggeris.
`,
};

/**
 * Friendly language instructions for report chat/Q&A.
 * Shorter and less formal than strict instructions.
 */
export const FRIENDLY_LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: `You MUST respond entirely in English. Be clear, friendly, and educational.`,
  zh: `你必须完全使用简体中文回复。语言要清晰、友好、有教育性。`,
  ms: `Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan bersifat mendidik.`,
};

/**
 * Final instruction blocks for diagnosis reports.
 * Visually prominent reminders at the end of prompts.
 */
export const FINAL_LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: `
═══════════════════════════════════════════════════════════════════════════════
         Please provide a comprehensive diagnosis based on the above data
                    ALL RESPONSE TEXT MUST BE IN ENGLISH
═══════════════════════════════════════════════════════════════════════════════
`,
  zh: `
═══════════════════════════════════════════════════════════════════════════════
                      请根据以上资料进行综合诊断
                    所有回复内容必须使用中文
═══════════════════════════════════════════════════════════════════════════════
`,
  ms: `
═══════════════════════════════════════════════════════════════════════════════
         Sila berikan diagnosis komprehensif berdasarkan data di atas
              SEMUA TEKS RESPONS MESTI DALAM BAHASA MALAYSIA
═══════════════════════════════════════════════════════════════════════════════
`,
};

/**
 * Get the language instruction for the given type and language.
 *
 * @param type Instruction type (basic, strict, friendly, final)
 * @param language Language code
 * @returns The language instruction string
 */
export function getLanguageInstruction(
  type: "basic" | "strict" | "friendly" | "final",
  language: string
): string {
  const lang = (language as SupportedLanguage) || "en";
  const validLang = ["en", "zh", "ms"].includes(lang) ? lang : "en";

  switch (type) {
    case "basic":
      return BASIC_LANGUAGE_INSTRUCTIONS[validLang as SupportedLanguage];
    case "strict":
      return STRICT_LANGUAGE_INSTRUCTIONS[validLang as SupportedLanguage];
    case "friendly":
      return FRIENDLY_LANGUAGE_INSTRUCTIONS[validLang as SupportedLanguage];
    case "final":
      return FINAL_LANGUAGE_INSTRUCTIONS[validLang as SupportedLanguage];
    default:
      return BASIC_LANGUAGE_INSTRUCTIONS[validLang as SupportedLanguage];
  }
}

/**
 * Prepend language instructions to a system prompt.
 *
 * @param systemPrompt The original system prompt
 * @param type Instruction type
 * @param language Language code
 * @returns System prompt with language instructions prepended
 */
export function prependLanguageInstruction(
  systemPrompt: string,
  type: "basic" | "strict" | "friendly" = "basic",
  language: string = "en"
): string {
  const instruction = getLanguageInstruction(type, language);
  return `${instruction}\n\n${systemPrompt}`;
}

/**
 * Append final language instructions to content.
 *
 * @param content The content to append to
 * @param language Language code
 * @returns Content with final instructions appended
 */
export function appendFinalInstruction(content: string, language: string = "en"): string {
  const instruction = getLanguageInstruction("final", language);
  return `${content}${instruction}`;
}

/**
 * Get a dynamic inline language instruction.
 * Useful for embedding language preference in prompts.
 *
 * @param language Language code
 * @returns Human-readable language name with code
 */
export function getInlineLanguageLabel(language: string): string {
  switch (language) {
    case "zh":
      return "Chinese (Simplified/简体中文)";
    case "ms":
      return "Malay (Bahasa Malaysia)";
    case "en":
    default:
      return "English";
  }
}

/**
 * Get a simple one-line language instruction.
 *
 * @param language Language code
 * @returns Simple instruction sentence
 */
export function getSimpleLanguageInstruction(language: string): string {
  switch (language) {
    case "zh":
      return "Respond in Simplified Chinese (中文).";
    case "ms":
      return "Respond in Bahasa Malaysia.";
    case "en":
    default:
      return "Respond in English.";
  }
}

/**
 * Validate and normalize a language code.
 *
 * @param language Language code to validate
 * @returns Valid language code (defaults to 'en')
 */
export function normalizeLanguage(language: string | undefined): SupportedLanguage {
  if (language && ["en", "zh", "ms"].includes(language)) {
    return language as SupportedLanguage;
  }
  return "en";
}
