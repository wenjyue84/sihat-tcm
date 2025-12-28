/**
 * Command System Interfaces
 * 
 * Core interfaces for the command system implementing the Command pattern
 * with support for undo/redo, queuing, validation, and batch operations.
 */

/**
 * Base command interface that all commands must implement
 */
export interface Command {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly metadata?: CommandMetadata;
  
  execute(): Promise<CommandResult>;
  undo?(): Promise<CommandResult>;
  canUndo?(): boolean;
  validate?(): Promise<ValidationResult>;
  
  // Lifecycle hooks
  beforeExecute?(): Promise<void>;
  afterExecute?(result: CommandResult): Promise<void>;
  onError?(error: Error): Promise<void>;
}

/**
 * Command metadata for additional context
 */
export interface CommandMetadata {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  tags?: string[];
  priority?: CommandPriority;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  dependencies?: string[];
}

/**
 * Command priority levels
 */
export type CommandPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
  warnings?: string[];
  sideEffects?: SideEffect[];
}

/**
 * Side effect tracking
 */
export interface SideEffect {
  type: string;
  description: string;
  reversible: boolean;
  data?: any;
}

/**
 * Command validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Command execution context
 */
export interface CommandContext {
  userId?: string;
  sessionId?: string;
  source: string;
  priority: CommandPriority;
  timeout?: number;
  retryAttempts?: number;
  dryRun?: boolean;
  skipValidation?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  jitter?: boolean;
  retryableErrors?: string[];
}

/**
 * Command executor interface
 */
export interface CommandExecutor {
  execute(command: Command, context?: Partial<CommandContext>): Promise<CommandResult>;
  executeWithRetry(command: Command, retryPolicy: RetryPolicy, context?: Partial<CommandContext>): Promise<CommandResult>;
  canExecute(command: Command): Promise<boolean>;
  estimateExecutionTime(command: Command): Promise<number>;
}

/**
 * Command queue interface
 */
export interface CommandQueue {
  enqueue(command: Command, context?: Partial<CommandContext>): Promise<string>; // Returns queue ID
  dequeue(): Promise<QueuedCommand | null>;
  peek(): Promise<QueuedCommand | null>;
  
  // Queue management
  size(): number;
  isEmpty(): boolean;
  clear(): Promise<number>;
  
  // Priority and filtering
  enqueuePriority(command: Command, priority: CommandPriority, context?: Partial<CommandContext>): Promise<string>;
  getByPriority(priority: CommandPriority): Promise<QueuedCommand[]>;
  
  // Status and monitoring
  getQueueStatus(): QueueStatus;
  getQueuedCommands(): Promise<QueuedCommand[]>;
}

/**
 * Queued command with context
 */
export interface QueuedCommand {
  queueId: string;
  command: Command;
  context: CommandContext;
  enqueuedAt: Date;
  attempts: number;
  lastAttempt?: Date;
  status: QueuedCommandStatus;
}

/**
 * Queued command status
 */
export type QueuedCommandStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Queue status information
 */
export interface QueueStatus {
  totalCommands: number;
  pendingCommands: number;
  processingCommands: number;
  completedCommands: number;
  failedCommands: number;
  averageWaitTime: number;
  averageExecutionTime: number;
  throughput: number; // Commands per minute
}

/**
 * Command history interface
 */
export interface CommandHistory {
  record(command: Command, result: CommandResult, context: CommandContext): Promise<void>;
  getHistory(filter?: CommandHistoryFilter): Promise<CommandHistoryEntry[]>;
  getCommand(commandId: string): Promise<CommandHistoryEntry | null>;
  
  // Undo/Redo support
  getUndoableCommands(): Promise<CommandHistoryEntry[]>;
  getRedoableCommands(): Promise<CommandHistoryEntry[]>;
  
  // Analytics
  getStatistics(timeRange?: TimeRange): Promise<CommandStatistics>;
  getCommandsByType(commandType: string): Promise<CommandHistoryEntry[]>;
  
  // Cleanup
  clearHistory(olderThan?: Date): Promise<number>;
  archiveHistory(olderThan: Date): Promise<number>;
}

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  command: Command;
  result: CommandResult;
  context: CommandContext;
  executedAt: Date;
  undoable: boolean;
  undoneAt?: Date;
  redoneAt?: Date;
}

/**
 * Command history filter
 */
export interface CommandHistoryFilter {
  commandTypes?: string[];
  userIds?: string[];
  sessionIds?: string[];
  timeRange?: TimeRange;
  success?: boolean;
  undoable?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Time range specification
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Command statistics
 */
export interface CommandStatistics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageExecutionTime: number;
  commandsByType: Record<string, number>;
  commandsByUser: Record<string, number>;
  errorsByType: Record<string, number>;
  performanceTrends: PerformanceTrend[];
}

/**
 * Performance trend data point
 */
export interface PerformanceTrend {
  timestamp: Date;
  commandCount: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
}

/**
 * Batch command interface
 */
export interface BatchCommand extends Command {
  commands: Command[];
  executionStrategy: BatchExecutionStrategy;
  rollbackStrategy: BatchRollbackStrategy;
  
  // Batch-specific methods
  addCommand(command: Command): void;
  removeCommand(commandId: string): boolean;
  getCommands(): Command[];
  getExecutionPlan(): ExecutionPlan;
}

/**
 * Batch execution strategies
 */
export type BatchExecutionStrategy = 'sequential' | 'parallel' | 'pipeline' | 'conditional';

/**
 * Batch rollback strategies
 */
export type BatchRollbackStrategy = 'all_or_nothing' | 'best_effort' | 'manual' | 'none';

/**
 * Execution plan for batch commands
 */
