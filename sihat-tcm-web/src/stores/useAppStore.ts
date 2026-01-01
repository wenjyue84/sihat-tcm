"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/clientLogger";
import { DOCTOR_LEVELS, DoctorLevel } from "@/lib/doctorLevels";
import {
  translations,
  Language,
  getDefaultLanguage,
  TranslationKeys,
  languageNames,
} from "@/lib/translations";
import {
  AccessibilityManager,
  AccessibilityPreferences,
  getAccessibilityManager,
} from "@/lib/accessibilityManager";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Role = "admin" | "doctor" | "patient" | "developer";

export interface UIPreferences {
  language?: "en" | "zh" | "ms";
  isDeveloperMode?: boolean;
  activeTab?: string;
  viewType?: "table" | "list" | "gallery";
  sortField?: string;
  sortDirection?: "asc" | "desc";
  [key: string]: any;
}

export interface Profile {
  id: string;
  role: Role;
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  medical_history?: string;
  preferred_language?: "en" | "zh" | "ms";
  constitution?: string;
  preferences?: UIPreferences;
}

// Navigation state for diagnosis progress
interface NavigationState {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  showNext?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
  canNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideBottomNav?: boolean;
}

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface AppState {
  // Auth State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authLoading: boolean;

  // Language State
  language: Language;
  languageLoaded: boolean;

  // Doctor Level State
  doctorLevel: DoctorLevel;
  doctorLevelLoading: boolean;

  // Diagnosis Progress State
  diagnosisProgress: number;
  diagnosisStepIndex: number;
  diagnosisFormProgress: { [stepId: string]: number };
  diagnosisNavigationState: NavigationState;

  // Accessibility State
  accessibilityManager: AccessibilityManager | null;
  accessibilityPreferences: AccessibilityPreferences;

  // Onboarding State
  hasCompletedOnboarding: boolean;
  onboardingLoading: boolean;

  // Developer State
  isDeveloperMode: boolean;

  // ============================================================================
  // ACTIONS - Auth
  // ============================================================================
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string, initialData?: Profile) => Promise<void>;
  updatePreferences: (prefs: Partial<UIPreferences>) => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;

  // ============================================================================
  // ACTIONS - Language
  // ============================================================================
  setLanguage: (lang: Language) => void;
  syncLanguageFromProfile: (lang: Language) => void;
  setLanguageLoaded: (loaded: boolean) => void;

  // ============================================================================
  // ACTIONS - Doctor Level
  // ============================================================================
  setDoctorLevel: (level: DoctorLevel) => void;
  setDoctorLevelLoading: (loading: boolean) => void;
  getModel: () => string;
  getDoctorInfo: () => (typeof DOCTOR_LEVELS)[DoctorLevel];

  // ============================================================================
  // ACTIONS - Diagnosis Progress
  // ============================================================================
  setDiagnosisProgress: (value: number) => void;
  incrementDiagnosisProgress: (delta: number) => void;
  setDiagnosisStepIndex: (index: number) => void;
  updateDiagnosisFormProgress: (
    stepId: string,
    completedFields: number,
    totalFields: number
  ) => void;
  resetDiagnosisProgress: () => void;
  setDiagnosisNavigationState: (state: NavigationState) => void;

  // ============================================================================
  // ACTIONS - Accessibility
  // ============================================================================
  updateAccessibilityPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  announce: (message: string, priority?: "polite" | "assertive", delay?: number) => void;

  // ============================================================================
  // ACTIONS - Onboarding
  // ============================================================================
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // ============================================================================
  // ACTIONS - Developer
  // ============================================================================
  toggleDeveloperMode: () => void;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  initializeAuth: () => () => void;
  initializeDoctorLevel: () => void;
  initializeLanguage: () => void;
  initializeAccessibility: () => void;
  initializeOnboarding: () => void;
  initializeDeveloper: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_LEVEL_MAPPING: Record<string, DoctorLevel> = {
  Master: "master",
  Expert: "expert",
  Doctor: "physician",
};

const STORAGE_KEYS = {
  language: "sihat-tcm-language",
  onboarding: "sihat-tcm-onboarding-completed",
  developer: "isDeveloperMode",
  accessibility: "sihat-tcm-accessibility-preferences",
};

