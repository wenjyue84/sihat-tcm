/**
 * Model Selection Strategy Implementation
 * 
 * Implements intelligent model selection using multiple strategies
 * including performance-based, rule-based, and adaptive selection.
 */

import { 
  AIModel, 
  ModelSelectionStrategy, 
  ModelSelectionCriteria,
  PerformanceMonitor 
} from '../interfaces/AIModel';

import { 
  AI_MODELS, 
  MODEL_CAPABILITIES, 
  DOCTOR_LEVELS 
} from '../../constants';

import { devLog } from '../../systemLogger';

/**
 * Intelligent Model Selection Strategy
 * 
 * Uses multiple factors to select the optimal AI model:
 * - Request complexity and requirements
 * - Historical performance data
 * - Model capabilities and constraints
 * - User preferences and doctor levels
 */
export class IntelligentModelSelectionStrategy implements ModelSelectionStrategy {
  private performanceMonitor: PerformanceMonitor;
  private readonly context: string;

  constructor(performanceMonitor: PerformanceMonitor, context: string = "ModelSelection") {
    this.performanceMonitor = performanceMonitor;
    this.context = context;
  }

  /**
   * Select optimal model based on comprehensive criteria
   */
  public selectModel(
    criteria: ModelSelectionCriteria,
    availableModels: AIModel[]
  ): {
    primaryModel: AIModel;
    fallbackModels: AIModel[];
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    
    // Step 1: Filter models based on hard requirements
    let eligibleModels = this.filterByRequirements(availableModels, criteria, reasoning);
    
    if (eligibleModels.length === 0) {
      throw new Error("No eligible models found for the given criteria");
    }

    // Step 2: Apply doctor level preferences if specified
    eligibleModels = this.applyDoctorLevelPreferences(eligibleModels, criteria, reasoning);

    // Step 3: Apply user preferences
    eligibleModels = this.applyUserPreferences(eligibleModels, criteria, reasoning);

    // Step 4: Score and rank models
    const scoredModels = this.scoreModels(eligibleModels, criteria, reasoning);

    // Step 5: Select primary and fallback models
    const primaryModel = scoredModels[0].model;
    const fallbackModels = scoredModels.slice(1, 4).map(sm => sm.model);

    reasoning.push(`Selected ${primaryModel.capabilities.name} as primary model`);
    reasoning.push(`Fallback models: ${fallbackModels.map(m => m.capabilities.name).join(', ')}`);

    devLog(`[${this.context}] Model selection completed`, {
      primaryModel: primaryModel.id,
      fallbackCount: fallbackModels.length,
      totalEligible: eligibleModels.length,
    });

    return {
      primaryModel,
      fallbackModels,
      reasoning,
    };
  }

  /**
   * Filter models by hard requirements
   */
  private filterByRequirements(
    models: AIModel[], 
    criteria: ModelSelectionCriteria, 
    reasoning: string[]
  ): AIModel[] {
    let filtered = models;

    // Vision requirement
    if (criteria.requiresVision) {
      filtered = filtered.filter(model => model.capabilities.supportsVision);
      reasoning.push(`Filtered for vision support: ${filtered.length} models remaining`);
    }

    // Streaming requirement
    if (criteria.requiresStreaming) {
      filtered = filtered.filter(model => model.capabilities.supportsStreaming);
      reasoning.push(`Filtered for streaming support: ${filtered.length} models remaining`);
    }

    // Complexity compatibility
    filtered = filtered.filter(model => 
      model.capabilities.complexityRating.includes(criteria.complexity.type)
    );
    reasoning.push(`Filtered for ${criteria.complexity.type} complexity: ${filtered.length} models remaining`);

    // Language support
    if (criteria.language) {
      filtered = filtered.filter(model => 
        model.capabilities.supportedLanguages.includes(criteria.language!)
      );
      reasoning.push(`Filtered for ${criteria.language} language: ${filtered.length} models remaining`);
    }

    // Latency constraint
    if (criteria.maxLatency) {
      filtered = filtered.filter(model => 
        model.capabilities.averageLatency <= criteria.maxLatency!
      );
      reasoning.push(`Filtered for max latency ${criteria.maxLatency}ms: ${filtered.length} models remaining`);
    }

    // Cost constraint
    if (criteria.maxCost) {
      filtered = filtered.filter(model => 
        model.capabilities.costPerToken <= criteria.maxCost!
      );
      reasoning.push(`Filtered for max cost ${criteria.maxCost}: ${filtered.length} models remaining`);
    }

    // Excluded models
    if (criteria.excludedModels?.length) {
      filtered = filtered.filter(model => 
        !criteria.excludedModels!.includes(model.id)
      );
      reasoning.push(`Excluded ${criteria.excludedModels.length} models: ${filtered.length} models remaining`);
    }

    return filtered;
  }

