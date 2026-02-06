/**
 * Learning Profile Manager - Manages user learning profiles and feedback
 *
 * Tracks user preferences, treatment outcomes, and feedback to continuously
 * improve personalization accuracy and recommendation effectiveness.
 */

import { LearningProfile, FeedbackData } from "../interfaces/PersonalizationInterfaces";
import { devLog, logError } from "../../systemLogger";

export class LearningProfileManager {
  private readonly context = "LearningProfileManager";
  private learningProfiles: Map<string, LearningProfile> = new Map();

  /**
   * Get or create learning profile for user
   */
  public async getLearningProfile(userId: string): Promise<LearningProfile> {
    let profile = this.learningProfiles.get(userId);

    if (!profile) {
      profile = this.createDefaultProfile(userId);
      this.learningProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Update learning profile based on user feedback
   */
  public async updateLearningProfile(userId: string, feedback: FeedbackData): Promise<void> {
    try {
      let profile = await this.getLearningProfile(userId);

      // Update preference weights based on effectiveness ratings
      this.updatePreferenceWeights(profile, feedback.effectiveness_ratings);

      // Track successful patterns
      this.trackSuccessfulPatterns(profile, feedback);

      // Track avoided recommendations
      this.trackAvoidedRecommendations(profile, feedback);

      // Update response patterns
      this.updateResponsePatterns(profile, feedback);

      profile.last_updated = new Date();
      this.learningProfiles.set(userId, profile);

      devLog("info", this.context, "Updated learning profile", { userId, feedback });
    } catch (error) {
      logError(this.context, "Failed to update learning profile", { error, userId });
    }
  }

  /**
   * Get personalized weights for recommendation categories
   */
  public getPersonalizedWeights(userId: string): Promise<Record<string, number>> {
    const profile = this.learningProfiles.get(userId);

    if (!profile) {
      return Promise.resolve(this.getDefaultWeights());
    }

    return Promise.resolve(profile.preference_weights);
  }

  /**
   * Get successful recommendation patterns for user
   */
  public getSuccessfulPatterns(userId: string): string[] {
    const profile = this.learningProfiles.get(userId);
    return profile?.successful_patterns || [];
  }

  /**
   * Get avoided recommendation patterns for user
   */
  public getAvoidedPatterns(userId: string): string[] {
    const profile = this.learningProfiles.get(userId);
    return profile?.avoided_recommendations || [];
  }

  /**
   * Get optimal communication style for user
   */
  public getOptimalCommunicationStyle(userId: string): {
    style: string;
    complexity_level: string;
    effective_types: string[];
  } {
    const profile = this.learningProfiles.get(userId);

    if (!profile) {
      return {
        style: "balanced",
        complexity_level: "intermediate",
        effective_types: [],
      };
    }

    return {
      style: profile.response_patterns.preferred_communication_style,
      complexity_level: profile.response_patterns.optimal_complexity_level,
      effective_types: profile.response_patterns.effective_recommendation_types,
    };
  }

  /**
   * Analyze learning trends across all users
   */
  public analyzeLearningTrends(): {
    most_effective_categories: Array<{ category: string; success_rate: number }>;
    common_successful_patterns: string[];
    common_avoided_patterns: string[];
    communication_preferences: Record<string, number>;
  } {
    const all_profiles = Array.from(this.learningProfiles.values());

    if (all_profiles.length === 0) {
      return {
        most_effective_categories: [],
        common_successful_patterns: [],
        common_avoided_patterns: [],
        communication_preferences: {},
      };
    }

    // Analyze category effectiveness
    const category_scores: Record<string, number[]> = {};
    for (const profile of all_profiles) {
      for (const [category, weight] of Object.entries(profile.preference_weights)) {
        if (!category_scores[category]) {
          category_scores[category] = [];
        }
        category_scores[category].push(weight);
      }
    }

    const most_effective_categories = Object.entries(category_scores)
      .map(([category, scores]) => ({
        category,
        success_rate: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      }))
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5);

    // Find common patterns
    const all_successful = all_profiles.flatMap((p) => p.successful_patterns);
    const all_avoided = all_profiles.flatMap((p) => p.avoided_recommendations);

    const common_successful_patterns = this.findCommonPatterns(all_successful);
    const common_avoided_patterns = this.findCommonPatterns(all_avoided);

    // Analyze communication preferences
    const communication_counts: Record<string, number> = {};
    for (const profile of all_profiles) {
      const style = profile.response_patterns.preferred_communication_style;
      communication_counts[style] = (communication_counts[style] || 0) + 1;
    }

    return {
      most_effective_categories,
      common_successful_patterns,
      common_avoided_patterns,
      communication_preferences: communication_counts,
    };
  }

  /**
   * Export learning profile for backup or analysis
   */
  public exportLearningProfile(userId: string): LearningProfile | null {
    return this.learningProfiles.get(userId) || null;
  }

  /**
   * Import learning profile from backup
   */
  public importLearningProfile(profile: LearningProfile): void {
    this.learningProfiles.set(profile.user_id, profile);
  }

  /**
   * Clear learning profile for user
   */
  public clearLearningProfile(userId: string): void {
    this.learningProfiles.delete(userId);
  }

  // Private helper methods

  private createDefaultProfile(userId: string): LearningProfile {
    return {
      user_id: userId,
      preference_weights: this.getDefaultWeights(),
      successful_patterns: [],
      avoided_recommendations: [],
      response_patterns: {
        preferred_communication_style: "balanced",
        effective_recommendation_types: [],
        optimal_complexity_level: "intermediate",
      },
      last_updated: new Date(),
    };
  }

  private getDefaultWeights(): Record<string, number> {
    return {
      dietary: 0.0,
      lifestyle: 0.0,
      herbal: 0.0,
      wellness: 0.0,
      exercise: 0.0,
      sleep: 0.0,
      stress_management: 0.0,
      seasonal: 0.0,
    };
  }

  private updatePreferenceWeights(
    profile: LearningProfile,
    effectiveness_ratings: Record<string, number>
  ): void {
    for (const [recommendation, rating] of Object.entries(effectiveness_ratings)) {
      const category = this.categorizeRecommendation(recommendation);
      const weight_change = (rating - 3) * 0.1; // Scale: 1-5, neutral = 3

      profile.preference_weights[category] =
        (profile.preference_weights[category] || 0) + weight_change;

      // Keep weights within reasonable bounds
      profile.preference_weights[category] = Math.max(
        -2.0,
        Math.min(2.0, profile.preference_weights[category])
      );
    }
  }

  private trackSuccessfulPatterns(profile: LearningProfile, feedback: FeedbackData): void {
    const highly_rated = Object.entries(feedback.effectiveness_ratings)
      .filter(([_, rating]) => rating >= 4)
      .map(([rec, _]) => rec);

    // Add new successful patterns
    for (const pattern of highly_rated) {
      if (!profile.successful_patterns.includes(pattern)) {
        profile.successful_patterns.push(pattern);
      }
    }

    // Limit the number of tracked patterns
    if (profile.successful_patterns.length > 50) {
      profile.successful_patterns = profile.successful_patterns.slice(-50);
    }
  }

  private trackAvoidedRecommendations(profile: LearningProfile, feedback: FeedbackData): void {
    const poorly_rated = Object.entries(feedback.effectiveness_ratings)
      .filter(([_, rating]) => rating <= 2)
      .map(([rec, _]) => rec);

    // Add new avoided patterns
    for (const pattern of poorly_rated) {
      if (!profile.avoided_recommendations.includes(pattern)) {
        profile.avoided_recommendations.push(pattern);
      }
    }

    // Limit the number of tracked patterns
    if (profile.avoided_recommendations.length > 30) {
      profile.avoided_recommendations = profile.avoided_recommendations.slice(-30);
    }
  }

  private updateResponsePatterns(profile: LearningProfile, feedback: FeedbackData): void {
    // Update effective recommendation types
    const effective_types = Object.entries(feedback.effectiveness_ratings)
      .filter(([_, rating]) => rating >= 4)
      .map(([rec, _]) => this.categorizeRecommendation(rec));

    for (const type of effective_types) {
      if (!profile.response_patterns.effective_recommendation_types.includes(type)) {
        profile.response_patterns.effective_recommendation_types.push(type);
      }
    }

    // Limit tracked types
    if (profile.response_patterns.effective_recommendation_types.length > 10) {
      profile.response_patterns.effective_recommendation_types =
        profile.response_patterns.effective_recommendation_types.slice(-10);
    }

    // Update communication style based on feedback patterns
    this.updateCommunicationStyle(profile, feedback);
  }

  private updateCommunicationStyle(profile: LearningProfile, feedback: FeedbackData): void {
    // Analyze feedback patterns to infer communication preferences
    const total_ratings = Object.values(feedback.effectiveness_ratings);
    const avg_rating = total_ratings.reduce((sum, r) => sum + r, 0) / total_ratings.length;

    // If consistently high ratings, user might prefer current style
    if (avg_rating >= 4.0) {
      // Keep current style
      return;
    }

    // If low ratings, might need to adjust complexity or style
    if (avg_rating <= 2.5) {
      // Cycle through different approaches
      const styles = ["detailed", "concise", "visual"];
      const current_index = styles.indexOf(profile.response_patterns.preferred_communication_style);
      const next_index = (current_index + 1) % styles.length;
      profile.response_patterns.preferred_communication_style = styles[next_index];
    }
  }

  private categorizeRecommendation(recommendation: string): string {
    if (/food|eat|diet|meal|nutrition/i.test(recommendation)) return "dietary";
    if (/exercise|activity|movement|physical/i.test(recommendation)) return "exercise";
    if (/herb|medicine|formula|supplement/i.test(recommendation)) return "herbal";
    if (/sleep|rest|bedtime|nap/i.test(recommendation)) return "sleep";
    if (/stress|relax|meditation|calm/i.test(recommendation)) return "stress_management";
    if (/season|weather|climate/i.test(recommendation)) return "seasonal";
    if (/lifestyle|routine|habit|daily/i.test(recommendation)) return "lifestyle";
    return "wellness";
  }

  private findCommonPatterns(patterns: string[]): string[] {
    const pattern_counts: Record<string, number> = {};

    for (const pattern of patterns) {
      pattern_counts[pattern] = (pattern_counts[pattern] || 0) + 1;
    }

    return Object.entries(pattern_counts)
      .filter(([_, count]) => count >= 2) // Appears at least twice
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pattern, _]) => pattern);
  }
}
