/**
 * AI Model Router - Enhanced Version with Better Architecture
 *
 * Improvements:
 * - Better error handling with custom error types
 * - Enhanced performance monitoring
 * - Improved type safety
 * - Better separation of concerns
 * - More robust fallback mechanisms
 * - Comprehensive logging and metrics
 */

import {
  streamTextWithFallback,
  generateTextWithFallback,
  DEFAULT_FALLBACK_MODELS,
  ADVANCED_FALLBACK_MODELS,
  FallbackOptions,
  StreamCallOptions,
  GenerateCallOptions,
} from "./modelFallback";
import { DOCTOR_LEVELS, DoctorLevel } from "./doctorLevels";
import { 
  AI_MODELS, 
  AI_PERFORMANCE, 
  MODEL_CAPABILITIES, 
  COMPLEXITY_SCORING,
  PRIORITY_LEVELS 
} from "./constants";
import { AppError, AIModelError, ErrorFactory } from "./errors/AppError";
import { devLog, logError, logInfo } from "./systemLogger";

/**
 * Enhanced performance metrics with more detailed tracking
 */
export interface ModelPerformanceMetrics {
  modelId: string;
  requestType: RequestComplexityType;
  responseTime: number;
  success: boolean;
  errorType?: string;
  confidenceScore?: number;
  timestamp: Date;
  tokenCount?: number;
  costEstimate?: number;
  retryCount?: number;
}

/**
 * Enhanced request complexity analysis
 */
export interface RequestComplexity {
  type: RequestComplexityType;
  factors: ComplexityFactors;
  score: number;
  reasoning: string[];
  recommendedModel: string;
  fallbackModels: string[];
}

export type RequestComplexityType = "simple" | "moderate" | "complex" | "advanced";

interface ComplexityFactors {
  hasImages: boolean;
  hasMultipleFiles: boolean;
  hasLongHistory: boolean;
  requiresAnalysis: boolean;
  requiresPersonalization: boolean;
  messageCount: number;
  imageCount: number;
  fileSize: number;
  medicalComplexity: "low" | "medium" | "high";
  urgencyLevel: "low" | "normal" | "high" | "urgent";
}

/**
 * Model selection criteria with enhanced options
 */
export interface ModelSelectionCriteria {
  complexity: RequestComplexity;
  doctorLevel?: DoctorLevel;
  requiresVision?: boolean;
  requiresStreaming?: boolean;
  maxLatency?: number;
  maxCost?: number;
  preferredModels?: string[];
  excludedModels?: string[];
  language?: string;
  medicalSpecialty?: string;
}

/**
 * Model capabilities and characteristics
 */
interface ModelCapabilities {
  id: string;
  name: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  averageLatency: number;
  costPerToken: number;
  qualityScore: number;
  medicalAccuracy: number;
  supportedLanguages: string[];
  complexityRating: RequestComplexityType[];
}

/**
 * Enhanced AI Model Router with improved architecture
 */
export class AIModelRouter {
  private performanceHistory: ModelPerformanceMetrics[] = [];
  private modelCapabilities: Map<string, ModelCapabilities> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly appName: string;

  constructor(appName: string = "SihatTCM") {
    this.appName = appName;
    this.initializeModelCapabilities();
  }

  /**
   * Initialize model capabilities database using constants
   */
  private initializeModelCapabilities(): void {
    Object.entries(MODEL_CAPABILITIES).forEach(([modelId, capabilities]) => {
      this.modelCapabilities.set(modelId, {
        id: modelId,
        name: this.getModelDisplayName(modelId),
        ...capabilities,
        supportedLanguages: ["en", "zh", "ms"], // From constants
      });
    });
  }

