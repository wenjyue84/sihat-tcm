/**
 * Enhanced AI Model Router - Main orchestrator class
 */

import {
  streamTextWithFallback,
  generateTextWithFallback,
  FallbackOptions,
  StreamCallOptions,
  GenerateCallOptions,
} from "../modelFallback";
import { ModelSelectionCriteria, ModelRouterConfig, AnalysisRequestDTO } from "./interfaces/ModelInterfaces";
import { ComplexityAnalyzer } from "./analysis/ComplexityAnalyzer";
import { ModelSelectionStrategy } from "./selection/ModelSelectionStrategy";
import { PerformanceMonitor } from "./monitoring/PerformanceMonitor";
import { ErrorFactory } from "../errors/AppError";

export class AIModelRouter {
  private complexityAnalyzer: ComplexityAnalyzer;
  private selectionStrategy: ModelSelectionStrategy;
  private performanceMonitor: PerformanceMonitor;
  private config: ModelRouterConfig;
  private readonly appName: string;

  constructor(appName: string = "SihatTCM", config?: Partial<ModelRouterConfig>) {
    this.appName = appName;
    this.config = {
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 10000,
      maxRetries: 3,
      ...config,
    };

    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.selectionStrategy = new ModelSelectionStrategy();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Analyze request complexity
   */
  /**
   * Analyze request complexity
   */
  public analyzeComplexity(request: AnalysisRequestDTO) {
    return this.complexityAnalyzer.analyzeComplexity(request);
  }

  /**
   * Select optimal model based on criteria
   */
  public selectOptimalModel(criteria: ModelSelectionCriteria) {
    return this.selectionStrategy.selectOptimalModel(criteria);
  }

  /**
   * Generate text with intelligent routing
   */
  /**
   * Generate text with intelligent routing
   */
  public async generateWithRouting<T = string>(
    criteria: ModelSelectionCriteria,
    options: GenerateCallOptions
  ): Promise<{
    text: string;
    parsed?: T;
    modelUsed: number;
    modelId: string;
    status: string;
  }> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let retryCount = 0;

    try {
      const { primaryModel, fallbackModels, reasoning } = this.selectOptimalModel(criteria);
      selectedModel = primaryModel;

      console.log(`[AIModelRouter] Using model: ${primaryModel}`, { reasoning });

      const fallbackOptions: FallbackOptions = {
        primaryModel,
        fallbackModels,
        apiKey: undefined,
        context: this.appName,
        useAsyncApiKey: true,
      };

      const result = await generateTextWithFallback<T>(fallbackOptions, options);

      // Record successful metrics
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics({
          modelId: selectedModel,
          requestType: criteria.complexity.type,
          responseTime: Date.now() - startTime,
          success: true,
          timestamp: new Date(),
          retryCount,
        });
      }

      return result;
    } catch (error) {
      // Record failure metrics
      if (selectedModel && this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics({
          modelId: selectedModel,
          requestType: criteria.complexity.type,
          responseTime: Date.now() - startTime,
          success: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          timestamp: new Date(),
          retryCount,
        });
      }

      throw ErrorFactory.fromUnknownError(error, {
        component: 'AIModelRouter',
        action: 'generateWithRouting',
        metadata: { criteria, selectedModel, retryCount },
      });
    }
  }

  /**
   * Stream text with intelligent routing
   */
  /**
   * Stream text with intelligent routing
   */
  public async streamWithRouting(
    criteria: ModelSelectionCriteria,
    options: StreamCallOptions
  ): Promise<Response> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let retryCount = 0;

    try {
      const { primaryModel, fallbackModels, reasoning } = this.selectOptimalModel(criteria);
      selectedModel = primaryModel;

      console.log(`[AIModelRouter] Streaming with model: ${primaryModel}`, { reasoning });

      const fallbackOptions: FallbackOptions = {
        primaryModel,
        fallbackModels,
        apiKey: undefined,
        context: this.appName,
        useAsyncApiKey: true,
      };

      const result = await streamTextWithFallback(fallbackOptions, options);

      // Record successful metrics
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics({
          modelId: selectedModel,
          requestType: criteria.complexity.type,
          responseTime: Date.now() - startTime,
          success: true,
          timestamp: new Date(),
          retryCount,
        });
      }

      return result;
    } catch (error) {
      // Record failure metrics
      if (selectedModel && this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics({
          modelId: selectedModel,
          requestType: criteria.complexity.type,
          responseTime: Date.now() - startTime,
          success: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          timestamp: new Date(),
          retryCount,
        });
      }

      throw ErrorFactory.fromUnknownError(error, {
        component: 'AIModelRouter',
        action: 'streamWithRouting',
        metadata: { criteria, selectedModel, retryCount },
      });
    }
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics() {
    return this.performanceMonitor.getPerformanceAnalytics();
  }

  /**
   * Get model-specific performance
   */
  public getModelPerformance(modelId: string) {
    return this.performanceMonitor.getModelPerformance(modelId);
  }

  /**
   * Clear performance history
   */
  public clearPerformanceHistory(): void {
    this.performanceMonitor.clearHistory();
  }
}