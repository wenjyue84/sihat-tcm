/**
 * Batch Command Implementation
 * 
 * Command implementation for executing multiple commands as a batch
 * with different execution strategies and rollback support.
 */

import {
  Command,
  CommandResult,
  BatchCommand,
  BatchExecutionStrategy,
  BatchRollbackStrategy,
  ExecutionPlan,
  ExecutionStep,
  CommandDependency,
  RiskAssessment,
} from '../interfaces/CommandInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Batch command implementation with advanced execution strategies
 */
export class BatchCommandImpl implements BatchCommand {
  public readonly id: string;
  public readonly type = 'batch:execute' as const;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly metadata?: any;

  public commands: Command[] = [];
  public executionStrategy: BatchExecutionStrategy;
  public rollbackStrategy: BatchRollbackStrategy;

  private executionResults: Map<string, CommandResult> = new Map();
  private executionOrder: string[] = [];
  private readonly commandExecutor: any; // Would be properly typed in real implementation

  constructor(
    commands: Command[] = [],
    executionStrategy: BatchExecutionStrategy = 'sequential',
    rollbackStrategy: BatchRollbackStrategy = 'all_or_nothing',
    commandExecutor: any,
    metadata?: any
  ) {
    this.id = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = `Batch execution of ${commands.length} commands`;
    this.timestamp = new Date();
    this.metadata = metadata;
    this.commands = [...commands];
    this.executionStrategy = executionStrategy;
    this.rollbackStrategy = rollbackStrategy;
    this.commandExecutor = commandExecutor;
  }

