/**
 * Performance monitoring for AI models
 */

import { ModelPerformanceMetrics } from "../interfaces/ModelInterfaces";
import { devLog } from "../../systemLogger";

export class PerformanceMonitor {
  private performanceHistory: ModelPerformanceMetrics[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * Record performance metrics
   */
  public recordMetrics(metrics: ModelPerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    // Maintain history size limit
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }

    console.log(`[PerformanceMonitor] Performance recorded`, {
      model: metrics.modelId,
      success: metrics.success,
      responseTime: metrics.responseTime,
      retryCount: metrics.retryCount,
    });
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    modelPerformance: Record<
      string,
      {
        requests: number;
        successRate: number;
        averageResponseTime: number;
      }
    >;
    recentErrors: ModelPerformanceMetrics[];
  } {
    const totalRequests = this.performanceHistory.length;
    const successfulRequests = this.performanceHistory.filter((m) => m.success).length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const totalResponseTime = this.performanceHistory.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    // Model-specific performance
    const modelPerformance: Record<string, any> = {};
    const modelIds = [...new Set(this.performanceHistory.map((m) => m.modelId))];

    for (const modelId of modelIds) {
      const modelMetrics = this.performanceHistory.filter((m) => m.modelId === modelId);
      const modelSuccessful = modelMetrics.filter((m) => m.success).length;

      modelPerformance[modelId] = {
        requests: modelMetrics.length,
        successRate: modelMetrics.length > 0 ? modelSuccessful / modelMetrics.length : 0,
        averageResponseTime:
          modelMetrics.length > 0
            ? modelMetrics.reduce((sum, m) => sum + m.responseTime, 0) / modelMetrics.length
            : 0,
      };
    }

    // Recent errors (last 10)
    const recentErrors = this.performanceHistory.filter((m) => !m.success).slice(-10);

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      modelPerformance,
      recentErrors,
    };
  }

  /**
   * Get performance for specific model
   */
  public getModelPerformance(modelId: string): {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    recentPerformance: ModelPerformanceMetrics[];
  } {
    const modelMetrics = this.performanceHistory.filter((m) => m.modelId === modelId);
    const recent = modelMetrics.slice(-50); // Last 50 requests

    if (recent.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        recentPerformance: [],
      };
    }

    const successful = recent.filter((m) => m.success);
    const averageResponseTime =
      successful.length > 0
        ? successful.reduce((sum, m) => sum + m.responseTime, 0) / successful.length
        : 0;

    return {
      averageResponseTime,
      successRate: successful.length / recent.length,
      totalRequests: modelMetrics.length,
      recentPerformance: recent,
    };
  }

  /**
   * Clear performance history
   */
  public clearHistory(): void {
    this.performanceHistory = [];
    console.log("[PerformanceMonitor] Performance history cleared");
  }
}
