/**
 * Hook for diagnosis wizard navigation logic
 * 
 * Handles next/previous step navigation with mode-aware routing
 */

import { useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import type { DiagnosisStep } from "./diagnosisTypes";

interface UseDiagnosisNavigationOptions {
  setStep: (step: DiagnosisStep) => void;
  submitConsultation: () => Promise<void>;
}

interface UseDiagnosisNavigationReturn {
  nextStep: (current: DiagnosisStep, skipCelebration?: boolean) => void;
  prevStep: (current: DiagnosisStep) => void;
}

/**
 * Hook for managing diagnosis wizard navigation
 */
export function useDiagnosisNavigation({
  setStep,
  submitConsultation,
}: UseDiagnosisNavigationOptions): UseDiagnosisNavigationReturn {
  const { profile } = useAuth();

  const nextStep = useCallback(
    (current: DiagnosisStep, skipCelebration: boolean = false) => {
      // Animation trigger logic could go here if keeping celebration animations
      // For now, we skip the celebration phase logic

      const diagnosisMode = profile?.preferences?.diagnosisMode || "simple";

      // State Machine
      switch (current) {
        case "basic_info":
          setStep("wen_inquiry");
          break;
        case "wen_inquiry":
          setStep("wang_tongue");
          break;
        case "wang_tongue":
          setStep("wang_face");
          break;
        case "wang_face":
          setStep("wang_part");
          break;
        case "wang_part":
          setStep("wen_audio");
          break;
        case "wen_audio":
          if (diagnosisMode === "simple") {
            setStep("smart_connect"); // Skip Pulse in Simple Mode
          } else {
            setStep("qie");
          }
          break;
        case "qie":
          setStep("smart_connect");
          break;
        case "smart_connect":
          if (diagnosisMode === "simple") {
            setStep("processing"); // Skip Summary in Simple Mode
            submitConsultation();
          } else {
            setStep("summary");
          }
          break;
        case "summary":
          setStep("processing");
          submitConsultation();
          break;
        default:
          break;
      }
    },
    [setStep, submitConsultation, profile]
  );

  const prevStep = useCallback(
    (current: DiagnosisStep) => {
      const diagnosisMode = profile?.preferences?.diagnosisMode || "simple";

      switch (current) {
        case "wen_inquiry":
          setStep("basic_info");
          break;
        case "wang_tongue":
          setStep("wen_inquiry");
          break;
        case "wang_face":
          setStep("wang_tongue");
          break;
        case "wang_part":
          setStep("wang_face");
          break;
        case "wen_audio":
          setStep("wang_part");
          break; // Back to parts from audio
        case "qie":
          setStep("wen_audio");
          break;
        case "smart_connect":
          if (diagnosisMode === "simple") {
            setStep("wen_audio"); // Back to Audio, skipping Qie
          } else {
            setStep("qie");
          }
          break;
        case "summary":
          setStep("smart_connect");
          break;
        default:
          break;
      }
    },
    [setStep, profile]
  );

  return { nextStep, prevStep };
}

