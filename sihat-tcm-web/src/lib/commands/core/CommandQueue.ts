/**
 * Command Queue Core Implementation
 * 
 * High-performance command queue with priority support, filtering,
 * and comprehensive monitoring capabilities.
 */

import {
  Command,
  CommandContext,
  CommandQueue,
  QueuedCommand,
  QueuedCommandStatus,
  QueueStatus,
  CommandPriority,
} from '../interfaces/CommandInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Enhanced command queue implementation
 */
export class EnhancedCommandQueue implements CommandQueue {
  private queue = new Map<string, QueuedCommand>();
  private priorityQueues = new Map<CommandPriority, string[]>();
  private queueIdCounter = 0;
  private readonly context: string;
  private readonly config: CommandQueueConfig;
  
  // Statistics tracking
  private stats = {
    totalEnqueued: 0,
    totalDequeued: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalCancelled: 0,
    enqueueTimes: [] as number[],
    processingTimes: [] as number[],
  };

  constructor(context: string = 'CommandQueue', config: Partial<CommandQueueConfig> = {}) {
    this.context = context;
    this.config = {
      maxSize: 1000,
      enableStatistics: true,
      enablePriorityQueues: true,
      defaultTimeout: 30000,
      ...config,
    };

    // Initialize priority queues
    if (this.config.enablePriorityQueues) {
      const priorities: CommandPriority[] = ['urgent', 'high', 'normal', 'low'];
      priorities.forEach(priority => {
        this.priorityQueues.set(priority, []);
      });
    }
  }

