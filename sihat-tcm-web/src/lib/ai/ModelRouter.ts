/**
 * Refactored AI Model Router - Clean Architecture Implementation
 * 
 * This is the new, refactored version that follows SOLID principles:
 * - Single Responsibility: Each class has one clear purpose
 * - Open/Closed: Easy to extend with new strategies
 * - Liskov Substitution: Strategies are interchangeable
 * - Interface Segregation: Clean, focused interfaces
 * - Dependency Inversion: Depends on abstractions, not concretions
 */

import {
  AIRequest,
  AIResponse,
  ModelRouter,
  AIModel,
  ModelSelectionStrategy,
  ComplexityAnalysisStrategy,
  PerformanceMonitor,
  ModelSelectionCriteria,
} from './interfaces/AIModel';

import { EnhancedComplexityAnalyzer } from './analysis/ComplexityAnalyzer';
import { ModelPerformanceMonitor } from './monitoring/PerformanceMonitor';
import { 
  IntelligentModelSelectionStrategy,
  RuleBasedModelSelectionStrategy 
} from './selection/ModelSelectionStrategy';

import { 
  streamTextWithFallback,
  generateTextWithFallback,
  FallbackOptions,
  StreamCallOptions,
  GenerateCallOptions,
} from '../modelFallback';

import { AppError, AIModelError, ErrorFactory } from '../errors/AppError';
import { devLog, logError } from '../systemLogger';

/**
 * Configuration for the Model Router
 */
export interface ModelRouterConfig {
  enablePerformanceMonitoring: boolean;
  enableAdaptiveSelection: boolean;
  fallbackThreshold: number;
  maxRetries: number;
  useIntelligentSelection: boolean;
  context: string;
}

/**
 * Enhanced AI Model Router with Clean Architecture
 * 
 * This router orchestrates AI model selection and request routing using
 * the Strategy pattern for pluggable components and clean separation of concerns.
 */
export class EnhancedModelRouter implements ModelRouter {
  private models = new Map<string, AIModel>();
  private complexityAnalyzer: ComplexityAnalysisStrategy;
  private selectionStrategy: ModelSelectionStrategy;
  private performanceMonitor: PerformanceMonitor;
  private config: ModelRouterConfig;

