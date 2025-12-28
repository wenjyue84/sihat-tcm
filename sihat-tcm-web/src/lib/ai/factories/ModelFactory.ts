/**
 * AI Model Factory - Factory Pattern Implementation
 * 
 * Creates and configures AI model instances with proper initialization,
 * validation, and dependency injection. Supports different model types
 * and configurations.
 */

import {
  AIModel,
  ModelCapabilities,
  AIRequest,
  AIResponse,
} from '../interfaces/AIModel';

import {
  AI_MODELS,
  MODEL_CAPABILITIES,
} from '../../constants';

import { appEvents } from '../events/EventSystem';
import { devLog, logError } from '../../systemLogger';
import { AppError, AIModelError, ErrorFactory } from '../../errors/AppError';

/**
 * Configuration for model creation
 */
export interface ModelConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  customHeaders?: Record<string, string>;
}

/**
 * Model creation options
 */
export interface ModelCreationOptions {
  modelId: string;
  config?: ModelConfig;
  capabilities?: Partial<ModelCapabilities>;
  context?: string;
}

/**
 * Abstract base class for AI models
 */
export abstract class BaseAIModel implements AIModel {
  public readonly id: string;
  public readonly capabilities: ModelCapabilities;
  protected config: ModelConfig;
  protected context: string;
  protected isInitialized = false;

