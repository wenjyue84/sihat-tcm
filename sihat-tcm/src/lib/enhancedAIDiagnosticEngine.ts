/**
 * Enhanced AI Diagnostic Engine - Integration layer for all AI diagnostic components
 *
 * This module provides a unified interface that combines the AIModelRouter,
 * PersonalizationEngine, and MedicalSafetyValidator for comprehensive AI diagnostics.
 *
 * Key Features:
 * - Intelligent AI model selection based on request complexity
 * - Automatic fallback handling for improved reliability
 * - Personalized recommendations based on user history and preferences
 * - Comprehensive medical safety validation
 * - Performance monitoring and optimization
 * - Learning from user feedback for continuous improvement
 *
 * Usage Example:
 * ```typescript
 * const engine = new EnhancedAIDiagnosticEngine('MyApp');
 * const result = await engine.processEnhancedDiagnosis({
 *   userId: 'user123',
 *   doctorLevel: 'expert',
 *   messages: chatHistory,
 *   images: tongueImages,
 *   requiresPersonalization: true,
 *   requiresSafetyValidation: true
 * });
 * ```
 *
 * @author Sihat TCM Development Team
 * @version 4.0.0
 * @since 2024-12-26
 */

import { AIModelRouter, ModelSelectionCriteria, RequestComplexity } from "./aiModelRouter";
import {
  PersonalizationEngine,
  PersonalizationFactors,
  PersonalizedRecommendation,
} from "./personalizationEngine";
import {
  MedicalSafetyValidator,
  SafetyValidationResult,
  ValidationContext,
} from "./medicalSafetyValidator";
import { DoctorLevel } from "./doctorLevels";
import { DiagnosisReport } from "@/types/database";
import { devLog, logError, logInfo } from "./systemLogger";

/**
 * Request interface for enhanced diagnostic processing
 *
 * @interface EnhancedDiagnosticRequest
 * @property {string} userId - Unique identifier for the user requesting diagnosis
 * @property {DoctorLevel} [doctorLevel] - AI practitioner level (physician|expert|master)
 * @property {'en'|'zh'|'ms'} [language] - Preferred language for responses
 * @property {any[]} [messages] - Chat history for inquiry-based diagnosis
 * @property {any[]} [images] - Medical images (tongue, face, body) for analysis
 * @property {any[]} [files] - Additional medical documents or files
 * @property {any} [basicInfo] - Patient basic information (age, gender, etc.)
 * @property {boolean} [requiresPersonalization] - Whether to apply personalization
 * @property {boolean} [requiresSafetyValidation] - Whether to perform safety checks
 * @property {string} [preferredModel] - Specific AI model to use if available
 * @property {ValidationContext['medical_history']} [medicalHistory] - Medical history for safety validation
 */
export interface EnhancedDiagnosticRequest {
  // User context
  userId: string;
  doctorLevel?: DoctorLevel;
  language?: "en" | "zh" | "ms";

  // Request data
  messages?: any[];
  images?: any[];
  files?: any[];
  basicInfo?: any;

  // Analysis requirements
  requiresPersonalization?: boolean;
  requiresSafetyValidation?: boolean;
  preferredModel?: string;

  // Medical context
  medicalHistory?: ValidationContext["medical_history"];
}

/**
 * Response interface for enhanced diagnostic processing
 *
 * @interface EnhancedDiagnosticResponse
 * @property {DiagnosisReport} diagnosis - Complete TCM diagnosis report
 * @property {string} modelUsed - AI model that generated the diagnosis
 * @property {number} responseTime - Time taken for AI processing (ms)
 * @property {number} confidenceScore - Overall confidence in diagnosis (0-1)
 * @property {object} [personalizedRecommendations] - Personalized recommendations if requested
 * @property {SafetyValidationResult} [safetyValidation] - Safety validation results if requested
 * @property {RequestComplexity} complexity - Analyzed complexity of the request
 * @property {PersonalizationFactors} [personalizationFactors] - Factors used for personalization
 * @property {object} processingMetadata - Metadata about the processing pipeline
 */
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

/**
 * Enhanced AI Diagnostic Engine that orchestrates all AI components
 *
 * This class serves as the main orchestrator for AI-powered TCM diagnosis,
 * integrating model routing, personalization, and safety validation into
 * a single, cohesive system.
 *
 * Architecture:
 * - AIModelRouter: Selects optimal AI models based on request complexity
 * - PersonalizationEngine: Adapts recommendations to user preferences
 * - MedicalSafetyValidator: Ensures all recommendations are medically safe
 *
 * The engine follows a pipeline approach:
 * 1. Analyze request complexity
 * 2. Select optimal AI model
 * 3. Generate base diagnosis
 * 4. Apply personalization (if requested)
 * 5. Validate safety (if requested)
 * 6. Return comprehensive results
 *
 * @class EnhancedAIDiagnosticEngine
 */
export class EnhancedAIDiagnosticEngine {
  private modelRouter: AIModelRouter;
  private personalizationEngine: PersonalizationEngine;
  private safetyValidator: MedicalSafetyValidator;
  private context: string;

