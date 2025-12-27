/**
 * Personalization Engine - AI-powered personalization for TCM recommendations
 *
 * This module provides intelligent personalization based on user preferences,
 * cultural context, dietary restrictions, and historical treatment outcomes.
 */

import { DietaryPreferences } from "@/app/actions/meal-planner";
import { DiagnosisReport, DiagnosisSession } from "@/types/database";
import { devLog, logError, logInfo } from "./systemLogger";
import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  full_name?: string;
  preferred_language?: "en" | "zh" | "ms";
  dietary_preferences?: DietaryPreferences;
  preferences?: UserPreferences;
  role?: "patient" | "doctor" | "admin" | "developer";
}

export interface UserPreferences {
  language?: string;
  developer_mode?: boolean;
  dashboard_settings?: Record<string, any>;
  ui_preferences?: {
    theme?: "light" | "dark" | "auto";
    compact_mode?: boolean;
    show_advanced_options?: boolean;
  };
}

export interface CulturalContext {
  language: "en" | "zh" | "ms";
  region: "western" | "chinese" | "southeast_asian";
  food_culture: {
    staple_foods: string[];
    common_ingredients: string[];
    cooking_methods: string[];
    meal_patterns: string[];
  };
  health_beliefs: {
    traditional_medicine_acceptance: "high" | "medium" | "low";
    dietary_therapy_familiarity: "high" | "medium" | "low";
    lifestyle_modification_openness: "high" | "medium" | "low";
  };
}

export interface PersonalizationFactors {
  user_profile: UserProfile;
  cultural_context: CulturalContext;
  dietary_restrictions: {
    allergies: string[];
    dietary_type: string;
    disliked_foods: string[];
    religious_restrictions?: string[];
  };
  health_history: {
    previous_diagnoses: string[];
    treatment_outcomes: TreatmentOutcome[];
    constitution_patterns: string[];
    seasonal_variations: Record<string, any>;
  };
  preferences: {
    communication_style: "detailed" | "concise" | "visual";
    explanation_level: "basic" | "intermediate" | "advanced";
    recommendation_focus: "dietary" | "lifestyle" | "herbal" | "balanced";
  };
}

export interface TreatmentOutcome {
  diagnosis: string;
  recommendations_followed: string[];
  effectiveness_rating: number; // 1-5 scale
  side_effects?: string[];
  duration_followed: number; // days
  notes?: string;
  timestamp: Date;
}

export interface PersonalizedRecommendation {
  original_recommendation: string;
  personalized_version: string;
  personalization_factors: string[];
  cultural_adaptations: string[];
  dietary_modifications: string[];
  confidence_score: number;
  reasoning: string;
}

export interface LearningProfile {
  user_id: string;
  preference_weights: Record<string, number>;
  successful_patterns: string[];
  avoided_recommendations: string[];
  response_patterns: {
    preferred_communication_style: string;
    effective_recommendation_types: string[];
    optimal_complexity_level: string;
  };
  last_updated: Date;
}

/**
 * Personalization Engine class for tailored TCM recommendations
 */
export class PersonalizationEngine {
  private context: string;
  private learningProfiles: Map<string, LearningProfile> = new Map();

