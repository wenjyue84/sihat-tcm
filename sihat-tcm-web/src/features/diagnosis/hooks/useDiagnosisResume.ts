/**
 * Hook for handling diagnosis wizard resume/start new logic
 * 
 * Manages loading saved progress and providing handlers for resuming or starting fresh
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useDiagnosisPersistence } from "@/hooks/useDiagnosisPersistence";
import type { DiagnosisWizardData } from "@/types/diagnosis";
import type { PendingResumeState } from "@/types/diagnosis";
import type { DiagnosisStep } from "./diagnosisTypes";

interface UseDiagnosisResumeOptions {
  isAdvancedMode: boolean;
  activeStepsConfig: Array<{ id: string; labelKey: string }>;
}

interface UseDiagnosisResumeReturn {
  hasCheckedPersistence: boolean;
  pendingResumeState: PendingResumeState | null;
  handleResumeProgress: () => {
    step: DiagnosisStep;
    data: DiagnosisWizardData;
    maxStepIndex: number;
  } | null;
  handleStartNew: () => void;
  seedDataFromProfile: (data: DiagnosisWizardData) => DiagnosisWizardData;
}

/**
 * Hook for managing diagnosis wizard resume functionality
 */
export function useDiagnosisResume({
  isAdvancedMode,
  activeStepsConfig,
}: UseDiagnosisResumeOptions): UseDiagnosisResumeReturn {
  const { profile } = useAuth();
  const { loadProgress, clearProgress } = useDiagnosisPersistence();

  const [hasCheckedPersistence, setHasCheckedPersistence] = useState(false);
  const [pendingResumeState, setPendingResumeState] = useState<PendingResumeState | null>(null);

  // Load persistence on mount
  useEffect(() => {
    if (hasCheckedPersistence) return;

    const savedState = loadProgress();
    if (savedState && savedState.step !== "basic_info") {
      // Don't auto-apply - store for dialog
      setPendingResumeState({
        step: savedState.step,
        data: savedState.data,
        timestamp: savedState.timestamp,
      });
    }
    setHasCheckedPersistence(true);
  }, [loadProgress, hasCheckedPersistence]);

  // Handler to resume saved progress (called from dialog)
  const handleResumeProgress = useCallback((): {
    step: DiagnosisStep;
    data: DiagnosisWizardData;
    maxStepIndex: number;
  } | null => {
    if (!pendingResumeState) return null;

    let targetStep = pendingResumeState.step;
    // Check if we have a generated report saved
    const hasReport = !!pendingResumeState.data.diagnosis_report;
    const isReportStep = targetStep === "report" || targetStep === "processing";

    // If we have a report, allow resuming directly to processing/report step
    // Otherwise, apply standard redirects
    if (hasReport && isReportStep) {
      // Keep targetStep as is (or ensure it's processing to render report)
      if (targetStep === "report") targetStep = "processing";
    } else {
      // Redirect if testing to access Summary in Simple Mode (e.g. Guest resumed session)
      if (
        !isAdvancedMode &&
        (targetStep === "summary" || isReportStep)
      ) {
        targetStep = "smart_connect";
      } else if (isReportStep) {
        targetStep = "summary"; // Advanced mode resumes at summary if near end but no report
      }
    }

    const result = {
      step: targetStep as DiagnosisStep,
      data: pendingResumeState.data,
      maxStepIndex: calculateMaxStepIndex(targetStep, activeStepsConfig),
    };

    setPendingResumeState(null);
    return result;
  }, [pendingResumeState, activeStepsConfig, isAdvancedMode]);

  // Handler to start new (discard saved progress)
  const handleStartNew = useCallback(() => {
    clearProgress();
    setPendingResumeState(null);
  }, [clearProgress]);

  // Seed data from profile
  const seedDataFromProfile = useCallback(
    (data: DiagnosisWizardData): DiagnosisWizardData => {
      if (!profile || data.basic_info) return data;

      return {
        ...data,
        basic_info: {
          name: profile.full_name || undefined,
          age: profile.age || undefined,
          gender: profile.gender ? profile.gender.toLowerCase() : undefined,
          height: profile.height || undefined,
          weight: profile.weight || undefined,
        },
      };
    },
    [profile]
  );

  return {
    hasCheckedPersistence,
    pendingResumeState,
    handleResumeProgress,
    handleStartNew,
    seedDataFromProfile,
  };
}

/**
 * Calculate the max step index for the stepper UI
 */
function calculateMaxStepIndex(step: string, activeStepsConfig: Array<{ id: string }>): number {
  let restoredStepId = step;
  if (step === "wang_part") restoredStepId = "wang_face";

  const restoredIndex = activeStepsConfig.findIndex((s) => s.id === restoredStepId);
  return restoredIndex > 0 ? restoredIndex : 0;
}

