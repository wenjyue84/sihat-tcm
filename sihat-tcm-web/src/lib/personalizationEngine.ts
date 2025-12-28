/**
 * Personalization Engine - Legacy compatibility layer
 * 
 * This file maintains backward compatibility while delegating to the new modular architecture.
 * New code should use the modular components directly from ./personalization/ directory.
 * 
 * @deprecated Use PersonalizationEngine from ./personalization/PersonalizationEngine.ts instead
 */

import { PersonalizationEngine } from "./personalization/PersonalizationEngine";
import { 
  getPersonalizedRecommendations as getPersonalizedRecommendationsNew,
  defaultPersonalizationEngine
} from "./personalization";
import { 
  PersonalizationFactors, 
  PersonalizedRecommendation,
  TreatmentOutcome,
  UserProfile,
  CulturalContext,
  LearningProfile
} from "./personalization/interfaces/PersonalizationInterfaces";
import { DietaryPreferences } from "@/app/actions/meal-planner";
import { DiagnosisReport, DiagnosisSession } from "@/types/database";

// Re-export types for backward compatibility
export type {
  PersonalizationFactors,
  PersonalizedRecommendation,
  TreatmentOutcome,
  UserProfile,
  CulturalContext,
  LearningProfile
};

// Re-export main class
export { PersonalizationEngine };

// Legacy exports - use new modular approach instead
export const getPersonalizedRecommendations = getPersonalizedRecommendationsNew;
export { defaultPersonalizationEngine };

/**
 * @deprecated Use PersonalizationEngine from ./personalization/PersonalizationEngine.ts
 */
export class LegacyPersonalizationEngine extends PersonalizationEngine {
  constructor(context: string = "LegacyPersonalizationEngine") {
    super(context);
    console.warn("LegacyPersonalizationEngine is deprecated. Use PersonalizationEngine from ./personalization/PersonalizationEngine.ts instead");
  }
}
