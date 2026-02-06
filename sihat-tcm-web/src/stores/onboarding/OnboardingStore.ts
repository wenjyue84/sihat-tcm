/**
 * Onboarding Store
 *
 * Manages user onboarding state and progress
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/lib/clientLogger";
import { OnboardingStore, STORAGE_KEYS } from "../interfaces/StoreInterfaces";

export const useOnboardingStore = create<OnboardingStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    hasCompletedOnboarding: false,
    onboardingLoading: true,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    completeOnboarding: () => {
      set({ hasCompletedOnboarding: true });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.onboarding, "true");
        logger.info("OnboardingStore", "Onboarding completed and saved");
      }
    },

    resetOnboarding: () => {
      set({ hasCompletedOnboarding: false });

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.onboarding);
        logger.info("OnboardingStore", "Onboarding reset");
      }
    },

    initializeOnboarding: () => {
      if (typeof window !== "undefined") {
        const completed = localStorage.getItem(STORAGE_KEYS.onboarding);
        const hasCompleted = completed === "true";

        set({
          hasCompletedOnboarding: hasCompleted,
          onboardingLoading: false,
        });

        logger.info("OnboardingStore", "Onboarding initialized", {
          hasCompleted,
          fromStorage: !!completed,
        });
      } else {
        // Server-side: just mark as loaded
        set({ onboardingLoading: false });
        logger.debug("OnboardingStore", "Onboarding initialized (server-side)");
      }
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

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
    needsOnboarding: !hasCompletedOnboarding && !isLoading,
    isReady: !isLoading,
  };
};

// ============================================================================
// ONBOARDING FLOW HOOKS
// ============================================================================

/**
 * Hook for managing onboarding steps
 */
export const useOnboardingFlow = () => {
  const { hasCompletedOnboarding, completeOnboarding, isLoading } = useOnboarding();

  // Define onboarding steps
  const steps = [
    {
      id: "welcome",
      title: "Welcome to Sihat TCM",
      description: "Your AI-powered Traditional Chinese Medicine companion",
      component: "WelcomeStep",
    },
    {
      id: "profile",
      title: "Create Your Profile",
      description: "Tell us about yourself for personalized recommendations",
      component: "ProfileStep",
    },
    {
      id: "preferences",
      title: "Set Your Preferences",
      description: "Customize your experience",
      component: "PreferencesStep",
    },
    {
      id: "features",
      title: "Explore Features",
      description: "Learn about TCM diagnosis and recommendations",
      component: "FeaturesStep",
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Start your TCM health journey",
      component: "CompleteStep",
    },
  ];

  const startOnboarding = () => {
    logger.info("OnboardingStore", "Onboarding flow started");
  };

  const finishOnboarding = () => {
    completeOnboarding();
    logger.info("OnboardingStore", "Onboarding flow completed");
  };

  return {
    steps,
    totalSteps: steps.length,
    hasCompletedOnboarding,
    isLoading,
    startOnboarding,
    finishOnboarding,
    shouldShowOnboarding: !hasCompletedOnboarding && !isLoading,
  };
};

/**
 * Hook for onboarding step navigation
 */
export const useOnboardingNavigation = () => {
  const { steps } = useOnboardingFlow();

  // This could be enhanced with actual step state management
  // For now, it provides the structure for step navigation
  const getStepByIndex = (index: number) => {
    return steps[index] || null;
  };

  const getStepById = (id: string) => {
    return steps.find((step) => step.id === id) || null;
  };

  const getStepIndex = (id: string) => {
    return steps.findIndex((step) => step.id === id);
  };

  const isFirstStep = (index: number) => index === 0;
  const isLastStep = (index: number) => index === steps.length - 1;

  return {
    getStepByIndex,
    getStepById,
    getStepIndex,
    isFirstStep,
    isLastStep,
    stepCount: steps.length,
  };
};
