/**
 * Model selection strategy implementation
 */

import { ModelSelectionCriteria, ModelCapabilities } from "../interfaces/ModelInterfaces";
import { MODEL_CAPABILITIES, AI_MODELS } from "../../constants";
import { DOCTOR_LEVELS } from "../../doctorLevels";
import { AIModelError } from "../../errors/AppError";

export class ModelSelectionStrategy {
  private modelCapabilities: Map<string, ModelCapabilities> = new Map();

  constructor() {
    this.initializeModelCapabilities();
  }

  /**
   * Initialize model capabilities database using constants
   */
  private initializeModelCapabilities(): void {
    Object.entries(MODEL_CAPABILITIES).forEach(([modelId, capabilities]) => {
      this.modelCapabilities.set(modelId, {
        id: modelId,
        name: this.getModelDisplayName(modelId),
        maxTokens: capabilities.maxTokens,
        supportsVision: capabilities.supportsVision,
        supportsStreaming: capabilities.supportsStreaming,
        averageLatency: capabilities.averageLatency,
        costPerToken: capabilities.costPerToken,
        qualityScore: capabilities.qualityScore,
        medicalAccuracy: capabilities.medicalAccuracy,
        complexityRating: [...capabilities.complexityRating],
        supportedLanguages: ["en", "zh", "ms"],
      });
    });
  }

  /**
   * Select optimal model based on criteria
   */
  public selectOptimalModel(criteria: ModelSelectionCriteria): {
    primaryModel: string;
    fallbackModels: string[];
    reasoning: string[];
  } {
    const { complexity, doctorLevel, requiresVision, requiresStreaming } = criteria;

    // Filter models based on requirements
    const eligibleModels = Array.from(this.modelCapabilities.values()).filter((model) => {
      if (requiresVision && !model.supportsVision) return false;
      if (requiresStreaming && !model.supportsStreaming) return false;
      if (!model.complexityRating.includes(complexity.type)) return false;
      if (criteria.excludedModels?.includes(model.id)) return false;
      return true;
    });

    if (eligibleModels.length === 0) {
      throw new AIModelError("No eligible models found for the given criteria");
    }

    // Score models based on criteria
    const scoredModels = eligibleModels.map((model) => ({
      model,
      score: this.scoreModel(model, criteria),
    }));

    // Sort by score (descending)
    scoredModels.sort((a, b) => b.score - a.score);

    const primaryModel = scoredModels[0].model.id;
    const fallbackModels = scoredModels.slice(1, 4).map((sm) => sm.model.id);

    const reasoning = [
      `Selected ${scoredModels[0].model.name} as primary model`,
      `Complexity: ${complexity.type} (score: ${complexity.score})`,
      `Doctor level: ${doctorLevel || "not specified"}`,
      `Vision required: ${requiresVision ? "yes" : "no"}`,
      `Streaming required: ${requiresStreaming ? "yes" : "no"}`,
    ];

    return {
      primaryModel,
      fallbackModels,
      reasoning,
    };
  }

  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      [AI_MODELS.GEMINI_2_FLASH]: "Gemini 2.0 Flash",
      [AI_MODELS.GEMINI_2_5_PRO]: "Gemini 2.5 Pro",
      [AI_MODELS.GEMINI_3_PRO_PREVIEW]: "Gemini 3.0 Pro Preview",
    };
    return displayNames[modelId] || modelId;
  }

  private scoreModel(model: ModelCapabilities, criteria: ModelSelectionCriteria): number {
    let score = 0;

    // Base quality score
    score += model.qualityScore * 40;

    // Medical accuracy for medical applications
    score += model.medicalAccuracy * 30;

    // Latency preference (lower is better)
    const latencyScore = Math.max(0, 20 - model.averageLatency / 100);
    score += latencyScore;

    // Cost efficiency (lower cost is better)
    const costScore = Math.max(0, 10 - model.costPerToken * 1000000);
    score += costScore;

    // Preferred models bonus
    if (criteria.preferredModels?.includes(model.id)) {
      score += 20;
    }

    // Language support
    if (criteria.language && model.supportedLanguages.includes(criteria.language)) {
      score += 10;
    }

    return score;
  }
}
