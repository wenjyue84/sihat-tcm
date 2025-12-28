/**
 * Medical Safety Interfaces - Core type definitions for safety validation system
 * 
 * Defines all interfaces and types used throughout the medical safety validation
 * system for consistent type safety and clear contracts between components.
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

export interface EmergencyFlag {
  condition: string;
  symptoms: string[];
  urgency: "immediate" | "urgent" | "semi_urgent";
  recommended_action: string;
  emergency_contacts?: string[];
}

export interface Contraindication {
  substance: string;
  condition: string;
  reason: string;
  severity: "absolute" | "relative";
  alternative_options: string[];
}

export interface DrugInteraction {
  herb_or_food: string;
  medication: string;
  interaction_type: "synergistic" | "antagonistic" | "toxic" | "absorption_interference";
  severity: "minor" | "moderate" | "major" | "severe";
  mechanism: string;
  clinical_significance: string;
  management: string;
}

export interface ValidationContext {
  medical_history: MedicalHistory;
  dietary_preferences?: DietaryPreferences;
  diagnosis_report?: DiagnosisReport;
  user_age?: number;
  user_gender?: string;
  language?: "en" | "zh" | "ms";
}

export interface SafetyValidationConfig {
  enableAllergyChecking: boolean;
  enableDrugInteractionAnalysis: boolean;
  enableContraindicationChecking: boolean;
  enableEmergencyDetection: boolean;
  enablePregnancySafety: boolean;
  enableAgeAppropriateChecking: boolean;
  maxAlternativeSuggestions: number;
  conservativeMode: boolean;
}

export interface InteractionAnalysisRequest {
  herb: string;
  medication: string;
  context?: ValidationContext;
}

export interface InteractionAnalysisResponse {
  has_interaction: boolean;
  interaction_type: "synergistic" | "antagonistic" | "toxic" | "absorption_interference";
  severity: "minor" | "moderate" | "major" | "severe";
  mechanism: string;
  clinical_significance: string;
  management: string;
  evidence_level: "clinical_study" | "case_report" | "theoretical" | "traditional_knowledge";
}