const STEP_WEIGHTS = {
  basic_info: 14,
  wen_inquiry: 14,
  wang_tongue: 14,
  wang_face: 14,
  wen_audio: 14,
  qie: 14,
  smart_connect: 16,
};

const STEP_BASE_PROGRESS: { [key: string]: number } = {
  basic_info: 0,
  wen_inquiry: 14,
  wang_tongue: 28,
  wang_face: 42,
  wen_audio: 56,
  qie: 70,
  smart_connect: 84,
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    user: null,
    session: null,
    profile: null,
    authLoading: true,

    language: "en",
    languageLoaded: false,

    doctorLevel: "physician",
    doctorLevelLoading: true,

    diagnosisProgress: 0,
    diagnosisStepIndex: 0,
    diagnosisFormProgress: {},
    diagnosisNavigationState: {},

    accessibilityManager: null,
    accessibilityPreferences: {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: "medium",
      focusIndicatorStyle: "default",
      announcements: true,
    },

    hasCompletedOnboarding: false,
    onboardingLoading: true,

    isDeveloperMode: false,

    // ============================================================================
    // AUTH ACTIONS
    // ============================================================================
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setAuthLoading: (loading) => set({ authLoading: loading }),

    signOut: async () => {
      await supabase.auth.signOut();
      set({ profile: null, user: null, session: null });
    },

    refreshProfile: async (userId?: string, initialData?: Profile) => {
      if (initialData) {
        set({ profile: initialData });
        return;
      }

      const { user } = get();
      const idToFetch = userId || user?.id;
      if (!idToFetch) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", idToFetch)
          .single();

        if (error) {
          logger.error("AppStore", "Error fetching profile", error);
        } else {
          set({ profile: data });

          // Sync language from localStorage if not in profile
          if (!data.preferred_language && typeof window !== "undefined") {
            const localLanguage = localStorage.getItem(STORAGE_KEYS.language) as Language | null;
            if (localLanguage && ["en", "zh", "ms"].includes(localLanguage)) {
              supabase
                .from("profiles")
                .update({
                  preferred_language: localLanguage,
                  preferences: { ...(data.preferences || {}), language: localLanguage },
                })
                .eq("id", idToFetch)
                .then(({ error: updateError }) => {
                  if (!updateError) {
                    set({
                      profile: {
                        ...data,
                        preferred_language: localLanguage,
                        preferences: { ...(data.preferences || {}), language: localLanguage },
                      },
                    });
                  }
                });
            }
          }
        }
      } catch (error) {
        logger.error("AppStore", "Error fetching profile", error);
      } finally {
        set({ authLoading: false });
      }
    },

    updatePreferences: async (newPrefs: Partial<UIPreferences>) => {
      const { user, profile } = get();
      if (!user) return;

      try {
        const currentPrefs = profile?.preferences || {};
        const updatedPrefs = { ...currentPrefs, ...newPrefs };

        const { error } = await supabase
          .from("profiles")
          .update({
            preferences: updatedPrefs,
            ...(newPrefs.language ? { preferred_language: newPrefs.language } : {}),
          })
          .eq("id", user.id);

        if (error) {
          logger.error("AppStore", "Error updating preferences", error);
          return;
        }

        set({
          profile: profile
            ? {
              ...profile,
              preferences: updatedPrefs,
              ...(newPrefs.language ? { preferred_language: newPrefs.language } : {}),
            }
            : null,
        });
      } catch (err) {
        logger.error("AppStore", "Unexpected error updating preferences", err);
      }
    },

    // ============================================================================
    // LANGUAGE ACTIONS
    // ============================================================================
    setLanguage: (lang) => {
      set({ language: lang });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.language, lang);
        document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en";
      }

      const { profile, updatePreferences } = get();
      if (profile) {
        updatePreferences({ language: lang });
      }
    },

    syncLanguageFromProfile: (lang) => {
      if (["en", "zh", "ms"].includes(lang)) {
        set({ language: lang });
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.language, lang);
          document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en";
        }
      }
    },

    setLanguageLoaded: (loaded) => set({ languageLoaded: loaded }),

    // ============================================================================
    // DOCTOR LEVEL ACTIONS
    // ============================================================================
    setDoctorLevel: (level) => set({ doctorLevel: level }),
    setDoctorLevelLoading: (loading) => set({ doctorLevelLoading: loading }),

    getModel: () => {
      const { doctorLevel } = get();
      return DOCTOR_LEVELS[doctorLevel].model;
    },

    getDoctorInfo: () => {
      const { doctorLevel } = get();
      return DOCTOR_LEVELS[doctorLevel];
    },

    // ============================================================================
    // DIAGNOSIS PROGRESS ACTIONS
    // ============================================================================
    setDiagnosisProgress: (value) => {
      set({ diagnosisProgress: Math.min(100, Math.max(0, value)) });
    },

    incrementDiagnosisProgress: (delta) => {
      const { diagnosisProgress } = get();
      set({ diagnosisProgress: Math.min(100, Math.max(0, diagnosisProgress + delta)) });
    },

    setDiagnosisStepIndex: (index) => set({ diagnosisStepIndex: index }),

    updateDiagnosisFormProgress: (stepId, completedFields, totalFields) => {
      if (totalFields === 0) return;

      const stepWeight = STEP_WEIGHTS[stepId as keyof typeof STEP_WEIGHTS] || 14;
      const baseProgress = STEP_BASE_PROGRESS[stepId] || 0;
      const fieldProgress = (completedFields / totalFields) * stepWeight;
      const newProgress = baseProgress + fieldProgress;

      const { diagnosisFormProgress } = get();
      set({
        diagnosisFormProgress: { ...diagnosisFormProgress, [stepId]: newProgress },
        diagnosisProgress: Math.round(newProgress),
      });
    },

    resetDiagnosisProgress: () => {
      set({
        diagnosisProgress: 0,
        diagnosisStepIndex: 0,
        diagnosisFormProgress: {},
      });
    },

    setDiagnosisNavigationState: (state) => {
      // Shallow compare to prevent infinite update loops
      // Only compare primitive values (booleans, strings) - functions are intentionally ignored
      const current = get().diagnosisNavigationState;
      const hasChanged =
        current.showNext !== state.showNext ||
        current.showBack !== state.showBack ||
        current.showSkip !== state.showSkip ||
        current.canNext !== state.canNext ||
        current.nextLabel !== state.nextLabel ||
        current.backLabel !== state.backLabel ||
        current.hideBottomNav !== state.hideBottomNav;

      if (hasChanged) {
        set({ diagnosisNavigationState: state });
      } else {
        // Update function references without triggering re-render
        // by mutating in place (safe since we're the only writer)
        Object.assign(current, state);
      }
    },

    // ============================================================================
    // ACCESSIBILITY ACTIONS
    // ============================================================================
    updateAccessibilityPreferences: (newPreferences) => {
      const { accessibilityManager, accessibilityPreferences } = get();
      if (!accessibilityManager) return;

      const updatedPreferences = { ...accessibilityPreferences, ...newPreferences };
      accessibilityManager.updatePreferences(newPreferences);
      set({ accessibilityPreferences: updatedPreferences });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEYS.accessibility, JSON.stringify(updatedPreferences));
        } catch (error) {
          console.warn("Failed to save accessibility preferences:", error);
        }
      }

      if (accessibilityPreferences.announcements) {
        const changes = Object.keys(newPreferences)
          .map((key) => {
            const value = newPreferences[key as keyof AccessibilityPreferences];
            return `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${value}`;
          })
          .join(", ");
        accessibilityManager.announce(`Accessibility settings updated: ${changes}`, "polite", 500);
      }
    },

    announce: (message, priority = "polite", delay = 0) => {
      const { accessibilityManager } = get();
      if (accessibilityManager) {
        accessibilityManager.announce(message, priority, delay);
      }
    },

    // ============================================================================
    // ONBOARDING ACTIONS
    // ============================================================================
    completeOnboarding: () => {
      set({ hasCompletedOnboarding: true });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.onboarding, "true");
      }
    },

    resetOnboarding: () => {
      set({ hasCompletedOnboarding: false });
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.onboarding);
      }
    },

    // ============================================================================
    // DEVELOPER ACTIONS
    // ============================================================================
    toggleDeveloperMode: () => {
      const { isDeveloperMode, profile, updatePreferences } = get();
      const newValue = !isDeveloperMode;

      set({ isDeveloperMode: newValue });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.developer, JSON.stringify(newValue));
      }

      if (profile) {
        updatePreferences({ isDeveloperMode: newValue });
      }
    },

    // ============================================================================
    // INITIALIZATION FUNCTIONS
    // ============================================================================
    initializeAuth: () => {
      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            logger.error("AppStore", "Error getting session", error);
            set({ authLoading: false });
            return;
          }

          const session = data?.session;
          set({ session, user: session?.user ?? null });

          if (session?.user) {
            get().refreshProfile(session.user.id);
          } else {
            set({ authLoading: false });
          }
        })
        .catch((err) => {
          logger.error("AppStore", "Unexpected error getting session", err);
          set({ authLoading: false });
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          set({ authLoading: true });
          get().refreshProfile(session.user.id);
        } else {
          set({ profile: null, authLoading: false });
        }
      });

      // Return cleanup function
      return () => subscription.unsubscribe();
    },

    initializeDoctorLevel: async () => {
      try {
        const { data, error } = await supabase
          .from("system_prompts")
          .select("config")
          .eq("role", "doctor")
          .single();

        if (data?.config?.default_level) {
          const mappedLevel = ADMIN_LEVEL_MAPPING[data.config.default_level];
          if (mappedLevel) {
            set({ doctorLevel: mappedLevel });
            logger.info(
              "AppStore",
              `Loaded default level from admin: ${data.config.default_level} → ${mappedLevel}`
            );
          }
        }
      } catch (error) {
        logger.error("AppStore", "Error fetching default level", error);
      } finally {
        set({ doctorLevelLoading: false });
      }
    },

    initializeLanguage: () => {
      const { profile } = get();

      // 1. Sync from profile preferences if available
      if (profile?.preferences?.language) {
        const lang = profile.preferences.language as Language;
        set({ language: lang, languageLoaded: true });
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.language, lang);
        }
        return;
      }

      // 2. Fallback to localStorage
      if (typeof window !== "undefined") {
        const savedLanguage = localStorage.getItem(STORAGE_KEYS.language) as Language | null;
        if (savedLanguage && ["en", "zh", "ms"].includes(savedLanguage)) {
          set({ language: savedLanguage, languageLoaded: true });
        } else {
          // 3. Last fallback: browser default language
          const browserLanguage = getDefaultLanguage();
          set({ language: browserLanguage, languageLoaded: true });
          localStorage.setItem(STORAGE_KEYS.language, browserLanguage);
        }
      } else {
        set({ languageLoaded: true });
      }
    },

    initializeAccessibility: () => {
      let savedPreferences = {};
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.accessibility);
          if (saved) {
            savedPreferences = JSON.parse(saved);
          }
        } catch (error) {
          console.warn("Failed to load accessibility preferences:", error);
        }
      }

      const mergedPreferences: AccessibilityPreferences = {
        highContrast: false,
        reducedMotion: false,
        screenReaderEnabled: false,
        keyboardNavigation: true,
        fontSize: "medium",
        focusIndicatorStyle: "default",
        announcements: true,
        ...savedPreferences,
      };

      const accessibilityManager = getAccessibilityManager(mergedPreferences);
      set({
        accessibilityManager,
        accessibilityPreferences: accessibilityManager.getPreferences(),
      });

      // Import accessibility styles
      if (typeof document !== "undefined") {
        const styleId = "accessibility-styles";
        if (!document.getElementById(styleId)) {
          const link = document.createElement("link");
          link.id = styleId;
          link.rel = "stylesheet";
          link.href = "/styles/accessibility.css";
          document.head.appendChild(link);
        }
      }
    },

    initializeOnboarding: () => {
      if (typeof window !== "undefined") {
        const completed = localStorage.getItem(STORAGE_KEYS.onboarding);
        set({ hasCompletedOnboarding: completed === "true", onboardingLoading: false });
      } else {
        set({ onboardingLoading: false });
      }
    },

    initializeDeveloper: () => {
      const { profile } = get();

      // STRICT: Only allow developer mode if user is logged in AND has role 'developer'
      if (profile?.role !== "developer") {
        set({ isDeveloperMode: false });
        return;
      }

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEYS.developer);
        if (stored) {
          try {
            set({ isDeveloperMode: JSON.parse(stored) });
          } catch (e) {
            logger.warn("AppStore", "Failed to parse isDeveloperMode from localStorage", e);
            set({ isDeveloperMode: true });
          }
        } else {
          set({ isDeveloperMode: true });
          localStorage.setItem(STORAGE_KEYS.developer, "true");
        }
      }
    },
  }))
);

