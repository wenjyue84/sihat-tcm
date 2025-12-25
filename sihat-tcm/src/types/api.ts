/**
 * API Response Types
 * 
 * Type definitions for API endpoint responses
 * Used for type-safe API calls throughout the application
 */

// ============================================================================
// Image Analysis API (/api/analyze-image)
// ============================================================================

export interface ImageAnalysisTag {
  title?: string
  description?: string
  confidence?: number
}

export interface TCMIndicator {
  pattern?: string
  description?: string
  severity?: string
}

export interface PatternSuggestion {
  name?: string
  confidence?: number
  reasoning?: string
}

export interface AnalyzeImageResponse {
  observation: string
  potential_issues?: string[]
  modelUsed?: number
  status?: string
  confidence?: number
  image_description?: string
  analysis_tags?: ImageAnalysisTag[]
  tcm_indicators?: TCMIndicator[]
  pattern_suggestions?: PatternSuggestion[]
  notes?: string
}

// ============================================================================
// Audio Analysis API (/api/analyze-audio)
// ============================================================================

export interface AnalyzeAudioResponse {
  observation: string
  potential_issues?: string[]
  confidence?: number
  audio_characteristics?: string[]
  tcm_analysis?: {
    pattern?: string
    explanation?: string
    meridians_affected?: string[]
  }
}

// ============================================================================
// Snore Analysis API (/api/analyze-snore)
// ============================================================================

export interface SnoreAnalysisResponse {
  snoring_detected: boolean
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  frequency: number
  average_duration_ms: number
  characteristics: string[]
  apnea_risk_indicators: string[]
  tcm_analysis: {
    pattern: string
    explanation: string
    meridians_affected: string[]
    fatigue_correlation: string
  }
  tcm_recommendations: Array<{
    type: 'acupressure' | 'dietary' | 'lifestyle' | 'herbal'
    suggestion: string
    benefit: string
  }>
  confidence: number
  raw_observations: string
}

// ============================================================================
// Chat API (/api/chat)
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  messages?: ChatMessage[]
  error?: string
}

// ============================================================================
// Report Chat API (/api/report-chat)
// ============================================================================

export interface ReportChatResponse {
  response: string
  error?: string
}

// ============================================================================
// Consult API (/api/consult)
// ============================================================================

// The consult API returns a streaming text response
// The final parsed result should match DiagnosisReport from database.ts
// This is a reference type for the expected structure

// ============================================================================
// Error Response Types
// ============================================================================

export interface APIErrorResponse {
  error: string
  error_code?: string
  details?: string
}

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

export type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; error_code?: string }


