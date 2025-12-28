/**
 * Command queue management with priority support
 */

import { Command, CommandContext } from '../interfaces/CommandInterfaces';

interface QueuedCommand {
  command: Command;
  context: CommandContext;
}

export class CommandQueue {
  private queue: QueuedCommand[] = [];
  private isProcessing = false;
  private readonly context = 'CommandQueue';

  /**
   * Add command to queue
   */
  enqueue(command: Command, context: CommandContext): void {
    this.queue.push({ command, context });
    
    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.context.priority - a.context.priority);

    console.log(`[${this.context}] Command queued: ${command.description}`, {
      queueSize: this.queue.length,
      priority: context.priority,
    });
  }

  /**
   * Get next command from queue
   */
  dequeue(): QueuedCommand | undefined {
    return this.queue.shift();
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    console.log(`[${this.context}] Queue cleared`);
  }

  /**
   * Get processing status
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Set processing status
   */
  setProcessing(processing: boolean): void {
    this.isProcessing = processing;
  }

  /**
   * Get queue contents (for debugging)
   */
  getContents(): QueuedCommand[] {
    return [...this.queue];
  }
}