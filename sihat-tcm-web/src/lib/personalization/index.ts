/**
 * Personalization System - Main Exports
 *
 * Centralized exports for the personalization system components.
 * Provides clean interfaces for personalized TCM recommendations.
 */

// Core orchestrator (recommended for new code)
export {
  PersonalizationOrchestrator,
  createPersonalizationOrchestrator,
  defaultPersonalizationOrchestrator,
} from "./core/PersonalizationOrchestrator";

// Safety validation
export {
  SafetyValidator,
  createSafetyValidator,
  defaultSafetyValidator,
} from "./core/SafetyValidator";

// Recommendation generation
export {
  RecommendationGenerator,
  createRecommendationGenerator,
  defaultRecommendationGenerator,
} from "./core/RecommendationGenerator";

// Legacy engine (for backward compatibility)
export {
  PersonalizationEngine,
  defaultPersonalizationEngine,
  getPersonalizedRecommendations,
} from "./PersonalizationEngine";

// Core components
export { CulturalContextBuilder } from "./core/CulturalContextBuilder";
export { HealthHistoryAnalyzer } from "./core/HealthHistoryAnalyzer";

// Adapters
export { DietaryRecommendationAdapter } from "./adapters/DietaryRecommendationAdapter";
export { LifestyleRecommendationAdapter } from "./adapters/LifestyleRecommendationAdapter";

// Learning system
export { LearningProfileManager } from "./learning/LearningProfileManager";

// Type definitions
export type {
  // Core interfaces
  PersonalizationOrchestrator as IPersonalizationOrchestrator,
  UserProfile,
  PersonalizationFactors,
  PersonalizedRecommendation,
  SafetyValidationResult,
  SafetyCheck,
  FeedbackData,
  PersonalizationConfig,

  // Cultural context
  CulturalContext,
  CommunicationStyle,

  // Health data
  HealthHistory,
  DietaryRestrictions,
  UserPreferences,

  // Learning system
  LearningProfile,
  CommunicationPreferences,
  LearningTrends,
} from "./interfaces/PersonalizationInterfaces";

/**
 * Quick setup function for personalization system
 */
export function setupPersonalizationSystem(config?: {
  enableCulturalAdaptation?: boolean;
  enableDietaryModification?: boolean;
  enableLearningFromFeedback?: boolean;
  maxAlternativeSuggestions?: number;
  confidenceThreshold?: number;
}) {
  const orchestrator = createPersonalizationOrchestrator("QuickSetup");

  if (config) {
    orchestrator.updateConfiguration(config);
  }

  return {
    orchestrator,
    getPersonalizationFactors: orchestrator.getPersonalizationFactors.bind(orchestrator),
    personalizeDietaryRecommendations:
      orchestrator.personalizeDietaryRecommendations.bind(orchestrator),
    personalizeLifestyleRecommendations:
      orchestrator.personalizeLifestyleRecommendations.bind(orchestrator),
    validateRecommendationSafety: orchestrator.validateRecommendationSafety.bind(orchestrator),
    updateLearningProfile: orchestrator.updateLearningProfile.bind(orchestrator),
  };
}

/**
 * Convenience function for getting comprehensive personalized recommendations
 */
export async function getComprehensivePersonalizedRecommendations(
  userId: string,
  originalRecommendations: {
    dietary?: string[];
    lifestyle?: string[];
    herbal?: string[];
  },
  options?: {
    enableSafetyValidation?: boolean;
    maxAlternatives?: number;
  }
) {
  const orchestrator = defaultPersonalizationOrchestrator;
  const factors = await orchestrator.getPersonalizationFactors(userId);

  // Personalize each type of recommendation
  const [dietary, lifestyle] = await Promise.all([
    originalRecommendations.dietary
      ? orchestrator.personalizeDietaryRecommendations(originalRecommendations.dietary, factors)
      : Promise.resolve([]),
    originalRecommendations.lifestyle
      ? orchestrator.personalizeLifestyleRecommendations(originalRecommendations.lifestyle, factors)
      : Promise.resolve([]),
  ]);

  // Safety validation if enabled
  let safetyCheck: SafetyValidationResult | undefined;
  if (options?.enableSafetyValidation !== false) {
    const allRecommendations = [
      ...(originalRecommendations.dietary || []),
      ...(originalRecommendations.lifestyle || []),
      ...(originalRecommendations.herbal || []),
    ];

    safetyCheck = await orchestrator.validateRecommendationSafety(allRecommendations, factors);
  }

  return {
    dietary,
    lifestyle,
    safetyCheck,
    factors,
    communicationStyle: await orchestrator.getPersonalizedCommunicationStyle(userId, factors),
    explanationLevel: orchestrator.getOptimalExplanationLevel(factors),
  };
}
