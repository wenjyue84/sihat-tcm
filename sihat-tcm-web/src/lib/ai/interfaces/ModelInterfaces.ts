/**
 * Core interfaces for AI model routing system
 */

import { DoctorLevel } from "../../doctorLevels";

export type RequestComplexityType = "simple" | "moderate" | "complex" | "advanced";

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

export interface RequestComplexity {
  type: RequestComplexityType;
  factors: ComplexityFactors;
  score: number;
  reasoning: string[];
  recommendedModel: string;
  fallbackModels: string[];
}

export interface ModelSelectionCriteria {
  complexity: RequestComplexity;
  doctorLevel?: DoctorLevel;
  requiresVision?: boolean;
  requiresStreaming?: boolean;
  maxLatency?: number;
  maxCost?: number;
  preferredModels?: string[];
  excludedModels?: string[];
  language?: string;
  medicalSpecialty?: string;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  requestType: RequestComplexityType;
  responseTime: number;
  success: boolean;
  errorType?: string;
  confidenceScore?: number;
  timestamp: Date;
  tokenCount?: number;
  costEstimate?: number;
  retryCount?: number;
}

export interface ModelCapabilities {
  id: string;
  name: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  averageLatency: number;
  costPerToken: number;
  qualityScore: number;
  medicalAccuracy: number;
  supportedLanguages: string[];
  complexityRating: RequestComplexityType[];
}

export interface ModelRouterConfig {
  enablePerformanceMonitoring: boolean;
  enableAdaptiveSelection: boolean;
  fallbackThreshold: number;
  maxRetries: number;
}