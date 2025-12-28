/**
 * AI Router Usage Examples
 * 
 * Demonstrates how to use the refactored AI Model Router system
 * with real-world scenarios for the Sihat TCM application.
 */

import {
  createModelRouter,
  defaultModelRouter,
} from '../lib/ai/ModelRouter';

import {
  createModel,
  createAllModels,
  createVisionModels,
  defaultModelFactory,
} from '../lib/ai/factories/ModelFactory';

import {
  createEventEmitter,
  on,
  emit,
} from '../lib/events/EventSystem';

import {
  executeCommand,
  SelectAIModelCommand,
} from '../lib/commands/CommandSystem';

import { AI_MODELS } from '../lib/constants';

/**
 * Example 1: Basic AI Router Setup
 */
export async function basicAIRouterSetup() {
  console.log('=== Basic AI Router Setup ===');

  // Create a router with custom configuration
  const router = createModelRouter({
    context: 'SihatTCM-Diagnosis',
    useIntelligentSelection: true,
    enablePerformanceMonitoring: true,
    maxRetries: 3,
  });

  // Create and add models
  const models = createAllModels({
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 30000,
    enableLogging: true,
  });

  models.forEach(model => router.addModel(model));

  console.log(`Router initialized with ${models.length} models`);
  return router;
}

/**
 * Example 2: TCM Diagnosis Request
 */
export async function tcmDiagnosisExample() {
  console.log('=== TCM Diagnosis Example ===');

  const router = await basicAIRouterSetup();

  // Simulate a TCM diagnosis request with tongue and face images
  const diagnosisRequest = {
    messages: [
      {
        role: 'user',
        content: 'I have been experiencing fatigue, poor sleep, and digestive issues for the past month. Please provide a TCM analysis.',
      },
    ],
    images: [
      {
        url: 'data:image/jpeg;base64,...', // Tongue image
        type: 'tongue_analysis',
      },
      {
        url: 'data:image/jpeg;base64,...', // Face image
        type: 'face_analysis',
      },
    ],
    requiresAnalysis: true,
    requiresPersonalization: true,
    urgency: 'normal' as const,
    language: 'en',
    medicalSpecialty: 'tcm',
  };

  try {
    const result = await router.routeRequest(diagnosisRequest);
    
    console.log('Diagnosis Result:', {
      success: result.text ? 'Success' : 'Failed',
      modelUsed: result.modelUsed,
      responseTime: `${result.responseTime}ms`,
      complexity: result.metadata?.complexity,
    });

    return result;
  } catch (error) {
    console.error('Diagnosis failed:', error);
    throw error;
  }
}

/**
 * Example 3: Streaming TCM Consultation
 */
export async function streamingConsultationExample() {
  console.log('=== Streaming Consultation Example ===');

  const router = await basicAIRouterSetup();

  const consultationRequest = {
    messages: [
      {
        role: 'system',
        content: 'You are a Traditional Chinese Medicine practitioner. Provide detailed, personalized health advice based on TCM principles.',
      },
      {
        role: 'user',
        content: 'Based on my constitution assessment showing Yang deficiency, what dietary recommendations do you have for winter?',
      },
    ],
    requiresPersonalization: true,
    language: 'en',
    medicalSpecialty: 'tcm',
  };

  try {
    const stream = await router.routeStreamRequest(consultationRequest);
    
    console.log('Starting streaming consultation...');
    
    // Process the stream
    const reader = stream.getReader();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      fullResponse += chunk;
      
      // In a real app, you'd update the UI here
      process.stdout.write(chunk);
    }
    
    console.log('\nStreaming consultation completed');
    return fullResponse;
    
  } catch (error) {
    console.error('Streaming consultation failed:', error);
    throw error;
  }
}

/**
 * Example 4: Performance Monitoring and Analytics
 */
