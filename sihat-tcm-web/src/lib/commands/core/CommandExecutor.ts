/**
 * Command Executor Core Implementation
 *
 * Handles command execution with retry logic, timeout management,
 * and comprehensive error handling.
 */

import {
  Command,
  CommandExecutor,
  CommandResult,
  CommandContext,
  RetryPolicy,
  ValidationResult,
} from "../interfaces/CommandInterfaces";

import { devLog, logError } from "../../systemLogger";
import { ErrorFactory } from "../../errors/AppError";

/**
 * Enhanced command executor with advanced features
 */
export class EnhancedCommandExecutor implements CommandExecutor {
  private readonly context: string;
  private readonly config: CommandExecutorConfig;

  // Execution tracking
  private activeExecutions = new Map<string, ExecutionInfo>();
  private executionStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalExecutionTime: 0,
  };

  constructor(context: string = "CommandExecutor", config: Partial<CommandExecutorConfig> = {}) {
    this.context = context;
    this.config = {
      defaultTimeout: 30000,
      maxConcurrentExecutions: 10,
      enableValidation: true,
      enableMetrics: true,
      enableHooks: true,
      ...config,
    };
  }

  /**
   * Execute a command with full lifecycle management
   */
  public async execute(
    command: Command,
    context?: Partial<CommandContext>
  ): Promise<CommandResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    const executionContext: CommandContext = {
      source: "direct",
      priority: "normal",
      timeout: this.config.defaultTimeout,
      retryAttempts: 0,
      dryRun: false,
      skipValidation: false,
      ...context,
    };

    try {
      // Check concurrent execution limit
      if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
        throw new Error(
          `Maximum concurrent executions (${this.config.maxConcurrentExecutions}) exceeded`
        );
      }

      // Track execution
      this.activeExecutions.set(executionId, {
        command,
        context: executionContext,
        startTime: new Date(),
      });

      devLog("debug", this.context, `Executing command: ${command.description}`, {
        commandId: command.id,
        executionId,
        dryRun: executionContext.dryRun,
      });

      // Pre-execution validation
      if (this.config.enableValidation && !executionContext.skipValidation) {
        await this.validateCommand(command);
      }

      // Check if we can execute
      const canExecute = await this.canExecute(command);
      if (!canExecute) {
        throw new Error(`Command cannot be executed: ${command.id}`);
      }

      // Execute lifecycle hooks
      if (this.config.enableHooks) {
        await this.executeBeforeHook(command);
      }

      // Execute the command
      const result = executionContext.dryRun
        ? await this.dryRunExecution(command)
        : await this.executeWithTimeout(command, executionContext.timeout!);

      // Execute after hook
      if (this.config.enableHooks) {
        await this.executeAfterHook(command, result);
      }

      // Update statistics
      if (this.config.enableMetrics) {
        this.updateExecutionStats(Date.now() - startTime, true);
      }

      devLog("debug", this.context, `Command executed successfully: ${command.id}`, {
        executionTime: result.executionTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Execute error hook
      if (this.config.enableHooks && command.onError) {
        try {
          await command.onError(error as Error);
        } catch (hookError) {
          logError(this.context, "Error hook failed", { error: hookError instanceof Error ? hookError.message : String(hookError) });
        }
      }

      // Update statistics
      if (this.config.enableMetrics) {
        this.updateExecutionStats(executionTime, false);
      }

      const commandResult: CommandResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime,
        metadata: {
          commandId: command.id,
          executionId,
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      };

      logError(this.context, `Command execution failed: ${command.id}`, { error: error instanceof Error ? error.message : String(error) });
      return commandResult;
    } finally {
      // Clean up execution tracking
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute command with retry logic
   */
  public async executeWithRetry(
    command: Command,
    retryPolicy: RetryPolicy,
    context?: Partial<CommandContext>
  ): Promise<CommandResult> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retryPolicy.maxAttempts) {
      try {
        const result = await this.execute(command, {
          ...context,
          metadata: {
            ...context?.metadata,
            attempt: attempt + 1,
            maxAttempts: retryPolicy.maxAttempts + 1,
          },
        });

        // If successful, return result
        if (result.success) {
          return result;
        }

        // Check if error is retryable
        if (!this.isRetryableError(result.error, retryPolicy)) {
          return result;
        }

        lastError = new Error(result.error);
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryableError(lastError.message, retryPolicy)) {
          throw error;
        }
      }

      attempt++;

      // If this is not the last attempt, wait before retrying
      if (attempt <= retryPolicy.maxAttempts) {
        const delay = this.calculateRetryDelay(attempt, retryPolicy);
        devLog(
          "debug", this.context,
          `Retrying command in ${delay}ms (attempt ${attempt + 1}/${retryPolicy.maxAttempts + 1})`
        );
        await this.delay(delay);
      }
    }

    // All retries exhausted
    throw ErrorFactory.fromUnknownError(lastError!, {
      component: this.context,
      action: "executeWithRetry",
      metadata: {
        commandId: command.id,
        attempts: attempt,
        maxAttempts: retryPolicy.maxAttempts,
      },
    });
  }

  /**
   * Check if command can be executed
   */
  public async canExecute(command: Command): Promise<boolean> {
    try {
      // Check if command has required methods
      if (typeof command.execute !== "function") {
        return false;
      }

      // Validate command structure
      if (!command.id || !command.type || !command.description) {
        return false;
      }

      // Check dependencies if any
      if (command.metadata?.dependencies) {
        // In a real implementation, you'd check if dependencies are satisfied
        // For now, we'll assume they are
      }

      // Custom validation if available
      if (command.validate) {
        const validation = await command.validate();
        return validation.valid;
      }

      return true;
    } catch (error) {
      logError(this.context, "Error checking if command can execute", { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Estimate command execution time
   */
  public async estimateExecutionTime(command: Command): Promise<number> {
    try {
      // Use metadata timeout if available
      if (command.metadata?.timeout) {
        return command.metadata.timeout;
      }

      // Use command type-based estimation
      const baseEstimate = this.getBaseExecutionEstimate(command.type);

      // Adjust based on command complexity
      const complexityMultiplier = this.getComplexityMultiplier(command);

      return Math.round(baseEstimate * complexityMultiplier);
    } catch (error) {
      logError(this.context, "Error estimating execution time", { error: error instanceof Error ? error.message : String(error) });
      return this.config.defaultTimeout;
    }
  }

  /**
   * Get execution statistics
   */
  public getExecutionStatistics(): ExecutionStatistics {
    const averageExecutionTime =
      this.executionStats.totalExecutions > 0
        ? this.executionStats.totalExecutionTime / this.executionStats.totalExecutions
        : 0;

    const successRate =
      this.executionStats.totalExecutions > 0
        ? this.executionStats.successfulExecutions / this.executionStats.totalExecutions
        : 0;

    return {
      totalExecutions: this.executionStats.totalExecutions,
      successfulExecutions: this.executionStats.successfulExecutions,
      failedExecutions: this.executionStats.failedExecutions,
      averageExecutionTime,
      successRate,
      activeExecutions: this.activeExecutions.size,
      maxConcurrentExecutions: this.config.maxConcurrentExecutions,
    };
  }

  /**
   * Get currently active executions
   */
  public getActiveExecutions(): ExecutionInfo[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel an active execution
   */
  public async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      // In a real implementation, you'd need to implement cancellation logic
      // This might involve setting a cancellation token or flag
      this.activeExecutions.delete(executionId);

      devLog("debug", this.context, `Execution cancelled: ${executionId}`);
      return true;
    } catch (error) {
      logError(this.context, "Failed to cancel execution", { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // Private helper methods

  /**
   * Validate command before execution
   */
  private async validateCommand(command: Command): Promise<void> {
    // Basic structure validation
    if (!command.id || typeof command.id !== "string") {
      throw new Error("Command must have a valid ID");
    }

    if (!command.type || typeof command.type !== "string") {
      throw new Error("Command must have a valid type");
    }

    if (!command.description || typeof command.description !== "string") {
      throw new Error("Command must have a valid description");
    }

    if (typeof command.execute !== "function") {
      throw new Error("Command must have an execute method");
    }

    // Custom validation if available
    if (command.validate) {
      const validation = await command.validate();
      if (!validation.valid) {
        throw new Error(`Command validation failed: ${validation.errors.join(", ")}`);
      }
    }
  }

  /**
   * Execute command with timeout
   */
  private async executeWithTimeout(command: Command, timeout: number): Promise<CommandResult> {
    return Promise.race([
      command.execute(),
      new Promise<CommandResult>((_, reject) =>
        setTimeout(() => reject(new Error("Command execution timeout")), timeout)
      ),
    ]);
  }

  /**
   * Execute dry run (simulation)
   */
  private async dryRunExecution(command: Command): Promise<CommandResult> {
    // Simulate execution without side effects
    const estimatedTime = await this.estimateExecutionTime(command);

    return {
      success: true,
      executionTime: estimatedTime,
      metadata: {
        dryRun: true,
        estimatedTime,
      },
      warnings: ["This was a dry run - no actual changes were made"],
    };
  }

  /**
   * Execute before hook
   */
  private async executeBeforeHook(command: Command): Promise<void> {
    if (command.beforeExecute) {
      try {
        await command.beforeExecute();
      } catch (error) {
        throw new Error(`Before execute hook failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Execute after hook
   */
  private async executeAfterHook(command: Command, result: CommandResult): Promise<void> {
    if (command.afterExecute) {
      try {
        await command.afterExecute(result);
      } catch (error) {
        logError(this.context, "After execute hook failed", { error: error instanceof Error ? error.message : String(error) });
        // Don't throw here as the main execution was successful
      }
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorMessage: string | undefined, retryPolicy: RetryPolicy): boolean {
    if (!errorMessage) return false;

    // If specific retryable errors are defined, check against them
    if (retryPolicy.retryableErrors && retryPolicy.retryableErrors.length > 0) {
      return retryPolicy.retryableErrors.some((retryableError) =>
        errorMessage.toLowerCase().includes(retryableError.toLowerCase())
      );
    }

    // Default retryable error patterns
    const retryablePatterns = [
      "timeout",
      "network",
      "connection",
      "temporary",
      "rate limit",
      "service unavailable",
    ];

    return retryablePatterns.some((pattern) => errorMessage.toLowerCase().includes(pattern));
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    let delay: number;

    switch (retryPolicy.backoffStrategy) {
      case "linear":
        delay = retryPolicy.baseDelay * attempt;
        break;
      case "exponential":
        delay = retryPolicy.baseDelay * Math.pow(2, attempt - 1);
        break;
      case "fixed":
      default:
        delay = retryPolicy.baseDelay;
        break;
    }

    // Apply jitter if enabled
    if (retryPolicy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Ensure delay doesn't exceed maximum
    return Math.min(delay, retryPolicy.maxDelay);
  }

  /**
   * Get base execution estimate for command type
   */
  private getBaseExecutionEstimate(commandType: string): number {
    const estimates: Record<string, number> = {
      "ai:select-model": 1000,
      "ai:update-config": 500,
      "notification:schedule": 200,
      "notification:update-preferences": 300,
      "system:configure": 1500,
      "tcm:start-diagnosis": 2000,
      "tcm:save-diagnosis": 800,
    };

    return estimates[commandType] || 1000; // Default 1 second
  }

  /**
   * Get complexity multiplier based on command
   */
  private getComplexityMultiplier(command: Command): number {
    let multiplier = 1.0;

    // Check metadata for complexity indicators
    if (command.metadata?.tags) {
      if (command.metadata.tags.includes("complex")) multiplier *= 2.0;
      if (command.metadata.tags.includes("batch")) multiplier *= 1.5;
      if (command.metadata.tags.includes("async")) multiplier *= 0.8;
    }

    // Check for dependencies
    if (command.metadata?.dependencies?.length) {
      multiplier *= 1 + command.metadata.dependencies.length * 0.2;
    }

    return multiplier;
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(executionTime: number, success: boolean): void {
    this.executionStats.totalExecutions++;
    this.executionStats.totalExecutionTime += executionTime;

    if (success) {
      this.executionStats.successfulExecutions++;
    } else {
      this.executionStats.failedExecutions++;
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Command executor configuration
 */
export interface CommandExecutorConfig {
  defaultTimeout: number;
  maxConcurrentExecutions: number;
  enableValidation: boolean;
  enableMetrics: boolean;
  enableHooks: boolean;
}

/**
 * Execution information for tracking
 */
export interface ExecutionInfo {
  command: Command;
  context: CommandContext;
  startTime: Date;
}

/**
 * Execution statistics
 */
export interface ExecutionStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  activeExecutions: number;
  maxConcurrentExecutions: number;
}

/**
 * Factory function for creating command executor
 */
export function createCommandExecutor(
  context?: string,
  config?: Partial<CommandExecutorConfig>
): CommandExecutor {
  return new EnhancedCommandExecutor(context, config);
}

/**
 * Default command executor instance
 */
export const defaultCommandExecutor = new EnhancedCommandExecutor();