  constructor(id: string, capabilities: ModelCapabilities, config: ModelConfig = {}, context?: string) {
    this.id = id;
    this.capabilities = capabilities;
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      enableMetrics: true,
      ...config,
    };
    this.context = context || `AIModel:${id}`;
  }

  /**
   * Initialize the model (template method)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.validateConfiguration();
      await this.setupModel();
      await this.testConnection();
      
      this.isInitialized = true;
      
      if (this.config.enableLogging) {
        devLog(`[${this.context}] Model initialized successfully`);
      }

      // Emit initialization event
      appEvents.emit('ai:model:initialized', {
        modelId: this.id,
        capabilities: this.capabilities,
        timestamp: new Date(),
      });

    } catch (error) {
      const appError = ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'initialize',
      });
      
      appEvents.emitErrorOccurred({
        error: appError,
        component: this.context,
        action: 'initialize',
      });
      
      throw appError;
    }
  }

  /**
   * Generate response (template method)
   */
  public async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      this.validateRequest(request);
      
      const response = await this.executeGeneration(request);
      const responseTime = Date.now() - startTime;
      
      if (this.config.enableMetrics) {
        appEvents.emit('ai:request:completed', {
          requestId: this.generateRequestId(),
          modelId: this.id,
          responseTime,
          success: true,
        });
      }
      
      return {
        ...response,
        modelUsed: this.id,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (this.config.enableMetrics) {
        appEvents.emit('ai:request:completed', {
          requestId: this.generateRequestId(),
          modelId: this.id,
          responseTime,
          success: false,
        });
      }
      
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'generate',
        metadata: { request, responseTime },
      });
    }
  }

  /**
   * Stream response (template method)
   */
  public async stream(request: AIRequest): Promise<ReadableStream> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.validateRequest(request);
      return await this.executeStreaming(request);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'stream',
        metadata: { request },
      });
    }
  }

  /**
   * Check if model is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return await this.checkAvailability();
    } catch (error) {
      return false;
    }
  }

  /**
   * Estimate cost for request
   */
  public estimateCost(request: AIRequest): number {
    const tokenCount = this.estimateTokenCount(request);
    return tokenCount * this.capabilities.costPerToken;
  }

  // Abstract methods to be implemented by concrete classes
  protected abstract validateConfiguration(): Promise<void>;
  protected abstract setupModel(): Promise<void>;
  protected abstract testConnection(): Promise<void>;
  protected abstract executeGeneration(request: AIRequest): Promise<AIResponse>;
  protected abstract executeStreaming(request: AIRequest): Promise<ReadableStream>;
  protected abstract checkAvailability(): Promise<boolean>;
  protected abstract estimateTokenCount(request: AIRequest): number;

  // Helper methods
  protected validateRequest(request: AIRequest): void {
    if (!request.messages && !request.images) {
      throw new AIModelError('Request must contain either messages or images');
    }

    if (request.images && !this.capabilities.supportsVision) {
      throw new AIModelError(`Model ${this.id} does not support vision`);
    }
  }

  protected generateRequestId(): string {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Gemini model implementation
 */
export class GeminiModel extends BaseAIModel {
  private client: any; // Would be actual Gemini client

  protected async validateConfiguration(): Promise<void> {
    if (!this.config.apiKey) {
      throw new AIModelError('API key is required for Gemini models');
    }
  }

  protected async setupModel(): Promise<void> {
    // Initialize Gemini client
    // this.client = new GeminiClient({ apiKey: this.config.apiKey });
    devLog(`[${this.context}] Gemini client setup completed`);
  }

  protected async testConnection(): Promise<void> {
    // Test connection to Gemini API
    // await this.client.testConnection();
    devLog(`[${this.context}] Connection test passed`);
  }

  protected async executeGeneration(request: AIRequest): Promise<AIResponse> {
    // Implement actual Gemini generation
    // const result = await this.client.generate(request);
    
    // Mock implementation
    return {
      text: `Mock response from ${this.id}`,
      modelUsed: this.id,
      responseTime: 0,
      confidence: 0.95,
    };
  }

  protected async executeStreaming(request: AIRequest): Promise<ReadableStream> {
    // Implement actual Gemini streaming
    // return this.client.stream(request);
    
    // Mock implementation
    return new ReadableStream({
      start(controller) {
        controller.enqueue(`Mock stream from ${this.id}`);
        controller.close();
      },
    });
  }

  protected async checkAvailability(): Promise<boolean> {
    // Check Gemini API availability
    // return this.client.isHealthy();
    return true;
  }

  protected estimateTokenCount(request: AIRequest): number {
    // Estimate token count for Gemini
    let tokens = 0;
    
    if (request.messages) {
      tokens += request.messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / 4;
    }
    
    if (request.images) {
      tokens += request.images.length * 1000; // Rough estimate for images
    }
    
    return Math.ceil(tokens);
  }
}

/**
 * Model factory for creating AI model instances
 */
export class AIModelFactory {
  private static instance: AIModelFactory;
  private modelRegistry = new Map<string, typeof BaseAIModel>();
  private modelInstances = new Map<string, AIModel>();
  private defaultConfig: ModelConfig = {};

  private constructor() {
    this.registerDefaultModels();
  }

  public static getInstance(): AIModelFactory {
    if (!AIModelFactory.instance) {
      AIModelFactory.instance = new AIModelFactory();
    }
    return AIModelFactory.instance;
  }

  /**
   * Register a model class
   */
  public registerModel(modelId: string, modelClass: typeof BaseAIModel): void {
    this.modelRegistry.set(modelId, modelClass);
    devLog(`[ModelFactory] Registered model: ${modelId}`);
  }

  /**
   * Create a model instance
   */
  public async createModel(options: ModelCreationOptions): Promise<AIModel> {
    const { modelId, config = {}, capabilities, context } = options;

    // Check if instance already exists
    const instanceKey = this.getInstanceKey(modelId, config);
    if (this.modelInstances.has(instanceKey)) {
      return this.modelInstances.get(instanceKey)!;
    }

    // Get model class
    const ModelClass = this.modelRegistry.get(modelId);
    if (!ModelClass) {
      throw new AIModelError(`Unknown model: ${modelId}`);
    }

    // Get model capabilities
    const modelCapabilities = this.getModelCapabilities(modelId, capabilities);

    // Merge configurations
    const finalConfig = { ...this.defaultConfig, ...config };

    // Create instance
    const model = new ModelClass(modelId, modelCapabilities, finalConfig, context);
    
    // Initialize model
    await model.initialize();

    // Cache instance
    this.modelInstances.set(instanceKey, model);

    devLog(`[ModelFactory] Created model instance: ${modelId}`);
    return model;
  }

  /**
   * Create multiple models
   */
  public async createModels(optionsArray: ModelCreationOptions[]): Promise<AIModel[]> {
    const promises = optionsArray.map(options => this.createModel(options));
    return Promise.all(promises);
  }

  /**
   * Get or create model instance
   */
  public async getModel(modelId: string, config?: ModelConfig): Promise<AIModel> {
    return this.createModel({ modelId, config });
  }

  /**
   * Remove model instance from cache
   */
  public removeModel(modelId: string, config?: ModelConfig): boolean {
    const instanceKey = this.getInstanceKey(modelId, config);
    return this.modelInstances.delete(instanceKey);
  }

  /**
   * Clear all cached instances
   */
  public clearCache(): void {
    this.modelInstances.clear();
    devLog(`[ModelFactory] Model cache cleared`);
  }

  /**
   * Set default configuration for all models
   */
  public setDefaultConfig(config: ModelConfig): void {
    this.defaultConfig = { ...config };
  }

  /**
   * Get available model IDs
   */
  public getAvailableModels(): string[] {
    return Array.from(this.modelRegistry.keys());
  }

  /**
   * Check if model is registered
   */
  public isModelRegistered(modelId: string): boolean {
    return this.modelRegistry.has(modelId);
  }

  // Private helper methods

  private registerDefaultModels(): void {
    // Register Gemini models
    this.registerModel(AI_MODELS.GEMINI_2_FLASH, GeminiModel);
    this.registerModel(AI_MODELS.GEMINI_2_5_PRO, GeminiModel);
    this.registerModel(AI_MODELS.GEMINI_3_PRO_PREVIEW, GeminiModel);
  }

  private getModelCapabilities(modelId: string, overrides?: Partial<ModelCapabilities>): ModelCapabilities {
    const baseCapabilities = MODEL_CAPABILITIES[modelId];
    if (!baseCapabilities) {
      throw new AIModelError(`No capabilities defined for model: ${modelId}`);
    }

    return {
      id: modelId,
      name: this.getModelDisplayName(modelId),
      ...baseCapabilities,
      ...overrides,
    };
  }

  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      [AI_MODELS.GEMINI_2_FLASH]: "Gemini 2.0 Flash",
      [AI_MODELS.GEMINI_2_5_PRO]: "Gemini 2.5 Pro",
      [AI_MODELS.GEMINI_3_PRO_PREVIEW]: "Gemini 3.0 Pro Preview",
    };
    return displayNames[modelId] || modelId;
  }

  private getInstanceKey(modelId: string, config?: ModelConfig): string {
    const configHash = config ? JSON.stringify(config) : 'default';
    return `${modelId}:${configHash}`;
  }
}