export async function performanceMonitoringExample() {
  console.log('=== Performance Monitoring Example ===');

  const router = await basicAIRouterSetup();

  // Simulate multiple requests to generate performance data
  const requests = [
    { complexity: 'simple', requiresAnalysis: false },
    { complexity: 'moderate', requiresAnalysis: true },
    { complexity: 'complex', requiresAnalysis: true, images: [{}] },
    { complexity: 'advanced', requiresAnalysis: true, images: [{}, {}] },
  ];

  console.log('Running performance test requests...');

  for (const requestConfig of requests) {
    try {
      await router.routeRequest({
        messages: [{ role: 'user', content: 'Test request' }],
        images: requestConfig.images,
        requiresAnalysis: requestConfig.requiresAnalysis,
      });
    } catch (error) {
      console.log(`Request failed (expected for demo): ${error.message}`);
    }
  }

  // Get performance analytics
  const analytics = router.getPerformanceAnalytics();
  
  console.log('Performance Analytics:', {
    totalRequests: analytics.totalRequests,
    successRate: `${(analytics.successRate * 100).toFixed(1)}%`,
    averageResponseTime: `${analytics.averageResponseTime.toFixed(0)}ms`,
    modelPerformance: Object.entries(analytics.modelPerformance).map(([model, perf]) => ({
      model,
      requests: perf.requests,
      successRate: `${(perf.successRate * 100).toFixed(1)}%`,
      avgResponseTime: `${perf.averageResponseTime.toFixed(0)}ms`,
    })),
  });

  return analytics;
}

/**
 * Example 5: Event-Driven Architecture
 */
export async function eventDrivenExample() {
  console.log('=== Event-Driven Architecture Example ===');

  const router = await basicAIRouterSetup();
  const eventEmitter = createEventEmitter('TCM-Diagnosis');

  // Set up event listeners
  const unsubscribeModelSelected = on('ai:model:selected', (event) => {
    console.log(`🤖 Model Selected: ${event.data.modelId} (${event.data.complexity})`);
    console.log(`   Reasoning: ${event.data.reasoning.join(', ')}`);
  });

  const unsubscribeRequestCompleted = on('ai:request:completed', (event) => {
    console.log(`✅ Request Completed: ${event.data.modelId} in ${event.data.responseTime}ms`);
    
    if (!event.data.success) {
      console.log(`❌ Error: ${event.data.error}`);
    }
  });

  const unsubscribePerformance = on('ai:performance:recorded', (event) => {
    console.log(`📊 Performance: ${event.data.modelId} - ${event.data.metrics.responseTime}ms`);
  });

  // Simulate AI request with events
  try {
    // Emit model selection event
    await eventEmitter.emit({
      type: 'ai:model:selected',
      data: {
        modelId: AI_MODELS.GEMINI_2_5_PRO,
        complexity: 'moderate',
        reasoning: ['Vision analysis required', 'Moderate complexity detected'],
      },
    });

    // Make actual request
    const result = await router.routeRequest({
      messages: [{ role: 'user', content: 'Analyze my tongue image for TCM diagnosis' }],
      images: [{ url: 'mock-image-url', type: 'tongue' }],
      requiresAnalysis: true,
    });

    // Emit completion event
    await eventEmitter.emit({
      type: 'ai:request:completed',
      data: {
        requestId: 'req-123',
        modelId: result.modelUsed,
        responseTime: result.responseTime,
        success: Boolean(result.text),
      },
    });

  } catch (error) {
    console.error('Event-driven request failed:', error);
  } finally {
    // Clean up event listeners
    unsubscribeModelSelected();
    unsubscribeRequestCompleted();
    unsubscribePerformance();
  }
}

/**
 * Example 6: Command Pattern with Undo/Redo
 */
export async function commandPatternExample() {
  console.log('=== Command Pattern Example ===');

  const router = await basicAIRouterSetup();

  // Create a model selection command
  const selectModelCommand = new SelectAIModelCommand(
    AI_MODELS.GEMINI_3_PRO_PREVIEW,
    { complexity: 'advanced', requiresVision: true },
    router,
    { reason: 'User requested advanced model for complex analysis' }
  );

  try {
    // Execute the command
    console.log('Executing model selection command...');
    const result = await executeCommand(selectModelCommand, {
      source: 'UserInterface',
      priority: 1,
    });

    console.log('Command Result:', {
      success: result.success,
      executionTime: `${result.executionTime}ms`,
      modelSelected: result.metadata?.modelId,
    });

    // Demonstrate undo functionality
    if (result.success && selectModelCommand.canUndo?.()) {
      console.log('Undoing model selection...');
      const undoResult = await selectModelCommand.undo?.();
      
      console.log('Undo Result:', {
        success: undoResult?.success,
        restoredModel: undoResult?.metadata?.restoredModelId,
      });
    }

  } catch (error) {
    console.error('Command execution failed:', error);
  }
}