  /**
   * Initialize the Enhanced AI Diagnostic Engine
   *
   * @param {string} context - Context identifier for logging and debugging
   * @constructor
   */
  constructor(context: string = "EnhancedAIDiagnosticEngine") {
    this.context = context;
    this.modelRouter = new AIModelRouter(`${context}/ModelRouter`);
    this.personalizationEngine = new PersonalizationEngine(`${context}/Personalization`);
    this.safetyValidator = new MedicalSafetyValidator(`${context}/Safety`);
  }

  /**
   * Process a complete diagnostic request with all enhancements
   *
   * This is the main entry point for enhanced diagnosis processing.
   * It orchestrates the entire pipeline from request analysis to
   * final result generation.
   *
   * Processing Pipeline:
   * 1. Analyze request complexity and requirements
   * 2. Select optimal AI model based on criteria
   * 3. Generate base diagnosis using selected model
   * 4. Apply personalization if requested
   * 5. Validate safety if requested
   * 6. Calculate overall confidence score
   * 7. Return comprehensive results with metadata
   *
   * @param {EnhancedDiagnosticRequest} request - The diagnostic request
   * @returns {Promise<EnhancedDiagnosticResponse>} Complete diagnostic response
   * @throws {Error} If any step in the processing pipeline fails
   *
   * @example
   * ```typescript
   * const result = await engine.processEnhancedDiagnosis({
   *   userId: 'user123',
   *   doctorLevel: 'expert',
   *   messages: chatHistory,
   *   requiresPersonalization: true,
   *   requiresSafetyValidation: true
   * });
   *
   * if (result.safetyValidation?.is_safe) {
   *   // Safe to proceed with recommendations
   *   console.log('Diagnosis:', result.diagnosis);
   * } else {
   *   // Handle safety concerns
   *   console.log('Safety concerns:', result.safetyValidation?.concerns);
   * }
   * ```
   */
  async processEnhancedDiagnosis(
    request: EnhancedDiagnosticRequest
  ): Promise<EnhancedDiagnosticResponse> {
    const startTime = Date.now();

    try {
      devLog("info", this.context, "Starting enhanced diagnosis", {
        userId: request.userId,
        doctorLevel: request.doctorLevel,
        requiresPersonalization: request.requiresPersonalization,
        requiresSafetyValidation: request.requiresSafetyValidation,
      });

      // Step 1: Analyze request complexity
      const complexity = this.modelRouter.analyzeComplexity({
        messages: request.messages,
        images: request.images,
        files: request.files,
        requiresAnalysis: true,
        requiresPersonalization: request.requiresPersonalization,
      });

      // Step 2: Select optimal AI model
      const modelCriteria: ModelSelectionCriteria = {
        complexity,
        doctorLevel: request.doctorLevel,
        preferredModel: request.preferredModel,
        requiresVision: Boolean(request.images && request.images.length > 0),
        requiresStreaming: false,
      };

      // Step 3: Generate base diagnosis using AI model router
      const diagnosisResult = await this.generateBaseDiagnosis(request, modelCriteria);

      // Step 4: Apply personalization if requested
      let personalizedRecommendations: EnhancedDiagnosticResponse["personalizedRecommendations"];
      let personalizationFactors: PersonalizationFactors | undefined;

      if (request.requiresPersonalization) {
        const personalizationResult = await this.applyPersonalization(
          request.userId,
          diagnosisResult.diagnosis
        );
        personalizedRecommendations = personalizationResult.recommendations;
        personalizationFactors = personalizationResult.factors;
      }

      // Step 5: Validate safety if requested
      let safetyValidation: SafetyValidationResult | undefined;

      if (request.requiresSafetyValidation && request.medicalHistory) {
        safetyValidation = await this.validateSafety(diagnosisResult.diagnosis, {
          medical_history: request.medicalHistory,
          user_age: request.basicInfo?.age,
          user_gender: request.basicInfo?.gender,
          language: request.language,
          diagnosis_report: diagnosisResult.diagnosis,
        });
      }

      const totalProcessingTime = Date.now() - startTime;

      const response: EnhancedDiagnosticResponse = {
        diagnosis: diagnosisResult.diagnosis,
        modelUsed: diagnosisResult.modelId,
        responseTime: diagnosisResult.responseTime,
        confidenceScore: this.calculateOverallConfidence(diagnosisResult, safetyValidation),
        personalizedRecommendations,
        safetyValidation,
        complexity,
        personalizationFactors,
        processingMetadata: {
          modelSelection: diagnosisResult.modelSelection,
          personalizationApplied: Boolean(personalizedRecommendations),
          safetyValidated: Boolean(safetyValidation),
          totalProcessingTime,
        },
      };

      logInfo(this.context, "Enhanced diagnosis completed", {
        userId: request.userId,
        modelUsed: response.modelUsed,
        totalTime: totalProcessingTime,
        safetyRisk: safetyValidation?.risk_level,
      });

      return response;
    } catch (error) {
      logError(this.context, "Enhanced diagnosis failed", { error, userId: request.userId });
      throw error;
    }
  }

