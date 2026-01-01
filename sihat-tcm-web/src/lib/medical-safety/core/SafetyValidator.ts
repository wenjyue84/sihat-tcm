/**
 * Safety Validator
 * 
 * Main orchestrator for medical safety validation.
 * Coordinates all safety checking components and provides unified validation results.
 */

import { generateText } from "ai";
import { getGoogleProvider } from "../../googleProvider";
import { devLog, logError, logInfo } from "../../systemLogger";
import {
  SafetyValidationResult,
  SafetyConcern,
  ValidationContext,
  RecommendationsToValidate,
  SafetyGuidelines,
  SupportedLanguage,
  RiskLevel
} from "../interfaces/SafetyInterfaces";

import { AllergyChecker } from "./AllergyChecker";
import { DrugInteractionAnalyzer } from "./DrugInteractionAnalyzer";
import { ContraindicationChecker } from "./ContraindicationChecker";
import { EmergencyDetector } from "./EmergencyDetector";

export class SafetyValidator {
  private context: string;
  
  // Component instances
  private allergyChecker: AllergyChecker;
  private drugInteractionAnalyzer: DrugInteractionAnalyzer;
  private contraindicationChecker: ContraindicationChecker;
  private emergencyDetector: EmergencyDetector;

  constructor(context: string = "SafetyValidator") {
    this.context = context;
    
    // Initialize components
    this.allergyChecker = new AllergyChecker(`${context}/Allergy`);
    this.drugInteractionAnalyzer = new DrugInteractionAnalyzer(`${context}/DrugInteraction`);
    this.contraindicationChecker = new ContraindicationChecker(`${context}/Contraindication`);
    this.emergencyDetector = new EmergencyDetector(`${context}/Emergency`);
  }

  /**
   * Validate recommendations for safety
   */
  async validateRecommendations(
    recommendations: RecommendationsToValidate,
    validationContext: ValidationContext
  ): Promise<SafetyValidationResult> {
    try {
      devLog("info", this.context, "Starting comprehensive safety validation", {
        recommendationTypes: Object.keys(recommendations),
        hasHistory: Boolean(validationContext.medical_history)
      });

      const allRecommendations = this.flattenRecommendations(recommendations);

      // Parallel safety checks
      const [
        allergyResult,
        drugInteractionResult,
        contraindicationResult,
        emergencyResult,
        pregnancyResult,
        ageResult
      ] = await Promise.all([
        this.allergyChecker.checkAllergies(allRecommendations, validationContext),
        this.drugInteractionAnalyzer.checkDrugInteractions(
          recommendations.herbal || [],
          validationContext
        ),
        this.contraindicationChecker.checkContraindications(
          allRecommendations,
          validationContext
        ),
        this.emergencyDetector.detectEmergencyConditions(
          validationContext.diagnosis_report
        ),
        this.checkPregnancySafety(allRecommendations, validationContext),
        this.checkAgeAppropriate(allRecommendations, validationContext)
      ]);

      // Combine all concerns
      const allConcerns: SafetyConcern[] = [
        ...allergyResult.concerns,
        ...drugInteractionResult.concerns,
        ...contraindicationResult.concerns,
        ...emergencyResult.concerns,
        ...pregnancyResult.concerns,
        ...ageResult.concerns
      ];

      // Calculate overall risk and generate result
      const riskLevel = this.calculateOverallRisk(allConcerns);
      const safetyRecommendations = this.generateSafetyRecommendations(allConcerns);
      const alternatives = await this.generateAlternatives(
        allRecommendations,
        allConcerns,
        validationContext
      );

      const result: SafetyValidationResult = {
        is_safe: this.determineOverallSafety(riskLevel, allConcerns),
        risk_level: riskLevel,
        concerns: allConcerns,
        recommendations: safetyRecommendations,
        emergency_flags: emergencyResult.emergency_flags,
        contraindications: contraindicationResult.contraindications,
        drug_interactions: drugInteractionResult.interactions,
        alternative_suggestions: alternatives
      };

      logInfo(this.context, "Safety validation completed", {
        is_safe: result.is_safe,
        risk_level: result.risk_level,
        concern_count: allConcerns.length
      });

      return result;
    } catch (error) {
      logError(this.context, "Safety validation failed", { error });
      return this.createFailsafeResult();
    }
  }

