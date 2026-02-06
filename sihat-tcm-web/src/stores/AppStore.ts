/**
 * App Store - Main Orchestrator
 *
 * Coordinates all domain-specific stores and provides a unified interface
 * for the Sihat TCM application state management.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/lib/clientLogger";

// Import domain stores
import { useAuthStore } from "./auth/AuthStore";
import { useLanguageStore } from "./language/LanguageStore";
import { useDoctorLevelStore } from "./doctor/DoctorLevelStore";
import { useDiagnosisProgressStore } from "./diagnosis/DiagnosisProgressStore";
import { useAccessibilityStore } from "./accessibility/AccessibilityStore";
import { useOnboardingStore } from "./onboarding/OnboardingStore";
import { useDeveloperStore } from "./developer/DeveloperStore";

// Import types
import type { Profile, Role } from "./interfaces/StoreInterfaces";

// ============================================================================
// APP STORE ORCHESTRATOR
// ============================================================================

interface AppStoreState {
  isInitialized: boolean;
  initializationError: string | null;
}

interface AppStoreActions {
  initialize: () => Promise<void>;
  cleanup: () => void;
}

interface AppStore extends AppStoreState, AppStoreActions {}

export const useAppStoreOrchestrator = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    isInitialized: false,
    initializationError: null,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    initialize: async () => {
      try {
        logger.info("AppStore", "Starting application initialization");

        // Initialize stores in dependency order

        // 1. Initialize basic stores first
        useLanguageStore.getState().initializeLanguage();
        useOnboardingStore.getState().initializeOnboarding();
        useAccessibilityStore.getState().initializeAccessibility();

        // 2. Initialize auth (this may take time due to network calls)
        const authCleanup = useAuthStore.getState().initializeAuth();

        // 3. Initialize doctor level (depends on network)
        await useDoctorLevelStore.getState().initializeDoctorLevel();

        // 4. Initialize developer mode (should be done after auth to check role)
        useDeveloperStore.getState().initializeDeveloper();

        // Set up cross-store subscriptions for data synchronization
        setupCrossStoreSubscriptions();

        set({ isInitialized: true, initializationError: null });
        logger.info("AppStore", "Application initialization completed successfully");

        // Store cleanup function (accessed via separate cleanup method)
        void authCleanup;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown initialization error";
        set({ isInitialized: false, initializationError: errorMessage });
        logger.error("AppStore", "Application initialization failed", error);
        throw error;
      }
    },

    cleanup: () => {
      logger.info("AppStore", "Cleaning up application stores");

      // Individual stores handle their own cleanup
      // This is mainly for any cross-store subscriptions
      set({ isInitialized: false, initializationError: null });
    },
  }))
);

// ============================================================================
// CROSS-STORE SYNCHRONIZATION
// ============================================================================

function setupCrossStoreSubscriptions() {
  // Sync language changes with auth profile
  useLanguageStore.subscribe(
    (state) => state.language,
    (language) => {
      const authState = useAuthStore.getState();
      if (authState.profile && authState.profile.preferred_language !== language) {
        authState.updatePreferences({ language });
      }
    }
  );

  // Sync profile language changes with language store
  useAuthStore.subscribe(
    (state) => state.profile?.preferred_language,
    (preferredLanguage) => {
      if (preferredLanguage && ["en", "zh", "ms"].includes(preferredLanguage)) {
        const languageState = useLanguageStore.getState();
        if (languageState.language !== preferredLanguage) {
          languageState.syncLanguageFromProfile(preferredLanguage as any);
        }
      }
    }
  );

  // Sync developer mode with auth profile
  useAuthStore.subscribe(
    (state) => state.profile?.role,
    (role) => {
      const developerState = useDeveloperStore.getState();

      // Only allow developer mode if user has developer role
      if (role !== "developer" && developerState.isDeveloperMode) {
        // Force disable developer mode if user doesn't have developer role
        useDeveloperStore.setState({ isDeveloperMode: false });

        if (typeof window !== "undefined") {
          localStorage.setItem("isDeveloperMode", "false");
        }

        logger.info("AppStore", "Developer mode disabled - user role changed", { role });
      }
    }
  );

  logger.debug("AppStore", "Cross-store subscriptions established");
}

// ============================================================================
// UNIFIED HOOKS (for backward compatibility)
// ============================================================================

/**
 * Main app initialization hook
 */
