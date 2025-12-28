/**
 * AI Model Interfaces - Strategy Pattern Implementation
 * 
 * This file defines the core interfaces for the AI model system,
 * implementing the Strategy pattern for better separation of concerns.
 */

import type { AIRequest, AIResponse } from "@/types/ai-request";

// Re-export for backward compatibility
export type { AIRequest, AIResponse };

export interface AIResponse {
  text: string;
  parsed?: Record<string, unknown>;
  modelUsed: string;
  responseTime: number;
  confidence?: number;
  metadata?: Record<string, any>;
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

export interface RequestComplexity {
  type: RequestComplexityType;
  factors: ComplexityFactors;
  score: number;
  reasoning: string[];
  recommendedModel: string;
  fallbackModels: string[];
}

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

export interface ModelSelectionCriteria {
  complexity: RequestComplexity;
  doctorLevel?: string;
  requiresVision?: boolean;
  requiresStreaming?: boolean;
  maxLatency?: number;
  maxCost?: number;
  preferredModels?: string[];
  excludedModels?: string[];
  language?: string;
  medicalSpecialty?: string;
}

/**
 * Core AI Model interface - Strategy pattern
 */
export interface AIModel {
  readonly id: string;
  readonly capabilities: ModelCapabilities;
  
  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): Promise<ReadableStream>;
  isAvailable(): Promise<boolean>;
  estimateCost(request: AIRequest): number;
}

/**
 * Model Selection Strategy interface
 */
export interface ModelSelectionStrategy {
  selectModel(
    criteria: ModelSelectionCriteria,
    availableModels: AIModel[]
  ): {
    primaryModel: AIModel;
    fallbackModels: AIModel[];
    reasoning: string[];
  };
}

/**
 * Complexity Analysis Strategy interface
 */
export interface ComplexityAnalysisStrategy {
  analyzeComplexity(request: AIRequest): RequestComplexity;
}

/**
 * Performance Monitoring interface
 */
export interface PerformanceMonitor {
  recordMetrics(modelId: string, metrics: PerformanceMetrics): void;
  getAnalytics(modelId?: string): PerformanceAnalytics;
  getModelRanking(requestType: RequestComplexityType): string[];
}

export interface PerformanceMetrics {
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

export interface PerformanceAnalytics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  modelPerformance: Record<string, {
    requests: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  recentErrors: PerformanceMetrics[];
}

/**
 * Model Router interface - Facade pattern
 */
export interface ModelRouter {
  routeRequest(request: AIRequest): Promise<AIResponse>;
  routeStreamRequest(request: AIRequest): Promise<ReadableStream>;
  getPerformanceAnalytics(): PerformanceAnalytics;
  addModel(model: AIModel): void;
  removeModel(modelId: string): void;
}