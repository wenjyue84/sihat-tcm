/**
 * Allergy Checker
 * 
 * Specialized component for checking allergies against recommendations.
 * Provides comprehensive allergy validation with cross-referencing.
 */

import { devLog } from "../../systemLogger";
import {
  AllergyCheckResult,
  SafetyConcern,
  ValidationContext
} from "../interfaces/SafetyInterfaces";

export class AllergyChecker {
  private context: string;

  constructor(context: string = "AllergyChecker") {
    this.context = context;
  }

  /**
   * Check for allergies in recommendations
   */
  async checkAllergies(
    recommendations: string[],
    validationContext: ValidationContext
  ): Promise<AllergyCheckResult> {
    try {
      devLog("info", this.context, "Checking allergies", {
        recommendationCount: recommendations.length,
        allergyCount: validationContext.medical_history.allergies.length
      });

      const concerns: SafetyConcern[] = [];
      const allergies = validationContext.medical_history.allergies;

      for (const allergy of allergies) {
        for (const recommendation of recommendations) {
          if (this.isAllergyMatch(recommendation, allergy)) {
            concerns.push(this.createAllergyConcern(recommendation, allergy));
          }
        }
      }

      // Check for cross-reactive allergies
      const crossReactiveConcerns = this.checkCrossReactiveAllergies(
        recommendations,
        allergies
      );
      concerns.push(...crossReactiveConcerns);

      return { concerns };
    } catch (error) {
      devLog("error", this.context, "Allergy check failed", { error });
      return { concerns: [] };
    }
  }

  /**
   * Check if recommendation contains allergen
   */
  private isAllergyMatch(recommendation: string, allergy: string): boolean {
    const recLower = recommendation.toLowerCase();
    const allergyLower = allergy.toLowerCase();

    // Direct match
    if (recLower.includes(allergyLower)) {
      return true;
    }

    // Check for common allergen synonyms
    const allergenSynonyms = this.getAllergenSynonyms(allergyLower);
    return allergenSynonyms.some(synonym => recLower.includes(synonym));
  }

  /**
   * Get synonyms for common allergens
   */
  private getAllergenSynonyms(allergy: string): string[] {
    const synonymMap: Record<string, string[]> = {
      "shellfish": ["shrimp", "crab", "lobster", "prawns", "scallops", "oysters"],
      "nuts": ["peanuts", "tree nuts", "almonds", "walnuts", "cashews"],
      "dairy": ["milk", "cheese", "yogurt", "butter", "lactose"],
      "eggs": ["egg", "albumin", "ovalbumin"],
      "soy": ["soybean", "tofu", "miso", "tempeh"],
      "wheat": ["gluten", "flour", "bread", "pasta"],
      "fish": ["salmon", "tuna", "cod", "mackerel"],
      "sesame": ["sesame seeds", "tahini", "sesame oil"]
    };

    return synonymMap[allergy] || [];
  }

  /**
   * Check for cross-reactive allergies
   */
  private checkCrossReactiveAllergies(
    recommendations: string[],
    allergies: string[]
  ): SafetyConcern[] {
    const concerns: SafetyConcern[] = [];

    // Cross-reactivity patterns
    const crossReactivity: Record<string, string[]> = {
      "shellfish": ["iodine", "seaweed"],
      "latex": ["banana", "avocado", "kiwi", "chestnut"],
      "birch pollen": ["apple", "cherry", "peach", "apricot"],
      "ragweed": ["banana", "melon", "cucumber"],
      "grass pollen": ["tomato", "orange", "melon"]
    };

    for (const allergy of allergies) {
      const crossReactants = crossReactivity[allergy.toLowerCase()];
      if (crossReactants) {
        for (const recommendation of recommendations) {
          for (const crossReactant of crossReactants) {
            if (recommendation.toLowerCase().includes(crossReactant)) {
              concerns.push({
                type: "allergy",
                severity: "medium",
                description: `Potential cross-reactivity: ${crossReactant} may cause reaction in patients allergic to ${allergy}`,
                affected_recommendation: recommendation,
                evidence_level: "clinical_study",
                action_required: "seek_medical_advice"
              });
            }
          }
        }
      }
    }

    return concerns;
  }

  /**
   * Create allergy concern
   */
  private createAllergyConcern(recommendation: string, allergy: string): SafetyConcern {
    return {
      type: "allergy",
      severity: "high",
      description: `Recommendation contains ${allergy} which user is allergic to`,
      affected_recommendation: recommendation,
      evidence_level: "clinical_study",
      action_required: "avoid_completely"
    };
  }

  /**
   * Validate specific allergen against recommendation
   */
  async validateAllergen(
    recommendation: string,
    allergen: string
  ): Promise<SafetyConcern | null> {
    if (this.isAllergyMatch(recommendation, allergen)) {
      return this.createAllergyConcern(recommendation, allergen);
    }
    return null;
  }

  /**
   * Get allergen information
   */
  getAllergenInfo(allergen: string): {
    synonyms: string[];
    crossReactants: string[];
    severity: "mild" | "moderate" | "severe";
  } {
    const synonyms = this.getAllergenSynonyms(allergen.toLowerCase());
    
    const crossReactivity: Record<string, string[]> = {
      "shellfish": ["iodine", "seaweed"],
      "latex": ["banana", "avocado", "kiwi", "chestnut"],
      "nuts": ["tree pollen", "stone fruits"],
      "dairy": ["beef", "goat milk"]
    };

    const crossReactants = crossReactivity[allergen.toLowerCase()] || [];

    // Determine severity based on allergen type
    const highRiskAllergens = ["shellfish", "nuts", "eggs", "dairy"];
    const severity = highRiskAllergens.includes(allergen.toLowerCase()) ? "severe" : "moderate";

    return {
      synonyms,
      crossReactants,
      severity
    };
  }
}