export const useAppInitialization = () => {
  const isInitialized = useAppStoreOrchestrator((state) => state.isInitialized);
  const initializationError = useAppStoreOrchestrator((state) => state.initializationError);
  const initialize = useAppStoreOrchestrator((state) => state.initialize);
  const cleanup = useAppStoreOrchestrator((state) => state.cleanup);

  return {
    isInitialized,
    initializationError,
    initialize,
    cleanup,
    hasError: !!initializationError,
  };
};

/**
 * Combined app state hook (for components that need multiple stores)
 */
export const useAppState = () => {
  // Auth state
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const authLoading = useAuthStore((state) => state.authLoading);

  // Language state
  const language = useLanguageStore((state) => state.language);
  const languageLoaded = useLanguageStore((state) => state.languageLoaded);

  // Doctor level state
  const doctorLevel = useDoctorLevelStore((state) => state.doctorLevel);
  const doctorLevelLoading = useDoctorLevelStore((state) => state.doctorLevelLoading);

  // Developer state
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);

  // Onboarding state
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const onboardingLoading = useOnboardingStore((state) => state.onboardingLoading);

  // App initialization state
  const isInitialized = useAppStoreOrchestrator((state) => state.isInitialized);

  return {
    // Auth
    user,
    profile,
    authLoading,
    isAuthenticated: !!user,

    // Language
    language,
    languageLoaded,

    // Doctor Level
    doctorLevel,
    doctorLevelLoading,

    // Developer
    isDeveloperMode,

    // Onboarding
    hasCompletedOnboarding,
    onboardingLoading,
    needsOnboarding: !hasCompletedOnboarding && !onboardingLoading,

    // App
    isInitialized,
    isLoading:
      authLoading || !languageLoaded || doctorLevelLoading || onboardingLoading || !isInitialized,
  };
};

/**
 * User role utilities
 */
export const useUserRole = (): Role | null => {
  return useAuthStore((state) => state.profile?.role || null);
};

export const useIsAdmin = (): boolean => {
  return useAuthStore((state) => state.profile?.role === "admin");
};

export const useIsDoctor = (): boolean => {
  return useAuthStore((state) => state.profile?.role === "doctor");
};

export const useIsPatient = (): boolean => {
  return useAuthStore((state) => state.profile?.role === "patient");
};

export const useIsDeveloper = (): boolean => {
  return useAuthStore((state) => state.profile?.role === "developer");
};

// ============================================================================
// RE-EXPORT DOMAIN STORES AND HOOKS
// ============================================================================

// Re-export stores for direct access
export {
  useAuthStore,
  useLanguageStore,
  useDoctorLevelStore,
  useDiagnosisProgressStore,
  useAccessibilityStore,
  useOnboardingStore,
  useDeveloperStore,
};

// Re-export convenience hooks
export { useAuth } from "./auth/AuthStore";
export { useLanguage, useTranslation, useT, useLanguageSwitcher } from "./language/LanguageStore";
export { useDoctorLevel, useCurrentModel, useDoctorCapabilities } from "./doctor/DoctorLevelStore";
export {
  useDiagnosisProgress,
  useDiagnosisProgressOptional,
  useStepProgress,
  useDiagnosisNavigation,
} from "./diagnosis/DiagnosisProgressStore";
export {
  useAccessibilityContext,
  useHighContrast,
  useReducedMotion,
  useFontSize,
  useScreenReader,
} from "./accessibility/AccessibilityStore";
export { useOnboarding, useOnboardingFlow } from "./onboarding/OnboardingStore";
export { useDeveloper, useDeveloperFeatures, useDevOnly } from "./developer/DeveloperStore";

// Re-export types
export type { Profile, Role, UIPreferences } from "./interfaces/StoreInterfaces";
