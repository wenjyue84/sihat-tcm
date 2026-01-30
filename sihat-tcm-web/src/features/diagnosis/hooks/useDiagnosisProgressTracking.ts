/**
 * Hook for tracking diagnosis wizard progress
 * 
 * Manages progress percentage and max step reached for UI indicators
 */

import { useEffect } from "react";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { STEP_PROGRESS } from "./diagnosisConstants";
import type { DiagnosisStep } from "./diagnosisTypes";

interface UseDiagnosisProgressTrackingOptions {
  step: DiagnosisStep;
  activeStepsConfig: Array<{ id: string; labelKey: string }>;
  maxStepReached: number;
  setMaxStepReached: (index: number) => void;
}

/**
 * Hook for tracking diagnosis wizard progress
 */
export function useDiagnosisProgressTracking({
  step,
  activeStepsConfig,
  maxStepReached,
  setMaxStepReached,
}: UseDiagnosisProgressTrackingOptions) {
  const { setProgress: setGlobalProgress } = useDiagnosisProgress();

  // Progress Tracking
  useEffect(() => {
    if (step === "basic_info") return; // Handled by form

    setGlobalProgress(STEP_PROGRESS[step] ?? 0);

    // Update Max Step Reached for Stepper UI
    let currentStepperId = step;
    if (step === "wang_part") currentStepperId = "wang_face";
    else if (step === "processing" || step === "report") currentStepperId = "smart_connect";

    const currentIndex = activeStepsConfig.findIndex((s) => s.id === currentStepperId);
    if (currentIndex > maxStepReached) {
      setMaxStepReached(currentIndex);
    }
  }, [step, setGlobalProgress, activeStepsConfig, maxStepReached, setMaxStepReached]);
}



