/**
 * Lifestyle Recommendation Adapter - Personalizes lifestyle recommendations
 * 
 * Adapts TCM lifestyle recommendations based on cultural context, user preferences,
 * and practical constraints while maintaining therapeutic benefits.
 */

import { PersonalizationFactors, PersonalizedRecommendation } from '../interfaces/PersonalizationInterfaces';
import { CulturalContextBuilder } from '../core/CulturalContextBuilder';

export class LifestyleRecommendationAdapter {
  private readonly context = 'LifestyleRecommendationAdapter';
  private culturalBuilder: CulturalContextBuilder;

  constructor() {
    this.culturalBuilder = new CulturalContextBuilder();
  }

  /**
   * Adapt lifestyle recommendation for user
   */
  public adaptLifestyleRecommendation(
    recommendation: string,
    factors: PersonalizationFactors
  ): PersonalizedRecommendation {
    const personalization_factors: string[] = [];
    const cultural_adaptations: string[] = [];
    let personalized_version = recommendation;

    // Adapt exercise recommendations
    const exerciseResult = this.adaptExerciseRecommendations(recommendation, factors);
    if (exerciseResult.modified) {
      personalized_version = exerciseResult.text;
      cultural_adaptations.push(...exerciseResult.adaptations);
      personalization_factors.push("cultural_exercise_preferences");
    }

    // Adapt sleep recommendations
    const sleepResult = this.adaptSleepRecommendations(personalized_version, factors);
    if (sleepResult.modified) {
      personalized_version = sleepResult.text;
      cultural_adaptations.push(...sleepResult.adaptations);
      personalization_factors.push("cultural_sleep_patterns");
    }

    // Adapt stress management recommendations
    const stressResult = this.adaptStressManagement(personalized_version, factors);
    if (stressResult.modified) {
      personalized_version = stressResult.text;
      cultural_adaptations.push(...stressResult.adaptations);
      personalization_factors.push("cultural_stress_management");
    }

    // Add work-life balance considerations
    const workLifeResult = this.addWorkLifeConsiderations(personalized_version, factors);
    if (workLifeResult.modified) {
      personalized_version = workLifeResult.text;
      cultural_adaptations.push(...workLifeResult.adaptations);
      personalization_factors.push("work_life_balance");
    }

    return {
      original_recommendation: recommendation,
      personalized_version,
      personalization_factors,
      cultural_adaptations,
      dietary_modifications: [],
      confidence_score: 0.9,
      reasoning: "Adapted lifestyle recommendation for cultural context and personal preferences",
    };
  }

  /**
   * Generate culturally appropriate exercise alternatives
   */
  public generateExerciseAlternatives(
    original_exercise: string,
    factors: PersonalizationFactors
  ): string[] {
    const cultural_exercises = this.culturalBuilder.getCulturallyAppropriateExercises(
      factors.cultural_context
    );

    const alternatives: string[] = [];

    // Map generic exercises to cultural alternatives
    if (/cardio|aerobic|running/i.test(original_exercise)) {
      alternatives.push(...this.getCardioAlternatives(factors.cultural_context.region));
    }

    if (/strength|weight|resistance/i.test(original_exercise)) {
      alternatives.push(...this.getStrengthAlternatives(factors.cultural_context.region));
    }

    if (/flexibility|stretch|yoga/i.test(original_exercise)) {
      alternatives.push(...this.getFlexibilityAlternatives(factors.cultural_context.region));
    }

    if (/meditation|mindfulness|relaxation/i.test(original_exercise)) {
      alternatives.push(...this.getMindfulnessAlternatives(factors.cultural_context.region));
    }

    return [...new Set(alternatives)]; // Remove duplicates
  }

  /**
   * Adapt timing recommendations for cultural context
   */
  public adaptTimingRecommendations(
    recommendation: string,
    factors: PersonalizationFactors
  ): PersonalizedRecommendation {
    let personalized_version = recommendation;
    const cultural_adaptations: string[] = [];

    // Get cultural meal timings
    const meal_timings = this.culturalBuilder.getCulturalMealTimings(factors.cultural_context);

    // Adapt meal timing recommendations
    if (/breakfast|morning meal/i.test(recommendation)) {
      personalized_version = personalized_version.replace(
        /\d{1,2}:\d{2}\s*(AM|PM)?/gi,
        meal_timings.breakfast
      );
      cultural_adaptations.push(`Adjusted breakfast timing to ${meal_timings.breakfast}`);
    }

    if (/lunch|midday meal/i.test(recommendation)) {
      personalized_version = personalized_version.replace(
        /\d{1,2}:\d{2}\s*(AM|PM)?/gi,
        meal_timings.lunch
      );
      cultural_adaptations.push(`Adjusted lunch timing to ${meal_timings.lunch}`);
    }

    if (/dinner|evening meal/i.test(recommendation)) {
      personalized_version = personalized_version.replace(
        /\d{1,2}:\d{2}\s*(AM|PM)?/gi,
        meal_timings.dinner
      );
      cultural_adaptations.push(`Adjusted dinner timing to ${meal_timings.dinner}`);
    }

    return {
      original_recommendation: recommendation,
      personalized_version,
      personalization_factors: ['cultural_timing'],
      cultural_adaptations,
      dietary_modifications: [],
      confidence_score: 0.95,
      reasoning: "Adapted timing recommendations for cultural meal patterns",
    };
  }

  // Private helper methods

