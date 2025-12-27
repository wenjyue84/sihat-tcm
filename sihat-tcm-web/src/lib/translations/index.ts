// Translations index file
export { en, type TranslationKeys } from "./en";
export { zh } from "./zh";
export { ms } from "./ms";

import { en } from "./en";
import { zh } from "./zh";
import { ms } from "./ms";

export type Language = "en" | "zh" | "ms";

export const translations = {
  en,
  zh,
  ms,
} as const;

export const languageNames: Record<Language, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  zh: { native: "中文", english: "Chinese" },
  ms: { native: "Bahasa Malaysia", english: "Malay" },
};

// Get the default language based on browser settings
export function getDefaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";

  const browserLang = navigator.language || (navigator as any).userLanguage || "en";
  const langCode = browserLang.toLowerCase().split("-")[0];

  // Map browser language codes to our supported languages
  if (langCode === "zh") return "zh";
  if (langCode === "ms" || langCode === "my") return "ms";

  return "en";
}

// Get translation for a specific key path
export function getTranslation(translations: typeof en, path: string): string {
  const keys = path.split(".");
  let result: any = translations;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path; // Return the path if translation not found
    }
  }

  return typeof result === "string" ? result : path;
}

// Helper to translate TCM constitution names
export function translateConstitution(name: string, t: any): string {
  if (!name) return t.constitutions.balanced;
  const normalized = name.toLowerCase();
  if (
    normalized.includes("neutral") ||
    normalized.includes("normal") ||
    normalized.includes("ping he") ||
    normalized.includes("balanced")
  )
    return t.constitutions.balanced;
  if (normalized.includes("qi deficiency")) return t.constitutions.qiDeficiency;
  if (normalized.includes("yang deficiency")) return t.constitutions.yangDeficiency;
  if (normalized.includes("yin deficiency")) return t.constitutions.yinDeficiency;
  if (normalized.includes("phlegm")) return t.constitutions.phlegmDamp;
  if (normalized.includes("damp heat")) return t.constitutions.dampHeat;
  if (normalized.includes("blood stasis") || normalized.includes("blood deficiency"))
    return t.constitutions.bloodStasis; // Grouping for now if needed
  if (normalized.includes("qi stagnation") || normalized.includes("qi depression"))
    return t.constitutions.qiStagnation;
  if (normalized.includes("special")) return t.constitutions.special;
  return name;
}
