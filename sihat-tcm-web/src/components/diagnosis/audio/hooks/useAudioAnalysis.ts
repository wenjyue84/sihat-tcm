/**
 * Hook for managing audio analysis state
 * Extracted from AudioRecorder.tsx to improve maintainability
 */

import { useState } from "react";
import type { AudioAnalysisData } from "@/types/diagnosis";

interface UseAudioAnalysisOptions {
  initialAnalysis?: AudioAnalysisData | null;
}

interface UseAudioAnalysisResult {
  isAnalyzing: boolean;
  analysisResult: AudioAnalysisData | null;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisResult: (result: AudioAnalysisData | null) => void;
}

/**
 * Hook for managing audio analysis state
 */
export function useAudioAnalysis(
  options: UseAudioAnalysisOptions = {}
): UseAudioAnalysisResult {
  const { initialAnalysis } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisData | null>(
    initialAnalysis || null
  );

  return {
    isAnalyzing,
    analysisResult,
    setIsAnalyzing,
    setAnalysisResult,
  };
}