  private adaptExerciseRecommendations(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; adaptations: string[] } {
    let text = recommendation;
    let modified = false;
    const adaptations: string[] = [];

    if (
      recommendation.toLowerCase().includes("exercise") ||
      recommendation.toLowerCase().includes("physical activity")
    ) {
      const cultural_exercises = this.culturalBuilder.getCulturallyAppropriateExercises(
        factors.cultural_context
      );
      text += ` Consider ${cultural_exercises.join(", ")} which are popular in your region.`;
      adaptations.push("Added culturally appropriate exercise suggestions");
      modified = true;
    }

    // Add specific exercise recommendations based on region
    if (/walking|stroll/i.test(recommendation)) {
      const walking_suggestions = this.getWalkingSuggestions(factors.cultural_context.region);
      text += ` ${walking_suggestions}`;
      adaptations.push("Added culturally appropriate walking suggestions");
      modified = true;
    }

    return { text, modified, adaptations };
  }

  private adaptSleepRecommendations(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; adaptations: string[] } {
    let text = recommendation;
    let modified = false;
    const adaptations: string[] = [];

    if (/sleep|rest|bedtime/i.test(recommendation)) {
      const sleep_practices = this.getSleepPractices(factors.cultural_context.region);
      text += ` ${sleep_practices}`;
      adaptations.push("Added culturally appropriate sleep practices");
      modified = true;
    }

    return { text, modified, adaptations };
  }

  private adaptStressManagement(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; adaptations: string[] } {
    let text = recommendation;
    let modified = false;
    const adaptations: string[] = [];

    if (/stress|anxiety|tension|relax/i.test(recommendation)) {
      const stress_techniques = this.getStressTechniques(factors.cultural_context.region);
      text += ` ${stress_techniques}`;
      adaptations.push("Added culturally appropriate stress management techniques");
      modified = true;
    }

    return { text, modified, adaptations };
  }

  private addWorkLifeConsiderations(
    recommendation: string,
    factors: PersonalizationFactors
  ): { text: string; modified: boolean; adaptations: string[] } {
    let text = recommendation;
    let modified = false;
    const adaptations: string[] = [];

    // Add work schedule considerations
    if (/schedule|routine|timing/i.test(recommendation)) {
      const work_considerations = this.getWorkLifeConsiderations(factors.cultural_context.region);
      text += ` ${work_considerations}`;
      adaptations.push("Added work-life balance considerations");
      modified = true;
    }

    return { text, modified, adaptations };
  }

  private getCardioAlternatives(region: string): string[] {
    const alternatives: Record<string, string[]> = {
      chinese: ["brisk walking in parks", "Tai Chi forms", "dancing", "cycling"],
      southeast_asian: ["badminton", "swimming", "traditional dance", "walking"],
      western: ["jogging", "cycling", "swimming", "gym cardio machines"]
    };

    return alternatives[region] || alternatives["western"];
  }

  private getStrengthAlternatives(region: string): string[] {
    const alternatives: Record<string, string[]> = {
      chinese: ["Qigong exercises", "martial arts training", "bodyweight exercises"],
      southeast_asian: ["calisthenics", "traditional martial arts", "functional movements"],
      western: ["weight training", "resistance bands", "bodyweight exercises", "gym workouts"]
    };

    return alternatives[region] || alternatives["western"];
  }

  private getFlexibilityAlternatives(region: string): string[] {
    const alternatives: Record<string, string[]> = {
      chinese: ["Tai Chi", "Qigong stretching", "traditional Chinese exercises"],
      southeast_asian: ["yoga", "traditional stretching", "martial arts flexibility"],
      western: ["yoga", "Pilates", "stretching routines", "flexibility classes"]
    };

    return alternatives[region] || alternatives["western"];
  }

  private getMindfulnessAlternatives(region: string): string[] {
    const alternatives: Record<string, string[]> = {
      chinese: ["meditation", "Qigong meditation", "tea ceremony mindfulness"],
      southeast_asian: ["Buddhist meditation", "mindful walking", "breathing exercises"],
      western: ["mindfulness meditation", "guided meditation apps", "breathing techniques"]
    };

    return alternatives[region] || alternatives["western"];
  }

  private getWalkingSuggestions(region: string): string {
    const suggestions: Record<string, string> = {
      chinese: "Try walking in parks during morning hours when many people practice exercises together.",
      southeast_asian: "Consider walking in covered areas or malls during hot weather, or early morning/evening outdoors.",
      western: "Use walking apps or join walking groups for motivation and social connection."
    };

    return suggestions[region] || suggestions["western"];
  }

  private getSleepPractices(region: string): string {
    const practices: Record<string, string> = {
      chinese: "Consider traditional practices like foot soaking before bed and maintaining room temperature for optimal Yin nourishment.",
      southeast_asian: "Use natural ventilation when possible and consider traditional relaxation techniques before sleep.",
      western: "Maintain consistent sleep schedule and consider sleep hygiene practices like limiting screen time before bed."
    };

    return practices[region] || practices["western"];
  }

  private getStressTechniques(region: string): string {
    const techniques: Record<string, string> = {
      chinese: "Try traditional techniques like Qigong breathing, tea meditation, or gentle self-massage.",
      southeast_asian: "Consider community activities, traditional music, or spending time in nature for stress relief.",
      western: "Use evidence-based techniques like progressive muscle relaxation, mindfulness apps, or regular exercise."
    };

    return techniques[region] || techniques["western"];
  }

  private getWorkLifeConsiderations(region: string): string {
    const considerations: Record<string, string> = {
      chinese: "Consider integrating short Qigong breaks during work hours and maintaining harmony between work and rest.",
      southeast_asian: "Balance individual practice with family time and community activities.",
      western: "Schedule specific times for health practices and treat them as important appointments."
    };

    return considerations[region] || considerations["western"];
  }
}