/**
 * Example 7: Advanced Configuration and Strategy Switching
 */
export async function advancedConfigurationExample() {
  console.log('=== Advanced Configuration Example ===');

  // Create router with custom configuration
  const router = createModelRouter({
    context: 'TCM-Advanced',
    useIntelligentSelection: false, // Start with rule-based
    enablePerformanceMonitoring: true,
    fallbackThreshold: 5000,
    maxRetries: 2,
  });

  // Add models
  const visionModels = createVisionModels({
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 15000,
  });

  visionModels.forEach(model => router.addModel(model));

  console.log('Initial Configuration:', router.getConfig());

  // Make a request with rule-based selection
  console.log('Making request with rule-based selection...');
  await router.routeRequest({
    messages: [{ role: 'user', content: 'Simple query' }],
  });

  // Switch to intelligent selection at runtime
  console.log('Switching to intelligent selection...');
  router.updateConfig({
    useIntelligentSelection: true,
    maxRetries: 3,
  });

  console.log('Updated Configuration:', router.getConfig());

  // Make another request with intelligent selection
  console.log('Making request with intelligent selection...');
  await router.routeRequest({
    messages: [{ role: 'user', content: 'Complex analysis request' }],
    requiresAnalysis: true,
  });

  // Get final analytics
  const analytics = router.getPerformanceAnalytics();
  console.log('Final Analytics:', {
    totalRequests: analytics.totalRequests,
    successRate: `${(analytics.successRate * 100).toFixed(1)}%`,
  });
}

/**
 * Example 8: Error Handling and Recovery
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');

  const router = await basicAIRouterSetup();

  // Test various error scenarios
  const errorScenarios = [
    {
      name: 'Invalid Request',
      request: {
        messages: [], // Empty messages should cause validation error
      },
    },
    {
      name: 'Timeout Scenario',
      request: {
        messages: [{ role: 'user', content: 'This might timeout' }],
        // In real implementation, this would trigger timeout
      },
    },
    {
      name: 'Model Unavailable',
      request: {
        messages: [{ role: 'user', content: 'Test with unavailable model' }],
        // This would test fallback mechanisms
      },
    },
  ];

  for (const scenario of errorScenarios) {
    console.log(`\nTesting: ${scenario.name}`);
    
    try {
      const result = await router.routeRequest(scenario.request);
      console.log(`✅ Scenario passed: ${scenario.name}`);
    } catch (error) {
      console.log(`❌ Expected error in ${scenario.name}: ${error.message}`);
      
      // In a real app, you'd handle different error types appropriately
      if (error.code === 'VALIDATION_ERROR') {
        console.log('   → Validation error handled gracefully');
      } else if (error.code === 'TIMEOUT_ERROR') {
        console.log('   → Timeout error, retrying with different model');
      } else if (error.code === 'MODEL_UNAVAILABLE') {
        console.log('   → Model unavailable, using fallback');
      }
    }
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running All AI Router Examples\n');

  try {
    await basicAIRouterSetup();
    await tcmDiagnosisExample();
    await streamingConsultationExample();
    await performanceMonitoringExample();
    await eventDrivenExample();
    await commandPatternExample();
    await advancedConfigurationExample();
    await errorHandlingExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  }
}

// Export for use in other files
export default {
  basicAIRouterSetup,
  tcmDiagnosisExample,
  streamingConsultationExample,
  performanceMonitoringExample,
  eventDrivenExample,
  commandPatternExample,
  advancedConfigurationExample,
  errorHandlingExample,
  runAllExamples,
};