/**
 * Personalization Engine - Main orchestrator for personalized TCM recommendations
 * 
 * Integrates all personalization components to provide comprehensive,
 * culturally-aware, and user-specific TCM recommendations.
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

import { CulturalContextBuilder } from './core/CulturalContextBuilder';
import { HealthHistoryAnalyzer } from './core/HealthHistoryAnalyzer';
import { DietaryRecommendationAdapter } from './adapters/DietaryRecommendationAdapter';
import { LifestyleRecommendationAdapter } from './adapters/LifestyleRecommendationAdapter';
import { LearningProfileManager } from './learning/LearningProfileManager';

/**
 * Enhanced Personalization Engine with modular architecture
 */
export class PersonalizationEngine {
  private context: string;
  
  // Core components
  private culturalBuilder: CulturalContextBuilder;
  private healthAnalyzer: HealthHistoryAnalyzer;
  private dietaryAdapter: DietaryRecommendationAdapter;
  private lifestyleAdapter: LifestyleRecommendationAdapter;
  private learningManager: LearningProfileManager;
  
  // Configuration
  private config: PersonalizationConfig;

  constructor(context: string = "PersonalizationEngine") {
    this.context = context;
    
    // Initialize components
    this.culturalBuilder = new CulturalContextBuilder();
    this.healthAnalyzer = new HealthHistoryAnalyzer();
    this.dietaryAdapter = new DietaryRecommendationAdapter();
    this.lifestyleAdapter = new LifestyleRecommendationAdapter();
    this.learningManager = new LearningProfileManager();
    
    // Default configuration
    this.config = {
      enableCulturalAdaptation: true,
      enableDietaryModification: true,
      enableLearningFromFeedback: true,
      maxAlternativeSuggestions: 5,
      confidenceThreshold: 0.7
    };
  }

