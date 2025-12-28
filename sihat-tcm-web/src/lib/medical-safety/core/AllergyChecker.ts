/**
 * Allergy Checker - Validates recommendations against known allergies
 * 
 * Provides comprehensive allergy checking functionality including
 * cross-reactivity analysis and alternative suggestion generation.
 */

import { SafetyConcern, ValidationContext } from '../interfaces/SafetyInterfaces';

export class AllergyChecker {
  private readonly context = 'AllergyChecker';
  
  // Cross-reactivity mapping for related allergens
  private readonly crossReactivityMap: Record<string, string[]> = {
    'shellfish': ['crustaceans', 'mollusks', 'iodine'],
    'nuts': ['tree nuts', 'peanuts', 'seeds'],
    'dairy': ['milk', 'lactose', 'casein', 'whey'],
    'eggs': ['albumin', 'ovalbumin'],
    'soy': ['soybeans', 'soy protein', 'lecithin'],
    'gluten': ['wheat', 'barley', 'rye', 'oats'],
    'sesame': ['tahini', 'sesame oil', 'sesame seeds']
  };

  /**
   * Check recommendations against user allergies
   */
  public async checkAllergies(
    recommendations: string[],
    context: ValidationContext
  ): Promise<{ concerns: SafetyConcern[] }> {
    const concerns: SafetyConcern[] = [];
    const allergies = context.medical_history.allergies;

    for (const allergy of allergies) {
      // Check direct matches
      const directMatches = this.findDirectMatches(recommendations, allergy);
      concerns.push(...directMatches);

      // Check cross-reactive substances
      const crossReactiveMatches = this.findCrossReactiveMatches(recommendations, allergy);
      concerns.push(...crossReactiveMatches);

      // Check hidden allergens
      const hiddenMatches = this.findHiddenAllergens(recommendations, allergy);
      concerns.push(...hiddenMatches);
    }

    return { concerns };
  }

  /**
   * Generate allergy-safe alternatives
   */
  public generateAllergyAlternatives(
    original_recommendation: string,
    allergies: string[]
  ): string[] {
    const alternatives: string[] = [];

    for (const allergy of allergies) {
      const alternative = this.getAllergyAlternative(allergy, original_recommendation);
      if (alternative && !alternatives.includes(alternative)) {
        alternatives.push(alternative);
      }
    }

    return alternatives;
  }

