/**
 * Diagnosis Wizard Types
 *
 * Type definitions for the diagnosis wizard data structures
 */

import type { DiagnosisReport } from "./database";
import type { AnalyzeImageResponse } from "./api";

// ============================================================================
// Basic Info
// ============================================================================

export interface BasicInfo {
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  symptoms?: string;
  mainComplaint?: string;
  otherSymptoms?: string;
}

// ============================================================================
// Inquiry Data
// ============================================================================

export interface InquiryData {
  summary?: string;
  chat?: ChatMessage[];
  notes?: string;
  inquiryText?: string; // The processed summary text
  reportFiles?: any[]; // Medical reports uploaded during inquiry
  medicineFiles?: any[]; // Medicines uploaded during inquiry
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

// ============================================================================
// Visual Analysis Data (Tongue, Face, Part)
// ============================================================================

export interface VisualAnalysisData {
  image?: string;
  observation?: string;
  potential_issues?: string[];
  skipped?: boolean;
  analysis_tags?: AnalyzeImageResponse["analysis_tags"];
  tcm_indicators?: AnalyzeImageResponse["tcm_indicators"];
  pattern_suggestions?: AnalyzeImageResponse["pattern_suggestions"];
}

// ============================================================================
// Audio Analysis Data
// ============================================================================

export interface AudioAnalysisData {
  audio?: string;
  observation?: string;
  potential_issues?: string[];
  skipped?: boolean;
}

// ============================================================================
// Pulse Data
// ============================================================================

export interface PulseData {
  bpm?: number;
  quality?: string;
  rhythm?: string;
  strength?: string;
  notes?: string;
}

// ============================================================================
// Smart Connect Data
// ============================================================================

export interface SmartConnectData {
  connected?: boolean;
  device_type?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Complete Wizard Data Structure
// ============================================================================

export interface DiagnosisWizardData {
  basic_info: BasicInfo | null;
  wen_inquiry: InquiryData | null;
  wang_tongue: VisualAnalysisData | null;
  wang_face: VisualAnalysisData | null;
  wang_part: VisualAnalysisData | null;
  wen_audio: AudioAnalysisData | null;
  wen_chat: ChatMessage[];
  qie: PulseData | null;
  smart_connect: SmartConnectData | null;
}

// ============================================================================
// Analysis Result
// ============================================================================

export interface AnalysisResult {
  observation: string;
  potential_issues?: string[];
  modelUsed?: number;
  status?: string;
  confidence?: number;
  image_description?: string;
  analysis_tags?: AnalyzeImageResponse["analysis_tags"];
  tcm_indicators?: AnalyzeImageResponse["tcm_indicators"];
  pattern_suggestions?: AnalyzeImageResponse["pattern_suggestions"];
  notes?: string;
}

// ============================================================================
// Pending Resume State
// ============================================================================

export interface PendingResumeState {
  step: string;
  data: DiagnosisWizardData;
  timestamp: string;
}

