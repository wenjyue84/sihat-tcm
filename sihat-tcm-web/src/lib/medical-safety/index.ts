/**
 * Medical Safety System - Main Export
 *
 * Provides a unified interface for all medical safety validation functionality.
 * This is the new modular approach to medical safety validation.
 */

// Core components
export { SafetyValidator } from "./core/SafetyValidator";
export { AllergyChecker } from "./core/AllergyChecker";
export { DrugInteractionAnalyzer } from "./core/DrugInteractionAnalyzer";
export { ContraindicationChecker } from "./core/ContraindicationChecker";
export { EmergencyDetector } from "./core/EmergencyDetector";

// Interfaces and types
export type {
  MedicalHistory,
  SafetyValidationResult,
  SafetyConcern,
  EmergencyFlag,
  Contraindication,
  DrugInteraction,
  ValidationContext,
  RecommendationsToValidate,
  SafetyGuidelines,
  AllergyCheckResult,
  DrugInteractionCheckResult,
  ContraindicationCheckResult,
  EmergencyCheckResult,
  PregnancyCheckResult,
  AgeCheckResult,
  RiskLevel,
  SeverityLevel,
  ActionRequired,
  EvidenceLevel,
  SupportedLanguage,
} from "./interfaces/SafetyInterfaces";

// Create default instances
import { SafetyValidator } from "./core/SafetyValidator";

/**
 * Default safety validator instance
 */
export const defaultSafetyValidator = new SafetyValidator("DefaultSafetyValidator");

/**
 * Create a new safety validator instance
 */
export function createSafetyValidator(context?: string): SafetyValidator {
  return new SafetyValidator(context);
}

/**
 * Convenience function to validate medical safety
 */
export async function validateMedicalSafety(
  recommendations: RecommendationsToValidate,
  context: ValidationContext
): Promise<SafetyValidationResult> {
  return defaultSafetyValidator.validateRecommendations(recommendations, context);
}

/**
 * Quick emergency symptom check
 */
export async function checkEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
  return defaultSafetyValidator.checkEmergencySymptoms(symptoms);
}

/**
 * Check specific drug-herb interaction
 */
export async function checkDrugHerbInteraction(
  herb: string,
  medication: string
): Promise<DrugInteraction | null> {
  return defaultSafetyValidator.checkSpecificInteraction(herb, medication);
}

/**
 * Get safety guidelines for condition
 */
export async function getSafetyGuidelines(
  condition: string,
  language?: SupportedLanguage
): Promise<SafetyGuidelines> {
  return defaultSafetyValidator.getSafetyGuidelines(condition, language);
}

// Re-export interfaces for convenience
import type {
  SafetyValidationResult,
  ValidationContext,
  RecommendationsToValidate,
  EmergencyFlag,
  DrugInteraction,
  SafetyGuidelines,
  SupportedLanguage,
} from "./interfaces/SafetyInterfaces";