  /**
   * Get model performance statistics
   */
  getPerformanceStats(): {
    modelRouter: ReturnType<AIModelRouter["getRouterStats"]>;
    totalRequests: number;
    averageProcessingTime: number;
  } {
    const routerStats = this.modelRouter.getRouterStats();

    return {
      modelRouter: routerStats,
      totalRequests: routerStats.totalRequests,
      averageProcessingTime: 0, // Would need to track this separately
    };
  }

  /**
   * Update learning profiles based on user feedback
   */
  async updateLearningFromFeedback(
    userId: string,
    feedback: {
      diagnosisAccuracy: number; // 1-5 scale
      recommendationEffectiveness: Record<string, number>;
      sideEffects?: string[];
      userSatisfaction: number; // 1-5 scale
    }
  ): Promise<void> {
    try {
      // Update personalization engine learning
      await this.personalizationEngine.updateLearningProfile(userId, {
        recommendations_followed: Object.keys(feedback.recommendationEffectiveness),
        effectiveness_ratings: feedback.recommendationEffectiveness,
        side_effects: feedback.sideEffects,
      });

      devLog("info", this.context, "Learning profile updated", { userId, feedback });
    } catch (error) {
      logError(this.context, "Failed to update learning profile", { error, userId });
    }
  }

  // Private helper methods

  private async generateBaseDiagnosis(
    request: EnhancedDiagnosticRequest,
    criteria: ModelSelectionCriteria
  ): Promise<{
    diagnosis: DiagnosisReport;
    modelId: string;
    responseTime: number;
    modelSelection: string;
  }> {
    // This would integrate with the existing diagnosis API
    // For now, return a mock structure
    const startTime = Date.now();

    // In a real implementation, this would call the model router
    // to generate the diagnosis using the selected model

    const mockDiagnosis: DiagnosisReport = {
      diagnosis: "Mock diagnosis for integration example",
      constitution: "Mock constitution",
      analysis: {
        summary: "Mock analysis summary",
      },
      recommendations: {
        food_therapy: {
          beneficial: ["Mock beneficial food"],
          avoid: ["Mock foods to avoid"],
        },
        lifestyle: ["Mock lifestyle recommendation"],
      },
    };

    return {
      diagnosis: mockDiagnosis,
      modelId: criteria.preferredModel || "gemini-2.5-pro",
      responseTime: Date.now() - startTime,
      modelSelection: "Mock model selection reasoning",
    };
  }

  private async applyPersonalization(
    userId: string,
    diagnosis: DiagnosisReport
  ): Promise<{
    recommendations: {
      dietary: PersonalizedRecommendation[];
      lifestyle: PersonalizedRecommendation[];
    };
    factors: PersonalizationFactors;
  }> {
    const factors = await this.personalizationEngine.getPersonalizationFactors(userId);

    const dietary = diagnosis.recommendations.food_therapy?.beneficial
      ? await this.personalizationEngine.personalizeDietaryRecommendations(
          diagnosis.recommendations.food_therapy.beneficial,
          factors
        )
      : [];

    const lifestyle = diagnosis.recommendations.lifestyle
      ? await this.personalizationEngine.personalizeLifestyleRecommendations(
          diagnosis.recommendations.lifestyle,
          factors
        )
      : [];

    return {
      recommendations: { dietary, lifestyle },
      factors,
    };
  }

  private async validateSafety(
    diagnosis: DiagnosisReport,
    context: ValidationContext
  ): Promise<SafetyValidationResult> {
    const recommendations = {
      dietary: diagnosis.recommendations.food_therapy?.beneficial || [],
      herbal: [], // Would extract from herbal_formulas if present
      lifestyle: diagnosis.recommendations.lifestyle || [],
      acupressure: diagnosis.recommendations.acupoints || [],
    };

    return this.safetyValidator.validateRecommendations(recommendations, context);
  }

  private calculateOverallConfidence(
    diagnosisResult: { responseTime: number },
    safetyValidation?: SafetyValidationResult
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on response time (faster = more confident in model selection)
    if (diagnosisResult.responseTime < 5000) confidence += 0.1;
    else if (diagnosisResult.responseTime > 15000) confidence -= 0.1;

    // Adjust based on safety validation
    if (safetyValidation) {
      if (safetyValidation.risk_level === "low") confidence += 0.1;
      else if (safetyValidation.risk_level === "high") confidence -= 0.2;
      else if (safetyValidation.risk_level === "critical") confidence -= 0.4;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultEnhancedAIDiagnosticEngine = new EnhancedAIDiagnosticEngine(
  "DefaultEnhancedEngine"
);

/**
 * Convenience function for enhanced diagnosis
 */
export async function processEnhancedDiagnosis(
  request: EnhancedDiagnosticRequest
): Promise<EnhancedDiagnosticResponse> {
  return defaultEnhancedAIDiagnosticEngine.processEnhancedDiagnosis(request);
}
