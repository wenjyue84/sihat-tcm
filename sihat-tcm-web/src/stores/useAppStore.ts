"use client";

/**
 * Legacy wrapper for backward compatibility
 * This file maintains the original API while using the new modular store system
 * 
 * All the actual state management is handled by domain-specific stores.
 * This file re-exports everything needed for backward compatibility.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  Language,
  TranslationKeys,
  translations,
  languageNames
} from "@/lib/translations";

// Import domain stores
import { useAuthStore } from "./auth/AuthStore";
import { useLanguageStore } from "./language/LanguageStore";
import { useDoctorLevelStore } from "./doctor/DoctorLevelStore";
import { useDiagnosisProgressStore } from "./diagnosis/DiagnosisProgressStore";
import { useAccessibilityStore } from "./accessibility/AccessibilityStore";
import { useOnboardingStore } from "./onboarding/OnboardingStore";
import { useDeveloperStore } from "./developer/DeveloperStore";

// Import types
import type { AccessibilityPreferences } from "@/lib/accessibilityManager";
import type { Profile, Role, UIPreferences, NavigationState } from "./interfaces/StoreInterfaces";

// Type alias for backward compatibility
export type DiagnosisNavigationState = NavigationState;

// ============================================================================
// LEGACY TYPE EXPORTS (for backward compatibility)
// ============================================================================

export type { Role, UIPreferences, Profile };
export type { AccessibilityPreferences, NavigationState };

// ============================================================================
// UNIFIED STORE INTERFACE (for backward compatibility)
// ============================================================================

/**
 * This creates a unified store that combines all domain stores into one
 * This is mainly for backward compatibility with code that expects a single store
 */
interface UnifiedAppState {
  // Auth
  user: ReturnType<typeof useAuthStore.getState>["user"];
  session: ReturnType<typeof useAuthStore.getState>["session"];
  profile: ReturnType<typeof useAuthStore.getState>["profile"];
  authLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePreferences: (preferences: Partial<UIPreferences>) => Promise<void>;

  // Language
  language: Language;
  languageLoaded: boolean;
  setLanguage: (language: Language) => void;
  syncLanguageFromProfile: (language: Language) => void;

  // Doctor Level
  doctorLevel: ReturnType<typeof useDoctorLevelStore.getState>["doctorLevel"];
  doctorLevelLoading: boolean;
  setDoctorLevel: ReturnType<typeof useDoctorLevelStore.getState>["setDoctorLevel"];
  getModel: ReturnType<typeof useDoctorLevelStore.getState>["getModel"];
  getDoctorInfo: ReturnType<typeof useDoctorLevelStore.getState>["getDoctorInfo"];

  // Diagnosis Progress
  diagnosisProgress: number;
  diagnosisStepIndex: number;
  diagnosisNavigationState: DiagnosisNavigationState;
  setDiagnosisProgress: (progress: number) => void;
  incrementDiagnosisProgress: (delta: number) => void;
  setDiagnosisStepIndex: (index: number) => void;
  updateDiagnosisFormProgress: (stepId: string, completedFields: number, totalFields: number) => void;
  resetDiagnosisProgress: () => void;
  setDiagnosisNavigationState: (state: NavigationState) => void;

  // Accessibility
  accessibilityManager: ReturnType<typeof useAccessibilityStore.getState>["accessibilityManager"];
  accessibilityPreferences: AccessibilityPreferences;
  updateAccessibilityPreferences: (preferences: Partial<AccessibilityPreferences>) => void;
  announce: (message: string, priority?: "polite" | "assertive", delay?: number) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  onboardingLoading: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Developer
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;

  // Initialization functions (for StoreInitializer)
  initializeAuth: () => (() => void) | void;
  initializeDoctorLevel: () => void;
  initializeAccessibility: () => void;
  initializeOnboarding: () => void;
  initializeLanguage: () => void;
  initializeDeveloper: () => void;
}

/**
 * Creates a selector hook that combines all domain stores
 * This maintains backward compatibility with the old single-store API
 */
