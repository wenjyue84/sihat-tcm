/**
 * Personalization System - Main exports
 * 
 * Provides clean, organized exports for the entire personalization system.
 * Use this file to import personalization components throughout the application.
 */

// Main personalization engine
export { PersonalizationEngine, defaultPersonalizationEngine } from './PersonalizationEngine';

// Core components
export { CulturalContextBuilder } from './core/CulturalContextBuilder';
export { HealthHistoryAnalyzer } from './core/HealthHistoryAnalyzer';

// Adapters
export { DietaryRecommendationAdapter } from './adapters/DietaryRecommendationAdapter';
export { LifestyleRecommendationAdapter } from './adapters/LifestyleRecommendationAdapter';

// Learning system
export { LearningProfileManager } from './learning/LearningProfileManager';

// Interfaces and types
export type {
  UserProfile,
  UserPreferences,
  CulturalContext,
  PersonalizationFactors,
  TreatmentOutcome,
  PersonalizedRecommendation,
  LearningProfile,
  SafetyValidationResult,
  PersonalizationConfig,
  FeedbackData
} from './interfaces/PersonalizationInterfaces';

// Convenience functions
export { getPersonalizedRecommendations } from './PersonalizationEngine';

// Re-export for backward compatibility
export {
  PersonalizationEngine as PersonalizationEngineClass,
  defaultPersonalizationEngine as personalizationEngine
} from './PersonalizationEngine';