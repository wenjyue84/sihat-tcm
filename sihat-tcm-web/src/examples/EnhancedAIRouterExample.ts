/**
 * Enhanced AI Model Router Example
 * 
 * Comprehensive example demonstrating the advanced features of the
 * Enhanced AI Model Router including circuit breakers, adaptive learning,
 * and intelligent fallback selection.
 */

import { 
  EnhancedAIModelRouter, 
  createEnhancedRouter,
  type EnhancedRouterConfig 
} from '@/lib/ai/core/EnhancedAIModelRouter';
import type { 
  ModelSelectionCriteria, 
  GenerateCallOptions,
  StreamCallOptions 
} from '@/lib/ai/interfaces/ModelInterfaces';

/**
 * Example 1: Basic Enhanced Routing
 */
export async function basicEnhancedRoutingExample() {
  console.log('=== Basic Enhanced Routing Example ===');

  // Create router with enhanced features
  const router = createEnhancedRouter('BasicExample', {
    circuitBreakerEnabled: true,
    adaptiveLearningEnabled: true,
    intelligentFallbackEnabled: true,
    fallbackSelectionStrategy: 'performance'
  });

  try {
    // Define selection criteria
    const criteria: ModelSelectionCriteria = {
      complexity: {
        type: 'simple',
        score: 0.3,
        factors: {
          inputLength: 100,
          outputLength: 200,
          requiresReasoning: false
        }
      },
      requirements: {
        maxLatency: 3000,
        minAccuracy: 0.8,
        costSensitive: false
      }
    };

    // Generate options
    const options: GenerateCallOptions = {
      system: 'You are a helpful TCM assistant. Provide concise, accurate responses.',
      messages: [
        { 
          role: 'user', 
          content: 'What are the basic principles of Traditional Chinese Medicine?' 
        }
      ]
    };

    // Execute enhanced routing
    const result = await router.generateWithEnhancedRouting(criteria, options);

    console.log('✅ Enhanced routing successful:');
    console.log(`   Model used: ${result.modelId}`);
    console.log(`   Response time: ${result.responseTime}ms`);
    console.log(`   Fallbacks used: ${result.fallbacksUsed}`);
    console.log(`   Circuit breaker triggered: ${result.circuitBreakerTriggered}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Response length: ${result.text.length} characters`);

    return result;

  } catch (error) {
    console.error('❌ Enhanced routing failed:', error);
    throw error;
  } finally {
    router.destroy();
  }
}

/**
 * Example 2: Streaming with Enhanced Features
 */
export async function streamingEnhancedExample() {
  console.log('\n=== Streaming Enhanced Example ===');

  const router = createEnhancedRouter('StreamingExample', {
    circuitBreakerEnabled: true,
    rateLimitEnabled: true,
    requestsPerMinute: 30
  });

  try {
    const criteria: ModelSelectionCriteria = {
      complexity: {
        type: 'complex',
        score: 0.8,
        factors: {
          inputLength: 500,
          outputLength: 1000,
          requiresReasoning: true,
          hasImages: false
        }
      },
      requirements: {
        maxLatency: 10000,
        minAccuracy: 0.9,
        costSensitive: false
      }
    };

    const streamOptions: StreamCallOptions = {
      system: 'Provide a detailed TCM diagnosis based on the symptoms described.',
      messages: [
        {
          role: 'user',
          content: 'I have been experiencing fatigue, cold hands and feet, and digestive issues for the past month. Please provide a TCM analysis.'
        }
      ],
      onFinish: (completion) => {
        console.log('✅ Streaming completed');
        console.log(`   Final text length: ${completion.text.length} characters`);
      },
      onError: (error) => {
        console.error('❌ Streaming error:', error.message);
      }
    };

    const response = await router.streamWithEnhancedRouting(criteria, streamOptions);
    
    console.log('✅ Streaming initiated successfully');
    console.log(`   Response status: ${response.status}`);
    console.log(`   Model used: ${response.headers.get('X-Model-Used')}`);

    return response;

  } catch (error) {
    console.error('❌ Streaming failed:', error);
    throw error;
  } finally {
    router.destroy();
  }
}

/**
 * Example 3: Circuit Breaker Demonstration
 */
