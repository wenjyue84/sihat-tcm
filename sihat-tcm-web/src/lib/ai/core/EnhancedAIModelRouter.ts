/**
 * Enhanced AI Model Router
 * 
 * Advanced AI model routing system with:
 * - Dynamic model selection based on complexity analysis
 * - Automatic fallback with performance monitoring
 * - Circuit breaker pattern for reliability
 * - Adaptive learning from usage patterns
 * - Comprehensive error handling and recovery
 */

import { 
  streamTextWithFallback,
  generateTextWithFallback,
  FallbackOptions,
  StreamCallOptions,
  GenerateCallOptions,
  parseApiError
} from '../../modelFallback';
import { 
  ModelSelectionCriteria, 
  ModelRouterConfig, 
  AnalysisRequestDTO,
  PerformanceMetrics,
  ModelHealthStatus,
  CircuitBreakerState,
  CircuitBreakerConfig
} from '../interfaces/ModelInterfaces';
import { ComplexityAnalyzer } from '../analysis/ComplexityAnalyzer';
import { ModelSelectionStrategy } from '../selection/ModelSelectionStrategy';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { ErrorFactory } from '../../errors/AppError';
import { logger } from '../../logger';

export interface EnhancedRouterConfig extends ModelRouterConfig {
  // Circuit breaker settings
  circuitBreakerEnabled?: boolean;
  failureThreshold?: number;
  recoveryTimeout?: number;
  
  // Adaptive learning settings
  adaptiveLearningEnabled?: boolean;
  learningWindowSize?: number;
  performanceWeightDecay?: number;
  
  // Health monitoring
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  
  // Advanced fallback
  intelligentFallbackEnabled?: boolean;
  fallbackSelectionStrategy?: 'performance' | 'cost' | 'reliability';
  
  // Rate limiting
  rateLimitEnabled?: boolean;
  requestsPerMinute?: number;
  burstLimit?: number;
}

export interface RouteResult<T = string> {
  text: string;
  parsed?: T;
  modelUsed: number;
  modelId: string;
  status: string;
  responseTime: number;
  fallbacksUsed: number;
  circuitBreakerTriggered: boolean;
  confidence: number;
}

export interface ModelMetrics {
  modelId: string;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: Date;
  totalRequests: number;
  circuitBreakerState: CircuitBreakerState;
}

/**
 * Enhanced AI Model Router with advanced routing capabilities
 */
export class EnhancedAIModelRouter {
  private complexityAnalyzer: ComplexityAnalyzer;
  private selectionStrategy: ModelSelectionStrategy;
  private performanceMonitor: PerformanceMonitor;
  private config: Required<EnhancedRouterConfig>;
  private readonly appName: string;
  
  // Circuit breaker states
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private circuitBreakerConfigs = new Map<string, CircuitBreakerConfig>();
  
  // Adaptive learning data
  private modelPerformanceHistory = new Map<string, PerformanceMetrics[]>();
  private adaptiveWeights = new Map<string, number>();
  
  // Health monitoring
  private modelHealthStatus = new Map<string, ModelHealthStatus>();
  private healthCheckTimer?: NodeJS.Timeout;
  
  // Rate limiting
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(appName: string = "EnhancedSihatTCM", config?: Partial<EnhancedRouterConfig>) {
    this.appName = appName;
    this.config = {
      // Base config
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 10000,
      maxRetries: 3,
      timeout: 30000,
      
      // Enhanced config
      circuitBreakerEnabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000,
      adaptiveLearningEnabled: true,
      learningWindowSize: 100,
      performanceWeightDecay: 0.95,
      healthCheckInterval: 300000, // 5 minutes
      healthCheckTimeout: 5000,
      intelligentFallbackEnabled: true,
      fallbackSelectionStrategy: 'performance',
      rateLimitEnabled: true,
      requestsPerMinute: 60,
      burstLimit: 10,
      
      ...config,
    };

    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.selectionStrategy = new ModelSelectionStrategy();
    this.performanceMonitor = new PerformanceMonitor();

    this.initializeCircuitBreakers();
    this.startHealthMonitoring();
    
    logger.info('Enhanced AI Model Router initialized', { 
      appName: this.appName, 
      config: this.config 
    });
  }

  /**
   * Generate text with enhanced routing and monitoring
   */
  async generateWithEnhancedRouting<T = string>(
    criteria: ModelSelectionCriteria,
    options: GenerateCallOptions,
    validator?: (text: string) => { valid: boolean; parsed?: T }
  ): Promise<RouteResult<T>> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let fallbacksUsed = 0;
    let circuitBreakerTriggered = false;

