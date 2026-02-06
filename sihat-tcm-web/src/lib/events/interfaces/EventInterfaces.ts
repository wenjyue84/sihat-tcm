/**
 * Event System Interfaces
 *
 * Core interfaces for the event system following clean architecture principles.
 * These interfaces define contracts for event handling, emission, and management.
 */

/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly source: string;
  readonly id: string;
  readonly data?: Record<string, any>;
  readonly metadata?: EventMetadata;
}

/**
 * Event metadata for additional context
 */
export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  version?: string;
  tags?: string[];
}

/**
 * Event listener function signature
 */
export type EventListener<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event listener configuration
 */
export interface EventListenerConfig {
  once?: boolean;
  priority?: number;
  source?: string;
  timeout?: number;
  retryAttempts?: number;
  errorHandler?: (error: Error, event: BaseEvent) => void;
}

/**
 * Event listener entry with metadata
 */
export interface EventListenerEntry {
  id: string;
  listener: EventListener;
  config: Required<EventListenerConfig>;
  registeredAt: Date;
  executionCount: number;
  lastExecuted?: Date;
  errors: EventListenerError[];
}

/**
 * Event listener error tracking
 */
export interface EventListenerError {
  error: Error;
  event: BaseEvent;
  timestamp: Date;
  attempt: number;
}

/**
 * Event emission options
 */
export interface EventEmissionOptions {
  async?: boolean;
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  skipValidation?: boolean;
}

/**
 * Event emission result
 */
export interface EventEmissionResult {
  eventId: string;
  success: boolean;
  listenersNotified: number;
  executionTime: number;
  errors: EventListenerError[];
  metadata?: Record<string, any>;
}

/**
 * Event filter function
 */
export type EventFilter<T extends BaseEvent = BaseEvent> = (event: T) => boolean;

/**
 * Event transformer function
 */
export type EventTransformer<T extends BaseEvent = BaseEvent, R extends BaseEvent = BaseEvent> = (
  event: T
) => R;

/**
 * Event validator function
 */
export type EventValidator<T extends BaseEvent = BaseEvent> = (event: T) => ValidationResult;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Event history entry
 */
export interface EventHistoryEntry {
  event: BaseEvent;
  emissionResult: EventEmissionResult;
  storedAt: Date;
}

/**
 * Event statistics
 */
export interface EventStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageExecutionTime: number;
  errorRate: number;
  listenerCount: number;
  activeListeners: number;
  recentErrors: EventListenerError[];
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  emit<T extends BaseEvent>(event: T, options?: EventEmissionOptions): Promise<EventEmissionResult>;
  on<T extends BaseEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    config?: EventListenerConfig
  ): string; // Returns listener ID

  once<T extends BaseEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    config?: Omit<EventListenerConfig, "once">
  ): string;

  off(eventType: string, listenerId?: string): boolean;
  removeAllListeners(eventType?: string): number;

  hasListeners(eventType: string): boolean;
  getListenerCount(eventType: string): number;
  getListeners(eventType: string): EventListenerEntry[];
}

/**
 * Event history manager interface
 */
export interface EventHistoryManager {
  record(event: BaseEvent, result: EventEmissionResult): Promise<void>;
  getHistory(filter?: EventHistoryFilter): Promise<EventHistoryEntry[]>;
  clearHistory(olderThan?: Date): Promise<number>;
  getStatistics(timeRange?: TimeRange): Promise<EventStatistics>;
  exportHistory(format: "json" | "csv", filter?: EventHistoryFilter): Promise<string>;
}

/**
 * Event history filter
 */
export interface EventHistoryFilter {
  eventTypes?: string[];
  sources?: string[];
  timeRange?: TimeRange;
  limit?: number;
  offset?: number;
  includeErrors?: boolean;
  minExecutionTime?: number;
  maxExecutionTime?: number;
}

/**
 * Time range specification
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Event middleware interface
 */
export interface EventMiddleware {
  name: string;
  priority: number;
  beforeEmit?(event: BaseEvent): Promise<BaseEvent | null>;
  afterEmit?(event: BaseEvent, result: EventEmissionResult): Promise<void>;
  onError?(error: Error, event: BaseEvent): Promise<void>;
}

/**
 * Event bus interface - main orchestrator
 */
export interface EventBus {
  // Core functionality
  emit<T extends BaseEvent>(event: T, options?: EventEmissionOptions): Promise<EventEmissionResult>;
  subscribe<T extends BaseEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    config?: EventListenerConfig
  ): string;

  unsubscribe(eventType: string, listenerId?: string): boolean;

  // Advanced features
  addMiddleware(middleware: EventMiddleware): void;
  removeMiddleware(middlewareName: string): boolean;

  addFilter<T extends BaseEvent>(eventType: T["type"], filter: EventFilter<T>): string;
  removeFilter(eventType: string, filterId: string): boolean;

  addTransformer<T extends BaseEvent, R extends BaseEvent>(
    eventType: T["type"],
    transformer: EventTransformer<T, R>
  ): string;
  removeTransformer(eventType: string, transformerId: string): boolean;

  // Management
  getStatistics(): EventStatistics;
  getHistory(filter?: EventHistoryFilter): Promise<EventHistoryEntry[]>;
  clearHistory(olderThan?: Date): Promise<number>;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
  maxHistorySize: number;
  defaultTimeout: number;
  enableHistory: boolean;
  enableStatistics: boolean;
  enableMiddleware: boolean;
  errorHandling: "throw" | "log" | "ignore";
  asyncByDefault: boolean;
  validateEvents: boolean;
}

