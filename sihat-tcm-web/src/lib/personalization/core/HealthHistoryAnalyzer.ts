/**
 * Health History Analyzer - Analyzes user health history for personalization
 *
 * Extracts patterns and insights from user's diagnosis history to inform
 * personalized recommendations and treatment approaches.
 */

import { DiagnosisSession } from "@/types/database";
import { PersonalizationFactors, TreatmentOutcome } from "../interfaces/PersonalizationInterfaces";

export class HealthHistoryAnalyzer {
  private readonly context = "HealthHistoryAnalyzer";

  /**
   * Extract health history from diagnosis sessions
   */
  public extractHealthHistory(
    sessions: DiagnosisSession[]
  ): PersonalizationFactors["health_history"] {
    const previous_diagnoses = sessions.map((s) => s.primary_diagnosis).filter(Boolean);
    const constitution_patterns = sessions.map((s) => s.constitution).filter(Boolean) as string[];

    // Extract treatment outcomes from session notes and reports
    const treatment_outcomes: TreatmentOutcome[] = sessions.map((session) => ({
      diagnosis: session.primary_diagnosis,
      recommendations_followed: [], // Would need to be tracked separately
      effectiveness_rating: session.overall_score || 3,
      duration_followed: 0, // Would need to be tracked separately
      timestamp: new Date(session.created_at),
    }));

    return {
      previous_diagnoses,
      treatment_outcomes,
      constitution_patterns,
      seasonal_variations: this.analyzeSeasonalPatterns(sessions),
    };
  }

  /**
   * Analyze seasonal patterns in health issues
   */
  public analyzeSeasonalPatterns(sessions: DiagnosisSession[]): Record<string, any> {
    const seasonal_data: Record<string, any> = {
      spring: { diagnoses: [], symptoms: [], constitution_trends: [] },
      summer: { diagnoses: [], symptoms: [], constitution_trends: [] },
      autumn: { diagnoses: [], symptoms: [], constitution_trends: [] },
      winter: { diagnoses: [], symptoms: [], constitution_trends: [] },
    };

    for (const session of sessions) {
      const date = new Date(session.created_at);
      const month = date.getMonth();

      let season = "spring";
      if (month >= 5 && month <= 7) season = "summer";
      else if (month >= 8 && month <= 10) season = "autumn";
      else if (month >= 11 || month <= 1) season = "winter";

      if (session.primary_diagnosis) {
        seasonal_data[season].diagnoses.push(session.primary_diagnosis);
      }

      if (session.constitution) {
        seasonal_data[season].constitution_trends.push(session.constitution);
      }
    }

    // Analyze patterns
    for (const season of Object.keys(seasonal_data)) {
      const data = seasonal_data[season];

      // Find most common diagnoses
      const diagnosis_counts = this.countOccurrences(data.diagnoses);
      data.common_diagnoses = Object.entries(diagnosis_counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([diagnosis]) => diagnosis);

      // Find most common constitution patterns
      const constitution_counts = this.countOccurrences(data.constitution_trends);
      data.common_constitutions = Object.entries(constitution_counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([constitution]) => constitution);
    }

    return seasonal_data;
  }