// ============================================================================
// COMPUTED SELECTORS (for convenience - maintains backward compatibility)
// ============================================================================

export const useLanguage = () => {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const syncLanguageFromProfile = useAppStore((state) => state.syncLanguageFromProfile);
  const languageLoaded = useAppStore((state) => state.languageLoaded);
  const t = translations[language];

  return {
    language,
    setLanguage,
    syncLanguageFromProfile,
    t,
    languageNames,
    isLoaded: languageLoaded,
  };
};

export const useAuth = () => {
  const user = useAppStore((state) => state.user);
  const session = useAppStore((state) => state.session);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.authLoading);
  const signOut = useAppStore((state) => state.signOut);
  const refreshProfile = useAppStore((state) => state.refreshProfile);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
    updatePreferences,
  };
};

export const useDoctorLevel = () => {
  const doctorLevel = useAppStore((state) => state.doctorLevel);
  const setDoctorLevel = useAppStore((state) => state.setDoctorLevel);
  const getModel = useAppStore((state) => state.getModel);
  const getDoctorInfo = useAppStore((state) => state.getDoctorInfo);
  const isLoadingDefault = useAppStore((state) => state.doctorLevelLoading);

  return {
    doctorLevel,
    setDoctorLevel,
    getModel,
    getDoctorInfo,
    isLoadingDefault,
  };
};

