/**
 * Complexity Analysis Strategy Implementation
 * 
 * Extracted from AIModelRouter to follow Single Responsibility Principle
 * and Strategy pattern for better testability and maintainability.
 */

import { 
  AIRequest, 
  RequestComplexity, 
  ComplexityFactors, 
  RequestComplexityType,
  ComplexityAnalysisStrategy 
} from '../interfaces/AIModel';

import { 
  COMPLEXITY_SCORING, 
  AI_MODELS 
} from '../../constants';

/**
 * Enhanced Complexity Analysis Strategy
 * 
 * This class implements sophisticated complexity analysis using multiple
 * factors to determine the optimal AI model for each request.
 */
export class EnhancedComplexityAnalyzer implements ComplexityAnalysisStrategy {
  
  /**
   * Analyze request complexity with detailed reasoning
   */
  public analyzeComplexity(request: AIRequest): RequestComplexity {
    const factors = this.extractComplexityFactors(request);
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

  /**
   * Extract complexity factors from request
   */
  private extractComplexityFactors(request: AIRequest): ComplexityFactors {
    return {
      hasImages: Boolean(request.images?.length),
      hasMultipleFiles: Boolean(request.files && request.files.length > 1),
      hasLongHistory: Boolean(request.messages && request.messages.length > 10),
      requiresAnalysis: Boolean(request.requiresAnalysis),
      requiresPersonalization: Boolean(request.requiresPersonalization),
      messageCount: request.messages?.length || 0,
      imageCount: request.images?.length || 0,
      fileSize: this.calculateTotalFileSize(request.files),
      medicalComplexity: this.assessMedicalComplexity(request),
      urgencyLevel: request.urgency || "normal",
    };
  }

  /**
   * Calculate complexity score using constants
   */
  private calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;
    
    // Base scoring using constants
    score += factors.messageCount * COMPLEXITY_SCORING.BASE_MESSAGE_WEIGHT;
    score += factors.imageCount * COMPLEXITY_SCORING.IMAGE_WEIGHT;
    score += Math.min(factors.fileSize / 1024 / 1024, 10) * COMPLEXITY_SCORING.FILE_SIZE_WEIGHT;
    
    // Boolean factors using constants
    if (factors.hasImages) score += COMPLEXITY_SCORING.IMAGE_BONUS;
    if (factors.hasMultipleFiles) score += COMPLEXITY_SCORING.MULTIPLE_FILES_BONUS;
    if (factors.hasLongHistory) score += COMPLEXITY_SCORING.LONG_HISTORY_BONUS;
    if (factors.requiresAnalysis) score += COMPLEXITY_SCORING.ANALYSIS_BONUS;
    if (factors.requiresPersonalization) score += COMPLEXITY_SCORING.PERSONALIZATION_BONUS;
    
    // Medical complexity using constants
    const medicalKey = factors.medicalComplexity.toUpperCase() as keyof typeof COMPLEXITY_SCORING.MEDICAL_COMPLEXITY;
    score += COMPLEXITY_SCORING.MEDICAL_COMPLEXITY[medicalKey] || 0;
    
    // Urgency using constants
    const urgencyKey = factors.urgencyLevel.toUpperCase() as keyof typeof COMPLEXITY_SCORING.URGENCY_LEVELS;
    score += COMPLEXITY_SCORING.URGENCY_LEVELS[urgencyKey] || 0;
    
    return Math.min(score, COMPLEXITY_SCORING.MAX_SCORE);
  }

  /**
   * Determine complexity type using constants
   */
  private determineComplexityType(score: number): RequestComplexityType {
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.ADVANCED) return "advanced";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.COMPLEX) return "complex";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.MODERATE) return "moderate";
    return "simple";
  }

  /**
   * Generate detailed reasoning for complexity assessment
   */
  private generateComplexityReasoning(factors: ComplexityFactors, score: number): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Overall complexity score: ${score}/${COMPLEXITY_SCORING.MAX_SCORE}`);
    
    if (factors.hasImages) {
      reasoning.push(`Contains ${factors.imageCount} image(s) requiring vision analysis (+${COMPLEXITY_SCORING.IMAGE_BONUS})`);
    }
    
    if (factors.hasMultipleFiles) {
      reasoning.push(`Multiple files need processing (+${COMPLEXITY_SCORING.MULTIPLE_FILES_BONUS})`);
    }
    
    if (factors.hasLongHistory) {
      reasoning.push(`Long conversation history (${factors.messageCount} messages) (+${COMPLEXITY_SCORING.LONG_HISTORY_BONUS})`);
    }
    
    if (factors.requiresAnalysis) {
      reasoning.push(`Requires deep medical analysis (+${COMPLEXITY_SCORING.ANALYSIS_BONUS})`);
    }
    
    if (factors.requiresPersonalization) {
      reasoning.push(`Needs personalized recommendations (+${COMPLEXITY_SCORING.PERSONALIZATION_BONUS})`);
    }
    
    if (factors.medicalComplexity === "high") {
      reasoning.push(`High medical complexity detected (+${COMPLEXITY_SCORING.MEDICAL_COMPLEXITY.HIGH})`);
    }
    
    if (factors.urgencyLevel === "urgent") {
      reasoning.push(`Urgent priority level (+${COMPLEXITY_SCORING.URGENCY_LEVELS.URGENT})`);
    }
    
    return reasoning;
  }

  /**
   * Get model recommendations based on complexity
   */
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

  /**
   * Calculate total file size
   */
  private calculateTotalFileSize(files?: any[]): number {
    if (!files) return 0;
    return files.reduce((total, file) => total + (file.size || 0), 0);
  }

  /**
   * Assess medical complexity based on request content
   */
  private assessMedicalComplexity(request: AIRequest): "low" | "medium" | "high" {
    const medicalHistory = request.medicalHistory;
    
    if (!medicalHistory) return "low";
    
    // High complexity indicators
    if (medicalHistory.conditions?.length > 3 || 
        medicalHistory.medications?.length > 5 ||
        medicalHistory.surgeries?.length > 2) {
      return "high";
    }
    
    // Medium complexity indicators
    if (medicalHistory.conditions?.length > 1 || 
        medicalHistory.medications?.length > 2 ||
        medicalHistory.allergies?.length > 1) {
      return "medium";
    }
    
    return "low";
  }
}

/**
 * Factory function for creating complexity analyzer
 */
export function createComplexityAnalyzer(): ComplexityAnalysisStrategy {
  return new EnhancedComplexityAnalyzer();
}

/**
 * Singleton instance for default usage
 */
export const defaultComplexityAnalyzer = new EnhancedComplexityAnalyzer();