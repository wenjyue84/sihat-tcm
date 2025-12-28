/**
 * Data Analyzer - Analyzes health data for insights and patterns
 * 
 * Provides analysis capabilities for various types of health data including
 * sensor data, wearable data, and health app data to generate meaningful insights.
 */

import { HealthDataPoint, HealthSummary, AggregatedHealthData } from '../interfaces/DeviceInterfaces';

export class DataAnalyzer {
  private readonly context = 'DataAnalyzer';

  /**
   * Analyze health data point
   */
  public async analyzeHealthData(dataType: string, data: HealthDataPoint): Promise<any> {
    console.log(`[${this.context}] Analyzing ${dataType} data`);

    switch (dataType) {
      case 'heart_rate':
        return this.analyzeHeartRate(data);
      case 'steps':
        return this.analyzeSteps(data);
      case 'sleep':
        return this.analyzeSleep(data);
      case 'weight':
        return this.analyzeWeight(data);
      case 'blood_pressure':
        return this.analyzeBloodPressure(data);
      case 'temperature':
        return this.analyzeTemperature(data);
      default:
        return this.analyzeGeneric(data);
    }
  }

  /**
   * Generate comprehensive health summary
   */
  public async generateHealthSummary(data: AggregatedHealthData): Promise<HealthSummary> {
    const summary: HealthSummary = {
      averageHeartRate: 0,
      dailyStepsAverage: 0,
      sleepQuality: 'unknown',
      activityLevel: 'unknown',
      trends: {},
    };

    // Calculate average heart rate
    if (data.heartRate && data.heartRate.length > 0) {
      const totalHR = data.heartRate.reduce((sum, item) => sum + item.value, 0);
      summary.averageHeartRate = Math.round(totalHR / data.heartRate.length);
      
      // Analyze heart rate trends
      summary.trends.heartRate = this.analyzeHeartRateTrends(data.heartRate);
    }

    // Calculate average daily steps
    if (data.steps && data.steps.length > 0) {
      const totalSteps = data.steps.reduce((sum, item) => sum + item.value, 0);
      summary.dailyStepsAverage = Math.round(totalSteps / data.steps.length);
      
      // Analyze step trends
      summary.trends.steps = this.analyzeStepTrends(data.steps);
    }

    // Analyze sleep quality
    if (data.sleep && data.sleep.length > 0) {
      summary.sleepQuality = this.calculateSleepQuality(data.sleep);
      summary.trends.sleep = this.analyzeSleepTrends(data.sleep);
    }

    // Determine overall activity level
    summary.activityLevel = this.calculateActivityLevel(summary.dailyStepsAverage, data.sensorData);

    // Generate TCM-specific insights
    summary.tcmInsights = this.generateTCMInsights(summary, data);

    return summary;
  }

  /**
   * Analyze heart rate data
   */
  private analyzeHeartRate(data: HealthDataPoint): any {
    const { value } = data;
    
    let category = 'normal';
    let risk = 'low';
    
    if (value < 60) {
      category = 'bradycardia';
      risk = value < 50 ? 'high' : 'medium';
    } else if (value > 100) {
      category = 'tachycardia';
      risk = value > 120 ? 'high' : 'medium';
    }

    return {
      category,
      risk,
      recommendation: this.getHeartRateRecommendation(category, value),
      tcmInterpretation: this.getTCMHeartRateInterpretation(value),
    };
  }

  /**
   * Analyze steps data
   */
  private analyzeSteps(data: HealthDataPoint): any {
    const { value } = data;
    
    let activityLevel = 'sedentary';
    if (value > 10000) {
      activityLevel = 'active';
    } else if (value > 5000) {
      activityLevel = 'moderate';
    }

    return {
      activityLevel,
      recommendation: this.getStepsRecommendation(value),
      tcmInterpretation: this.getTCMActivityInterpretation(activityLevel),
    };
  }

