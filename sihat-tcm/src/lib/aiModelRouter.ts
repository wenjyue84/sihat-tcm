/**
 * AI Model Router - Dynamic model selection and routing with performance monitoring
 * 
 * This module provides intelligent model selection based on request complexity,
 * automatic fallback handling, and performance monitoring for optimal AI responses.
 */

import { 
    streamTextWithFallback, 
    generateTextWithFallback, 
    DEFAULT_FALLBACK_MODELS, 
    ADVANCED_FALLBACK_MODELS,
    FallbackOptions,
    StreamCallOptions,
    GenerateCallOptions
} from './modelFallback';
import { DOCTOR_LEVELS, DoctorLevel } from './doctorLevels';
import { devLog, logError, logInfo } from './systemLogger';

export interface ModelPerformanceMetrics {
    modelId: string;
    requestType: string;
    responseTime: number;
    success: boolean;
    errorType?: string;
    confidenceScore?: number;
    timestamp: Date;
}

export interface RequestComplexity {
    type: 'simple' | 'moderate' | 'complex' | 'advanced';
    factors: {
        hasImages: boolean;
        hasMultipleFiles: boolean;
        hasLongHistory: boolean;
        requiresAnalysis: boolean;
        requiresPersonalization: boolean;
    };
    score: number;
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
 */
export class AIModelRouter {
    private performanceHistory: Map<string, ModelPerformanceMetrics[]> = new Map();
    private config: ModelRouterConfig;
    private context: string;

    constructor(context: string = 'AIModelRouter', config?: Partial<ModelRouterConfig>) {
        this.context = context;
        this.config = {
            enablePerformanceMonitoring: true,
            enableAdaptiveSelection: true,
            fallbackThreshold: 10000, // 10 seconds
            maxRetries: 3,
            ...config
        };
    }

    /**
     * Analyze request complexity based on various factors
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
            requiresPersonalization: Boolean(request.requiresPersonalization)
        };

        // Calculate complexity score (0-100)
        let score = 0;
        if (factors.hasImages) score += 25;
        if (factors.hasMultipleFiles) score += 20;
        if (factors.hasLongHistory) score += 15;
        if (factors.requiresAnalysis) score += 25;
        if (factors.requiresPersonalization) score += 15;

        // Determine complexity type
        let type: RequestComplexity['type'];
        if (score >= 75) type = 'advanced';
        else if (score >= 50) type = 'complex';
        else if (score >= 25) type = 'moderate';
        else type = 'simple';

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
                reasoning: `Using preferred model: ${preferredModel}`
            };
        }

        // Use doctor level model if specified
        if (doctorLevel && DOCTOR_LEVELS[doctorLevel]) {
            const doctorModel = DOCTOR_LEVELS[doctorLevel].model;
            return {
                primaryModel: doctorModel,
                fallbackModels: this.getFallbackModels(doctorModel, complexity),
                reasoning: `Using ${doctorLevel} level model: ${doctorModel}`
            };
        }

        // Select based on complexity and performance history
        let selectedModel: string;
        let reasoning: string;

        if (complexity.type === 'advanced' || requiresVision) {
            selectedModel = this.getBestPerformingModel(ADVANCED_FALLBACK_MODELS, 'advanced');
            reasoning = `Selected advanced model for ${complexity.type} request`;
        } else if (complexity.type === 'complex') {
            selectedModel = this.getBestPerformingModel(['gemini-2.5-pro', 'gemini-2.5-flash'], 'complex');
            reasoning = `Selected capable model for complex request`;
        } else {
            selectedModel = this.getBestPerformingModel(DEFAULT_FALLBACK_MODELS, 'simple');
            reasoning = `Selected efficient model for ${complexity.type} request`;
        }

        return {
            primaryModel: selectedModel,
            fallbackModels: this.getFallbackModels(selectedModel, complexity),
            reasoning
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

        devLog('info', this.context, `Model selection: ${reasoning}`);

        const fallbackOptions: FallbackOptions = {
            primaryModel,
            fallbackModels,
            apiKey,
            context: this.context,
            useAsyncApiKey: !apiKey
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
                            timestamp: new Date()
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
                            timestamp: new Date()
                        });
                    }
                    callOptions.onError?.(error);
                }
            });

            return response;
        } catch (error) {
            logError(this.context, 'Stream routing failed', { error, criteria });
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

        devLog('info', this.context, `Model selection: ${reasoning}`);

        const fallbackOptions: FallbackOptions = {
            primaryModel,
            fallbackModels,
            apiKey,
            context: this.context,
            useAsyncApiKey: !apiKey
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
                timestamp: new Date()
            };

            if (this.config.enablePerformanceMonitoring) {
                this.recordPerformance(metrics);
            }

            return {
                ...result,
                performanceMetrics: metrics
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Record error metrics
            const metrics: ModelPerformanceMetrics = {
                modelId: primaryModel,
                requestType: criteria.complexity.type,
                responseTime,
                success: false,
                errorType: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };

            if (this.config.enablePerformanceMonitoring) {
                this.recordPerformance(metrics);
            }

            logError(this.context, 'Generate routing failed', { error, criteria });
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
                recentPerformance: []
            };
        }

        const successful = recent.filter(m => m.success);
        const averageResponseTime = successful.length > 0 
            ? successful.reduce((sum, m) => sum + m.responseTime, 0) / successful.length
            : 0;

        return {
            averageResponseTime,
            successRate: successful.length / recent.length,
            totalRequests: history.length,
            recentPerformance: recent
        };
    }

    /**
     * Get overall router performance statistics
     */
    getRouterStats(): {
        totalRequests: number;
        modelPerformance: Record<string, { averageResponseTime: number; successRate: number; totalRequests: number; recentPerformance: any[] }>;
        complexityDistribution: Record<string, number>;
    } {
        const allModels = Array.from(this.performanceHistory.keys());
        const modelPerformance: Record<string, { averageResponseTime: number; successRate: number; totalRequests: number; recentPerformance: any[] }> = {};
        const complexityDistribution: Record<string, number> = {};

        let totalRequests = 0;

        for (const modelId of allModels) {
            const perf = this.getModelPerformance(modelId);
            modelPerformance[modelId] = perf;
            totalRequests += perf.totalRequests;

            // Count complexity distribution
            const history = this.performanceHistory.get(modelId) || [];
            for (const metric of history) {
                complexityDistribution[metric.requestType] = (complexityDistribution[metric.requestType] || 0) + 1;
            }
        }

        return {
            totalRequests,
            modelPerformance,
            complexityDistribution
        };
    }