  constructor(config?: Partial<ModelRouterConfig>) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 10000,
      maxRetries: 3,
      useIntelligentSelection: true,
      context: 'EnhancedModelRouter',
      ...config,
    };

    // Initialize components using dependency injection
    this.performanceMonitor = new ModelPerformanceMonitor(
      `${this.config.context}:PerformanceMonitor`
    );
    
    this.complexityAnalyzer = new EnhancedComplexityAnalyzer();
    
    this.selectionStrategy = this.config.useIntelligentSelection
      ? new IntelligentModelSelectionStrategy(
          this.performanceMonitor,
          `${this.config.context}:Selection`
        )
      : new RuleBasedModelSelectionStrategy(`${this.config.context}:RuleSelection`);

    devLog(`[${this.config.context}] Router initialized with ${this.config.useIntelligentSelection ? 'intelligent' : 'rule-based'} selection`);
  }

  /**
   * Add a model to the router
   */
  public addModel(model: AIModel): void {
    this.models.set(model.id, model);
    devLog(`[${this.config.context}] Added model: ${model.capabilities.name}`);
  }

  /**
   * Remove a model from the router
   */
  public removeModel(modelId: string): void {
    const removed = this.models.delete(modelId);
    if (removed) {
      devLog(`[${this.config.context}] Removed model: ${modelId}`);
    }
  }

  /**
   * Route a request to the optimal model
   */
  public async routeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let selectedModelId: string | null = null;
    let retryCount = 0;

    try {
      // Step 1: Analyze request complexity
      const complexity = this.complexityAnalyzer.analyzeComplexity(request);
      
      devLog(`[${this.config.context}] Request complexity: ${complexity.type} (score: ${complexity.score})`);

      // Step 2: Create selection criteria
      const criteria: ModelSelectionCriteria = {
        complexity,
        requiresVision: Boolean(request.images?.length),
        requiresStreaming: false, // Generate request doesn't need streaming
        language: request.language,
        medicalSpecialty: request.medicalSpecialty,
      };

      // Step 3: Select optimal model
      const availableModels = Array.from(this.models.values());
      const { primaryModel, fallbackModels, reasoning } = this.selectionStrategy.selectModel(
        criteria,
        availableModels
      );

      selectedModelId = primaryModel.id;
      
      devLog(`[${this.config.context}] Model selection reasoning:`, reasoning);

      // Step 4: Execute request with fallback
      const fallbackOptions: FallbackOptions = {
        fallbackModels: [primaryModel.id, ...fallbackModels.map(m => m.id)],
        maxRetries: this.config.maxRetries,
        retryDelay: 1000,
        onFallback: (modelId, error, attempt) => {
          retryCount = attempt;
          logError(`[${this.config.context}] Fallback to ${modelId} (attempt ${attempt})`, error);
        },
      };

      const generateOptions: GenerateCallOptions = {
        messages: request.messages || [],
        images: request.images,
        // Add other options as needed
      };

      const result = await generateTextWithFallback(generateOptions, fallbackOptions);

      // Step 5: Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics(selectedModelId, {
          modelId: selectedModelId,
          requestType: complexity.type,
          responseTime: Date.now() - startTime,
          success: true,
          timestamp: new Date(),
          retryCount,
        });
      }

      return {
        text: result.text,
        parsed: result.parsed,
        modelUsed: selectedModelId,
        responseTime: Date.now() - startTime,
        metadata: {
          complexity: complexity.type,
          reasoning,
          retryCount,
        },
      };

    } catch (error) {
      // Record failure metrics
      if (selectedModelId && this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics(selectedModelId, {
          modelId: selectedModelId,
          requestType: 'unknown',
          responseTime: Date.now() - startTime,
          success: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          timestamp: new Date(),
          retryCount,
        });
      }

      throw ErrorFactory.fromUnknownError(error, {
        component: this.config.context,
        action: 'routeRequest',
        metadata: { selectedModelId, retryCount },
      });
    }
  }

  /**
   * Route a streaming request to the optimal model
   */
  public async routeStreamRequest(request: AIRequest): Promise<ReadableStream> {
    const startTime = Date.now();
    let selectedModelId: string | null = null;
    let retryCount = 0;

    try {
      // Step 1: Analyze request complexity
      const complexity = this.complexityAnalyzer.analyzeComplexity(request);

      // Step 2: Create selection criteria
      const criteria: ModelSelectionCriteria = {
        complexity,
        requiresVision: Boolean(request.images?.length),
        requiresStreaming: true,
        language: request.language,
        medicalSpecialty: request.medicalSpecialty,
      };

      // Step 3: Select optimal model
      const availableModels = Array.from(this.models.values());
      const { primaryModel, fallbackModels, reasoning } = this.selectionStrategy.selectModel(
        criteria,
        availableModels
      );

      selectedModelId = primaryModel.id;

      devLog(`[${this.config.context}] Streaming with model: ${primaryModel.capabilities.name}`);

      // Step 4: Execute streaming request with fallback
      const fallbackOptions: FallbackOptions = {
        fallbackModels: [primaryModel.id, ...fallbackModels.map(m => m.id)],
        maxRetries: Math.min(this.config.maxRetries, 2), // Fewer retries for streaming
        retryDelay: 500,
        onFallback: (modelId, error, attempt) => {
          retryCount = attempt;
          logError(`[${this.config.context}] Stream fallback to ${modelId} (attempt ${attempt})`, error);
        },
      };

      const streamOptions: StreamCallOptions = {
        messages: request.messages || [],
        images: request.images,
        onFinish: () => {
          // Record successful streaming metrics
          if (this.config.enablePerformanceMonitoring) {
            this.performanceMonitor.recordMetrics(selectedModelId!, {
              modelId: selectedModelId!,
              requestType: complexity.type,
              responseTime: Date.now() - startTime,
              success: true,
              timestamp: new Date(),
              retryCount,
            });
          }
        },
        onError: (error) => {
          // Record streaming error metrics
          if (this.config.enablePerformanceMonitoring) {
            this.performanceMonitor.recordMetrics(selectedModelId!, {
              modelId: selectedModelId!,
              requestType: complexity.type,
              responseTime: Date.now() - startTime,
              success: false,
              errorType: error.message,
              timestamp: new Date(),
              retryCount,
            });
          }
        },
      };

      const response = await streamTextWithFallback(streamOptions, fallbackOptions);
      return response.body!; // Return the readable stream

    } catch (error) {
      // Record failure metrics
      if (selectedModelId && this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordMetrics(selectedModelId, {
          modelId: selectedModelId,
          requestType: 'unknown',
          responseTime: Date.now() - startTime,
          success: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          timestamp: new Date(),
          retryCount,
        });
      }

      throw ErrorFactory.fromUnknownError(error, {
        component: this.config.context,
        action: 'routeStreamRequest',
        metadata: { selectedModelId, retryCount },
      });
    }
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics() {
    return this.performanceMonitor.getAnalytics();
  }

  /**
   * Switch selection strategy at runtime
   */
  public setSelectionStrategy(strategy: ModelSelectionStrategy): void {
    this.selectionStrategy = strategy;
    devLog(`[${this.config.context}] Selection strategy updated`);
  }

  /**
   * Switch complexity analyzer at runtime
   */
  public setComplexityAnalyzer(analyzer: ComplexityAnalysisStrategy): void {
    this.complexityAnalyzer = analyzer;
    devLog(`[${this.config.context}] Complexity analyzer updated`);
  }

  /**
   * Get current configuration
   */
  public getConfig(): ModelRouterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<ModelRouterConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update selection strategy if needed
    if (updates.useIntelligentSelection !== undefined) {
      this.selectionStrategy = updates.useIntelligentSelection
        ? new IntelligentModelSelectionStrategy(
            this.performanceMonitor,
            `${this.config.context}:Selection`
          )
        : new RuleBasedModelSelectionStrategy(`${this.config.context}:RuleSelection`);
    }

    devLog(`[${this.config.context}] Configuration updated`);
  }

  /**
   * Get available models
   */
  public getAvailableModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Clear performance history
   */
  public clearPerformanceHistory(): void {
    this.performanceMonitor.clearHistory();
    devLog(`[${this.config.context}] Performance history cleared`);
  }
}

/**
 * Factory function for creating a model router
 */
export function createModelRouter(config?: Partial<ModelRouterConfig>): ModelRouter {
  return new EnhancedModelRouter(config);
}

/**
 * Default router instance for convenience
 */
export const defaultModelRouter = new EnhancedModelRouter({
  context: 'DefaultModelRouter',
  useIntelligentSelection: true,
});