export async function circuitBreakerExample() {
  console.log('\n=== Circuit Breaker Example ===');

  const router = createEnhancedRouter('CircuitBreakerExample', {
    circuitBreakerEnabled: true,
    failureThreshold: 3, // Low threshold for demo
    recoveryTimeout: 5000, // 5 seconds
    adaptiveLearningEnabled: true
  });

  try {
    console.log('📊 Initial model metrics:');
    const initialMetrics = router.getModelMetrics();
    initialMetrics.forEach(metric => {
      console.log(`   ${metric.modelId}: ${metric.circuitBreakerState.state} (failures: ${metric.circuitBreakerState.failureCount})`);
    });

    // Simulate some requests that might fail
    const criteria: ModelSelectionCriteria = {
      complexity: {
        type: 'simple',
        score: 0.2,
        factors: {}
      },
      requirements: {
        maxLatency: 2000,
        minAccuracy: 0.7
      }
    };

    const options: GenerateCallOptions = {
      system: 'Respond briefly.',
      messages: [{ role: 'user', content: 'Hello' }]
    };

    // Try multiple requests to demonstrate circuit breaker behavior
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\n🔄 Request ${i}:`);
        const result = await router.generateWithEnhancedRouting(criteria, options);
        console.log(`   ✅ Success with ${result.modelId} (${result.responseTime}ms)`);
        console.log(`   Circuit breaker triggered: ${result.circuitBreakerTriggered}`);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Show current circuit breaker states
      const currentMetrics = router.getModelMetrics();
      console.log('   Circuit breaker states:');
      currentMetrics.forEach(metric => {
        if (metric.circuitBreakerState.failureCount > 0) {
          console.log(`     ${metric.modelId}: ${metric.circuitBreakerState.state} (failures: ${metric.circuitBreakerState.failureCount})`);
        }
      });
    }

    // Demonstrate manual circuit breaker reset
    console.log('\n🔧 Manually resetting circuit breakers...');
    initialMetrics.forEach(metric => {
      router.resetCircuitBreaker(metric.modelId);
    });

    const resetMetrics = router.getModelMetrics();
    console.log('📊 After reset:');
    resetMetrics.forEach(metric => {
      console.log(`   ${metric.modelId}: ${metric.circuitBreakerState.state} (failures: ${metric.circuitBreakerState.failureCount})`);
    });

  } catch (error) {
    console.error('❌ Circuit breaker example failed:', error);
  } finally {
    router.destroy();
  }
}

/**
 * Example 4: Adaptive Learning Demonstration
 */
export async function adaptiveLearningExample() {
  console.log('\n=== Adaptive Learning Example ===');

  const router = createEnhancedRouter('AdaptiveLearningExample', {
    adaptiveLearningEnabled: true,
    learningWindowSize: 10,
    performanceWeightDecay: 0.9,
    circuitBreakerEnabled: false // Disable to focus on learning
  });

  try {
    console.log('📊 Initial adaptive weights:');
    let weights = router.getAdaptiveWeights();
    console.log(JSON.stringify(weights, null, 2));

    const criteria: ModelSelectionCriteria = {
      complexity: {
        type: 'medium',
        score: 0.5,
        factors: {
          inputLength: 300,
          outputLength: 400,
          requiresReasoning: true
        }
      },
      requirements: {
        maxLatency: 5000,
        minAccuracy: 0.85
      }
    };

    const options: GenerateCallOptions = {
      system: 'Provide helpful TCM advice.',
      messages: [
        { 
          role: 'user', 
          content: 'What dietary recommendations would you give for someone with a Yang deficiency constitution?' 
        }
      ]
    };

    // Perform multiple requests to demonstrate learning
    console.log('\n🧠 Performing requests to demonstrate adaptive learning:');
    
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\nRequest ${i}:`);
        const result = await router.generateWithEnhancedRouting(criteria, options);
        
        console.log(`   ✅ Model: ${result.modelId}`);
        console.log(`   Response time: ${result.responseTime}ms`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

        // Show updated weights after each request
        weights = router.getAdaptiveWeights();
        console.log('   Updated weights:', JSON.stringify(weights, null, 2));

      } catch (error) {
        console.log(`   ❌ Request ${i} failed:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Final adaptive weights:');
    const finalWeights = router.getAdaptiveWeights();
    console.log(JSON.stringify(finalWeights, null, 2));

  } catch (error) {
    console.error('❌ Adaptive learning example failed:', error);
  } finally {
    router.destroy();
  }
}

/**
 * Example 5: Health Monitoring and Analytics
 */
export async function healthMonitoringExample() {
  console.log('\n=== Health Monitoring Example ===');

  const router = createEnhancedRouter('HealthMonitoringExample', {
    healthCheckInterval: 0, // Disable automatic checks for demo
    enablePerformanceMonitoring: true
  });

  try {
    // Get initial health status
    console.log('🏥 Initial health status:');
    let healthStatus = router.getHealthStatus();
    if (healthStatus.length === 0) {
      console.log('   No health data available yet');
    } else {
      healthStatus.forEach(status => {
        console.log(`   ${status.modelId}: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
        console.log(`     Availability: ${status.availability.toFixed(1)}%`);
        console.log(`     Error rate: ${(status.errorRate * 100).toFixed(1)}%`);
        console.log(`     Response time: ${status.responseTime.toFixed(0)}ms`);
      });
    }

    // Get model metrics
    console.log('\n📊 Model metrics:');
    const metrics = router.getModelMetrics();
    metrics.forEach(metric => {
      console.log(`   ${metric.modelId}:`);
      console.log(`     Success rate: ${(metric.successRate * 100).toFixed(1)}%`);
      console.log(`     Avg response time: ${metric.averageResponseTime.toFixed(0)}ms`);
      console.log(`     Error rate: ${(metric.errorRate * 100).toFixed(1)}%`);
      console.log(`     Total requests: ${metric.totalRequests}`);
    });

    // Perform some requests to generate health data
    console.log('\n🔄 Performing requests to generate health data...');
    
    const criteria: ModelSelectionCriteria = {
      complexity: {
        type: 'simple',
        score: 0.3,
        factors: {}
      },
      requirements: {
        maxLatency: 3000,
        minAccuracy: 0.8
      }
    };

    const options: GenerateCallOptions = {
      system: 'Respond with "Health check OK"',
      messages: [{ role: 'user', content: 'Health check' }]
    };

    for (let i = 1; i <= 3; i++) {
      try {
        const result = await router.generateWithEnhancedRouting(criteria, options);
        console.log(`   Request ${i}: ✅ ${result.modelId} (${result.responseTime}ms)`);
      } catch (error) {
        console.log(`   Request ${i}: ❌ Failed`);
      }
    }

    // Show updated health status
    console.log('\n🏥 Updated health status:');
    healthStatus = router.getHealthStatus();
    healthStatus.forEach(status => {
      console.log(`   ${status.modelId}: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      if (status.issues.length > 0) {
        console.log(`     Issues: ${status.issues.length}`);
        status.issues.forEach(issue => {
          console.log(`       - ${issue.type}: ${issue.description}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Health monitoring example failed:', error);
  } finally {
    router.destroy();
  }
}

/**
 * Example 6: Intelligent Fallback Strategies
 */
export async function intelligentFallbackExample() {
  console.log('\n=== Intelligent Fallback Example ===');

  // Test different fallback strategies
  const strategies: Array<'performance' | 'cost' | 'reliability'> = ['performance', 'cost', 'reliability'];

  for (const strategy of strategies) {
    console.log(`\n🎯 Testing ${strategy} strategy:`);
    
    const router = createEnhancedRouter(`FallbackExample-${strategy}`, {
      intelligentFallbackEnabled: true,
      fallbackSelectionStrategy: strategy,
      circuitBreakerEnabled: false
    });

    try {
      const criteria: ModelSelectionCriteria = {
        complexity: {
          type: 'complex',
          score: 0.7,
          factors: {
            inputLength: 800,
            outputLength: 1200,
            requiresReasoning: true,
            hasImages: false
          }
        },
        requirements: {
          maxLatency: strategy === 'performance' ? 3000 : 8000,
          minAccuracy: 0.9,
          costSensitive: strategy === 'cost'
        }
      };

      const options: GenerateCallOptions = {
        system: `Provide a detailed analysis optimized for ${strategy}.`,
        messages: [
          {
            role: 'user',
            content: 'Explain the relationship between Qi, Blood, and Essence in TCM theory.'
          }
        ]
      };

      const result = await router.generateWithEnhancedRouting(criteria, options);
      
      console.log(`   ✅ Selected model: ${result.modelId}`);
      console.log(`   Response time: ${result.responseTime}ms`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Strategy effectiveness: ${strategy} optimization applied`);

    } catch (error) {
      console.log(`   ❌ ${strategy} strategy failed:`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      router.destroy();
    }
  }
}

/**
 * Example 7: Configuration Comparison
 */
export async function configurationComparisonExample() {
  console.log('\n=== Configuration Comparison Example ===');

  const configs: Array<{ name: string; config: Partial<EnhancedRouterConfig> }> = [
    {
      name: 'Basic',
      config: {
        circuitBreakerEnabled: false,
        adaptiveLearningEnabled: false,
        intelligentFallbackEnabled: false
      }
    },
    {
      name: 'Performance Optimized',
      config: {
        circuitBreakerEnabled: true,
        adaptiveLearningEnabled: true,
        intelligentFallbackEnabled: true,
        fallbackSelectionStrategy: 'performance',
        failureThreshold: 3,
        recoveryTimeout: 30000
      }
    },
    {
      name: 'Reliability Focused',
      config: {
        circuitBreakerEnabled: true,
        adaptiveLearningEnabled: true,
        intelligentFallbackEnabled: true,
        fallbackSelectionStrategy: 'reliability',
        failureThreshold: 2,
        recoveryTimeout: 60000,
        rateLimitEnabled: true,
        requestsPerMinute: 20
      }
    }
  ];

  const criteria: ModelSelectionCriteria = {
    complexity: {
      type: 'medium',
      score: 0.6,
      factors: {
        inputLength: 400,
        outputLength: 600,
        requiresReasoning: true
      }
    },
    requirements: {
      maxLatency: 5000,
      minAccuracy: 0.85
    }
  };

  const options: GenerateCallOptions = {
    system: 'Provide a balanced TCM consultation response.',
    messages: [
      {
        role: 'user',
        content: 'I have been experiencing stress and insomnia. What TCM approach would you recommend?'
      }
    ]
  };

  for (const { name, config } of configs) {
    console.log(`\n⚙️  Testing ${name} configuration:`);
    
    const router = createEnhancedRouter(`ConfigTest-${name}`, config);

    try {
      const startTime = Date.now();
      const result = await router.generateWithEnhancedRouting(criteria, options);
      const totalTime = Date.now() - startTime;

      console.log(`   ✅ Success with ${name} config:`);
      console.log(`     Model: ${result.modelId}`);
      console.log(`     Total time: ${totalTime}ms`);
      console.log(`     Model response time: ${result.responseTime}ms`);
      console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`     Fallbacks used: ${result.fallbacksUsed}`);
      console.log(`     Circuit breaker triggered: ${result.circuitBreakerTriggered}`);

    } catch (error) {
      console.log(`   ❌ ${name} config failed:`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      router.destroy();
    }
  }
}

/**
 * Run all examples
 */
export async function runAllEnhancedRouterExamples() {
  console.log('🚀 Enhanced AI Model Router Examples\n');
  console.log('This demonstrates the advanced features of the Enhanced AI Model Router');
  console.log('including circuit breakers, adaptive learning, and intelligent fallback selection.\n');

  try {
    await basicEnhancedRoutingExample();
    await streamingEnhancedExample();
    await circuitBreakerExample();
    await adaptiveLearningExample();
    await healthMonitoringExample();
    await intelligentFallbackExample();
    await configurationComparisonExample();

    console.log('\n✅ All Enhanced AI Router examples completed successfully!');
    console.log('\nKey takeaways:');
    console.log('• Enhanced routing provides better reliability through circuit breakers');
    console.log('• Adaptive learning improves model selection over time');
    console.log('• Intelligent fallback strategies optimize for different priorities');
    console.log('• Health monitoring provides visibility into model performance');
    console.log('• Rate limiting prevents API quota exhaustion');
    console.log('• Comprehensive error handling improves user experience');

  } catch (error) {
    console.error('\n❌ Enhanced AI Router examples failed:', error);
    throw error;
  }
}

// Export individual examples for selective testing
export {
  basicEnhancedRoutingExample,
  streamingEnhancedExample,
  circuitBreakerExample,
  adaptiveLearningExample,
  healthMonitoringExample,
  intelligentFallbackExample,
  configurationComparisonExample
};

// Default export for easy importing
export default runAllEnhancedRouterExamples;