    /**
     * Clear performance history (useful for testing or reset)
     */
    clearPerformanceHistory(): void {
        this.performanceHistory.clear();
        devLog('info', this.context, 'Performance history cleared');
    }

    // Private helper methods

    private isModelSuitable(model: string, criteria: ModelSelectionCriteria): boolean {
        // Check if model exists in our known models
        const allModels = [...DEFAULT_FALLBACK_MODELS, ...ADVANCED_FALLBACK_MODELS];
        if (!allModels.includes(model)) {
            return false;
        }

        // Advanced requests need advanced models
        if (criteria.complexity.type === 'advanced' && !ADVANCED_FALLBACK_MODELS.includes(model)) {
            return false;
        }

        return true;
    }

    private getFallbackModels(primaryModel: string, complexity: RequestComplexity): string[] {
        if (complexity.type === 'advanced' || complexity.factors.hasImages) {
            return ADVANCED_FALLBACK_MODELS.filter(m => m !== primaryModel);
        }
        return DEFAULT_FALLBACK_MODELS.filter(m => m !== primaryModel);
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
            const score = perf.successRate * 100 - (perf.averageResponseTime / 1000);
            
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

        devLog('debug', this.context, `Recorded performance for ${metrics.modelId}`, {
            responseTime: metrics.responseTime,
            success: metrics.success,
            requestType: metrics.requestType
        });
    }
}

/**
 * Create a singleton instance for the application
 */
export const defaultModelRouter = new AIModelRouter('DefaultRouter');

/**
 * Convenience function to create a model router with custom config
 */
export function createModelRouter(context: string, config?: Partial<ModelRouterConfig>): AIModelRouter {
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
        requiresStreaming: options.streaming
    };

    if (options.streaming) {
        return router.streamWithRouting(criteria, callOptions as StreamCallOptions, options.apiKey);
    } else {
        return router.generateWithRouting(criteria, callOptions as GenerateCallOptions, options.validator, options.apiKey);
    }
}