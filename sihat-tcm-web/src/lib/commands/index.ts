/**
 * Command System - Main Export
 * 
 * Centralized exports for the command system with clean architecture.
 * Provides easy access to all command system components.
 */

// Core interfaces
export * from './interfaces/CommandInterfaces';

// Core implementations
export * from './core/CommandExecutor';
export * from './core/CommandQueue';
export * from './core/CommandHistory';

// Command implementations
export * from './implementations/AIModelCommand';
export * from './implementations/NotificationCommand';
export * from './implementations/BatchCommand';

// Main command system
export * from './CommandSystem';

// Re-export commonly used types and functions
export type {
  Command,
  CommandResult,
  CommandContext,
  CommandExecutor,
  CommandQueue,
  CommandHistory,
  BatchCommand,
} from './interfaces/CommandInterfaces';

export {
  createCommandExecutor,
  defaultCommandExecutor,
} from './core/CommandExecutor';

export {
  createCommandQueue,
  defaultCommandQueue,
} from './core/CommandQueue';

export {
  createCommandHistory,
  defaultCommandHistory,
} from './core/CommandHistory';

export {
  createBatchCommand,
} from './implementations/BatchCommand';

export {
  AIModelCommandFactory,
} from './implementations/AIModelCommand';

export {
  NotificationCommandFactory,
} from './implementations/NotificationCommand';

export {
  createCommandSystem,
  defaultCommandSystem,
  executeCommand,
  executeCommandAsync,
  executeBatch,
  undoCommand,
  redoCommand,
} from './CommandSystem';