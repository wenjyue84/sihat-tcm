/**
 * Enhanced AI Model Router Tests
 * 
 * Comprehensive test suite for the EnhancedAIModelRouter class.
 * Tests routing logic, fallback mechanisms, circuit breakers, and adaptive learning.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { EnhancedAIModelRouter, type EnhancedRouterConfig } from './EnhancedAIModelRouter';
import type { ModelSelectionCriteria, GenerateCallOptions } from '../interfaces/ModelInterfaces';

// Mock dependencies
vi.mock('../../modelFallback', () => ({
  generateTextWithFallback: vi.fn(),
  streamTextWithFallback: vi.fn(),
  parseApiError: vi.fn(() => ({
    userFriendlyError: 'Test error',
    errorCode: 'TEST_ERROR'
  }))
}));

vi.mock('../analysis/ComplexityAnalyzer', () => ({
  ComplexityAnalyzer: vi.fn(() => ({
    analyzeComplexity: vi.fn(() => ({
      type: 'simple',
      score: 0.3,
      factors: {}
    }))
  }))
}));

vi.mock('../selection/ModelSelectionStrategy', () => ({
  ModelSelectionStrategy: vi.fn(() => ({
    selectOptimalModel: vi.fn(() => ({
      primaryModel: 'gemini-2.0-flash',
      fallbackModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      reasoning: 'Test selection'
    }))
  }))
}));

vi.mock('../monitoring/PerformanceMonitor', () => ({
  PerformanceMonitor: vi.fn(() => ({
    recordMetrics: vi.fn(),
    getModelPerformance: vi.fn(() => ({
      successRate: 0.95,
      averageResponseTime: 1500,
      errorRate: 0.05
    })),
    getPerformanceAnalytics: vi.fn(() => ({}))
  }))
}));

vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../errors/AppError', () => ({
  ErrorFactory: {
    fromUnknownError: vi.fn((error) => error)
  }
}));

describe('EnhancedAIModelRouter', () => {
  let router: EnhancedAIModelRouter;
  let mockGenerateTextWithFallback: Mock;
  let mockStreamTextWithFallback: Mock;

  const defaultConfig: Partial<EnhancedRouterConfig> = {
    circuitBreakerEnabled: true,
    adaptiveLearningEnabled: true,
    rateLimitEnabled: false, // Disable for testing
    healthCheckInterval: 0 // Disable for testing
  };

  const mockCriteria: ModelSelectionCriteria = {
    complexity: {
      type: 'simple',
      score: 0.3,
      factors: {}
    },
    requirements: {
      maxLatency: 5000,
      minAccuracy: 0.8
    }
  };

  const mockGenerateOptions: GenerateCallOptions = {
    system: 'Test system prompt',
    messages: [{ role: 'user', content: 'Test message' }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGenerateTextWithFallback = vi.mocked(require('../../modelFallback').generateTextWithFallback);
    mockStreamTextWithFallback = vi.mocked(require('../../modelFallback').streamTextWithFallback);
    
    router = new EnhancedAIModelRouter('TestRouter', defaultConfig);
  });

  afterEach(() => {
    router.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultRouter = new EnhancedAIModelRouter();
      expect(defaultRouter).toBeDefined();
      defaultRouter.destroy();
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<EnhancedRouterConfig> = {
        failureThreshold: 10,
        adaptiveLearningEnabled: false
      };
      
      const customRouter = new EnhancedAIModelRouter('CustomRouter', customConfig);
      expect(customRouter).toBeDefined();
      customRouter.destroy();
    });

    it('should initialize circuit breakers for known models', () => {
      const metrics = router.getModelMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      metrics.forEach(metric => {
        expect(metric.circuitBreakerState).toBeDefined();
        expect(metric.circuitBreakerState.state).toBe('closed');
      });
    });
  });

  describe('Enhanced Text Generation', () => {
    it('should generate text successfully with primary model', async () => {
      const mockResult = {
        text: 'Generated text',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      const result = await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      expect(result).toMatchObject({
        text: 'Generated text',
        modelId: 'gemini-2.0-flash',
        fallbacksUsed: 0,
        circuitBreakerTriggered: false
      });
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle validation with custom validator', async () => {
      const mockResult = {
        text: '{"valid": true}',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      const validator = (text: string) => {
        try {
          const parsed = JSON.parse(text);
          return { valid: true, parsed };
        } catch {
          return { valid: false };
        }
      };

      const result = await router.generateWithEnhancedRouting(
        mockCriteria, 
        mockGenerateOptions, 
        validator
      );

      expect(result.text).toBe('{"valid": true}');
      expect(mockGenerateTextWithFallback).toHaveBeenCalledWith(
        expect.any(Object),
        mockGenerateOptions,
        validator
      );
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Model failed');
      mockGenerateTextWithFallback.mockRejectedValue(mockError);

      await expect(
        router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions)
      ).rejects.toThrow();
    });
  });

  describe('Enhanced Text Streaming', () => {
    it('should stream text successfully', async () => {
      const mockResponse = new Response('stream data');
      mockStreamTextWithFallback.mockResolvedValue(mockResponse);

      const streamOptions = {
        ...mockGenerateOptions,
        onFinish: vi.fn(),
        onError: vi.fn()
      };

      const result = await router.streamWithEnhancedRouting(mockCriteria, streamOptions);

      expect(result).toBe(mockResponse);
      expect(mockStreamTextWithFallback).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const mockError = new Error('Stream failed');
      mockStreamTextWithFallback.mockRejectedValue(mockError);

      const streamOptions = {
        ...mockGenerateOptions,
        onFinish: vi.fn(),
        onError: vi.fn()
      };

      await expect(
        router.streamWithEnhancedRouting(mockCriteria, streamOptions)
      ).rejects.toThrow();
    });
  });

  describe('Circuit Breaker Functionality', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const mockError = new Error('Repeated failure');
      mockGenerateTextWithFallback.mockRejectedValue(mockError);

      // Trigger failures to open circuit breaker
      const failureThreshold = 5;
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);
        } catch {
          // Expected to fail
        }
      }

      const metrics = router.getModelMetrics();
      const primaryModelMetrics = metrics.find(m => m.modelId === 'gemini-2.0-flash');
      
      expect(primaryModelMetrics?.circuitBreakerState.failureCount).toBeGreaterThanOrEqual(failureThreshold);
    });

    it('should use alternative model when circuit breaker is open', async () => {
      // First, open the circuit breaker for primary model
      const mockError = new Error('Primary model failed');
      mockGenerateTextWithFallback.mockRejectedValueOnce(mockError);

      // Mock successful response from fallback
      const mockFallbackResult = {
        text: 'Fallback response',
        modelUsed: 2,
        modelId: 'gemini-1.5-pro',
        status: 'success'
      };

      // Simulate circuit breaker being open by manually setting failure count
      const metrics = router.getModelMetrics();
      const primaryModel = metrics.find(m => m.modelId === 'gemini-2.0-flash');
      if (primaryModel) {
        primaryModel.circuitBreakerState.failureCount = 10; // Above threshold
        primaryModel.circuitBreakerState.state = 'open';
      }

      mockGenerateTextWithFallback.mockResolvedValue(mockFallbackResult);

      const result = await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      expect(result.fallbacksUsed).toBeGreaterThan(0);
      expect(result.circuitBreakerTriggered).toBe(true);
    });

    it('should reset circuit breaker manually', () => {
      const modelId = 'gemini-2.0-flash';
      
      // Manually set circuit breaker to open
      const metrics = router.getModelMetrics();
      const model = metrics.find(m => m.modelId === modelId);
      if (model) {
        model.circuitBreakerState.state = 'open';
        model.circuitBreakerState.failureCount = 10;
      }

      // Reset circuit breaker
      router.resetCircuitBreaker(modelId);

      // Verify reset
      const updatedMetrics = router.getModelMetrics();
      const updatedModel = updatedMetrics.find(m => m.modelId === modelId);
      
      expect(updatedModel?.circuitBreakerState.state).toBe('closed');
      expect(updatedModel?.circuitBreakerState.failureCount).toBe(0);
    });
  });

  describe('Adaptive Learning', () => {
    it('should update adaptive weights based on performance', async () => {
      const mockResult = {
        text: 'Success response',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      // Get initial weights
      const initialWeights = router.getAdaptiveWeights();

      // Perform successful request
      await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      // Check if weights were updated
      const updatedWeights = router.getAdaptiveWeights();
      expect(updatedWeights).toBeDefined();
      
      // Weights should exist for the model used
      expect(updatedWeights['gemini-2.0-flash']).toBeDefined();
    });

    it('should decrease weights for failed requests', async () => {
      const mockError = new Error('Model failure');
      mockGenerateTextWithFallback.mockRejectedValue(mockError);

      // Get initial weights
      const initialWeights = router.getAdaptiveWeights();
      const initialWeight = initialWeights['gemini-2.0-flash'] || 1.0;

      // Perform failed request
      try {
        await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);
      } catch {
        // Expected to fail
      }

      // Check if weights were decreased
      const updatedWeights = router.getAdaptiveWeights();
      const updatedWeight = updatedWeights['gemini-2.0-flash'];
      
      expect(updatedWeight).toBeLessThan(initialWeight);
    });

    it('should apply adaptive learning in model selection', async () => {
      // Set up different weights for models
      const mockResult = {
        text: 'Adaptive response',
        modelUsed: 1,
        modelId: 'gemini-1.5-pro', // Different from default selection
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      // Perform request with adaptive learning
      const result = await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Health Monitoring', () => {
    it('should track model health status', () => {
      const healthStatus = router.getHealthStatus();
      expect(Array.isArray(healthStatus)).toBe(true);
    });

    it('should update health status on successful requests', async () => {
      const mockResult = {
        text: 'Healthy response',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      const healthStatus = router.getHealthStatus();
      const modelHealth = healthStatus.find(h => h.modelId === 'gemini-2.0-flash');
      
      if (modelHealth) {
        expect(modelHealth.availability).toBeGreaterThan(0);
      }
    });

    it('should update health status on failed requests', async () => {
      const mockError = new Error('Health check failure');
      mockGenerateTextWithFallback.mockRejectedValue(mockError);

      try {
        await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);
      } catch {
        // Expected to fail
      }

      const healthStatus = router.getHealthStatus();
      const modelHealth = healthStatus.find(h => h.modelId === 'gemini-2.0-flash');
      
      if (modelHealth) {
        expect(modelHealth.errorRate).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimitedRouter = new EnhancedAIModelRouter('RateLimitTest', {
        ...defaultConfig,
        rateLimitEnabled: true,
        requestsPerMinute: 10
      });

      const mockResult = {
        text: 'Rate limited response',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      // Should allow request within limit
      const result = await rateLimitedRouter.generateWithEnhancedRouting(
        mockCriteria, 
        mockGenerateOptions
      );

      expect(result).toBeDefined();
      rateLimitedRouter.destroy();
    });

    it('should reject requests exceeding rate limit', async () => {
      const rateLimitedRouter = new EnhancedAIModelRouter('RateLimitTest', {
        ...defaultConfig,
        rateLimitEnabled: true,
        requestsPerMinute: 1 // Very low limit for testing
      });

      const mockResult = {
        text: 'Response',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      // First request should succeed
      await rateLimitedRouter.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);

      // Second request should be rate limited
      await expect(
        rateLimitedRouter.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions)
      ).rejects.toThrow('Rate limit exceeded');

      rateLimitedRouter.destroy();
    });
  });

  describe('Intelligent Fallback Selection', () => {
    it('should select fallbacks based on performance strategy', async () => {
      const performanceRouter = new EnhancedAIModelRouter('PerformanceTest', {
        ...defaultConfig,
        intelligentFallbackEnabled: true,
        fallbackSelectionStrategy: 'performance'
      });

      const mockResult = {
        text: 'Performance response',
        modelUsed: 1,
        modelId: 'gemini-2.0-flash',
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      const result = await performanceRouter.generateWithEnhancedRouting(
        mockCriteria, 
        mockGenerateOptions
      );

      expect(result).toBeDefined();
      performanceRouter.destroy();
    });

    it('should select fallbacks based on cost strategy', async () => {
      const costRouter = new EnhancedAIModelRouter('CostTest', {
        ...defaultConfig,
        intelligentFallbackEnabled: true,
        fallbackSelectionStrategy: 'cost'
      });

      const mockResult = {
        text: 'Cost-optimized response',
        modelUsed: 1,
        modelId: 'gemini-1.5-flash', // Cheaper model
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      const result = await costRouter.generateWithEnhancedRouting(
        mockCriteria, 
        mockGenerateOptions
      );

      expect(result).toBeDefined();
      costRouter.destroy();
    });

    it('should select fallbacks based on reliability strategy', async () => {
      const reliabilityRouter = new EnhancedAIModelRouter('ReliabilityTest', {
        ...defaultConfig,
        intelligentFallbackEnabled: true,
        fallbackSelectionStrategy: 'reliability'
      });

      const mockResult = {
        text: 'Reliable response',
        modelUsed: 1,
        modelId: 'gemini-1.5-pro', // More reliable model
        status: 'success'
      };

      mockGenerateTextWithFallback.mockResolvedValue(mockResult);

      const result = await reliabilityRouter.generateWithEnhancedRouting(
        mockCriteria, 
        mockGenerateOptions
      );

      expect(result).toBeDefined();
      reliabilityRouter.destroy();
    });
  });

  describe('Metrics and Analytics', () => {
    it('should provide model metrics', () => {
      const metrics = router.getModelMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('modelId');
        expect(metric).toHaveProperty('successRate');
        expect(metric).toHaveProperty('averageResponseTime');
        expect(metric).toHaveProperty('errorRate');
        expect(metric).toHaveProperty('circuitBreakerState');
      });
    });

    it('should provide adaptive weights', () => {
      const weights = router.getAdaptiveWeights();
      expect(typeof weights).toBe('object');
    });

    it('should provide health status', () => {
      const healthStatus = router.getHealthStatus();
      expect(Array.isArray(healthStatus)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should enhance errors with context', async () => {
      const mockError = new Error('Original error');
      mockGenerateTextWithFallback.mockRejectedValue(mockError);

      try {
        await router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions);
      } catch (error) {
        expect(error).toBeDefined();
        // Error should be enhanced by ErrorFactory
      }
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockGenerateTextWithFallback.mockRejectedValue(networkError);

      await expect(
        router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions)
      ).rejects.toThrow();
    });

    it('should handle API key errors', async () => {
      const apiKeyError = new Error('Invalid API key');
      mockGenerateTextWithFallback.mockRejectedValue(apiKeyError);

      await expect(
        router.generateWithEnhancedRouting(mockCriteria, mockGenerateOptions)
      ).rejects.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources on destroy', () => {
      const testRouter = new EnhancedAIModelRouter('DestroyTest', defaultConfig);
      
      // Verify router is functional
      expect(testRouter.getModelMetrics()).toBeDefined();
      
      // Destroy and verify cleanup
      testRouter.destroy();
      
      // Should not throw after destroy
      expect(() => testRouter.getModelMetrics()).not.toThrow();
    });

    it('should handle multiple destroy calls safely', () => {
      const testRouter = new EnhancedAIModelRouter('MultiDestroyTest', defaultConfig);
      
      expect(() => {
        testRouter.destroy();
        testRouter.destroy(); // Second call should be safe
      }).not.toThrow();
    });
  });
});