/**
 * Scoped event emitter for components
 */
export interface ScopedEventEmitter {
  readonly source: string;

  emit<T extends BaseEvent>(
    event: Omit<T, "source" | "timestamp" | "id">,
    options?: EventEmissionOptions
  ): Promise<EventEmissionResult>;

  on<T extends BaseEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    config?: EventListenerConfig
  ): string;

  once<T extends BaseEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    config?: Omit<EventListenerConfig, "once">
  ): string;

  off(eventType: string, listenerId?: string): boolean;
}

/**
 * Event aggregator for complex event patterns
 */
export interface EventAggregator {
  // Correlation patterns
  correlate<T extends BaseEvent[]>(
    eventTypes: string[],
    correlationFn: (events: T) => boolean,
    timeWindow: number
  ): Promise<T>;

  // Saga patterns
  saga<T extends BaseEvent>(
    sagaId: string,
    steps: SagaStep<T>[],
    compensations?: CompensationStep<T>[]
  ): Promise<SagaResult>;

  // Event sourcing
  replay(eventTypes: string[], fromTimestamp?: Date): AsyncIterableIterator<BaseEvent>;
  snapshot(aggregateId: string): Promise<EventSnapshot>;
}

/**
 * Saga step definition
 */
export interface SagaStep<T extends BaseEvent> {
  eventType: T["type"];
  handler: (event: T) => Promise<BaseEvent | null>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

/**
 * Compensation step for saga rollback
 */
export interface CompensationStep<T extends BaseEvent> {
  eventType: T["type"];
  compensate: (event: T) => Promise<BaseEvent | null>;
}

/**
 * Saga execution result
 */
export interface SagaResult {
  sagaId: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  executionTime: number;
  error?: Error;
  compensationsExecuted: number;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  baseDelay: number;
  maxDelay: number;
  jitter?: boolean;
}

/**
 * Event snapshot for event sourcing
 */
export interface EventSnapshot {
  aggregateId: string;
  version: number;
  timestamp: Date;
  data: Record<string, any>;
  eventCount: number;
}

/**
 * Domain-specific event types for Sihat TCM
 */

// AI Events
export interface AIModelSelectedEvent extends BaseEvent {
  type: "ai:model:selected";
  data: {
    modelId: string;
    complexity: string;
    reasoning: string[];
    selectionTime: number;
  };
}

export interface AIRequestStartedEvent extends BaseEvent {
  type: "ai:request:started";
  data: {
    requestId: string;
    modelId: string;
    complexity: string;
    estimatedTime: number;
  };
}

export interface AIRequestCompletedEvent extends BaseEvent {
  type: "ai:request:completed";
  data: {
    requestId: string;
    modelId: string;
    responseTime: number;
    success: boolean;
    error?: string;
    tokenCount?: number;
    cost?: number;
  };
}

// Notification Events
export interface NotificationScheduledEvent extends BaseEvent {
  type: "notification:scheduled";
  data: {
    notificationId: string;
    category: string;
    priority: string;
    scheduledFor: Date;
  };
}

export interface NotificationDeliveredEvent extends BaseEvent {
  type: "notification:delivered";
  data: {
    notificationId: string;
    deliveredAt: Date;
    deliveryMethod: string;
  };
}

// System Events
export interface SystemErrorEvent extends BaseEvent {
  type: "system:error";
  data: {
    error: Error;
    component: string;
    action: string;
    severity: "low" | "medium" | "high" | "critical";
    context?: Record<string, any>;
  };
}

export interface SystemPerformanceEvent extends BaseEvent {
  type: "system:performance";
  data: {
    metric: string;
    value: number;
    threshold?: number;
    status: "normal" | "warning" | "critical";
    component: string;
  };
}

// TCM-specific Events
export interface DiagnosisStartedEvent extends BaseEvent {
  type: "tcm:diagnosis:started";
  data: {
    sessionId: string;
    patientId: string;
    diagnosticType: "observation" | "listening" | "inquiry" | "palpation";
  };
}

export interface DiagnosisCompletedEvent extends BaseEvent {
  type: "tcm:diagnosis:completed";
  data: {
    sessionId: string;
    patientId: string;
    results: {
      constitution: string;
      recommendations: string[];
      confidence: number;
    };
    processingTime: number;
  };
}

/**
 * Union type for all domain events
 */
export type DomainEvent =
  | AIModelSelectedEvent
  | AIRequestStartedEvent
  | AIRequestCompletedEvent
  | NotificationScheduledEvent
  | NotificationDeliveredEvent
  | SystemErrorEvent
  | SystemPerformanceEvent
  | DiagnosisStartedEvent
  | DiagnosisCompletedEvent;

/**
 * Generic application event - alias for BaseEvent used by EventSystem
 */
export type AppEvent = BaseEvent;

/**
 * Event system statistics
 */
export interface EventSystemStats {
  totalListeners: number;
  eventTypes: number;
  listenersByType: Record<string, number>;
  historySize: number;
}