  /**
   * Identify recurring health patterns
   */
  public identifyRecurringPatterns(sessions: DiagnosisSession[]): {
    recurring_diagnoses: Array<{ diagnosis: string; frequency: number; last_occurrence: Date }>;
    constitution_stability: {
      primary_constitution: string;
      stability_score: number; // 0-1, higher = more stable
      variations: string[];
    };
    symptom_clusters: Array<{ symptoms: string[]; frequency: number }>;
  } {
    // Analyze recurring diagnoses
    const diagnosis_counts = this.countOccurrences(
      sessions.map((s) => s.primary_diagnosis).filter(Boolean)
    );

    const recurring_diagnoses = Object.entries(diagnosis_counts)
      .filter(([, count]) => count > 1)
      .map(([diagnosis, frequency]) => {
        const last_session = sessions
          .filter((s) => s.primary_diagnosis === diagnosis)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          diagnosis,
          frequency,
          last_occurrence: new Date(last_session.created_at),
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    // Analyze constitution stability
    const constitutions = sessions.map((s) => s.constitution).filter(Boolean) as string[];
    const constitution_counts = this.countOccurrences(constitutions);
    const primary_constitution =
      Object.entries(constitution_counts).sort(([, a], [, b]) => b - a)[0]?.[0] || "unknown";

    const stability_score =
      constitutions.length > 0
        ? (constitution_counts[primary_constitution] || 0) / constitutions.length
        : 0;

    const constitution_stability = {
      primary_constitution,
      stability_score,
      variations: Object.keys(constitution_counts).filter((c) => c !== primary_constitution),
    };

    return {
      recurring_diagnoses,
      constitution_stability,
      symptom_clusters: [], // Would need symptom data to implement
    };
  }

  /**
   * Analyze treatment effectiveness patterns
   */
  public analyzeTreatmentEffectiveness(treatment_outcomes: TreatmentOutcome[]): {
    most_effective_categories: string[];
    least_effective_categories: string[];
    average_effectiveness: number;
    improvement_trends: {
      improving: boolean;
      trend_direction: "up" | "down" | "stable";
      confidence: number;
    };
  } {
    if (treatment_outcomes.length === 0) {
      return {
        most_effective_categories: [],
        least_effective_categories: [],
        average_effectiveness: 0,
        improvement_trends: {
          improving: false,
          trend_direction: "stable",
          confidence: 0,
        },
      };
    }

    // Calculate average effectiveness
    const total_effectiveness = treatment_outcomes.reduce(
      (sum, outcome) => sum + outcome.effectiveness_rating,
      0
    );
    const average_effectiveness = total_effectiveness / treatment_outcomes.length;

    // Categorize treatments and analyze effectiveness
    const category_effectiveness: Record<string, number[]> = {};

    for (const outcome of treatment_outcomes) {
      const category = this.categorizeRecommendation(outcome.diagnosis);
      if (!category_effectiveness[category]) {
        category_effectiveness[category] = [];
      }
      category_effectiveness[category].push(outcome.effectiveness_rating);
    }

    // Calculate average effectiveness per category
    const category_averages = Object.entries(category_effectiveness)
      .map(([category, ratings]) => ({
        category,
        average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      }))
      .sort((a, b) => b.average - a.average);

    const most_effective_categories = category_averages
      .filter((c) => c.average > average_effectiveness)
      .slice(0, 3)
      .map((c) => c.category);

    const least_effective_categories = category_averages
      .filter((c) => c.average < average_effectiveness)
      .slice(-3)
      .map((c) => c.category);

    // Analyze improvement trends
    const recent_outcomes = treatment_outcomes
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    const improvement_trends = this.calculateImprovementTrend(recent_outcomes);

    return {
      most_effective_categories,
      least_effective_categories,
      average_effectiveness,
      improvement_trends,
    };
  }

  /**
   * Get personalized risk factors based on history
   */
  public getPersonalizedRiskFactors(sessions: DiagnosisSession[]): {
    high_risk_conditions: string[];
    seasonal_vulnerabilities: Record<string, string[]>;
    constitution_related_risks: string[];
    preventive_recommendations: string[];
  } {
    const patterns = this.identifyRecurringPatterns(sessions);
    const seasonal_patterns = this.analyzeSeasonalPatterns(sessions);

    // Identify high-risk conditions based on recurrence
    const high_risk_conditions = patterns.recurring_diagnoses
      .filter((d) => d.frequency >= 2)
      .map((d) => d.diagnosis);

    // Identify seasonal vulnerabilities
    const seasonal_vulnerabilities: Record<string, string[]> = {};
    for (const [season, data] of Object.entries(seasonal_patterns)) {
      if (data.common_diagnoses && data.common_diagnoses.length > 0) {
        seasonal_vulnerabilities[season] = data.common_diagnoses;
      }
    }

    // Constitution-related risks
    const constitution_related_risks = this.getConstitutionRisks(
      patterns.constitution_stability.primary_constitution
    );

    // Generate preventive recommendations
    const preventive_recommendations = this.generatePreventiveRecommendations(
      high_risk_conditions,
      seasonal_vulnerabilities,
      constitution_related_risks
    );

    return {
      high_risk_conditions,
      seasonal_vulnerabilities,
      constitution_related_risks,
      preventive_recommendations,
    };
  }

  // Private helper methods

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce(
      (counts, item) => {
        counts[item] = (counts[item] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
  }

  private categorizeRecommendation(diagnosis: string): string {
    if (/digestive|spleen|stomach/i.test(diagnosis)) return "digestive";
    if (/respiratory|lung|cough/i.test(diagnosis)) return "respiratory";
    if (/emotional|liver|stress/i.test(diagnosis)) return "emotional";
    if (/kidney|urinary|reproductive/i.test(diagnosis)) return "kidney";
    if (/heart|circulation|blood/i.test(diagnosis)) return "cardiovascular";
    return "general";
  }

  private calculateImprovementTrend(recent_outcomes: TreatmentOutcome[]): {
    improving: boolean;
    trend_direction: "up" | "down" | "stable";
    confidence: number;
  } {
    if (recent_outcomes.length < 3) {
      return {
        improving: false,
        trend_direction: "stable",
        confidence: 0,
      };
    }

    // Calculate trend using simple linear regression
    const ratings = recent_outcomes.map((o) => o.effectiveness_rating);
    const n = ratings.length;
    const x_values = Array.from({ length: n }, (_, i) => i);

    const sum_x = x_values.reduce((sum, x) => sum + x, 0);
    const sum_y = ratings.reduce((sum, y) => sum + y, 0);
    const sum_xy = x_values.reduce((sum, x, i) => sum + x * ratings[i], 0);
    const sum_x2 = x_values.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);

    let trend_direction: "up" | "down" | "stable" = "stable";
    if (Math.abs(slope) > 0.1) {
      trend_direction = slope > 0 ? "up" : "down";
    }

    const improving = slope > 0;
    const confidence = Math.min(Math.abs(slope), 1);

    return {
      improving,
      trend_direction,
      confidence,
    };
  }

  private getConstitutionRisks(constitution: string): string[] {
    const constitution_risks: Record<string, string[]> = {
      yang_deficiency: [
        "Cold-related conditions",
        "Digestive weakness",
        "Low energy and fatigue",
        "Poor circulation",
      ],
      yin_deficiency: [
        "Heat-related symptoms",
        "Insomnia and restlessness",
        "Dry skin and mucous membranes",
        "Emotional volatility",
      ],
      qi_deficiency: [
        "Chronic fatigue",
        "Digestive issues",
        "Frequent infections",
        "Poor recovery from illness",
      ],
      blood_stasis: [
        "Circulation problems",
        "Pain conditions",
        "Skin issues",
        "Emotional stagnation",
      ],
    };

    return constitution_risks[constitution] || [];
  }

  private generatePreventiveRecommendations(
    high_risk_conditions: string[],
    seasonal_vulnerabilities: Record<string, string[]>,
    constitution_risks: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on recurring conditions
    if (high_risk_conditions.length > 0) {
      recommendations.push(
        "Monitor early warning signs of recurring conditions",
        "Maintain consistent preventive care routine"
      );
    }

    // Seasonal recommendations
    if (Object.keys(seasonal_vulnerabilities).length > 0) {
      recommendations.push(
        "Adjust lifestyle and diet according to seasonal patterns",
        "Increase preventive measures during vulnerable seasons"
      );
    }

    // Constitution-based recommendations
    if (constitution_risks.length > 0) {
      recommendations.push(
        "Follow constitution-specific lifestyle guidelines",
        "Regular constitution-balancing treatments"
      );
    }

    return recommendations;
  }
}
