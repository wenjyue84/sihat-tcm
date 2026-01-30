# Sihat TCM Team Training Guide

## Overview

This comprehensive training guide prepares the development and operations teams for the refactored Sihat TCM system. It covers new architecture patterns, deployment procedures, monitoring practices, and troubleshooting techniques.

## 🎯 Training Objectives

### For Development Team
- Understand new architecture patterns and design principles
- Learn to work with feature flags and deployment phases
- Master new testing frameworks and quality assurance processes
- Adopt new development workflows and best practices

### For Operations Team
- Master deployment procedures and rollback mechanisms
- Understand monitoring and alerting systems
- Learn incident response and troubleshooting procedures
- Develop expertise in performance optimization

### For Product Team
- Understand feature flag management and rollout strategies
- Learn to interpret system metrics and user feedback
- Master A/B testing and gradual feature rollout
- Develop skills in data-driven decision making

## 📚 Architecture Training

### 1. Design Patterns Deep Dive

#### Strategy Pattern Implementation
```typescript
// Example: AI Model Selection Strategy
interface ModelSelectionStrategy {
  selectModel(request: DiagnosisRequest): Promise<AIModel>;
}

class IntelligentSelectionStrategy implements ModelSelectionStrategy {
  async selectModel(request: DiagnosisRequest): Promise<AIModel> {
    const complexity = await this.analyzeComplexity(request);
    return complexity > 0.7 ? this.getAdvancedModel() : this.getStandardModel();
  }
}

// Usage in components
const modelRouter = new ModelRouter(new IntelligentSelectionStrategy());
```

**Key Learning Points:**
- Strategy pattern allows runtime algorithm switching
- Easy to add new selection strategies without code changes
- Improves testability by isolating strategy logic
- Enables A/B testing of different approaches

#### Factory Pattern for Component Creation
```typescript
// Example: Test Factory
class TestFactory {
  static createMedicalTest(type: 'emergency' | 'interaction' | 'safety'): MedicalTest {
    switch (type) {
      case 'emergency':
        return new EmergencyDetectionTest();
      case 'interaction':
        return new DrugInteractionTest();
      case 'safety':
        return new SafetyValidationTest();
      default:
        throw new Error(`Unknown test type: ${type}`);
    }
  }
}
```

**Key Learning Points:**
- Centralized object creation with consistent configuration
- Easy to add new test types
- Improved maintainability and testing
- Type safety with TypeScript

#### Observer Pattern for Event Handling
```typescript
// Example: Event System Usage
class DiagnosisComponent {
  constructor(private eventSystem: EventSystem) {
    // Subscribe to relevant events
    this.eventSystem.on('diagnosis:completed', this.handleDiagnosisCompleted.bind(this));
    this.eventSystem.on('safety:alert', this.handleSafetyAlert.bind(this));
  }

  private async startDiagnosis(request: DiagnosisRequest) {
    // Emit events for other components
    this.eventSystem.emit('diagnosis:started', { requestId: request.id });
    
    try {
      const result = await this.processDiagnosis(request);
      this.eventSystem.emit('diagnosis:completed', { requestId: request.id, result });
    } catch (error) {
      this.eventSystem.emit('diagnosis:failed', { requestId: request.id, error });
    }
  }
}
```

**Key Learning Points:**
- Decoupled communication between components
- Easy to add new event listeners
- Centralized event management
- Improved debugging and monitoring

### 2. Feature Flag Management

#### Understanding Feature Flags
```typescript
// Example: Feature Flag Usage in Components
class DiagnosisWizard extends React.Component {
  render() {
    const { featureFlagManager } = this.props;
    
    return (
      <div>
        {featureFlagManager.isEnabled('ai_model_router_v2') ? (
          <EnhancedAIRouter />
        ) : (
          <LegacyAIRouter />
        )}
        
        {featureFlagManager.isEnabled('medical_safety_validator') && (
          <SafetyValidationPanel />
        )}
      </div>
    );
  }
}
```

**Best Practices:**
- Always provide fallback for disabled features
- Use descriptive flag names
- Document flag dependencies
- Clean up unused flags regularly

#### Rollout Percentage Management
```typescript
// Example: Gradual Rollout Implementation
const userContext = {
  userId: user.id,
  sessionId: session.id,
  userAgent: navigator.userAgent
};

const isEnabled = featureFlagManager.isEnabled('new_feature', userContext);
// Returns true for X% of users based on rollout percentage
```

**Key Concepts:**
- Consistent user experience (same user always gets same result)
- Gradual rollout reduces risk
- Easy to increase/decrease rollout percentage
- A/B testing capabilities

### 3. Testing Framework Mastery

