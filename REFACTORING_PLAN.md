# Sihat TCM Refactoring Implementation Plan

## Phase 2A: Foundation Refactoring (Weeks 1-2)

### Task 1: Extract and Consolidate Constants
**Priority**: High | **Risk**: Low | **Effort**: Low

**Current Issues:**
- Magic numbers scattered throughout codebase (timeouts, limits, thresholds)
- Hardcoded strings for notification types, error messages
- Configuration values duplicated across web and mobile

**Refactoring Actions:**
1. Create centralized constants file for shared values
2. Extract AI model configuration constants
3. Consolidate notification type definitions
4. Create theme constants for consistent styling

**Files to Modify:**
- `sihat-tcm-web/src/lib/constants/index.ts` (enhance existing)
- `sihat-tcm-mobile/constants/index.ts` (create new)
- `sihat-tcm-web/src/lib/aiModelRouter.ts` (extract constants)
- `sihat-tcm-mobile/lib/MobileNotificationManager.ts` (extract constants)

**Success Criteria:**
- Zero magic numbers in business logic
- All hardcoded strings moved to constants
- Shared constants between web and mobile
- 100% test coverage for constants

### Task 2: Standardize Error Handling Patterns
**Priority**: High | **Risk**: Medium | **Effort**: Medium

**Current Issues:**
- Inconsistent error handling across components
- Mixed error types and formats
- Poor error boundary coverage in mobile app

**Refactoring Actions:**
1. Extend existing AppError system to mobile
2. Create standardized error boundary components
3. Implement consistent error logging
4. Add error recovery mechanisms

**Files to Modify:**
- `sihat-tcm-mobile/lib/errors/` (create new directory)
- `sihat-tcm-mobile/components/common/ErrorBoundary.tsx` (enhance existing)
- All components with error handling

**Success Criteria:**
- Unified error handling across platforms
- All async operations wrapped in error boundaries
- Consistent error user experience
- Error tracking and reporting implemented

### Task 3: Improve Type Safety
**Priority**: High | **Risk**: Low | **Effort**: Medium

**Current Issues:**
- `any` types in several critical functions
- Missing interfaces for complex objects
- Inconsistent type definitions between platforms

**Refactoring Actions:**
1. Replace all `any` types with proper interfaces
2. Create shared type definitions
3. Add strict null checks
4. Implement discriminated unions for complex types

**Files to Modify:**
- `sihat-tcm-web/src/types/` (enhance existing)
- `sihat-tcm-mobile/types/` (enhance existing)
- All files with `any` types

**Success Criteria:**
- Zero `any` types in production code
- Shared type definitions between platforms
- TypeScript strict mode enabled
- No type-related runtime errors

## Phase 2B: Component Architecture (Weeks 3-4)

### Task 4: Refactor AI Model Router
**Priority**: High | **Risk**: High | **Effort**: High

**Current Issues:**
- Single large class handling multiple responsibilities
- Tight coupling to specific AI model implementations
- Complex conditional logic for model selection
- Performance tracking mixed with routing logic

**Refactoring Actions:**
1. Extract interfaces for AI models and routing
2. Separate performance monitoring into dedicated service
3. Create strategy pattern for model selection
4. Implement proper dependency injection

**New Architecture:**
```typescript
// Core interfaces
interface AIModel {
  id: string;
  capabilities: ModelCapabilities;
  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): Promise<ReadableStream>;
}

interface ModelRouter {
  selectModel(criteria: SelectionCriteria): AIModel;
  routeRequest(request: AIRequest): Promise<AIResponse>;
}

interface PerformanceMonitor {
  recordMetrics(modelId: string, metrics: PerformanceMetrics): void;
  getAnalytics(): PerformanceAnalytics;
}

// Implementation classes
class GeminiModel implements AIModel { ... }
class IntelligentModelRouter implements ModelRouter { ... }
class ModelPerformanceMonitor implements PerformanceMonitor { ... }
```

**Files to Create:**
- `sihat-tcm-web/src/lib/ai/interfaces/` (new directory)
- `sihat-tcm-web/src/lib/ai/models/` (new directory)
- `sihat-tcm-web/src/lib/ai/routing/` (new directory)
- `sihat-tcm-web/src/lib/ai/monitoring/` (new directory)

**Files to Refactor:**
- `sihat-tcm-web/src/lib/aiModelRouter.ts` (break into multiple files)

**Success Criteria:**
- Single responsibility for each class
- Testable components with dependency injection
- Easy to add new AI models
- Performance monitoring separated from routing

### Task 5: Redesign Notification System
**Priority**: High | **Risk**: High | **Effort**: High

**Current Issues:**
- Large monolithic notification manager
- Platform-specific code mixed with business logic
- Complex state management
- Difficult to test due to tight coupling

**Refactoring Actions:**
1. Create platform-agnostic notification interfaces
2. Separate notification scheduling from delivery
3. Extract preference management into dedicated service
4. Implement proper state management patterns

