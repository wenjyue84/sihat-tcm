/**
 * Command history management with undo/redo support
 */

import { Command } from '../interfaces/CommandInterfaces';

export class CommandHistory {
  private history: Command[] = [];
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistorySize: number;
  private readonly maxUndoStackSize = 50;
  private readonly context = 'CommandHistory';

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add command to history
   */
  addToHistory(command: Command): void {
    this.history.push(command);
    
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Add command to undo stack
   */
  addToUndoStack(command: Command): void {
    if (command.undo && command.canUndo?.()) {
      this.undoStack.push(command);
      
      // Limit undo stack size
      if (this.undoStack.length > this.maxUndoStackSize) {
        this.undoStack = this.undoStack.slice(-this.maxUndoStackSize);
      }
    }
  }

  /**
   * Get command from undo stack
   */
  getFromUndoStack(): Command | undefined {
    return this.undoStack.pop();
  }

  /**
   * Add command to redo stack
   */
  addToRedoStack(command: Command): void {
    this.redoStack.push(command);
  }

  /**
   * Get command from redo stack
   */
  getFromRedoStack(): Command | undefined {
    return this.redoStack.pop();
  }

  /**
   * Clear redo stack (called when new command is executed)
   */
  clearRedoStack(): void {
    this.redoStack = [];
  }

  /**
   * Get command history
   */
  getHistory(limit?: number): Command[] {
    const history = [...this.history];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Clear all history
   */
  clearAll(): void {
    this.history = [];
    this.undoStack = [];
    this.redoStack = [];
    console.log(`[${this.context}] All history cleared`);
  }

  /**
   * Get history statistics
   */
  getStats(): {
    historySize: number;
    undoStackSize: number;
    redoStackSize: number;
  } {
    return {
      historySize: this.history.length,
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
    };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}