export interface ExecutionPlan {
  steps: ExecutionStep[];
  estimatedTime: number;
  dependencies: CommandDependency[];
  riskAssessment: RiskAssessment;
}

/**
 * Execution step in a batch
 */
export interface ExecutionStep {
  stepId: string;
  commands: Command[];
  executionMode: 'sequential' | 'parallel';
  dependencies: string[];
  timeout?: number;
}

/**
 * Command dependency
 */
export interface CommandDependency {
  commandId: string;
  dependsOn: string[];
  dependencyType: 'hard' | 'soft';
}

/**
 * Risk assessment for batch execution
 */
export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  mitigations: string[];
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Command scheduler interface
 */
export interface CommandScheduler {
  schedule(command: Command, schedule: CommandSchedule): Promise<string>; // Returns schedule ID
  unschedule(scheduleId: string): Promise<boolean>;
  
  // Schedule management
  getScheduledCommands(): Promise<ScheduledCommand[]>;
  getUpcomingCommands(timeWindow: number): Promise<ScheduledCommand[]>;
  
  // Execution
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * Command schedule configuration
 */
export interface CommandSchedule {
  type: 'once' | 'recurring';
  executeAt?: Date;
  cronExpression?: string;
  interval?: number;
  maxExecutions?: number;
  enabled: boolean;
}

/**
 * Scheduled command
 */
export interface ScheduledCommand {
  scheduleId: string;
  command: Command;
  schedule: CommandSchedule;
  createdAt: Date;
  nextExecution?: Date;
  lastExecution?: Date;
  executionCount: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
}

/**
 * Command interceptor interface
 */
export interface CommandInterceptor {
  name: string;
  priority: number;
  
  beforeExecute?(command: Command, context: CommandContext): Promise<InterceptorResult>;
  afterExecute?(command: Command, result: CommandResult, context: CommandContext): Promise<void>;
  onError?(command: Command, error: Error, context: CommandContext): Promise<InterceptorResult>;
}

/**
 * Interceptor result
 */
export interface InterceptorResult {
  proceed: boolean;
  modifiedCommand?: Command;
  modifiedContext?: Partial<CommandContext>;
  reason?: string;
}

/**
 * Command bus interface - main orchestrator
 */
export interface CommandBus {
  // Core execution
  execute(command: Command, context?: Partial<CommandContext>): Promise<CommandResult>;
  executeAsync(command: Command, context?: Partial<CommandContext>): Promise<string>; // Returns execution ID
  
  // Queue operations
  enqueue(command: Command, context?: Partial<CommandContext>): Promise<string>;
  
  // Batch operations
  executeBatch(commands: Command[], strategy?: BatchExecutionStrategy): Promise<BatchResult>;
  
  // Undo/Redo
  undo(commandId?: string): Promise<CommandResult>;
  redo(commandId?: string): Promise<CommandResult>;
  
  // Scheduling
  schedule(command: Command, schedule: CommandSchedule): Promise<string>;
  
  // Interceptors
  addInterceptor(interceptor: CommandInterceptor): void;
  removeInterceptor(interceptorName: string): boolean;
  
  // Monitoring
  getStatistics(): Promise<CommandStatistics>;
  getHistory(filter?: CommandHistoryFilter): Promise<CommandHistoryEntry[]>;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * Batch execution result
 */
export interface BatchResult {
  batchId: string;
  success: boolean;
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  executionTime: number;
  results: CommandResult[];
  rollbacksExecuted: number;
  error?: string;
}

/**
 * Command bus configuration
 */
export interface CommandBusConfig {
  maxConcurrentCommands: number;
  defaultTimeout: number;
  enableHistory: boolean;
  enableScheduling: boolean;
  enableInterceptors: boolean;
  queueConfig: QueueConfig;
  retryPolicy: RetryPolicy;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxSize: number;
  priorityLevels: CommandPriority[];
  processingMode: 'fifo' | 'lifo' | 'priority';
  batchSize: number;
  processingInterval: number;
}

/**
 * Domain-specific command types for Sihat TCM
 */

// AI Model Commands
export interface SelectAIModelCommand extends Command {
  type: 'ai:select-model';
  data: {
    modelId: string;
    criteria: any;
    previousModelId?: string;
  };
}

export interface UpdateModelConfigCommand extends Command {
  type: 'ai:update-config';
  data: {
    modelId: string;
    configuration: any;
    previousConfiguration?: any;
  };
}

// Notification Commands
export interface ScheduleNotificationCommand extends Command {
  type: 'notification:schedule';
  data: {
    notificationRequest: any;
    scheduledNotificationId?: string;
  };
}

export interface UpdateNotificationPreferencesCommand extends Command {
  type: 'notification:update-preferences';
  data: {
    preferences: any;
    previousPreferences?: any;
  };
}

// System Commands
export interface SystemConfigurationCommand extends Command {
  type: 'system:configure';
  data: {
    component: string;
    configuration: any;
    previousConfiguration?: any;
  };
}

// TCM-specific Commands
export interface StartDiagnosisCommand extends Command {
  type: 'tcm:start-diagnosis';
  data: {
    patientId: string;
    diagnosticType: string;
    sessionData: any;
  };
}

export interface SaveDiagnosisResultCommand extends Command {
  type: 'tcm:save-diagnosis';
  data: {
    sessionId: string;
    results: any;
    previousResults?: any;
  };
}

/**
 * Union type for all domain commands
 */
export type DomainCommand = 
  | SelectAIModelCommand
  | UpdateModelConfigCommand
  | ScheduleNotificationCommand
  | UpdateNotificationPreferencesCommand
  | SystemConfigurationCommand
  | StartDiagnosisCommand
  | SaveDiagnosisResultCommand;