#### Property-Based Testing
```typescript
// Example: Property-Based Test for Medical Data
describe('Emergency Detection', () => {
  it('should detect all critical symptoms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.oneof(
          fc.constant('chest pain'),
          fc.constant('shortness of breath'),
          fc.constant('severe headache')
        ), { minLength: 1 }),
        async (symptoms) => {
          const result = await emergencyDetector.analyze(symptoms);
          expect(result.isEmergency).toBe(true);
        }
      )
    );
  });
});
```

**Benefits:**
- Automatic test case generation
- Edge case discovery
- Minimal counterexample generation (shrinking)
- Higher confidence in code correctness

#### Test Data Generators
```typescript
// Example: Medical Data Generator
const medicalDataGenerator = {
  generatePatient: () => ({
    id: fc.uuid(),
    age: fc.integer({ min: 18, max: 100 }),
    symptoms: fc.array(fc.oneof(
      fc.constant('headache'),
      fc.constant('fatigue'),
      fc.constant('nausea')
    ), { minLength: 1, maxLength: 5 }),
    medications: fc.array(fc.string(), { maxLength: 3 })
  })
};
```

**Usage Guidelines:**
- Use realistic data generators for medical scenarios
- Include edge cases in generators
- Validate generated data meets business rules
- Use shrinking to find minimal failing cases

## 🚀 Deployment Training

### 1. Phase-Based Deployment Process

#### Understanding Deployment Phases
```bash
# Phase 1: Medical Safety (Week 1)
npm run deploy:phase -- --phase=phase_1_medical_safety --rollout=25%

# Phase 2: AI Core (Week 2)  
npm run deploy:phase -- --phase=phase_2_ai_core --rollout=10%

# Monitor and validate each phase before proceeding
npm run monitor:phase -- --phase=current
```

**Phase Checklist:**
1. ✅ Prerequisites validated
2. ✅ Health checks passing
3. ✅ Feature flags configured
4. ✅ Monitoring enabled
5. ✅ Rollback plan ready

#### Rollback Procedures
```bash
# Emergency rollback (immediate)
npm run rollback:emergency

# Controlled rollback with reason
npm run rollback:controlled -- --phase=phase_2_ai_core --reason="Performance degradation"

# Gradual rollback (reduce percentage)
npm run rollback:gradual -- --percentage=50
```

**Rollback Triggers:**
- Error rate > threshold
- Response time > threshold  
- User satisfaction < threshold
- Critical functionality broken
- Security issues detected

### 2. Monitoring and Alerting

#### Key Metrics Dashboard
```typescript
// Example: Metrics Collection
const deploymentMetrics = {
  technical: {
    errorRate: 0.3,        // Target: <0.5%
    responseTime: 1200,    // Target: <1.5s
    throughput: 250,       // Target: >200 req/min
    memoryUsage: 65,       // Target: <70%
    cpuUsage: 45          // Target: <60%
  },
  business: {
    userSatisfaction: 94,  // Target: >92%
    featureAdoption: 85,   // Target: >80%
    supportTickets: 8,     // Target: <10/day
    userRetention: 96      // Target: >95%
  },
  medical: {
    emergencyAccuracy: 98.5,    // Target: >98%
    drugInteractionAccuracy: 99.2, // Target: >99%
    safetyValidation: 99.8,     // Target: >99%
    falsePositiveRate: 1.2      // Target: <2%
  }
};
```

#### Alert Configuration
```typescript
// Example: Alert Rules
const alertRules = [
  {
    metric: 'errorRate',
    threshold: 2.0,
    operator: 'gt',
    severity: 'critical',
    action: 'immediate_rollback'
  },
  {
    metric: 'responseTime', 
    threshold: 3000,
    operator: 'gt',
    severity: 'warning',
    action: 'investigate'
  },
  {
    metric: 'userSatisfaction',
    threshold: 85,
    operator: 'lt',
    severity: 'high',
    action: 'escalate'
  }
];
```

### 3. Health Check Implementation

#### Creating Health Checks
```typescript
// Example: Custom Health Check
export async function createMedicalSafetyHealthCheck(): Promise<HealthCheck> {
  return {
    name: 'medical_safety_health',
    execute: async () => {
      try {
        // Test emergency detection
        const emergencyTest = await emergencyDetector.test(['chest pain']);
        if (!emergencyTest.detected) {
          throw new Error('Emergency detection failed');
        }

        // Test drug interaction
        const interactionTest = await drugAnalyzer.test(['warfarin', 'aspirin']);
        if (!interactionTest.hasInteraction) {
          throw new Error('Drug interaction detection failed');
        }

        return { status: 'healthy', details: { emergencyTest, interactionTest } };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          error: error.message,
          timestamp: new Date()
        };
      }
    },
    timeout: 5000,
    retries: 3
  };
}
```

## 🔧 Development Workflow Training

### 1. New Development Process

