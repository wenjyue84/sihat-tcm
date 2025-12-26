# Sihat TCM Enhancement Design Document

## Overview

This design document outlines the technical architecture and implementation strategy for enhancing the Sihat TCM platform. The enhancements build upon the existing Next.js web application and Expo mobile application, leveraging the current Google Gemini AI integration, Supabase backend, and multi-step diagnosis wizard architecture.

The design focuses on improving user experience, expanding AI capabilities, adding comprehensive health tracking, enhancing practitioner tools, and ensuring seamless cross-platform integration while maintaining the platform's core TCM diagnostic methodology.

## Architecture

### Current System Architecture
The existing system follows a modern full-stack architecture:
- **Frontend**: Next.js 16 with App Router, React 19.2.1, Tailwind CSS v4
- **Mobile**: Expo/React Native with TypeScript, React 19.1.0
- **Backend**: Supabase (PostgreSQL) with Row Level Security and Supabase Auth
- **AI**: Google Gemini models (2.0-flash, 2.5-pro, 3-pro-preview) via Vercel AI SDK
- **State Management**: React Context API with specialized contexts
- **UI Components**: Radix UI, Framer Motion for animations
- **Testing**: Vitest, React Testing Library, Jest-DOM
- **Development**: TypeScript, ESLint, PostCSS

### Enhanced Architecture Components

#### 1. Enhanced Frontend Layer
- **Progressive Web App (PWA)** capabilities for offline functionality
- **Advanced State Management** with Redux Toolkit for complex health tracking
- **Real-time Synchronization** using Supabase Realtime subscriptions
- **Enhanced UI Components** with accessibility compliance (WCAG 2.1 AA)
- **Multi-modal Input Handling** for voice commands and gesture controls

#### 2. Intelligent AI Orchestration Layer
- **AI Model Router** for dynamic model selection based on complexity
- **Confidence Scoring System** for diagnostic reliability assessment
- **Pattern Recognition Engine** for historical data analysis
- **Personalization Engine** using collaborative filtering and content-based recommendations
- **Safety Validation Layer** for medical recommendation screening

#### 3. Enhanced Data Layer
- **Time-series Health Data** storage for longitudinal tracking
- **Graph Database Integration** for relationship mapping between symptoms, treatments, and outcomes
- **Data Lake** for unstructured medical documents and images
- **Analytics Warehouse** for population health insights
- **Audit Trail System** for compliance and debugging

#### 4. Integration Layer
- **Healthcare API Gateway** for external system integration
- **IoT Device Manager** for wearable and sensor data ingestion
- **Notification Service** with multi-channel delivery (push, email, SMS)
- **Export/Import Service** for medical record interoperability
- **Third-party Integrations** (Apple Health, Google Fit, FHIR systems)

#### 5. IoT and Wearable Integration Layer
- **Device Connection Manager** for Bluetooth and WiFi health devices
- **Health Data Aggregator** for multi-source data correlation
- **Real-time Monitoring** for continuous health parameter tracking
- **Anomaly Detection Engine** for health pattern irregularities
- **Device Management Dashboard** for user device configuration

#### 6. Gamification and Social Engagement Layer
- **Achievement System** for treatment adherence and health goals
- **Social Community Manager** for constitution-based support groups
- **Progress Tracking** with streaks, badges, and milestone rewards
- **Privacy-Preserving Social Features** for anonymous peer support
- **Qi Exercise Tracking** with virtual rewards and progress visualization

## Components and Interfaces

### Core Enhancement Components

#### 1. Enhanced Diagnosis Wizard (`EnhancedDiagnosisWizard`)
```typescript
interface EnhancedDiagnosisWizard {
  // Progress tracking with granular steps
  progressTracker: DiagnosisProgressTracker
  // Auto-save and resume functionality
  sessionManager: DiagnosisSessionManager
  // Real-time image quality assessment
  imageQualityValidator: ImageQualityValidator
  // Voice command integration
  voiceCommandHandler: VoiceCommandHandler
  // Accessibility features
  accessibilityManager: AccessibilityManager
}
```

#### 2. AI Diagnostic Engine (`AIDiagnosticEngine`)
```typescript
interface AIDiagnosticEngine {
  // Multi-model orchestration
  modelRouter: AIModelRouter
  // Historical pattern analysis
  patternAnalyzer: HealthPatternAnalyzer
  // Personalization engine
  personalizationEngine: PersonalizationEngine
  // Safety validation
  safetyValidator: MedicalSafetyValidator
  // Confidence scoring
  confidenceScorer: DiagnosticConfidenceScorer
}
```

