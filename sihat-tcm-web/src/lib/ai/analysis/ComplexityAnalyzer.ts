/**
 * Request complexity analysis module
 */

import { RequestComplexity, RequestComplexityType, ComplexityFactors } from "../interfaces/ModelInterfaces";
import { COMPLEXITY_SCORING, AI_MODELS } from "../../constants";

export class ComplexityAnalyzer {
  /**
   * Analyze request complexity based on various factors
   */
  public analyzeComplexity(request: {
import type { AIRequest } from "@/types/ai-request";

    messages?: AIRequest["messages"];
    images?: AIRequest["images"];
    files?: AIRequest["files"];
    requiresAnalysis?: boolean;
    requiresPersonalization?: boolean;
    medicalHistory?: AIRequest["medicalHistory"];
    urgency?: string;
  }): RequestComplexity {
    const factors: ComplexityFactors = {
      hasImages: Boolean(request.images?.length),
      hasMultipleFiles: Boolean(request.files && request.files.length > 1),
      hasLongHistory: Boolean(request.messages && request.messages.length > 10),
      requiresAnalysis: Boolean(request.requiresAnalysis),
      requiresPersonalization: Boolean(request.requiresPersonalization),
      messageCount: request.messages?.length || 0,
      imageCount: request.images?.length || 0,
      fileSize: this.calculateTotalFileSize(request.files),
      medicalComplexity: this.assessMedicalComplexity(request),
      urgencyLevel: (request.urgency as "low" | "normal" | "high" | "urgent") || "normal",
    };

    const score = this.calculateComplexityScore(factors);
    const type = this.determineComplexityType(score);
    const reasoning = this.generateComplexityReasoning(factors, score);
    const { recommendedModel, fallbackModels } = this.getModelRecommendations(type, factors);

    return {
      type,
      factors,
      score,
      reasoning,
      recommendedModel,
      fallbackModels,
    };
  }

  private calculateTotalFileSize(files?: AIRequest["files"]): number {
    if (!files) return 0;
    return files.reduce((total, file) => total + (file.size || 0), 0);
  }

  private assessMedicalComplexity(request: any): "low" | "medium" | "high" {
    if (request.medicalHistory?.conditions?.length > 3) return "high";
    if (request.medicalHistory?.medications?.length > 2) return "medium";
    return "low";
  }

  private calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;
    
    // Base scoring using constants
    score += factors.messageCount * COMPLEXITY_SCORING.BASE_MESSAGE_WEIGHT;
    score += factors.imageCount * COMPLEXITY_SCORING.IMAGE_WEIGHT;
    score += Math.min(factors.fileSize / 1024 / 1024, 10) * COMPLEXITY_SCORING.FILE_SIZE_WEIGHT;
    
    // Boolean factors
    if (factors.hasImages) score += COMPLEXITY_SCORING.IMAGE_BONUS;
    if (factors.hasMultipleFiles) score += COMPLEXITY_SCORING.MULTIPLE_FILES_BONUS;
    if (factors.hasLongHistory) score += COMPLEXITY_SCORING.LONG_HISTORY_BONUS;
    if (factors.requiresAnalysis) score += COMPLEXITY_SCORING.ANALYSIS_BONUS;
    if (factors.requiresPersonalization) score += COMPLEXITY_SCORING.PERSONALIZATION_BONUS;
    
    // Medical complexity
    score += COMPLEXITY_SCORING.MEDICAL_COMPLEXITY[factors.medicalComplexity.toUpperCase() as keyof typeof COMPLEXITY_SCORING.MEDICAL_COMPLEXITY] || 0;
    
    // Urgency
    score += COMPLEXITY_SCORING.URGENCY_LEVELS[factors.urgencyLevel.toUpperCase() as keyof typeof COMPLEXITY_SCORING.URGENCY_LEVELS] || 0;
    
    return Math.min(score, COMPLEXITY_SCORING.MAX_SCORE);
  }

  private determineComplexityType(score: number): RequestComplexityType {
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.ADVANCED) return "advanced";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.COMPLEX) return "complex";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.MODERATE) return "moderate";
    return "simple";
  }

  private generateComplexityReasoning(factors: ComplexityFactors, score: number): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Overall complexity score: ${score}/100`);
    
    if (factors.hasImages) reasoning.push("Contains images requiring vision analysis");
    if (factors.hasMultipleFiles) reasoning.push("Multiple files need processing");
    if (factors.hasLongHistory) reasoning.push("Long conversation history");
    if (factors.requiresAnalysis) reasoning.push("Requires deep medical analysis");
    if (factors.requiresPersonalization) reasoning.push("Needs personalized recommendations");
    if (factors.medicalComplexity === "high") reasoning.push("High medical complexity detected");
    if (factors.urgencyLevel === "urgent") reasoning.push("Urgent priority level");
    
    return reasoning;
  }

  private getModelRecommendations(type: RequestComplexityType, factors: ComplexityFactors): {
    recommendedModel: string;
    fallbackModels: string[];
  } {
    switch (type) {
      case "advanced":
        return {
          recommendedModel: AI_MODELS.GEMINI_3_PRO_PREVIEW,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO, AI_MODELS.GEMINI_2_FLASH],
        };
      case "complex":
        return {
          recommendedModel: AI_MODELS.GEMINI_2_5_PRO,
          fallbackModels: [AI_MODELS.GEMINI_3_PRO_PREVIEW, AI_MODELS.GEMINI_2_FLASH],
        };
      case "moderate":
        return {
          recommendedModel: factors.hasImages ? AI_MODELS.GEMINI_2_5_PRO : AI_MODELS.GEMINI_2_FLASH,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO, AI_MODELS.GEMINI_2_FLASH],
        };
      default: // simple
        return {
          recommendedModel: AI_MODELS.GEMINI_2_FLASH,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO],
        };
    }
  }
}