  /**
   * Get display name for model
   */
  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      [AI_MODELS.GEMINI_2_FLASH]: "Gemini 2.0 Flash",
      [AI_MODELS.GEMINI_2_5_PRO]: "Gemini 2.5 Pro", 
      [AI_MODELS.GEMINI_3_PRO_PREVIEW]: "Gemini 3.0 Pro Preview",
    };
    return displayNames[modelId] || modelId;
  }

  /**
   * Enhanced complexity analysis with detailed reasoning
   */
  public analyzeComplexity(request: {
    messages?: any[];
    images?: any[];
    files?: any[];
    requiresAnalysis?: boolean;
    requiresPersonalization?: boolean;
    medicalHistory?: any;
    urgency?: string;
  }): RequestComplexity {
    const factors: ComplexityFactors = {
      hasImages: Boolean(request.images?.length),
      hasMultipleFiles: Boolean(request.files && request.files.length > 1),
      hasLongHistory: Boolean(request.messages && request.messages.length > 10),
      requiresAnalysis: Boolean(request.requiresAnalysis),
      requiresPersonalization: Boolean(request.requiresPersonalization),
      messageCount: request.messages?.length || 0,
      imageCount: request.images?.length || 0,
      fileSize: this.calculateTotalFileSize(request.files),
      medicalComplexity: this.assessMedicalComplexity(request),
      urgencyLevel: (request.urgency as any) || "normal",
    };

    const score = this.calculateComplexityScore(factors);
    const type = this.determineComplexityType(score);
    const reasoning = this.generateComplexityReasoning(factors, score);
    const { recommendedModel, fallbackModels } = this.getModelRecommendations(type, factors);

    return {
      type,
      factors,
      score,
      reasoning,
      recommendedModel,
      fallbackModels,
    };
  }

  /**
   * Enhanced model selection with comprehensive criteria evaluation
   */
  public selectOptimalModel(criteria: ModelSelectionCriteria): {
    primaryModel: string;
    fallbackModels: string[];
    reasoning: string[];
  } {
    try {
      const { complexity, doctorLevel, requiresVision, requiresStreaming } = criteria;
      
      // Filter models based on requirements
      const eligibleModels = Array.from(this.modelCapabilities.values()).filter(model => {
        // Check vision requirement
        if (requiresVision && !model.supportsVision) return false;
        
        // Check streaming requirement
        if (requiresStreaming && !model.supportsStreaming) return false;
        
        // Check complexity compatibility
        if (!model.complexityRating.includes(complexity.type)) return false;
        
        // Check excluded models
        if (criteria.excludedModels?.includes(model.id)) return false;
        
        return true;
      });

      if (eligibleModels.length === 0) {
        throw new AIModelError("No eligible models found for the given criteria");
      }

      // Score models based on criteria
      const scoredModels = eligibleModels.map(model => ({
        model,
        score: this.scoreModel(model, criteria),
      }));

      // Sort by score (descending)
      scoredModels.sort((a, b) => b.score - a.score);

      const primaryModel = scoredModels[0].model.id;
      const fallbackModels = scoredModels.slice(1, 4).map(sm => sm.model.id);
      
      const reasoning = [
        `Selected ${scoredModels[0].model.name} as primary model`,
        `Complexity: ${complexity.type} (score: ${complexity.score})`,
        `Doctor level: ${doctorLevel || 'not specified'}`,
        `Vision required: ${requiresVision ? 'yes' : 'no'}`,
        `Streaming required: ${requiresStreaming ? 'yes' : 'no'}`,
      ];

      return {
        primaryModel,
        fallbackModels,
        reasoning,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AIModelRouter',
        action: 'selectOptimalModel',
        metadata: { criteria },
      });
    }
  }

  /**
   * Generate text with intelligent routing and comprehensive error handling
   */
  public async generateWithRouting(
    criteria: ModelSelectionCriteria,
    options: GenerateCallOptions
  ): Promise<any> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let retryCount = 0;

    try {
      const { primaryModel, fallbackModels, reasoning } = this.selectOptimalModel(criteria);
      selectedModel = primaryModel;

      devLog(`[AIModelRouter] Using model: ${primaryModel}`, { reasoning });

      // Prepare fallback options
      const fallbackOptions: FallbackOptions = {
        fallbackModels: [primaryModel, ...fallbackModels],
        maxRetries: 3,
        retryDelay: 1000,
        onFallback: (model, error, attempt) => {
          retryCount = attempt;
          logError(`[AIModelRouter] Fallback to ${model} (attempt ${attempt})`, error);
        },
      };

      const result = await generateTextWithFallback(options, fallbackOptions);

      // Record successful metrics
      this.recordMetrics({
        modelId: selectedModel,
        requestType: criteria.complexity.type,
        responseTime: Date.now() - startTime,
        success: true,
        timestamp: new Date(),
        retryCount,
      });

      return result;
    } catch (error) {
      // Record failure metrics
      if (selectedModel) {
        this.recordMetrics({
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
  public async streamWithRouting(
    criteria: ModelSelectionCriteria,
    options: StreamCallOptions
  ): Promise<any> {
    const startTime = Date.now();
    let selectedModel: string | null = null;
    let retryCount = 0;

    try {
      const { primaryModel, fallbackModels, reasoning } = this.selectOptimalModel(criteria);
      selectedModel = primaryModel;

      devLog(`[AIModelRouter] Streaming with model: ${primaryModel}`, { reasoning });

      const fallbackOptions: FallbackOptions = {
        fallbackModels: [primaryModel, ...fallbackModels],
        maxRetries: 2, // Fewer retries for streaming
        retryDelay: 500,
        onFallback: (model, error, attempt) => {
          retryCount = attempt;
          logError(`[AIModelRouter] Stream fallback to ${model} (attempt ${attempt})`, error);
        },
      };

      const result = await streamTextWithFallback(options, fallbackOptions);

      // Record successful metrics
      this.recordMetrics({
        modelId: selectedModel,
        requestType: criteria.complexity.type,
        responseTime: Date.now() - startTime,
        success: true,
        timestamp: new Date(),
        retryCount,
      });

      return result;
    } catch (error) {
      // Record failure metrics
      if (selectedModel) {
        this.recordMetrics({
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
  public getPerformanceAnalytics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    modelPerformance: Record<string, {
      requests: number;
      successRate: number;
      averageResponseTime: number;
    }>;
    recentErrors: ModelPerformanceMetrics[];
  } {
    const totalRequests = this.performanceHistory.length;
    const successfulRequests = this.performanceHistory.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    
    const totalResponseTime = this.performanceHistory.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    // Model-specific performance
    const modelPerformance: Record<string, any> = {};
    for (const model of this.modelCapabilities.keys()) {
      const modelMetrics = this.performanceHistory.filter(m => m.modelId === model);
      const modelSuccessful = modelMetrics.filter(m => m.success).length;
      
      modelPerformance[model] = {
        requests: modelMetrics.length,
        successRate: modelMetrics.length > 0 ? modelSuccessful / modelMetrics.length : 0,
        averageResponseTime: modelMetrics.length > 0 
          ? modelMetrics.reduce((sum, m) => sum + m.responseTime, 0) / modelMetrics.length 
          : 0,
      };
    }

    // Recent errors (last 10)
    const recentErrors = this.performanceHistory
      .filter(m => !m.success)
      .slice(-10);

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      modelPerformance,
      recentErrors,
    };
  }

  // Private helper methods

  private calculateTotalFileSize(files?: any[]): number {
    if (!files) return 0;
    return files.reduce((total, file) => total + (file.size || 0), 0);
  }

  private assessMedicalComplexity(request: any): "low" | "medium" | "high" {
    // Assess based on medical history, symptoms, etc.
    if (request.medicalHistory?.conditions?.length > 3) return "high";
    if (request.medicalHistory?.medications?.length > 2) return "medium";
    return "low";
  }

  /**
   * Calculate complexity score using constants
   */
  private calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;
    
    // Base scoring using constants
    score += factors.messageCount * COMPLEXITY_SCORING.BASE_MESSAGE_WEIGHT;
    score += factors.imageCount * COMPLEXITY_SCORING.IMAGE_WEIGHT;
    score += Math.min(factors.fileSize / 1024 / 1024, 10) * COMPLEXITY_SCORING.FILE_SIZE_WEIGHT; // MB to score
    
    // Boolean factors using constants
    if (factors.hasImages) score += COMPLEXITY_SCORING.IMAGE_BONUS;
    if (factors.hasMultipleFiles) score += COMPLEXITY_SCORING.MULTIPLE_FILES_BONUS;
    if (factors.hasLongHistory) score += COMPLEXITY_SCORING.LONG_HISTORY_BONUS;
    if (factors.requiresAnalysis) score += COMPLEXITY_SCORING.ANALYSIS_BONUS;
    if (factors.requiresPersonalization) score += COMPLEXITY_SCORING.PERSONALIZATION_BONUS;
    
    // Medical complexity using constants
    score += COMPLEXITY_SCORING.MEDICAL_COMPLEXITY[factors.medicalComplexity.toUpperCase() as keyof typeof COMPLEXITY_SCORING.MEDICAL_COMPLEXITY] || 0;
    
    // Urgency using constants
    score += COMPLEXITY_SCORING.URGENCY_LEVELS[factors.urgencyLevel.toUpperCase() as keyof typeof COMPLEXITY_SCORING.URGENCY_LEVELS] || 0;
    
    return Math.min(score, COMPLEXITY_SCORING.MAX_SCORE);
  }

  /**
   * Determine complexity type using constants
   */
  private determineComplexityType(score: number): RequestComplexityType {
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.ADVANCED) return "advanced";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.COMPLEX) return "complex";
    if (score >= COMPLEXITY_SCORING.THRESHOLDS.MODERATE) return "moderate";
    return "simple";
  }

  private generateComplexityReasoning(factors: ComplexityFactors, score: number): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Overall complexity score: ${score}/100`);
    
    if (factors.hasImages) reasoning.push("Contains images requiring vision analysis");
    if (factors.hasMultipleFiles) reasoning.push("Multiple files need processing");
    if (factors.hasLongHistory) reasoning.push("Long conversation history");
    if (factors.requiresAnalysis) reasoning.push("Requires deep medical analysis");
    if (factors.requiresPersonalization) reasoning.push("Needs personalized recommendations");
    if (factors.medicalComplexity === "high") reasoning.push("High medical complexity detected");
    if (factors.urgencyLevel === "urgent") reasoning.push("Urgent priority level");
    
    return reasoning;
  }

  private getModelRecommendations(type: RequestComplexityType, factors: ComplexityFactors): {
    recommendedModel: string;
    fallbackModels: string[];
  } {
    switch (type) {
      case "advanced":
        return {
          recommendedModel: AI_MODELS.GEMINI_3_PRO_PREVIEW,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO, AI_MODELS.GEMINI_2_FLASH],
        };
      case "complex":
        return {
          recommendedModel: AI_MODELS.GEMINI_2_5_PRO,
          fallbackModels: [AI_MODELS.GEMINI_3_PRO_PREVIEW, AI_MODELS.GEMINI_2_FLASH],
        };
      case "moderate":
        return {
          recommendedModel: factors.hasImages ? AI_MODELS.GEMINI_2_5_PRO : AI_MODELS.GEMINI_2_FLASH,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO, AI_MODELS.GEMINI_2_FLASH],
        };
      default: // simple
        return {
          recommendedModel: AI_MODELS.GEMINI_2_FLASH,
          fallbackModels: [AI_MODELS.GEMINI_2_5_PRO],
        };
    }
  }

  private scoreModel(model: ModelCapabilities, criteria: ModelSelectionCriteria): number {
    let score = 0;
    
    // Base quality score
    score += model.qualityScore * 40;
    
    // Medical accuracy for medical applications
    score += model.medicalAccuracy * 30;
    
    // Latency preference (lower is better)
    const latencyScore = Math.max(0, 20 - (model.averageLatency / 100));
    score += latencyScore;
    
    // Cost efficiency (lower cost is better)
    const costScore = Math.max(0, 10 - (model.costPerToken * 1000000));
    score += costScore;
    
    // Preferred models bonus
    if (criteria.preferredModels?.includes(model.id)) {
      score += 20;
    }
    
    // Language support
    if (criteria.language && model.supportedLanguages.includes(criteria.language)) {
      score += 10;
    }
    
    return score;
  }

  private recordMetrics(metrics: Omit<ModelPerformanceMetrics, 'timestamp'> & { timestamp: Date }): void {
    this.performanceHistory.push(metrics);
    
    // Maintain history size limit
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }
    
    // Log performance data
    devLog(`[AIModelRouter] Performance recorded`, {
      model: metrics.modelId,
      success: metrics.success,
      responseTime: metrics.responseTime,
      retryCount: metrics.retryCount,
    });
  }
}

export interface ModelSelectionCriteria {
  complexity: RequestComplexity;
  doctorLevel?: DoctorLevel;
  preferredModel?: string;
  requiresVision?: boolean;
  requiresStreaming?: boolean;
  maxResponseTime?: number;
}

export interface ModelRouterConfig {
  enablePerformanceMonitoring: boolean;
  enableAdaptiveSelection: boolean;
  fallbackThreshold: number; // ms
  maxRetries: number;
}

/**
 * AI Model Router class for intelligent model selection and routing
 *
 * This class implements intelligent AI model selection based on various criteria
 * including request complexity, performance history, and specific requirements.
 * It maintains performance metrics for all models and uses this data to make
 * optimal routing decisions.
 *
 * Key Responsibilities:
 * - Analyze request complexity based on multiple factors
 * - Select optimal AI model for each request
 * - Handle automatic fallback on model failures
 * - Monitor and record performance metrics
 * - Provide adaptive selection based on historical performance
 *
 * Performance Monitoring:
 * - Tracks response times for each model
 * - Records success/failure rates
 * - Maintains rolling history of recent performance
 * - Uses performance data for future model selection
 *
 * @class AIModelRouter
 */
export class AIModelRouter {
  private performanceHistory: Map<string, ModelPerformanceMetrics[]> = new Map();
  private config: ModelRouterConfig;
  private context: string;

  /**
   * Initialize the AI Model Router
   *
   * @param {string} context - Context identifier for logging and debugging
   * @param {Partial<ModelRouterConfig>} [config] - Optional configuration overrides
   * @constructor
   */
  constructor(context: string = "AIModelRouter", config?: Partial<ModelRouterConfig>) {
    this.context = context;
    this.config = {
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 10000, // 10 seconds
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Analyze request complexity based on various factors
   *
   * This method evaluates multiple aspects of a request to determine
   * its complexity level, which is then used for optimal model selection.
   *
   * Complexity Factors:
   * - Images: +25 points (requires vision-capable models)
   * - Multiple files: +20 points (increases processing complexity)
   * - Long chat history: +15 points (requires more context processing)
   * - Analysis requirements: +25 points (needs advanced reasoning)
   * - Personalization: +15 points (requires additional processing)
   *
   * Complexity Levels:
   * - Simple (0-24): Basic text processing
   * - Moderate (25-49): Some complexity factors present
   * - Complex (50-74): Multiple complexity factors
   * - Advanced (75-100): Highly complex, needs most capable models
   *
   * @param {object} request - Request to analyze
   * @param {any[]} [request.messages] - Chat messages
   * @param {any[]} [request.images] - Images for analysis
   * @param {any[]} [request.files] - Additional files
   * @param {boolean} [request.requiresAnalysis] - Whether deep analysis is needed
   * @param {boolean} [request.requiresPersonalization] - Whether personalization is needed
   * @returns {RequestComplexity} Complexity analysis result
   *
   * @example
   * ```typescript
   * const complexity = router.analyzeComplexity({
   *   messages: chatHistory,
   *   images: [tongueImage, faceImage],
   *   requiresAnalysis: true
   * });
   * // Result: { type: 'complex', score: 65, factors: {...} }
   * ```
   */
  analyzeComplexity(request: {
    messages?: any[];
    images?: any[];
    files?: any[];
    requiresAnalysis?: boolean;
    requiresPersonalization?: boolean;
  }): RequestComplexity {
    const factors = {
      hasImages: Boolean(request.images && request.images.length > 0),
      hasMultipleFiles: Boolean(request.files && request.files.length > 1),
      hasLongHistory: Boolean(request.messages && request.messages.length > 10),
      requiresAnalysis: Boolean(request.requiresAnalysis),
      requiresPersonalization: Boolean(request.requiresPersonalization),
    };

    // Calculate complexity score (0-100)
    let score = 0;
    if (factors.hasImages) score += 25;
    if (factors.hasMultipleFiles) score += 20;
    if (factors.hasLongHistory) score += 15;
    if (factors.requiresAnalysis) score += 25;
    if (factors.requiresPersonalization) score += 15;

    // Determine complexity type
    let type: RequestComplexity["type"];
    if (score >= 75) type = "advanced";
    else if (score >= 50) type = "complex";
    else if (score >= 25) type = "moderate";
    else type = "simple";

    return { type, factors, score };
  }

  /**
   * Select the optimal model based on criteria and performance history
   */
  selectModel(criteria: ModelSelectionCriteria): {
    primaryModel: string;
    fallbackModels: string[];
    reasoning: string;
  } {
    const { complexity, doctorLevel, preferredModel, requiresVision } = criteria;

    // If a preferred model is specified and it's suitable, use it
    if (preferredModel && this.isModelSuitable(preferredModel, criteria)) {
      return {
        primaryModel: preferredModel,
        fallbackModels: this.getFallbackModels(preferredModel, complexity),
        reasoning: `Using preferred model: ${preferredModel}`,
      };
    }

    // Use doctor level model if specified
    if (doctorLevel && DOCTOR_LEVELS[doctorLevel]) {
      const doctorModel = DOCTOR_LEVELS[doctorLevel].model;
      return {
        primaryModel: doctorModel,
        fallbackModels: this.getFallbackModels(doctorModel, complexity),
        reasoning: `Using ${doctorLevel} level model: ${doctorModel}`,
      };
    }

    // Select based on complexity and performance history
    let selectedModel: string;
    let reasoning: string;

    if (complexity.type === "advanced" || requiresVision) {
      selectedModel = this.getBestPerformingModel(ADVANCED_FALLBACK_MODELS, "advanced");
      reasoning = `Selected advanced model for ${complexity.type} request`;
    } else if (complexity.type === "complex") {
      selectedModel = this.getBestPerformingModel(
        ["gemini-2.5-pro", "gemini-2.5-flash"],
        "complex"
      );
      reasoning = `Selected capable model for complex request`;
    } else {
      selectedModel = this.getBestPerformingModel(DEFAULT_FALLBACK_MODELS, "simple");
      reasoning = `Selected efficient model for ${complexity.type} request`;
    }

    return {
      primaryModel: selectedModel,
      fallbackModels: this.getFallbackModels(selectedModel, complexity),
      reasoning,
    };
  }

  /**
   * Execute a streaming request with intelligent model routing
   */
  async streamWithRouting(
    criteria: ModelSelectionCriteria,
    callOptions: StreamCallOptions,
    apiKey?: string
  ): Promise<Response> {
    const startTime = Date.now();
    const { primaryModel, fallbackModels, reasoning } = this.selectModel(criteria);

    devLog("info", this.context, `Model selection: ${reasoning}`);

    const fallbackOptions: FallbackOptions = {
      primaryModel,
      fallbackModels,
      apiKey,
      context: this.context,
      useAsyncApiKey: !apiKey,
    };

    try {
      const response = await streamTextWithFallback(fallbackOptions, {
        ...callOptions,
        onFinish: (completion) => {
          // Record performance metrics
          if (this.config.enablePerformanceMonitoring) {
            this.recordPerformance({
              modelId: primaryModel,
              requestType: criteria.complexity.type,
              responseTime: Date.now() - startTime,
              success: true,
              timestamp: new Date(),
            });
          }
          callOptions.onFinish?.(completion);
        },
        onError: (error) => {
          // Record error metrics
          if (this.config.enablePerformanceMonitoring) {
            this.recordPerformance({
              modelId: primaryModel,
              requestType: criteria.complexity.type,
              responseTime: Date.now() - startTime,
              success: false,
              errorType: error.message,
              timestamp: new Date(),
            });
          }
          callOptions.onError?.(error);
        },
      });

      return response;
    } catch (error) {
      logError(this.context, "Stream routing failed", { error, criteria });
      throw error;
    }
  }

  /**
   * Execute a generate request with intelligent model routing
   */
  async generateWithRouting<T = string>(
    criteria: ModelSelectionCriteria,
    callOptions: GenerateCallOptions,
    validator?: (text: string) => { valid: boolean; parsed?: T },
    apiKey?: string
  ): Promise<{
    text: string;
    parsed?: T;
    modelUsed: number;
    modelId: string;
    status: string;
    performanceMetrics: ModelPerformanceMetrics;
  }> {
    const startTime = Date.now();
    const { primaryModel, fallbackModels, reasoning } = this.selectModel(criteria);

    devLog("info", this.context, `Model selection: ${reasoning}`);

    const fallbackOptions: FallbackOptions = {
      primaryModel,
      fallbackModels,
      apiKey,
      context: this.context,
      useAsyncApiKey: !apiKey,
    };

    try {
      const result = await generateTextWithFallback(fallbackOptions, callOptions, validator);
      const responseTime = Date.now() - startTime;

      // Record performance metrics
      const metrics: ModelPerformanceMetrics = {
        modelId: result.modelId,
        requestType: criteria.complexity.type,
        responseTime,
        success: true,
        timestamp: new Date(),
      };

      if (this.config.enablePerformanceMonitoring) {
        this.recordPerformance(metrics);
      }

      return {
        ...result,
        performanceMetrics: metrics,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metrics
      const metrics: ModelPerformanceMetrics = {
        modelId: primaryModel,
        requestType: criteria.complexity.type,
        responseTime,
        success: false,
        errorType: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      if (this.config.enablePerformanceMonitoring) {
        this.recordPerformance(metrics);
      }

      logError(this.context, "Generate routing failed", { error, criteria });
      throw error;
    }
  }

  /**
   * Get performance statistics for a model
   */
  getModelPerformance(modelId: string): {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    recentPerformance: ModelPerformanceMetrics[];
  } {
    const history = this.performanceHistory.get(modelId) || [];
    const recent = history.slice(-50); // Last 50 requests

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
      totalRequests: history.length,
      recentPerformance: recent,
    };
  }

  /**
   * Get overall router performance statistics
   */
  getRouterStats(): {
    totalRequests: number;
    modelPerformance: Record<
      string,
      {
        averageResponseTime: number;
        successRate: number;
        totalRequests: number;
        recentPerformance: any[];
      }
    >;
    complexityDistribution: Record<string, number>;
  } {
    const allModels = Array.from(this.performanceHistory.keys());
    const modelPerformance: Record<
      string,
      {
        averageResponseTime: number;
        successRate: number;
        totalRequests: number;
        recentPerformance: any[];
      }
    > = {};
    const complexityDistribution: Record<string, number> = {};

    let totalRequests = 0;

    for (const modelId of allModels) {
      const perf = this.getModelPerformance(modelId);
      modelPerformance[modelId] = perf;
      totalRequests += perf.totalRequests;

      // Count complexity distribution
      const history = this.performanceHistory.get(modelId) || [];
      for (const metric of history) {
        complexityDistribution[metric.requestType] =
          (complexityDistribution[metric.requestType] || 0) + 1;
      }
    }

    return {
      totalRequests,
      modelPerformance,
      complexityDistribution,
    };
  }

  /**
   * Clear performance history (useful for testing or reset)
   */
  clearPerformanceHistory(): void {
    this.performanceHistory.clear();
    devLog("info", this.context, "Performance history cleared");
  }

  // Private helper methods

  private isModelSuitable(model: string, criteria: ModelSelectionCriteria): boolean {
    // Check if model exists in our known models
    const allModels = [...DEFAULT_FALLBACK_MODELS, ...ADVANCED_FALLBACK_MODELS];
    if (!allModels.includes(model)) {
      return false;
    }

    // Advanced requests need advanced models
    if (criteria.complexity.type === "advanced" && !ADVANCED_FALLBACK_MODELS.includes(model)) {
      return false;
    }

    return true;
  }

  private getFallbackModels(primaryModel: string, complexity: RequestComplexity): string[] {
    if (complexity.type === "advanced" || complexity.factors.hasImages) {
      return ADVANCED_FALLBACK_MODELS.filter((m) => m !== primaryModel);
    }
    return DEFAULT_FALLBACK_MODELS.filter((m) => m !== primaryModel);
  }

  private getBestPerformingModel(candidates: string[], requestType: string): string {
    if (!this.config.enableAdaptiveSelection) {
      return candidates[0];
    }

    let bestModel = candidates[0];
    let bestScore = 0;

    for (const model of candidates) {
      const perf = this.getModelPerformance(model);

      // Score based on success rate and response time
      const score = perf.successRate * 100 - perf.averageResponseTime / 1000;

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    return bestModel;
  }

  private recordPerformance(metrics: ModelPerformanceMetrics): void {
    const history = this.performanceHistory.get(metrics.modelId) || [];
    history.push(metrics);

    // Keep only last 100 entries per model to prevent memory bloat
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.performanceHistory.set(metrics.modelId, history);

    devLog("debug", this.context, `Recorded performance for ${metrics.modelId}`, {
      responseTime: metrics.responseTime,
      success: metrics.success,
      requestType: metrics.requestType,
    });
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultModelRouter = new AIModelRouter("DefaultRouter");

/**
 * Convenience function to create a model router with custom config
 */
export function createModelRouter(
  context: string,
  config?: Partial<ModelRouterConfig>
): AIModelRouter {
  return new AIModelRouter(context, config);
}

/**
 * Helper function to quickly analyze and route a request
 */
export async function routeAIRequest(
  request: {
    messages?: any[];
    images?: any[];
    files?: any[];
    requiresAnalysis?: boolean;
    requiresPersonalization?: boolean;
    doctorLevel?: DoctorLevel;
    preferredModel?: string;
  },
  callOptions: StreamCallOptions | GenerateCallOptions,
  options: {
    streaming?: boolean;
    validator?: (text: string) => { valid: boolean; parsed?: any };
    apiKey?: string;
    context?: string;
  } = {}
) {
  const router = options.context ? createModelRouter(options.context) : defaultModelRouter;
  const complexity = router.analyzeComplexity(request);

  const criteria: ModelSelectionCriteria = {
    complexity,
    doctorLevel: request.doctorLevel,
    preferredModel: request.preferredModel,
    requiresVision: Boolean(request.images && request.images.length > 0),
    requiresStreaming: options.streaming,
  };

  if (options.streaming) {
    return router.streamWithRouting(criteria, callOptions as StreamCallOptions, options.apiKey);
  } else {
    return router.generateWithRouting(
      criteria,
      callOptions as GenerateCallOptions,
      options.validator,
      options.apiKey
    );
  }
}
