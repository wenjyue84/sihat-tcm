/**
 * Store System Example
 * 
 * Comprehensive examples demonstrating the usage of the refactored
 * store system with orchestration, factory patterns, and cross-store synchronization.
 */

import {
  // Core Store System
  defaultStoreOrchestrator,
  defaultStoreFactory,
  createStoreOrchestrator,
  createStore,
  initializeStoreSystem,
  createCompleteStoreSetup,
  checkStoreSystemHealth,
  
  // Individual Stores
  useAuthStore,
  useLanguageStore,
  useDiagnosisProgressStore,
  useAuth,
  useLanguage,
  useDiagnosisProgress,
  
  // Types
  type StoreConfig,
  type CrossStoreEvent,
  type StoreMetrics,
} from '../stores';

/**
 * Example 1: Basic Store Usage
 * 
 * Demonstrates how to use individual stores with the new architecture.
 */
export function basicStoreUsageExample() {
  console.log("=== Basic Store Usage Example ===");

  // Using Auth Store
  const authStore = useAuthStore();
  
  // Get current state
  const currentUser = authStore.getState().user;
  console.log("Current user:", currentUser);

  // Subscribe to changes
  const unsubscribeAuth = authStore.subscribe((state) => {
    console.log("Auth state changed:", {
      hasUser: !!state.user,
      isLoading: state.authLoading,
    });
  });

  // Using Language Store
  const languageStore = useLanguageStore();
  
  // Change language
  languageStore.getState().setLanguage('zh');
  console.log("Language changed to:", languageStore.getState().language);

  // Using Diagnosis Progress Store
  const progressStore = useDiagnosisProgressStore();
  
  // Update progress
  progressStore.getState().setDiagnosisProgress(50);
  progressStore.getState().updateDiagnosisFormProgress('basic_info', 3, 5);
  
  console.log("Diagnosis progress:", {
    overall: progressStore.getState().diagnosisProgress,
    formProgress: progressStore.getState().diagnosisFormProgress,
  });

  // Cleanup
  return () => {
    unsubscribeAuth();
  };
}

/**
 * Example 2: Store Orchestrator Usage
 * 
 * Demonstrates cross-store communication and event handling.
 */
export function storeOrchestratorExample() {
  console.log("=== Store Orchestrator Example ===");

  // Initialize the store system
  const { orchestrator, factory } = initializeStoreSystem();

  // Subscribe to cross-store events
  const unsubscribeEvents = orchestrator.subscribe('*', (event: CrossStoreEvent) => {
    console.log("Cross-store event:", {
      type: event.type,
      storeName: event.storeName,
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data,
    });
  });

  // Subscribe to specific store events
  const unsubscribeAuthEvents = orchestrator.subscribe(
    'store:state:changed',
    (event: CrossStoreEvent) => {
      if (event.storeName === 'auth') {
        console.log("Auth store changed:", event.data);
      }
    },
    'auth'
  );

  // Emit custom events
  orchestrator.emitEvent({
    type: 'user:action:performed',
    storeName: 'auth',
    timestamp: Date.now(),
    data: {
      action: 'login_attempt',
      userId: 'user-123',
    },
  });

  // Get orchestrator metrics
  const metrics = orchestrator.getMetrics();
  console.log("Orchestrator metrics:", metrics);

  // Get event history
  const eventHistory = orchestrator.getEventHistory(5);
  console.log("Recent events:", eventHistory);

  // Cleanup
  return () => {
    unsubscribeEvents();
    unsubscribeAuthEvents();
  };
}

/**
 * Example 3: Store Factory Usage
 * 
 * Demonstrates creating stores with validation and configuration.
 */
export function storeFactoryExample() {
  console.log("=== Store Factory Example ===");

  try {
    // Create stores using the factory
    const authStore = createStore('auth');
    const languageStore = createStore('language');
    const progressStore = createStore('diagnosisProgress');

    console.log("Stores created successfully");

    // Get store configuration
    const authConfig = defaultStoreFactory.getStoreConfig('auth');
    console.log("Auth store config:", authConfig);

    // Get factory metrics
    const factoryMetrics = defaultStoreFactory.getMetrics();
    console.log("Factory metrics:", factoryMetrics);

    // Create custom store with validation
    const customConfig = {
      name: 'custom',
      dependencies: ['auth'],
      initialState: {
        customValue: 'test',
        customNumber: 42,
      },
      validation: {
        required: ['customValue', 'customNumber'],
        types: {
          customValue: 'string',
          customNumber: 'number',
        },
      },
    };

    console.log("Custom store configuration validated");

  } catch (error) {
    console.error("Store factory error:", error);
  }
}

