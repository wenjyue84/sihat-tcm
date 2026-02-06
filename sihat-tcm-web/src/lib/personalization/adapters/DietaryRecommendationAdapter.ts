/**
 * Dietary Recommendation Adapter - Personalizes dietary recommendations
 *
 * Adapts TCM dietary recommendations based on user preferences, cultural context,
 * allergies, and dietary restrictions while maintaining therapeutic effectiveness.
 */

import {
  PersonalizationFactors,
  PersonalizedRecommendation,
} from "../interfaces/PersonalizationInterfaces";
import { CulturalContextBuilder } from "../core/CulturalContextBuilder";

export class DietaryRecommendationAdapter {
  private readonly context = "DietaryRecommendationAdapter";
  private culturalBuilder: CulturalContextBuilder;

  constructor() {
    this.culturalBuilder = new CulturalContextBuilder();
  }

  /**
   * Adapt dietary recommendation for user
   */
  public async adaptDietaryRecommendation(
    recommendation: string,
    factors: PersonalizationFactors
  ): Promise<PersonalizedRecommendation> {
    const personalization_factors: string[] = [];
    const cultural_adaptations: string[] = [];
    const dietary_modifications: string[] = [];
    let personalized_version = recommendation;
    let confidence_score = 1.0;

    // Check for allergies and dietary restrictions
    const allergyResult = this.handleAllergies(recommendation, factors);
    if (allergyResult.modified) {
      personalized_version = allergyResult.text;
      dietary_modifications.push(...allergyResult.modifications);
      confidence_score -= 0.1;
    }

    // Handle dietary type restrictions
    const dietaryTypeResult = this.handleDietaryType(personalized_version, factors);
    if (dietaryTypeResult.modified) {
      personalized_version = dietaryTypeResult.text;
      dietary_modifications.push(...dietaryTypeResult.modifications);
      confidence_score -= 0.05;
    }

    // Adapt to cultural food preferences
    const culturalResult = this.culturalBuilder.adaptToCulturalFoodPreferences(
      personalized_version,
      factors.cultural_context
    );

    if (culturalResult.adapted_text !== personalized_version) {
      personalized_version = culturalResult.adapted_text;
      cultural_adaptations.push(...culturalResult.adaptations);
      personalization_factors.push("cultural_food_preferences");
    }

    // Handle disliked foods
    const dislikedResult = this.handleDislikedFoods(personalized_version, factors);
    if (dislikedResult.modified) {
      personalized_version = dislikedResult.text;
      dietary_modifications.push(...dislikedResult.modifications);
      confidence_score -= 0.05;
    }

    // Add cooking method suggestions
    const cookingResult = this.addCookingMethodSuggestions(personalized_version, factors);
    if (cookingResult.modified) {
      personalized_version = cookingResult.text;
      cultural_adaptations.push(...cookingResult.adaptations);
    }

    return {
      original_recommendation: recommendation,
      personalized_version,
      personalization_factors,
      cultural_adaptations,
      dietary_modifications,
      confidence_score: Math.max(0.3, confidence_score),
      reasoning: `Adapted for ${factors.cultural_context.language} cultural context and dietary restrictions`,
    };
  }

  /**
   * Generate alternative foods for restrictions
   */
  public generateAlternativeFoods(
    restricted_food: string,
    therapeutic_purpose: string,
    factors: PersonalizationFactors
  ): string[] {
    const alternatives: string[] = [];

    // Get culturally appropriate alternatives
    const cultural_alternatives = this.getCulturalAlternatives(
      restricted_food,
      factors.cultural_context
    );
    alternatives.push(...cultural_alternatives);

    // Get therapeutic alternatives
    const therapeutic_alternatives = this.getTherapeuticAlternatives(
      restricted_food,
      therapeutic_purpose
    );
    alternatives.push(...therapeutic_alternatives);

    // Filter out any that conflict with restrictions
    return alternatives.filter((alt) => this.isCompatibleWithRestrictions(alt, factors));
  }