#### 3. Health Tracking System (`HealthTrackingSystem`)
```typescript
interface HealthTrackingSystem {
  // Time-series data management
  timeSeriesManager: HealthTimeSeriesManager
  // Trend analysis
  trendAnalyzer: HealthTrendAnalyzer
  // Goal setting and tracking
  goalManager: HealthGoalManager
  // Progress visualization
  visualizationEngine: HealthVisualizationEngine
  // Predictive analytics
  predictiveAnalyzer: HealthPredictiveAnalyzer
}
```

#### 4. Practitioner Dashboard (`PractitionerDashboard`)
```typescript
interface PractitionerDashboard {
  // Patient management
  patientManager: PatientManager
  // AI oversight tools
  aiOversightTools: AIOversightTools
  // Collaboration features
  collaborationManager: CollaborationManager
  // Analytics dashboard
  analyticsManager: PractitionerAnalyticsManager
  // Training feedback system
  trainingFeedbackSystem: AITrainingFeedbackSystem
}
```

#### 5. Cross-Platform Sync Manager (`CrossPlatformSyncManager`)
```typescript
interface CrossPlatformSyncManager {
  // Real-time data synchronization
  realtimeSync: RealtimeSyncManager
  // Offline data management
  offlineManager: OfflineDataManager
  // Conflict resolution
  conflictResolver: DataConflictResolver
  // Platform-specific optimizations
  platformOptimizer: PlatformOptimizer
}
```

### Interface Specifications

#### Enhanced API Endpoints
```typescript
// Enhanced image analysis with quality feedback
POST /api/v2/analyze-image
interface ImageAnalysisRequest {
  image: string
  type: 'tongue' | 'face' | 'body'
  qualityCheck: boolean
  historicalContext?: HistoricalImageData[]
}

// Personalized chat with learning capabilities
POST /api/v2/chat/personalized
interface PersonalizedChatRequest {
  messages: ChatMessage[]
  patientProfile: PatientProfile
  learningContext: LearningContext
  preferences: UserPreferences
}

// Health tracking data ingestion
POST /api/v2/health-data/ingest
interface HealthDataIngestionRequest {
  source: 'manual' | 'wearable' | 'iot'
  dataType: string
  measurements: HealthMeasurement[]
  timestamp: string
}
```

## Data Models

### Enhanced Patient Profile
```typescript
interface EnhancedPatientProfile {
  // Basic information (existing)
  id: string
  basicInfo: BasicPatientInfo
  
  // Enhanced tracking data
  healthHistory: HealthHistoryRecord[]
  treatmentOutcomes: TreatmentOutcome[]
  preferences: UserPreferences
  learningProfile: LearningProfile
  
  // Personalization data
  culturalContext: CulturalContext
  dietaryPreferences: DietaryPreferences
  accessibilityNeeds: AccessibilityNeeds
  
  // Integration data
  connectedDevices: ConnectedDevice[]
  externalHealthRecords: ExternalHealthRecord[]
}
```

### Health Time Series Data
```typescript
interface HealthTimeSeriesData {
  patientId: string
  dataType: string
  timestamp: Date
  value: number | string | object
  source: 'manual' | 'wearable' | 'iot' | 'ai_derived'
  confidence: number
  metadata: Record<string, any>
}
```

### AI Model Performance Tracking
```typescript
interface AIModelPerformance {
  modelId: string
  timestamp: Date
  requestType: string
  responseTime: number
  confidenceScore: number
  userFeedback?: number
  practitionerValidation?: boolean
  outcomeTracking?: TreatmentOutcome
}
```

