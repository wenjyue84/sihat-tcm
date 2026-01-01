/**
 * Extended Model Interfaces
 * 
 * Additional interfaces for better organization and type safety
 * in the AI model system. These complement the core AIModel interfaces.
 */

// Import core types from AIModel for use in this file
import type {
  AIModel,
  ModelCapabilities,
  RequestComplexityType,
  RequestComplexity,
  ComplexityFactors,
  ModelSelectionCriteria,
  PerformanceMetrics,
  PerformanceAnalytics,
  ModelRouter,
  ModelSelectionStrategy,
  ComplexityAnalysisStrategy,
  PerformanceMonitor,
} from './AIModel';

// Re-export core types from AIModel for convenience
export type {
  AIModel,
  ModelCapabilities,
  RequestComplexityType,
  RequestComplexity,
  ComplexityFactors,
  ModelSelectionCriteria,
  PerformanceMetrics,
  PerformanceAnalytics,
  ModelRouter,
  ModelSelectionStrategy,
  ComplexityAnalysisStrategy,
  PerformanceMonitor,
} from './AIModel';

// Type aliases for backward compatibility
export type ModelPerformanceMetrics = PerformanceMetrics;

/**
 * Model router configuration
 */
export interface ModelRouterConfig {
  defaultModel?: string;
  fallbackModels?: string[];
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  timeout?: number;
}

/**
 * Model configuration interface for factory creation
 */
export interface ModelConfiguration {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  customHeaders?: Record<string, string>;
  rateLimitConfig?: RateLimitConfig;
  cacheConfig?: CacheConfig;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  maxBackoffTime: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  ttlSeconds: number;
  strategy: 'lru' | 'fifo' | 'lfu';
  persistToDisk?: boolean;
}

/**
 * Model health status
 */
export interface ModelHealthStatus {
  modelId: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime: number;
  errorRate: number;
  availability: number; // Percentage
  issues: HealthIssue[];
}

/**
 * Health issue details
 */
export interface HealthIssue {
  type: 'performance' | 'availability' | 'error_rate' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  firstOccurred: Date;
  lastOccurred: Date;
  occurrenceCount: number;
}

/**
 * Model registry interface for managing available models
 */
export interface ModelRegistry {
  registerModel(model: AIModel, config?: ModelConfiguration): Promise<void>;
  unregisterModel(modelId: string): Promise<void>;
  getModel(modelId: string): AIModel | null;
  getAllModels(): AIModel[];
  getModelsByCapability(capability: keyof ModelCapabilities): AIModel[];
  getHealthStatus(modelId: string): Promise<ModelHealthStatus>;
  performHealthCheck(modelId?: string): Promise<ModelHealthStatus[]>;
}

/**
 * Model load balancer interface
 */
export interface ModelLoadBalancer {
  selectModel(
    availableModels: AIModel[],
    criteria: LoadBalancingCriteria
  ): AIModel;

  updateModelWeights(weights: Record<string, number>): void;
  getModelWeights(): Record<string, number>;
  getLoadDistribution(): Record<string, number>;
}

/**
 * Load balancing criteria
 */
export interface LoadBalancingCriteria {
  strategy: 'round_robin' | 'weighted' | 'least_connections' | 'performance_based';
  preferredModels?: string[];
  excludedModels?: string[];
  maxLatency?: number;
  minSuccessRate?: number;
}

/**
 * Model pool interface for managing model instances
 */
export interface ModelPool {
  acquireModel(modelId: string): Promise<AIModel>;
  releaseModel(model: AIModel): Promise<void>;
  getPoolSize(modelId: string): number;
  getActiveConnections(modelId: string): number;
  warmupPool(modelId: string, size: number): Promise<void>;
  drainPool(modelId: string): Promise<void>;
}

/**
 * Model versioning interface
 */
export interface ModelVersion {
  modelId: string;
  version: string;
  releaseDate: Date;
  capabilities: ModelCapabilities;
  deprecationDate?: Date;
  migrationPath?: string;
  changeLog: VersionChange[];
}

/**
 * Version change details
 */
