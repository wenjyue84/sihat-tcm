/**
 * AI Request Types
 * 
 * Type definitions for AI model requests and responses
 * Used across AI model router, complexity analyzer, and API routes
 */

import type { ChatMessage } from "./api";
import type { FileData } from "./diagnosis";

/**
 * Image data for AI analysis
 */
export interface AIImageData {
  /** Base64 encoded image data or data URL */
  data: string;
  /** Image type: tongue, face, body, or other */
  type?: "tongue" | "face" | "body" | "other";
  /** Optional metadata about the image */
  metadata?: {
    quality?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * File data for AI analysis
 */
export interface AIFileData extends FileData {
  /** MIME type of the file */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
}

/**
 * Medical history data structure
 */
export interface MedicalHistory {
  /** Previous diagnoses */
  diagnoses?: Array<{
    date?: string;
    condition?: string;
    notes?: string;
  }>;
  /** Current medications */
  medications?: Array<{
    name?: string;
    dosage?: string;
    frequency?: string;
  }>;
  /** Allergies */
  allergies?: string[];
  /** Family medical history */
  familyHistory?: string[];
  /** Additional notes */
  notes?: string;
  [key: string]: unknown;
}

/**
 * AI Request interface
 * Used for all AI model requests across the application
 */
export interface AIRequest {
  /** Chat messages for conversation-based analysis */
  messages?: ChatMessage[];
  /** Images for visual analysis (tongue, face, body) */
  images?: AIImageData[];
  /** Additional files (reports, documents) */
  files?: AIFileData[];
  /** Whether the request requires detailed analysis */
  requiresAnalysis?: boolean;
  /** Whether the request requires personalization */
  requiresPersonalization?: boolean;
  /** Patient medical history */
  medicalHistory?: MedicalHistory;
  /** Urgency level of the request */
  urgency?: "low" | "normal" | "high" | "urgent";
  /** Language preference */
  language?: string;
  /** Medical specialty context */
  medicalSpecialty?: string;
  /** Additional request metadata */
  [key: string]: unknown;
}

/**
 * AI Response interface
 */
export interface AIResponse {
  /** Generated text response */
  text: string;
  /** Parsed structured data (if applicable) */
  parsed?: Record<string, unknown>;
  /** Model used for generation */
  modelUsed?: string;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  /** Complexity level */
  complexity: "low" | "medium" | "high";
  /** Required capabilities */
  capabilities?: string[];
  /** Budget constraints */
  budget?: "low" | "medium" | "high";
  /** Latency requirements */
  latency?: "low" | "medium" | "high";
}

/**
 * Complexity factors for model selection
 */
export interface ComplexityFactors {
  hasImages: boolean;
  hasMultipleFiles: boolean;
  hasLongHistory: boolean;
  requiresAnalysis: boolean;
  requiresPersonalization: boolean;
  messageCount: number;
  imageCount: number;
  fileSize: number;
  medicalComplexity: "low" | "medium" | "high";
  urgencyLevel: "low" | "normal" | "high" | "urgent";
}