export const useDiagnosisProgress = () => {
  const progress = useAppStore((state) => state.diagnosisProgress);
  const setProgress = useAppStore((state) => state.setDiagnosisProgress);
  const incrementProgress = useAppStore((state) => state.incrementDiagnosisProgress);
  const currentStepIndex = useAppStore((state) => state.diagnosisStepIndex);
  const setCurrentStepIndex = useAppStore((state) => state.setDiagnosisStepIndex);
  const updateFormProgress = useAppStore((state) => state.updateDiagnosisFormProgress);
  const resetProgress = useAppStore((state) => state.resetDiagnosisProgress);
  const navigationState = useAppStore((state) => state.diagnosisNavigationState);
  const setNavigationState = useAppStore((state) => state.setDiagnosisNavigationState);

  return {
    progress,
    setProgress,
    incrementProgress,
    currentStepIndex,
    setCurrentStepIndex,
    updateFormProgress,
    resetProgress,
    navigationState,
    setNavigationState,
  };
};

export const useDiagnosisProgressOptional = () => {
  return useDiagnosisProgress();
};

export const useAccessibilityContext = () => {
  const manager = useAppStore((state) => state.accessibilityManager);
  const preferences = useAppStore((state) => state.accessibilityPreferences);
  const updatePreferences = useAppStore((state) => state.updateAccessibilityPreferences);
  const announce = useAppStore((state) => state.announce);

  return {
    manager,
    preferences,
    updatePreferences,
    announce,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    isScreenReaderEnabled: preferences.screenReaderEnabled,
    fontSize: preferences.fontSize,
    focusIndicatorStyle: preferences.focusIndicatorStyle,
  };
};

export const useOnboarding = () => {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const isLoading = useAppStore((state) => state.onboardingLoading);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);

  return {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
};

export const useDeveloper = () => {
  const isDeveloperMode = useAppStore((state) => state.isDeveloperMode);
  const toggleDeveloperMode = useAppStore((state) => state.toggleDeveloperMode);

  return {
    isDeveloperMode,
    toggleDeveloperMode,
  };
};

// Helper hook for translation sections
export function useTranslation<K extends keyof TranslationKeys>(section: K): TranslationKeys[K] {
  const { t } = useLanguage();
  return t[section];
}