function createUnifiedStoreHook() {
  // Return a hook that dynamically reads from all domain stores
  const useUnifiedStore = <T>(selector: (state: UnifiedAppState) => T): T => {
    // Get values from each domain store
    const authState = {
      user: useAuthStore((s) => s.user),
      session: useAuthStore((s) => s.session),
      profile: useAuthStore((s) => s.profile),
      authLoading: useAuthStore((s) => s.authLoading),
      signOut: useAuthStore((s) => s.signOut),
      refreshProfile: useAuthStore((s) => s.refreshProfile),
      updatePreferences: useAuthStore((s) => s.updatePreferences),
    };

    const languageState = {
      language: useLanguageStore((s) => s.language),
      languageLoaded: useLanguageStore((s) => s.languageLoaded),
      setLanguage: useLanguageStore((s) => s.setLanguage),
      syncLanguageFromProfile: useLanguageStore((s) => s.syncLanguageFromProfile),
    };

    const doctorState = {
      doctorLevel: useDoctorLevelStore((s) => s.doctorLevel),
      doctorLevelLoading: useDoctorLevelStore((s) => s.doctorLevelLoading),
      setDoctorLevel: useDoctorLevelStore((s) => s.setDoctorLevel),
      getModel: useDoctorLevelStore((s) => s.getModel),
      getDoctorInfo: useDoctorLevelStore((s) => s.getDoctorInfo),
    };

    const diagnosisState = {
      diagnosisProgress: useDiagnosisProgressStore((s) => s.diagnosisProgress),
      diagnosisStepIndex: useDiagnosisProgressStore((s) => s.diagnosisStepIndex),
      diagnosisNavigationState: useDiagnosisProgressStore((s) => s.diagnosisNavigationState),
      setDiagnosisProgress: useDiagnosisProgressStore((s) => s.setDiagnosisProgress),
      incrementDiagnosisProgress: useDiagnosisProgressStore((s) => s.incrementDiagnosisProgress),
      setDiagnosisStepIndex: useDiagnosisProgressStore((s) => s.setDiagnosisStepIndex),
      updateDiagnosisFormProgress: useDiagnosisProgressStore((s) => s.updateDiagnosisFormProgress),
      resetDiagnosisProgress: useDiagnosisProgressStore((s) => s.resetDiagnosisProgress),
      setDiagnosisNavigationState: useDiagnosisProgressStore((s) => s.setDiagnosisNavigationState),
    };

    const accessibilityState = {
      accessibilityManager: useAccessibilityStore((s) => s.accessibilityManager),
      accessibilityPreferences: useAccessibilityStore((s) => s.accessibilityPreferences),
      updateAccessibilityPreferences: useAccessibilityStore((s) => s.updateAccessibilityPreferences),
      announce: useAccessibilityStore((s) => s.announce),
    };

    const onboardingState = {
      hasCompletedOnboarding: useOnboardingStore((s) => s.hasCompletedOnboarding),
      onboardingLoading: useOnboardingStore((s) => s.onboardingLoading),
      completeOnboarding: useOnboardingStore((s) => s.completeOnboarding),
      resetOnboarding: useOnboardingStore((s) => s.resetOnboarding),
    };

    const developerState = {
      isDeveloperMode: useDeveloperStore((s) => s.isDeveloperMode),
      toggleDeveloperMode: useDeveloperStore((s) => s.toggleDeveloperMode),
    };

    // Initialization functions
    const initializationState = {
      initializeAuth: useAuthStore((s) => s.initializeAuth),
      initializeDoctorLevel: useDoctorLevelStore((s) => s.initializeDoctorLevel),
      initializeAccessibility: useAccessibilityStore((s) => s.initializeAccessibility),
      initializeOnboarding: useOnboardingStore((s) => s.initializeOnboarding),
      initializeLanguage: useLanguageStore((s) => s.initializeLanguage),
      initializeDeveloper: useDeveloperStore((s) => s.initializeDeveloper),
    };

    // Combine all states
    const unifiedState: UnifiedAppState = {
      ...authState,
      ...languageState,
      ...doctorState,
      ...diagnosisState,
      ...accessibilityState,
      ...onboardingState,
      ...developerState,
      ...initializationState,
    };

    return selector(unifiedState);
  };

  return useUnifiedStore;
}

// Create and export the unified store hook
export const useAppStore = createUnifiedStoreHook();

// ============================================================================
// LEGACY COMPUTED SELECTORS (for backward compatibility)
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
  };
};

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.authLoading);
  const signOut = useAuthStore((state) => state.signOut);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);

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
  const doctorLevel = useDoctorLevelStore((state) => state.doctorLevel);
  const setDoctorLevel = useDoctorLevelStore((state) => state.setDoctorLevel);
  const getModel = useDoctorLevelStore((state) => state.getModel);
  const getDoctorInfo = useDoctorLevelStore((state) => state.getDoctorInfo);
  const isLoadingDefault = useDoctorLevelStore((state) => state.doctorLevelLoading);

  return {
    doctorLevel,
    setDoctorLevel,
    getModel,
    getDoctorInfo,
    isLoadingDefault,
  };
};

export const useDiagnosisProgress = () => {
  const progress = useDiagnosisProgressStore((state) => state.diagnosisProgress);
  const setProgress = useDiagnosisProgressStore((state) => state.setDiagnosisProgress);
  const incrementProgress = useDiagnosisProgressStore((state) => state.incrementDiagnosisProgress);
  const currentStepIndex = useDiagnosisProgressStore((state) => state.diagnosisStepIndex);
  const setCurrentStepIndex = useDiagnosisProgressStore((state) => state.setDiagnosisStepIndex);
  const updateFormProgress = useDiagnosisProgressStore((state) => state.updateDiagnosisFormProgress);
  const resetProgress = useDiagnosisProgressStore((state) => state.resetDiagnosisProgress);
  const navigationState = useDiagnosisProgressStore((state) => state.diagnosisNavigationState);
  const setNavigationState = useDiagnosisProgressStore((state) => state.setDiagnosisNavigationState);

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
  const manager = useAccessibilityStore((state) => state.accessibilityManager);
  const preferences = useAccessibilityStore((state) => state.accessibilityPreferences);
  const updatePreferences = useAccessibilityStore((state) => state.updateAccessibilityPreferences);
  const announce = useAccessibilityStore((state) => state.announce);

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
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const isLoading = useOnboardingStore((state) => state.onboardingLoading);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);

  return {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
};

export const useDeveloper = () => {
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);
  const toggleDeveloperMode = useDeveloperStore((state) => state.toggleDeveloperMode);

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
