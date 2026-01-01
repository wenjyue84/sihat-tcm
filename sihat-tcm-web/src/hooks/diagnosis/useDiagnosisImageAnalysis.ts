/**
 * Hook for diagnosis wizard image analysis
 * 
 * Handles image analysis for tongue, face, and body parts
 */

import { useState, useCallback } from "react";
import { logger } from "@/lib/clientLogger";
import type { DiagnosisWizardData } from "@/types/diagnosis";
import type { AnalysisResult } from "@/types/diagnosis";
import type { AnalysisType, DiagnosisStep } from "./diagnosisTypes";

interface UseDiagnosisImageAnalysisOptions {
  data: DiagnosisWizardData;
  setData: React.Dispatch<React.SetStateAction<DiagnosisWizardData>>;
  nextStep: (step: DiagnosisStep, skipCelebration?: boolean) => void;
}

interface UseDiagnosisImageAnalysisReturn {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  pendingAnalysis: { type: AnalysisType; image: string } | null;
  currentAnalysisType: AnalysisType;
  analyzeImage: (image: string, type: AnalysisType) => Promise<void>;
  handleSkipAnalysis: (currentStep: AnalysisType) => void;
}

/**
 * Hook for managing image analysis in diagnosis wizard
 */
export function useDiagnosisImageAnalysis({
  data,
  setData,
  nextStep,
}: UseDiagnosisImageAnalysisOptions): UseDiagnosisImageAnalysisReturn {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<{
    type: AnalysisType;
    image: string;
  } | null>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<AnalysisType>("tongue");

  const analyzeImage = useCallback(
    async (image: string, type: AnalysisType) => {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setCurrentAnalysisType(type);
      setPendingAnalysis({ type, image });
      try {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            type,
            symptoms: data.basic_info?.symptoms || data.basic_info?.otherSymptoms,
            mainComplaint: data.basic_info?.mainComplaint,
          }),
        });
        const result = await response.json();

        const dataKey =
          type === "tongue" ? "wang_tongue" : type === "face" ? "wang_face" : "wang_part";
        setData((prev) => ({
          ...prev,
          [dataKey]: {
            ...prev[dataKey],
            observation: result.observation,
            potential_issues: result.potential_issues || [],
          },
        }));

        if (!result.observation) {
          setAnalysisResult({
            observation: "Analysis pending.",
            potential_issues: [],
          });
        } else {
          setAnalysisResult(result);
        }
      } catch (error) {
        logger.error("useDiagnosisImageAnalysis", "Image analysis failed", error);
        setAnalysisResult({
          observation: "Analysis failed, will be reviewed in final report.",
          potential_issues: [],
        });
      } finally {
        setIsAnalyzing(false);
        setPendingAnalysis(null);
      }
    },
    [data.basic_info, setData]
  );

  const handleSkipAnalysis = useCallback(
    (currentStep: AnalysisType) => {
      setIsAnalyzing(false);
      setAnalysisResult(null);
      setPendingAnalysis(null);
      const dataKey =
        currentStep === "tongue" ? "wang_tongue" : currentStep === "face" ? "wang_face" : "wang_part";
      setData((prev) => ({
        ...prev,
        [dataKey]: {
          ...prev[dataKey],
          observation: "Analysis skipped",
          skipped: true,
        },
      }));
      // Map analysis type back to DiagnosisStep for navigation
      const stepMap: Record<AnalysisType, DiagnosisStep> = {
        tongue: "wang_tongue",
        face: "wang_face",
        part: "wang_part",
      };
      nextStep(stepMap[currentStep]);
    },
    [setData, nextStep]
  );

  return {
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    pendingAnalysis,
    currentAnalysisType,
    analyzeImage,
    handleSkipAnalysis,
  };
}


