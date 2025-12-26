/**
 * Unit tests for AIModelRouter
 * 
 * Tests the dynamic model selection, fallback logic, and performance monitoring
 * functionality of the AIModelRouter class.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
    AIModelRouter, 
    createModelRouter, 
    defaultModelRouter,
    ModelSelectionCriteria,
    RequestComplexity,
    ModelPerformanceMetrics
} from './aiModelRouter';
import { DoctorLevel } from './doctorLevels';

// Mock the dependencies
vi.mock('./modelFallback', () => ({
    streamTextWithFallback: vi.fn(),
    generateTextWithFallback: vi.fn(),
    DEFAULT_FALLBACK_MODELS: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    ADVANCED_FALLBACK_MODELS: ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.0-flash']
}));

vi.mock('./doctorLevels', () => ({
    DOCTOR_LEVELS: {
        master: { model: 'gemini-2.5-pro' },
        expert: { model: 'gemini-2.5-flash' },
        physician: { model: 'gemini-2.0-flash' }
    }
}));

vi.mock('./systemLogger', () => ({
    devLog: vi.fn(),
    logError: vi.fn(),
    logInfo: vi.fn()
}));

describe('AIModelRouter', () => {
    let router: AIModelRouter;

    beforeEach(() => {
        router = new AIModelRouter('TestRouter');
        vi.clearAllMocks();
    });

    afterEach(() => {
        router.clearPerformanceHistory();
    });

    describe('Constructor and Configuration', () => {
        it('should create router with default configuration', () => {
            const defaultRouter = new AIModelRouter();
            expect(defaultRouter).toBeInstanceOf(AIModelRouter);
        });

        it('should create router with custom configuration', () => {
            const customRouter = new AIModelRouter('CustomRouter', {
                enablePerformanceMonitoring: false,
                fallbackThreshold: 5000
            });
            expect(customRouter).toBeInstanceOf(AIModelRouter);
        });

        it('should provide createModelRouter factory function', () => {
            const factoryRouter = createModelRouter('FactoryRouter');
            expect(factoryRouter).toBeInstanceOf(AIModelRouter);
        });

        it('should provide default singleton instance', () => {
            expect(defaultModelRouter).toBeInstanceOf(AIModelRouter);
        });
    });

    describe('Complexity Analysis', () => {
        it('should analyze simple request complexity correctly', () => {
            const request = {
                messages: [{ role: 'user', content: 'Hello' }]
            };

            const complexity = router.analyzeComplexity(request);

            expect(complexity.type).toBe('simple');
            expect(complexity.score).toBeLessThan(25);
            expect(complexity.factors.hasImages).toBe(false);
            expect(complexity.factors.hasMultipleFiles).toBe(false);
            expect(complexity.factors.hasLongHistory).toBe(false);
            expect(complexity.factors.requiresAnalysis).toBe(false);
            expect(complexity.factors.requiresPersonalization).toBe(false);
        });

        it('should analyze moderate request complexity correctly', () => {
            const request = {
                messages: Array(12).fill({ role: 'user', content: 'test' }), // Long history
                requiresAnalysis: true
            };

            const complexity = router.analyzeComplexity(request);

            expect(complexity.type).toBe('moderate');
            expect(complexity.score).toBeGreaterThanOrEqual(25);
            expect(complexity.score).toBeLessThan(50);
            expect(complexity.factors.hasLongHistory).toBe(true);
            expect(complexity.factors.requiresAnalysis).toBe(true);
        });

        it('should analyze complex request complexity correctly', () => {
            const request = {
                images: ['image1.jpg', 'image2.jpg'],
                files: ['file1.pdf', 'file2.pdf'],
                requiresAnalysis: true
            };

            const complexity = router.analyzeComplexity(request);

            expect(complexity.type).toBe('complex');
            expect(complexity.score).toBeGreaterThanOrEqual(50);
            expect(complexity.score).toBeLessThan(75);
            expect(complexity.factors.hasImages).toBe(true);
            expect(complexity.factors.hasMultipleFiles).toBe(true);
            expect(complexity.factors.requiresAnalysis).toBe(true);
        });

        it('should analyze advanced request complexity correctly', () => {
            const request = {
                images: ['image1.jpg'],
                files: ['file1.pdf', 'file2.pdf'],
                messages: Array(15).fill({ role: 'user', content: 'test' }),
                requiresAnalysis: true,
                requiresPersonalization: true
            };

            const complexity = router.analyzeComplexity(request);

            expect(complexity.type).toBe('advanced');
            expect(complexity.score).toBeGreaterThanOrEqual(75);
            expect(complexity.factors.hasImages).toBe(true);
            expect(complexity.factors.hasMultipleFiles).toBe(true);
            expect(complexity.factors.hasLongHistory).toBe(true);
            expect(complexity.factors.requiresAnalysis).toBe(true);
            expect(complexity.factors.requiresPersonalization).toBe(true);
        });
    });

    describe('Model Selection', () => {
        it('should select model based on doctor level', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 },
                doctorLevel: 'master' as DoctorLevel
            };

            const selection = router.selectModel(criteria);

            expect(selection.primaryModel).toBe('gemini-2.5-pro');
            expect(selection.reasoning).toContain('master level model');
        });

        it('should select preferred model when specified and suitable', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 },
                preferredModel: 'gemini-2.5-flash'
            };

            const selection = router.selectModel(criteria);

            expect(selection.primaryModel).toBe('gemini-2.5-flash');
            expect(selection.reasoning).toContain('preferred model');
        });

        it('should select advanced model for complex requests with vision', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'advanced', factors: { hasImages: true, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: true, requiresPersonalization: false }, score: 80 },
                requiresVision: true
            };

            const selection = router.selectModel(criteria);

            expect(['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.0-flash']).toContain(selection.primaryModel);
            expect(selection.reasoning).toContain('advanced model');
        });

        it('should provide appropriate fallback models', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 }
            };

            const selection = router.selectModel(criteria);

            expect(selection.fallbackModels).toBeInstanceOf(Array);
            expect(selection.fallbackModels.length).toBeGreaterThan(0);
            expect(selection.fallbackModels).not.toContain(selection.primaryModel);
        });
    });

    describe('Performance Monitoring', () => {
        it('should record performance metrics', () => {
            const metrics: ModelPerformanceMetrics = {
                modelId: 'gemini-2.5-flash',
                requestType: 'simple',
                responseTime: 1500,
                success: true,
                timestamp: new Date()
            };

            // Access private method for testing
            (router as any).recordPerformance(metrics);

            const performance = router.getModelPerformance('gemini-2.5-flash');
            expect(performance.totalRequests).toBe(1);
            expect(performance.averageResponseTime).toBe(1500);
            expect(performance.successRate).toBe(1);
        });

        it('should calculate performance statistics correctly', () => {
            const metrics = [
                { modelId: 'gemini-2.5-flash', requestType: 'simple', responseTime: 1000, success: true, timestamp: new Date() },
                { modelId: 'gemini-2.5-flash', requestType: 'simple', responseTime: 2000, success: true, timestamp: new Date() },
                { modelId: 'gemini-2.5-flash', requestType: 'simple', responseTime: 1500, success: false, timestamp: new Date() }
            ];

            metrics.forEach(metric => (router as any).recordPerformance(metric));

            const performance = router.getModelPerformance('gemini-2.5-flash');
            expect(performance.totalRequests).toBe(3);
            expect(performance.averageResponseTime).toBe(1500); // Average of successful requests only
            expect(performance.successRate).toBe(2/3);
        });

        it('should return empty performance for unknown model', () => {
            const performance = router.getModelPerformance('unknown-model');
            expect(performance.totalRequests).toBe(0);
            expect(performance.averageResponseTime).toBe(0);
            expect(performance.successRate).toBe(0);
            expect(performance.recentPerformance).toEqual([]);
        });

        it('should provide router statistics', () => {
            const metrics = [
                { modelId: 'gemini-2.5-flash', requestType: 'simple', responseTime: 1000, success: true, timestamp: new Date() },
                { modelId: 'gemini-2.5-pro', requestType: 'complex', responseTime: 2000, success: true, timestamp: new Date() }
            ];

            metrics.forEach(metric => (router as any).recordPerformance(metric));

            const stats = router.getRouterStats();
            expect(stats.totalRequests).toBe(2);
            expect(Object.keys(stats.modelPerformance)).toContain('gemini-2.5-flash');
            expect(Object.keys(stats.modelPerformance)).toContain('gemini-2.5-pro');
            expect(stats.complexityDistribution.simple).toBe(1);
            expect(stats.complexityDistribution.complex).toBe(1);
        });

        it('should clear performance history', () => {
            const metrics: ModelPerformanceMetrics = {
                modelId: 'gemini-2.5-flash',
                requestType: 'simple',
                responseTime: 1500,
                success: true,
                timestamp: new Date()
            };

            (router as any).recordPerformance(metrics);
            expect(router.getModelPerformance('gemini-2.5-flash').totalRequests).toBe(1);

            router.clearPerformanceHistory();
            expect(router.getModelPerformance('gemini-2.5-flash').totalRequests).toBe(0);
        });

        it('should limit performance history to prevent memory bloat', () => {
            // Add more than 100 metrics to test the limit
            for (let i = 0; i < 150; i++) {
                const metrics: ModelPerformanceMetrics = {
                    modelId: 'gemini-2.5-flash',
                    requestType: 'simple',
                    responseTime: 1000 + i,
                    success: true,
                    timestamp: new Date()
                };
                (router as any).recordPerformance(metrics);
            }

            const performance = router.getModelPerformance('gemini-2.5-flash');
            expect(performance.totalRequests).toBe(150);
            expect(performance.recentPerformance.length).toBeLessThanOrEqual(50); // Recent performance is limited to 50
        });
    });

    describe('Model Suitability Validation', () => {
        it('should validate model suitability correctly', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'advanced', factors: { hasImages: true, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: true, requiresPersonalization: false }, score: 80 }
            };

            // Test private method through public interface
            const selection = router.selectModel({ ...criteria, preferredModel: 'gemini-1.5-flash' });
            
            // For advanced complexity, it should not use a basic model
            expect(selection.primaryModel).not.toBe('gemini-1.5-flash');
        });

        it('should reject unknown models', () => {
            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 },
                preferredModel: 'unknown-model'
            };

            const selection = router.selectModel(criteria);
            
            // Should not use unknown model, should fallback to appropriate model
            expect(selection.primaryModel).not.toBe('unknown-model');
        });
    });

    describe('Adaptive Model Selection', () => {
        it('should adapt model selection based on performance history', () => {
            // Create router with adaptive selection enabled
            const adaptiveRouter = new AIModelRouter('AdaptiveRouter', {
                enableAdaptiveSelection: true
            });

            // Record poor performance for one model
            const poorMetrics: ModelPerformanceMetrics = {
                modelId: 'gemini-2.5-flash',
                requestType: 'simple',
                responseTime: 10000, // Very slow
                success: false,
                timestamp: new Date()
            };

            // Record good performance for another model
            const goodMetrics: ModelPerformanceMetrics = {
                modelId: 'gemini-2.0-flash',
                requestType: 'simple',
                responseTime: 1000, // Fast
                success: true,
                timestamp: new Date()
            };

            (adaptiveRouter as any).recordPerformance(poorMetrics);
            (adaptiveRouter as any).recordPerformance(goodMetrics);

            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 }
            };

            const selection = adaptiveRouter.selectModel(criteria);
            
            // Should prefer the better performing model
            expect(['gemini-2.0-flash', 'gemini-1.5-flash']).toContain(selection.primaryModel);
        });

        it('should disable adaptive selection when configured', () => {
            const nonAdaptiveRouter = new AIModelRouter('NonAdaptiveRouter', {
                enableAdaptiveSelection: false
            });

            const criteria: ModelSelectionCriteria = {
                complexity: { type: 'simple', factors: { hasImages: false, hasMultipleFiles: false, hasLongHistory: false, requiresAnalysis: false, requiresPersonalization: false }, score: 10 }
            };

            const selection = nonAdaptiveRouter.selectModel(criteria);
            
            // Should use first model in the list regardless of performance
            expect(selection.primaryModel).toBe('gemini-2.5-flash');
        });
    });
});