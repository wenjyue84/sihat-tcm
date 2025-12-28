/**
 * Personalization Orchestrator
 * 
 * Main orchestrator for personalized TCM recommendations with clean architecture.
 * Coordinates between different personalization components.
 */

import {
  UserProfile,
  PersonalizationFactors,
  PersonalizedRecommendation,
  SafetyValidationResult,
  FeedbackData,
  PersonalizationConfig,
  PersonalizationOrchestrator as IPersonalizationOrchestrator,
} from '../interfaces/PersonalizationInterfaces';

import { CulturalContextBuilder } from './CulturalContextBuilder';
import { HealthHistoryAnalyzer } from './HealthHistoryAnalyzer';
import { DietaryRecommendationAdapter } from '../adapters/DietaryRecommendationAdapter';
import { LifestyleRecommendationAdapter } from '../adapters/LifestyleRecommendationAdapter';
import { LearningProfileManager } from '../learning/LearningProfileManager';
import { SafetyValidator } from './SafetyValidator';
import { RecommendationGenerator } from './RecommendationGenerator';

import { devLog, logError, logInfo } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Enhanced Personalization Orchestrator with modular architecture
 */
export class PersonalizationOrchestrator implements IPersonalizationOrchestrator {
  private readonly context: string;
  
  // Core components
  private readonly culturalBuilder: CulturalContextBuilder;
  private readonly healthAnalyzer: HealthHistoryAnalyzer;
  private readonly dietaryAdapter: DietaryRecommendationAdapter;
  private readonly lifestyleAdapter: LifestyleRecommendationAdapter;
  private readonly learningManager: LearningProfileManager;
  private readonly safetyValidator: SafetyValidator;
  private readonly recommendationGenerator: RecommendationGenerator;
  
  // Configuration
  private config: PersonalizationConfig;

  constructor(context: string = "PersonalizationOrchestrator") {
    this.context = context;
    
    // Initialize components
    this.culturalBuilder = new CulturalContextBuilder();
    this.healthAnalyzer = new HealthHistoryAnalyzer();
    this.dietaryAdapter = new DietaryRecommendationAdapter();
    this.lifestyleAdapter = new LifestyleRecommendationAdapter();
    this.learningManager = new LearningProfileManager();
    this.safetyValidator = new SafetyValidator();
    this.recommendationGenerator = new RecommendationGenerator();
    
    // Default configuration
    this.config = {
      enableCulturalAdaptation: true,
      enableDietaryModification: true,
      enableLearningFromFeedback: true,
      maxAlternativeSuggestions: 5,
      confidenceThreshold: 0.7,
    };
  }

