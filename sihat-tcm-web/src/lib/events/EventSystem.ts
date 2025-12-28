/**
 * Event System - Observer Pattern Implementation
 * 
 * Provides a decoupled event system for communication between components
 * without tight coupling. Follows the Observer pattern for clean event handling.
 */

import { devLog, logError } from '../systemLogger';
import { AppError, ErrorFactory } from '../errors/AppError';

/**
 * Base event interface
 */
export interface BaseEvent {
  type: string;
  timestamp: Date;
  source: string;
  data?: Record<string, any>;
}

/**
 * AI-related events
 */
export interface AIModelSelectedEvent extends BaseEvent {
  type: 'ai:model:selected';
  data: {
    modelId: string;
    complexity: string;
    reasoning: string[];
  };
}

export interface AIRequestStartedEvent extends BaseEvent {
  type: 'ai:request:started';
  data: {
    requestId: string;
    modelId: string;
    complexity: string;
  };
}

export interface AIRequestCompletedEvent extends BaseEvent {
  type: 'ai:request:completed';
  data: {
    requestId: string;
    modelId: string;
    responseTime: number;
    success: boolean;
    error?: string;
  };
}

export interface AIPerformanceEvent extends BaseEvent {
  type: 'ai:performance:recorded';
  data: {
    modelId: string;
    metrics: {
      responseTime: number;
      success: boolean;
      requestType: string;
    };
  };
}

/**
 * Notification-related events
 */
export interface NotificationScheduledEvent extends BaseEvent {
  type: 'notification:scheduled';
  data: {
    notificationId: string;
    category: string;
    priority: string;
  };
}

export interface NotificationDeliveredEvent extends BaseEvent {
  type: 'notification:delivered';
  data: {
    notificationId: string;
    deliveredAt: Date;
  };
}

export interface NotificationClickedEvent extends BaseEvent {
  type: 'notification:clicked';
  data: {
    notificationId: string;
    category: string;
    clickedAt: Date;
  };
}

/**
 * System events
 */
