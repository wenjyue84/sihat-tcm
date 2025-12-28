/**
 * Diagnostic Monitor - Performance and usage monitoring for diagnostic system
 * 
 * Tracks diagnostic performance, usage patterns, and system health
 * to provide insights for optimization and troubleshooting.
 */

import { DiagnosticStats, DiagnosticProcessingStep } from '../interfaces/DiagnosticInterfaces';
import { devLog, logError } from "../../systemLogger";

export class DiagnosticMonitor {
  private context: string;
  private stats: DiagnosticStats;
  private processingHistory: Array<{
    timestamp: Date;
    userId: string;
    processingTime: number;
    modelUsed: string;
    success: boolean;
    steps: DiagnosticProcessingStep[];
  }> = [];
  private readonly maxHistorySize = 1000;

  constructor(context: string = "DiagnosticMonitor") {
    this.context = context;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      averageProcessingTime: 0,
      modelUsageStats: {},
      errorRate: 0,
    };
  }

  /**
   * Record diagnostic processing completion
   */
  recordDiagnosticCompletion(
    userId: string,
    modelUsed: string,
    processingTime: number,
    success: boolean,
    steps: DiagnosticProcessingStep[]
  ): void {
    try {
      // Update stats
      this.stats.totalRequests++;
      if (success) {
        this.stats.successfulRequests++;
      }

      // Update model usage stats
      this.stats.modelUsageStats[modelUsed] = (this.stats.modelUsageStats[modelUsed] || 0) + 1;

      // Update average processing time
      const totalTime = this.stats.averageProcessingTime * (this.stats.totalRequests - 1) + processingTime;
      this.stats.averageProcessingTime = totalTime / this.stats.totalRequests;

      // Update error rate
      this.stats.errorRate = ((this.stats.totalRequests - this.stats.successfulRequests) / this.stats.totalRequests) * 100;

      // Update last processed time
      this.stats.lastProcessedAt = new Date();

      // Add to processing history
      this.processingHistory.push({
        timestamp: new Date(),
        userId,
        processingTime,
        modelUsed,
        success,
        steps: [...steps],
      });

      // Maintain history size limit
      if (this.processingHistory.length > this.maxHistorySize) {
        this.processingHistory = this.processingHistory.slice(-this.maxHistorySize);
      }

      devLog("info", this.context, "Diagnostic completion recorded", {
        userId,
        modelUsed,
        processingTime,
        success,
        totalRequests: this.stats.totalRequests,
      });
    } catch (error) {
      logError(this.context, "Failed to record diagnostic completion", { error });
    }
  }

  /**
   * Get current diagnostic statistics
   */
  getStats(): DiagnosticStats {
    return { ...this.stats };
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    averageProcessingTimeByModel: Record<string, number>;
    successRateByModel: Record<string, number>;
    stepPerformance: Record<string, {
      averageTime: number;
      successRate: number;
      totalExecutions: number;
    }>;
    recentTrends: {
      processingTimetrend: 'improving' | 'stable' | 'degrading';
      errorRatetrend: 'improving' | 'stable' | 'degrading';
    };
  } {
    const analytics = {
      averageProcessingTimeByModel: {} as Record<string, number>,
      successRateByModel: {} as Record<string, number>,
      stepPerformance: {} as Record<string, any>,
      recentTrends: {
        processingTimetrend: 'stable' as const,
        errorRatetrend: 'stable' as const,
      },
    };

    // Calculate model-specific metrics
    const modelMetrics: Record<string, { times: number[]; successes: number; total: number }> = {};
    
    for (const record of this.processingHistory) {
      if (!modelMetrics[record.modelUsed]) {
        modelMetrics[record.modelUsed] = { times: [], successes: 0, total: 0 };
      }
      
      modelMetrics[record.modelUsed].times.push(record.processingTime);
      modelMetrics[record.modelUsed].total++;
      if (record.success) {
        modelMetrics[record.modelUsed].successes++;
      }
    }

    // Calculate averages and success rates
    for (const [model, metrics] of Object.entries(modelMetrics)) {
      analytics.averageProcessingTimeByModel[model] = 
        metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length;
      analytics.successRateByModel[model] = 
        (metrics.successes / metrics.total) * 100;
    }

    // Calculate step performance
    const stepMetrics: Record<string, { times: number[]; successes: number; total: number }> = {};
    
    for (const record of this.processingHistory) {
      for (const step of record.steps) {
        if (!stepMetrics[step.name]) {
          stepMetrics[step.name] = { times: [], successes: 0, total: 0 };
        }
        
        if (step.endTime) {
          stepMetrics[step.name].times.push(step.endTime - step.startTime);
        }
        stepMetrics[step.name].total++;
        if (step.success) {
          stepMetrics[step.name].successes++;
        }
      }
    }

    for (const [stepName, metrics] of Object.entries(stepMetrics)) {
      analytics.stepPerformance[stepName] = {
        averageTime: metrics.times.length > 0 
          ? metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length 
          : 0,
        successRate: (metrics.successes / metrics.total) * 100,
        totalExecutions: metrics.total,
      };
    }

    // Calculate trends (simplified)
    if (this.processingHistory.length >= 10) {
      const recent = this.processingHistory.slice(-10);
      const older = this.processingHistory.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvgTime = recent.reduce((sum, r) => sum + r.processingTime, 0) / recent.length;
        const olderAvgTime = older.reduce((sum, r) => sum + r.processingTime, 0) / older.length;
        
        if (recentAvgTime < olderAvgTime * 0.9) {
          analytics.recentTrends.processingTimetrend = 'improving';
        } else if (recentAvgTime > olderAvgTime * 1.1) {
          analytics.recentTrends.processingTimetrend = 'degrading';
        }

        const recentErrorRate = (recent.filter(r => !r.success).length / recent.length) * 100;
        const olderErrorRate = (older.filter(r => !r.success).length / older.length) * 100;
        
        if (recentErrorRate < olderErrorRate * 0.8) {
          analytics.recentTrends.errorRatetrend = 'improving';
        } else if (recentErrorRate > olderErrorRate * 1.2) {
          analytics.recentTrends.errorRatetrend = 'degrading';
        }
      }
    }

    return analytics;
  }

  /**
   * Get recent processing history
   */
  getRecentHistory(limit: number = 50): Array<{
    timestamp: Date;
    userId: string;
    processingTime: number;
    modelUsed: string;
    success: boolean;
    stepCount: number;
  }> {
    return this.processingHistory
      .slice(-limit)
      .map(record => ({
        timestamp: record.timestamp,
        userId: record.userId,
        processingTime: record.processingTime,
        modelUsed: record.modelUsed,
        success: record.success,
        stepCount: record.steps.length,
      }));
  }

  /**
   * Get detailed step analysis for a specific processing session
   */
  getStepAnalysis(userId: string, timestamp: Date): DiagnosticProcessingStep[] | null {
    const record = this.processingHistory.find(
      r => r.userId === userId && r.timestamp.getTime() === timestamp.getTime()
    );
    
    return record ? record.steps : null;
  }

  /**
   * Clear monitoring history
   */
  clearHistory(): void {
    this.processingHistory = [];
    devLog("info", this.context, "Processing history cleared");
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      averageProcessingTime: 0,
      modelUsageStats: {},
      errorRate: 0,
    };
    devLog("info", this.context, "Statistics reset");
  }

  /**
   * Export monitoring data for analysis
   */
  exportData(): {
    stats: DiagnosticStats;
    history: typeof this.processingHistory;
    analytics: ReturnType<DiagnosticMonitor["getPerformanceAnalytics"]>;
  } {
    return {
      stats: this.getStats(),
      history: [...this.processingHistory],
      analytics: this.getPerformanceAnalytics(),
    };
  }
}