  /**
   * Analyze sleep data
   */
  private analyzeSleep(data: HealthDataPoint): any {
    const { value } = data;
    
    let quality = 'poor';
    if (value >= 7 && value <= 9) {
      quality = 'good';
    } else if (value >= 6 && value < 7) {
      quality = 'fair';
    }

    return {
      quality,
      duration: value,
      recommendation: this.getSleepRecommendation(quality, value),
      tcmInterpretation: this.getTCMSleepInterpretation(quality, value),
    };
  }

  /**
   * Analyze weight data
   */
  private analyzeWeight(data: HealthDataPoint): any {
    const { value } = data;
    
    return {
      trend: 'stable', // Would need historical data for trend analysis
      recommendation: this.getWeightRecommendation(value),
      tcmInterpretation: this.getTCMWeightInterpretation(value),
    };
  }

  /**
   * Analyze blood pressure data
   */
  private analyzeBloodPressure(data: HealthDataPoint): any {
    const { value } = data;
    
    // Assuming value is an object with systolic and diastolic
    const systolic = value.systolic || value;
    const diastolic = value.diastolic || 0;
    
    let category = 'normal';
    if (systolic >= 140 || diastolic >= 90) {
      category = 'high';
    } else if (systolic >= 130 || diastolic >= 80) {
      category = 'elevated';
    }

    return {
      category,
      systolic,
      diastolic,
      recommendation: this.getBloodPressureRecommendation(category),
      tcmInterpretation: this.getTCMBloodPressureInterpretation(category, systolic),
    };
  }

  /**
   * Analyze temperature data
   */
  private analyzeTemperature(data: HealthDataPoint): any {
    const { value } = data;
    
    let category = 'normal';
    if (value > 37.5) {
      category = 'fever';
    } else if (value < 36.0) {
      category = 'hypothermia';
    }

    return {
      category,
      temperature: value,
      recommendation: this.getTemperatureRecommendation(category, value),
      tcmInterpretation: this.getTCMTemperatureInterpretation(category, value),
    };
  }

  /**
   * Analyze generic data
   */
  private analyzeGeneric(data: HealthDataPoint): any {
    return {
      type: data.type,
      value: data.value,
      timestamp: data.timestamp,
      recommendation: 'Monitor regularly for patterns',
    };
  }

  /**
   * Analyze heart rate trends
   */
  private analyzeHeartRateTrends(heartRateData: HealthDataPoint[]): any {
    if (heartRateData.length < 2) return { trend: 'insufficient_data' };

    const recent = heartRateData.slice(-7); // Last 7 days
    const older = heartRateData.slice(0, -7);

    if (older.length === 0) return { trend: 'insufficient_data' };

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;

    const change = recentAvg - olderAvg;
    let trend = 'stable';
    
    if (change > 5) {
      trend = 'increasing';
    } else if (change < -5) {
      trend = 'decreasing';
    }

    return {
      trend,
      change: Math.round(change),
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(olderAvg),
    };
  }

  /**
   * Analyze step trends
   */
  private analyzeStepTrends(stepsData: HealthDataPoint[]): any {
    if (stepsData.length < 2) return { trend: 'insufficient_data' };

    const recent = stepsData.slice(-7);
    const older = stepsData.slice(0, -7);

    if (older.length === 0) return { trend: 'insufficient_data' };

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;

    const change = recentAvg - olderAvg;
    let trend = 'stable';
    
    if (change > 1000) {
      trend = 'increasing';
    } else if (change < -1000) {
      trend = 'decreasing';
    }

    return {
      trend,
      change: Math.round(change),
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(olderAvg),
    };
  }

  /**
   * Analyze sleep trends
   */
  private analyzeSleepTrends(sleepData: HealthDataPoint[]): any {
    if (sleepData.length < 2) return { trend: 'insufficient_data' };

    const recent = sleepData.slice(-7);
    const qualityScores = recent.map(item => {
      const quality = item.quality || 'unknown';
      switch (quality) {
        case 'good': return 3;
        case 'fair': return 2;
        case 'poor': return 1;
        default: return 0;
      }
    });

    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    let trend = 'stable';
    if (avgQuality > 2.5) {
      trend = 'improving';
    } else if (avgQuality < 1.5) {
      trend = 'declining';
    }

    return {
      trend,
      averageQualityScore: Math.round(avgQuality * 10) / 10,
      recentNights: recent.length,
    };
  }