  constructor(context: string = "PersonalizationEngine") {
    this.context = context;
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

      // Build cultural context
      const cultural_context = this.buildCulturalContext(profile.preferred_language || "en");

      // Extract health history
      const health_history = this.extractHealthHistory(sessions || []);

      // Build dietary restrictions
      const dietary_restrictions = this.buildDietaryRestrictions(profile.dietary_preferences);

      // Determine user preferences
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
   * Personalize dietary recommendations based on user factors
   */
  async personalizeDietaryRecommendations(
    originalRecommendations: string[],
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation[]> {
    const personalized: PersonalizedRecommendation[] = [];

    for (const recommendation of originalRecommendations) {
      try {
        const personalized_version = await this.adaptDietaryRecommendation(recommendation, factors);

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
    const personalized: PersonalizedRecommendation[] = [];

    for (const recommendation of originalRecommendations) {
      const adaptations = this.adaptLifestyleRecommendation(recommendation, factors);
      personalized.push(adaptations);
    }

    return personalized;
  }

  /**
   * Check for contraindications and safety concerns
   */
  async validateRecommendationSafety(
    recommendations: string[],
    factors: PersonalizationFactors
  ): Promise<{
    safe_recommendations: string[];
    flagged_recommendations: Array<{
      recommendation: string;
      concerns: string[];
      severity: "low" | "medium" | "high";
    }>;
    alternative_suggestions: string[];
  }> {
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
        const alternatives = this.generateAlternativeRecommendations(
          recommendation,
          factors,
          safety_check.concerns
        );
        alternative_suggestions.push(...alternatives);
      }
    }

    return {
      safe_recommendations,
      flagged_recommendations,
      alternative_suggestions,
    };
  }

  /**
   * Learn from user feedback and treatment outcomes
   */
  async updateLearningProfile(
    userId: string,
    feedback: {
      recommendations_followed: string[];
      effectiveness_ratings: Record<string, number>;
      side_effects?: string[];
      preferences_changed?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      let learning_profile = this.learningProfiles.get(userId);

      if (!learning_profile) {
        learning_profile = {
          user_id: userId,
          preference_weights: {},
          successful_patterns: [],
          avoided_recommendations: [],
          response_patterns: {
            preferred_communication_style: "balanced",
            effective_recommendation_types: [],
            optimal_complexity_level: "intermediate",
          },
          last_updated: new Date(),
        };
      }

      // Update preference weights based on effectiveness ratings
      for (const [recommendation, rating] of Object.entries(feedback.effectiveness_ratings)) {
        const category = this.categorizeRecommendation(recommendation);
        learning_profile.preference_weights[category] =
          (learning_profile.preference_weights[category] || 0) + (rating - 3) * 0.1;
      }

      // Track successful patterns
      const highly_rated = Object.entries(feedback.effectiveness_ratings)
        .filter(([_, rating]) => rating >= 4)
        .map(([rec, _]) => rec);

      learning_profile.successful_patterns.push(...highly_rated);

      // Track avoided recommendations
      const poorly_rated = Object.entries(feedback.effectiveness_ratings)
        .filter(([_, rating]) => rating <= 2)
        .map(([rec, _]) => rec);

      learning_profile.avoided_recommendations.push(...poorly_rated);

      learning_profile.last_updated = new Date();
      this.learningProfiles.set(userId, learning_profile);

      devLog("info", this.context, "Updated learning profile", { userId, feedback });
    } catch (error) {
      logError(this.context, "Failed to update learning profile", { error, userId });
    }
  }

  /**
   * Get personalized explanation complexity level
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

  // Private helper methods

  private buildCulturalContext(language: string): CulturalContext {
    const cultural_mappings: Record<string, Partial<CulturalContext>> = {
      zh: {
        region: "chinese",
        food_culture: {
          staple_foods: ["rice", "noodles", "congee", "steamed buns"],
          common_ingredients: ["ginger", "garlic", "soy sauce", "sesame oil", "green onions"],
          cooking_methods: ["stir-frying", "steaming", "braising", "soup-making"],
          meal_patterns: ["warm breakfast", "balanced lunch", "light dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "high",
          dietary_therapy_familiarity: "high",
          lifestyle_modification_openness: "high",
        },
      },
      ms: {
        region: "southeast_asian",
        food_culture: {
          staple_foods: ["rice", "noodles", "bread", "coconut rice"],
          common_ingredients: ["coconut milk", "chili", "lemongrass", "turmeric", "pandan"],
          cooking_methods: ["grilling", "curry-making", "stir-frying", "steaming"],
          meal_patterns: ["hearty breakfast", "main lunch", "family dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "medium",
          dietary_therapy_familiarity: "medium",
          lifestyle_modification_openness: "medium",
        },
      },
      en: {
        region: "western",
        food_culture: {
          staple_foods: ["bread", "pasta", "rice", "potatoes"],
          common_ingredients: ["olive oil", "herbs", "garlic", "onions", "tomatoes"],
          cooking_methods: ["baking", "grilling", "sautéing", "roasting"],
          meal_patterns: ["light breakfast", "lunch", "main dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "low",
          dietary_therapy_familiarity: "low",
          lifestyle_modification_openness: "medium",
        },
      },
    };

    const base_context = cultural_mappings[language] || cultural_mappings["en"];

    return {
      language: language as "en" | "zh" | "ms",
      region: base_context.region || "western",
      food_culture: base_context.food_culture || cultural_mappings["en"].food_culture!,
      health_beliefs: base_context.health_beliefs || cultural_mappings["en"].health_beliefs!,
    };
  }

  private extractHealthHistory(
    sessions: DiagnosisSession[]
  ): PersonalizationFactors["health_history"] {
    const previous_diagnoses = sessions.map((s) => s.primary_diagnosis).filter(Boolean);
    const constitution_patterns = sessions.map((s) => s.constitution).filter(Boolean) as string[];

    // Extract treatment outcomes from session notes and reports
    const treatment_outcomes: TreatmentOutcome[] = sessions.map((session) => ({
      diagnosis: session.primary_diagnosis,
      recommendations_followed: [], // Would need to be tracked separately
      effectiveness_rating: session.overall_score || 3,
      duration_followed: 0, // Would need to be tracked separately
      timestamp: new Date(session.created_at),
    }));

    return {
      previous_diagnoses,
      treatment_outcomes,
      constitution_patterns,
      seasonal_variations: {}, // Would need seasonal analysis
    };
  }

  private buildDietaryRestrictions(
    dietary_preferences?: DietaryPreferences
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

  private async adaptDietaryRecommendation(
    recommendation: string,
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation> {
    const personalization_factors: string[] = [];
    const cultural_adaptations: string[] = [];
    const dietary_modifications: string[] = [];
    let personalized_version = recommendation;
    let confidence_score = 1.0;

    // Check for allergies and dietary restrictions
    for (const allergy of factors.dietary_restrictions.allergies) {
      if (recommendation.toLowerCase().includes(allergy.toLowerCase())) {
        const alternative = this.findAllergyAlternative(allergy, recommendation);
        personalized_version = personalized_version.replace(new RegExp(allergy, "gi"), alternative);
        dietary_modifications.push(`Replaced ${allergy} with ${alternative} due to allergy`);
        confidence_score -= 0.1;
      }
    }

    // Adapt to cultural food preferences
    const cultural_adaptations_made = this.adaptToCulturalFoodPreferences(
      personalized_version,
      factors.cultural_context
    );

    if (cultural_adaptations_made.adapted_text !== personalized_version) {
      personalized_version = cultural_adaptations_made.adapted_text;
      cultural_adaptations.push(...cultural_adaptations_made.adaptations);
      personalization_factors.push("cultural_food_preferences");
    }

    // Check disliked foods
    for (const disliked of factors.dietary_restrictions.disliked_foods) {
      if (recommendation.toLowerCase().includes(disliked.toLowerCase())) {
        const alternative = this.findFoodAlternative(disliked, recommendation);
        personalized_version = personalized_version.replace(
          new RegExp(disliked, "gi"),
          alternative
        );
        dietary_modifications.push(`Replaced ${disliked} with ${alternative} based on preferences`);
        confidence_score -= 0.05;
      }
    }

    return {
      original_recommendation: recommendation,
      personalized_version,
      personalization_factors,
      cultural_adaptations,
      dietary_modifications,
      confidence_score: Math.max(0.3, confidence_score),
      reasoning: `Adapted for ${factors.cultural_context.language} cultural context and dietary restrictions`,
    };
  }

  private adaptLifestyleRecommendation(
    recommendation: string,
    factors: PersonalizationFactors
  ): PersonalizedRecommendation {
    const personalization_factors: string[] = [];
    const cultural_adaptations: string[] = [];
    let personalized_version = recommendation;

    // Adapt exercise recommendations to cultural context
    if (
      recommendation.toLowerCase().includes("exercise") ||
      recommendation.toLowerCase().includes("physical activity")
    ) {
      const cultural_exercises = this.getCulturallyAppropriateExercises(factors.cultural_context);
      personalized_version += ` Consider ${cultural_exercises.join(", ")} which are popular in your region.`;
      cultural_adaptations.push("Added culturally appropriate exercise suggestions");
      personalization_factors.push("cultural_exercise_preferences");
    }

    return {
      original_recommendation: recommendation,
      personalized_version,
      personalization_factors,
      cultural_adaptations,
      dietary_modifications: [],
      confidence_score: 0.9,
      reasoning: "Adapted lifestyle recommendation for cultural context",
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
          const alternative = this.findAllergyAlternative(allergy, original);
          alternatives.push(original.replace(allergy, alternative));
        }
      }
    }

    return alternatives;
  }

  private findAllergyAlternative(allergy: string, context: string): string {
    const alternatives: Record<string, string> = {
      nuts: "seeds",
      dairy: "plant-based alternatives",
      eggs: "tofu or flax eggs",
      shellfish: "fish or plant protein",
      soy: "other legumes",
      gluten: "gluten-free grains",
    };

    return alternatives[allergy.toLowerCase()] || "suitable alternative";
  }

  private findFoodAlternative(disliked: string, context: string): string {
    const alternatives: Record<string, string> = {
      "bitter melon": "cucumber or zucchini",
      cilantro: "parsley or green onions",
      liver: "lean meat or legumes",
      ginger: "mild spices",
      spicy: "mild herbs",
    };

    return alternatives[disliked.toLowerCase()] || "preferred alternative";
  }

  private adaptToCulturalFoodPreferences(
    text: string,
    cultural_context: CulturalContext
  ): { adapted_text: string; adaptations: string[] } {
    let adapted_text = text;
    const adaptations: string[] = [];

    // Add cultural staples as examples
    if (text.includes("grains") || text.includes("carbohydrates")) {
      const staples = cultural_context.food_culture.staple_foods.slice(0, 2).join(" or ");
      adapted_text += ` (such as ${staples})`;
      adaptations.push(`Added culturally familiar staples: ${staples}`);
    }

    return { adapted_text, adaptations };
  }

  private getCulturallyAppropriateExercises(cultural_context: CulturalContext): string[] {
    const exercise_mappings: Record<string, string[]> = {
      chinese: ["Tai Chi", "Qigong", "walking meditation", "morning exercises in parks"],
      southeast_asian: ["badminton", "walking", "traditional dance", "group exercises"],
      western: ["jogging", "gym workouts", "yoga", "cycling"],
    };

    return exercise_mappings[cultural_context.region] || exercise_mappings["western"];
  }

  private categorizeRecommendation(recommendation: string): string {
    if (/food|eat|diet|meal/i.test(recommendation)) return "dietary";
    if (/exercise|activity|movement/i.test(recommendation)) return "lifestyle";
    if (/herb|medicine|formula/i.test(recommendation)) return "herbal";
    if (/sleep|rest|stress/i.test(recommendation)) return "wellness";
    return "general";
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
  safety_check: Awaited<ReturnType<PersonalizationEngine["validateRecommendationSafety"]>>;
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
