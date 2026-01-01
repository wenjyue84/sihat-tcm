/**
 * Hook for managing audio analysis state and API integration
 * Handles the analysis API call, loading state, and error handling
 */

import { useState, useCallback } from "react";

// Extended AudioAnalysisData for this component with additional fields
export interface AudioAnalysisData {
  overall_observation: string;
  voice_quality_analysis: {
    observation: string;
    severity: string;
    tcm_indicators: string[];
    clinical_significance: string;
  } | null;
  breathing_patterns: any;
  speech_patterns: any;
  cough_sounds: any;
  pattern_suggestions?: string[];
  recommendations?: string[];
  confidence: string;
  notes?: string;
  status: string;
}

interface UseAudioAnalysisOptions {
  initialAnalysis?: AudioAnalysisData | null;
}

interface UseAudioAnalysisResult {
  isAnalyzing: boolean;
  analysisResult: AudioAnalysisData | null;
  analyze: (base64Audio: string) => Promise<void>;
  reset: () => void;
  setAnalysisResult: (result: AudioAnalysisData | null) => void;
}

// Silent recording fallback result
function createSilentRecordingResult(): AudioAnalysisData {
  return {
    overall_observation: "No clear audio detected.",
    voice_quality_analysis: {
      observation: "No voice detected",
      severity: "warning",
      tcm_indicators: ["Silent recording"],
      clinical_significance: "Please check your microphone settings",
    },
    breathing_patterns: null,
    speech_patterns: null,
    cough_sounds: null,
    confidence: "low",
    notes: "The recording appears to be silent. Please check your microphone and try again.",
    status: "error",
  };
}

// Error fallback result
function createErrorFallbackResult(): AudioAnalysisData {
  return {
    overall_observation: "Audio analysis is unavailable.",
    voice_quality_analysis: {
      observation: "Recording saved but analysis failed",
      severity: "normal",
      tcm_indicators: ["Recording saved"],
      clinical_significance: "Will be analyzed with comprehensive diagnosis",
    },
    breathing_patterns: null,
    speech_patterns: null,
    cough_sounds: null,
    confidence: "low",
    notes: "Real-time analysis unavailable. Recording saved for later processing.",
    status: "pending",
  };
}

/**
 * Hook for managing audio analysis
 */
export function useAudioAnalysis(
  options: UseAudioAnalysisOptions = {}
): UseAudioAnalysisResult {
  const { initialAnalysis } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisData | null>(
    initialAnalysis || null
  );

  // Analyze audio via API
  const analyze = useCallback(async (base64Audio: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });

      const result = await response.json();
      console.log("[useAudioAnalysis] Analysis result:", result);

      if (result.status === "silence") {
        setAnalysisResult(createSilentRecordingResult());
        return;
      }

      setAnalysisResult(result as AudioAnalysisData);
    } catch (error) {
      console.error("[useAudioAnalysis] Analysis failed:", error);
      setAnalysisResult(createErrorFallbackResult());
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Reset analysis state
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisResult(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    analyze,
    reset,
    setAnalysisResult,
  };
}

