/**
 * Metric Collector
 * 
 * Collects, stores, and manages metric data for alert evaluation.
 * Provides efficient storage and retrieval of time-series data.
 */

import { MetricDataPoint, AlertEvaluationContext } from '../interfaces/AlertInterfaces';
import { devLog } from '@/lib/systemLogger';

export class MetricCollector {
  private metricHistory: Map<string, MetricDataPoint[]> = new Map();
  private readonly maxHistorySize: number;
  private readonly context: string = 'MetricCollector';

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record a metric value
   */
  public recordMetric(metric: string, value: number, timestamp?: number): void {
    const dataPoint: MetricDataPoint = {
      value,
      timestamp: timestamp || Date.now()
    };

    if (!this.metricHistory.has(metric)) {
      this.metricHistory.set(metric, []);
    }

    const history = this.metricHistory.get(metric)!;
    history.push(dataPoint);

    // Keep only the most recent entries
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    devLog("debug", this.context, `Metric recorded: ${metric} = ${value}`, {
      metric,
      value,
      timestamp: dataPoint.timestamp,
      historySize: history.length
    });
  }

  /**
   * Get metric history
   */
  public getMetricHistory(metric: string): MetricDataPoint[] {
    return this.metricHistory.get(metric) || [];
  }

  /**
   * Get metric history within time window
   */
  public getMetricHistoryInWindow(
    metric: string, 
    windowStart: number, 
    windowEnd?: number
  ): MetricDataPoint[] {
    const history = this.getMetricHistory(metric);
    const endTime = windowEnd || Date.now();

    return history.filter(
      point => point.timestamp >= windowStart && point.timestamp <= endTime
    );
  }

  /**
   * Get latest metric value
   */
  public getLatestMetricValue(metric: string): MetricDataPoint | null {
    const history = this.getMetricHistory(metric);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get metric statistics for time window
   */
  public getMetricStatistics(
    metric: string, 
    timeWindow: number
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    latest: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } | null {
    const windowStart = Date.now() - timeWindow;
    const windowData = this.getMetricHistoryInWindow(metric, windowStart);

    if (windowData.length === 0) return null;

    const values = windowData.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const latest = values[values.length - 1];

    // Simple trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (values.length >= 2) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (changePercent > 5) trend = 'increasing';
      else if (changePercent < -5) trend = 'decreasing';
    }

    return {
      count: windowData.length,
      min,
      max,
      avg,
      latest,
      trend
    };
  }

  /**
   * Create evaluation context for metric
   */
  public createEvaluationContext(metric: string, value: number, timestamp?: number): AlertEvaluationContext {
    const evalTimestamp = timestamp || Date.now();
    const history = this.getMetricHistory(metric);

    return {
      metric,
      value,
      timestamp: evalTimestamp,
      history
    };
  }

  /**
   * Get all tracked metrics
   */
  public getTrackedMetrics(): string[] {
    return Array.from(this.metricHistory.keys());
  }

  /**
   * Get metric count
   */
  public getMetricCount(): number {
    return this.metricHistory.size;
  }

  /**
   * Get total data points across all metrics
   */
  public getTotalDataPoints(): number {
    return Array.from(this.metricHistory.values())
      .reduce((total, history) => total + history.length, 0);
  }

  /**
   * Clear metric history
   */
  public clearMetricHistory(metric: string): boolean {
    const deleted = this.metricHistory.delete(metric);
    if (deleted) {
      devLog("info", this.context, `Metric history cleared: ${metric}`);
    }
    return deleted;
  }

  /**
   * Clear all metric history
   */
  public clearAllHistory(): void {
    this.metricHistory.clear();
    devLog("info", this.context, "All metric history cleared");
  }

  /**
   * Cleanup old data points beyond retention period
   */
  public cleanupOldData(retentionPeriod: number): void {
    const cutoffTime = Date.now() - retentionPeriod;
    let totalRemoved = 0;

    for (const [metric, history] of this.metricHistory.entries()) {
      const originalLength = history.length;
      const filteredHistory = history.filter(point => point.timestamp >= cutoffTime);
      
      if (filteredHistory.length !== originalLength) {
        this.metricHistory.set(metric, filteredHistory);
        totalRemoved += originalLength - filteredHistory.length;
      }
    }

    if (totalRemoved > 0) {
      devLog("info", this.context, `Cleaned up ${totalRemoved} old data points`);
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryUsage(): {
    metricsCount: number;
    totalDataPoints: number;
    estimatedMemoryKB: number;
  } {
    const metricsCount = this.getMetricCount();
    const totalDataPoints = this.getTotalDataPoints();
    
    // Rough estimation: each data point ~24 bytes (number + timestamp + overhead)
    const estimatedMemoryKB = Math.round((totalDataPoints * 24) / 1024);

    return {
      metricsCount,
      totalDataPoints,
      estimatedMemoryKB
    };
  }

  /**
   * Export metric data for analysis
   */
  public exportMetricData(metric: string, timeWindow?: number): MetricDataPoint[] {
    if (timeWindow) {
      const windowStart = Date.now() - timeWindow;
      return this.getMetricHistoryInWindow(metric, windowStart);
    }
    return this.getMetricHistory(metric);
  }

  /**
   * Import metric data (for testing or data migration)
   */
  public importMetricData(metric: string, data: MetricDataPoint[]): void {
    // Sort by timestamp to maintain order
    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
    
    // Limit to max history size
    const limitedData = sortedData.slice(-this.maxHistorySize);
    
    this.metricHistory.set(metric, limitedData);
    
    devLog("info", this.context, `Imported ${limitedData.length} data points for metric: ${metric}`);
  }

  /**
   * Batch record multiple metrics
   */
  public recordMetrics(metrics: Record<string, number>, timestamp?: number): void {
    const recordTimestamp = timestamp || Date.now();
    
    Object.entries(metrics).forEach(([metric, value]) => {
      this.recordMetric(metric, value, recordTimestamp);
    });

    devLog("debug", this.context, `Batch recorded ${Object.keys(metrics).length} metrics`);
  }
}