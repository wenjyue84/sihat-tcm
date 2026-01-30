/**
 * @fileoverview App Store System Usage Examples
 * 
 * Demonstrates how to use the refactored modular app store system
 * for state management across the Sihat TCM application.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { AppStore } from "@/stores/AppStore";
import { AuthStore } from "@/stores/auth/AuthStore";
import { LanguageStore } from "@/stores/language/LanguageStore";
import { DiagnosisProgressStore } from "@/stores/diagnosis/DiagnosisProgressStore";
import { AccessibilityStore } from "@/stores/accessibility/AccessibilityStore";

/**
 * Example 1: Using the main orchestrator store
 */
export function useMainStoreExample() {
  const appStore = AppStore.getInstance();
  const store = appStore.getStore();

  // Access state from any domain
  const user = store((state) => state.user);
  const language = store((state) => state.language);
  const progress = store((state) => state.diagnosisProgress);

  // Use actions from any domain
  const setLanguage = store((state) => state.setLanguage);
  const setProgress = store((state) => state.setDiagnosisProgress);

  return {
    user,
    language,
    progress,
    setLanguage,
    setProgress,
  };
}

/**
 * Example 2: Using individual domain stores directly
 */
export function useDomainStoresExample() {
  // Use specific domain stores for focused functionality
  const authStore = AuthStore.getInstance();
  const languageStore = LanguageStore.getInstance();
  const progressStore = DiagnosisProgressStore.getInstance();

  // Each store provides its own state and actions
  const authState = authStore.getState();
  const languageState = languageStore.getState();
  const progressState = progressStore.getState();

  return {
    // Auth operations
    signIn: authStore.signIn.bind(authStore),
    signOut: authStore.signOut.bind(authStore),
    isAuthenticated: authState.user !== null,

    // Language operations
    setLanguage: languageStore.setLanguage.bind(languageStore),
    currentLanguage: languageState.language,

    // Progress operations
    updateProgress: progressStore.setProgress.bind(progressStore),
    currentProgress: progressState.progress,
  };
}

/**
 * Example 3: Cross-store synchronization
 */
export function crossStoreSyncExample() {
  const appStore = AppStore.getInstance();

  // The main store automatically synchronizes between domain stores
  // When you update language in one place, it updates everywhere
  
  const updateLanguageEverywhere = (newLanguage: "en" | "zh" | "ms") => {
    // This will update both the main store and the language store
    appStore.getStore().getState().setLanguage(newLanguage);
    
    // The change will be reflected in all connected components
    console.log("Language updated across all stores");
  };

  return { updateLanguageEverywhere };
}

/**
 * Example 4: Initialization and cleanup
 */
export function initializationExample() {
  const appStore = AppStore.getInstance();

  // Initialize all stores
  const cleanup = appStore.initialize();

  // The cleanup function can be called when the app unmounts
  // or when you need to reset all stores
  return cleanup;
}

/**
 * Example 5: Accessibility integration
 */
export function accessibilityExample() {
  const accessibilityStore = AccessibilityStore.getInstance();
  const store = accessibilityStore.getStore();

  const toggleHighContrast = () => {
    const currentPrefs = store.getState().preferences;
    accessibilityStore.updatePreferences({
      highContrast: !currentPrefs.highContrast
    });
  };

  const announceMessage = (message: string) => {
    accessibilityStore.announce(message, "polite");
  };

  return {
    toggleHighContrast,
    announceMessage,
    preferences: store((state) => state.preferences),
  };
}

/**
 * Example 6: Diagnosis progress tracking
 */
export function diagnosisProgressExample() {
  const progressStore = DiagnosisProgressStore.getInstance();
  const store = progressStore.getStore();

  const updateStepProgress = (stepId: string, completed: number, total: number) => {
    progressStore.updateFormProgress(stepId, completed, total);
  };

  const navigateToNextStep = () => {
    const currentIndex = store.getState().stepIndex;
    progressStore.setStepIndex(currentIndex + 1);
  };

  const resetDiagnosis = () => {
    progressStore.resetProgress();
  };

  return {
    updateStepProgress,
    navigateToNextStep,
    resetDiagnosis,
    progress: store((state) => state.progress),
    stepIndex: store((state) => state.stepIndex),
  };
}

/**
 * Example 7: Legacy compatibility
 */
export function legacyCompatibilityExample() {
  // The old useAppStore hook still works exactly the same
  // This ensures backward compatibility with existing components
  
  // Import the legacy hook (this is the same as before refactoring)
  // import { useAppStore, useAuth, useLanguage } from "@/stores/useAppStore";
  
  // All existing code continues to work without changes:
  // const { user, signOut } = useAuth();
  // const { language, setLanguage } = useLanguage();
  // const progress = useAppStore((state) => state.diagnosisProgress);
  
  console.log("All legacy hooks continue to work without any changes");
}

/**
 * Example 8: Performance optimization
 */
export function performanceOptimizationExample() {
  const appStore = AppStore.getInstance();
  const store = appStore.getStore();

  // Subscribe to specific state slices to avoid unnecessary re-renders
  const useOptimizedAuth = () => {
    return store((state) => ({
      user: state.user,
      loading: state.authLoading,
    }));
  };

  const useOptimizedLanguage = () => {
    return store((state) => state.language);
  };

  // Use shallow comparison for objects
  const useOptimizedPreferences = () => {
    return store(
      (state) => state.accessibilityPreferences,
      (a, b) => JSON.stringify(a) === JSON.stringify(b) // Custom equality
    );
  };

  return {
    useOptimizedAuth,
    useOptimizedLanguage,
    useOptimizedPreferences,
  };
}

/**
 * Example 9: Testing the store system
 */
export function testingExample() {
  // For testing, you can create isolated store instances
  const createTestStore = () => {
    // Each domain store can be tested independently
    const authStore = new (AuthStore as any)();
    const languageStore = new (LanguageStore as any)();
    
    return {
      authStore,
      languageStore,
      // Test specific functionality
      testAuth: () => {
        authStore.setUser({ id: "test-user" });
        return authStore.getState().user?.id === "test-user";
      },
      testLanguage: () => {
        languageStore.setLanguage("zh");
        return languageStore.getState().language === "zh";
      },
    };
  };

  return { createTestStore };
}

/**
 * Example 10: Advanced patterns
 */
export function advancedPatternsExample() {
  const appStore = AppStore.getInstance();

  // Custom middleware for logging state changes
  const withLogging = (storeName: string) => {
    return (set: any, get: any) => ({
      ...get(),
      setState: (newState: any) => {
        console.log(`[${storeName}] State updated:`, newState);
        set(newState);
      },
    });
  };

  // Computed values that depend on multiple stores
  const useComputedValues = () => {
    const store = appStore.getStore();
    
    return store((state) => ({
      // Computed: Is user ready for diagnosis?
      isReadyForDiagnosis: !!(
        state.user && 
        state.profile && 
        state.languageLoaded && 
        !state.authLoading
      ),
      
      // Computed: Progress percentage with accessibility
      accessibleProgress: {
        value: state.diagnosisProgress,
        label: `${state.diagnosisProgress}% complete`,
        announcement: state.accessibilityPreferences.announcements,
      },
    }));
  };

  return {
    withLogging,
    useComputedValues,
  };
}