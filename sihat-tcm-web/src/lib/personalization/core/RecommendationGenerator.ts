/**
 * Recommendation Generator
 *
 * Generates alternative recommendations when original ones are flagged for safety concerns.
 * Uses TCM principles and personalization factors to create suitable alternatives.
 */

import { PersonalizationFactors } from "../interfaces/PersonalizationInterfaces";

import { devLog, logError } from "../../systemLogger";
import { ErrorFactory } from "../../errors/AppError";

/**
 * Enhanced recommendation generator for personalized alternatives
 */
export class RecommendationGenerator {
  private readonly context: string;
  private readonly tcmAlternatives: Map<string, string[]>;
  private readonly therapeuticCategories: Map<string, string[]>;

  constructor(context: string = "RecommendationGenerator") {
    this.context = context;

    // Initialize TCM alternatives database
    this.tcmAlternatives = new Map([
      // Protein alternatives
      ["meat", ["tofu", "tempeh", "lentils", "black beans", "quinoa"]],
      ["fish", ["seaweed", "spirulina", "hemp seeds", "chia seeds"]],
      ["dairy", ["almond milk", "coconut milk", "oat milk", "cashew cream"]],

      // Herb alternatives
      ["ginseng", ["astragalus", "codonopsis", "schisandra"]],
      ["ginkgo", ["gotu kola", "bacopa", "rhodiola"]],
      ["licorice", ["marshmallow root", "slippery elm", "fennel"]],

      // Spice alternatives
      ["garlic", ["onion", "shallots", "chives", "asafoetida"]],
      ["ginger", ["turmeric", "galangal", "cardamom"]],

      // Grain alternatives
      ["wheat", ["rice", "millet", "buckwheat", "amaranth"]],
      ["barley", ["oats", "quinoa", "brown rice"]],
    ]);

    // Initialize therapeutic categories
    this.therapeuticCategories = new Map([
      ["warming", ["ginger", "cinnamon", "cloves", "fennel", "cardamom"]],
      ["cooling", ["mint", "chrysanthemum", "green tea", "cucumber", "watermelon"]],
      ["tonifying", ["goji berries", "dates", "longan", "astragalus", "codonopsis"]],
      ["detoxifying", ["dandelion", "burdock", "milk thistle", "green tea"]],
      ["digestive", ["fennel", "cardamom", "orange peel", "hawthorn"]],
      ["calming", ["chamomile", "lavender", "passionflower", "jujube dates"]],
    ]);
  }

