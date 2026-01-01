/**
 * Personalization Engine - Legacy wrapper for backward compatibility
 * 
 * This class now delegates to the new PersonalizationOrchestrator while maintaining
 * the same interface for existing code. New code should use PersonalizationOrchestrator directly.
 * 
 * @deprecated Use PersonalizationOrchestrator directly for new implementations
 */

import { supabase } from "../supabase";
import { devLog, logError, logInfo } from "../systemLogger";
import { DiagnosisSession } from "@/types/database";

import {
  UserProfile,
  PersonalizationFactors,
  PersonalizedRecommendation,
  SafetyValidationResult,
  FeedbackData,
  PersonalizationConfig
} from './interfaces/PersonalizationInterfaces';

import { PersonalizationOrchestrator } from './core/PersonalizationOrchestrator';

/**
 * Legacy Personalization Engine - delegates to PersonalizationOrchestrator
 * @deprecated Use PersonalizationOrchestrator directly
 */
export class PersonalizationEngine {
  private orchestrator: PersonalizationOrchestrator;

  constructor(context: string = "PersonalizationEngine") {
    // Create orchestrator with legacy context
    this.orchestrator = new PersonalizationOrchestrator(`${context}_Legacy`);
  }

  /**
   * Get comprehensive personalization factors for a user
   * @deprecated Use orchestrator.getPersonalizationFactors() directly
   */
  async getPersonalizationFactors(userId: string): Promise<PersonalizationFactors> {
    return this.orchestrator.getPersonalizationFactors(userId);
  }

  /**
   * Personalize dietary recommendations
   * @deprecated Use orchestrator.personalizeDietaryRecommendations() directly
   */
  async personalizeDietaryRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    return this.orchestrator.personalizeDietaryRecommendations(originalRecommendations, factors);
  }

  /**
   * Personalize lifestyle recommendations
   * @deprecated Use orchestrator.personalizeLifestyleRecommendations() directly
   */
  async personalizeLifestyleRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    return this.orchestrator.personalizeLifestyleRecommendations(originalRecommendations, factors);
  }

  /**
   * Validate recommendation safety with personalization context
   * @deprecated Use orchestrator.validateRecommendationSafety() directly
   */
  async validateRecommendationSafety(
    recommendations: string[],
    factors: PersonalizationFactors
  ): Promise<SafetyValidationResult> {
    return this.orchestrator.validateRecommendationSafety(recommendations, factors);
  }

  /**
   * Update learning profile from user feedback
   * @deprecated Use orchestrator.updateLearningProfile() directly
   */
  async updateLearningProfile(
    userId: string,
    feedback: FeedbackData
  ): Promise<void> {
    return this.orchestrator.updateLearningProfile(userId, feedback);
  }

  /**
   * Get optimal explanation complexity level for user
   * @deprecated Use orchestrator.getOptimalExplanationLevel() directly
   */
  getOptimalExplanationLevel(
    factors: PersonalizationFactors
  ): "basic" | "intermediate" | "advanced" {
    return this.orchestrator.getOptimalExplanationLevel(factors);
  }

  /**
   * Get personalized communication style
   * @deprecated Use orchestrator.getPersonalizedCommunicationStyle() directly
   */
  async getPersonalizedCommunicationStyle(
    userId: string,
    factors: PersonalizationFactors
  ): Promise<{
    style: "direct" | "indirect" | "contextual";
    complexity: "basic" | "intermediate" | "advanced";
    preferences: string[];
  }> {
    return this.orchestrator.getPersonalizedCommunicationStyle(userId, factors);
  }

  /**
   * Update configuration
   * @deprecated Use orchestrator.updateConfiguration() directly
   */
  updateConfiguration(newConfig: Partial<PersonalizationConfig>): void {
    return this.orchestrator.updateConfiguration(newConfig);
  }

  /**
   * Get system statistics
   * @deprecated Use orchestrator.getSystemStatistics() directly
   */
  getSystemStatistics(): {
    total_profiles: number;
    learning_trends: any;
    configuration: PersonalizationConfig;
  } {
    return this.orchestrator.getSystemStatistics();
  }
}

/**
 * Create a personalization engine instance (legacy wrapper)
 * @deprecated Use createPersonalizationOrchestrator() instead
 */
export const defaultPersonalizationEngine = new PersonalizationEngine("DefaultPersonalization");

/**
 * Create a personalization orchestrator instance (recommended)
 */
export function createPersonalizationOrchestrator(context?: string): PersonalizationOrchestrator {
  return new PersonalizationOrchestrator(context);
}

/**
 * Default personalization orchestrator instance
 */
export const defaultPersonalizationOrchestrator = new PersonalizationOrchestrator("DefaultPersonalization");

/**
 * Convenience function to get personalized recommendations using the new orchestrator
 */
export async function getPersonalizedRecommendations(
  userId: string,
  originalRecommendations: {
    dietary?: string[];
    lifestyle?: string[];
    herbal?: string[];
  }
): Promise<{
  dietary: PersonalizedRecommendation[];
  lifestyle: PersonalizedRecommendation[];
  safety_check: SafetyValidationResult;
}> {
  const orchestrator = defaultPersonalizationOrchestrator;
  const factors = await orchestrator.getPersonalizationFactors(userId);

  const dietary = originalRecommendations.dietary
    ? await orchestrator.personalizeDietaryRecommendations(originalRecommendations.dietary, factors)
    : [];

  const lifestyle = originalRecommendations.lifestyle
    ? await orchestrator.personalizeLifestyleRecommendations(originalRecommendations.lifestyle, factors)
    : [];

  // Combine all recommendations for safety check
  const all_recommendations = [
    ...(originalRecommendations.dietary || []),
    ...(originalRecommendations.lifestyle || []),
    ...(originalRecommendations.herbal || []),
  ];

  const safety_check = await orchestrator.validateRecommendationSafety(all_recommendations, factors);

  return {
    dietary,
    lifestyle,
    safety_check,
  };
}