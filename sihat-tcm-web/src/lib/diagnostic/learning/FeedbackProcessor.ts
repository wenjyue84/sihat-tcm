/**
 * Feedback Processor - Processes user feedback for diagnostic improvement
 * 
 * Handles user feedback on diagnostic accuracy and recommendation effectiveness
 * to continuously improve the diagnostic system performance.
 */

import { devLog, logError } from "../../systemLogger";

export interface DiagnosticFeedback {
  userId: string;
  sessionId: string;
  diagnosisAccuracy: number; // 1-5 scale
  recommendationEffectiveness: Record<string, number>; // recommendation -> rating
  sideEffects?: string[];
  userSatisfaction: number; // 1-5 scale
  additionalComments?: string;
  timestamp: Date;
}

export interface FeedbackAnalysis {
  averageDiagnosisAccuracy: number;
  averageRecommendationEffectiveness: number;
  averageUserSatisfaction: number;
  commonSideEffects: Array<{ effect: string; frequency: number }>;
  improvementAreas: string[];
  positivePatterns: string[];
}

export class FeedbackProcessor {
  private context: string;
  private feedbackHistory: DiagnosticFeedback[] = [];
  private readonly maxHistorySize = 5000;

  constructor(context: string = "FeedbackProcessor") {
    this.context = context;
  }

  /**
   * Process new user feedback
   */
  async processFeedback(feedback: DiagnosticFeedback): Promise<void> {
    try {
      // Validate feedback
      this.validateFeedback(feedback);

      // Add timestamp if not present
      if (!feedback.timestamp) {
        feedback.timestamp = new Date();
      }

      // Store feedback
      this.feedbackHistory.push(feedback);

      // Maintain history size limit
      if (this.feedbackHistory.length > this.maxHistorySize) {
        this.feedbackHistory = this.feedbackHistory.slice(-this.maxHistorySize);
      }

      // Analyze feedback for immediate insights
      const analysis = this.analyzeFeedback(feedback);

      devLog("info", this.context, "Feedback processed", {
        userId: feedback.userId,
        sessionId: feedback.sessionId,
        diagnosisAccuracy: feedback.diagnosisAccuracy,
        userSatisfaction: feedback.userSatisfaction,
        analysis,
      });

      // Trigger learning updates if needed
      await this.updateLearningFromFeedback(feedback);

    } catch (error) {
      logError(this.context, "Failed to process feedback", { error, feedback });
      throw error;
    }
  }