export interface VersionChange {
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking_change';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Model versioning manager
 */
export interface ModelVersionManager {
  registerVersion(version: ModelVersion): Promise<void>;
  getLatestVersion(modelId: string): Promise<ModelVersion | null>;
  getAllVersions(modelId: string): Promise<ModelVersion[]>;
  checkForUpdates(modelId: string): Promise<ModelVersion[]>;
  migrateToVersion(modelId: string, targetVersion: string): Promise<void>;
}

/**
 * Model analytics interface
 */
export interface ModelAnalytics {
  recordUsage(modelId: string, usage: ModelUsage): Promise<void>;
  getUsageStats(modelId: string, timeRange: TimeRange): Promise<UsageStats>;
  getCostAnalysis(timeRange: TimeRange): Promise<CostAnalysis>;
  getPerformanceTrends(modelId: string, timeRange: TimeRange): Promise<PerformanceTrend[]>;
  generateReport(options: ReportOptions): Promise<AnalyticsReport>;
}

/**
 * Model usage tracking
 */
export interface ModelUsage {
  modelId: string;
  timestamp: Date;
  requestType: RequestComplexityType;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
  success: boolean;
  cost: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  modelId: string;
  timeRange: TimeRange;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  peakUsageTime: Date;
  usageByComplexity: Record<RequestComplexityType, number>;
}

/**
 * Cost analysis
 */
export interface CostAnalysis {
  timeRange: TimeRange;
  totalCost: number;
  costByModel: Record<string, number>;
  costByComplexity: Record<RequestComplexityType, number>;
  costTrend: CostDataPoint[];
  projectedMonthlyCost: number;
  costOptimizationSuggestions: CostOptimization[];
}

/**
 * Cost data point for trends
 */
export interface CostDataPoint {
  timestamp: Date;
  cost: number;
  requests: number;
}

/**
 * Cost optimization suggestion
 */
export interface CostOptimization {
  type: 'model_selection' | 'request_batching' | 'caching' | 'rate_limiting';
  description: string;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

/**
 * Performance trend data
 */
export interface PerformanceTrend {
  timestamp: Date;
  responseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
}

/**
 * Time range specification
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

/**
 * Report generation options
 */
export interface ReportOptions {
  timeRange: TimeRange;
  modelIds?: string[];
  includeUsage: boolean;
  includeCosts: boolean;
  includePerformance: boolean;
  includeRecommendations: boolean;
  format: 'json' | 'csv' | 'pdf';
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  generatedAt: Date;
  timeRange: TimeRange;
  summary: ReportSummary;
  usage?: UsageStats[];
  costs?: CostAnalysis;
  performance?: PerformanceTrend[];
  recommendations?: Recommendation[];
}

/**
 * Report summary
 */
export interface ReportSummary {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  overallSuccessRate: number;
  mostUsedModel: string;
  costliestModel: string;
  fastestModel: string;
}

/**
 * Recommendation for optimization
 */
export interface Recommendation {
  type: 'performance' | 'cost' | 'reliability' | 'usage';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  implementationSteps: string[];
}

/**
 * Model circuit breaker interface
 */
export interface ModelCircuitBreaker {
  isOpen(modelId: string): boolean;
  recordSuccess(modelId: string): void;
  recordFailure(modelId: string): void;
  getState(modelId: string): CircuitBreakerState;
  reset(modelId: string): void;
  configure(modelId: string, config: CircuitBreakerConfig): void;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

/**
 * Model A/B testing interface
 */
export interface ModelABTesting {
  createExperiment(experiment: ABExperiment): Promise<string>;
  updateExperiment(experimentId: string, updates: Partial<ABExperiment>): Promise<void>;
  getExperiment(experimentId: string): Promise<ABExperiment | null>;
  recordResult(experimentId: string, result: ABTestResult): Promise<void>;
  getResults(experimentId: string): Promise<ABTestResults>;
  concludeExperiment(experimentId: string): Promise<ABTestConclusion>;
}

/**
 * A/B testing experiment
 */
export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  trafficSplit: Record<string, number>; // variant ID -> percentage
  successMetrics: string[];
  hypothesis: string;
}

/**
 * A/B test variant
 */
export interface ABVariant {
  id: string;
  name: string;
  modelId: string;
  configuration: ModelConfiguration;
  description: string;
}

/**
 * A/B test result
 */
export interface ABTestResult {
  experimentId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  success: boolean;
}

/**
 * A/B test results summary
 */
export interface ABTestResults {
  experimentId: string;
  totalParticipants: number;
  variantResults: Record<string, VariantResults>;
  statisticalSignificance: number;
  confidenceLevel: number;
}

/**
 * Variant results
 */
export interface VariantResults {
  variantId: string;
  participants: number;
  conversionRate: number;
  averageMetrics: Record<string, number>;
  confidenceInterval: [number, number];
}

/**
 * A/B test conclusion
 */
export interface ABTestConclusion {
  experimentId: string;
  winningVariant?: string;
  recommendation: string;
  statisticalSignificance: number;
  businessImpact: string;
  nextSteps: string[];
}
