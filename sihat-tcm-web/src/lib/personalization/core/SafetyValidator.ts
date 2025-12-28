/**
 * Safety Validator
 * 
 * Validates recommendation safety with personalization context.
 * Checks for allergies, dietary conflicts, and medical contraindications.
 */

import {
  PersonalizationFactors,
  SafetyValidationResult,
  SafetyCheck,
} from '../interfaces/PersonalizationInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Enhanced safety validator for personalized recommendations
 */
export class SafetyValidator {
  private readonly context: string;
  private readonly allergyPatterns: Map<string, RegExp>;
  private readonly dietaryConflicts: Map<string, RegExp[]>;

  constructor(context: string = 'SafetyValidator') {
    this.context = context;
    
    // Initialize allergy patterns
    this.allergyPatterns = new Map([
      ['nuts', /\b(almond|walnut|peanut|cashew|pistachio|hazelnut|pecan|macadamia)\b/i],
      ['dairy', /\b(milk|cheese|yogurt|butter|cream|lactose)\b/i],
      ['gluten', /\b(wheat|barley|rye|gluten|bread|pasta)\b/i],
      ['shellfish', /\b(shrimp|crab|lobster|oyster|clam|mussel|scallop)\b/i],
      ['soy', /\b(soy|tofu|tempeh|miso|edamame)\b/i],
      ['eggs', /\b(egg|mayonnaise)\b/i],
      ['fish', /\b(salmon|tuna|cod|mackerel|sardine|anchovy)\b/i],
    ]);

    // Initialize dietary conflict patterns
    this.dietaryConflicts = new Map([
      ['vegetarian', [
        /\b(meat|beef|pork|chicken|turkey|lamb|fish|seafood|gelatin)\b/i,
        /\b(chicken broth|beef stock|fish sauce)\b/i,
      ]],
      ['vegan', [
        /\b(meat|beef|pork|chicken|turkey|lamb|fish|seafood|dairy|milk|cheese|egg|honey|gelatin)\b/i,
        /\b(chicken broth|beef stock|fish sauce|butter|cream)\b/i,
      ]],
      ['halal', [
        /\b(pork|bacon|ham|alcohol|wine|beer)\b/i,
      ]],
      ['kosher', [
        /\b(pork|shellfish|mixing meat and dairy)\b/i,
      ]],
    ]);
  }