  /**
   * Enqueue a command with context
   */
  public async enqueue(command: Command, context?: Partial<CommandContext>): Promise<string> {
    const queueId = this.generateQueueId();
    const startTime = Date.now();

    try {
      // Check queue size limit
      if (this.queue.size >= this.config.maxSize) {
        throw new Error(`Queue size limit (${this.config.maxSize}) exceeded`);
      }

      const commandContext: CommandContext = {
        source: 'unknown',
        priority: 'normal',
        timeout: this.config.defaultTimeout,
        retryAttempts: 0,
        dryRun: false,
        skipValidation: false,
        ...context,
      };

      const queuedCommand: QueuedCommand = {
        queueId,
        command,
        context: commandContext,
        enqueuedAt: new Date(),
        attempts: 0,
        status: 'pending',
      };

      // Add to main queue
      this.queue.set(queueId, queuedCommand);

      // Add to priority queue if enabled
      if (this.config.enablePriorityQueues) {
        const priorityQueue = this.priorityQueues.get(commandContext.priority);
        if (priorityQueue) {
          priorityQueue.push(queueId);
        }
      }

      // Update statistics
      if (this.config.enableStatistics) {
        this.stats.totalEnqueued++;
        this.stats.enqueueTimes.push(Date.now() - startTime);
        
        // Keep only last 1000 times for memory efficiency
        if (this.stats.enqueueTimes.length > 1000) {
          this.stats.enqueueTimes = this.stats.enqueueTimes.slice(-1000);
        }
      }

      devLog(`[${this.context}] Command enqueued: ${command.description}`, {
        queueId,
        priority: commandContext.priority,
        queueSize: this.queue.size,
      });

      return queueId;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'enqueue',
        metadata: { commandId: command.id },
      });
    }
  }

  /**
   * Dequeue the next command based on priority
   */
  public async dequeue(): Promise<QueuedCommand | null> {
    try {
      let queueId: string | undefined;

      if (this.config.enablePriorityQueues) {
        // Get from highest priority queue first
        const priorities: CommandPriority[] = ['urgent', 'high', 'normal', 'low'];
        
        for (const priority of priorities) {
          const priorityQueue = this.priorityQueues.get(priority);
          if (priorityQueue && priorityQueue.length > 0) {
            queueId = priorityQueue.shift();
            break;
          }
        }
      } else {
        // Get first available command
        const queueIds = Array.from(this.queue.keys());
        queueId = queueIds.find(id => this.queue.get(id)?.status === 'pending');
      }

      if (!queueId) {
        return null;
      }

      const queuedCommand = this.queue.get(queueId);
      if (!queuedCommand) {
        return null;
      }

      // Update status
      queuedCommand.status = 'processing';
      queuedCommand.attempts++;
      queuedCommand.lastAttempt = new Date();

      // Update statistics
      if (this.config.enableStatistics) {
        this.stats.totalDequeued++;
      }

      devLog(`[${this.context}] Command dequeued: ${queuedCommand.command.description}`, {
        queueId,
        attempts: queuedCommand.attempts,
      });

      return queuedCommand;

    } catch (error) {
      logError(`[${this.context}] Error dequeuing command`, error);
      return null;
    }
  }

  /**
   * Peek at the next command without removing it
   */
  public async peek(): Promise<QueuedCommand | null> {
    try {
      if (this.config.enablePriorityQueues) {
        const priorities: CommandPriority[] = ['urgent', 'high', 'normal', 'low'];
        
        for (const priority of priorities) {
          const priorityQueue = this.priorityQueues.get(priority);
          if (priorityQueue && priorityQueue.length > 0) {
            const queueId = priorityQueue[0];
            return this.queue.get(queueId) || null;
          }
        }
      } else {
        const queueIds = Array.from(this.queue.keys());
        const queueId = queueIds.find(id => this.queue.get(id)?.status === 'pending');
        return queueId ? this.queue.get(queueId) || null : null;
      }

      return null;
    } catch (error) {
      logError(`[${this.context}] Error peeking at queue`, error);
      return null;
    }
  }

  /**
   * Get queue size
   */
  public size(): number {
    return this.queue.size;
  }

  /**
   * Check if queue is empty
   */
  public isEmpty(): boolean {
    return this.queue.size === 0;
  }

  /**
   * Clear the queue
   */
  public async clear(): Promise<number> {
    const clearedCount = this.queue.size;
    
    this.queue.clear();
    
    if (this.config.enablePriorityQueues) {
      this.priorityQueues.forEach(queue => queue.length = 0);
    }

    devLog(`[${this.context}] Queue cleared`, { clearedCount });
    return clearedCount;
  }

  /**
   * Enqueue with specific priority
   */
  public async enqueuePriority(
    command: Command,
    priority: CommandPriority,
    context?: Partial<CommandContext>
  ): Promise<string> {
    return this.enqueue(command, { ...context, priority });
  }

  /**
   * Get commands by priority
   */
  public async getByPriority(priority: CommandPriority): Promise<QueuedCommand[]> {
    if (!this.config.enablePriorityQueues) {
      // Filter by priority if priority queues are disabled
      return Array.from(this.queue.values()).filter(
        queuedCommand => queuedCommand.context.priority === priority
      );
    }

    const priorityQueue = this.priorityQueues.get(priority);
    if (!priorityQueue) {
      return [];
    }

    return priorityQueue
      .map(queueId => this.queue.get(queueId))
      .filter((queuedCommand): queuedCommand is QueuedCommand => queuedCommand !== undefined);
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): QueueStatus {
    const commands = Array.from(this.queue.values());
    
    const totalCommands = commands.length;
    const pendingCommands = commands.filter(cmd => cmd.status === 'pending').length;
    const processingCommands = commands.filter(cmd => cmd.status === 'processing').length;
    const completedCommands = commands.filter(cmd => cmd.status === 'completed').length;
    const failedCommands = commands.filter(cmd => cmd.status === 'failed').length;

    // Calculate average times
    const averageWaitTime = this.calculateAverageWaitTime(commands);
    const averageExecutionTime = this.stats.processingTimes.length > 0
      ? this.stats.processingTimes.reduce((sum, time) => sum + time, 0) / this.stats.processingTimes.length
      : 0;

    // Calculate throughput (commands per minute)
    const throughput = this.calculateThroughput();

    return {
      totalCommands,
      pendingCommands,
      processingCommands,
      completedCommands,
      failedCommands,
      averageWaitTime,
      averageExecutionTime,
      throughput,
    };
  }

  /**
   * Get all queued commands
   */
  public async getQueuedCommands(): Promise<QueuedCommand[]> {
    return Array.from(this.queue.values());
  }

  /**
   * Update command status
   */
  public updateCommandStatus(queueId: string, status: QueuedCommandStatus): boolean {
    const queuedCommand = this.queue.get(queueId);
    if (!queuedCommand) {
      return false;
    }

    queuedCommand.status = status;

    // Update statistics
    if (this.config.enableStatistics) {
      switch (status) {
        case 'completed':
          this.stats.totalCompleted++;
          break;
        case 'failed':
          this.stats.totalFailed++;
          break;
        case 'cancelled':
          this.stats.totalCancelled++;
          break;
      }
    }

    // Remove completed/failed/cancelled commands after a delay
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      setTimeout(() => {
        this.queue.delete(queueId);
      }, 60000); // Keep for 1 minute for debugging
    }

    return true;
  }

  /**
   * Cancel a queued command
   */
  public cancelCommand(queueId: string): boolean {
    const queuedCommand = this.queue.get(queueId);
    if (!queuedCommand || queuedCommand.status !== 'pending') {
      return false;
    }

    // Remove from priority queue if enabled
    if (this.config.enablePriorityQueues) {
      const priorityQueue = this.priorityQueues.get(queuedCommand.context.priority);
      if (priorityQueue) {
        const index = priorityQueue.indexOf(queueId);
        if (index !== -1) {
          priorityQueue.splice(index, 1);
        }
      }
    }

    this.updateCommandStatus(queueId, 'cancelled');
    
    devLog(`[${this.context}] Command cancelled: ${queuedCommand.command.description}`, { queueId });
    return true;
  }

  /**
   * Get queue statistics
   */
  public getStatistics(): QueueStatistics {
    const averageEnqueueTime = this.stats.enqueueTimes.length > 0
      ? this.stats.enqueueTimes.reduce((sum, time) => sum + time, 0) / this.stats.enqueueTimes.length
      : 0;

    const averageProcessingTime = this.stats.processingTimes.length > 0
      ? this.stats.processingTimes.reduce((sum, time) => sum + time, 0) / this.stats.processingTimes.length
      : 0;

    return {
      totalEnqueued: this.stats.totalEnqueued,
      totalDequeued: this.stats.totalDequeued,
      totalCompleted: this.stats.totalCompleted,
      totalFailed: this.stats.totalFailed,
      totalCancelled: this.stats.totalCancelled,
      averageEnqueueTime,
      averageProcessingTime,
      currentSize: this.queue.size,
      maxSize: this.config.maxSize,
    };
  }

  // Private helper methods

  /**
   * Generate unique queue ID
   */
  private generateQueueId(): string {
    return `queue-${++this.queueIdCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Calculate average wait time
   */
  private calculateAverageWaitTime(commands: QueuedCommand[]): number {
    const waitTimes = commands
      .filter(cmd => cmd.lastAttempt)
      .map(cmd => cmd.lastAttempt!.getTime() - cmd.enqueuedAt.getTime());

    return waitTimes.length > 0
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
      : 0;
  }

  /**
   * Calculate throughput (commands per minute)
   */
  private calculateThroughput(): number {
    // Simple throughput calculation based on recent completions
    const recentCompletions = this.stats.totalCompleted;
    const timeWindow = 60000; // 1 minute in milliseconds
    
    // This is a simplified calculation - in a real implementation,
    // you'd track completions over time windows
    return recentCompletions;
  }
}

/**
 * Command queue configuration
 */
export interface CommandQueueConfig {
  maxSize: number;
  enableStatistics: boolean;
  enablePriorityQueues: boolean;
  defaultTimeout: number;
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  totalEnqueued: number;
  totalDequeued: number;
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  averageEnqueueTime: number;
  averageProcessingTime: number;
  currentSize: number;
  maxSize: number;
}

/**
 * Factory function for creating command queue
 */
export function createCommandQueue(
  context?: string,
  config?: Partial<CommandQueueConfig>
): CommandQueue {
  return new EnhancedCommandQueue(context, config);
}

/**
 * Default command queue instance
 */
export const defaultCommandQueue = new EnhancedCommandQueue();