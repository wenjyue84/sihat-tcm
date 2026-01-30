# Refactoring Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the newly refactored components into your existing Sihat TCM codebase. The refactoring follows clean architecture principles and implements multiple design patterns for improved maintainability and extensibility.

## Migration Strategy

### Phase 1: Gradual Integration (Recommended)
- Integrate new components alongside existing ones
- Use feature flags to switch between old and new implementations
- Gradually migrate functionality piece by piece
- Maintain backward compatibility during transition

### Phase 2: Complete Migration
- Replace old implementations with new refactored components
- Remove deprecated code and clean up imports
- Update all references and dependencies
- Finalize the migration

## Component Integration Steps

### 1. AI Model Router Integration

#### Step 1.1: Update Imports
Replace the old AI model router imports with the new modular components:

```typescript
// OLD - Remove these imports
import { AIModelRouter } from '@/lib/aiModelRouter';

// NEW - Add these imports
import { 
  createModelRouter, 
  defaultModelRouter 
} from '@/lib/ai/ModelRouter';
import { createModel, createAllModels } from '@/lib/ai/factories/ModelFactory';
import { 
  createComplexityAnalyzer, 
  defaultComplexityAnalyzer 
} from '@/lib/ai/analysis/ComplexityAnalyzer';
```

#### Step 1.2: Initialize New Router
Replace old router initialization:

```typescript
// OLD
const router = new AIModelRouter("MyApp");

// NEW
const router = createModelRouter({
  context: 'MyApp',
  useIntelligentSelection: true,
  enablePerformanceMonitoring: true,
});

// Add models to the router
const models = createAllModels({
  apiKey: process.env.GEMINI_API_KEY,
  timeout: 30000,
});

models.forEach(model => router.addModel(model));
```

#### Step 1.3: Update Method Calls
Update method calls to use the new interface:

```typescript
// OLD
const complexity = router.analyzeComplexity(request);
const result = await router.generateWithRouting(criteria, options);

// NEW
const result = await router.routeRequest({
  messages: request.messages,
  images: request.images,
  requiresAnalysis: true,
  language: 'en',
});
```

#### Step 1.4: Update Performance Monitoring
Replace old performance tracking:

```typescript
// OLD
const stats = router.getPerformanceAnalytics();

// NEW
const analytics = router.getPerformanceAnalytics();
const modelRanking = analytics.modelPerformance;
```

### 2. Notification System Integration

#### Step 2.1: Update Mobile Notification Manager
Replace the old notification manager with the new modular system:

```typescript
// OLD - Remove
import MobileNotificationManager from '@/lib/MobileNotificationManager';

// NEW - Add
import { 
  createNotificationScheduler 
} from '@/lib/notifications/NotificationScheduler';
import { 
  createPreferenceManager 
} from '@/lib/notifications/PreferenceManager';
import type { 
  NotificationService,
  NotificationRequest 
} from '@/lib/notifications/NotificationInterfaces';
```

#### Step 2.2: Initialize New Notification System
Create the new notification system:

```typescript
// Create components
const scheduler = createNotificationScheduler('MyApp');
const preferenceManager = createPreferenceManager('MyApp');

// Create notification service (you'll need to implement this)
class MyNotificationService implements NotificationService {
  constructor(
    private scheduler: NotificationScheduler,
    private preferenceManager: PreferenceManager
  ) {}

  async initialize() {
    // Implementation
  }

  async schedule(notification: NotificationRequest) {
    return this.scheduler.schedule(notification);
  }

  // ... other methods
}

const notificationService = new MyNotificationService(scheduler, preferenceManager);
```

#### Step 2.3: Update Notification Calls
Replace old notification method calls:

```typescript
// OLD
await MobileNotificationManager.scheduleTCMNotification(
  'MEDICATION_REMINDER',
  { medicationName: 'Herbal Formula' }
);

// NEW
await notificationService.schedule({
  title: '💊 Herbal Medicine Time',
  body: 'Time to take your prescribed herbal formula.',
  category: 'medication',
  priority: 'high',
  data: { medicationName: 'Herbal Formula' },
});
```

### 3. Event System Integration

#### Step 3.1: Add Event System
Integrate the new event system for decoupled communication:

```typescript
import { 
  createEventEmitter, 
  on, 
  emit 
} from '@/lib/events/EventSystem';

// Create scoped emitter for your component
const eventEmitter = createEventEmitter('MyComponent');

// Listen to events
const unsubscribe = on('ai:request:completed', (event) => {
  console.log('AI request completed:', event.data);
});

// Emit events
await eventEmitter.emit({
  type: 'ai:request:started',
  data: {
    requestId: 'req-123',
    modelId: 'gemini-2.5-pro',
    complexity: 'moderate',
  },
});
```