  /**
   * Execute all commands in the batch
   */
  public async execute(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog(`[BatchCommand] Executing batch with ${this.commands.length} commands`, {
        batchId: this.id,
        strategy: this.executionStrategy,
        rollbackStrategy: this.rollbackStrategy,
      });

      if (this.commands.length === 0) {
        return {
          success: true,
          data: { executedCommands: 0 },
          executionTime: Date.now() - startTime,
          metadata: { batchId: this.id },
        };
      }

      // Generate execution plan
      const executionPlan = this.getExecutionPlan();
      
      devLog(`[BatchCommand] Execution plan generated`, {
        steps: executionPlan.steps.length,
        estimatedTime: executionPlan.estimatedTime,
        riskLevel: executionPlan.riskAssessment.riskLevel,
      });

      // Execute based on strategy
      let results: CommandResult[];
      
      switch (this.executionStrategy) {
        case 'parallel':
          results = await this.executeParallel();
          break;
        case 'pipeline':
          results = await this.executePipeline();
          break;
        case 'conditional':
          results = await this.executeConditional();
          break;
        case 'sequential':
        default:
          results = await this.executeSequential();
          break;
      }

      // Analyze results
      const successfulCommands = results.filter(r => r.success).length;
      const failedCommands = results.filter(r => !r.success).length;
      const allSuccessful = failedCommands === 0;

      // Handle rollback if needed
      if (!allSuccessful && this.shouldRollback(failedCommands, successfulCommands)) {
        await this.performRollback();
      }

      const executionTime = Date.now() - startTime;

      return {
        success: allSuccessful,
        data: {
          totalCommands: this.commands.length,
          successfulCommands,
          failedCommands,
          results,
          executionOrder: this.executionOrder,
        },
        executionTime,
        metadata: {
          batchId: this.id,
          strategy: this.executionStrategy,
          rollbackExecuted: !allSuccessful && this.shouldRollback(failedCommands, successfulCommands),
        },
        warnings: !allSuccessful ? [`${failedCommands} commands failed`] : undefined,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logError(`[BatchCommand] Batch execution failed`, error);

      // Attempt rollback on critical failure
      try {
        await this.performRollback();
      } catch (rollbackError) {
        logError(`[BatchCommand] Rollback also failed`, rollbackError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch execution failed',
        executionTime,
        metadata: {
          batchId: this.id,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Undo the batch execution (rollback all commands)
   */
  public async undo(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog(`[BatchCommand] Undoing batch execution`, { batchId: this.id });

      const rollbackResults = await this.performRollback();
      const executionTime = Date.now() - startTime;

      return {
        success: rollbackResults.every(r => r.success),
        data: {
          rolledBackCommands: rollbackResults.length,
          rollbackResults,
        },
        executionTime,
        metadata: {
          batchId: this.id,
          operation: 'undo',
        },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch undo failed',
        executionTime,
        metadata: {
          batchId: this.id,
          operation: 'undo',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Check if batch can be undone
   */
  public canUndo(): boolean {
    return this.executionResults.size > 0 && 
           Array.from(this.executionResults.values()).some(result => result.success);
  }

  /**
   * Add command to batch
   */
  public addCommand(command: Command): void {
    this.commands.push(command);
    devLog(`[BatchCommand] Command added to batch`, {
      batchId: this.id,
      commandId: command.id,
      totalCommands: this.commands.length,
    });
  }

  /**
   * Remove command from batch
   */
  public removeCommand(commandId: string): boolean {
    const initialLength = this.commands.length;
    this.commands = this.commands.filter(cmd => cmd.id !== commandId);
    
    const removed = this.commands.length < initialLength;
    if (removed) {
      devLog(`[BatchCommand] Command removed from batch`, {
        batchId: this.id,
        commandId,
        remainingCommands: this.commands.length,
      });
    }
    
    return removed;
  }

  /**
   * Get all commands in batch
   */
  public getCommands(): Command[] {
    return [...this.commands];
  }

  /**
   * Get execution plan for the batch
   */
  public getExecutionPlan(): ExecutionPlan {
    const steps = this.generateExecutionSteps();
    const estimatedTime = this.estimateTotalExecutionTime();
    const dependencies = this.analyzeDependencies();
    const riskAssessment = this.assessRisk();

    return {
      steps,
      estimatedTime,
      dependencies,
      riskAssessment,
    };
  }

  // Private execution methods

  /**
   * Execute commands sequentially
   */
  private async executeSequential(): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of this.commands) {
      try {
        const result = await this.commandExecutor.execute(command);
        this.executionResults.set(command.id, result);
        this.executionOrder.push(command.id);
        results.push(result);

        // Stop on first failure if using all_or_nothing rollback
        if (!result.success && this.rollbackStrategy === 'all_or_nothing') {
          break;
        }
      } catch (error) {
        const errorResult: CommandResult = {
          testId: command.id,
          success: false,
          executionTime: 0,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        
        this.executionResults.set(command.id, errorResult);
        results.push(errorResult);
        
        if (this.rollbackStrategy === 'all_or_nothing') {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute commands in parallel
   */
  private async executeParallel(): Promise<CommandResult[]> {
    const promises = this.commands.map(async (command) => {
      try {
        const result = await this.commandExecutor.execute(command);
        this.executionResults.set(command.id, result);
        this.executionOrder.push(command.id);
        return result;
      } catch (error) {
        const errorResult: CommandResult = {
          testId: command.id,
          success: false,
          executionTime: 0,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        
        this.executionResults.set(command.id, errorResult);
        return errorResult;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Execute commands in pipeline (output of one feeds into next)
   */
  private async executePipeline(): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    let pipelineData: any = null;

    for (const command of this.commands) {
      try {
        // Pass pipeline data to command if supported
        const contextWithPipeline = pipelineData ? { pipelineData } : {};
        const result = await this.commandExecutor.execute(command, contextWithPipeline);
        
        this.executionResults.set(command.id, result);
        this.executionOrder.push(command.id);
        results.push(result);

        // Update pipeline data for next command
        if (result.success && result.data) {
          pipelineData = result.data;
        }

        // Stop pipeline on failure
        if (!result.success) {
          break;
        }
      } catch (error) {
        const errorResult: CommandResult = {
          testId: command.id,
          success: false,
          executionTime: 0,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        
        this.executionResults.set(command.id, errorResult);
        results.push(errorResult);
        break; // Stop pipeline on error
      }
    }

    return results;
  }

  /**
   * Execute commands conditionally (based on previous results)
   */
  private async executeConditional(): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of this.commands) {
      // Check if command should execute based on previous results
      const shouldExecute = this.shouldExecuteCommand(command, results);
      
      if (!shouldExecute) {
        // Skip this command
        const skippedResult: CommandResult = {
          testId: command.id,
          success: true,
          executionTime: 0,
          metadata: { skipped: true, reason: 'conditional_skip' },
        };
        
        results.push(skippedResult);
        continue;
      }

      try {
        const result = await this.commandExecutor.execute(command);
        this.executionResults.set(command.id, result);
        this.executionOrder.push(command.id);
        results.push(result);
      } catch (error) {
        const errorResult: CommandResult = {
          testId: command.id,
          success: false,
          executionTime: 0,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        
        this.executionResults.set(command.id, errorResult);
        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Perform rollback based on strategy
   */
  private async performRollback(): Promise<CommandResult[]> {
    const rollbackResults: CommandResult[] = [];

    switch (this.rollbackStrategy) {
      case 'all_or_nothing':
        // Rollback all successfully executed commands in reverse order
        for (const commandId of [...this.executionOrder].reverse()) {
          const command = this.commands.find(cmd => cmd.id === commandId);
          if (command && command.undo && command.canUndo?.()) {
            try {
              const rollbackResult = await command.undo();
              rollbackResults.push(rollbackResult);
            } catch (error) {
              rollbackResults.push({
                testId: commandId,
                success: false,
                executionTime: 0,
                error: error instanceof Error ? error : new Error('Rollback failed'),
              });
            }
          }
        }
        break;

      case 'best_effort':
        // Try to rollback as many as possible, continue on failures
        for (const commandId of [...this.executionOrder].reverse()) {
          const command = this.commands.find(cmd => cmd.id === commandId);
          if (command && command.undo && command.canUndo?.()) {
            try {
              const rollbackResult = await command.undo();
              rollbackResults.push(rollbackResult);
            } catch (error) {
              // Log but continue with other rollbacks
              logError(`[BatchCommand] Rollback failed for command ${commandId}`, error);
              rollbackResults.push({
                testId: commandId,
                success: false,
                executionTime: 0,
                error: error instanceof Error ? error : new Error('Rollback failed'),
              });
            }
          }
        }
        break;

      case 'manual':
      case 'none':
      default:
        // No automatic rollback
        break;
    }

    return rollbackResults;
  }

  // Private helper methods

  /**
   * Check if rollback should be performed
   */
  private shouldRollback(failedCommands: number, successfulCommands: number): boolean {
    switch (this.rollbackStrategy) {
      case 'all_or_nothing':
        return failedCommands > 0;
      case 'best_effort':
        return failedCommands > successfulCommands; // Rollback if more failures than successes
      case 'manual':
      case 'none':
      default:
        return false;
    }
  }

  /**
   * Check if a command should execute in conditional mode
   */
  private shouldExecuteCommand(command: Command, previousResults: CommandResult[]): boolean {
    // Simple conditional logic - could be made more sophisticated
    // For now, execute if no previous failures or if command has high priority
    const hasPreviousFailures = previousResults.some(r => !r.success);
    const isHighPriority = command.metadata?.priority === 'high' || command.metadata?.priority === 'urgent';
    
    return !hasPreviousFailures || isHighPriority;
  }

  /**
   * Generate execution steps for the plan
   */
  private generateExecutionSteps(): ExecutionStep[] {
    // Simple implementation - could be made more sophisticated with dependency analysis
    return [{
      stepId: 'step-1',
      commands: this.commands,
      executionMode: this.executionStrategy === 'parallel' ? 'parallel' : 'sequential',
      dependencies: [],
    }];
  }

  /**
   * Estimate total execution time
   */
  private estimateTotalExecutionTime(): number {
    const baseTime = 1000; // 1 second per command base time
    const commandCount = this.commands.length;
    
    switch (this.executionStrategy) {
      case 'parallel':
        return baseTime * 2; // Parallel execution, but with overhead
      case 'sequential':
      case 'pipeline':
      case 'conditional':
      default:
        return baseTime * commandCount;
    }
  }

  /**
   * Analyze command dependencies
   */
  private analyzeDependencies(): CommandDependency[] {
    // Simple implementation - in a real system, this would analyze actual dependencies
    return this.commands.map(command => ({
      commandId: command.id,
      dependsOn: [],
      dependencyType: 'soft',
    }));
  }

  /**
   * Assess execution risk
   */
  private assessRisk(): RiskAssessment {
    const commandCount = this.commands.length;
    const hasUndoableCommands = this.commands.some(cmd => cmd.undo && cmd.canUndo?.());
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    const riskFactors: string[] = [];
    const mitigations: string[] = [];

    if (commandCount > 10) {
      riskLevel = 'high';
      riskFactors.push('Large number of commands');
    } else if (commandCount > 5) {
      riskLevel = 'medium';
      riskFactors.push('Moderate number of commands');
    } else {
      riskLevel = 'low';
    }

    if (!hasUndoableCommands) {
      riskFactors.push('Commands not undoable');
      if (riskLevel === 'low') riskLevel = 'medium';
    } else {
      mitigations.push('Commands support undo operations');
    }

    if (this.rollbackStrategy === 'none') {
      riskFactors.push('No rollback strategy');
      if (riskLevel !== 'critical') riskLevel = 'high';
    } else {
      mitigations.push(`Rollback strategy: ${this.rollbackStrategy}`);
    }

    const rollbackComplexity = hasUndoableCommands ? 'simple' : 'complex';

    return {
      riskLevel,
      riskFactors,
      mitigations,
      rollbackComplexity,
    };
  }
}

/**
 * Factory function for creating batch commands
 */
export function createBatchCommand(
  commands: Command[] = [],
  executionStrategy: BatchExecutionStrategy = 'sequential',
  rollbackStrategy: BatchRollbackStrategy = 'all_or_nothing',
  commandExecutor: any
): BatchCommand {
  return new BatchCommandImpl(commands, executionStrategy, rollbackStrategy, commandExecutor);
}