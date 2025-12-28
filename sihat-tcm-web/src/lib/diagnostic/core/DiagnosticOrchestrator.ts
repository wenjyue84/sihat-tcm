/**
 * Diagnostic Orchestrator - Main processing pipeline coordinator
 * 
 * Orchestrates the entire diagnostic processing pipeline including
 * complexity analysis, model selection, personalization, and safety validation.
 */

import { 
  EnhancedDiagnosticRequest, 
  EnhancedDiagnosticResponse, 
  DiagnosticProcessingStep,
  DiagnosticConfig 
} from '../interfaces/DiagnosticInterfaces';
import { AIModelRouter, ModelSelectionCriteria } from "../../aiModelRouter";
import { PersonalizationEngine } from "../../personalizationEngine";
import { MedicalSafetyValidator, ValidationContext } from "../../medicalSafetyValidator";
import { devLog, logError, logInfo } from "../../systemLogger";

export class DiagnosticOrchestrator {
  private context: string;
  private modelRouter: AIModelRouter;
  private personalizationEngine: PersonalizationEngine;
  private safetyValidator: MedicalSafetyValidator;
  private config: DiagnosticConfig;
  private processingSteps: DiagnosticProcessingStep[] = [];

  constructor(context: string = "DiagnosticOrchestrator") {
    this.context = context;
    this.modelRouter = new AIModelRouter(`${context}/ModelRouter`);
    this.personalizationEngine = new PersonalizationEngine(`${context}/Personalization`);
    this.safetyValidator = new MedicalSafetyValidator(`${context}/Safety`);
    
    // Default configuration
    this.config = {
      enablePersonalization: true,
      enableSafetyValidation: true,
      enablePerformanceMonitoring: true,
      maxProcessingTime: 30000, // 30 seconds
      fallbackModel: "gemini-2.5-pro"
    };
  }

  /**
   * Process enhanced diagnostic request through complete pipeline
   */
  async processEnhancedDiagnosis(
    request: EnhancedDiagnosticRequest
  ): Promise<EnhancedDiagnosticResponse> {
    const startTime = Date.now();
    this.processingSteps = [];

    try {
      devLog("info", this.context, "Starting enhanced diagnosis", {
        userId: request.userId,
        doctorLevel: request.doctorLevel,
        requiresPersonalization: request.requiresPersonalization,
        requiresSafetyValidation: request.requiresSafetyValidation,
      });

      // Step 1: Analyze request complexity
      const complexity = await this.analyzeComplexity(request);

      // Step 2: Select optimal AI model
      const modelCriteria = await this.buildModelCriteria(request, complexity);

      // Step 3: Generate base diagnosis
      const diagnosisResult = await this.generateBaseDiagnosis(request, modelCriteria);

      // Step 4: Apply personalization if requested
      let personalizedRecommendations;
      let personalizationFactors;
      
      if (request.requiresPersonalization && this.config.enablePersonalization) {
        const personalizationResult = await this.applyPersonalization(
          request.userId,
          diagnosisResult.diagnosis
        );
        personalizedRecommendations = personalizationResult.recommendations;
        personalizationFactors = personalizationResult.factors;
      }

      // Step 5: Validate safety if requested
      let safetyValidation;
      
      if (request.requiresSafetyValidation && this.config.enableSafetyValidation && request.medicalHistory) {
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
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<DiagnosticConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logInfo(this.context, "Configuration updated", { config: this.config });
  }

  /**
   * Get processing steps for debugging
   */
  getProcessingSteps(): DiagnosticProcessingStep[] {
    return [...this.processingSteps];
  }

  // Private helper methods

  private async analyzeComplexity(request: EnhancedDiagnosticRequest) {
    const step = this.startStep("complexity_analysis");
    
    try {
      const complexity = this.modelRouter.analyzeComplexity({
        messages: request.messages,
        images: request.images,
        files: request.files,
        requiresAnalysis: true,
        requiresPersonalization: request.requiresPersonalization,
      });
      
      this.completeStep(step, { complexity });
      return complexity;
    } catch (error) {
      this.failStep(step, error);
      throw error;
    }
  }

  private async buildModelCriteria(request: EnhancedDiagnosticRequest, complexity: any): Promise<ModelSelectionCriteria> {
    return {
      complexity,
      doctorLevel: request.doctorLevel,
      preferredModel: request.preferredModel,
      requiresVision: Boolean(request.images && request.images.length > 0),
      requiresStreaming: false,
    };
  }

  private async generateBaseDiagnosis(
    request: EnhancedDiagnosticRequest,
    criteria: ModelSelectionCriteria
  ) {
    const step = this.startStep("base_diagnosis");
    
    try {
      // This would integrate with the existing diagnosis API
      // For now, return a mock structure
      const startTime = Date.now();

      // In a real implementation, this would call the model router
      // to generate the diagnosis using the selected model

      const mockDiagnosis = {
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

      const result = {
        diagnosis: mockDiagnosis,
        modelId: criteria.preferredModel || "gemini-2.5-pro",
        responseTime: Date.now() - startTime,
        modelSelection: "Mock model selection reasoning",
      };

      this.completeStep(step, { modelId: result.modelId, responseTime: result.responseTime });
      return result;
    } catch (error) {
      this.failStep(step, error);
      throw error;
    }
  }

  private async applyPersonalization(userId: string, diagnosis: any) {
    const step = this.startStep("personalization");
    
    try {
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

      const result = {
        recommendations: { dietary, lifestyle },
        factors,
      };

      this.completeStep(step, { 
        dietaryCount: dietary.length, 
        lifestyleCount: lifestyle.length 
      });
      
      return result;
    } catch (error) {
      this.failStep(step, error);
      throw error;
    }
  }

  private async validateSafety(diagnosis: any, context: ValidationContext) {
    const step = this.startStep("safety_validation");
    
    try {
      const recommendations = {
        dietary: diagnosis.recommendations.food_therapy?.beneficial || [],
        herbal: [], // Would extract from herbal_formulas if present
        lifestyle: diagnosis.recommendations.lifestyle || [],
        acupressure: diagnosis.recommendations.acupoints || [],
      };

      const result = await this.safetyValidator.validateRecommendations(recommendations, context);
      
      this.completeStep(step, { 
        riskLevel: result.risk_level, 
        concernCount: result.concerns.length 
      });
      
      return result;
    } catch (error) {
      this.failStep(step, error);
      throw error;
    }
  }

  private calculateOverallConfidence(diagnosisResult: any, safetyValidation?: any): number {
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

  // Processing step tracking methods

  private startStep(name: string): DiagnosticProcessingStep {
    const step: DiagnosticProcessingStep = {
      name,
      startTime: Date.now(),
    };
    
    this.processingSteps.push(step);
    return step;
  }

  private completeStep(step: DiagnosticProcessingStep, metadata?: Record<string, any>): void {
    step.endTime = Date.now();
    step.success = true;
    step.metadata = metadata;
  }

  private failStep(step: DiagnosticProcessingStep, error: any): void {
    step.endTime = Date.now();
    step.success = false;
    step.error = error instanceof Error ? error.message : String(error);
  }
}