#### Step 3.2: Replace Direct Component Communication
Replace direct method calls with events where appropriate:

```typescript
// OLD - Direct coupling
notificationManager.onAIRequestCompleted(result);

// NEW - Event-based decoupling
await emit({
  type: 'ai:request:completed',
  timestamp: new Date(),
  source: 'AIModelRouter',
  data: {
    requestId: result.requestId,
    modelId: result.modelUsed,
    responseTime: result.responseTime,
    success: true,
  },
});
```

### 4. Command System Integration

#### Step 4.1: Add Command System for Operations
Use commands for operations that need undo/redo support:

```typescript
import { 
  executeCommand, 
  SelectAIModelCommand,
  ScheduleNotificationCommand 
} from '@/lib/commands/CommandSystem';

// Execute AI model selection as a command
const selectModelCommand = new SelectAIModelCommand(
  'gemini-2.5-pro',
  { complexity: 'moderate' },
  modelRouter
);

const result = await executeCommand(selectModelCommand, {
  source: 'UserInterface',
  priority: 1,
});

// Execute notification scheduling as a command
const scheduleCommand = new ScheduleNotificationCommand(
  notificationRequest,
  notificationService
);

await executeCommand(scheduleCommand);
```

### 5. Alert System Integration

#### Step 5.1: Replace Old Alert Manager
Replace the monolithic alert manager with the new modular system:

```typescript
// OLD - Remove these imports
import { alertManager } from '@/lib/monitoring/alertManager';

// NEW - Add these imports
import { 
  alertSystemManager,
  recordMetric,
  sendAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertStatistics,
} from '@/lib/monitoring/alerts';
import type {
  ManualAlertData,
  AlertSeverity,
  AlertCategory,
} from '@/lib/monitoring/alerts';
```

#### Step 5.2: Initialize New Alert System
Initialize the new alert system in your application:

```typescript
// Initialize with custom configuration
import { createAlertSystemManager } from '@/lib/monitoring/alerts';

const alertSystem = createAlertSystemManager({
  enabled: true,
  healthCheckInterval: 60000, // 1 minute
  defaultCooldownPeriod: 600000, // 10 minutes
  alertRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
});

await alertSystem.initialize();
```

#### Step 5.3: Update Metric Recording
Replace old metric recording calls:

```typescript
// OLD
alertManager.recordMetric('api_response_time', responseTime);

// NEW
recordMetric('api_response_time', responseTime, {
  service: 'diagnosis',
  region: 'us-east-1',
});
```

#### Step 5.4: Update Alert Sending
Replace manual alert sending:

```typescript
// OLD
await alertManager.sendAlert({
  type: 'system_error',
  message: 'Database connection failed',
  severity: 'critical',
});

// NEW
const alertData: ManualAlertData = {
  type: 'system_error',
  message: 'Database connection failed',
  severity: 'critical' as AlertSeverity,
  category: 'database' as AlertCategory,
  metadata: {
    timestamp: Date.now(),
    service: 'sihat-tcm',
  },
};

const alert = await sendAlert(alertData);
```

#### Step 5.5: Update Alert Resolution
Replace alert resolution calls:

```typescript
// OLD
alertManager.resolveAlert(alertId, 'admin_user');

// NEW
resolveAlert(alertId, 'admin_user');
```

#### Step 5.6: Update Statistics Retrieval
Replace statistics calls:

```typescript
// OLD
const stats = alertManager.getAlertStatistics();

// NEW
const stats = getAlertStatistics();
const activeAlerts = getActiveAlerts();
```

### 6. Testing Integration

#### Step 5.1: Add Property-Based Tests
Create property-based tests for your components:

```typescript
import { 
  defaultTestFramework,
  createPropertyTest,
  TestDataGenerators 
} from '@/lib/testing/TestFramework';

// Create property tests
const aiRouterTests = defaultTestFramework.createAIModelRouterTests();
const notificationTests = defaultTestFramework.createNotificationTests();

// Add custom property test
const customTest = createPropertyTest(
  'My Custom Property',
  async (input) => {
    // Test property that should always be true
    return input.someProperty !== undefined;
  },
  TestDataGenerators.object({
    someProperty: TestDataGenerators.string(1, 10),
  }),
  {
    iterations: 50,
    priority: 'high',
  }
);

// Run tests
const suite = {
  name: 'My Test Suite',
  description: 'Tests for my component',
  tests: [...aiRouterTests, ...notificationTests, customTest],
};

const report = await defaultTestFramework.runTestSuite(suite);
console.log('Test Results:', report);
```

