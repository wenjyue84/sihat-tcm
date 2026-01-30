import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { useDiagnosisPersistence } from "./useDiagnosisPersistence";
import { logger } from "@/lib/clientLogger";
import type { DiagnosisWizardData, AnalysisResult, PendingResumeState } from "@/types/diagnosis";

// Import refactored modules
import { STEPS_CONFIG } from "./diagnosisConstants";
import type { DiagnosisStep, AnalysisType } from "./diagnosisTypes";
import { useDiagnosisResume } from "./useDiagnosisResume";
import { useDiagnosisProgressTracking } from "./useDiagnosisProgressTracking";
import { useDiagnosisNavigation } from "./useDiagnosisNavigation";
import { useDiagnosisImageAnalysis } from "./useDiagnosisImageAnalysis";
import { useDiagnosisSubmission } from "./useDiagnosisSubmission";

// Re-export types and utilities for backward compatibility
export type { DiagnosisStep, AnalysisType };
export { STEPS_CONFIG };
export { repairJSON, generateMockReport } from "./diagnosisUtils";

export function useDiagnosisWizard() {
  // Context Hooks
  const { t, language } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();
  const { profile } = useAuth();
  const { saveProgress } = useDiagnosisPersistence();

  // Determine if we should include summary step
  // Mode is 'advanced' ONLY if user is logged in AND has 'advanced' setting
  // Using explicit check for 'advanced' to default to 'simple' for everyone else (including guests)
  const isAdvancedMode = profile?.preferences?.diagnosisMode === "advanced";

  // Filter steps based on mode
  const activeStepsConfig = useMemo(() => {
    if (isAdvancedMode) {
      return STEPS_CONFIG;
    }
    return STEPS_CONFIG.filter((s) => s.id !== "summary"); // Hide summary for Simple Mode / Guests
  }, [isAdvancedMode]);

  // Local State
  const [step, setStep] = useState<DiagnosisStep>("basic_info");
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [data, setData] = useState<DiagnosisWizardData>({
    basic_info: null,
    wen_inquiry: null,
    wang_tongue: null,
    wang_face: null,
    wang_part: null,
    wen_audio: null,
    wen_chat: [],
    qie: null,
    smart_connect: null,
  });

  // Celebration phase state
  const [celebrationPhase, setCelebrationPhase] = useState<string | null>(null);

  // Use focused hooks
  const resumeHook = useDiagnosisResume({
    isAdvancedMode,
    activeStepsConfig,
  });

  const submissionHook = useDiagnosisSubmission({ data, setData });

  const navigationHook = useDiagnosisNavigation({
    setStep,
    submitConsultation: submissionHook.submitConsultation,
  });

  const imageAnalysisHook = useDiagnosisImageAnalysis({
    data,
    setData,
    nextStep: navigationHook.nextStep,
  });

  // Seed Data from Profile (runs when profile loads, if no saved state found/resumed)
  useEffect(() => {
    if (
      resumeHook.hasCheckedPersistence &&
      profile &&
      !data.basic_info &&
      !resumeHook.pendingResumeState
    ) {
      const seededData = resumeHook.seedDataFromProfile(data);
      setData(seededData);
    }
  }, [resumeHook.hasCheckedPersistence, resumeHook.pendingResumeState, profile, data.basic_info, resumeHook]);

  // Handler to resume saved progress (called from dialog)
  const handleResumeProgress = useCallback(() => {
    const resumeResult = resumeHook.handleResumeProgress();
    if (!resumeResult) return;

    setData(resumeResult.data);
    setStep(resumeResult.step);
    setMaxStepReached(resumeResult.maxStepIndex);
  }, [resumeHook]);

  // Handler to start new (discard saved progress)
  const handleStartNew = useCallback(() => {
    resumeHook.handleStartNew();
    // Seed from profile if available
    if (profile) {
      const seededData = resumeHook.seedDataFromProfile(data);
      setData(seededData);
    }
  }, [resumeHook, profile, data]);

  // Save Persistence on Update
  useEffect(() => {
    if (!resumeHook.hasCheckedPersistence) return;
    const hasData = data.basic_info || data.wen_inquiry || data.wang_tongue;
    if (hasData) {
      const timer = setTimeout(() => {
        saveProgress(step, data);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, step, saveProgress, resumeHook.hasCheckedPersistence]);

  // Progress Tracking
  useDiagnosisProgressTracking({
    step,
    activeStepsConfig,
    maxStepReached,
    setMaxStepReached,
  });

  // Navigation Sync Effect
  // Destructure stable callbacks to avoid infinite loop (navigationHook object changes every render)
  const { nextStep, prevStep } = navigationHook;

  useEffect(() => {
    const customNavSteps = [
      "basic_info",
      "wen_inquiry",
      "qie",
      "wang_tongue",
      "wang_face",
      "wang_part",
      "wen_audio",
    ];
    if (customNavSteps.includes(step)) return;

    const showBack = step !== "report";
    const showNext = step !== "processing" && step !== "report";

    setNavigationState({
      onNext: () => nextStep(step),
      onBack: () => prevStep(step),
      onSkip: undefined,
      showNext,
      showBack,
      showSkip: false,
    });
  }, [step, setNavigationState, nextStep, prevStep]);

  // Return Interface
  return {
    // State
    step,
    setStep,
    data,
    setData,
    isAnalyzing: imageAnalysisHook.isAnalyzing,
    analysisResult: imageAnalysisHook.analysisResult,
    setAnalysisResult: imageAnalysisHook.setAnalysisResult,
    completion: submissionHook.completion,
    setCompletion: submissionHook.setCompletion,
    isLoading: submissionHook.isLoading,
    error: submissionHook.error,
    isSaved: submissionHook.isSaved,
    setIsSaved: submissionHook.setIsSaved,
    maxStepReached,
    celebrationPhase,
    setCelebrationPhase,

    // Resume Progress State & Actions
    pendingResumeState: resumeHook.pendingResumeState,
    handleResumeProgress,
    handleStartNew,

    // Actions
    nextStep,
    prevStep,
    analyzeImage: imageAnalysisHook.analyzeImage,
    handleSkipAnalysis: imageAnalysisHook.handleSkipAnalysis,
    submitConsultation: submissionHook.submitConsultation,

    // Helpers
    STEPS: activeStepsConfig.map((s) => ({
      id: s.id,
      label: (t.steps as Record<string, string>)[s.labelKey],
    })),
    language,
    t,
  };
}