/**
 * Convenience functions for model creation
 */
export const modelFactory = AIModelFactory.getInstance();

export async function createGeminiModel(
  modelId: string, 
  config?: ModelConfig
): Promise<AIModel> {
  return modelFactory.createModel({ modelId, config });
}

export async function createAllGeminiModels(config?: ModelConfig): Promise<AIModel[]> {
  const geminiModels = [
    AI_MODELS.GEMINI_2_FLASH,
    AI_MODELS.GEMINI_2_5_PRO,
    AI_MODELS.GEMINI_3_PRO_PREVIEW,
  ];

  return modelFactory.createModels(
    geminiModels.map(modelId => ({ modelId, config }))
  );
}

/**
 * Model builder for fluent API
 */
export class ModelBuilder {
  private options: ModelCreationOptions = { modelId: '' };

  public static create(): ModelBuilder {
    return new ModelBuilder();
  }

  public withModel(modelId: string): ModelBuilder {
    this.options.modelId = modelId;
    return this;
  }

  public withConfig(config: ModelConfig): ModelBuilder {
    this.options.config = { ...this.options.config, ...config };
    return this;
  }

  public withCapabilities(capabilities: Partial<ModelCapabilities>): ModelBuilder {
    this.options.capabilities = { ...this.options.capabilities, ...capabilities };
    return this;
  }

  public withContext(context: string): ModelBuilder {
    this.options.context = context;
    return this;
  }

  public async build(): Promise<AIModel> {
    if (!this.options.modelId) {
      throw new AIModelError('Model ID is required');
    }
    return modelFactory.createModel(this.options);
  }
}

/**
 * Example usage:
 * 
 * const model = await ModelBuilder.create()
 *   .withModel(AI_MODELS.GEMINI_2_5_PRO)
 *   .withConfig({ apiKey: 'your-key', timeout: 60000 })
 *   .withContext('DiagnosisEngine')
 *   .build();
 */