  /**
   * Get safety guidelines for specific condition
   */
  async getSafetyGuidelines(
    condition: string,
    language: SupportedLanguage = "en"
  ): Promise<SafetyGuidelines> {
    try {
      const prompt = `
        Provide comprehensive safety guidelines for the TCM condition: "${condition}"
        
        Respond in ${language === "zh" ? "Chinese" : language === "ms" ? "Malay" : "English"} with JSON format:
        {
            "guidelines": ["safety guideline 1", "safety guideline 2", ...],
            "warnings": ["warning 1", "warning 2", ...],
            "emergency_signs": ["emergency sign 1", "emergency sign 2", ...],
            "when_to_seek_help": ["situation 1", "situation 2", ...]
        }

        Include:
        1. General safety precautions for this condition
        2. Specific warnings about treatments to avoid
        3. Emergency symptoms that require immediate medical attention
        4. Situations when professional medical help is needed
      `;

      const google = getGoogleProvider();
      const { text: responseText } = await generateText({
        model: google("gemini-2.5-pro"),
        messages: [{ role: "user", content: prompt }]
      });

      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      
      return JSON.parse(cleanText);
    } catch (error) {
      logError(this.context, "Failed to get safety guidelines", { error, condition });

      return {
        guidelines: [
          "Consult qualified TCM practitioner",
          "Follow prescribed treatments carefully"
        ],
        warnings: ["Do not self-medicate", "Inform healthcare providers of all treatments"],
        emergency_signs: ["Severe symptoms", "Sudden worsening", "Difficulty breathing"],
        when_to_seek_help: [
          "Symptoms worsen",
          "New concerning symptoms appear",
          "Uncertainty about treatment"
        ]
      };
    }
  }

  /**
   * Quick emergency symptom check
   */
  async checkEmergencySymptoms(symptoms: string[]): Promise<SafetyValidationResult["emergency_flags"]> {
    return await this.emergencyDetector.validateEmergencySymptoms(symptoms);
  }

  /**
   * Check specific drug-herb interaction
   */
  async checkSpecificInteraction(herb: string, medication: string): Promise<SafetyValidationResult["drug_interactions"][0] | null> {
    return await this.drugInteractionAnalyzer.analyzeSpecificInteraction(herb, medication);
  }

  /**
   * Flatten recommendations into single array
   */
  private flattenRecommendations(recommendations: RecommendationsToValidate): string[] {
    return [
      ...(recommendations.dietary || []),
      ...(recommendations.herbal || []),
      ...(recommendations.lifestyle || []),
      ...(recommendations.acupressure || [])
    ];
  }

  /**
   * Check pregnancy-specific safety
   */
  private async checkPregnancySafety(
    recommendations: string[],
    context: ValidationContext
  ): Promise<{ concerns: SafetyConcern[] }> {
    const concerns: SafetyConcern[] = [];

    if (
      context.medical_history.pregnancy_status === "pregnant" ||
      context.medical_history.pregnancy_status === "breastfeeding"
    ) {
      const pregnancyUnsafeKeywords = [
        "strong herbs",
        "blood-moving",
        "cold nature",
        "purgative",
        "stimulating"
      ];

      for (const keyword of pregnancyUnsafeKeywords) {
        for (const recommendation of recommendations) {
          if (recommendation.toLowerCase().includes(keyword)) {
            concerns.push({
              type: "pregnancy",
              severity: "medium",
              description: `Recommendation may not be suitable during pregnancy/breastfeeding`,
              affected_recommendation: recommendation,
              evidence_level: "traditional_knowledge",
              action_required: "seek_medical_advice"
            });
          }
        }
      }
    }

    return { concerns };
  }

