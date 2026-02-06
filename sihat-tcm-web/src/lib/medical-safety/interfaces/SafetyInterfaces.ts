/**
 * Medical Safety Interfaces
 *
 * Comprehensive type definitions for medical safety validation system.
 * Defines all interfaces, types, and enums used across safety components.
 */

import { DietaryPreferences } from "@/app/actions/meal-planner";
import { DiagnosisReport } from "@/types/database";

/**
 * Medical history interface for safety validation
 */
export interface MedicalHistory {
  current_medications: string[];
  allergies: string[];
  medical_conditions: string[];
  previous_surgeries?: string[];
  family_history?: string[];
  pregnancy_status?: "pregnant" | "breastfeeding" | "trying_to_conceive" | "none";
  age?: number;
  weight?: number;
  height?: number;
}

/**
 * Comprehensive safety validation result
 */
export interface SafetyValidationResult {
  is_safe: boolean;
  risk_level: "low" | "medium" | "high" | "critical";
  concerns: SafetyConcern[];
  recommendations: string[];
  emergency_flags: EmergencyFlag[];
  contraindications: Contraindication[];
  drug_interactions: DrugInteraction[];
  alternative_suggestions: string[];
}

/**
 * Individual safety concern
 */
export interface SafetyConcern {
  type:
    | "allergy"
    | "drug_interaction"
    | "contraindication"
    | "dosage"
    | "pregnancy"
    | "age_related"
    | "condition_specific";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affected_recommendation: string;
  evidence_level: "clinical_study" | "case_report" | "theoretical" | "traditional_knowledge";
  action_required:
    | "monitor"
    | "modify_dosage"
    | "avoid_completely"
    | "seek_medical_advice"
    | "emergency_care";
}

/**
 * Emergency condition flag
 */
export interface EmergencyFlag {
  condition: string;
  symptoms: string[];
  urgency: "immediate" | "urgent" | "semi_urgent";
  recommended_action: string;
  emergency_contacts?: string[];
}

/**
 * Contraindication information
 */
export interface Contraindication {
  substance: string;
  condition: string;
  reason: string;
  severity: "absolute" | "relative";
  alternative_options: string[];
}

/**
 * Drug-herb interaction details
 */
export interface DrugInteraction {
  herb_or_food: string;
  medication: string;
  interaction_type: "synergistic" | "antagonistic" | "toxic" | "absorption_interference";
  severity: "minor" | "moderate" | "major" | "severe";
  mechanism: string;
  clinical_significance: string;
  management: string;
}

/**
 * Validation context for safety checks
 */
export interface ValidationContext {
  medical_history: MedicalHistory;
  dietary_preferences?: DietaryPreferences;
  diagnosis_report?: DiagnosisReport;
  user_age?: number;
  user_gender?: string;
  language?: "en" | "zh" | "ms";
}

/**
 * Recommendations structure for validation
 */
export interface RecommendationsToValidate {
  dietary?: string[];
  herbal?: string[];
  lifestyle?: string[];
  acupressure?: string[];
}

/**
 * Safety guidelines response
 */
export interface SafetyGuidelines {
  guidelines: string[];
  warnings: string[];
  emergency_signs: string[];
  when_to_seek_help: string[];
}

/**
 * Allergy check result
 */
export interface AllergyCheckResult {
  concerns: SafetyConcern[];
}

/**
 * Drug interaction check result
 */
export interface DrugInteractionCheckResult {
  concerns: SafetyConcern[];
  interactions: DrugInteraction[];
}

/**
 * Contraindication check result
 */
export interface ContraindicationCheckResult {
  concerns: SafetyConcern[];
  contraindications: Contraindication[];
}

/**
 * Emergency condition check result
 */
export interface EmergencyCheckResult {
  concerns: SafetyConcern[];
  emergency_flags: EmergencyFlag[];
}

/**
 * Pregnancy safety check result
 */
export interface PregnancyCheckResult {
  concerns: SafetyConcern[];
}

/**
 * Age appropriateness check result
 */
export interface AgeCheckResult {
  concerns: SafetyConcern[];
}

/**
 * Risk level type
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Severity level type
 */
export type SeverityLevel = "low" | "medium" | "high" | "critical";

/**
 * Action required type
 */
export type ActionRequired =
  | "monitor"
  | "modify_dosage"
  | "avoid_completely"
  | "seek_medical_advice"
  | "emergency_care";

/**
 * Evidence level type
 */
export type EvidenceLevel =
  | "clinical_study"
  | "case_report"
  | "theoretical"
  | "traditional_knowledge";

/**
 * Language support type
 */
export type SupportedLanguage = "en" | "zh" | "ms";