  /**
   * Get comprehensive personalization factors for a user
   */
  async getPersonalizationFactors(userId: string): Promise<PersonalizationFactors> {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      // Fetch diagnosis history
      const { data: sessions, error: sessionsError } = await supabase
        .from("diagnosis_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sessionsError) {
        logError(this.context, "Failed to fetch diagnosis history", { error: sessionsError });
      }

      // Build comprehensive factors
      const cultural_context = this.culturalBuilder.buildCulturalContext(
        profile.preferred_language || "en"
      );

      const health_history = this.healthAnalyzer.extractHealthHistory(sessions || []);
      const dietary_restrictions = this.buildDietaryRestrictions(profile.dietary_preferences);
      const preferences = this.determineUserPreferences(profile, sessions || []);

      return {
        user_profile: profile,
        cultural_context,
        dietary_restrictions,
        health_history,
        preferences,
      };
    } catch (error) {
      logError(this.context, "Failed to get personalization factors", { error, userId });
      throw error;
    }
  }

  /**
   * Personalize dietary recommendations
   */
  async personalizeDietaryRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    if (!this.config.enableDietaryModification) {
      return originalRecommendations.map(rec => ({
        original_recommendation: rec,
        personalized_version: rec,
        personalization_factors: [],
        cultural_adaptations: [],
        dietary_modifications: [],
        confidence_score: 1.0,
        reasoning: "Dietary modification disabled"
      }));
    }

    const personalized: PersonalizedRecommendation[] = [];

    for (const recommendation of originalRecommendations) {
      try {
        const personalized_version = await this.dietaryAdapter.adaptDietaryRecommendation(
          recommendation, 
          factors
        );
        personalized.push(personalized_version);
      } catch (error) {
        logError(this.context, "Failed to personalize dietary recommendation", {
          error,
          recommendation,
        });

        // Fallback to original recommendation
        personalized.push({
          original_recommendation: recommendation,
          personalized_version: recommendation,
          personalization_factors: [],
          cultural_adaptations: [],
          dietary_modifications: [],
          confidence_score: 0.5,
          reasoning: "Personalization failed, using original recommendation",
        });
      }
    }

    return personalized;
  }

  /**
   * Personalize lifestyle recommendations
   */
  async personalizeLifestyleRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    if (!this.config.enableCulturalAdaptation) {
      return originalRecommendations.map(rec => ({
        original_recommendation: rec,
        personalized_version: rec,
        personalization_factors: [],
        cultural_adaptations: [],
        dietary_modifications: [],
        confidence_score: 1.0,
        reasoning: "Cultural adaptation disabled"
      }));
    }

    const personalized: PersonalizedRecommendation[] = [];

    for (const recommendation of originalRecommendations) {
      const adaptations = this.lifestyleAdapter.adaptLifestyleRecommendation(
        recommendation, 
        factors
      );
      personalized.push(adaptations);
    }

    return personalized;
  }

  /**
   * Validate recommendation safety with personalization context
   */
  async validateRecommendationSafety(
    recommendations: string[],
    factors: PersonalizationFactors
  ): Promise<SafetyValidationResult> {
    const safe_recommendations: string[] = [];
    const flagged_recommendations: Array<{
      recommendation: string;
      concerns: string[];
      severity: "low" | "medium" | "high";
    }> = [];
    const alternative_suggestions: string[] = [];

    for (const recommendation of recommendations) {
      const safety_check = this.checkRecommendationSafety(recommendation, factors);

      if (safety_check.is_safe) {
        safe_recommendations.push(recommendation);
      } else {
        flagged_recommendations.push({
          recommendation,
          concerns: safety_check.concerns,
          severity: safety_check.severity,
        });

        // Generate alternatives for flagged recommendations
        if (this.config.enableDietaryModification) {
          const alternatives = this.generateAlternativeRecommendations(
            recommendation,
            factors,
            safety_check.concerns
          );
          alternative_suggestions.push(...alternatives);
        }
      }
    }

    return {
      safe_recommendations,
      flagged_recommendations,
      alternative_suggestions: alternative_suggestions.slice(0, this.config.maxAlternativeSuggestions),
    };
  }

  /**
   * Update learning profile from user feedback
   */
  async updateLearningProfile(
    userId: string,
    feedback: FeedbackData
  ): Promise<void> {
    if (!this.config.enableLearningFromFeedback) {
      return;
    }

    try {
      await this.learningManager.updateLearningProfile(userId, feedback);
      devLog("info", this.context, "Updated learning profile", { userId, feedback });
    } catch (error) {
      logError(this.context, "Failed to update learning profile", { error, userId });
    }
  }

  /**
   * Get optimal explanation complexity level for user
   */
  getOptimalExplanationLevel(
    factors: PersonalizationFactors
  ): "basic" | "intermediate" | "advanced" {
    const { user_profile, health_history } = factors;

    // Consider user's role and experience
    if (user_profile.role === "doctor") return "advanced";

    // Consider previous diagnosis count as experience indicator
    const experience_level = health_history.previous_diagnoses.length;

    if (experience_level >= 5) return "advanced";
    if (experience_level >= 2) return "intermediate";
    return "basic";
  }

  /**
   * Get personalized communication style
   */
  async getPersonalizedCommunicationStyle(
    userId: string,
    factors: PersonalizationFactors
  ): Promise<{
    style: "direct" | "indirect" | "contextual";
    complexity: "basic" | "intermediate" | "advanced";
    preferences: string[];
  }> {
    // Get learned preferences
    const communication_prefs = this.learningManager.getOptimalCommunicationStyle(userId);
    
    // Get cultural preferences
    const cultural_style = this.culturalBuilder.getCulturalCommunicationStyle(
      factors.cultural_context
    );

    // Combine learned and cultural preferences
    return {
      style: cultural_style.style,
      complexity: communication_prefs.complexity_level as any,
      preferences: [
        ...cultural_style.preferences,
        ...communication_prefs.effective_types
      ]
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<PersonalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logInfo(this.context, "Configuration updated", { config: this.config });
  }

  /**
   * Get system statistics
   */
  getSystemStatistics(): {
    total_profiles: number;
    learning_trends: ReturnType<LearningProfileManager["analyzeLearningTrends"]>;
    configuration: PersonalizationConfig;
  } {
    return {
      total_profiles: 0, // Would need to track this
      learning_trends: this.learningManager.analyzeLearningTrends(),
      configuration: this.config
    };
  }

  // Private helper methods

  private buildDietaryRestrictions(
    dietary_preferences?: any
  ): PersonalizationFactors["dietary_restrictions"] {
    return {
      allergies: dietary_preferences?.allergies || [],
      dietary_type: dietary_preferences?.dietary_type || "no_restrictions",
      disliked_foods: dietary_preferences?.disliked_foods || [],
      religious_restrictions: [], // Could be added to dietary preferences
    };
  }

  private determineUserPreferences(
    profile: UserProfile,
    sessions: DiagnosisSession[]
  ): PersonalizationFactors["preferences"] {
    // Analyze user behavior patterns from sessions to determine preferences
    const session_count = sessions.length;

    return {
      communication_style: session_count > 3 ? "detailed" : "concise",
      explanation_level: profile.role === "doctor" ? "advanced" : "intermediate",
      recommendation_focus: "balanced", // Could be learned from user interactions
    };
  }

  private checkRecommendationSafety(
    recommendation: string,
    factors: PersonalizationFactors
  ): {
    is_safe: boolean;
    concerns: string[];
    severity: "low" | "medium" | "high";
  } {
    const concerns: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    // Check for allergy conflicts
    for (const allergy of factors.dietary_restrictions.allergies) {
      if (recommendation.toLowerCase().includes(allergy.toLowerCase())) {
        concerns.push(`Contains ${allergy} which user is allergic to`);
        severity = "high";
      }
    }

    // Check for dietary type conflicts
    const dietary_type = factors.dietary_restrictions.dietary_type;
    if (
      dietary_type === "vegetarian" &&
      /meat|fish|chicken|beef|pork|seafood/i.test(recommendation)
    ) {
      concerns.push("Contains animal products but user is vegetarian");
      severity = severity === "high" ? "high" : "medium";
    }

    return {
      is_safe: concerns.length === 0,
      concerns,
      severity,
    };
  }

  private generateAlternativeRecommendations(
    original: string,
    factors: PersonalizationFactors,
    concerns: string[]
  ): string[] {
    const alternatives: string[] = [];

    // Generate alternatives based on concerns
    for (const concern of concerns) {
      if (concern.includes("allergic to")) {
        const allergy = concern.match(/allergic to (\w+)/)?.[1];
        if (allergy) {
          const alternative_foods = this.dietaryAdapter.generateAlternativeFoods(
            allergy,
            "therapeutic",
            factors
          );
          alternatives.push(...alternative_foods.slice(0, 2));
        }
      }
    }

    return alternatives;
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultPersonalizationEngine = new PersonalizationEngine("DefaultPersonalization");

/**
 * Convenience function to get personalized recommendations
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
  const engine = defaultPersonalizationEngine;
  const factors = await engine.getPersonalizationFactors(userId);

  const dietary = originalRecommendations.dietary
    ? await engine.personalizeDietaryRecommendations(originalRecommendations.dietary, factors)
    : [];

  const lifestyle = originalRecommendations.lifestyle
    ? await engine.personalizeLifestyleRecommendations(originalRecommendations.lifestyle, factors)
    : [];

  // Combine all recommendations for safety check
  const all_recommendations = [
    ...(originalRecommendations.dietary || []),
    ...(originalRecommendations.lifestyle || []),
    ...(originalRecommendations.herbal || []),
  ];

  const safety_check = await engine.validateRecommendationSafety(all_recommendations, factors);

  return {
    dietary,
    lifestyle,
    safety_check,
  };
}