**New Architecture:**
```typescript
// Core interfaces
interface NotificationService {
  schedule(notification: NotificationRequest): Promise<string>;
  cancel(id: string): Promise<boolean>;
  getScheduled(): Promise<ScheduledNotification[]>;
}

interface NotificationDelivery {
  send(notification: Notification): Promise<DeliveryResult>;
  registerDevice(token: string): Promise<boolean>;
}

interface PreferenceManager {
  getPreferences(): NotificationPreferences;
  updatePreferences(updates: Partial<NotificationPreferences>): Promise<boolean>;
  validatePreferences(prefs: NotificationPreferences): ValidationResult;
}

// Platform implementations
class MobileNotificationService implements NotificationService { ... }
class WebNotificationService implements NotificationService { ... }
class CrossPlatformSyncService { ... }
```

**Files to Create:**
- `shared/lib/notifications/` (new shared directory)
- `sihat-tcm-web/src/lib/notifications/` (new directory)
- `sihat-tcm-mobile/lib/notifications/` (new directory)

**Files to Refactor:**
- `sihat-tcm-mobile/lib/MobileNotificationManager.ts` (break into multiple files)

**Success Criteria:**
- Platform-agnostic business logic
- Easy to test notification components
- Consistent behavior across platforms
- Proper separation of concerns

## Phase 2C: Performance and Testing (Weeks 5-6)

### Task 6: Implement Comprehensive Testing
**Priority**: High | **Risk**: Medium | **Effort**: High

**Current Issues:**
- Limited test coverage for critical paths
- Missing integration tests
- No performance regression tests
- Property tests not covering all business rules

**Refactoring Actions:**
1. Add property tests for all business logic
2. Create integration test suite
3. Implement performance benchmarks
4. Add visual regression tests for UI components

**Testing Strategy:**
```typescript
// Property tests for business logic
describe('AI Model Router Properties', () => {
  it('should always return a valid model for any valid request', () => {
    fc.assert(fc.property(
      arbitraries.aiRequest(),
      (request) => {
        const model = router.selectModel(request);
        expect(model).toBeDefined();
        expect(model.capabilities).toMatchRequest(request);
      }
    ));
  });
});

// Integration tests for cross-platform sync
describe('Cross-Platform Sync Integration', () => {
  it('should sync notifications between web and mobile', async () => {
    // Test implementation
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  it('should route AI requests within 100ms', async () => {
    // Benchmark implementation
  });
});
```

**Files to Create:**
- `sihat-tcm-web/src/lib/testing/integration/` (new directory)
- `sihat-tcm-web/src/lib/testing/performance/` (new directory)
- `sihat-tcm-mobile/__tests__/` (enhance existing)

**Success Criteria:**
- 90%+ test coverage for business logic
- All critical paths covered by integration tests
- Performance benchmarks for key operations
- Automated visual regression testing

### Task 7: Optimize Bundle Size and Performance
**Priority**: Medium | **Risk**: Medium | **Effort**: Medium

**Current Issues:**
- Large bundle sizes due to monolithic components
- Inefficient re-renders in complex components
- Memory leaks in long-running services
- Suboptimal code splitting

**Refactoring Actions:**
1. Implement proper code splitting
2. Add React.memo and useMemo optimizations
3. Fix memory leaks in notification listeners
4. Optimize bundle with tree shaking

**Performance Targets:**
- Reduce web bundle size by 30%
- Improve mobile app startup time by 25%
- Eliminate memory leaks
- Achieve 90+ Lighthouse performance score

## Phase 2D: Documentation and Deployment (Week 7)

### Task 8: Update Documentation and Deployment
**Priority**: Medium | **Risk**: Low | **Effort**: Medium

**Refactoring Actions:**
1. Update architecture documentation
2. Create migration guides
3. Update API documentation
4. Enhance developer onboarding docs

**Deliverables:**
- Updated system architecture diagrams
- Refactoring migration guide
- Enhanced API documentation
- Developer setup improvements

## Success Metrics

### Code Quality Metrics
- **Cyclomatic Complexity**: Reduce average from 15 to 8
- **Code Duplication**: Reduce from 12% to 5%
- **Test Coverage**: Increase from 65% to 90%
- **TypeScript Strict Mode**: 100% compliance

### Performance Metrics
- **Bundle Size**: Reduce by 30%
- **Startup Time**: Improve by 25%
- **Memory Usage**: Reduce by 20%
- **API Response Time**: Maintain <200ms

### Maintainability Metrics
- **Time to Add Feature**: Reduce by 40%
- **Bug Fix Time**: Reduce by 35%
- **Onboarding Time**: Reduce by 50%
- **Code Review Time**: Reduce by 30%

## Risk Mitigation

### High-Risk Refactorings
1. **AI Model Router**: Implement behind feature flag, gradual rollout
2. **Notification System**: Maintain backward compatibility during transition
3. **Database Changes**: Use migration scripts with rollback plans

### Rollback Plans
- Feature flags for major changes
- Database migration rollback scripts
- Component version compatibility layers
- Automated deployment rollback triggers

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 2A | Weeks 1-2 | Constants, Error Handling, Type Safety |
| 2B | Weeks 3-4 | AI Router, Notification System |
| 2C | Weeks 5-6 | Testing, Performance |
| 2D | Week 7 | Documentation, Deployment |

**Total Duration**: 7 weeks
**Team Size**: 2-3 developers
**Risk Level**: Medium-High (due to architectural changes)
**Business Impact**: High (improved maintainability and performance)