  /**
   * Calculate overall sleep quality
   */
  private calculateSleepQuality(sleepData: HealthDataPoint[]): string {
    const qualityScores = sleepData.map(item => {
      const quality = item.quality || 'unknown';
      switch (quality) {
        case 'good': return 3;
        case 'fair': return 2;
        case 'poor': return 1;
        default: return 0;
      }
    });

    const avgScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    if (avgScore > 2.5) return 'good';
    if (avgScore > 1.5) return 'fair';
    return 'poor';
  }

  /**
   * Calculate activity level
   */
  private calculateActivityLevel(avgSteps: number, sensorData?: any[]): string {
    if (avgSteps > 12000) return 'very_active';
    if (avgSteps > 8000) return 'active';
    if (avgSteps > 5000) return 'moderate';
    return 'sedentary';
  }

  /**
   * Generate TCM-specific insights
   */
  private generateTCMInsights(summary: HealthSummary, data: AggregatedHealthData): any {
    return {
      constitution: this.assessTCMConstitution(summary),
      qiLevel: this.assessQiLevel(summary),
      recommendations: this.generateTCMRecommendations(summary),
      seasonalAdvice: this.getSeasonalTCMAdvice(),
    };
  }

  /**
   * Assess TCM constitution based on health data
   */
  private assessTCMConstitution(summary: HealthSummary): string {
    // Simplified constitution assessment
    if (summary.averageHeartRate < 65 && summary.activityLevel === 'sedentary') {
      return 'yang_deficiency';
    }
    if (summary.averageHeartRate > 85 && summary.sleepQuality === 'poor') {
      return 'yin_deficiency';
    }
    if (summary.dailyStepsAverage < 3000) {
      return 'qi_deficiency';
    }
    return 'balanced';
  }

  /**
   * Assess Qi level
   */
  private assessQiLevel(summary: HealthSummary): string {
    const factors = [
      summary.activityLevel !== 'sedentary' ? 1 : 0,
      summary.sleepQuality === 'good' ? 1 : 0,
      summary.averageHeartRate >= 60 && summary.averageHeartRate <= 90 ? 1 : 0,
    ];
    
    const score = factors.reduce((sum, factor) => sum + factor, 0);
    
    if (score >= 3) return 'strong';
    if (score >= 2) return 'moderate';
    return 'weak';
  }

  /**
   * Generate TCM recommendations
   */
  private generateTCMRecommendations(summary: HealthSummary): string[] {
    const recommendations = [];
    
    if (summary.activityLevel === 'sedentary') {
      recommendations.push('Practice gentle Qi Gong exercises to improve energy flow');
    }
    
    if (summary.sleepQuality === 'poor') {
      recommendations.push('Follow TCM sleep hygiene: sleep before 11 PM to nourish Yin');
    }
    
    if (summary.averageHeartRate > 90) {
      recommendations.push('Consider calming herbs like chrysanthemum tea to cool Heart fire');
    }
    
    return recommendations;
  }