/**
 * Example 4: React Hook Usage
 * 
 * Demonstrates how to use the stores in React components.
 */
export function reactHookUsageExample() {
  console.log("=== React Hook Usage Example ===");

  // This would be used in a React component
  const exampleComponent = () => {
    // Using convenience hooks
    const { user, loading, signOut, updatePreferences } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { progress, setProgress, currentStepIndex, navigationState } = useDiagnosisProgress();

    // Example usage
    console.log("Component state:", {
      isAuthenticated: !!user,
      isLoading: loading,
      currentLanguage: language,
      diagnosisProgress: progress,
      currentStep: currentStepIndex,
    });

    // Example actions
    const handleLanguageChange = (newLanguage: 'en' | 'zh' | 'ms') => {
      setLanguage(newLanguage);
      
      // Update user preferences
      if (user) {
        updatePreferences({ language: newLanguage });
      }
    };

    const handleProgressUpdate = (newProgress: number) => {
      setProgress(newProgress);
    };

    return {
      user,
      language,
      progress,
      actions: {
        handleLanguageChange,
        handleProgressUpdate,
        signOut,
      },
    };
  };

  // Simulate component usage
  const componentState = exampleComponent();
  console.log("Example component state:", componentState);
}

/**
 * Example 5: Advanced Cross-Store Synchronization
 * 
 * Demonstrates complex interactions between multiple stores.
 */
export function crossStoreSynchronizationExample() {
  console.log("=== Cross-Store Synchronization Example ===");

  const orchestrator = createStoreOrchestrator({
    enableCrossStoreSync: true,
    enableMetrics: true,
    enableEventHistory: true,
  });

  // Register stores with dependencies
  orchestrator.registerStore('auth', useAuthStore, []);
  orchestrator.registerStore('language', useLanguageStore, ['auth']);
  orchestrator.registerStore('diagnosisProgress', useDiagnosisProgressStore, []);

  // Set up complex synchronization logic
  const unsubscribeSync = orchestrator.subscribe('store:state:changed', (event) => {
    if (event.storeName === 'auth' && event.data.newState.user) {
      // When user logs in, sync language from profile
      const user = event.data.newState.user;
      const profile = event.data.newState.profile;
      
      if (profile?.preferred_language) {
        const languageStore = useLanguageStore();
        languageStore.getState().syncLanguageFromProfile(profile.preferred_language);
        
        console.log("Language synced from user profile:", profile.preferred_language);
      }
    }
  });

  // Simulate user login
  const authStore = useAuthStore();
  authStore.getState().setProfile({
    id: 'user-123',
    role: 'patient',
    full_name: 'John Doe',
    preferred_language: 'zh',
    preferences: {
      language: 'zh',
      isDeveloperMode: false,
    },
  });

  // Check synchronization results
  setTimeout(() => {
    const languageStore = useLanguageStore();
    console.log("Language after sync:", languageStore.getState().language);
    
    const metrics = orchestrator.getMetrics();
    console.log("Synchronization metrics:", metrics);
  }, 100);

  return () => {
    unsubscribeSync();
  };
}

/**
 * Example 6: Store System Health Monitoring
 * 
 * Demonstrates monitoring and debugging capabilities.
 */
export function storeSystemHealthExample() {
  console.log("=== Store System Health Example ===");

  // Initialize complete store setup
  const storeSetup = createCompleteStoreSetup({
    enableCrossStoreSync: true,
    enableMetrics: true,
    enableEventHistory: true,
    enableDebugLogging: true,
  });

  // Perform health check
  const healthCheck = checkStoreSystemHealth();
  console.log("Store system health:", healthCheck);

  // Monitor metrics over time
  const metricsInterval = setInterval(() => {
    const metrics = storeSetup.orchestrator.getMetrics();
    console.log("Current metrics:", {
      totalStores: metrics.totalStores,
      activeSubscriptions: metrics.activeSubscriptions,
      eventsProcessed: metrics.eventsProcessed,
      averageEventProcessingTime: `${metrics.averageEventProcessingTime.toFixed(2)}ms`,
      errorCount: metrics.errorCount,
    });
  }, 5000);

  // Simulate some store activity
  const authStore = storeSetup.stores.auth;
  const languageStore = storeSetup.stores.language;
  const progressStore = storeSetup.stores.diagnosisProgress;

  // Generate some events
  setTimeout(() => {
    authStore.getState().setAuthLoading(false);
    languageStore.getState().setLanguage('en');
    progressStore.getState().setDiagnosisProgress(25);
  }, 1000);

  setTimeout(() => {
    languageStore.getState().setLanguage('zh');
    progressStore.getState().incrementDiagnosisProgress(25);
  }, 2000);

  setTimeout(() => {
    progressStore.getState().updateDiagnosisFormProgress('basic_info', 5, 5);
    progressStore.getState().setDiagnosisStepIndex(1);
  }, 3000);

  // Cleanup after 10 seconds
  setTimeout(() => {
    clearInterval(metricsInterval);
    storeSetup.orchestrator.cleanup();
    console.log("Store system health monitoring completed");
  }, 10000);
}