    try {
      // Rate limiting check
      if (this.config.rateLimitEnabled && !this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Select optimal model with enhanced logic
      const modelSelection = await this.selectModelWithEnhancedLogic(criteria);
      selectedModel = modelSelection.primaryModel;
      
      logger.debug('Enhanced model selection', {
        selected: selectedModel,
        reasoning: modelSelection.reasoning,
        confidence: modelSelection.confidence
      });

      // Check circuit breaker
      if (this.config.circuitBreakerEnabled && this.isCircuitBreakerOpen(selectedModel)) {
        circuitBreakerTriggered = true;
        logger.warn('Circuit breaker open for model', { modelId: selectedModel });
        
        // Select alternative model
        const alternativeSelection = await this.selectAlternativeModel(criteria, [selectedModel]);
        selectedModel = alternativeSelection.primaryModel;
        fallbacksUsed++;
      }

      // Prepare fallback options with intelligent selection
      const fallbackOptions = await this.prepareFallbackOptions(selectedModel, criteria);

      // Execute request
      const result = await generateTextWithFallback<T>(fallbackOptions, options, validator);

      // Record success metrics
      this.recordSuccess(result.modelId, Date.now() - startTime);
      
      // Update adaptive weights
      if (this.config.adaptiveLearningEnabled) {
        this.updateAdaptiveWeights(result.modelId, true, Date.now() - startTime);
      }

      return {
        ...result,
        responseTime: Date.now() - startTime,
        fallbacksUsed,
        circuitBreakerTriggered,
        confidence: modelSelection.confidence || 0.8
      };

    } catch (error) {
      // Record failure metrics
      if (selectedModel) {
        this.recordFailure(selectedModel, error);
        
        if (this.config.adaptiveLearningEnabled) {
          this.updateAdaptiveWeights(selectedModel, false, Date.now() - startTime);
        }
      }

      // Enhanced error handling
      const enhancedError = this.enhanceError(error, {
        selectedModel,
        criteria,
        fallbacksUsed,
        circuitBreakerTriggered
      });

      throw enhancedError;
    }
  }

  /**
   * Stream text with enhanced routing
   */
  async streamWithEnhancedRouting(
    criteria: ModelSelectionCriteria,
    options: StreamCallOptions
  ): Promise<Response> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let circuitBreakerTriggered = false;

    try {
      // Rate limiting check
      if (this.config.rateLimitEnabled && !this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Select optimal model
      const modelSelection = await this.selectModelWithEnhancedLogic(criteria);
      selectedModel = modelSelection.primaryModel;

      // Check circuit breaker
      if (this.config.circuitBreakerEnabled && this.isCircuitBreakerOpen(selectedModel)) {
        circuitBreakerTriggered = true;
        const alternativeSelection = await this.selectAlternativeModel(criteria, [selectedModel]);
        selectedModel = alternativeSelection.primaryModel;
      }

      // Prepare fallback options
      const fallbackOptions = await this.prepareFallbackOptions(selectedModel, criteria);

      // Execute streaming request
      const result = await streamTextWithFallback(fallbackOptions, {
        ...options,
        onFinish: (completion) => {
          this.recordSuccess(selectedModel!, Date.now() - startTime);
          options.onFinish?.(completion);
        },
        onError: (error) => {
          this.recordFailure(selectedModel!, error);
          options.onError?.(error);
        }
      });

      return result;

    } catch (error) {
      if (selectedModel) {
        this.recordFailure(selectedModel, error);
      }

      throw this.enhanceError(error, {
        selectedModel,
        criteria,
        circuitBreakerTriggered
      });
    }
  }

  /**
   * Select model with enhanced logic including adaptive learning
   */
  private async selectModelWithEnhancedLogic(criteria: ModelSelectionCriteria) {
    // Base selection
    const baseSelection = this.selectionStrategy.selectOptimalModel(criteria);
    
    if (!this.config.adaptiveLearningEnabled) {
      return { ...baseSelection, confidence: 0.8 };
    }

    // Apply adaptive learning
    const adaptiveSelection = this.applyAdaptiveLearning(baseSelection, criteria);
    
    return adaptiveSelection;
  }

