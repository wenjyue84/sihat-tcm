# Inline Code Documentation Guide

**Version**: 4.0  
**Last Updated**: December 2024  
**Target Audience**: Developers, Code Reviewers

## Table of Contents

1. [Documentation Standards](#documentation-standards)
2. [TypeScript Documentation](#typescript-documentation)
3. [React Component Documentation](#react-component-documentation)
4. [API Route Documentation](#api-route-documentation)
5. [Utility Function Documentation](#utility-function-documentation)
6. [Class Documentation](#class-documentation)
7. [Interface and Type Documentation](#interface-and-type-documentation)
8. [JSDoc Standards](#jsdoc-standards)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)

## Documentation Standards

### General Principles

1. **Clarity**: Documentation should be clear and easy to understand
2. **Completeness**: All public APIs should be documented
3. **Accuracy**: Documentation must be kept in sync with code
4. **Examples**: Include practical usage examples
5. **Context**: Explain why, not just what

### Documentation Levels

#### 1. File-Level Documentation

Every file should start with a comprehensive header comment:

````typescript
/**
 * Enhanced AI Diagnostic Engine - Integration layer for all AI diagnostic components
 *
 * This module provides a unified interface that combines the AIModelRouter,
 * PersonalizationEngine, and MedicalSafetyValidator for comprehensive AI diagnostics.
 *
 * Key Features:
 * - Intelligent AI model selection based on request complexity
 * - Automatic fallback handling for improved reliability
 * - Personalized recommendations based on user history and preferences
 * - Comprehensive medical safety validation
 * - Performance monitoring and optimization
 * - Learning from user feedback for continuous improvement
 *
 * Usage Example:
 * ```typescript
 * const engine = new EnhancedAIDiagnosticEngine('MyApp');
 * const result = await engine.processEnhancedDiagnosis({
 *   userId: 'user123',
 *   doctorLevel: 'expert',
 *   messages: chatHistory,
 *   images: tongueImages,
 *   requiresPersonalization: true,
 *   requiresSafetyValidation: true
 * });
 * ```
 *
 * @author Sihat TCM Development Team
 * @version 4.0.0
 * @since 2024-12-26
 */
````

#### 2. Function/Method Documentation

All public functions and methods should be documented:

````typescript
/**
 * Process a complete diagnostic request with all enhancements
 *
 * This is the main entry point for enhanced diagnosis processing.
 * It orchestrates the entire pipeline from request analysis to
 * final result generation.
 *
 * Processing Pipeline:
 * 1. Analyze request complexity and requirements
 * 2. Select optimal AI model based on criteria
 * 3. Generate base diagnosis using selected model
 * 4. Apply personalization if requested
 * 5. Validate safety if requested
 * 6. Calculate overall confidence score
 * 7. Return comprehensive results with metadata
 *
 * @param {EnhancedDiagnosticRequest} request - The diagnostic request
 * @returns {Promise<EnhancedDiagnosticResponse>} Complete diagnostic response
 * @throws {Error} If any step in the processing pipeline fails
 *
 * @example
 * ```typescript
 * const result = await engine.processEnhancedDiagnosis({
 *   userId: 'user123',
 *   doctorLevel: 'expert',
 *   messages: chatHistory,
 *   requiresPersonalization: true,
 *   requiresSafetyValidation: true
 * });
 *
 * if (result.safetyValidation?.is_safe) {
 *   // Safe to proceed with recommendations
 *   console.log('Diagnosis:', result.diagnosis);
 * } else {
 *   // Handle safety concerns
 *   console.log('Safety concerns:', result.safetyValidation?.concerns);
 * }
 * ```
 */
async processEnhancedDiagnosis(request: EnhancedDiagnosticRequest): Promise<EnhancedDiagnosticResponse>
````

#### 3. Interface/Type Documentation

All interfaces and types should be documented:

```typescript
/**
 * Request interface for enhanced diagnostic processing
 *
 * @interface EnhancedDiagnosticRequest
 * @property {string} userId - Unique identifier for the user requesting diagnosis
 * @property {DoctorLevel} [doctorLevel] - AI practitioner level (physician|expert|master)
 * @property {'en'|'zh'|'ms'} [language] - Preferred language for responses
 * @property {any[]} [messages] - Chat history for inquiry-based diagnosis
 * @property {any[]} [images] - Medical images (tongue, face, body) for analysis
 * @property {any[]} [files] - Additional medical documents or files
 * @property {any} [basicInfo] - Patient basic information (age, gender, etc.)
 * @property {boolean} [requiresPersonalization] - Whether to apply personalization
 * @property {boolean} [requiresSafetyValidation] - Whether to perform safety checks
 * @property {string} [preferredModel] - Specific AI model to use if available
 * @property {ValidationContext['medical_history']} [medicalHistory] - Medical history for safety validation
 */
export interface EnhancedDiagnosticRequest {
  // Interface definition...
}
```

## TypeScript Documentation

### Function Documentation Template

````typescript
/**
 * Brief description of what the function does
 *
 * Detailed explanation of the function's purpose, behavior, and any
 * important implementation details. Include information about:
 * - Algorithm or approach used
 * - Performance characteristics
 * - Side effects
 * - Dependencies
 *
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @returns {ReturnType} Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 *
 * @example
 * ```typescript
 * // Example usage
 * const result = functionName(param1, param2);
 * ```
 *
 * @see {@link RelatedFunction} - Link to related functionality
 * @since 4.0.0
 */
function functionName(paramName: Type, optionalParam?: Type): ReturnType {
  // Implementation
}
````

### Class Documentation Template

````typescript
/**
 * Brief description of the class
 *
 * Detailed explanation of the class purpose, responsibilities, and usage.
 * Include information about:
 * - Main responsibilities
 * - Key methods and properties
 * - Usage patterns
 * - Performance considerations
 * - Thread safety (if applicable)
 *
 * @class ClassName
 * @example
 * ```typescript
 * const instance = new ClassName(config);
 * const result = await instance.mainMethod(data);
 * ```
 */
export class ClassName {
  /**
   * Initialize the class instance
   *
   * @param {ConfigType} config - Configuration object
   * @constructor
   */
  constructor(config: ConfigType) {
    // Constructor implementation
  }

  /**
   * Main method description
   *
   * @param {DataType} data - Input data
   * @returns {Promise<ResultType>} Processing result
   */
  async mainMethod(data: DataType): Promise<ResultType> {
    // Method implementation
  }
}
````

### Enum Documentation

```typescript
/**
 * Enumeration of diagnostic complexity levels
 *
 * These levels are used by the AI Model Router to select appropriate
 * models based on request complexity analysis.
 *
 * @enum {string}
 */
export enum DiagnosticComplexity {
  /** Basic text processing, simple queries */
  SIMPLE = "simple",

  /** Some complexity factors present, moderate processing */
  MODERATE = "moderate",

  /** Multiple complexity factors, advanced processing needed */
  COMPLEX = "complex",

  /** Highly complex requests requiring most capable models */
  ADVANCED = "advanced",
}
```

## React Component Documentation

### Component Documentation Template

````typescript
/**
 * Enhanced Diagnosis Wizard Component
 *
 * A multi-step wizard that guides users through the TCM diagnosis process.
 * Supports voice commands, accessibility features, and real-time validation.
 *
 * Features:
 * - Multi-step navigation with progress tracking
 * - Real-time form validation
 * - Voice command support
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Auto-save functionality
 * - Responsive design for all screen sizes
 *
 * @component
 * @example
 * ```tsx
 * <DiagnosisWizard
 *   userId="user123"
 *   onComplete={(result) => handleComplete(result)}
 *   onError={(error) => handleError(error)}
 *   enableVoiceCommands={true}
 *   autoSave={true}
 * />
 * ```
 */
interface DiagnosisWizardProps {
  /** Unique identifier for the user */
  userId: string;

  /** Callback fired when diagnosis is completed successfully */
  onComplete: (result: DiagnosisResult) => void;

  /** Callback fired when an error occurs */
  onError: (error: Error) => void;

  /** Whether to enable voice command functionality */
  enableVoiceCommands?: boolean;

  /** Whether to automatically save progress */
  autoSave?: boolean;

  /** Initial data to populate the wizard */
  initialData?: Partial<DiagnosisData>;

  /** Custom CSS class name */
  className?: string;
}

export function DiagnosisWizard({
  userId,
  onComplete,
  onError,
  enableVoiceCommands = false,
  autoSave = true,
  initialData,
  className,
}: DiagnosisWizardProps) {
  // Component implementation
}
````

### Hook Documentation

````typescript
/**
 * Custom hook for managing diagnosis wizard state and logic
 *
 * Provides state management, validation, and side effects for the
 * diagnosis wizard component. Handles auto-save, step navigation,
 * and data persistence.
 *
 * @param {string} userId - User identifier for data persistence
 * @param {Partial<DiagnosisData>} [initialData] - Initial wizard data
 * @returns {DiagnosisWizardState} Wizard state and control functions
 *
 * @example
 * ```typescript
 * const {
 *   currentStep,
 *   diagnosisData,
 *   isValid,
 *   nextStep,
 *   previousStep,
 *   updateData,
 *   submitDiagnosis
 * } = useDiagnosisWizard('user123', initialData);
 * ```
 */
export function useDiagnosisWizard(
  userId: string,
  initialData?: Partial<DiagnosisData>
): DiagnosisWizardState {
  // Hook implementation
}
````

## API Route Documentation

### API Route Template

````typescript
/**
 * Enhanced Diagnosis API Route
 *
 * Processes comprehensive TCM diagnosis requests with AI model routing,
 * personalization, and safety validation.
 *
 * @route POST /api/v2/enhanced-diagnosis
 * @access Private (requires authentication)
 * @rateLimit 50 requests per hour per user
 *
 * @param {EnhancedDiagnosticRequest} request.body - Diagnosis request data
 * @returns {Promise<Response>} Enhanced diagnosis response
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/v2/enhanced-diagnosis', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     userId: 'user123',
 *     doctorLevel: 'expert',
 *     messages: chatHistory,
 *     requiresPersonalization: true
 *   })
 * });
 * ```
 *
 * @throws {400} Bad Request - Invalid request data
 * @throws {401} Unauthorized - Missing or invalid authentication
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Processing failure
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authentication and validation
    const user = await validateAuth(request);
    const requestData = await validateDiagnosisRequest(await request.json());

    // 2. Rate limiting
    await checkRateLimit(user.id);

    // 3. Process diagnosis
    const engine = new EnhancedAIDiagnosticEngine("API");
    const result = await engine.processEnhancedDiagnosis(requestData);

    // 4. Return response
    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
````

### Middleware Documentation

````typescript
/**
 * Authentication middleware for API routes
 *
 * Validates JWT tokens and extracts user information for authenticated routes.
 * Supports both Supabase Auth tokens and custom JWT tokens.
 *
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<User>} Authenticated user object
 * @throws {AuthenticationError} When token is missing or invalid
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const user = await validateAuth(request);
 *   // Process authenticated request...
 * }
 * ```
 */
export async function validateAuth(request: Request): Promise<User> {
  // Authentication logic
}
````

## Utility Function Documentation

### Utility Function Template

````typescript
/**
 * Calculate TCM constitution score based on symptom patterns
 *
 * Analyzes symptom data and calculates scores for each of the 9 TCM
 * constitution types using traditional pattern recognition algorithms.
 *
 * Algorithm:
 * 1. Normalize symptom weights based on severity
 * 2. Apply TCM pattern matching rules
 * 3. Calculate weighted scores for each constitution
 * 4. Normalize scores to 0-100 range
 *
 * @param {SymptomData[]} symptoms - Array of symptom observations
 * @param {PatientInfo} patientInfo - Basic patient information
 * @param {CalculationOptions} [options] - Optional calculation parameters
 * @returns {ConstitutionScores} Scores for each constitution type
 *
 * @example
 * ```typescript
 * const symptoms = [
 *   { type: 'fatigue', severity: 7, duration: '2 weeks' },
 *   { type: 'cold_hands', severity: 5, duration: '1 month' }
 * ];
 *
 * const scores = calculateConstitutionScores(symptoms, patientInfo);
 * console.log(scores.yang_deficiency); // 85
 * ```
 *
 * @see {@link ConstitutionType} - Available constitution types
 * @see {@link validateSymptomData} - Input validation function
 *
 * @performance O(n*m) where n = symptoms, m = constitution types
 * @since 4.0.0
 */
export function calculateConstitutionScores(
  symptoms: SymptomData[],
  patientInfo: PatientInfo,
  options?: CalculationOptions
): ConstitutionScores {
  // Implementation
}
````

### Validation Function Documentation

````typescript
/**
 * Validate and sanitize diagnosis request data
 *
 * Performs comprehensive validation of incoming diagnosis requests including:
 * - Schema validation using Zod
 * - Input sanitization to prevent XSS
 * - Business rule validation
 * - Data type coercion
 *
 * @param {unknown} data - Raw request data to validate
 * @returns {EnhancedDiagnosticRequest} Validated and sanitized request
 * @throws {ValidationError} When data fails validation
 *
 * @example
 * ```typescript
 * try {
 *   const validatedData = validateDiagnosisRequest(rawRequestData);
 *   // Process validated data...
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     return Response.json({ error: error.message }, { status: 400 });
 *   }
 * }
 * ```
 */
export function validateDiagnosisRequest(data: unknown): EnhancedDiagnosticRequest {
  // Validation implementation
}
````

## Class Documentation

### Service Class Template

````typescript
/**
 * Medical Safety Validator Service
 *
 * Provides comprehensive medical safety validation for TCM recommendations
 * including drug interactions, contraindications, allergies, and emergency
 * condition detection.
 *
 * Key Features:
 * - Drug-herb interaction analysis using AI and knowledge base
 * - Contraindication detection for medical conditions
 * - Emergency symptom recognition and alerting
 * - Pregnancy and age-specific safety considerations
 * - Multi-language safety guidelines
 *
 * Safety Validation Process:
 * 1. Cross-reference recommendations against known allergies
 * 2. Check for drug-herb interactions using knowledge base and AI
 * 3. Validate against contraindications for medical conditions
 * 4. Detect emergency symptoms requiring immediate attention
 * 5. Apply pregnancy-specific safety rules
 * 6. Consider age-appropriate recommendations
 * 7. Generate comprehensive safety report with alternatives
 *
 * @class MedicalSafetyValidator
 * @example
 * ```typescript
 * const validator = new MedicalSafetyValidator('MyApp');
 * const result = await validator.validateRecommendations(
 *   {
 *     dietary: ['ginger tea', 'goji berries'],
 *     herbal: ['ginseng', 'angelica root']
 *   },
 *   {
 *     medical_history: {
 *       current_medications: ['warfarin'],
 *       allergies: ['shellfish'],
 *       pregnancy_status: 'pregnant'
 *     }
 *   }
 * );
 * ```
 */
export class MedicalSafetyValidator {
  private context: string;
  private knownInteractions: Map<string, DrugInteraction[]>;
  private emergencyKeywords: Set<string>;

  /**
   * Initialize the Medical Safety Validator
   *
   * Sets up the knowledge base with known interactions, contraindications,
   * and emergency keywords for comprehensive safety validation.
   *
   * @param {string} context - Context identifier for logging and debugging
   * @constructor
   */
  constructor(context: string = "MedicalSafetyValidator") {
    // Constructor implementation
  }

  /**
   * Validate a set of TCM recommendations for safety
   *
   * This is the main entry point for comprehensive safety validation.
   * Performs multiple parallel safety checks and combines results.
   *
   * @param {RecommendationSet} recommendations - TCM recommendations to validate
   * @param {ValidationContext} context - Medical context for validation
   * @returns {Promise<SafetyValidationResult>} Comprehensive safety result
   * @throws {ValidationError} When input data is invalid
   */
  async validateRecommendations(
    recommendations: RecommendationSet,
    context: ValidationContext
  ): Promise<SafetyValidationResult> {
    // Method implementation
  }
}
````

## Interface and Type Documentation

### Complex Interface Documentation

````typescript
/**
 * Comprehensive health tracking data interface
 *
 * Represents time-series health data collected from various sources
 * including manual entry, IoT devices, and health applications.
 *
 * @interface HealthTimeSeriesData
 * @example
 * ```typescript
 * const healthData: HealthTimeSeriesData = {
 *   patientId: 'patient123',
 *   dataType: 'heart_rate',
 *   timestamp: new Date('2024-12-26T10:30:00Z'),
 *   value: { bpm: 72, quality: 'good' },
 *   source: 'apple_health',
 *   confidence: 0.95,
 *   deviceId: 'apple_watch_series_9',
 *   metadata: {
 *     activity: 'resting',
 *     location: 'home'
 *   }
 * };
 * ```
 */
export interface HealthTimeSeriesData {
  /** Unique identifier for the patient */
  patientId: string;

  /** Type of health data (heart_rate, blood_pressure, weight, etc.) */
  dataType: HealthDataType;

  /** Timestamp when the measurement was taken */
  timestamp: Date;

  /**
   * Measurement value - can be number, object, or complex structure
   * depending on data type
   */
  value: number | HealthMeasurementValue;

  /**
   * Source of the data
   * @example 'manual', 'apple_health', 'fitbit', 'manual_entry'
   */
  source: DataSource;

  /**
   * Confidence level in the measurement accuracy (0-1)
   * @default 1.0
   */
  confidence: number;

  /**
   * Identifier of the device that captured the data
   * @optional
   */
  deviceId?: string;

  /**
   * Additional metadata about the measurement context
   * @optional
   */
  metadata?: Record<string, any>;

  /** Timestamp when the record was created in the system */
  createdAt: Date;
}
````

### Union Type Documentation

````typescript
/**
 * AI Model identifiers supported by the system
 *
 * Represents the available AI models for different types of processing.
 * Models are categorized by capability and performance characteristics.
 *
 * @typedef {string} AIModelId
 *
 * Standard Models:
 * - 'gemini-2.0-flash': Fast processing, good for simple requests
 * - 'gemini-2.5-pro': Balanced performance and capability
 *
 * Advanced Models:
 * - 'gemini-3-pro-preview': Most capable, for complex analysis
 * - 'gemini-2.5-pro-vision': Specialized for image analysis
 *
 * @example
 * ```typescript
 * const modelId: AIModelId = 'gemini-2.5-pro';
 * const router = new AIModelRouter();
 * const result = await router.generateWithModel(modelId, request);
 * ```
 */
export type AIModelId =
  | "gemini-2.0-flash"
  | "gemini-2.5-pro"
  | "gemini-3-pro-preview"
  | "gemini-2.5-pro-vision";
````

## JSDoc Standards

### Required JSDoc Tags

#### For Functions/Methods

- `@param` - Parameter description
- `@returns` - Return value description
- `@throws` - Exception conditions
- `@example` - Usage example
- `@since` - Version when added
- `@deprecated` - If deprecated

#### For Classes

- `@class` - Class identifier
- `@constructor` - Constructor description
- `@example` - Usage example
- `@since` - Version when added

#### For Interfaces/Types

- `@interface` or `@typedef` - Type identifier
- `@property` - Property descriptions
- `@example` - Usage example

#### Optional JSDoc Tags

- `@see` - Cross-references
- `@todo` - Future improvements
- `@performance` - Performance notes
- `@security` - Security considerations
- `@author` - Author information

### JSDoc Best Practices

1. **Use Markdown**: JSDoc supports Markdown formatting
2. **Include Examples**: Always provide practical examples
3. **Link Related Items**: Use `@see` for cross-references
4. **Describe Edge Cases**: Document unusual behavior
5. **Performance Notes**: Include performance characteristics
6. **Version Information**: Use `@since` for new features

## Code Examples

### Complete File Example

````typescript
/**
 * AI Model Performance Monitor - Tracks and analyzes AI model performance
 *
 * This module provides comprehensive performance monitoring for AI models
 * including response times, success rates, and quality metrics. It helps
 * optimize model selection and identify performance issues.
 *
 * Key Features:
 * - Real-time performance tracking
 * - Historical performance analysis
 * - Automatic alerting for performance degradation
 * - Model comparison and benchmarking
 * - Performance optimization recommendations
 *
 * @author Sihat TCM Development Team
 * @version 4.0.0
 * @since 2024-12-26
 */

import { EventEmitter } from "events";
import { logger } from "./systemLogger";

/**
 * Performance metrics for a single AI model request
 *
 * @interface ModelPerformanceMetric
 * @property {string} modelId - Identifier of the AI model
 * @property {string} requestType - Type of request processed
 * @property {number} responseTime - Time taken to process request (ms)
 * @property {boolean} success - Whether the request was successful
 * @property {number} [confidenceScore] - AI confidence in response (0-1)
 * @property {string} [errorType] - Type of error if request failed
 * @property {Date} timestamp - When the request was processed
 */
export interface ModelPerformanceMetric {
  modelId: string;
  requestType: string;
  responseTime: number;
  success: boolean;
  confidenceScore?: number;
  errorType?: string;
  timestamp: Date;
}

/**
 * Configuration options for the performance monitor
 *
 * @interface PerformanceMonitorConfig
 * @property {number} [historySize=1000] - Number of metrics to keep in memory
 * @property {number} [alertThreshold=5000] - Response time threshold for alerts (ms)
 * @property {number} [successRateThreshold=0.95] - Success rate threshold for alerts
 * @property {boolean} [enableAlerting=true] - Whether to enable performance alerts
 */
export interface PerformanceMonitorConfig {
  historySize?: number;
  alertThreshold?: number;
  successRateThreshold?: number;
  enableAlerting?: boolean;
}

/**
 * AI Model Performance Monitor
 *
 * Monitors and analyzes the performance of AI models in real-time.
 * Provides metrics, alerts, and optimization recommendations.
 *
 * @class AIModelPerformanceMonitor
 * @extends EventEmitter
 * @example
 * ```typescript
 * const monitor = new AIModelPerformanceMonitor({
 *   historySize: 2000,
 *   alertThreshold: 3000,
 *   enableAlerting: true
 * });
 *
 * // Record a performance metric
 * monitor.recordMetric({
 *   modelId: 'gemini-2.5-pro',
 *   requestType: 'diagnosis',
 *   responseTime: 1500,
 *   success: true,
 *   confidenceScore: 0.92,
 *   timestamp: new Date()
 * });
 *
 * // Get performance statistics
 * const stats = monitor.getModelStats('gemini-2.5-pro');
 * console.log(`Average response time: ${stats.averageResponseTime}ms`);
 * ```
 */
export class AIModelPerformanceMonitor extends EventEmitter {
  private metrics: Map<string, ModelPerformanceMetric[]> = new Map();
  private config: Required<PerformanceMonitorConfig>;

  /**
   * Initialize the performance monitor
   *
   * @param {PerformanceMonitorConfig} [config] - Configuration options
   * @constructor
   */
  constructor(config: PerformanceMonitorConfig = {}) {
    super();

    this.config = {
      historySize: 1000,
      alertThreshold: 5000,
      successRateThreshold: 0.95,
      enableAlerting: true,
      ...config,
    };

    logger.info("AI Model Performance Monitor initialized", { config: this.config });
  }

  /**
   * Record a performance metric for an AI model
   *
   * Stores the metric and triggers alerts if performance thresholds
   * are exceeded. Automatically manages metric history size.
   *
   * @param {ModelPerformanceMetric} metric - Performance metric to record
   * @throws {Error} When metric data is invalid
   *
   * @example
   * ```typescript
   * monitor.recordMetric({
   *   modelId: 'gemini-2.5-pro',
   *   requestType: 'image_analysis',
   *   responseTime: 2500,
   *   success: true,
   *   confidenceScore: 0.88,
   *   timestamp: new Date()
   * });
   * ```
   */
  recordMetric(metric: ModelPerformanceMetric): void {
    this.validateMetric(metric);

    // Get or create metric history for this model
    const modelMetrics = this.metrics.get(metric.modelId) || [];
    modelMetrics.push(metric);

    // Maintain history size limit
    if (modelMetrics.length > this.config.historySize) {
      modelMetrics.shift();
    }

    this.metrics.set(metric.modelId, modelMetrics);

    // Check for performance issues
    if (this.config.enableAlerting) {
      this.checkPerformanceAlerts(metric);
    }

    // Emit event for external listeners
    this.emit("metricRecorded", metric);

    logger.debug("Performance metric recorded", {
      modelId: metric.modelId,
      responseTime: metric.responseTime,
      success: metric.success,
    });
  }

  /**
   * Get performance statistics for a specific model
   *
   * Calculates comprehensive performance statistics including
   * response times, success rates, and trend analysis.
   *
   * @param {string} modelId - AI model identifier
   * @param {number} [timeWindowHours=24] - Time window for statistics (hours)
   * @returns {ModelPerformanceStats} Performance statistics
   *
   * @example
   * ```typescript
   * const stats = monitor.getModelStats('gemini-2.5-pro', 12);
   *
   * console.log(`Success rate: ${stats.successRate * 100}%`);
   * console.log(`Average response time: ${stats.averageResponseTime}ms`);
   * console.log(`Total requests: ${stats.totalRequests}`);
   * ```
   */
  getModelStats(modelId: string, timeWindowHours: number = 24): ModelPerformanceStats {
    const modelMetrics = this.metrics.get(modelId) || [];
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    // Filter metrics within time window
    const recentMetrics = modelMetrics.filter((m) => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        modelId,
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        averageConfidenceScore: 0,
        errorRate: 0,
        timeWindow: timeWindowHours,
      };
    }

    // Calculate statistics
    const successfulRequests = recentMetrics.filter((m) => m.success);
    const responseTimes = successfulRequests.map((m) => m.responseTime).sort((a, b) => a - b);
    const confidenceScores = recentMetrics
      .filter((m) => m.confidenceScore !== undefined)
      .map((m) => m.confidenceScore!);

    return {
      modelId,
      totalRequests: recentMetrics.length,
      successRate: successfulRequests.length / recentMetrics.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      medianResponseTime: this.calculateMedian(responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      averageConfidenceScore: this.calculateAverage(confidenceScores),
      errorRate: (recentMetrics.length - successfulRequests.length) / recentMetrics.length,
      timeWindow: timeWindowHours,
    };
  }

  /**
   * Validate metric data before recording
   *
   * @private
   * @param {ModelPerformanceMetric} metric - Metric to validate
   * @throws {Error} When metric data is invalid
   */
  private validateMetric(metric: ModelPerformanceMetric): void {
    if (!metric.modelId || typeof metric.modelId !== "string") {
      throw new Error("Invalid modelId: must be a non-empty string");
    }

    if (!metric.requestType || typeof metric.requestType !== "string") {
      throw new Error("Invalid requestType: must be a non-empty string");
    }

    if (typeof metric.responseTime !== "number" || metric.responseTime < 0) {
      throw new Error("Invalid responseTime: must be a non-negative number");
    }

    if (typeof metric.success !== "boolean") {
      throw new Error("Invalid success: must be a boolean");
    }

    if (
      metric.confidenceScore !== undefined &&
      (typeof metric.confidenceScore !== "number" ||
        metric.confidenceScore < 0 ||
        metric.confidenceScore > 1)
    ) {
      throw new Error("Invalid confidenceScore: must be a number between 0 and 1");
    }
  }

  /**
   * Check for performance alerts and emit warnings
   *
   * @private
   * @param {ModelPerformanceMetric} metric - Latest metric to check
   */
  private checkPerformanceAlerts(metric: ModelPerformanceMetric): void {
    // Check response time threshold
    if (metric.responseTime > this.config.alertThreshold) {
      this.emit("performanceAlert", {
        type: "slow_response",
        modelId: metric.modelId,
        responseTime: metric.responseTime,
        threshold: this.config.alertThreshold,
        timestamp: metric.timestamp,
      });
    }

    // Check success rate (over recent requests)
    const recentStats = this.getModelStats(metric.modelId, 1); // Last hour
    if (
      recentStats.totalRequests >= 10 &&
      recentStats.successRate < this.config.successRateThreshold
    ) {
      this.emit("performanceAlert", {
        type: "low_success_rate",
        modelId: metric.modelId,
        successRate: recentStats.successRate,
        threshold: this.config.successRateThreshold,
        timestamp: metric.timestamp,
      });
    }
  }

  /**
   * Calculate average of numeric array
   *
   * @private
   * @param {number[]} values - Array of numbers
   * @returns {number} Average value
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of numeric array
   *
   * @private
   * @param {number[]} values - Sorted array of numbers
   * @returns {number} Median value
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }

  /**
   * Calculate percentile of numeric array
   *
   * @private
   * @param {number[]} values - Sorted array of numbers
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }
}

/**
 * Performance statistics for an AI model
 *
 * @interface ModelPerformanceStats
 */
export interface ModelPerformanceStats {
  /** AI model identifier */
  modelId: string;

  /** Total number of requests in time window */
  totalRequests: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Median response time in milliseconds */
  medianResponseTime: number;

  /** 95th percentile response time in milliseconds */
  p95ResponseTime: number;

  /** Average confidence score (0-1) */
  averageConfidenceScore: number;

  /** Error rate (0-1) */
  errorRate: number;

  /** Time window for statistics in hours */
  timeWindow: number;
}

/**
 * Create a default performance monitor instance
 *
 * @returns {AIModelPerformanceMonitor} Configured monitor instance
 */
export function createDefaultPerformanceMonitor(): AIModelPerformanceMonitor {
  return new AIModelPerformanceMonitor({
    historySize: 2000,
    alertThreshold: 5000,
    successRateThreshold: 0.95,
    enableAlerting: true,
  });
}
````

## Best Practices

### 1. Documentation Maintenance

- **Keep in Sync**: Update documentation when code changes
- **Review Process**: Include documentation review in code reviews
- **Automated Checks**: Use tools to verify documentation completeness
- **Version Control**: Track documentation changes with code

### 2. Writing Guidelines

- **Clear Language**: Use simple, clear language
- **Consistent Style**: Follow established patterns
- **Complete Coverage**: Document all public APIs
- **Practical Examples**: Include real-world usage examples

### 3. Code Organization

- **Logical Grouping**: Group related functions and classes
- **Consistent Naming**: Use descriptive, consistent names
- **Type Safety**: Leverage TypeScript for better documentation
- **Error Handling**: Document error conditions and exceptions

### 4. Performance Considerations

- **Algorithm Complexity**: Document time and space complexity
- **Resource Usage**: Note memory and CPU requirements
- **Scalability**: Describe scaling characteristics
- **Optimization**: Include performance optimization notes

### 5. Security Documentation

- **Input Validation**: Document validation requirements
- **Authentication**: Describe authentication mechanisms
- **Authorization**: Document permission requirements
- **Data Protection**: Note sensitive data handling

---

**This documentation guide should be followed by all developers contributing to the Sihat TCM project. Regular updates ensure the documentation remains accurate and useful.**
