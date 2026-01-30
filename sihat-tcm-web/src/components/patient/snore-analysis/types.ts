export interface SnoreAnalysisResult {
  snoring_detected: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  frequency: number;
  average_duration_ms: number;
  characteristics: string[];
  apnea_risk_indicators: string[];
  tcm_analysis: {
    pattern: string;
    explanation: string;
    meridians_affected: string[];
    fatigue_correlation: string;
  };
  tcm_recommendations: Array<{
    type: "acupressure" | "dietary" | "lifestyle" | "herbal";
    suggestion: string;
    benefit: string;
  }>;
  confidence: number;
  raw_observations: string;
}

export interface SnoreAnalysisTabProps {
  sessions?: any[];
}

export interface TCMContext {
  constitution: string | undefined;
  symptoms: string[];
  primary_diagnosis: string | undefined;
  has_fatigue: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isPlaying: boolean;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  analysisResult: SnoreAnalysisResult | null;
  error: string | null;
}