  /**
   * Check age-appropriate recommendations
   */
  private async checkAgeAppropriate(
    recommendations: string[],
    context: ValidationContext
  ): Promise<{ concerns: SafetyConcern[] }> {
    const concerns: SafetyConcern[] = [];
    const age = context.user_age || context.medical_history.age;

    if (!age) return { concerns };

    if (age < 18) {
      // Pediatric considerations
      for (const recommendation of recommendations) {
        if (recommendation.includes("strong") || recommendation.includes("potent")) {
          concerns.push({
            type: "age_related",
            severity: "medium",
            description: "Strong herbs may not be appropriate for children",
            affected_recommendation: recommendation,
            evidence_level: "clinical_study",
            action_required: "seek_medical_advice"
          });
        }
      }
    } else if (age > 65) {
      // Geriatric considerations
      for (const recommendation of recommendations) {
        if (recommendation.includes("cold nature") || recommendation.includes("cooling")) {
          concerns.push({
            type: "age_related",
            severity: "low",
            description: "Cooling herbs should be used cautiously in elderly patients",
            affected_recommendation: recommendation,
            evidence_level: "traditional_knowledge",
            action_required: "monitor"
          });
        }
      }
    }

    return { concerns };
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(concerns: SafetyConcern[]): RiskLevel {
    if (concerns.some(c => c.severity === "critical")) return "critical";
    if (concerns.some(c => c.severity === "high")) return "high";
    if (concerns.some(c => c.severity === "medium")) return "medium";
    return "low";
  }

  /**
   * Determine overall safety
   */
  private determineOverallSafety(riskLevel: RiskLevel, concerns: SafetyConcern[]): boolean {
    return riskLevel !== "critical" && 
           concerns.filter(c => c.severity === "critical").length === 0;
  }

  /**
   * Generate safety recommendations
   */
  private generateSafetyRecommendations(concerns: SafetyConcern[]): string[] {
    const recommendations: string[] = [];

    if (concerns.some(c => c.action_required === "emergency_care")) {
      recommendations.push("Seek immediate emergency medical care");
    }

    if (concerns.some(c => c.action_required === "seek_medical_advice")) {
      recommendations.push("Consult healthcare provider before following recommendations");
    }

    if (concerns.some(c => c.action_required === "avoid_completely")) {
      recommendations.push("Avoid flagged substances completely");
    }

    if (concerns.some(c => c.action_required === "monitor")) {
      recommendations.push("Monitor for any adverse reactions");
    }

    if (concerns.some(c => c.action_required === "modify_dosage")) {
      recommendations.push("Consider dosage modifications under professional guidance");
    }

    return recommendations;
  }

  /**
   * Generate alternative recommendations
   */
  private async generateAlternatives(
    recommendations: string[],
    concerns: SafetyConcern[],
    context: ValidationContext
  ): Promise<string[]> {
    const alternatives: string[] = [];
    const flaggedRecommendations = concerns.map(c => c.affected_recommendation);

    for (const flagged of flaggedRecommendations) {
      if (flagged !== "all") {
        alternatives.push(
          `Safe alternative to ${flagged}: consult practitioner for suitable substitute`
        );
      }
    }

    return alternatives;
  }

  /**
   * Create failsafe result on system error
   */
  private createFailsafeResult(): SafetyValidationResult {
    return {
      is_safe: false,
      risk_level: "high",
      concerns: [{
        type: "condition_specific",
        severity: "high",
        description: "Safety validation system error - please consult healthcare provider",
        affected_recommendation: "all",
        evidence_level: "clinical_study",
        action_required: "seek_medical_advice"
      }],
      recommendations: ["Consult healthcare provider before following any recommendations"],
      emergency_flags: [],
      contraindications: [],
      drug_interactions: [],
      alternative_suggestions: []
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    allergy: ReturnType<AllergyChecker["getAllergenInfo"]>;
    drugInteraction: ReturnType<DrugInteractionAnalyzer["getInteractionStats"]>;
    contraindication: ReturnType<ContraindicationChecker["getContraindicationStats"]>;
    emergency: ReturnType<EmergencyDetector["getEmergencyStats"]>;
  } {
    return {
      allergy: this.allergyChecker.getAllergenInfo("general"),
      drugInteraction: this.drugInteractionAnalyzer.getInteractionStats(),
      contraindication: this.contraindicationChecker.getContraindicationStats(),
      emergency: this.emergencyDetector.getEmergencyStats()
    };
  }
}