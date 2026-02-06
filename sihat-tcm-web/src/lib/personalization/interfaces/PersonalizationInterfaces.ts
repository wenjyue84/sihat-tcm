/**
 * Personalization Interfaces - Core type definitions for personalization system
 *
 * Defines all interfaces and types used throughout the personalization engine
 * for consistent type safety and clear contracts between components.
 */

import { DietaryPreferences } from "@/app/actions/meal-planner";
import { DiagnosisReport, DiagnosisSession } from "@/types/database";

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

export interface SafetyValidationResult {
  safe_recommendations: string[];
  flagged_recommendations: Array<{
    recommendation: string;
    concerns: string[];
    severity: "low" | "medium" | "high";
  }>;
  alternative_suggestions: string[];
}

export interface PersonalizationConfig {
  enableCulturalAdaptation: boolean;
  enableDietaryModification: boolean;
  enableLearningFromFeedback: boolean;
  maxAlternativeSuggestions: number;
  confidenceThreshold: number;
}

export interface FeedbackData {
  recommendations_followed: string[];
  effectiveness_ratings: Record<string, number>;
  side_effects?: string[];
  preferences_changed?: Record<string, any>;
}