## Configuration Updates

### 1. Update Constants Usage
Ensure you're using the centralized constants:

```typescript
// Make sure these imports are consistent
import { 
  AI_MODELS, 
  MODEL_CAPABILITIES, 
  COMPLEXITY_SCORING,
  NOTIFICATION_CONFIG 
} from '@/lib/constants';
```

### 2. Update Error Handling
Use the standardized error handling:

```typescript
import { 
  AppError, 
  AIModelError, 
  NotificationError,
  ErrorFactory 
} from '@/lib/errors/AppError';

// Use proper error types
try {
  // Some operation
} catch (error) {
  throw ErrorFactory.fromUnknownError(error, {
    component: 'MyComponent',
    action: 'myAction',
    metadata: { additionalInfo: 'value' },
  });
}
```

## Environment Setup

### 1. Update Package Dependencies
Add any new dependencies that might be needed:

```json
{
  "dependencies": {
    "@expo/vector-icons": "^13.0.0",
    "expo-notifications": "~0.20.1",
    "expo-device": "~5.4.0"
  }
}
```

### 2. Update TypeScript Configuration
Ensure your tsconfig.json includes the new paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/lib/ai/*": ["./src/lib/ai/*"],
      "@/lib/events/*": ["./src/lib/events/*"],
      "@/lib/commands/*": ["./src/lib/commands/*"],
      "@/lib/testing/*": ["./src/lib/testing/*"]
    }
  }
}
```

## Testing the Integration

### 1. Unit Tests
Test individual components:

```typescript
// Test the complexity analyzer
const analyzer = createComplexityAnalyzer();
const complexity = analyzer.analyzeComplexity({
  messages: [{ role: 'user', content: 'Hello' }],
  requiresAnalysis: true,
});

expect(complexity.type).toBe('simple');
expect(complexity.score).toBeGreaterThan(0);
```

### 2. Integration Tests
Test component interactions:

```typescript
// Test router with real models
const router = createModelRouter();
const models = createAllModels();
models.forEach(model => router.addModel(model));

const result = await router.routeRequest({
  messages: [{ role: 'user', content: 'Test message' }],
});

expect(result.success).toBe(true);
expect(result.modelUsed).toBeDefined();
```

### 3. Property-Based Tests
Run the comprehensive property tests:

```typescript
const testSuite = {
  name: 'Integration Tests',
  tests: [
    ...defaultTestFramework.createAIModelRouterTests(),
    ...defaultTestFramework.createNotificationTests(),
  ],
};

const report = await defaultTestFramework.runTestSuite(testSuite);
expect(report.summary.successRate).toBeGreaterThan(95);
```

## Performance Considerations

### 1. Lazy Loading
Load components only when needed:

```typescript
// Lazy load heavy components
const createModelRouterLazy = () => import('@/lib/ai/ModelRouter').then(m => m.createModelRouter);
```

### 2. Caching
Use the built-in caching mechanisms:

```typescript
// Model factory has built-in caching
const model1 = createModel('gemini-2.5-pro'); // Creates new instance
const model2 = createModel('gemini-2.5-pro'); // Returns cached instance
```

### 3. Memory Management
Clean up resources properly:

```typescript
// Clean up event listeners
const unsubscribe = on('some:event', handler);
// Later...
unsubscribe();

// Clear performance history if needed
router.clearPerformanceHistory();
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all new imports are correctly referenced
2. **Type Errors**: Update TypeScript types to match new interfaces
3. **Runtime Errors**: Check that all dependencies are properly initialized
4. **Performance Issues**: Monitor the performance analytics to identify bottlenecks

### Debug Mode
Enable debug logging to troubleshoot issues:

```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  // Set up debug logging
}
```

## Rollback Plan

If issues arise during integration:

1. **Feature Flags**: Use feature flags to quickly switch back to old implementation
2. **Git Branches**: Keep old implementation in a separate branch
3. **Gradual Rollback**: Roll back components one by one if needed
4. **Database Backup**: Ensure you have backups before major changes

## Conclusion

This integration guide provides a comprehensive approach to adopting the refactored components. The new architecture offers significant improvements in:

- **Maintainability**: Clear separation of concerns and single responsibility
- **Testability**: Isolated components with comprehensive test coverage
- **Extensibility**: Strategy patterns allow easy addition of new functionality
- **Performance**: Better monitoring and optimization capabilities
- **Reliability**: Improved error handling and recovery mechanisms

Follow this guide step by step, and you'll have a much more robust and maintainable codebase that's ready for future enhancements and scaling.