  /**
   * Check if substance is safe for user with allergies
   */
  public isSafeForAllergies(substance: string, allergies: string[]): boolean {
    for (const allergy of allergies) {
      if (this.containsAllergen(substance, allergy)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get severity level for allergy exposure
   */
  public getAllergySeverity(allergy: string, exposure_type: string): "low" | "medium" | "high" | "critical" {
    // High-risk allergens that can cause anaphylaxis
    const highRiskAllergens = ['shellfish', 'nuts', 'peanuts', 'eggs', 'milk'];
    
    if (highRiskAllergens.includes(allergy.toLowerCase())) {
      return exposure_type === 'direct' ? 'critical' : 'high';
    }

    // Medium-risk allergens
    const mediumRiskAllergens = ['soy', 'wheat', 'fish', 'sesame'];
    if (mediumRiskAllergens.includes(allergy.toLowerCase())) {
      return exposure_type === 'direct' ? 'high' : 'medium';
    }

    return 'medium';
  }

  // Private helper methods

  private findDirectMatches(recommendations: string[], allergy: string): SafetyConcern[] {
    const concerns: SafetyConcern[] = [];

    for (const recommendation of recommendations) {
      if (this.containsAllergen(recommendation, allergy)) {
        concerns.push({
          type: "allergy",
          severity: this.getAllergySeverity(allergy, 'direct'),
          description: `Recommendation contains ${allergy} which user is allergic to`,
          affected_recommendation: recommendation,
          evidence_level: "clinical_study",
          action_required: "avoid_completely",
        });
      }
    }

    return concerns;
  }

  private findCrossReactiveMatches(recommendations: string[], allergy: string): SafetyConcern[] {
    const concerns: SafetyConcern[] = [];
    const crossReactiveSubstances = this.crossReactivityMap[allergy.toLowerCase()] || [];

    for (const substance of crossReactiveSubstances) {
      for (const recommendation of recommendations) {
        if (this.containsAllergen(recommendation, substance)) {
          concerns.push({
            type: "allergy",
            severity: this.getAllergySeverity(allergy, 'cross_reactive'),
            description: `Recommendation contains ${substance} which may cross-react with ${allergy} allergy`,
            affected_recommendation: recommendation,
            evidence_level: "clinical_study",
            action_required: "seek_medical_advice",
          });
        }
      }
    }

    return concerns;
  }

  private findHiddenAllergens(recommendations: string[], allergy: string): SafetyConcern[] {
    const concerns: SafetyConcern[] = [];
    const hiddenSources = this.getHiddenAllergenSources(allergy);

    for (const source of hiddenSources) {
      for (const recommendation of recommendations) {
        if (recommendation.toLowerCase().includes(source.toLowerCase())) {
          concerns.push({
            type: "allergy",
            severity: "medium",
            description: `Recommendation may contain hidden ${allergy} in ${source}`,
            affected_recommendation: recommendation,
            evidence_level: "theoretical",
            action_required: "seek_medical_advice",
          });
        }
      }
    }

    return concerns;
  }

  private containsAllergen(text: string, allergen: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedAllergen = allergen.toLowerCase();
    
    // Direct match
    if (normalizedText.includes(normalizedAllergen)) {
      return true;
    }

    // Check alternative names
    const alternativeNames = this.getAllergenAlternativeNames(allergen);
    return alternativeNames.some(name => normalizedText.includes(name.toLowerCase()));
  }

  private getAllergenAlternativeNames(allergen: string): string[] {
    const alternativeNames: Record<string, string[]> = {
      'shellfish': ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish', 'scallops', 'mussels', 'clams', 'oysters'],
      'nuts': ['almonds', 'walnuts', 'cashews', 'pistachios', 'hazelnuts', 'pecans', 'brazil nuts', 'macadamia'],
      'peanuts': ['groundnuts', 'arachis oil'],
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'lactose', 'casein', 'whey'],
      'eggs': ['albumin', 'ovalbumin', 'egg white', 'egg yolk'],
      'soy': ['soybeans', 'soya', 'tofu', 'tempeh', 'miso', 'soy sauce', 'edamame'],
      'wheat': ['flour', 'gluten', 'semolina', 'bulgur', 'spelt'],
      'fish': ['salmon', 'tuna', 'cod', 'mackerel', 'sardines', 'anchovies'],
      'sesame': ['tahini', 'sesame oil', 'sesame seeds', 'sesamum']
    };

    return alternativeNames[allergen.toLowerCase()] || [];
  }

  private getHiddenAllergenSources(allergy: string): string[] {
    const hiddenSources: Record<string, string[]> = {
      'dairy': ['processed foods', 'baked goods', 'chocolate', 'margarine'],
      'eggs': ['mayonnaise', 'pasta', 'baked goods', 'processed meats'],
      'soy': ['processed foods', 'vegetable oil', 'emulsifiers', 'protein powders'],
      'wheat': ['soy sauce', 'processed meats', 'soup mixes', 'seasonings'],
      'nuts': ['processed foods', 'baked goods', 'chocolates', 'cereals'],
      'shellfish': ['fish sauce', 'worcestershire sauce', 'caesar dressing', 'surimi']
    };

    return hiddenSources[allergy.toLowerCase()] || [];
  }

  private getAllergyAlternative(allergy: string, context: string): string {
    const alternatives: Record<string, string> = {
      'nuts': "seeds (sunflower, pumpkin)",
      'dairy': "plant-based alternatives (oat, almond milk)",
      'eggs': "flax eggs or chia seeds",
      'shellfish': "seaweed or fish alternatives",
      'soy': "other legumes (lentils, chickpeas)",
      'gluten': "gluten-free grains (rice, quinoa)",
      'fish': "seaweed or plant-based omega-3 sources",
      'sesame': "tahini alternatives (sunflower seed butter)",
      'peanuts': "other nuts or seeds (if not allergic)",
      'wheat': "alternative grains (rice, corn, quinoa)"
    };

    return alternatives[allergy.toLowerCase()] || "suitable alternative";
  }
}