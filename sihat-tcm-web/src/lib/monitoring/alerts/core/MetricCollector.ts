/**
 * @fileoverview Metric Collection System
 *
 * Handles collection, storage, and retrieval of system metrics
 * for alert evaluation and monitoring purposes.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type { MetricHistoryEntry } from "../interfaces/AlertInterfaces";

/**
 * Metric collector for alert system
 */
export class MetricCollector {
  private metricHistory: Map<string, MetricHistoryEntry[]> = new Map();
  private readonly maxHistorySize: number = 1000;
  private readonly cleanupInterval: number = 3600000; // 1 hour
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Record a metric value
   */
  public recordMetric(metric: string, value: number): void {
    const timestamp = Date.now();

    if (!this.metricHistory.has(metric)) {
      this.metricHistory.set(metric, []);
    }

    const history = this.metricHistory.get(metric)!;
    history.push({ value, timestamp });

    // Keep only the most recent entries
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    devLog("debug", "MetricCollector", `Recorded metric: ${metric} = ${value}`);
  }

  /**
   * Get metric history for a specific metric
   */
  public getMetricHistory(metric: string): MetricHistoryEntry[] {
    return this.metricHistory.get(metric) || [];
  }

  /**
   * Get metric values within a time window
   */
  public getMetricWindow(
    metric: string,
    timeWindow: number,
    endTime: number = Date.now()
  ): MetricHistoryEntry[] {
    const history = this.getMetricHistory(metric);
    const startTime = endTime - timeWindow;

    return history.filter((entry) => entry.timestamp >= startTime && entry.timestamp <= endTime);
  }

  /**
   * Get the latest metric value
   */
  public getLatestMetric(metric: string): MetricHistoryEntry | null {
    const history = this.getMetricHistory(metric);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get average metric value over time window
   */
  public getAverageMetric(metric: string, timeWindow: number): number | null {
    const values = this.getMetricWindow(metric, timeWindow);

    if (values.length === 0) return null;

    const sum = values.reduce((acc, entry) => acc + entry.value, 0);
    return sum / values.length;
  }

  /**
   * Get maximum metric value over time window
   */
  public getMaxMetric(metric: string, timeWindow: number): number | null {
    const values = this.getMetricWindow(metric, timeWindow);

    if (values.length === 0) return null;

    return Math.max(...values.map((entry) => entry.value));
  }

  /**
   * Get minimum metric value over time window
   */
  public getMinMetric(metric: string, timeWindow: number): number | null {
    const values = this.getMetricWindow(metric, timeWindow);

    if (values.length === 0) return null;

    return Math.min(...values.map((entry) => entry.value));
  }

  /**
   * Check if metric has consecutive failures
   */
  public hasConsecutiveFailures(
    metric: string,
    threshold: number,
    operator: "gt" | "lt" | "eq" | "gte" | "lte",
    consecutiveCount: number,
    timeWindow?: number
  ): boolean {
    let history = this.getMetricHistory(metric);

    if (timeWindow) {
      history = this.getMetricWindow(metric, timeWindow);
    }

    if (history.length < consecutiveCount) return false;

    // Check the last N entries for consecutive failures
    const recentEntries = history.slice(-consecutiveCount);

    return recentEntries.every((entry) => {
      switch (operator) {
        case "gt":
          return entry.value > threshold;
        case "lt":
          return entry.value < threshold;
        case "gte":
          return entry.value >= threshold;
        case "lte":
          return entry.value <= threshold;
        case "eq":
          return entry.value === threshold;
        default:
          return false;
      }
    });
  }

  /**
   * Get all available metrics
   */
  public getAvailableMetrics(): string[] {
    return Array.from(this.metricHistory.keys());
  }

  /**
   * Get metric statistics
   */
  public getMetricStatistics(
    metric: string,
    timeWindow?: number
  ): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const values = timeWindow
      ? this.getMetricWindow(metric, timeWindow)
      : this.getMetricHistory(metric);

    if (values.length === 0) return null;

    const numericValues = values.map((entry) => entry.value);
    const sum = numericValues.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      latest: numericValues[numericValues.length - 1],
    };
  }

  /**
   * Clear metric history
   */
  public clearMetric(metric: string): void {
    this.metricHistory.delete(metric);
    devLog("info", "MetricCollector", `Cleared metric history: ${metric}`);
  }

  /**
   * Clear all metrics
   */
  public clearAllMetrics(): void {
    this.metricHistory.clear();
    devLog("info", "MetricCollector", "Cleared all metric history");
  }

  /**
   * Start periodic cleanup of old metrics
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.cleanupInterval);
  }

  /**
   * Cleanup old metric entries
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    let totalRemoved = 0;

    for (const [metric, history] of this.metricHistory.entries()) {
      const initialLength = history.length;
      const filteredHistory = history.filter((entry) => entry.timestamp > cutoffTime);

      this.metricHistory.set(metric, filteredHistory);
      totalRemoved += initialLength - filteredHistory.length;
    }

    if (totalRemoved > 0) {
      devLog("info", "MetricCollector", `Cleaned up ${totalRemoved} old metric entries`);
    }
  }

  /**
   * Export metric data for analysis
   */
  public exportMetrics(): Record<string, MetricHistoryEntry[]> {
    const exported: Record<string, MetricHistoryEntry[]> = {};

    for (const [metric, history] of this.metricHistory.entries()) {
      exported[metric] = [...history]; // Create a copy
    }

    return exported;
  }

  /**
   * Import metric data
   */
  public importMetrics(data: Record<string, MetricHistoryEntry[]>): void {
    for (const [metric, history] of Object.entries(data)) {
      this.metricHistory.set(metric, [...history]);
    }

    devLog("info", "MetricCollector", `Imported ${Object.keys(data).length} metrics`);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.metricHistory.clear();
    devLog("info", "MetricCollector", "MetricCollector destroyed");
  }
}
