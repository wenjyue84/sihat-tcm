/**
 * Core command system interfaces and types
 */

/**
 * Base command interface
 */
export interface Command {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, any>;
  
  execute(): Promise<CommandResult>;
  undo?(): Promise<CommandResult>;
  canUndo?(): boolean;
  validate?(): Promise<ValidationResult>;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

/**
 * Command validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Command execution context
 */
export interface CommandContext {
  userId?: string;
  sessionId?: string;
  source: string;
  priority: number;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Command system statistics
 */
export interface CommandSystemStats {
  historySize: number;
  undoStackSize: number;
  redoStackSize: number;
  queueSize: number;
  isProcessing: boolean;
}