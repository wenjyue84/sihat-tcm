/**
 * Diagnosis Progress Store
 * 
 * Manages diagnosis workflow progress, step navigation, and form completion
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/lib/clientLogger";
import {
  DiagnosisProgressStore,
  NavigationState,
  STEP_WEIGHTS,
  STEP_BASE_PROGRESS
} from "../interfaces/StoreInterfaces";

export const useDiagnosisProgressStore = create<DiagnosisProgressStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    diagnosisProgress: 0,
    diagnosisStepIndex: 0,
    diagnosisFormProgress: {},
    diagnosisNavigationState: {},

    // ============================================================================
    // ACTIONS
    // ============================================================================
    setDiagnosisProgress: (value) => {
      const clampedValue = Math.min(100, Math.max(0, value));
      set({ diagnosisProgress: clampedValue });

      logger.debug("DiagnosisProgressStore", "Progress updated", {
        oldValue: get().diagnosisProgress,
        newValue: clampedValue
      });
    },

    incrementDiagnosisProgress: (delta) => {
      const { diagnosisProgress } = get();
      const newProgress = Math.min(100, Math.max(0, diagnosisProgress + delta));

      set({ diagnosisProgress: newProgress });

      logger.debug("DiagnosisProgressStore", "Progress incremented", {
        delta,
        oldProgress: diagnosisProgress,
        newProgress
      });
    },

    setDiagnosisStepIndex: (index) => {
      const clampedIndex = Math.max(0, index);
      set({ diagnosisStepIndex: clampedIndex });

      logger.debug("DiagnosisProgressStore", "Step index updated", {
        oldIndex: get().diagnosisStepIndex,
        newIndex: clampedIndex
      });
    },

    updateDiagnosisFormProgress: (stepId, completedFields, totalFields) => {
      if (totalFields === 0) {
        logger.warn("DiagnosisProgressStore", "Cannot update progress: totalFields is 0", { stepId });
        return;
      }

      const stepWeight = STEP_WEIGHTS[stepId as keyof typeof STEP_WEIGHTS] || 14;
      const baseProgress = STEP_BASE_PROGRESS[stepId] || 0;
      const fieldProgress = (completedFields / totalFields) * stepWeight;
      const newProgress = baseProgress + fieldProgress;

      const { diagnosisFormProgress } = get();
      const updatedFormProgress = {
        ...diagnosisFormProgress,
        [stepId]: newProgress
      };

      set({
        diagnosisFormProgress: updatedFormProgress,
        diagnosisProgress: Math.round(newProgress),
      });

      logger.debug("DiagnosisProgressStore", "Form progress updated", {
        stepId,
        completedFields,
        totalFields,
        stepWeight,
        baseProgress,
        fieldProgress,
        newProgress: Math.round(newProgress)
      });
    },

    resetDiagnosisProgress: () => {
      set({
        diagnosisProgress: 0,
        diagnosisStepIndex: 0,
        diagnosisFormProgress: {},
      });

      logger.info("DiagnosisProgressStore", "Progress reset");
    },

    setDiagnosisNavigationState: (state) => {
      const current = get().diagnosisNavigationState;

      // Compare all properties including functions to ensure BottomNavigation 
      // receives the correct handlers when switching steps.
      const hasChanged =
        current.showNext !== state.showNext ||
        current.showBack !== state.showBack ||
        current.showSkip !== state.showSkip ||
        current.canNext !== state.canNext ||
        current.nextLabel !== state.nextLabel ||
        current.backLabel !== state.backLabel ||
        current.hideBottomNav !== state.hideBottomNav ||
        current.onNext !== state.onNext ||
        current.onBack !== state.onBack ||
        current.onSkip !== state.onSkip;

      if (hasChanged) {
        set({ diagnosisNavigationState: { ...current, ...state } });

        logger.debug("DiagnosisProgressStore", "Navigation state updated", {
          changes: {
            showNext: current.showNext !== state.showNext,
            handlerUpdates: {
              onNext: current.onNext !== state.onNext,
              onBack: current.onBack !== state.onBack,
              onSkip: current.onSkip !== state.onSkip
            }
          }
        });
      }
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

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
  const formProgress = useDiagnosisProgressStore((state) => state.diagnosisFormProgress);

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
    formProgress,
    isComplete: progress >= 100,
    progressPercentage: `${Math.round(progress)}%`,
  };
};

// Alias for backward compatibility
export const useDiagnosisProgressOptional = useDiagnosisProgress;

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

/**
 * Hook for getting step-specific progress information
 */
export const useStepProgress = (stepId: string) => {
  const formProgress = useDiagnosisProgressStore((state) => state.diagnosisFormProgress);
  const updateFormProgress = useDiagnosisProgressStore((state) => state.updateDiagnosisFormProgress);

  const stepProgress = formProgress[stepId] || 0;
  const stepWeight = STEP_WEIGHTS[stepId as keyof typeof STEP_WEIGHTS] || 14;
  const baseProgress = STEP_BASE_PROGRESS[stepId] || 0;

  const updateProgress = (completedFields: number, totalFields: number) => {
    updateFormProgress(stepId, completedFields, totalFields);
  };

  return {
    stepProgress,
    stepWeight,
    baseProgress,
    updateProgress,
    isStepComplete: stepProgress >= (baseProgress + stepWeight),
    stepPercentage: Math.round(((stepProgress - baseProgress) / stepWeight) * 100),
  };
};

/**
 * Hook for navigation controls
 */
export const useDiagnosisNavigation = () => {
  const navigationState = useDiagnosisProgressStore((state) => state.diagnosisNavigationState);
  const setNavigationState = useDiagnosisProgressStore((state) => state.setDiagnosisNavigationState);
  const currentStepIndex = useDiagnosisProgressStore((state) => state.diagnosisStepIndex);
  const setCurrentStepIndex = useDiagnosisProgressStore((state) => state.setDiagnosisStepIndex);

  const goNext = () => {
    if (navigationState.onNext) {
      navigationState.onNext();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goBack = () => {
    if (navigationState.onBack) {
      navigationState.onBack();
    } else {
      setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
    }
  };

  const skip = () => {
    if (navigationState.onSkip) {
      navigationState.onSkip();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return {
    navigationState,
    setNavigationState,
    currentStepIndex,
    goNext,
    goBack,
    skip,
    canGoNext: navigationState.canNext !== false,
    canGoBack: currentStepIndex > 0,
    showNext: navigationState.showNext !== false,
    showBack: navigationState.showBack !== false,
    showSkip: navigationState.showSkip === true,
    nextLabel: navigationState.nextLabel || "Next",
    backLabel: navigationState.backLabel || "Back",
    hideBottomNav: navigationState.hideBottomNav === true,
  };
};