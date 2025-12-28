/**
 * Cultural Context Builder - Builds cultural context for personalization
 * 
 * Creates comprehensive cultural context based on user language and region
 * to enable culturally appropriate TCM recommendations and adaptations.
 */

import { CulturalContext } from '../interfaces/PersonalizationInterfaces';

export class CulturalContextBuilder {
  private readonly context = 'CulturalContextBuilder';

  /**
   * Build cultural context based on language
   */
  public buildCulturalContext(language: string): CulturalContext {
    const cultural_mappings: Record<string, Partial<CulturalContext>> = {
      zh: {
        region: "chinese",
        food_culture: {
          staple_foods: ["rice", "noodles", "congee", "steamed buns"],
          common_ingredients: ["ginger", "garlic", "soy sauce", "sesame oil", "green onions"],
          cooking_methods: ["stir-frying", "steaming", "braising", "soup-making"],
          meal_patterns: ["warm breakfast", "balanced lunch", "light dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "high",
          dietary_therapy_familiarity: "high",
          lifestyle_modification_openness: "high",
        },
      },
      ms: {
        region: "southeast_asian",
        food_culture: {
          staple_foods: ["rice", "noodles", "bread", "coconut rice"],
          common_ingredients: ["coconut milk", "chili", "lemongrass", "turmeric", "pandan"],
          cooking_methods: ["grilling", "curry-making", "stir-frying", "steaming"],
          meal_patterns: ["hearty breakfast", "main lunch", "family dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "medium",
          dietary_therapy_familiarity: "medium",
          lifestyle_modification_openness: "medium",
        },
      },
      en: {
        region: "western",
        food_culture: {
          staple_foods: ["bread", "pasta", "rice", "potatoes"],
          common_ingredients: ["olive oil", "herbs", "garlic", "onions", "tomatoes"],
          cooking_methods: ["baking", "grilling", "sautéing", "roasting"],
          meal_patterns: ["light breakfast", "lunch", "main dinner"],
        },
        health_beliefs: {
          traditional_medicine_acceptance: "low",
          dietary_therapy_familiarity: "low",
          lifestyle_modification_openness: "medium",
        },
      },
    };

    const base_context = cultural_mappings[language] || cultural_mappings["en"];

    return {
      language: language as "en" | "zh" | "ms",
      region: base_context.region || "western",
      food_culture: base_context.food_culture || cultural_mappings["en"].food_culture!,
      health_beliefs: base_context.health_beliefs || cultural_mappings["en"].health_beliefs!,
    };
  }

  /**
   * Get culturally appropriate exercises
   */
  public getCulturallyAppropriateExercises(cultural_context: CulturalContext): string[] {
    const exercise_mappings: Record<string, string[]> = {
      chinese: ["Tai Chi", "Qigong", "walking meditation", "morning exercises in parks"],
      southeast_asian: ["badminton", "walking", "traditional dance", "group exercises"],
      western: ["jogging", "gym workouts", "yoga", "cycling"],
    };

    return exercise_mappings[cultural_context.region] || exercise_mappings["western"];
  }

  /**
   * Adapt text to cultural food preferences
   */
  public adaptToCulturalFoodPreferences(
    text: string,
    cultural_context: CulturalContext
  ): { adapted_text: string; adaptations: string[] } {
    let adapted_text = text;
    const adaptations: string[] = [];

    // Add cultural staples as examples
    if (text.includes("grains") || text.includes("carbohydrates")) {
      const staples = cultural_context.food_culture.staple_foods.slice(0, 2).join(" or ");
      adapted_text += ` (such as ${staples})`;
      adaptations.push(`Added culturally familiar staples: ${staples}`);
    }

    // Add cooking method suggestions
    if (text.includes("cooking") || text.includes("preparation")) {
      const methods = cultural_context.food_culture.cooking_methods.slice(0, 2).join(" or ");
      adapted_text += ` Consider ${methods} methods.`;
      adaptations.push(`Added familiar cooking methods: ${methods}`);
    }

    return { adapted_text, adaptations };
  }

  /**
   * Get cultural meal timing recommendations
   */
  public getCulturalMealTimings(cultural_context: CulturalContext): {
    breakfast: string;
    lunch: string;
    dinner: string;
    recommendations: string[];
  } {
    const meal_timings: Record<string, any> = {
      chinese: {
        breakfast: "7:00-8:00 AM",
        lunch: "12:00-1:00 PM", 
        dinner: "6:00-7:00 PM",
        recommendations: [
          "Eat warm foods in the morning to support Spleen Qi",
          "Have your largest meal at lunch when digestive fire is strongest",
          "Keep dinner light and early to aid sleep"
        ]
      },
      southeast_asian: {
        breakfast: "7:00-9:00 AM",
        lunch: "12:30-2:00 PM",
        dinner: "7:00-8:00 PM", 
        recommendations: [
          "Start with a substantial breakfast for energy",
          "Enjoy family-style meals when possible",
          "Include variety of flavors and textures"
        ]
      },
      western: {
        breakfast: "7:00-9:00 AM",
        lunch: "12:00-1:00 PM",
        dinner: "6:00-8:00 PM",
        recommendations: [
          "Maintain consistent meal times",
          "Balance portions throughout the day",
          "Consider your work schedule for meal planning"
        ]
      }
    };

    return meal_timings[cultural_context.region] || meal_timings["western"];
  }

  /**
   * Get cultural health communication preferences
   */
  public getCulturalCommunicationStyle(cultural_context: CulturalContext): {
    style: "direct" | "indirect" | "contextual";
    preferences: string[];
    considerations: string[];
  } {
    const communication_styles: Record<string, any> = {
      chinese: {
        style: "contextual",
        preferences: [
          "Respect for traditional wisdom",
          "Holistic explanations connecting mind-body-spirit",
          "References to seasonal and natural cycles"
        ],
        considerations: [
          "Use traditional TCM terminology appropriately",
          "Acknowledge family involvement in health decisions",
          "Respect for elder wisdom and experience"
        ]
      },
      southeast_asian: {
        style: "indirect",
        preferences: [
          "Gentle, respectful communication",
          "Community and family-centered approach",
          "Practical, actionable advice"
        ],
        considerations: [
          "Be sensitive to religious dietary restrictions",
          "Consider extended family influence",
          "Respect for traditional healing practices"
        ]
      },
      western: {
        style: "direct",
        preferences: [
          "Clear, evidence-based explanations",
          "Individual autonomy in health decisions",
          "Scientific rationale for recommendations"
        ],
        considerations: [
          "Provide research backing when possible",
          "Respect skepticism about traditional medicine",
          "Focus on measurable outcomes"
        ]
      }
    };

    return communication_styles[cultural_context.region] || communication_styles["western"];
  }
}