  /**
   * Get comprehensive personalization factors for a user
   */
  public async getPersonalizationFactors(userId: string): Promise<PersonalizationFactors> {
    try {
      devLog(`[${this.context}] Getting personalization factors for user: ${userId}`);

      // Get user profile and health history in parallel
      const [userProfile, healthHistory] = await Promise.all([
        this.getUserProfile(userId),
        this.getHealthHistory(userId),
      ]);

      // Build comprehensive factors
      const culturalContext = this.culturalBuilder.buildCulturalContext(
        userProfile.preferred_language || "en"
      );

      const dietaryRestrictions = this.buildDietaryRestrictions(userProfile.dietary_preferences);
      const preferences = this.determineUserPreferences(userProfile, healthHistory);

      const factors: PersonalizationFactors = {
        user_profile: userProfile,
        cultural_context: culturalContext,
        dietary_restrictions: dietaryRestrictions,
        health_history: healthHistory,
        preferences,
      };

      devLog(`[${this.context}] Personalization factors retrieved successfully`, {
        userId,
        culturalContext: culturalContext.language,
        dietaryType: dietaryRestrictions.dietary_type,
      });

      return factors;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'getPersonalizationFactors',
        metadata: { userId },
      });
    }
  }

  /**
   * Personalize dietary recommendations
   */
  public async personalizeDietaryRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    try {
      if (!this.config.enableDietaryModification) {
        return this.createFallbackRecommendations(
          originalRecommendations,
          "Dietary modification disabled"
        );
      }

      devLog(`[${this.context}] Personalizing ${originalRecommendations.length} dietary recommendations`);

      const personalized = await Promise.all(
        originalRecommendations.map(async (recommendation) => {
          try {
            return await this.dietaryAdapter.adaptDietaryRecommendation(recommendation, factors);
          } catch (error) {
            logError(`[${this.context}] Failed to personalize dietary recommendation`, {
              error,
              recommendation,
            });

            return this.createFallbackRecommendation(
              recommendation,
              "Personalization failed, using original recommendation"
            );
          }
        })
      );

      return personalized;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'personalizeDietaryRecommendations',
      });
    }
  }

  /**
   * Personalize lifestyle recommendations
   */
  public async personalizeLifestyleRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    try {
      if (!this.config.enableCulturalAdaptation) {
        return this.createFallbackRecommendations(
          originalRecommendations,
          "Cultural adaptation disabled"
        );
      }

      devLog(`[${this.context}] Personalizing ${originalRecommendations.length} lifestyle recommendations`);

      const personalized = originalRecommendations.map((recommendation) => {
        return this.lifestyleAdapter.adaptLifestyleRecommendation(recommendation, factors);
      });

      return personalized;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'personalizeLifestyleRecommendations',
      });
    }
  }

  /**
   * Validate recommendation safety with personalization context
   */
  public async validateRecommendationSafety(
    recommendations: string[],
    factors: PersonalizationFactors
  ): Promise<SafetyValidationResult> {
    try {
      devLog(`[${this.context}] Validating safety for ${recommendations.length} recommendations`);

      const result = await this.safetyValidator.validateRecommendations(recommendations, factors);

      // Generate alternatives for flagged recommendations if enabled
      if (this.config.enableDietaryModification && result.flagged_recommendations.length > 0) {
        const alternatives = await this.recommendationGenerator.generateAlternatives(
          result.flagged_recommendations,
          factors,
          this.config.maxAlternativeSuggestions
        );
        
        result.alternative_suggestions = alternatives;
      }

      return result;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'validateRecommendationSafety',
      });
    }
  }

  /**
   * Update learning profile from user feedback
   */
  public async updateLearningProfile(userId: string, feedback: FeedbackData): Promise<void> {
    try {
      if (!this.config.enableLearningFromFeedback) {
        devLog(`[${this.context}] Learning from feedback is disabled`);
        return;
      }

      await this.learningManager.updateLearningProfile(userId, feedback);
      
      devLog(`[${this.context}] Updated learning profile`, { userId, feedbackType: feedback.type });

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'updateLearningProfile',
        metadata: { userId },
      });
    }
  }

  /**
   * Get optimal explanation complexity level for user
   */
  public getOptimalExplanationLevel(factors: PersonalizationFactors): "basic" | "intermediate" | "advanced" {
    const { user_profile, health_history } = factors;

    // Consider user's role and experience
    if (user_profile.role === "doctor") return "advanced";

    // Consider previous diagnosis count as experience indicator
    const experienceLevel = health_history.previous_diagnoses.length;

    if (experienceLevel >= 5) return "advanced";
    if (experienceLevel >= 2) return "intermediate";
    return "basic";
  }

  /**
   * Get personalized communication style
   */
  public async getPersonalizedCommunicationStyle(
    userId: string,
    factors: PersonalizationFactors
  ): Promise<{
    style: "direct" | "indirect" | "contextual";
    complexity: "basic" | "intermediate" | "advanced";
    preferences: string[];
  }> {
    try {
      // Get learned preferences
      const communicationPrefs = await this.learningManager.getOptimalCommunicationStyle(userId);
      
      // Get cultural preferences
      const culturalStyle = this.culturalBuilder.getCulturalCommunicationStyle(
        factors.cultural_context
      );

      // Combine learned and cultural preferences
      return {
        style: culturalStyle.style,
        complexity: communicationPrefs.complexity_level as any,
        preferences: [
          ...culturalStyle.preferences,
          ...communicationPrefs.effective_types
        ]
      };

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'getPersonalizedCommunicationStyle',
        metadata: { userId },
      });
    }
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<PersonalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logInfo(`[${this.context}] Configuration updated`, { config: this.config });
  }

  /**
   * Get system statistics
   */
  public getSystemStatistics(): {
    total_profiles: number;
    learning_trends: any;
    configuration: PersonalizationConfig;
  } {
    return {
      total_profiles: 0, // Would need to track this
      learning_trends: this.learningManager.analyzeLearningTrends(),
      configuration: this.config
    };
  }

  // Private helper methods

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // This would be implemented to fetch from Supabase
    // For now, return a mock profile
    return {
      id: userId,
      preferred_language: 'en',
      role: 'patient',
      dietary_preferences: {},
    } as UserProfile;
  }

  /**
   * Get health history from database
   */
  private async getHealthHistory(userId: string): Promise<any> {
    // This would be implemented to fetch diagnosis sessions from Supabase
    // For now, return empty history
    return {
      previous_diagnoses: [],
      chronic_conditions: [],
      medications: [],
      allergies: [],
    };
  }

  /**
   * Build dietary restrictions from preferences
   */
  private buildDietaryRestrictions(dietaryPreferences?: any): PersonalizationFactors["dietary_restrictions"] {
    return {
      allergies: dietaryPreferences?.allergies || [],
      dietary_type: dietaryPreferences?.dietary_type || "no_restrictions",
      disliked_foods: dietaryPreferences?.disliked_foods || [],
      religious_restrictions: dietaryPreferences?.religious_restrictions || [],
    };
  }

  /**
   * Determine user preferences from profile and history
   */
  private determineUserPreferences(userProfile: UserProfile, healthHistory: any): PersonalizationFactors["preferences"] {
    const sessionCount = healthHistory.previous_diagnoses?.length || 0;

    return {
      communication_style: sessionCount > 3 ? "detailed" : "concise",
      explanation_level: userProfile.role === "doctor" ? "advanced" : "intermediate",
      recommendation_focus: "balanced", // Could be learned from user interactions
    };
  }

  /**
   * Create fallback recommendations when personalization is disabled
   */
  private createFallbackRecommendations(
    originalRecommendations: string[],
    reason: string
  ): PersonalizedRecommendation[] {
    return originalRecommendations.map(rec => this.createFallbackRecommendation(rec, reason));
  }

  /**
   * Create a single fallback recommendation
   */
  private createFallbackRecommendation(
    originalRecommendation: string,
    reason: string
  ): PersonalizedRecommendation {
    return {
      original_recommendation: originalRecommendation,
      personalized_version: originalRecommendation,
      personalization_factors: [],
      cultural_adaptations: [],
      dietary_modifications: [],
      confidence_score: 1.0,
      reasoning: reason,
    };
  }
}

/**
 * Factory function for creating personalization orchestrator
 */
export function createPersonalizationOrchestrator(context?: string): PersonalizationOrchestrator {
  return new PersonalizationOrchestrator(context);
}

/**
 * Default personalization orchestrator instance
 */
export const defaultPersonalizationOrchestrator = new PersonalizationOrchestrator();