  /**
   * Apply adaptive learning to model selection
   */
  private applyAdaptiveLearning(baseSelection: any, criteria: ModelSelectionCriteria) {
    const { primaryModel, fallbackModels } = baseSelection;
    
    // Get adaptive weights for available models
    const allModels = [primaryModel, ...fallbackModels];
    const modelScores = allModels.map(modelId => {
      const weight = this.adaptiveWeights.get(modelId) || 1.0;
      const health = this.modelHealthStatus.get(modelId);
      const healthScore = health ? (health.availability / 100) * (1 - health.errorRate) : 0.5;
      
      return {
        modelId,
        score: weight * healthScore,
        weight,
        healthScore
      };
    });

    // Sort by score and select best
    modelScores.sort((a, b) => b.score - a.score);
    const bestModel = modelScores[0];
    
    // Calculate confidence based on score difference
    const confidence = modelScores.length > 1 
      ? Math.min(0.95, bestModel.score / (modelScores[1].score + 0.1))
      : 0.8;

    return {
      primaryModel: bestModel.modelId,
      fallbackModels: modelScores.slice(1).map(m => m.modelId),
      reasoning: `Adaptive selection: ${bestModel.modelId} (score: ${bestModel.score.toFixed(3)}, weight: ${bestModel.weight.toFixed(3)})`,
      confidence,
      adaptiveScores: modelScores
    };
  }

  /**
   * Select alternative model when primary is unavailable
   */
  private async selectAlternativeModel(criteria: ModelSelectionCriteria, excludeModels: string[]) {
    // Get all available models excluding the problematic ones
    const availableModels = this.getAvailableModels().filter(
      modelId => !excludeModels.includes(modelId) && !this.isCircuitBreakerOpen(modelId)
    );

    if (availableModels.length === 0) {
      throw new Error('No available models after circuit breaker filtering');
    }

    // Select best alternative
    const alternativeCriteria = {
      ...criteria,
      availableModels
    };

    return this.selectModelWithEnhancedLogic(alternativeCriteria);
  }

  /**
   * Prepare intelligent fallback options
   */
  private async prepareFallbackOptions(primaryModel: string, criteria: ModelSelectionCriteria): Promise<FallbackOptions> {
    let fallbackModels: string[] = [];

    if (this.config.intelligentFallbackEnabled) {
      // Intelligent fallback selection based on strategy
      fallbackModels = this.selectIntelligentFallbacks(primaryModel, criteria);
    } else {
      // Use default fallbacks
      fallbackModels = this.getDefaultFallbacks(criteria.complexity.type);
    }

    return {
      primaryModel,
      fallbackModels,
      context: this.appName,
      useAsyncApiKey: true
    };
  }

  /**
   * Select intelligent fallbacks based on strategy
   */
  private selectIntelligentFallbacks(primaryModel: string, criteria: ModelSelectionCriteria): string[] {
    const availableModels = this.getAvailableModels().filter(
      modelId => modelId !== primaryModel && !this.isCircuitBreakerOpen(modelId)
    );

    switch (this.config.fallbackSelectionStrategy) {
      case 'performance':
        return this.selectByPerformance(availableModels, criteria);
      case 'cost':
        return this.selectByCost(availableModels, criteria);
      case 'reliability':
        return this.selectByReliability(availableModels);
      default:
        return availableModels.slice(0, 3);
    }
  }

  /**
   * Select fallbacks by performance
   */
  private selectByPerformance(models: string[], criteria: ModelSelectionCriteria): string[] {
    return models
      .map(modelId => ({
        modelId,
        avgResponseTime: this.getAverageResponseTime(modelId),
        successRate: this.getSuccessRate(modelId)
      }))
      .sort((a, b) => {
        const scoreA = a.successRate * (1 / (a.avgResponseTime + 1));
        const scoreB = b.successRate * (1 / (b.avgResponseTime + 1));
        return scoreB - scoreA;
      })
      .map(m => m.modelId)
      .slice(0, 3);
  }

  /**
   * Select fallbacks by cost (simplified - would need actual cost data)
   */
  private selectByCost(models: string[], criteria: ModelSelectionCriteria): string[] {
    // Simplified cost ordering (in real implementation, use actual cost data)
    const costOrder = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    return models.sort((a, b) => {
      const indexA = costOrder.indexOf(a);
      const indexB = costOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }).slice(0, 3);
  }

  /**
   * Select fallbacks by reliability
   */
  private selectByReliability(models: string[]): string[] {
    return models
      .map(modelId => ({
        modelId,
        reliability: this.getReliabilityScore(modelId)
      }))
      .sort((a, b) => b.reliability - a.reliability)
      .map(m => m.modelId)
      .slice(0, 3);
  }

  /**
   * Circuit breaker management
   */
  private initializeCircuitBreakers(): void {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: this.config.failureThreshold,
      recoveryTimeout: this.config.recoveryTimeout,
      monitoringPeriod: 60000, // 1 minute
      halfOpenMaxCalls: 3
    };

