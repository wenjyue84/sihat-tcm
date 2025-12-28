/**
 * Event Emitter Core Implementation
 * 
 * High-performance event emitter with advanced features like priority handling,
 * error recovery, and comprehensive monitoring.
 */

import {
  BaseEvent,
  EventEmitter,
  EventListener,
  EventListenerConfig,
  EventListenerEntry,
  EventListenerError,
  EventEmissionOptions,
  EventEmissionResult,
  EventStatistics,
} from '../interfaces/EventInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * High-performance event emitter implementation
 */
export class EnhancedEventEmitter implements EventEmitter {
  private listeners = new Map<string, EventListenerEntry[]>();
  private listenerIdCounter = 0;
  private readonly context: string;
  private readonly config: EventEmitterConfig;
  
  // Statistics tracking
  private stats = {
    totalEvents: 0,
    totalExecutions: 0,
    totalErrors: 0,
    executionTimes: [] as number[],
  };

  constructor(context: string = 'EventEmitter', config: Partial<EventEmitterConfig> = {}) {
    this.context = context;
    this.config = {
      maxListeners: 100,
      defaultTimeout: 5000,
      enableStatistics: true,
      errorHandling: 'log',
      asyncByDefault: true,
      ...config,
    };
  }

  /**
   * Emit an event to all registered listeners
   */
  public async emit<T extends BaseEvent>(
    event: T,
    options: EventEmissionOptions = {}
  ): Promise<EventEmissionResult> {
    const startTime = Date.now();
    const eventId = event.id || this.generateEventId();
    
    const emissionOptions = {
      async: this.config.asyncByDefault,
      timeout: this.config.defaultTimeout,
      retryOnFailure: false,
      maxRetries: 0,
      retryDelay: 1000,
      skipValidation: false,
      ...options,
    };

    try {
      // Validate event if not skipped
      if (!emissionOptions.skipValidation) {
        this.validateEvent(event);
      }

      const listeners = this.listeners.get(event.type) || [];
      
      if (listeners.length === 0) {
        devLog(`[${this.context}] No listeners for event: ${event.type}`);
        return {
          eventId,
          success: true,
          listenersNotified: 0,
          executionTime: Date.now() - startTime,
          errors: [],
        };
      }

      devLog(`[${this.context}] Emitting event: ${event.type}`, {
        listenerCount: listeners.length,
        source: event.source,
        async: emissionOptions.async,
      });

      // Sort listeners by priority (higher priority first)
      const sortedListeners = [...listeners].sort((a, b) => b.config.priority - a.config.priority);

      const errors: EventListenerError[] = [];
      let successfulExecutions = 0;

      if (emissionOptions.async) {
        // Execute all listeners concurrently
        const promises = sortedListeners.map(entry => 
          this.executeListener(entry, event, emissionOptions)
        );

        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              successfulExecutions++;
            } else {
              errors.push(result.value.error!);
            }
          } else {
            errors.push({
              error: new Error(result.reason),
              event,
              timestamp: new Date(),
              attempt: 1,
            });
          }
        });
      } else {
        // Execute listeners sequentially
        for (const entry of sortedListeners) {
          const result = await this.executeListener(entry, event, emissionOptions);
          if (result.success) {
            successfulExecutions++;
          } else {
            errors.push(result.error!);
          }
        }
      }

      // Update statistics
      if (this.config.enableStatistics) {
        this.updateStatistics(Date.now() - startTime, errors.length > 0);
      }

      const result: EventEmissionResult = {
        eventId,
        success: errors.length === 0,
        listenersNotified: successfulExecutions,
        executionTime: Date.now() - startTime,
        errors,
        metadata: {
          totalListeners: listeners.length,
          async: emissionOptions.async,
        },
      };

      // Log errors if any
      if (errors.length > 0 && this.config.errorHandling === 'log') {
        logError(`[${this.context}] Event emission had ${errors.length} errors`, {
          eventType: event.type,
          errors: errors.map(e => e.error.message),
        });
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (this.config.errorHandling === 'throw') {
        throw ErrorFactory.fromUnknownError(error, {
          component: this.context,
          action: 'emit',
          metadata: { eventType: event.type, eventId },
        });
      }

      return {
        eventId,
        success: false,
        listenersNotified: 0,
        executionTime,
        errors: [{
          error: error as Error,
          event,
          timestamp: new Date(),
          attempt: 1,
        }],
      };
    }
  }

  /**
   * Register an event listener
   */
  public on<T extends BaseEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    config: EventListenerConfig = {}
  ): string {
    const listenerId = this.generateListenerId();
    
    const entry: EventListenerEntry = {
      id: listenerId,
      listener: listener as EventListener,
      config: {
        once: false,
        priority: 0,
        source: 'unknown',
        timeout: this.config.defaultTimeout,
        retryAttempts: 0,
        errorHandler: undefined,
        ...config,
      },
      registeredAt: new Date(),
      executionCount: 0,
      errors: [],
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType)!;
    
    // Check listener limit
    if (listeners.length >= this.config.maxListeners) {
      throw new Error(`Maximum listeners (${this.config.maxListeners}) exceeded for event: ${eventType}`);
    }

    listeners.push(entry);

    devLog(`[${this.context}] Listener registered for ${eventType}`, {
      listenerId,
      priority: entry.config.priority,
      source: entry.config.source,
      once: entry.config.once,
    });

    return listenerId;
  }

  /**
   * Register a one-time event listener
   */
  public once<T extends BaseEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    config: Omit<EventListenerConfig, 'once'> = {}
  ): string {
    return this.on(eventType, listener, { ...config, once: true });
  }

  /**
   * Remove event listener(s)
   */
  public off(eventType: string, listenerId?: string): boolean {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return false;

    if (listenerId) {
      // Remove specific listener
      const index = listeners.findIndex(entry => entry.id === listenerId);
      if (index === -1) return false;

      listeners.splice(index, 1);
      devLog(`[${this.context}] Listener ${listenerId} removed from ${eventType}`);
      
      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.listeners.delete(eventType);
      }
      
      return true;
    } else {
      // Remove all listeners for event type
      const count = listeners.length;
      this.listeners.delete(eventType);
      devLog(`[${this.context}] All ${count} listeners removed from ${eventType}`);
      return count > 0;
    }
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(eventType?: string): number {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const count = listeners.length;
        this.listeners.delete(eventType);
        devLog(`[${this.context}] Removed ${count} listeners from ${eventType}`);
        return count;
      }
      return 0;
    } else {
      const totalCount = Array.from(this.listeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0);
      
      this.listeners.clear();
      devLog(`[${this.context}] Removed all ${totalCount} listeners`);
      return totalCount;
    }
  }

  /**
   * Check if event type has listeners
   */
  public hasListeners(eventType: string): boolean {
    const listeners = this.listeners.get(eventType);
    return Boolean(listeners && listeners.length > 0);
  }

  /**
   * Get listener count for event type
   */
  public getListenerCount(eventType: string): number {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get listeners for event type
   */
  public getListeners(eventType: string): EventListenerEntry[] {
    const listeners = this.listeners.get(eventType);
    return listeners ? [...listeners] : [];
  }

  /**
   * Get comprehensive statistics
   */
  public getStatistics(): EventStatistics {
    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};
    let totalListeners = 0;
    let activeListeners = 0;
    const recentErrors: EventListenerError[] = [];

    for (const [eventType, listeners] of this.listeners) {
      eventsByType[eventType] = listeners.length;
      totalListeners += listeners.length;
      
      for (const listener of listeners) {
        if (listener.executionCount > 0) {
          activeListeners++;
        }
        
        eventsBySource[listener.config.source] = 
          (eventsBySource[listener.config.source] || 0) + 1;
        
        // Collect recent errors (last 10)
        recentErrors.push(...listener.errors.slice(-2));
      }
    }

    // Sort recent errors by timestamp
    recentErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const averageExecutionTime = this.stats.executionTimes.length > 0
      ? this.stats.executionTimes.reduce((sum, time) => sum + time, 0) / this.stats.executionTimes.length
      : 0;

    const errorRate = this.stats.totalExecutions > 0
      ? this.stats.totalErrors / this.stats.totalExecutions
      : 0;

    return {
      totalEvents: this.stats.totalEvents,
      eventsByType,
      eventsBySource,
      averageExecutionTime,
      errorRate,
      listenerCount: totalListeners,
      activeListeners,
      recentErrors: recentErrors.slice(0, 10),
    };
  }

  // Private helper methods

  /**
   * Execute a single listener with error handling and retries
   */
  private async executeListener(
    entry: EventListenerEntry,
    event: BaseEvent,
    options: Required<EventEmissionOptions>
  ): Promise<{ success: boolean; error?: EventListenerError }> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= entry.config.retryAttempts; attempt++) {
      try {
        // Execute with timeout
        const result = await this.executeWithTimeout(
          entry.listener,
          event,
          entry.config.timeout
        );

        // Update entry statistics
        entry.executionCount++;
        entry.lastExecuted = new Date();

        // Remove one-time listeners
        if (entry.config.once) {
          this.off(event.type, entry.id);
        }

        return { success: true };

      } catch (error) {
        lastError = error as Error;
        
        const listenerError: EventListenerError = {
          error: lastError,
          event,
          timestamp: new Date(),
          attempt: attempt + 1,
        };

        entry.errors.push(listenerError);

        // Call custom error handler if provided
        if (entry.config.errorHandler) {
          try {
            entry.config.errorHandler(lastError, event);
          } catch (handlerError) {
            logError(`[${this.context}] Error handler failed`, handlerError);
          }
        }

        // If this is not the last attempt, wait before retrying
        if (attempt < entry.config.retryAttempts) {
          await this.delay(options.retryDelay * (attempt + 1));
        }
      }
    }

    return {
      success: false,
      error: {
        error: lastError!,
        event,
        timestamp: new Date(),
        attempt: entry.config.retryAttempts + 1,
      },
    };
  }

  /**
   * Execute listener with timeout
   */
  private async executeWithTimeout(
    listener: EventListener,
    event: BaseEvent,
    timeout: number
  ): Promise<void> {
    return Promise.race([
      Promise.resolve(listener(event)),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Listener timeout')), timeout)
      ),
    ]);
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: BaseEvent): void {
    if (!event.type || typeof event.type !== 'string') {
      throw new Error('Event must have a valid type');
    }
    
    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      throw new Error('Event must have a valid timestamp');
    }
    
    if (!event.source || typeof event.source !== 'string') {
      throw new Error('Event must have a valid source');
    }
  }

  /**
   * Update internal statistics
   */
  private updateStatistics(executionTime: number, hasErrors: boolean): void {
    this.stats.totalEvents++;
    this.stats.totalExecutions++;
    
    if (hasErrors) {
      this.stats.totalErrors++;
    }
    
    this.stats.executionTimes.push(executionTime);
    
    // Keep only last 1000 execution times for memory efficiency
    if (this.stats.executionTimes.length > 1000) {
      this.stats.executionTimes = this.stats.executionTimes.slice(-1000);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique listener ID
   */
  private generateListenerId(): string {
    return `listener-${++this.listenerIdCounter}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Event emitter configuration
 */
export interface EventEmitterConfig {
  maxListeners: number;
  defaultTimeout: number;
  enableStatistics: boolean;
  errorHandling: 'throw' | 'log' | 'ignore';
  asyncByDefault: boolean;
}

/**
 * Factory function for creating event emitters
 */
export function createEventEmitter(
  context?: string,
  config?: Partial<EventEmitterConfig>
): EventEmitter {
  return new EnhancedEventEmitter(context, config);
}

/**
 * Default event emitter instance
 */
export const defaultEventEmitter = new EnhancedEventEmitter('DefaultEmitter');