  /**
   * Apply doctor level preferences
   */
  private applyDoctorLevelPreferences(
    models: AIModel[], 
    criteria: ModelSelectionCriteria, 
    reasoning: string[]
  ): AIModel[] {
    if (!criteria.doctorLevel || !DOCTOR_LEVELS[criteria.doctorLevel]) {
      return models;
    }

    const doctorConfig = DOCTOR_LEVELS[criteria.doctorLevel];
    const preferredModel = models.find(m => m.id === doctorConfig.model);

    if (preferredModel) {
      reasoning.push(`Doctor level ${criteria.doctorLevel} prefers ${preferredModel.capabilities.name}`);
      // Move preferred model to front
      return [preferredModel, ...models.filter(m => m.id !== preferredModel.id)];
    }

    return models;
  }

  /**
   * Apply user preferences
   */
  private applyUserPreferences(
    models: AIModel[], 
    criteria: ModelSelectionCriteria, 
    reasoning: string[]
  ): AIModel[] {
    if (!criteria.preferredModels?.length) {
      return models;
    }

    const preferred: AIModel[] = [];
    const others: AIModel[] = [];

    models.forEach(model => {
      if (criteria.preferredModels!.includes(model.id)) {
        preferred.push(model);
      } else {
        others.push(model);
      }
    });

    if (preferred.length > 0) {
      reasoning.push(`Applied user preferences: ${preferred.length} preferred models`);
      return [...preferred, ...others];
    }

    return models;
  }

  /**
   * Score models based on multiple factors
   */
  private scoreModels(
    models: AIModel[], 
    criteria: ModelSelectionCriteria, 
    reasoning: string[]
  ): Array<{ model: AIModel; score: number; breakdown: Record<string, number> }> {
    const scoredModels = models.map(model => {
      const breakdown = this.calculateModelScore(model, criteria);
      const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
      
      return {
        model,
        score: totalScore,
        breakdown,
      };
    });

    // Sort by score (descending)
    scoredModels.sort((a, b) => b.score - a.score);

    // Add scoring reasoning
    const topModel = scoredModels[0];
    reasoning.push(`Top model scored ${topModel.score.toFixed(1)} points`);
    reasoning.push(`Score breakdown: ${Object.entries(topModel.breakdown)
      .map(([factor, score]) => `${factor}: ${score.toFixed(1)}`)
      .join(', ')}`);

    return scoredModels;
  }

  /**
   * Calculate comprehensive model score
   */
  private calculateModelScore(
    model: AIModel, 
    criteria: ModelSelectionCriteria
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};

    // Base quality score (0-40 points)
    breakdown.quality = model.capabilities.qualityScore * 40;

    // Medical accuracy for medical applications (0-30 points)
    breakdown.medicalAccuracy = model.capabilities.medicalAccuracy * 30;

    // Performance history (0-20 points)
    breakdown.performance = this.getPerformanceScore(model.id, criteria.complexity.type);

    // Latency score (0-15 points) - lower latency is better
    const latencyScore = Math.max(0, 15 - (model.capabilities.averageLatency / 1000));
    breakdown.latency = latencyScore;

    // Cost efficiency (0-10 points) - lower cost is better
    const costScore = Math.max(0, 10 - (model.capabilities.costPerToken * 1000000));
    breakdown.cost = costScore;

