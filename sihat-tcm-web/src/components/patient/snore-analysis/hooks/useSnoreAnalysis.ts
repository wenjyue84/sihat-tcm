"use client";

import { useState, useCallback } from "react";
import { SnoreAnalysisResult, TCMContext } from "../types";

interface UseSnoreAnalysisReturn {
  isAnalyzing: boolean;
  analysisResult: SnoreAnalysisResult | null;
  analyzeAudio: (
    audioBlob: Blob,
    recordingDuration: number,
    tcmContext: TCMContext | null
  ) => Promise<void>;
  resetAnalysis: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function useSnoreAnalysis(errorMessages: {
  analysisFailed: string;
}): UseSnoreAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SnoreAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeAudio = useCallback(
    async (audioBlob: Blob, recordingDuration: number, tcmContext: TCMContext | null) => {
      if (!audioBlob) return;

      try {
        setIsAnalyzing(true);
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);

        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const base64Data = base64Audio.split(",")[1];

          const response = await fetch("/api/analyze-snore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: base64Data,
              duration: recordingDuration,
              tcmContext,
            }),
          });

          if (!response.ok) {
            throw new Error("Analysis failed");
          }

          const result = await response.json();
          setAnalysisResult(result);
          setIsAnalyzing(false);
        };
      } catch (err) {
        console.error("Analysis error:", err);
        setError(errorMessages.analysisFailed);
        setIsAnalyzing(false);
      }
    },
    [errorMessages.analysisFailed]
  );

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    analyzeAudio,
    resetAnalysis,
    error,
    setError,
  };
}