### Treatment Outcome Tracking
```typescript
interface TreatmentOutcome {
  treatmentId: string
  patientId: string
  startDate: Date
  endDate?: Date
  treatmentType: 'dietary' | 'herbal' | 'acupressure' | 'lifestyle'
  recommendations: TreatmentRecommendation[]
  adherence: AdherenceMetrics
  outcomes: OutcomeMetrics
  patientFeedback: PatientFeedback
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Diagnostic Data Consistency
*For any* patient consultation session, all diagnostic data collected across different steps (basic info, inquiry, observation, palpation) should maintain referential integrity and be retrievable as a complete, consistent dataset.
**Validates: Requirements 1.3**

### Property 2: Cross-Platform Data Synchronization
*For any* user action performed on one platform (web or mobile), the same data should be immediately available and consistent when accessed from any other platform within the synchronization timeout period.
**Validates: Requirements 6.1, 6.2**

### Property 3: AI Model Fallback Reliability
*For any* AI analysis request, if the primary model fails or returns low-confidence results, the system should automatically fallback to alternative models and always return a valid response or clear error message.
**Validates: Requirements 2.1, 1.4**

### Property 4: Health Data Temporal Consistency
*For any* health tracking data point, the timestamp ordering should be preserved and no future-dated entries should be accepted relative to the server time.
**Validates: Requirements 3.1, 3.2**

### Property 5: Treatment Recommendation Safety
*For any* generated treatment recommendation, the system should validate against known contraindications, allergies, and drug interactions before presenting to the user.
**Validates: Requirements 2.2, 2.5**

### Property 6: Progress Tracking Monotonicity
*For any* diagnostic session, the progress percentage should never decrease unless explicitly reset, and should reach 100% only when all required steps are completed.
**Validates: Requirements 1.1, 1.3**

### Property 7: Accessibility Compliance
*For any* user interface element, it should be navigable using keyboard-only input and provide appropriate ARIA labels for screen readers.
**Validates: Requirements 10.1, 10.4**

### Property 8: Multilingual Content Consistency
*For any* medical content translated across supported languages (English, Chinese, Malay), the core medical meaning and safety information should be preserved.
**Validates: Requirements 10.2**

### Property 9: Practitioner Override Authority
*For any* AI-generated diagnosis or recommendation, a qualified practitioner should be able to modify, annotate, or override the AI suggestions while maintaining audit trail.
**Validates: Requirements 4.3**

### Property 10: Data Privacy and Audit Trail
*For any* access to patient health data, the system should log the access with user identification, timestamp, and purpose, ensuring HIPAA-compliant audit trails.
**Validates: Requirements 5.4**

### Property 11: IoT Data Integration Consistency
*For any* health data received from connected IoT devices, the system should validate data integrity, timestamp accuracy, and device authentication before storage.
**Validates: Requirements 11.1, 11.2**

### Property 12: Gamification Progress Integrity
*For any* user achievement or progress tracking, the system should ensure points, badges, and streaks are calculated correctly and cannot be artificially manipulated.
**Validates: Requirements 12.1, 12.3**

### Property 13: Social Privacy Protection
*For any* community interaction or data sharing, the system should enforce privacy controls and ensure no personally identifiable information is exposed without explicit consent.
**Validates: Requirements 12.4, 12.5**

## Error Handling

### Graceful Degradation Strategy
- **AI Model Failures**: Automatic fallback to simpler models with user notification
- **Network Connectivity**: Offline mode with local data caching and sync on reconnection
- **Image Quality Issues**: Real-time feedback with guided retake instructions
- **Voice Recognition Failures**: Fallback to text input with accessibility alternatives
- **External Integration Failures**: Continue with core functionality while logging integration issues

### Error Recovery Mechanisms
- **Session Recovery**: Automatic save and restore of incomplete consultations
- **Data Validation**: Client-side and server-side validation with user-friendly error messages
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker Pattern**: Prevent cascade failures in external service calls
- **Health Checks**: Continuous monitoring of system components with automatic alerts

## Testing Strategy

### Unit Testing Approach
- **Component Testing**: React Testing Library for UI components
- **API Testing**: Jest for API endpoint validation
- **Utility Function Testing**: Pure function testing for medical calculations
- **Integration Testing**: Test database operations and external API calls
- **Accessibility Testing**: Automated testing with jest-axe and manual testing

### Property-Based Testing Framework
The system will use **fast-check** (JavaScript/TypeScript property-based testing library) for comprehensive property validation. Each property-based test will run a minimum of 100 iterations to ensure statistical confidence.

**Property-Based Test Configuration:**
- **Test Runner**: Jest with fast-check integration
- **Iterations**: Minimum 100 per property test
- **Shrinking**: Automatic counterexample minimization
- **Seed Management**: Reproducible test runs with seed logging
- **Coverage**: Integration with Istanbul for coverage reporting

**Property Test Implementation Strategy:**
- Generate random but valid patient data for consistency tests
- Create synthetic health time-series data for temporal validation
- Simulate network failures for resilience testing
- Generate multilingual content for translation consistency
- Create accessibility test scenarios with various assistive technologies

### Integration Testing
- **End-to-End Testing**: Playwright for complete user journey testing
- **API Integration**: Test external healthcare system integrations
- **Database Integration**: Test data consistency across operations
- **Real-time Features**: Test WebSocket connections and real-time sync
- **Mobile Testing**: Detox for React Native end-to-end testing

### Performance Testing
- **Load Testing**: Artillery.js for API endpoint load testing
- **Image Processing**: Performance testing for AI image analysis
- **Database Performance**: Query optimization and indexing validation
- **Mobile Performance**: React Native performance monitoring
- **Accessibility Performance**: Testing with assistive technology response times