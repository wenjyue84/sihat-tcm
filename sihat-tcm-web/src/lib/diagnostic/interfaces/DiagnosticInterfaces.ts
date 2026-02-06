/**
 * Diagnostic Interfaces - Core type definitions for enhanced diagnostic system
 *
 * Defines all interfaces and types used throughout the enhanced AI diagnostic engine
 * for consistent type safety and clear contracts between components.
 */

import { DoctorLevel } from "../../doctorLevels";
import { DiagnosisReport } from "@/types/database";
import { RequestComplexity } from "../../ai/interfaces/ModelInterfaces";
import {
  PersonalizationFactors,
  PersonalizedRecommendation,
} from "../../personalization/interfaces/PersonalizationInterfaces";
import { SafetyValidationResult } from "../../medicalSafetyValidator";

export interface EnhancedDiagnosticRequest {
  // User context
  userId: string;
  doctorLevel?: DoctorLevel;
  language?: "en" | "zh" | "ms";

  // Request data
  messages?: any[];
  images?: any[];
  files?: any[];
  basicInfo?: Record<string, unknown>;

  // Analysis requirements
  requiresPersonalization?: boolean;
  requiresSafetyValidation?: boolean;
  preferredModel?: string;

  // Medical context
  medicalHistory?: any;
}

export interface EnhancedDiagnosticResponse {
  // AI Response
  diagnosis: DiagnosisReport;
  modelUsed: string;
  responseTime: number;
  confidenceScore: number;

  // Personalization
  personalizedRecommendations?: {
    dietary: PersonalizedRecommendation[];
    lifestyle: PersonalizedRecommendation[];
  };

  // Safety validation
  safetyValidation?: SafetyValidationResult;

  // Metadata
  complexity: RequestComplexity;
  personalizationFactors?: PersonalizationFactors;
  processingMetadata: {
    modelSelection: string;
    personalizationApplied: boolean;
    safetyValidated: boolean;
    totalProcessingTime: number;
  };
}

export interface DiagnosticProcessingStep {
  name: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DiagnosticConfig {
  enablePersonalization: boolean;
  enableSafetyValidation: boolean;
  enablePerformanceMonitoring: boolean;
  maxProcessingTime: number;
  fallbackModel: string;
}

export interface DiagnosticStats {
  totalRequests: number;
  successfulRequests: number;
  averageProcessingTime: number;
  modelUsageStats: Record<string, number>;
  errorRate: number;
  lastProcessedAt?: Date;
}

/**
 * Diagnostic step in a processing pipeline
 */
export interface DiagnosticStep {
  name: string;
  description?: string;
  handler: (context: DiagnosticContext) => Promise<DiagnosticContext>;
  timeout?: number;
  retries?: number;
  required?: boolean;
}

/**
 * Processing pipeline configuration
 */
export interface ProcessingPipeline {
  steps: DiagnosticStep[];
  name: string;
  description?: string;
  timeout?: number;
  onStepComplete?: (step: DiagnosticStep, context: DiagnosticContext) => void;
  onError?: (step: DiagnosticStep, error: Error) => void;
}

/**
 * Diagnostic context passed through the pipeline
 */
export interface DiagnosticContext {
  request: EnhancedDiagnosticRequest;
  response?: Partial<EnhancedDiagnosticResponse>;
  metadata: Record<string, unknown>;
  startTime: number;
  currentStep?: string;
  errors: string[];
}

/**
 * Diagnostic metrics for monitoring
 */
export interface DiagnosticMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  modelUsage: Record<string, number>;
  errorsByType: Record<string, number>;
  timestamp: Date;
}

/**
 * Performance analytics for diagnostics
 */
export interface PerformanceAnalytics {
  metrics: DiagnosticMetrics;
  trends: {
    responseTime: number[];
    errorRate: number[];
    throughput: number[];
  };
  recommendations: string[];
  period: string;
}

/**
 * Diagnostic history entry
 */
export interface DiagnosticHistory {
  id: string;
  request: EnhancedDiagnosticRequest;
  response?: EnhancedDiagnosticResponse;
  timestamp: Date;
  processingTime: number;
  success: boolean;
  error?: string;
  modelUsed?: string;
}

/**
 * Diagnostic feedback from users
 */
export interface DiagnosticFeedback {
  id: string;
  diagnosticId: string;
  userId: string;
  rating: number;
  comment?: string;
  categories: string[];
  timestamp: Date;
  isHelpful: boolean;
}

/**
 * Feedback analysis result
 */
export interface FeedbackAnalysis {
  averageRating: number;
  totalFeedback: number;
  helpfulPercentage: number;
  commonThemes: string[];
  sentimentScore: number;
  improvementSuggestions: string[];
}

/**
 * User feedback patterns
 */
export interface UserFeedbackPattern {
  userId: string;
  feedbackCount: number;
  averageRating: number;
  commonCategories: string[];
  trend: "improving" | "declining" | "stable";
  lastFeedbackAt: Date;
}

/**
 * Feedback trends over time
 */
export interface FeedbackTrends {
  period: string;
  averageRating: number[];
  feedbackVolume: number[];
  helpfulPercentage: number[];
  topCategories: Record<string, number>;
  sentimentTrend: number[];
}
