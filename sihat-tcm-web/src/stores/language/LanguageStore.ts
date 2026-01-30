/**
 * Language Store
 * 
 * Manages language preferences and internationalization state
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  translations,
  Language,
  getDefaultLanguage,
  TranslationKeys,
  languageNames,
} from "@/lib/translations";
import { logger } from "@/lib/clientLogger";
import {
  LanguageStore,
  STORAGE_KEYS
} from "../interfaces/StoreInterfaces";

export const useLanguageStore = create<LanguageStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    language: "en",
    languageLoaded: false,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    setLanguage: (lang) => {
      set({ language: lang });
      
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.language, lang);
        
        // Update document language attribute
        const langCode = lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en";
        document.documentElement.lang = langCode;
        
        logger.info("LanguageStore", "Language changed", { language: lang, langCode });
      }

      // Sync with profile if available (handled by parent store)
      // This allows for loose coupling between stores
    },

    syncLanguageFromProfile: (lang) => {
      if (!["en", "zh", "ms"].includes(lang)) {
        logger.warn("LanguageStore", "Invalid language from profile", { language: lang });
        return;
      }

      set({ language: lang });
      
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.language, lang);
        
        const langCode = lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en";
        document.documentElement.lang = langCode;
        
        logger.info("LanguageStore", "Language synced from profile", { language: lang });
      }
    },

    setLanguageLoaded: (loaded) => {
      set({ languageLoaded: loaded });
    },

    initializeLanguage: () => {
      // Check localStorage first
      if (typeof window !== "undefined") {
        const savedLanguage = localStorage.getItem(STORAGE_KEYS.language) as Language | null;
        
        if (savedLanguage && ["en", "zh", "ms"].includes(savedLanguage)) {
          set({ language: savedLanguage, languageLoaded: true });
          
          const langCode = savedLanguage === "zh" ? "zh-CN" : savedLanguage === "ms" ? "ms-MY" : "en";
          document.documentElement.lang = langCode;
          
          logger.info("LanguageStore", "Language loaded from localStorage", { language: savedLanguage });
        } else {
          // Fallback to browser default language
          const browserLanguage = getDefaultLanguage();
          set({ language: browserLanguage, languageLoaded: true });
          localStorage.setItem(STORAGE_KEYS.language, browserLanguage);
          
          const langCode = browserLanguage === "zh" ? "zh-CN" : browserLanguage === "ms" ? "ms-MY" : "en";
          document.documentElement.lang = langCode;
          
          logger.info("LanguageStore", "Language set to browser default", { language: browserLanguage });
        }
      } else {
        // Server-side: just mark as loaded
        set({ languageLoaded: true });
      }
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export const useLanguage = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const syncLanguageFromProfile = useLanguageStore((state) => state.syncLanguageFromProfile);
  const languageLoaded = useLanguageStore((state) => state.languageLoaded);
  
  const t = translations[language];

  return {
    language,
    setLanguage,
    syncLanguageFromProfile,
    t,
    languageNames,
    isLoaded: languageLoaded,
    translations: t,
  };
};

// ============================================================================
// TRANSLATION HOOKS
// ============================================================================

/**
 * Hook for accessing specific translation sections
 */
export function useTranslation<K extends keyof TranslationKeys>(section: K): TranslationKeys[K] {
  const { t } = useLanguage();
  return t[section];
}

/**
 * Hook for getting translation function
 */
export const useT = () => {
  const { t } = useLanguage();
  return t;
};

/**
 * Hook for language switching with validation
 */
export const useLanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  
  const switchLanguage = (newLanguage: Language) => {
    if (!["en", "zh", "ms"].includes(newLanguage)) {
      logger.warn("LanguageStore", "Invalid language switch attempt", { language: newLanguage });
      return false;
    }
    
    setLanguage(newLanguage);
    return true;
  };

  const getLanguageLabel = (lang: Language) => {
    return languageNames[lang] || lang;
  };

  const availableLanguages: Language[] = ["en", "zh", "ms"];

  return {
    currentLanguage: language,
    switchLanguage,
    getLanguageLabel,
    availableLanguages,
    languageNames,
  };
};