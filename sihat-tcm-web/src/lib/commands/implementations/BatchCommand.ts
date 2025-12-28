/**
 * Batch Command - Executes multiple commands as a transaction
 */

import { Command, CommandResult } from '../interfaces/CommandInterfaces';

export class BatchCommand implements Command {
  public readonly id: string;
  public readonly type = 'batch';
  public readonly description: string;
  public readonly timestamp = new Date();
  public readonly metadata?: Record<string, any>;

  private executedCommands: Command[] = [];

  constructor(
    private commands: Command[],
    description?: string,
    metadata?: Record<string, any>
  ) {
    this.id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.description = description || `Batch of ${commands.length} commands`;
    this.metadata = metadata;
  }

  async execute(): Promise<CommandResult> {
    const startTime = Date.now();
    const results: CommandResult[] = [];
    
    try {
      for (const command of this.commands) {
        const result = await command.execute();
        results.push(result);
        
        if (result.success) {
          this.executedCommands.push(command);
        } else {
          // Rollback on failure
          await this.rollback();
          return {
            success: false,
            error: `Batch failed at command: ${command.description}`,
            executionTime: Date.now() - startTime,
            metadata: {
              failedCommand: command.id,
              results,
            },
          };
        }
      }
      
      return {
        success: true,
        data: { results },
        executionTime: Date.now() - startTime,
        metadata: {
          commandCount: this.commands.length,
          executedCount: this.executedCommands.length,
        },
      };
    } catch (error) {
      await this.rollback();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async undo(): Promise<CommandResult> {
    return this.rollback();
  }

  canUndo(): boolean {
    return this.executedCommands.length > 0;
  }

  private async rollback(): Promise<CommandResult> {
    const startTime = Date.now();
    const rollbackResults: CommandResult[] = [];
    
    // Undo in reverse order
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      if (command.undo && command.canUndo?.()) {
        const result = await command.undo();
        rollbackResults.push(result);
      }
    }
    
    this.executedCommands = [];
    
    return {
      success: true,
      data: { rollbackResults },
      executionTime: Date.now() - startTime,
      metadata: {
        rolledBackCount: rollbackResults.length,
      },
    };
  }
}