  /**
   * Generate alternative recommendations for flagged items
   */
  public async generateAlternatives(
    flaggedRecommendations: Array<{
      recommendation: string;
      concerns: string[];
      severity: "low" | "medium" | "high";
    }>,
    factors: PersonalizationFactors,
    maxAlternatives: number = 5
  ): Promise<string[]> {
    try {
      devLog(
        `[${this.context}] Generating alternatives for ${flaggedRecommendations.length} flagged recommendations`
      );

      const alternatives: string[] = [];

      for (const flagged of flaggedRecommendations) {
        const itemAlternatives = await this.generateAlternativesForItem(
          flagged.recommendation,
          flagged.concerns,
          factors
        );

        alternatives.push(...itemAlternatives);

        // Stop if we have enough alternatives
        if (alternatives.length >= maxAlternatives) {
          break;
        }
      }

      // Remove duplicates and limit to max
      const uniqueAlternatives = [...new Set(alternatives)].slice(0, maxAlternatives);

      devLog(
        `[${this.context}] Generated ${uniqueAlternatives.length} alternative recommendations`
      );

      return uniqueAlternatives;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: "generateAlternatives",
      });
    }
  }

  /**
   * Generate alternatives for a specific item
   */
  public async generateAlternativesForItem(
    originalRecommendation: string,
    concerns: string[],
    factors: PersonalizationFactors
  ): Promise<string[]> {
    try {
      const alternatives: string[] = [];

      // Analyze the original recommendation to understand its therapeutic purpose
      const therapeuticPurpose = this.analyzeTherapeuticPurpose(originalRecommendation);

      // Generate alternatives based on concerns
      for (const concern of concerns) {
        if (concern.includes("allergic to")) {
          const allergen = this.extractAllergenFromConcern(concern);
          if (allergen) {
            const allergenAlternatives = this.generateAllergenAlternatives(
              allergen,
              therapeuticPurpose,
              factors
            );
            alternatives.push(...allergenAlternatives);
          }
        } else if (concern.includes("not suitable for")) {
          const dietaryAlternatives = this.generateDietaryAlternatives(
            originalRecommendation,
            therapeuticPurpose,
            factors
          );
          alternatives.push(...dietaryAlternatives);
        } else if (concern.includes("may interact with")) {
          const safeAlternatives = this.generateMedicationSafeAlternatives(
            originalRecommendation,
            therapeuticPurpose,
            factors
          );
          alternatives.push(...safeAlternatives);
        }
      }

      // If no specific alternatives found, generate general therapeutic alternatives
      if (alternatives.length === 0) {
        const generalAlternatives = this.generateGeneralAlternatives(therapeuticPurpose, factors);
        alternatives.push(...generalAlternatives);
      }

      return alternatives.slice(0, 3); // Limit to 3 alternatives per item
    } catch (error) {
      logError(
        `[${this.context}] Error generating alternatives for item`,
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  /**
   * Analyze therapeutic purpose of a recommendation
   */
  private analyzeTherapeuticPurpose(recommendation: string): string[] {
    const purposes: string[] = [];
    const lowerRec = recommendation.toLowerCase();

    // Check for warming/cooling properties
    if (this.containsAnyOf(lowerRec, ["ginger", "cinnamon", "warm", "heat"])) {
      purposes.push("warming");
    }
    if (this.containsAnyOf(lowerRec, ["mint", "cool", "cold", "chrysanthemum"])) {
      purposes.push("cooling");
    }

    // Check for tonifying properties
    if (this.containsAnyOf(lowerRec, ["strengthen", "tonify", "boost", "energy"])) {
      purposes.push("tonifying");
    }

    // Check for digestive properties
    if (this.containsAnyOf(lowerRec, ["digest", "stomach", "spleen", "appetite"])) {
      purposes.push("digestive");
    }

    // Check for calming properties
    if (this.containsAnyOf(lowerRec, ["calm", "relax", "sleep", "anxiety"])) {
      purposes.push("calming");
    }

    // Check for detoxifying properties
    if (this.containsAnyOf(lowerRec, ["detox", "cleanse", "liver", "clear heat"])) {
      purposes.push("detoxifying");
    }

    return purposes.length > 0 ? purposes : ["general"];
  }

  /**
   * Extract allergen from concern message
   */
  private extractAllergenFromConcern(concern: string): string | null {
    const match = concern.match(/allergic to (\w+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Generate alternatives for specific allergens
   */
  private generateAllergenAlternatives(
    allergen: string,
    therapeuticPurpose: string[],
    factors: PersonalizationFactors
  ): string[] {
    const alternatives: string[] = [];

    // Get direct alternatives for the allergen
    const directAlternatives = this.tcmAlternatives.get(allergen);
    if (directAlternatives) {
      alternatives.push(...directAlternatives);
    }

    // Get therapeutic alternatives
    for (const purpose of therapeuticPurpose) {
      const therapeuticAlts = this.therapeuticCategories.get(purpose);
      if (therapeuticAlts) {
        // Filter out the allergen and add safe alternatives
        const safeAlts = therapeuticAlts.filter(
          (alt) => !alt.toLowerCase().includes(allergen) && this.isSafeForUser(alt, factors)
        );
        alternatives.push(...safeAlts);
      }
    }

    return alternatives;
  }

  /**
   * Generate alternatives for dietary restrictions
   */
  private generateDietaryAlternatives(
    originalRecommendation: string,
    therapeuticPurpose: string[],
    factors: PersonalizationFactors
  ): string[] {
    const alternatives: string[] = [];
    const dietaryType = factors.dietary_restrictions.dietary_type;

    // Generate alternatives based on dietary type
    switch (dietaryType) {
      case "vegetarian":
        alternatives.push(...this.getVegetarianAlternatives(therapeuticPurpose));
        break;
      case "vegan":
        alternatives.push(...this.getVeganAlternatives(therapeuticPurpose));
        break;
      case "halal":
        alternatives.push(...this.getHalalAlternatives(therapeuticPurpose));
        break;
      case "kosher":
        alternatives.push(...this.getKosherAlternatives(therapeuticPurpose));
        break;
    }

    return alternatives.filter((alt) => this.isSafeForUser(alt, factors));
  }

  /**
   * Generate medication-safe alternatives
   */
  private generateMedicationSafeAlternatives(
    originalRecommendation: string,
    therapeuticPurpose: string[],
    factors: PersonalizationFactors
  ): string[] {
    const alternatives: string[] = [];

    // Get gentle alternatives that are less likely to interact
    const gentleAlternatives = [
      "chamomile tea",
      "warm water with lemon",
      "mild herbal teas",
      "gentle stretching",
      "deep breathing exercises",
      "light walking",
    ];

    // Add therapeutic alternatives that are generally safe
    for (const purpose of therapeuticPurpose) {
      switch (purpose) {
        case "digestive":
          alternatives.push("fennel tea", "warm water before meals", "gentle abdominal massage");
          break;
        case "calming":
          alternatives.push("lavender aromatherapy", "meditation", "gentle yoga");
          break;
        case "warming":
          alternatives.push("warm compress", "gentle movement", "warm clothing");
          break;
        case "cooling":
          alternatives.push("cool compress", "rest in cool environment", "light clothing");
          break;
      }
    }

    alternatives.push(...gentleAlternatives);
    return alternatives.filter((alt) => this.isSafeForUser(alt, factors));
  }

  /**
   * Generate general therapeutic alternatives
   */
  private generateGeneralAlternatives(
    therapeuticPurpose: string[],
    factors: PersonalizationFactors
  ): string[] {
    const alternatives: string[] = [];

    for (const purpose of therapeuticPurpose) {
      const categoryAlternatives = this.therapeuticCategories.get(purpose);
      if (categoryAlternatives) {
        alternatives.push(...categoryAlternatives);
      }
    }

    // Add general TCM lifestyle recommendations
    alternatives.push(
      "regular sleep schedule",
      "moderate exercise",
      "balanced meals",
      "stress reduction techniques",
      "adequate hydration"
    );

    return alternatives.filter((alt) => this.isSafeForUser(alt, factors));
  }

  /**
   * Get vegetarian alternatives
   */
  private getVegetarianAlternatives(therapeuticPurpose: string[]): string[] {
    const alternatives = [
      "tofu with herbs",
      "lentil soup",
      "vegetable broth",
      "herbal teas",
      "plant-based proteins",
    ];

    // Add purpose-specific vegetarian options
    for (const purpose of therapeuticPurpose) {
      switch (purpose) {
        case "tonifying":
          alternatives.push("black sesame seeds", "walnuts", "goji berries");
          break;
        case "warming":
          alternatives.push("ginger tea", "cinnamon", "warm spices");
          break;
      }
    }

    return alternatives;
  }

  /**
   * Get vegan alternatives
   */
  private getVeganAlternatives(therapeuticPurpose: string[]): string[] {
    const alternatives = [
      "plant-based milk",
      "nutritional yeast",
      "tahini",
      "coconut products",
      "plant proteins",
    ];

    // Add purpose-specific vegan options
    for (const purpose of therapeuticPurpose) {
      switch (purpose) {
        case "tonifying":
          alternatives.push("hemp seeds", "chia seeds", "spirulina");
          break;
        case "cooling":
          alternatives.push("coconut water", "cucumber", "mint");
          break;
      }
    }

    return alternatives;
  }

  /**
   * Get halal alternatives
   */
  private getHalalAlternatives(therapeuticPurpose: string[]): string[] {
    return [
      "halal-certified herbs",
      "vegetable-based options",
      "fish alternatives",
      "plant-based proteins",
      "herbal teas",
    ];
  }

  /**
   * Get kosher alternatives
   */
  private getKosherAlternatives(therapeuticPurpose: string[]): string[] {
    return [
      "kosher-certified options",
      "vegetarian alternatives",
      "plant-based proteins",
      "kosher fish options",
      "herbal preparations",
    ];
  }

  /**
   * Check if alternative is safe for user
   */
  private isSafeForUser(alternative: string, factors: PersonalizationFactors): boolean {
    const allergies = factors.dietary_restrictions.allergies;
    const lowerAlt = alternative.toLowerCase();

    // Check against known allergies
    for (const allergy of allergies) {
      if (lowerAlt.includes(allergy.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if text contains any of the given terms
   */
  private containsAnyOf(text: string, terms: string[]): boolean {
    return terms.some((term) => text.includes(term));
  }

  /**
   * Add custom TCM alternatives
   */
  public addTCMAlternatives(ingredient: string, alternatives: string[]): void {
    this.tcmAlternatives.set(ingredient.toLowerCase(), alternatives);
    devLog(`[${this.context}] Added TCM alternatives for ${ingredient}`);
  }

  /**
   * Add therapeutic category
   */
  public addTherapeuticCategory(category: string, items: string[]): void {
    this.therapeuticCategories.set(category.toLowerCase(), items);
    devLog(`[${this.context}] Added therapeutic category: ${category}`);
  }

  /**
   * Get generator statistics
   */
  public getGeneratorStatistics(): {
    tcmAlternatives: number;
    therapeuticCategories: number;
    totalAlternatives: number;
  } {
    const totalAlternatives =
      Array.from(this.tcmAlternatives.values()).reduce((sum, alts) => sum + alts.length, 0) +
      Array.from(this.therapeuticCategories.values()).reduce((sum, items) => sum + items.length, 0);

    return {
      tcmAlternatives: this.tcmAlternatives.size,
      therapeuticCategories: this.therapeuticCategories.size,
      totalAlternatives,
    };
  }
}

/**
 * Factory function for creating recommendation generator
 */
export function createRecommendationGenerator(context?: string): RecommendationGenerator {
  return new RecommendationGenerator(context);
}

/**
 * Default recommendation generator instance
 */
export const defaultRecommendationGenerator = new RecommendationGenerator();
