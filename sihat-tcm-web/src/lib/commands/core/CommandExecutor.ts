/**
 * Command execution engine with timeout and validation support
 */

import { Command, CommandResult, CommandContext } from '../interfaces/CommandInterfaces';

export class CommandExecutor {
  private readonly context = 'CommandExecutor';

  /**
   * Execute a command with validation and timeout
   */
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    try {
      console.log(`[${this.context}] Executing command: ${command.description}`);

      // Validate command if validation is available
      if (command.validate) {
        const validation = await command.validate();
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`,
            executionTime: 0,
          };
        }
      }

      // Execute command with timeout
      const result = await this.executeWithTimeout(command, context.timeout || 30000);
      return result;

    } catch (error) {
      console.error(`[${this.context}] Command execution failed`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
      };
    }
  }

  /**
   * Execute command with timeout protection
   */
  private async executeWithTimeout(command: Command, timeout: number): Promise<CommandResult> {
    return Promise.race([
      command.execute(),
      new Promise<CommandResult>((_, reject) => 
        setTimeout(() => reject(new Error('Command timeout')), timeout)
      ),
    ]);
  }

  /**
   * Execute undo operation with timeout
   */
  async undo(command: Command, timeout: number = 30000): Promise<CommandResult> {
    if (!command.undo || !command.canUndo?.()) {
      return {
        success: false,
        error: 'Command cannot be undone',
        executionTime: 0,
      };
    }

    try {
      return await Promise.race([
        command.undo(),
        new Promise<CommandResult>((_, reject) => 
          setTimeout(() => reject(new Error('Undo timeout')), timeout)
        ),
      ]);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
      };
    }
  }
}