#### Feature Development with Flags
```typescript
// 1. Create feature flag
const newFeatureFlag = {
  key: 'enhanced_voice_recognition',
  enabled: false,
  rolloutPercentage: 0,
  environment: 'development',
  description: 'Enhanced voice recognition with improved accuracy'
};

// 2. Implement feature with flag check
class VoiceRecognitionComponent {
  render() {
    if (this.featureFlagManager.isEnabled('enhanced_voice_recognition')) {
      return <EnhancedVoiceRecognition />;
    }
    return <StandardVoiceRecognition />;
  }
}

// 3. Write tests for both paths
describe('VoiceRecognitionComponent', () => {
  it('should use enhanced version when flag enabled', () => {
    // Test with flag enabled
  });
  
  it('should use standard version when flag disabled', () => {
    // Test with flag disabled
  });
});
```

#### Code Review Checklist
- [ ] Feature flag properly implemented
- [ ] Fallback behavior tested
- [ ] Error handling comprehensive
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Medical safety validated (if applicable)
- [ ] Documentation updated
- [ ] Tests cover all scenarios

### 2. Testing Best Practices

#### Test Categories and Coverage
```typescript
// 1. Unit Tests (70% of tests)
describe('EmergencyDetector', () => {
  it('should detect chest pain as emergency', () => {
    const result = emergencyDetector.analyze(['chest pain']);
    expect(result.isEmergency).toBe(true);
  });
});

// 2. Integration Tests (20% of tests)
describe('Diagnosis Flow Integration', () => {
  it('should complete full diagnosis workflow', async () => {
    const session = await diagnosisService.startSession(patientData);
    const result = await diagnosisService.completeWorkflow(session.id);
    expect(result.status).toBe('completed');
  });
});

// 3. End-to-End Tests (10% of tests)
describe('User Journey', () => {
  it('should allow user to complete diagnosis', async () => {
    await page.goto('/diagnosis');
    await page.fill('[data-testid="symptoms"]', 'headache, fatigue');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('[data-testid="results"]')).toBeVisible();
  });
});
```

#### Medical Safety Testing
```typescript
// Critical: All medical features must have safety tests
describe('Medical Safety Validation', () => {
  it('should never recommend dangerous drug combinations', async () => {
    const dangerousCombinations = [
      ['warfarin', 'aspirin'],
      ['simvastatin', 'clarithromycin']
    ];
    
    for (const combination of dangerousCombinations) {
      const result = await drugInteractionChecker.analyze(combination);
      expect(result.hasInteraction).toBe(true);
      expect(result.severity).toBe('high');
    }
  });
  
  it('should detect all emergency symptoms', async () => {
    const emergencySymptoms = [
      'severe chest pain',
      'difficulty breathing', 
      'sudden severe headache'
    ];
    
    for (const symptom of emergencySymptoms) {
      const result = await emergencyDetector.analyze([symptom]);
      expect(result.isEmergency).toBe(true);
    }
  });
});
```

## 📊 Monitoring and Troubleshooting

### 1. Performance Monitoring

#### Key Performance Indicators
```typescript
// Performance Monitoring Dashboard
const performanceMetrics = {
  // Response Time Metrics
  aiRouterLatency: {
    p50: 800,    // 50th percentile
    p95: 1500,   // 95th percentile  
    p99: 2200,   // 99th percentile
    target: '<2000ms p95'
  },
  
  // Throughput Metrics
  requestsPerMinute: {
    current: 245,
    target: '>200',
    peak: 380
  },
  
  // Error Metrics
  errorRates: {
    overall: 0.3,
    aiRouter: 0.1,
    medicalSafety: 0.0,
    target: '<0.5%'
  },
  
  // Resource Utilization
  resources: {
    cpu: 45,      // Target: <60%
    memory: 65,   // Target: <70%
    database: 40  // Target: <80%
  }
};
```

#### Performance Optimization Techniques
```typescript
// 1. Caching Strategy
class AIModelRouter {
  private cache = new Map<string, CachedResult>();
  
  async routeRequest(request: DiagnosisRequest): Promise<AIModel> {
    const cacheKey = this.generateCacheKey(request);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.model;
    }
    
    const model = await this.selectModel(request);
    this.cache.set(cacheKey, { model, timestamp: Date.now() });
    
    return model;
  }
}

// 2. Connection Pooling
const dbConfig = {
  max: 20,          // Maximum connections
  min: 5,           // Minimum connections
  idle: 10000,      // Idle timeout
  acquire: 60000,   // Acquire timeout
  evict: 1000       // Eviction interval
};

// 3. Request Batching
class NotificationBatcher {
  private batch: Notification[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  
  addNotification(notification: Notification) {
    this.batch.push(notification);
    
    if (this.batch.length >= 10) {
      this.processBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.processBatch(), 5000);
    }
  }
}
```

### 2. Troubleshooting Guide

