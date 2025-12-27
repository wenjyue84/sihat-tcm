/**
 * @fileoverview Application Performance Monitoring
 *
 * Comprehensive performance monitoring system for Sihat TCM platform.
 * Tracks API response times, user interactions, error rates, and system health.
 *
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { devLog } from "@/lib/systemLogger";

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count" | "percentage";
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * API performance tracking
 */
export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  userId?: string;
  userAgent?: string;
  timestamp: number;
}

/**
 * User interaction tracking
 */
export interface UserInteractionMetric {
  action: string;
  component: string;
  duration?: number;
  success: boolean;
  userId?: string;
  sessionId: string;
  timestamp: number;
}

/**
 * Error tracking
 */
export interface ErrorMetric {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
}

/**
 * System health metrics
 */
export interface SystemHealthMetric {
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  activeConnections?: number;
  queueSize?: number;
  timestamp: number;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private userMetrics: UserInteractionMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private isEnabled: boolean;
  private batchSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.isEnabled = process.env.ENABLE_PERFORMANCE_MONITORING === "true";

    if (this.isEnabled) {
      this.startPeriodicFlush();
      this.setupErrorHandlers();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track API performance
   */
  public trackAPI(metric: APIMetric): void {
    if (!this.isEnabled) return;

    this.apiMetrics.push(metric);

    // Log slow API calls
    if (metric.responseTime > 5000) {
      devLog("warn", "PerformanceMonitor", "Slow API call detected", {
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      });
    }

    // Auto-flush if batch size reached
    if (this.apiMetrics.length >= this.batchSize) {
      this.flushAPIMetrics();
    }
  }

  /**
   * Track user interactions
   */
  public trackUserInteraction(metric: UserInteractionMetric): void {
    if (!this.isEnabled) return;

    this.userMetrics.push(metric);

    // Log failed interactions
    if (!metric.success) {
      devLog("warn", "PerformanceMonitor", "User interaction failed", {
        action: metric.action,
        component: metric.component,
        userId: metric.userId,
      });
    }

    // Auto-flush if batch size reached
    if (this.userMetrics.length >= this.batchSize) {
      this.flushUserMetrics();
    }
  }

  /**
   * Track errors
   */
  public trackError(metric: ErrorMetric): void {
    if (!this.isEnabled) return;

    this.errorMetrics.push(metric);

    // Log critical errors immediately
    if (metric.severity === "critical") {
      devLog("error", "PerformanceMonitor", "Critical error tracked", {
        message: metric.message,
        component: metric.component,
        userId: metric.userId,
      });

      // Send immediate alert for critical errors
      this.sendCriticalAlert(metric);
    }

    // Auto-flush if batch size reached
    if (this.errorMetrics.length >= this.batchSize) {
      this.flushErrorMetrics();
    }
  }

  /**
   * Track custom performance metric
   */
  public trackMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Auto-flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Track page load performance
   */
  public trackPageLoad(pageName: string, loadTime: number, userId?: string): void {
    this.trackMetric({
      name: "page_load_time",
      value: loadTime,
      unit: "ms",
      timestamp: Date.now(),
      tags: {
        page: pageName,
        userId: userId || "anonymous",
      },
    });
  }

  /**
   * Track diagnosis completion time
   */
  public trackDiagnosisCompletion(
    diagnosisId: string,
    totalTime: number,
    stepTimes: Record<string, number>,
    userId?: string
  ): void {
    // Track total diagnosis time
    this.trackMetric({
      name: "diagnosis_completion_time",
      value: totalTime,
      unit: "ms",
      timestamp: Date.now(),
      tags: {
        diagnosisId,
        userId: userId || "anonymous",
      },
    });

    // Track individual step times
    Object.entries(stepTimes).forEach(([step, time]) => {
      this.trackMetric({
        name: "diagnosis_step_time",
        value: time,
        unit: "ms",
        timestamp: Date.now(),
        tags: {
          step,
          diagnosisId,
          userId: userId || "anonymous",
        },
      });
    });
  }

  /**
   * Track AI model performance
   */
  public trackAIModelPerformance(
    model: string,
    operation: string,
    responseTime: number,
    success: boolean,
    tokensUsed?: number
  ): void {
    this.trackMetric({
      name: "ai_model_response_time",
      value: responseTime,
      unit: "ms",
      timestamp: Date.now(),
      tags: {
        model,
        operation,
        success: success.toString(),
      },
    });

    if (tokensUsed) {
      this.trackMetric({
        name: "ai_model_tokens_used",
        value: tokensUsed,
        unit: "count",
        timestamp: Date.now(),
        tags: {
          model,
          operation,
        },
      });
    }
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    if (typeof window !== "undefined") {
      // Client-side error handling
      window.addEventListener("error", (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          url: event.filename,
          severity: "medium",
          timestamp: Date.now(),
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.trackError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          severity: "high",
          timestamp: Date.now(),
        });
      });
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, this.flushInterval);
  }

  /**
   * Flush all metrics
   */
  public flushAll(): void {
    this.flushMetrics();
    this.flushAPIMetrics();
    this.flushUserMetrics();
    this.flushErrorMetrics();
  }

  /**
   * Flush performance metrics
   */
  private flushMetrics(): void {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    this.sendMetricsToCollector("performance", metricsToFlush);
  }

  /**
   * Flush API metrics
   */
  private flushAPIMetrics(): void {
    if (this.apiMetrics.length === 0) return;

    const metricsToFlush = [...this.apiMetrics];
    this.apiMetrics = [];

    this.sendMetricsToCollector("api", metricsToFlush);
  }

  /**
   * Flush user metrics
   */
  private flushUserMetrics(): void {
    if (this.userMetrics.length === 0) return;

    const metricsToFlush = [...this.userMetrics];
    this.userMetrics = [];

    this.sendMetricsToCollector("user_interactions", metricsToFlush);
  }

  /**
   * Flush error metrics
   */
  private flushErrorMetrics(): void {
    if (this.errorMetrics.length === 0) return;

    const metricsToFlush = [...this.errorMetrics];
    this.errorMetrics = [];

    this.sendMetricsToCollector("errors", metricsToFlush);
  }

  /**
   * Send metrics to collector
   */
  private async sendMetricsToCollector(type: string, metrics: any[]): Promise<void> {
    try {
      // Send to internal logging endpoint
      await fetch("/api/monitoring/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          metrics,
          timestamp: Date.now(),
        }),
      });

      // Send to external monitoring services if configured
      await this.sendToExternalServices(type, metrics);
    } catch (error) {
      devLog("error", "PerformanceMonitor", "Failed to send metrics", { error });
    }
  }

  /**
   * Send to external monitoring services
   */
  private async sendToExternalServices(type: string, metrics: any[]): Promise<void> {
    const promises: Promise<void>[] = [];

    // DataDog
    if (process.env.DATADOG_API_KEY) {
      promises.push(this.sendToDataDog(type, metrics));
    }

    // New Relic
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      promises.push(this.sendToNewRelic(type, metrics));
    }

    // Custom webhook
    if (process.env.MONITORING_WEBHOOK) {
      promises.push(this.sendToWebhook(type, metrics));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send to DataDog
   */
  private async sendToDataDog(type: string, metrics: any[]): Promise<void> {
    try {
      const datadogMetrics = metrics.map((metric) => ({
        metric: `sihat_tcm.${type}.${metric.name || "count"}`,
        points: [[Math.floor(Date.now() / 1000), metric.value || 1]],
        tags: metric.tags ? Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`) : [],
      }));

      await fetch("https://api.datadoghq.com/api/v1/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": process.env.DATADOG_API_KEY!,
        },
        body: JSON.stringify({ series: datadogMetrics }),
      });
    } catch (error) {
      devLog("error", "PerformanceMonitor", "Failed to send to DataDog", { error });
    }
  }

  /**
   * Send to New Relic
   */
  private async sendToNewRelic(type: string, metrics: any[]): Promise<void> {
    try {
      const newRelicEvents = metrics.map((metric) => ({
        eventType: `SihatTCM${type.charAt(0).toUpperCase() + type.slice(1)}`,
        ...metric,
        appName: "sihat-tcm",
        environment: process.env.NODE_ENV,
      }));

      await fetch("https://insights-collector.newrelic.com/v1/accounts/YOUR_ACCOUNT_ID/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Insert-Key": process.env.NEW_RELIC_LICENSE_KEY!,
        },
        body: JSON.stringify(newRelicEvents),
      });
    } catch (error) {
      devLog("error", "PerformanceMonitor", "Failed to send to New Relic", { error });
    }
  }

  /**
   * Send to custom webhook
   */
  private async sendToWebhook(type: string, metrics: any[]): Promise<void> {
    try {
      await fetch(process.env.MONITORING_WEBHOOK!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "sihat-tcm",
          type,
          metrics,
          timestamp: Date.now(),
          environment: process.env.NODE_ENV,
        }),
      });
    } catch (error) {
      devLog("error", "PerformanceMonitor", "Failed to send to webhook", { error });
    }
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(error: ErrorMetric): Promise<void> {
    try {
      // Send to Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "🚨 CRITICAL ERROR DETECTED",
            attachments: [
              {
                color: "danger",
                fields: [
                  {
                    title: "Error Message",
                    value: error.message,
                    short: false,
                  },
                  {
                    title: "Component",
                    value: error.component || "Unknown",
                    short: true,
                  },
                  {
                    title: "User ID",
                    value: error.userId || "Anonymous",
                    short: true,
                  },
                  {
                    title: "Environment",
                    value: process.env.NODE_ENV || "Unknown",
                    short: true,
                  },
                  {
                    title: "Timestamp",
                    value: new Date(error.timestamp).toISOString(),
                    short: true,
                  },
                ],
              },
            ],
          }),
        });
      }

      // Send email alert if configured
      if (process.env.ALERT_EMAIL) {
        await fetch("/api/monitoring/alert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "critical_error",
            error,
            recipients: [process.env.ALERT_EMAIL],
          }),
        });
      }
    } catch (alertError) {
      devLog("error", "PerformanceMonitor", "Failed to send critical alert", { alertError });
    }
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalMetrics: number;
    apiMetrics: number;
    userMetrics: number;
    errorMetrics: number;
    isEnabled: boolean;
  } {
    return {
      totalMetrics: this.metrics.length,
      apiMetrics: this.apiMetrics.length,
      userMetrics: this.userMetrics.length,
      errorMetrics: this.errorMetrics.length,
      isEnabled: this.isEnabled,
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  public cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush remaining metrics
    this.flushAll();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Utility functions for common tracking scenarios
 */

/**
 * Track function execution time
 */
export function trackExecutionTime<T>(
  name: string,
  fn: () => T | Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = performance.now();

  const result = Promise.resolve(fn());

  return result.then(
    (value) => {
      const endTime = performance.now();
      performanceMonitor.trackMetric({
        name,
        value: endTime - startTime,
        unit: "ms",
        timestamp: Date.now(),
        tags,
      });
      return value;
    },
    (error) => {
      const endTime = performance.now();
      performanceMonitor.trackMetric({
        name,
        value: endTime - startTime,
        unit: "ms",
        timestamp: Date.now(),
        tags: { ...tags, error: "true" },
      });
      throw error;
    }
  );
}

/**
 * API middleware for automatic tracking
 */
export function createAPITrackingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const endTime = Date.now();

      performanceMonitor.trackAPI({
        endpoint: req.url,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: endTime - startTime,
        requestSize: req.headers["content-length"]
          ? parseInt(req.headers["content-length"])
          : undefined,
        userId: req.user?.id,
        userAgent: req.headers["user-agent"],
        timestamp: startTime,
      });
    });

    next();
  };
}