    // Complexity match bonus (0-10 points)
    if (model.capabilities.complexityRating[0] === criteria.complexity.type) {
      breakdown.complexityMatch = 10; // Perfect match
    } else if (model.capabilities.complexityRating.includes(criteria.complexity.type)) {
      breakdown.complexityMatch = 5; // Supports complexity
    } else {
      breakdown.complexityMatch = 0;
    }

    // Vision capability bonus (0-5 points)
    if (criteria.requiresVision && model.capabilities.supportsVision) {
      breakdown.visionBonus = 5;
    } else {
      breakdown.visionBonus = 0;
    }

    // Streaming capability bonus (0-5 points)
    if (criteria.requiresStreaming && model.capabilities.supportsStreaming) {
      breakdown.streamingBonus = 5;
    } else {
      breakdown.streamingBonus = 0;
    }

    return breakdown;
  }

  /**
   * Get performance-based score from historical data
   */
  private getPerformanceScore(modelId: string, requestType: string): number {
    try {
      const analytics = this.performanceMonitor.getAnalytics(modelId);
      const modelPerf = analytics.modelPerformance[modelId];

      if (!modelPerf || modelPerf.requests < 5) {
        return 10; // Default score for models with insufficient data
      }

      // Score based on success rate and response time
      const successScore = modelPerf.successRate * 15; // 0-15 points
      const speedScore = Math.max(0, 5 - (modelPerf.averageResponseTime / 2000)); // 0-5 points

      return successScore + speedScore;
    } catch (error) {
      devLog(`[${this.context}] Failed to get performance score for ${modelId}`, error);
      return 10; // Default score on error
    }
  }
}

/**
 * Rule-based Model Selection Strategy
 * 
 * Simple strategy that uses predefined rules without performance history.
 * Useful for initial deployment or when performance data is unavailable.
 */
export class RuleBasedModelSelectionStrategy implements ModelSelectionStrategy {
  private readonly context: string;

  constructor(context: string = "RuleBasedSelection") {
    this.context = context;
  }

  public selectModel(
    criteria: ModelSelectionCriteria,
    availableModels: AIModel[]
  ): {
    primaryModel: AIModel;
    fallbackModels: AIModel[];
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    const { complexity, requiresVision, doctorLevel } = criteria;

    // Simple rule-based selection
    let primaryModelId: string;

    if (doctorLevel && DOCTOR_LEVELS[doctorLevel]) {
      primaryModelId = DOCTOR_LEVELS[doctorLevel].model;
      reasoning.push(`Selected based on doctor level: ${doctorLevel}`);
    } else if (complexity.type === "advanced" || requiresVision) {
      primaryModelId = AI_MODELS.GEMINI_3_PRO_PREVIEW;
      reasoning.push(`Selected advanced model for ${complexity.type} complexity`);
    } else if (complexity.type === "complex") {
      primaryModelId = AI_MODELS.GEMINI_2_5_PRO;
      reasoning.push(`Selected capable model for complex request`);
    } else {
      primaryModelId = AI_MODELS.GEMINI_2_FLASH;
      reasoning.push(`Selected efficient model for ${complexity.type} request`);
    }

    const primaryModel = availableModels.find(m => m.id === primaryModelId);
    if (!primaryModel) {
      throw new Error(`Primary model ${primaryModelId} not available`);
    }

    const fallbackModels = availableModels
      .filter(m => m.id !== primaryModelId)
      .slice(0, 3);

    reasoning.push(`Fallback models: ${fallbackModels.map(m => m.capabilities.name).join(', ')}`);

    return {
      primaryModel,
      fallbackModels,
      reasoning,
    };
  }
}

/**
 * Factory functions for creating selection strategies
 */
export function createIntelligentSelectionStrategy(
  performanceMonitor: PerformanceMonitor,
  context?: string
): ModelSelectionStrategy {
  return new IntelligentModelSelectionStrategy(performanceMonitor, context);
}

export function createRuleBasedSelectionStrategy(context?: string): ModelSelectionStrategy {
  return new RuleBasedModelSelectionStrategy(context);
}