    // Initialize circuit breakers for known models
    const knownModels = this.getAvailableModels();
    knownModels.forEach(modelId => {
      this.circuitBreakerConfigs.set(modelId, defaultConfig);
      this.circuitBreakers.set(modelId, {
        state: 'closed',
        failureCount: 0
      });
    });
  }

  private isCircuitBreakerOpen(modelId: string): boolean {
    if (!this.config.circuitBreakerEnabled) return false;
    
    const state = this.circuitBreakers.get(modelId);
    if (!state) return false;

    if (state.state === 'open') {
      const config = this.circuitBreakerConfigs.get(modelId);
      if (config && state.nextAttemptTime && Date.now() >= state.nextAttemptTime.getTime()) {
        // Transition to half-open
        state.state = 'half_open';
        logger.info('Circuit breaker transitioning to half-open', { modelId });
      }
    }

    return state.state === 'open';
  }

  private recordSuccess(modelId: string, responseTime: number): void {
    // Record performance metrics
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor.recordMetrics({
        modelId,
        requestType: 'generate', // simplified
        responseTime,
        success: true,
        timestamp: new Date(),
        retryCount: 0
      });
    }

    // Update circuit breaker
    if (this.config.circuitBreakerEnabled) {
      const state = this.circuitBreakers.get(modelId);
      if (state) {
        if (state.state === 'half_open') {
          state.state = 'closed';
          state.failureCount = 0;
          logger.info('Circuit breaker closed after successful request', { modelId });
        }
      }
    }

    // Update health status
    this.updateHealthStatus(modelId, true, responseTime);
  }

  private recordFailure(modelId: string, error: any): void {
    // Record performance metrics
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor.recordMetrics({
        modelId,
        requestType: 'generate',
        responseTime: 0,
        success: false,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date(),
        retryCount: 0
      });
    }

    // Update circuit breaker
    if (this.config.circuitBreakerEnabled) {
      const state = this.circuitBreakers.get(modelId);
      const config = this.circuitBreakerConfigs.get(modelId);
      
      if (state && config) {
        state.failureCount++;
        state.lastFailureTime = new Date();

        if (state.failureCount >= config.failureThreshold) {
          state.state = 'open';
          state.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
          logger.warn('Circuit breaker opened due to failures', { 
            modelId, 
            failureCount: state.failureCount 
          });
        }
      }
    }

    // Update health status
    this.updateHealthStatus(modelId, false, 0);
  }

  /**
   * Adaptive learning methods
   */
  private updateAdaptiveWeights(modelId: string, success: boolean, responseTime: number): void {
    const currentWeight = this.adaptiveWeights.get(modelId) || 1.0;
    
    // Calculate performance score (success rate and speed)
    const performanceScore = success ? Math.max(0.1, 1.0 / (responseTime / 1000 + 1)) : 0.1;
    
    // Update weight with exponential moving average
    const newWeight = (currentWeight * this.config.performanceWeightDecay) + 
                     (performanceScore * (1 - this.config.performanceWeightDecay));
    
    this.adaptiveWeights.set(modelId, Math.max(0.1, Math.min(2.0, newWeight)));
    
    logger.debug('Updated adaptive weight', { 
      modelId, 
      oldWeight: currentWeight, 
      newWeight, 
      performanceScore 
    });
  }

  /**
   * Health monitoring
   */
  private startHealthMonitoring(): void {
    if (!this.config.healthCheckInterval) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const models = this.getAvailableModels();
    
    for (const modelId of models) {
      try {
        const healthStatus = await this.checkModelHealth(modelId);
        this.modelHealthStatus.set(modelId, healthStatus);
      } catch (error) {
        logger.error('Health check failed', { modelId, error });
      }
    }
  }

  private async checkModelHealth(modelId: string): Promise<ModelHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Simple health check with minimal request
      const testOptions: GenerateCallOptions = {
        system: 'Respond with "OK"',
        messages: [{ role: 'user', content: 'Health check' }]
      };

      await generateTextWithFallback({
        primaryModel: modelId,
        fallbackModels: [],
        context: 'HealthCheck',
        useAsyncApiKey: true
      }, testOptions);

      const responseTime = Date.now() - startTime;
      const metrics = this.performanceMonitor.getModelPerformance(modelId);

      return {
        modelId,
        isHealthy: true,
        lastChecked: new Date(),
        responseTime,
        errorRate: metrics?.errorRate || 0,
        availability: 100,
        issues: []
      };

    } catch (error) {
      return {
        modelId,
        isHealthy: false,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorRate: 1.0,
        availability: 0,
        issues: [{
          type: 'availability',
          severity: 'high',
          description: error instanceof Error ? error.message : 'Health check failed',
          firstOccurred: new Date(),
          lastOccurred: new Date(),
          occurrenceCount: 1
        }]
      };
    }
  }

  private updateHealthStatus(modelId: string, success: boolean, responseTime: number): void {
    const current = this.modelHealthStatus.get(modelId);
    if (!current) return;

    // Update running averages (simplified)
    const alpha = 0.1; // Smoothing factor
    current.responseTime = current.responseTime * (1 - alpha) + responseTime * alpha;
    current.errorRate = current.errorRate * (1 - alpha) + (success ? 0 : 1) * alpha;
    current.availability = Math.max(0, Math.min(100, current.availability * (1 - alpha) + (success ? 100 : 0) * alpha));
    current.lastChecked = new Date();
    current.isHealthy = current.availability > 50 && current.errorRate < 0.5;
  }

  /**
   * Rate limiting
   */
  private checkRateLimit(): boolean {
    if (!this.config.rateLimitEnabled) return true;

    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window
    const key = `${this.appName}:${windowStart}`;
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime: windowStart + 60000 };
    
    if (now >= current.resetTime) {
      // Reset window
      current.count = 0;
      current.resetTime = windowStart + 60000;
    }

    if (current.count >= this.config.requestsPerMinute) {
      return false;
    }

    current.count++;
    this.requestCounts.set(key, current);
    return true;
  }

  /**
   * Utility methods
   */
  private getAvailableModels(): string[] {
    return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  private getDefaultFallbacks(requestType: string): string[] {
    switch (requestType) {
      case 'vision':
      case 'analysis':
        return ['gemini-1.5-pro', 'gemini-2.0-flash'];
      default:
        return ['gemini-2.0-flash', 'gemini-1.5-flash'];
    }
  }

  private getAverageResponseTime(modelId: string): number {
    const metrics = this.performanceMonitor.getModelPerformance(modelId);
    return metrics?.averageResponseTime || 5000;
  }

  private getSuccessRate(modelId: string): number {
    const metrics = this.performanceMonitor.getModelPerformance(modelId);
    return metrics?.successRate || 0.5;
  }

  private getReliabilityScore(modelId: string): number {
    const health = this.modelHealthStatus.get(modelId);
    if (!health) return 0.5;
    
    return (health.availability / 100) * (1 - health.errorRate);
  }

  private enhanceError(error: any, context: any): Error {
    const parsedError = parseApiError(error);
    
    return ErrorFactory.fromUnknownError(error, {
      component: 'EnhancedAIModelRouter',
      action: 'routing',
      metadata: {
        ...context,
        parsedError,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Public API methods
   */
  public getModelMetrics(): ModelMetrics[] {
    return this.getAvailableModels().map(modelId => ({
      modelId,
      successRate: this.getSuccessRate(modelId),
      averageResponseTime: this.getAverageResponseTime(modelId),
      errorRate: this.modelHealthStatus.get(modelId)?.errorRate || 0,
      lastUsed: new Date(), // Simplified
      totalRequests: 0, // Would need to track this
      circuitBreakerState: this.circuitBreakers.get(modelId) || { state: 'closed', failureCount: 0 }
    }));
  }

  public getHealthStatus(): ModelHealthStatus[] {
    return Array.from(this.modelHealthStatus.values());
  }

  public getAdaptiveWeights(): Record<string, number> {
    return Object.fromEntries(this.adaptiveWeights);
  }

  public resetCircuitBreaker(modelId: string): void {
    const state = this.circuitBreakers.get(modelId);
    if (state) {
      state.state = 'closed';
      state.failureCount = 0;
      delete state.lastFailureTime;
      delete state.nextAttemptTime;
      logger.info('Circuit breaker manually reset', { modelId });
    }
  }

  public destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.circuitBreakers.clear();
    this.modelHealthStatus.clear();
    this.adaptiveWeights.clear();
    this.requestCounts.clear();
    
    logger.info('Enhanced AI Model Router destroyed');
  }
}

// Export singleton instance
export const defaultEnhancedRouter = new EnhancedAIModelRouter();

// Export factory function
export function createEnhancedRouter(appName?: string, config?: Partial<EnhancedRouterConfig>): EnhancedAIModelRouter {
  return new EnhancedAIModelRouter(appName, config);
}