  /**
   * Validate recommendations for safety
   */
  public async validateRecommendations(
    recommendations: string[],
    factors: PersonalizationFactors
  ): Promise<SafetyValidationResult> {
    try {
      devLog(`[${this.context}] Validating ${recommendations.length} recommendations for safety`);

      const safeRecommendations: string[] = [];
      const flaggedRecommendations: Array<{
        recommendation: string;
        concerns: string[];
        severity: "low" | "medium" | "high";
      }> = [];

      // Validate each recommendation
      for (const recommendation of recommendations) {
        const safetyCheck = await this.checkRecommendationSafety(recommendation, factors);

        if (safetyCheck.is_safe) {
          safeRecommendations.push(recommendation);
        } else {
          flaggedRecommendations.push({
            recommendation,
            concerns: safetyCheck.concerns,
            severity: safetyCheck.severity,
          });
        }
      }

      const result: SafetyValidationResult = {
        safe_recommendations: safeRecommendations,
        flagged_recommendations: flaggedRecommendations,
        alternative_suggestions: [], // Will be populated by RecommendationGenerator
      };

      devLog(`[${this.context}] Safety validation complete`, {
        safe: safeRecommendations.length,
        flagged: flaggedRecommendations.length,
      });

      return result;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'validateRecommendations',
      });
    }
  }

  /**
   * Check individual recommendation safety
   */
  public async checkRecommendationSafety(
    recommendation: string,
    factors: PersonalizationFactors
  ): Promise<SafetyCheck> {
    try {
      const concerns: string[] = [];
      let severity: "low" | "medium" | "high" = "low";

      // Check for allergy conflicts
      const allergyConcerns = this.checkAllergyConflicts(recommendation, factors);
      if (allergyConcerns.length > 0) {
        concerns.push(...allergyConcerns);
        severity = "high"; // Allergies are always high severity
      }

      // Check for dietary type conflicts
      const dietaryConcerns = this.checkDietaryConflicts(recommendation, factors);
      if (dietaryConcerns.length > 0) {
        concerns.push(...dietaryConcerns);
        if (severity !== "high") {
          severity = "medium";
        }
      }

      // Check for medical contraindications
      const medicalConcerns = this.checkMedicalContraindications(recommendation, factors);
      if (medicalConcerns.length > 0) {
        concerns.push(...medicalConcerns);
        severity = "high"; // Medical contraindications are high severity
      }

      // Check for religious restrictions
      const religiousConcerns = this.checkReligiousRestrictions(recommendation, factors);
      if (religiousConcerns.length > 0) {
        concerns.push(...religiousConcerns);
        if (severity === "low") {
          severity = "medium";
        }
      }

      return {
        is_safe: concerns.length === 0,
        concerns,
        severity,
      };

    } catch (error) {
      logError(`[${this.context}] Error checking recommendation safety`, { error, recommendation });
      
      // Return safe by default if check fails
      return {
        is_safe: true,
        concerns: [],
        severity: "low",
      };
    }
  }

  /**
   * Check for allergy conflicts
   */
  private checkAllergyConflicts(
    recommendation: string,
    factors: PersonalizationFactors
  ): string[] {
    const concerns: string[] = [];
    const allergies = factors.dietary_restrictions.allergies;

    for (const allergy of allergies) {
      const pattern = this.allergyPatterns.get(allergy.toLowerCase());
      if (pattern && pattern.test(recommendation)) {
        concerns.push(`Contains ${allergy} which user is allergic to`);
      } else if (recommendation.toLowerCase().includes(allergy.toLowerCase())) {
        // Fallback check for allergies not in patterns
        concerns.push(`May contain ${allergy} which user is allergic to`);
      }
    }

    return concerns;
  }

  /**
   * Check for dietary type conflicts
   */
  private checkDietaryConflicts(
    recommendation: string,
    factors: PersonalizationFactors
  ): string[] {
    const concerns: string[] = [];
    const dietaryType = factors.dietary_restrictions.dietary_type;

    if (dietaryType === "no_restrictions") {
      return concerns;
    }

    const conflictPatterns = this.dietaryConflicts.get(dietaryType);
    if (conflictPatterns) {
      for (const pattern of conflictPatterns) {
        if (pattern.test(recommendation)) {
          concerns.push(`Contains ingredients not suitable for ${dietaryType} diet`);
          break; // Only add one concern per dietary type
        }
      }
    }

    return concerns;
  }

  /**
   * Check for medical contraindications
   */
  private checkMedicalContraindications(
    recommendation: string,
    factors: PersonalizationFactors
  ): string[] {
    const concerns: string[] = [];
    const healthHistory = factors.health_history;

    // Check for medication interactions
    if (healthHistory.medications) {
      for (const medication of healthHistory.medications) {
        const interactions = this.checkMedicationInteractions(recommendation, medication);
        concerns.push(...interactions);
      }
    }

    // Check for chronic condition contraindications
    if (healthHistory.chronic_conditions) {
      for (const condition of healthHistory.chronic_conditions) {
        const contraindications = this.checkConditionContraindications(recommendation, condition);
        concerns.push(...contraindications);
      }
    }

    return concerns;
  }

  /**
   * Check for religious restrictions
   */
  private checkReligiousRestrictions(
    recommendation: string,
    factors: PersonalizationFactors
  ): string[] {
    const concerns: string[] = [];
    const religiousRestrictions = factors.dietary_restrictions.religious_restrictions;

    for (const restriction of religiousRestrictions) {
      const conflictPatterns = this.dietaryConflicts.get(restriction);
      if (conflictPatterns) {
        for (const pattern of conflictPatterns) {
          if (pattern.test(recommendation)) {
            concerns.push(`Contains ingredients not suitable for ${restriction} dietary laws`);
            break;
          }
        }
      }
    }

    return concerns;
  }

  /**
   * Check for medication interactions
   */
  private checkMedicationInteractions(recommendation: string, medication: any): string[] {
    const concerns: string[] = [];

    // Common TCM herb-medication interactions
    const interactions = new Map([
      ['ginseng', ['warfarin', 'diabetes medications', 'blood pressure medications']],
      ['ginkgo', ['anticoagulants', 'aspirin', 'warfarin']],
      ['garlic', ['anticoagulants', 'blood thinners']],
      ['ginger', ['anticoagulants', 'diabetes medications']],
      ['licorice', ['blood pressure medications', 'diuretics', 'corticosteroids']],
    ]);

    const medicationName = medication.name?.toLowerCase() || '';
    
    for (const [herb, conflictingMeds] of interactions) {
      if (recommendation.toLowerCase().includes(herb)) {
        for (const conflictingMed of conflictingMeds) {
          if (medicationName.includes(conflictingMed.toLowerCase())) {
            concerns.push(`${herb} may interact with ${medication.name}`);
          }
        }
      }
    }

    return concerns;
  }

  /**
   * Check for chronic condition contraindications
   */
  private checkConditionContraindications(recommendation: string, condition: any): string[] {
    const concerns: string[] = [];

    // Common condition contraindications
    const contraindications = new Map([
      ['hypertension', ['licorice', 'high sodium foods', 'excessive salt']],
      ['diabetes', ['high sugar foods', 'refined carbohydrates']],
      ['kidney disease', ['high potassium foods', 'excessive protein']],
      ['liver disease', ['alcohol', 'high fat foods']],
      ['heart disease', ['high sodium foods', 'saturated fats']],
    ]);

    const conditionName = condition.name?.toLowerCase() || condition.toLowerCase();
    const contraindicatedItems = contraindications.get(conditionName);

    if (contraindicatedItems) {
      for (const item of contraindicatedItems) {
        if (recommendation.toLowerCase().includes(item)) {
          concerns.push(`${item} may not be suitable for ${conditionName}`);
        }
      }
    }

    return concerns;
  }

  /**
   * Add custom allergy pattern
   */
  public addAllergyPattern(allergyName: string, pattern: RegExp): void {
    this.allergyPatterns.set(allergyName.toLowerCase(), pattern);
    devLog(`[${this.context}] Added custom allergy pattern for ${allergyName}`);
  }

  /**
   * Add custom dietary conflict patterns
   */
  public addDietaryConflictPatterns(dietaryType: string, patterns: RegExp[]): void {
    this.dietaryConflicts.set(dietaryType.toLowerCase(), patterns);
    devLog(`[${this.context}] Added custom dietary conflict patterns for ${dietaryType}`);
  }

  /**
   * Get validation statistics
   */
  public getValidationStatistics(): {
    allergyPatterns: number;
    dietaryConflicts: number;
    totalChecks: number;
  } {
    return {
      allergyPatterns: this.allergyPatterns.size,
      dietaryConflicts: this.dietaryConflicts.size,
      totalChecks: 0, // Would track this in a real implementation
    };
  }
}

/**
 * Factory function for creating safety validator
 */
export function createSafetyValidator(context?: string): SafetyValidator {
  return new SafetyValidator(context);
}

/**
 * Default safety validator instance
 */
export const defaultSafetyValidator = new SafetyValidator();