  /**
   * Get comprehensive feedback analysis
   */
  getFeedbackAnalysis(timeframe?: { start: Date; end: Date }): FeedbackAnalysis {
    let relevantFeedback = this.feedbackHistory;

    // Filter by timeframe if provided
    if (timeframe) {
      relevantFeedback = this.feedbackHistory.filter(
        f => f.timestamp >= timeframe.start && f.timestamp <= timeframe.end
      );
    }

    if (relevantFeedback.length === 0) {
      return {
        averageDiagnosisAccuracy: 0,
        averageRecommendationEffectiveness: 0,
        averageUserSatisfaction: 0,
        commonSideEffects: [],
        improvementAreas: [],
        positivePatterns: [],
      };
    }

    // Calculate averages
    const totalDiagnosisAccuracy = relevantFeedback.reduce(
      (sum, f) => sum + f.diagnosisAccuracy, 0
    );
    const averageDiagnosisAccuracy = totalDiagnosisAccuracy / relevantFeedback.length;

    const totalUserSatisfaction = relevantFeedback.reduce(
      (sum, f) => sum + f.userSatisfaction, 0
    );
    const averageUserSatisfaction = totalUserSatisfaction / relevantFeedback.length;

    // Calculate recommendation effectiveness
    const allRecommendationRatings: number[] = [];
    for (const feedback of relevantFeedback) {
      allRecommendationRatings.push(...Object.values(feedback.recommendationEffectiveness));
    }
    const averageRecommendationEffectiveness = allRecommendationRatings.length > 0
      ? allRecommendationRatings.reduce((sum, rating) => sum + rating, 0) / allRecommendationRatings.length
      : 0;

    // Analyze side effects
    const sideEffectCounts: Record<string, number> = {};
    for (const feedback of relevantFeedback) {
      if (feedback.sideEffects) {
        for (const effect of feedback.sideEffects) {
          sideEffectCounts[effect] = (sideEffectCounts[effect] || 0) + 1;
        }
      }
    }

    const commonSideEffects = Object.entries(sideEffectCounts)
      .map(([effect, frequency]) => ({ effect, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Identify improvement areas
    const improvementAreas = this.identifyImprovementAreas(relevantFeedback);

    // Identify positive patterns
    const positivePatterns = this.identifyPositivePatterns(relevantFeedback);

    return {
      averageDiagnosisAccuracy,
      averageRecommendationEffectiveness,
      averageUserSatisfaction,
      commonSideEffects,
      improvementAreas,
      positivePatterns,
    };
  }

  /**
   * Get feedback trends over time
   */
  getFeedbackTrends(days: number = 30): {
    dailyAverages: Array<{
      date: string;
      diagnosisAccuracy: number;
      userSatisfaction: number;
      feedbackCount: number;
    }>;
    overallTrend: 'improving' | 'stable' | 'declining';
  } {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyData: Record<string, {
      diagnosisAccuracy: number[];
      userSatisfaction: number[];
    }> = {};

    // Group feedback by day
    for (const feedback of this.feedbackHistory) {
      if (feedback.timestamp >= startDate && feedback.timestamp <= endDate) {
        const dateKey = feedback.timestamp.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            diagnosisAccuracy: [],
            userSatisfaction: [],
          };
        }
        
        dailyData[dateKey].diagnosisAccuracy.push(feedback.diagnosisAccuracy);
        dailyData[dateKey].userSatisfaction.push(feedback.userSatisfaction);
      }
    }

    // Calculate daily averages
    const dailyAverages = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        diagnosisAccuracy: data.diagnosisAccuracy.reduce((sum, val) => sum + val, 0) / data.diagnosisAccuracy.length,
        userSatisfaction: data.userSatisfaction.reduce((sum, val) => sum + val, 0) / data.userSatisfaction.length,
        feedbackCount: data.diagnosisAccuracy.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Determine overall trend
    let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (dailyAverages.length >= 7) {
      const recent = dailyAverages.slice(-7);
      const older = dailyAverages.slice(0, 7);
      
      const recentAvg = recent.reduce((sum, day) => sum + day.diagnosisAccuracy, 0) / recent.length;
      const olderAvg = older.reduce((sum, day) => sum + day.diagnosisAccuracy, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.05) {
        overallTrend = 'improving';
      } else if (recentAvg < olderAvg * 0.95) {
        overallTrend = 'declining';
      }
    }

    return {
      dailyAverages,
      overallTrend,
    };
  }

  /**
   * Get user-specific feedback patterns
   */
  getUserFeedbackPattern(userId: string): {
    feedbackCount: number;
    averageRatings: {
      diagnosisAccuracy: number;
      userSatisfaction: number;
    };
    improvementTrend: 'improving' | 'stable' | 'declining';
    lastFeedbackDate?: Date;
  } {
    const userFeedback = this.feedbackHistory.filter(f => f.userId === userId);
    
    if (userFeedback.length === 0) {
      return {
        feedbackCount: 0,
        averageRatings: {
          diagnosisAccuracy: 0,
          userSatisfaction: 0,
        },
        improvementTrend: 'stable',
      };
    }

    const averageRatings = {
      diagnosisAccuracy: userFeedback.reduce((sum, f) => sum + f.diagnosisAccuracy, 0) / userFeedback.length,
      userSatisfaction: userFeedback.reduce((sum, f) => sum + f.userSatisfaction, 0) / userFeedback.length,
    };

    // Determine improvement trend
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (userFeedback.length >= 3) {
      const recent = userFeedback.slice(-2);
      const older = userFeedback.slice(0, -2);
      
      const recentAvg = recent.reduce((sum, f) => sum + f.diagnosisAccuracy, 0) / recent.length;
      const olderAvg = older.reduce((sum, f) => sum + f.diagnosisAccuracy, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) {
        improvementTrend = 'improving';
      } else if (recentAvg < olderAvg * 0.9) {
        improvementTrend = 'declining';
      }
    }

    return {
      feedbackCount: userFeedback.length,
      averageRatings,
      improvementTrend,
      lastFeedbackDate: userFeedback[userFeedback.length - 1]?.timestamp,
    };
  }

  // Private helper methods

  private validateFeedback(feedback: DiagnosticFeedback): void {
    if (!feedback.userId || !feedback.sessionId) {
      throw new Error("Missing required feedback fields: userId and sessionId");
    }

    if (feedback.diagnosisAccuracy < 1 || feedback.diagnosisAccuracy > 5) {
      throw new Error("Diagnosis accuracy must be between 1 and 5");
    }

    if (feedback.userSatisfaction < 1 || feedback.userSatisfaction > 5) {
      throw new Error("User satisfaction must be between 1 and 5");
    }

    // Validate recommendation effectiveness ratings
    for (const [recommendation, rating] of Object.entries(feedback.recommendationEffectiveness)) {
      if (rating < 1 || rating > 5) {
        throw new Error(`Recommendation effectiveness rating for "${recommendation}" must be between 1 and 5`);
      }
    }
  }

  private analyzeFeedback(feedback: DiagnosticFeedback): any {
    return {
      isPositive: feedback.diagnosisAccuracy >= 4 && feedback.userSatisfaction >= 4,
      hasIssues: feedback.diagnosisAccuracy <= 2 || feedback.userSatisfaction <= 2,
      hasSideEffects: Boolean(feedback.sideEffects && feedback.sideEffects.length > 0),
      recommendationCount: Object.keys(feedback.recommendationEffectiveness).length,
    };
  }

  private async updateLearningFromFeedback(feedback: DiagnosticFeedback): Promise<void> {
    // This would integrate with the personalization engine's learning system
    // For now, just log the intent
    devLog("info", this.context, "Learning update triggered by feedback", {
      userId: feedback.userId,
      sessionId: feedback.sessionId,
    });
  }

  private identifyImprovementAreas(feedback: DiagnosticFeedback[]): string[] {
    const areas: string[] = [];

    // Check for low diagnosis accuracy
    const lowAccuracyCount = feedback.filter(f => f.diagnosisAccuracy <= 2).length;
    if (lowAccuracyCount > feedback.length * 0.2) {
      areas.push("Diagnosis accuracy needs improvement");
    }

    // Check for low user satisfaction
    const lowSatisfactionCount = feedback.filter(f => f.userSatisfaction <= 2).length;
    if (lowSatisfactionCount > feedback.length * 0.2) {
      areas.push("User experience needs enhancement");
    }

    // Check for common side effects
    const sideEffectCount = feedback.filter(f => f.sideEffects && f.sideEffects.length > 0).length;
    if (sideEffectCount > feedback.length * 0.3) {
      areas.push("Recommendation safety needs review");
    }

    return areas;
  }

  private identifyPositivePatterns(feedback: DiagnosticFeedback[]): string[] {
    const patterns: string[] = [];

    // Check for high accuracy
    const highAccuracyCount = feedback.filter(f => f.diagnosisAccuracy >= 4).length;
    if (highAccuracyCount > feedback.length * 0.7) {
      patterns.push("Consistently high diagnosis accuracy");
    }

    // Check for high satisfaction
    const highSatisfactionCount = feedback.filter(f => f.userSatisfaction >= 4).length;
    if (highSatisfactionCount > feedback.length * 0.7) {
      patterns.push("High user satisfaction levels");
    }

    // Check for effective recommendations
    const effectiveRecommendations = feedback.filter(f => {
      const avgEffectiveness = Object.values(f.recommendationEffectiveness)
        .reduce((sum, rating) => sum + rating, 0) / Object.values(f.recommendationEffectiveness).length;
      return avgEffectiveness >= 4;
    }).length;

    if (effectiveRecommendations > feedback.length * 0.6) {
      patterns.push("Recommendations are generally effective");
    }

    return patterns;
  }
}