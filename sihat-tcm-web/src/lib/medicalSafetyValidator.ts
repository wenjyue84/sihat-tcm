/**
 * Medical Safety Validator - Legacy Wrapper
 *
 * @deprecated This file is maintained for backward compatibility.
 * Use the new modular system: import { SafetyValidator } from './medical-safety'
 *
 * The new system provides:
 * - Modular architecture with focused components
 * - Better separation of concerns
 * - Enhanced testing capabilities
 * - Improved maintainability
 */

import {
  SafetyValidator as ModularSafetyValidator,
  defaultSafetyValidator,
  validateMedicalSafety as validateMedicalSafetyModular,
  checkEmergencySymptoms as checkEmergencySymptomsModular,
  type SafetyValidationResult,
  type ValidationContext,
  type RecommendationsToValidate,
  type MedicalHistory,
  type SafetyConcern,
  type EmergencyFlag,
  type Contraindication,
  type DrugInteraction,
} from "./medical-safety";

import { DietaryPreferences } from "@/app/actions/meal-planner";
import { DiagnosisReport } from "@/types/database";

// Re-export types for backward compatibility
export type {
  MedicalHistory,
  SafetyValidationResult,
  SafetyConcern,
  EmergencyFlag,
  Contraindication,
  DrugInteraction,
  ValidationContext,
};

/**
 * @deprecated Use the new modular SafetyValidator from './medical-safety'
 */
export class MedicalSafetyValidator {
  private validator: ModularSafetyValidator;

  constructor(context: string = "MedicalSafetyValidator") {
    console.warn(
      "[MedicalSafetyValidator] Using deprecated API. Please migrate to the new modular system."
    );
    this.validator = new ModularSafetyValidator(`${context}_Legacy`);
  }

  /**
   * @deprecated Use validator.validateRecommendations() from the new modular system
   */
  async validateRecommendations(
    recommendations: {
      dietary?: string[];
      herbal?: string[];
      lifestyle?: string[];
      acupressure?: string[];
    },
    validationContext: ValidationContext
  ): Promise<SafetyValidationResult> {
    console.warn(
      "[MedicalSafetyValidator] Using deprecated API. Please migrate to the new modular system."
    );
    return await this.validator.validateRecommendations(recommendations, validationContext);
  }

  /**
   * @deprecated Use validator.checkSpecificInteraction() from the new modular system
   */
  async checkSpecificInteraction(
    herb: string,
    medication: string,
    context?: ValidationContext
  ): Promise<DrugInteraction | null> {
    console.warn(
      "[MedicalSafetyValidator] Using deprecated API. Please migrate to the new modular system."
    );
    return await this.validator.checkSpecificInteraction(herb, medication);
  }

  /**
   * @deprecated Use validator.checkEmergencySymptoms() from the new modular system
   */
  async validateEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
    console.warn(
      "[MedicalSafetyValidator] Using deprecated API. Please migrate to the new modular system."
    );
    return await this.validator.checkEmergencySymptoms(symptoms);
  }

  /**
   * @deprecated Use validator.getSafetyGuidelines() from the new modular system
   */
  async getSafetyGuidelines(
    condition: string,
    language: "en" | "zh" | "ms" = "en"
  ): Promise<{
    guidelines: string[];
    warnings: string[];
    emergency_signs: string[];
    when_to_seek_help: string[];
  }> {
    console.warn(
      "[MedicalSafetyValidator] Using deprecated API. Please migrate to the new modular system."
    );
    return await this.validator.getSafetyGuidelines(condition, language);
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultMedicalSafetyValidator = new MedicalSafetyValidator("DefaultSafetyValidator");

/**
 * Convenience function to validate recommendations
 * @deprecated Use validateMedicalSafety from './medical-safety'
 */
export async function validateMedicalSafety(
  recommendations: {
    dietary?: string[];
    herbal?: string[];
    lifestyle?: string[];
    acupressure?: string[];
  },
  context: ValidationContext
): Promise<SafetyValidationResult> {
  console.warn(
    "[validateMedicalSafety] Using deprecated API. Please migrate to the new modular system."
  );
  return validateMedicalSafetyModular(recommendations, context);
}

/**
 * Quick safety check for emergency symptoms
 * @deprecated Use checkEmergencySymptoms from './medical-safety'
 */
export async function checkEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
  console.warn(
    "[checkEmergencySymptoms] Using deprecated API. Please migrate to the new modular system."
  );
  return checkEmergencySymptomsModular(symptoms);
}
