/**
 * Diagnostic Interfaces - Core type definitions for enhanced diagnostic system
 * 
 * Defines all interfaces and types used throughout the enhanced AI diagnostic engine
 * for consistent type safety and clear contracts between components.
 */

import { DoctorLevel } from "../../doctorLevels";
import { DiagnosisReport } from "@/types/database";
import { RequestComplexity, PersonalizationFactors, PersonalizedRecommendation } from "../../ai/interfaces/ModelInterfaces";
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