#### Common Issues and Solutions

**Issue: High AI Router Latency**
```bash
# 1. Check model performance
npm run monitor:ai-models

# 2. Analyze request complexity distribution
npm run analyze:request-complexity

# 3. Review caching effectiveness
npm run cache:stats

# Solutions:
# - Adjust model selection thresholds
# - Increase cache size
# - Optimize complexity analysis
# - Scale AI infrastructure
```

**Issue: Medical Safety Validation Failures**
```bash
# 1. Check safety validator health
curl /api/health/medical-safety

# 2. Review recent safety alerts
npm run logs:safety-alerts -- --since=1h

# 3. Validate safety rules
npm run test:safety-validation

# Solutions:
# - Update safety rule database
# - Restart safety validation service
# - Escalate to medical team
# - Implement emergency fallback
```

**Issue: Feature Flag Inconsistencies**
```bash
# 1. Check flag configuration
npm run flags:status

# 2. Validate flag synchronization
npm run flags:sync-check

# 3. Review flag history
npm run flags:history -- --flag=ai_model_router_v2

# Solutions:
# - Resync flag configuration
# - Clear flag cache
# - Restart flag manager
# - Rollback to previous configuration
```

#### Incident Response Procedures

**Level 1: Warning (Response Time: 15 minutes)**
1. Acknowledge alert
2. Assess impact scope
3. Check recent deployments
4. Review metrics trends
5. Implement quick fixes if available
6. Escalate if unresolved in 30 minutes

**Level 2: Critical (Response Time: 5 minutes)**
1. Immediate acknowledgment
2. Activate incident response team
3. Assess rollback necessity
4. Implement emergency measures
5. Communicate with stakeholders
6. Begin root cause analysis

**Level 3: Emergency (Response Time: 2 minutes)**
1. Immediate rollback activation
2. Executive notification
3. Full incident response activation
4. External communication preparation
5. Emergency escalation procedures
6. Post-incident review planning

## 🎓 Certification and Assessment

### Development Team Certification

#### Level 1: Basic Competency
- [ ] Understand new architecture patterns
- [ ] Can implement feature flags correctly
- [ ] Writes comprehensive tests
- [ ] Follows code review checklist
- [ ] Understands deployment process

#### Level 2: Advanced Proficiency  
- [ ] Can design new system components
- [ ] Implements complex testing scenarios
- [ ] Optimizes performance effectively
- [ ] Mentors junior developers
- [ ] Contributes to architecture decisions

#### Level 3: Expert Mastery
- [ ] Leads architectural initiatives
- [ ] Designs testing frameworks
- [ ] Optimizes system-wide performance
- [ ] Trains other team members
- [ ] Makes critical technical decisions

### Operations Team Certification

#### Level 1: Basic Operations
- [ ] Can execute standard deployments
- [ ] Monitors system health effectively
- [ ] Responds to basic incidents
- [ ] Follows rollback procedures
- [ ] Maintains system documentation

#### Level 2: Advanced Operations
- [ ] Manages complex deployments
- [ ] Optimizes monitoring systems
- [ ] Leads incident response
- [ ] Implements automation
- [ ] Trains junior operators

#### Level 3: Operations Leadership
- [ ] Designs deployment strategies
- [ ] Architects monitoring solutions
- [ ] Manages crisis situations
- [ ] Develops operational procedures
- [ ] Mentors operations team

## 📅 Training Schedule

### Week 1: Architecture Fundamentals
- **Day 1-2**: Design patterns deep dive
- **Day 3-4**: Feature flag management
- **Day 5**: Testing framework introduction

### Week 2: Deployment Mastery
- **Day 1-2**: Phase-based deployment process
- **Day 3-4**: Monitoring and alerting
- **Day 5**: Rollback procedures and incident response

### Week 3: Advanced Topics
- **Day 1-2**: Performance optimization
- **Day 3-4**: Troubleshooting and debugging
- **Day 5**: Medical safety and compliance

### Week 4: Hands-On Practice
- **Day 1-2**: Simulated deployments
- **Day 3-4**: Incident response drills
- **Day 5**: Certification assessments

## 📞 Training Support

### Resources and Contacts
- **Training Lead**: [training-lead@sihat-tcm.com]
- **Architecture Team**: [architecture@sihat-tcm.com]
- **Operations Team**: [operations@sihat-tcm.com]
- **Documentation**: [Internal Wiki](https://wiki.sihat-tcm.com)
- **Training Materials**: [Training Portal](https://training.sihat-tcm.com)

### Ongoing Support
- Weekly architecture office hours
- Monthly deployment reviews
- Quarterly training updates
- Annual certification renewals
- 24/7 emergency support hotline

---

*This training guide ensures all team members are prepared for the successful deployment and operation of the refactored Sihat TCM system.*