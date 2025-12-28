/**
 * Command System - Modular Architecture
 * 
 * This is the new modular approach to command system.
 * Use these exports for new code instead of the monolithic CommandSystem.ts
 */

// Main command system
export { CommandSystem, defaultCommandSystem } from './CommandSystem';

// Core interfaces
export type {
  Command,
  CommandResult,
  ValidationResult,
  CommandContext,
  CommandSystemStats
} from './interfaces/CommandInterfaces';

// Core components
export { CommandExecutor } from './core/CommandExecutor';
export { CommandQueue } from './core/CommandQueue';
export { CommandHistory } from './core/CommandHistory';

// Command implementations
export { SelectAIModelCommand } from './implementations/AIModelCommand';
export { ScheduleNotificationCommand } from './implementations/NotificationCommand';
export { BatchCommand } from './implementations/BatchCommand';

// Convenience functions
export {
  executeCommand,
  queueCommand,
  undoCommand,
  redoCommand
} from './CommandSystem';

// Convenience function for quick setup
export function createCommandSystem(): CommandSystem {
  return CommandSystem.getInstance();
}