  /**
   * Get seasonal TCM advice
   */
  private getSeasonalTCMAdvice(): string {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) { // Spring
      return 'Spring nourishes Liver Qi. Focus on gentle detox and fresh greens.';
    } else if (month >= 5 && month <= 7) { // Summer
      return 'Summer supports Heart energy. Stay hydrated and enjoy cooling foods.';
    } else if (month >= 8 && month <= 10) { // Autumn
      return 'Autumn nourishes Lung Qi. Focus on moistening foods and breathing exercises.';
    } else { // Winter
      return 'Winter strengthens Kidney energy. Warm foods and rest support vital essence.';
    }
  }

  // Recommendation methods
  private getHeartRateRecommendation(category: string, value: number): string {
    switch (category) {
      case 'bradycardia':
        return 'Consider gentle exercise to improve circulation. Consult healthcare provider if persistent.';
      case 'tachycardia':
        return 'Practice relaxation techniques. Avoid caffeine and stress. Seek medical advice if ongoing.';
      default:
        return 'Maintain regular exercise and healthy lifestyle for optimal heart health.';
    }
  }

  private getStepsRecommendation(steps: number): string {
    if (steps < 5000) {
      return 'Aim for at least 5,000 steps daily. Start with short walks and gradually increase.';
    } else if (steps < 10000) {
      return 'Good progress! Try to reach 10,000 steps for optimal health benefits.';
    }
    return 'Excellent activity level! Maintain this healthy habit.';
  }

  private getSleepRecommendation(quality: string, duration: number): string {
    if (quality === 'poor' || duration < 6) {
      return 'Prioritize 7-9 hours of quality sleep. Create a consistent bedtime routine.';
    }
    return 'Good sleep habits! Continue maintaining regular sleep schedule.';
  }

  private getWeightRecommendation(weight: number): string {
    return 'Monitor weight trends over time. Focus on balanced nutrition and regular activity.';
  }

  private getBloodPressureRecommendation(category: string): string {
    switch (category) {
      case 'high':
        return 'High blood pressure detected. Consult healthcare provider and monitor regularly.';
      case 'elevated':
        return 'Elevated blood pressure. Consider lifestyle modifications and regular monitoring.';
      default:
        return 'Blood pressure is normal. Maintain healthy lifestyle habits.';
    }
  }

  private getTemperatureRecommendation(category: string, temp: number): string {
    switch (category) {
      case 'fever':
        return 'Elevated temperature detected. Rest, hydrate, and monitor. Seek medical care if persistent.';
      case 'hypothermia':
        return 'Low body temperature. Warm up gradually and seek medical attention if severe.';
      default:
        return 'Normal body temperature. Continue monitoring for any changes.';
    }
  }

  // TCM interpretation methods
  private getTCMHeartRateInterpretation(heartRate: number): string {
    if (heartRate < 60) {
      return 'Slow pulse may indicate Yang deficiency or excess Yin. Consider warming foods and gentle exercise.';
    } else if (heartRate > 90) {
      return 'Rapid pulse may indicate Heart fire or Yin deficiency. Consider cooling foods and stress reduction.';
    }
    return 'Pulse rate suggests balanced Heart Qi. Maintain current lifestyle habits.';
  }

  private getTCMActivityInterpretation(activityLevel: string): string {
    switch (activityLevel) {
      case 'sedentary':
        return 'Low activity may lead to Qi stagnation. Gentle movement helps circulate energy.';
      case 'moderate':
        return 'Moderate activity supports healthy Qi flow. Continue balanced approach.';
      case 'active':
        return 'Good activity level promotes strong Qi circulation and vitality.';
      default:
        return 'Regular movement is essential for healthy Qi flow.';
    }
  }

  private getTCMSleepInterpretation(quality: string, duration: number): string {
    if (quality === 'poor' || duration < 6) {
      return 'Poor sleep depletes Yin and affects Kidney essence. Prioritize rest and calming practices.';
    }
    return 'Good sleep nourishes Yin and restores Kidney essence. Continue healthy sleep habits.';
  }

  private getTCMWeightInterpretation(weight: number): string {
    return 'Weight reflects the balance of Spleen Qi and metabolism. Focus on digestive health and regular meals.';
  }

  private getTCMBloodPressureInterpretation(category: string, systolic: number): string {
    switch (category) {
      case 'high':
        return 'High pressure may indicate Liver Yang rising or Kidney Yin deficiency. Consider calming practices.';
      case 'elevated':
        return 'Elevated pressure suggests need for stress reduction and Liver Qi regulation.';
      default:
        return 'Normal pressure indicates balanced circulation and Heart Qi.';
    }
  }

  private getTCMTemperatureInterpretation(category: string, temp: number): string {
    switch (category) {
      case 'fever':
        return 'Elevated temperature indicates external pathogen or internal heat. Support body\'s natural defenses.';
      case 'hypothermia':
        return 'Low temperature may indicate Yang deficiency. Focus on warming foods and practices.';
      default:
        return 'Normal temperature suggests balanced internal energy and good defensive Qi.';
    }
  }
}