/**
 * Command History Core Implementation
 * 
 * Comprehensive command history management with undo/redo support,
 * analytics, and advanced filtering capabilities.
 */

import {
  Command,
  CommandResult,
  CommandContext,
  CommandHistory,
  CommandHistoryEntry,
  CommandHistoryFilter,
  CommandStatistics,
  TimeRange,
  PerformanceTrend,
} from '../interfaces/CommandInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Enhanced command history implementation
 */
export class EnhancedCommandHistory implements CommandHistory {
  private history = new Map<string, CommandHistoryEntry>();
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private readonly context: string;
  private readonly config: CommandHistoryConfig;
  
  // Performance tracking
  private performanceData: PerformanceTrend[] = [];

  constructor(context: string = 'CommandHistory', config: Partial<CommandHistoryConfig> = {}) {
    this.context = context;
    this.config = {
      maxHistorySize: 10000,
      maxUndoStackSize: 100,
      enableAnalytics: true,
      enablePerformanceTracking: true,
      autoCleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    // Set up auto cleanup if enabled
    if (this.config.autoCleanupInterval > 0) {
      setInterval(() => {
        this.performAutoCleanup();
      }, this.config.autoCleanupInterval);
    }
  }

  /**
   * Record a command execution in history
   */
  public async record(command: Command, result: CommandResult, context: CommandContext): Promise<void> {
    try {
      const entry: CommandHistoryEntry = {
        command,
        result,
        context,
        executedAt: new Date(),
        undoable: Boolean(command.undo && command.canUndo?.()),
      };

      // Add to history
      this.history.set(command.id, entry);

      // Add to undo stack if undoable
      if (entry.undoable && result.success) {
        this.undoStack.push(command.id);
        
        // Limit undo stack size
        if (this.undoStack.length > this.config.maxUndoStackSize) {
          this.undoStack = this.undoStack.slice(-this.config.maxUndoStackSize);
        }
        
        // Clear redo stack when new command is executed
        this.redoStack = [];
      }

      // Track performance data
      if (this.config.enablePerformanceTracking) {
        this.recordPerformanceData(entry);
      }

      // Manage history size
      if (this.history.size > this.config.maxHistorySize) {
        this.cleanupOldEntries();
      }

      devLog(`[${this.context}] Command recorded in history: ${command.description}`, {
        commandId: command.id,
        success: result.success,
        undoable: entry.undoable,
        historySize: this.history.size,
      });

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'record',
        metadata: { commandId: command.id },
      });
    }
  }

  /**
   * Get command history with optional filtering
   */
  public async getHistory(filter?: CommandHistoryFilter): Promise<CommandHistoryEntry[]> {
    try {
      let entries = Array.from(this.history.values());

      if (filter) {
        entries = this.applyFilter(entries, filter);
      }

      // Sort by execution time (most recent first)
      entries.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

      // Apply limit and offset
      if (filter?.offset) {
        entries = entries.slice(filter.offset);
      }
      
      if (filter?.limit) {
        entries = entries.slice(0, filter.limit);
      }

      return entries;

    } catch (error) {
      logError(`[${this.context}] Error getting history`, error);
      return [];
    }
  }

  /**
   * Get specific command from history
   */
  public async getCommand(commandId: string): Promise<CommandHistoryEntry | null> {
    return this.history.get(commandId) || null;
  }

  /**
   * Get undoable commands
   */
  public async getUndoableCommands(): Promise<CommandHistoryEntry[]> {
    const undoableIds = [...this.undoStack].reverse(); // Most recent first
    const entries: CommandHistoryEntry[] = [];

    for (const commandId of undoableIds) {
      const entry = this.history.get(commandId);
      if (entry && entry.undoable && !entry.undoneAt) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Get redoable commands
   */
  public async getRedoableCommands(): Promise<CommandHistoryEntry[]> {
    const redoableIds = [...this.redoStack].reverse(); // Most recent first
    const entries: CommandHistoryEntry[] = [];

    for (const commandId of redoableIds) {
      const entry = this.history.get(commandId);
      if (entry && entry.undoneAt && !entry.redoneAt) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Mark command as undone
   */
  public markAsUndone(commandId: string): boolean {
    const entry = this.history.get(commandId);
    if (!entry) {
      return false;
    }

    entry.undoneAt = new Date();
    
    // Move from undo stack to redo stack
    const undoIndex = this.undoStack.indexOf(commandId);
    if (undoIndex !== -1) {
      this.undoStack.splice(undoIndex, 1);
      this.redoStack.push(commandId);
    }

    devLog(`[${this.context}] Command marked as undone: ${entry.command.description}`, { commandId });
    return true;
  }

  /**
   * Mark command as redone
   */
  public markAsRedone(commandId: string): boolean {
    const entry = this.history.get(commandId);
    if (!entry) {
      return false;
    }

    entry.redoneAt = new Date();
    entry.undoneAt = undefined; // Clear undo timestamp
    
    // Move from redo stack to undo stack
    const redoIndex = this.redoStack.indexOf(commandId);
    if (redoIndex !== -1) {
      this.redoStack.splice(redoIndex, 1);
      this.undoStack.push(commandId);
    }

    devLog(`[${this.context}] Command marked as redone: ${entry.command.description}`, { commandId });
    return true;
  }

  /**
   * Get comprehensive statistics
   */
  public async getStatistics(timeRange?: TimeRange): Promise<CommandStatistics> {
    try {
      let entries = Array.from(this.history.values());

      // Apply time range filter if provided
      if (timeRange) {
        entries = entries.filter(entry => 
          entry.executedAt >= timeRange.start && entry.executedAt <= timeRange.end
        );
      }

      const totalCommands = entries.length;
      const successfulCommands = entries.filter(entry => entry.result.success).length;
      const failedCommands = totalCommands - successfulCommands;

      // Calculate average execution time
      const executionTimes = entries.map(entry => entry.result.executionTime);
      const averageExecutionTime = executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
        : 0;

      // Group by command type
      const commandsByType: Record<string, number> = {};
      entries.forEach(entry => {
        commandsByType[entry.command.type] = (commandsByType[entry.command.type] || 0) + 1;
      });

      // Group by user
      const commandsByUser: Record<string, number> = {};
      entries.forEach(entry => {
        const userId = entry.context.userId || 'unknown';
        commandsByUser[userId] = (commandsByUser[userId] || 0) + 1;
      });

      // Group errors by type
      const errorsByType: Record<string, number> = {};
      entries
        .filter(entry => !entry.result.success && entry.result.error)
        .forEach(entry => {
          const errorType = this.extractErrorType(entry.result.error!);
          errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        });

      // Get performance trends
      const performanceTrends = timeRange 
        ? this.getPerformanceTrends(timeRange)
        : this.performanceData.slice(-100); // Last 100 data points

      return {
        totalCommands,
        successfulCommands,
        failedCommands,
        averageExecutionTime,
        commandsByType,
        commandsByUser,
        errorsByType,
        performanceTrends,
      };

    } catch (error) {
      logError(`[${this.context}] Error getting statistics`, error);
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'getStatistics',
      });
    }
  }

  /**
   * Get commands by type
   */
  public async getCommandsByType(commandType: string): Promise<CommandHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => entry.command.type === commandType)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  /**
   * Clear history older than specified date
   */
  public async clearHistory(olderThan?: Date): Promise<number> {
    const cutoffDate = olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    let clearedCount = 0;

    for (const [commandId, entry] of this.history) {
      if (entry.executedAt < cutoffDate) {
        this.history.delete(commandId);
        
        // Remove from undo/redo stacks
        const undoIndex = this.undoStack.indexOf(commandId);
        if (undoIndex !== -1) {
          this.undoStack.splice(undoIndex, 1);
        }
        
        const redoIndex = this.redoStack.indexOf(commandId);
        if (redoIndex !== -1) {
          this.redoStack.splice(redoIndex, 1);
        }
        
        clearedCount++;
      }
    }

    devLog(`[${this.context}] Cleared ${clearedCount} old history entries`);
    return clearedCount;
  }

  /**
   * Archive history older than specified date
   */
  public async archiveHistory(olderThan: Date): Promise<number> {
    // In a real implementation, this would move entries to an archive storage
    // For now, we'll just clear them
    return this.clearHistory(olderThan);
  }

  /**
   * Get undo stack size
   */
  public getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size
   */
  public getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get next undoable command ID
   */
  public getNextUndoCommandId(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  /**
   * Get next redoable command ID
   */
  public getNextRedoCommandId(): string | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1] : null;
  }

  // Private helper methods

  /**
   * Apply filter to history entries
   */
  private applyFilter(entries: CommandHistoryEntry[], filter: CommandHistoryFilter): CommandHistoryEntry[] {
    let filtered = entries;

    if (filter.commandTypes) {
      filtered = filtered.filter(entry => filter.commandTypes!.includes(entry.command.type));
    }

    if (filter.userIds) {
      filtered = filtered.filter(entry => 
        entry.context.userId && filter.userIds!.includes(entry.context.userId)
      );
    }

    if (filter.sessionIds) {
      filtered = filtered.filter(entry => 
        entry.context.sessionId && filter.sessionIds!.includes(entry.context.sessionId)
      );
    }

    if (filter.timeRange) {
      filtered = filtered.filter(entry => 
        entry.executedAt >= filter.timeRange!.start && 
        entry.executedAt <= filter.timeRange!.end
      );
    }

    if (filter.success !== undefined) {
      filtered = filtered.filter(entry => entry.result.success === filter.success);
    }

    if (filter.undoable !== undefined) {
      filtered = filtered.filter(entry => entry.undoable === filter.undoable);
    }

    return filtered;
  }

  /**
   * Record performance data point
   */
  private recordPerformanceData(entry: CommandHistoryEntry): void {
    const now = new Date();
    
    // Find or create performance data for current time window (1 minute)
    const timeWindow = Math.floor(now.getTime() / 60000) * 60000; // Round to minute
    const windowDate = new Date(timeWindow);
    
    let dataPoint = this.performanceData.find(p => p.timestamp.getTime() === timeWindow);
    
    if (!dataPoint) {
      dataPoint = {
        timestamp: windowDate,
        commandCount: 0,
        averageExecutionTime: 0,
        successRate: 0,
        errorRate: 0,
      };
      this.performanceData.push(dataPoint);
    }

    // Update data point
    const totalCommands = dataPoint.commandCount + 1;
    const newExecutionTime = (dataPoint.averageExecutionTime * dataPoint.commandCount + entry.result.executionTime) / totalCommands;
    const successCount = dataPoint.successRate * dataPoint.commandCount + (entry.result.success ? 1 : 0);
    const errorCount = dataPoint.errorRate * dataPoint.commandCount + (entry.result.success ? 0 : 1);

    dataPoint.commandCount = totalCommands;
    dataPoint.averageExecutionTime = newExecutionTime;
    dataPoint.successRate = successCount / totalCommands;
    dataPoint.errorRate = errorCount / totalCommands;

    // Keep only last 1000 data points
    if (this.performanceData.length > 1000) {
      this.performanceData = this.performanceData.slice(-1000);
    }
  }

  /**
   * Get performance trends for time range
   */
  private getPerformanceTrends(timeRange: TimeRange): PerformanceTrend[] {
    return this.performanceData.filter(trend => 
      trend.timestamp >= timeRange.start && trend.timestamp <= timeRange.end
    );
  }

  /**
   * Extract error type from error message
   */
  private extractErrorType(errorMessage: string): string {
    // Simple error type extraction - in a real implementation,
    // you might have more sophisticated error categorization
    if (errorMessage.toLowerCase().includes('timeout')) return 'timeout';
    if (errorMessage.toLowerCase().includes('network')) return 'network';
    if (errorMessage.toLowerCase().includes('validation')) return 'validation';
    if (errorMessage.toLowerCase().includes('permission')) return 'permission';
    return 'unknown';
  }

  /**
   * Clean up old entries to maintain size limit
   */
  private cleanupOldEntries(): void {
    const entries = Array.from(this.history.entries());
    entries.sort((a, b) => a[1].executedAt.getTime() - b[1].executedAt.getTime());

    const entriesToRemove = entries.slice(0, entries.length - this.config.maxHistorySize);
    
    for (const [commandId] of entriesToRemove) {
      this.history.delete(commandId);
      
      // Remove from stacks
      const undoIndex = this.undoStack.indexOf(commandId);
      if (undoIndex !== -1) {
        this.undoStack.splice(undoIndex, 1);
      }
      
      const redoIndex = this.redoStack.indexOf(commandId);
      if (redoIndex !== -1) {
        this.redoStack.splice(redoIndex, 1);
      }
    }

    devLog(`[${this.context}] Cleaned up ${entriesToRemove.length} old entries`);
  }

  /**
   * Perform automatic cleanup
   */
  private async performAutoCleanup(): void {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const clearedCount = await this.clearHistory(thirtyDaysAgo);
      
      if (clearedCount > 0) {
        devLog(`[${this.context}] Auto cleanup cleared ${clearedCount} entries`);
      }
    } catch (error) {
      logError(`[${this.context}] Auto cleanup failed`, error);
    }
  }
}

/**
 * Command history configuration
 */
export interface CommandHistoryConfig {
  maxHistorySize: number;
  maxUndoStackSize: number;
  enableAnalytics: boolean;
  enablePerformanceTracking: boolean;
  autoCleanupInterval: number; // milliseconds, 0 to disable
}

/**
 * Factory function for creating command history
 */
export function createCommandHistory(
  context?: string,
  config?: Partial<CommandHistoryConfig>
): CommandHistory {
  return new EnhancedCommandHistory(context, config);
}

/**
 * Default command history instance
 */
export const defaultCommandHistory = new EnhancedCommandHistory();