export interface SystemErrorEvent extends BaseEvent {
  type: 'system:error';
  data: {
    error: Error;
    component: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface SystemPerformanceEvent extends BaseEvent {
  type: 'system:performance';
  data: {
    metric: string;
    value: number;
    threshold?: number;
    status: 'normal' | 'warning' | 'critical';
  };
}

/**
 * Union type for all events
 */
export type AppEvent = 
  | AIModelSelectedEvent
  | AIRequestStartedEvent
  | AIRequestCompletedEvent
  | AIPerformanceEvent
  | NotificationScheduledEvent
  | NotificationDeliveredEvent
  | NotificationClickedEvent
  | SystemErrorEvent
  | SystemPerformanceEvent;

/**
 * Event listener function type
 */
export type EventListener<T extends BaseEvent = AppEvent> = (event: T) => void | Promise<void>;

/**
 * Event listener with metadata
 */
interface EventListenerEntry {
  listener: EventListener;
  once: boolean;
  priority: number;
  source: string;
}

/**
 * Event System Implementation
 * 
 * Provides a centralized event system for decoupled communication
 * between components. Supports event filtering, priorities, and async handling.
 */
export class EventSystem {
  private static instance: EventSystem;
  private listeners = new Map<string, EventListenerEntry[]>();
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize = 1000;
  private readonly context = 'EventSystem';

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Subscribe to events of a specific type
   */
  public on<T extends AppEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    options: {
      once?: boolean;
      priority?: number;
      source?: string;
    } = {}
  ): () => void {
    const entry: EventListenerEntry = {
      listener: listener as EventListener,
      once: options.once || false,
      priority: options.priority || 0,
      source: options.source || 'unknown',
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType)!;
    listeners.push(entry);

    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.priority - a.priority);

    devLog(`[${this.context}] Listener registered for ${eventType}`, {
      priority: entry.priority,
      source: entry.source,
      once: entry.once,
    });

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(entry);
      if (index > -1) {
        listeners.splice(index, 1);
        devLog(`[${this.context}] Listener unregistered for ${eventType}`);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  public once<T extends AppEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    options: {
      priority?: number;
      source?: string;
    } = {}
  ): () => void {
    return this.on(eventType, listener, { ...options, once: true });
  }

  /**
   * Emit an event to all listeners
   */
  public async emit<T extends AppEvent>(event: T): Promise<void> {
    try {
      // Add to history
      this.addToHistory(event);

      const listeners = this.listeners.get(event.type) || [];
      
      if (listeners.length === 0) {
        devLog(`[${this.context}] No listeners for event: ${event.type}`);
        return;
      }

      devLog(`[${this.context}] Emitting event: ${event.type}`, {
        listenerCount: listeners.length,
        source: event.source,
      });

      // Execute listeners in priority order
      const promises: Promise<void>[] = [];
      const listenersToRemove: EventListenerEntry[] = [];

      for (const entry of listeners) {
        try {
          const result = entry.listener(event);
          
          // Handle async listeners
          if (result instanceof Promise) {
            promises.push(result);
          }

          // Mark for removal if it's a once listener
          if (entry.once) {
            listenersToRemove.push(entry);
          }

        } catch (error) {
          logError(`[${this.context}] Listener error for ${event.type}`, error);
          
          // Emit error event (but don't create infinite loops)
          if (event.type !== 'system:error') {
            this.emit({
              type: 'system:error',
              timestamp: new Date(),
              source: this.context,
              data: {
                error: error as Error,
                component: 'EventSystem',
                action: 'emit',
                severity: 'medium' as const,
              },
            } as SystemErrorEvent);
          }
        }
      }

      // Wait for all async listeners to complete
      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }

      // Remove once listeners
      if (listenersToRemove.length > 0) {
        const remainingListeners = listeners.filter(l => !listenersToRemove.includes(l));
        this.listeners.set(event.type, remainingListeners);
      }

    } catch (error) {
      logError(`[${this.context}] Failed to emit event: ${event.type}`, error);
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'emit',
        metadata: { eventType: event.type },
      });
    }
  }

  /**
   * Remove all listeners for an event type
   */
  public off(eventType: string): void {
    const removed = this.listeners.delete(eventType);
    if (removed) {
      devLog(`[${this.context}] All listeners removed for ${eventType}`);
    }
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(): void {
    const eventTypes = Array.from(this.listeners.keys());
    this.listeners.clear();
    devLog(`[${this.context}] All listeners removed`, { eventTypes });
  }

  /**
   * Get event history
   */
  public getEventHistory(
    eventType?: string,
    limit?: number
  ): AppEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return [...history]; // Return copy
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
    devLog(`[${this.context}] Event history cleared`);
  }

  /**
   * Get listener statistics
   */
  public getStats(): {
    totalListeners: number;
    eventTypes: string[];
    listenersByType: Record<string, number>;
    historySize: number;
  } {
    const listenersByType: Record<string, number> = {};
    let totalListeners = 0;

    for (const [eventType, listeners] of this.listeners) {
      listenersByType[eventType] = listeners.length;
      totalListeners += listeners.length;
    }

    return {
      totalListeners,
      eventTypes: Array.from(this.listeners.keys()),
      listenersByType,
      historySize: this.eventHistory.length,
    };
  }

  /**
   * Create a scoped event emitter for a specific component
   */
  public createScopedEmitter(source: string) {
    return {
      emit: <T extends AppEvent>(event: Omit<T, 'source' | 'timestamp'>) => {
        return this.emit({
          ...event,
          source,
          timestamp: new Date(),
        } as T);
      },
      
      on: <T extends AppEvent>(
        eventType: T['type'],
        listener: EventListener<T>,
        options?: { once?: boolean; priority?: number }
      ) => {
        return this.on(eventType, listener, { ...options, source });
      },

      once: <T extends AppEvent>(
        eventType: T['type'],
        listener: EventListener<T>,
        options?: { priority?: number }
      ) => {
        return this.once(eventType, listener, { ...options, source });
      },
    };
  }

  // Private helper methods

  private addToHistory(event: AppEvent): void {
    this.eventHistory.push(event);

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Convenience functions for global event system
 */

/**
 * Get the global event system instance
 */
export function getEventSystem(): EventSystem {
  return EventSystem.getInstance();
}

/**
 * Subscribe to events globally
 */
export function on<T extends AppEvent>(
  eventType: T['type'],
  listener: EventListener<T>,
  options?: { once?: boolean; priority?: number; source?: string }
): () => void {
  return EventSystem.getInstance().on(eventType, listener, options);
}

/**
 * Subscribe to an event once globally
 */
export function once<T extends AppEvent>(
  eventType: T['type'],
  listener: EventListener<T>,
  options?: { priority?: number; source?: string }
): () => void {
  return EventSystem.getInstance().once(eventType, listener, options);
}

/**
 * Emit an event globally
 */
export function emit<T extends AppEvent>(event: T): Promise<void> {
  return EventSystem.getInstance().emit(event);
}

/**
 * Create a scoped emitter for a component
 */
export function createEventEmitter(source: string) {
  return EventSystem.getInstance().createScopedEmitter(source);
}

/**
 * Default event system instance
 */
export const defaultEventSystem = EventSystem.getInstance();