  /**
   * Validate food compatibility with restrictions
   */
  public isCompatibleWithRestrictions(food: string, factors: PersonalizationFactors): boolean {
    const { dietary_restrictions } = factors;

    // Check allergies
    for (const allergy of dietary_restrictions.allergies) {
      if (food.toLowerCase().includes(allergy.toLowerCase())) {
        return false;
      }
    }

    // Check dietary type
    const dietary_type = dietary_restrictions.dietary_type;
    if (dietary_type === "vegetarian" && this.isAnimalProduct(food)) {
      return false;
    }
    if (dietary_type === "vegan" && (this.isAnimalProduct(food) || this.isDairyProduct(food))) {
      return false;
    }

    // Check disliked foods
    for (const disliked of dietary_restrictions.disliked_foods) {
      if (food.toLowerCase().includes(disliked.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  // Private helper methods

  private handleAllergies(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; modifications: string[] } {
    let text = recommendation;
    let modified = false;
    const modifications: string[] = [];

    for (const allergy of factors.dietary_restrictions.allergies) {
      if (text.toLowerCase().includes(allergy.toLowerCase())) {
        const alternative = this.findAllergyAlternative(allergy, recommendation);
        text = text.replace(new RegExp(allergy, "gi"), alternative);
        modifications.push(`Replaced ${allergy} with ${alternative} due to allergy`);
        modified = true;
      }
    }

    return { text, modified, modifications };
  }

  private handleDietaryType(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; modifications: string[] } {
    let text = recommendation;
    let modified = false;
    const modifications: string[] = [];

    const dietary_type = factors.dietary_restrictions.dietary_type;

    if (dietary_type === "vegetarian" && /meat|fish|chicken|beef|pork|seafood/i.test(text)) {
      // Replace animal products with plant-based alternatives
      text = text.replace(/meat|beef|pork/gi, "plant protein");
      text = text.replace(/fish|seafood/gi, "seaweed or algae");
      text = text.replace(/chicken/gi, "tofu or tempeh");
      modifications.push("Replaced animal products with vegetarian alternatives");
      modified = true;
    }

    if (dietary_type === "vegan" && /dairy|milk|cheese|yogurt|butter|eggs/i.test(text)) {
      text = text.replace(/dairy|milk/gi, "plant milk");
      text = text.replace(/cheese/gi, "nutritional yeast");
      text = text.replace(/yogurt/gi, "plant-based yogurt");
      text = text.replace(/butter/gi, "plant-based spread");
      text = text.replace(/eggs/gi, "flax eggs");
      modifications.push("Replaced dairy and eggs with vegan alternatives");
      modified = true;
    }

    return { text, modified, modifications };
  }

  private handleDislikedFoods(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; modifications: string[] } {
    let text = recommendation;
    let modified = false;
    const modifications: string[] = [];

    for (const disliked of factors.dietary_restrictions.disliked_foods) {
      if (text.toLowerCase().includes(disliked.toLowerCase())) {
        const alternative = this.findFoodAlternative(disliked, recommendation);
        text = text.replace(new RegExp(disliked, "gi"), alternative);
        modifications.push(`Replaced ${disliked} with ${alternative} based on preferences`);
        modified = true;
      }
    }

    return { text, modified, modifications };
  }

  private addCookingMethodSuggestions(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; adaptations: string[] } {
    let text = recommendation;
    let modified = false;
    const adaptations: string[] = [];

    // Add cooking method suggestions based on cultural context
    if (text.includes("prepare") || text.includes("cook")) {
      const methods = factors.cultural_context.food_culture.cooking_methods.slice(0, 2);
      text += ` Consider ${methods.join(" or ")} methods.`;
      adaptations.push(`Added culturally familiar cooking methods: ${methods.join(", ")}`);
      modified = true;
    }

    return { text, modified, adaptations };
  }

  private findAllergyAlternative(allergy: string, context: string): string {
    const alternatives: Record<string, string> = {
      nuts: "seeds (sunflower, pumpkin)",
      dairy: "plant-based alternatives (oat, almond milk)",
      eggs: "flax eggs or chia seeds",
      shellfish: "seaweed or fish alternatives",
      soy: "other legumes (lentils, chickpeas)",
      gluten: "gluten-free grains (rice, quinoa)",
      fish: "seaweed or plant-based omega-3 sources",
      sesame: "tahini alternatives (sunflower seed butter)",
    };

    return alternatives[allergy.toLowerCase()] || "suitable alternative";
  }

  private findFoodAlternative(disliked: string, context: string): string {
    const alternatives: Record<string, string> = {
      "bitter melon": "cucumber or zucchini",
      cilantro: "parsley or green onions",
      liver: "lean meat or iron-rich legumes",
      ginger: "mild warming spices (cinnamon, cardamom)",
      spicy: "mild herbs (basil, oregano)",
      mushrooms: "other umami-rich foods",
      onions: "leeks or shallots",
      garlic: "garlic powder or asafoetida",
    };

    return alternatives[disliked.toLowerCase()] || "preferred alternative";
  }

  private getCulturalAlternatives(food: string, cultural_context: any): string[] {
    const cultural_alternatives: Record<string, Record<string, string[]>> = {
      chinese: {
        rice: ["congee", "rice noodles", "glutinous rice"],
        vegetables: ["bok choy", "Chinese cabbage", "winter melon"],
        protein: ["tofu", "tempeh", "seitan"],
      },
      southeast_asian: {
        rice: ["coconut rice", "pandan rice", "rice noodles"],
        vegetables: ["kangkung", "long beans", "okra"],
        protein: ["tempeh", "fish", "chicken"],
      },
      western: {
        rice: ["quinoa", "barley", "bulgur"],
        vegetables: ["broccoli", "spinach", "carrots"],
        protein: ["chicken", "fish", "legumes"],
      },
    };

    const region = cultural_context.region;
    const category = this.categorizeFood(food);

    return cultural_alternatives[region]?.[category] || [];
  }

  private getTherapeuticAlternatives(food: string, therapeutic_purpose: string): string[] {
    const therapeutic_alternatives: Record<string, string[]> = {
      warming: ["ginger", "cinnamon", "cloves", "fennel"],
      cooling: ["cucumber", "watermelon", "mint", "green tea"],
      nourishing: ["dates", "goji berries", "black sesame", "walnuts"],
      detoxifying: ["green leafy vegetables", "burdock root", "dandelion"],
      digestive: ["fennel", "cardamom", "orange peel", "hawthorn"],
    };

    return therapeutic_alternatives[therapeutic_purpose.toLowerCase()] || [];
  }

  private categorizeFood(food: string): string {
    if (/rice|grain|wheat|oat/i.test(food)) return "rice";
    if (/vegetable|green|leaf/i.test(food)) return "vegetables";
    if (/meat|fish|protein|tofu/i.test(food)) return "protein";
    return "other";
  }

  private isAnimalProduct(food: string): boolean {
    return /meat|beef|pork|chicken|fish|seafood|lamb|turkey/i.test(food);
  }

  private isDairyProduct(food: string): boolean {
    return /dairy|milk|cheese|yogurt|butter|cream/i.test(food);
  }
}