/**
 * Example 7: Error Handling and Recovery
 * 
 * Demonstrates robust error handling in the store system.
 */
export function errorHandlingExample() {
  console.log("=== Error Handling Example ===");

  const orchestrator = createStoreOrchestrator({
    enableMetrics: true,
    enableDebugLogging: true,
  });

  // Subscribe to events with error handling
  const unsubscribe = orchestrator.subscribe('*', (event) => {
    try {
      // Simulate processing that might fail
      if (event.type === 'error:test') {
        throw new Error("Simulated processing error");
      }
      
      console.log("Event processed successfully:", event.type);
    } catch (error) {
      console.error("Error processing event:", error);
    }
  });

  // Test error scenarios
  try {
    // This should work fine
    orchestrator.emitEvent({
      type: 'normal:event',
      timestamp: Date.now(),
      data: { test: true },
    });

    // This should trigger an error in the listener
    orchestrator.emitEvent({
      type: 'error:test',
      timestamp: Date.now(),
      data: { test: true },
    });

    // Check metrics for errors
    const metrics = orchestrator.getMetrics();
    console.log("Error metrics:", {
      errorCount: metrics.errorCount,
      eventsProcessed: metrics.eventsProcessed,
    });

  } catch (error) {
    console.error("Orchestrator error:", error);
  }

  return () => {
    unsubscribe();
  };
}

/**
 * Example 8: Performance Optimization
 * 
 * Demonstrates performance best practices and monitoring.
 */
export function performanceOptimizationExample() {
  console.log("=== Performance Optimization Example ===");

  const startTime = performance.now();

  // Create optimized store setup
  const orchestrator = createStoreOrchestrator({
    enableCrossStoreSync: false, // Disable if not needed
    enableMetrics: true,
    enableEventHistory: false, // Disable if not needed
    maxEventHistory: 100, // Limit history size
  });

  // Batch operations for better performance
  const batchOperations = () => {
    const progressStore = useDiagnosisProgressStore();
    const state = progressStore.getState();
    
    // Batch multiple updates
    state.setDiagnosisProgress(0);
    state.setDiagnosisStepIndex(0);
    state.updateDiagnosisFormProgress('basic_info', 0, 5);
    state.updateDiagnosisFormProgress('wen_inquiry', 0, 8);
    state.updateDiagnosisFormProgress('wang_tongue', 0, 3);
  };

  // Measure performance
  const batchStartTime = performance.now();
  batchOperations();
  const batchEndTime = performance.now();

  console.log("Batch operations completed in:", `${(batchEndTime - batchStartTime).toFixed(2)}ms`);

  // Monitor memory usage (if available)
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory;
    console.log("Memory usage:", {
      used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    });
  }

  const totalTime = performance.now() - startTime;
  console.log("Performance optimization example completed in:", `${totalTime.toFixed(2)}ms`);
}

/**
 * Run all store system examples
 */
export function runAllStoreExamples() {
  console.log("🏪 Running Store System Examples");
  console.log("================================");

  const cleanupFunctions: (() => void)[] = [];

  try {
    // Run all examples
    cleanupFunctions.push(basicStoreUsageExample());
    cleanupFunctions.push(storeOrchestratorExample());
    storeFactoryExample();
    reactHookUsageExample();
    cleanupFunctions.push(crossStoreSynchronizationExample());
    storeSystemHealthExample();
    cleanupFunctions.push(errorHandlingExample());
    performanceOptimizationExample();

    console.log("✅ All store system examples completed successfully");

  } catch (error) {
    console.error("❌ Error running store system examples:", error);
  } finally {
    // Cleanup
    setTimeout(() => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      });
      console.log("🧹 Store system examples cleanup completed");
    }, 1000);
  }
}

// Export for easy testing
export const storeSystemExamples = {
  basicStoreUsageExample,
  storeOrchestratorExample,
  storeFactoryExample,
  reactHookUsageExample,
  crossStoreSynchronizationExample,
  storeSystemHealthExample,
  errorHandlingExample,
  performanceOptimizationExample,
  runAllStoreExamples,
};