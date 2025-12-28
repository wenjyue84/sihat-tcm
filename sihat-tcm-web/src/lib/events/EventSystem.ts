/**
 * Event System - Observer Pattern Implementation
 * 
 * Provides a decoupled event system for cross-component communication
 * without tight coupling. Supports typed events and async handlers.
 */

export interface EventListener<T = any> {
  (data: T): void | Promise<void>;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface EventEmitter {
  emit<T>(eventName: string, data: T): Promise<void>;
  on<T>(eventName: string, listener: EventListener<T>): EventSubscription;
  off(eventName: string, listener: EventListener): void;
  once<T>(eventName: string, listener: EventListener<T>): EventSubscription;
  removeAllListeners(eventName?: string): void;
  getListenerCount(eventName: string): number;
}

/**
 * Typed event definitions for the application
 */
export interface AppEvents {
  // AI Model Events
  'ai:model:selected': { modelId: string; complexity: string; reasoning: string[] };
  'ai:model:fallback': { fromModel: string; toModel: string; reason: string };
  'ai:request:started': { requestId: string; modelId: string; complexity: string };
  'ai:request:completed': { requestId: string; modelId: string; responseTime: number; success: boolean };
  'ai:performance:threshold': { modelId: string; metric: string; value: number; threshold: number };

  // Notification Events
  'notification:scheduled': { notificationId: string; category: string; scheduledFor: Date };
  'notification:delivered': { notificationId: string; deliveredAt: Date };
  'notification:clicked': { notificationId: string; clickedAt: Date; data: any };
  'notification:preferences:updated': { preferences: any; updatedBy: string };
  'notification:sync:started': { deviceId: string };
  'notification:sync:completed': { deviceId: string; syncedCount: number };

  // Error Events
  'error:occurred': { error: Error; component: string; action: string; metadata?: any };
  'error:recovered': { error: Error; component: string; recoveryAction: string };

  // User Events
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string; timestamp: Date };
  'user:preferences:changed': { userId: string; preferences: any };

  // Health Events
  'health:data:received': { type: string; data: any; source: string };
  'health:analysis:completed': { analysisId: string; results: any };
  'health:alert:triggered': { alertType: string; severity: string; data: any };

  // System Events
  'system:startup': { version: string; timestamp: Date };
  'system:shutdown': { timestamp: Date };
  'system:performance:warning': { component: string; metric: string; value: number };
}

/**
 * Enhanced Event Emitter with type safety and async support
 */
export class TypedEventEmitter implements EventEmitter {
  private listeners = new Map<string, Set<EventListener>>();
  private onceListeners = new Map<string, Set<EventListener>>();
  private maxListeners = 100;
  private context: string;

  constructor(context: string = 'EventEmitter') {
    this.context = context;
  }

  /**
   * Emit an event to all registered listeners
   */
  public async emit<T>(eventName: string, data: T): Promise<void> {
    const regularListeners = this.listeners.get(eventName);
    const onceListeners = this.onceListeners.get(eventName);

    const allListeners: EventListener[] = [];
    
    if (regularListeners) {
      allListeners.push(...Array.from(regularListeners));
    }
    
    if (onceListeners) {
      allListeners.push(...Array.from(onceListeners));
      // Clear once listeners after collecting them
      this.onceListeners.delete(eventName);
    }

    if (allListeners.length === 0) {
      return;
    }

    // Execute all listeners, handling both sync and async
    const promises = allListeners.map(async (listener) => {
      try {
        const result = listener(data);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`[${this.context}] Error in event listener for '${eventName}':`, error);
        // Emit error event if it's not already an error event to prevent loops
        if (eventName !== 'error:occurred') {
          this.emit('error:occurred', {
            error: error as Error,
            component: this.context,
            action: `handling_event_${eventName}`,
            metadata: { eventName, data },
          });
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Register a persistent event listener
   */
  public on<T>(eventName: string, listener: EventListener<T>): EventSubscription {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listeners = this.listeners.get(eventName)!;
    
    if (listeners.size >= this.maxListeners) {
      console.warn(`[${this.context}] Maximum listeners (${this.maxListeners}) exceeded for event '${eventName}'`);
    }

    listeners.add(listener);

    return {
      unsubscribe: () => this.off(eventName, listener),
    };
  }

  /**
   * Register a one-time event listener
   */
  public once<T>(eventName: string, listener: EventListener<T>): EventSubscription {
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, new Set());
    }

    const listeners = this.onceListeners.get(eventName)!;
    listeners.add(listener);

    return {
      unsubscribe: () => {
        const onceListeners = this.onceListeners.get(eventName);
        if (onceListeners) {
          onceListeners.delete(listener);
          if (onceListeners.size === 0) {
            this.onceListeners.delete(eventName);
          }
        }
      },
    };
  }

  /**
   * Remove a specific event listener
   */
  public off(eventName: string, listener: EventListener): void {
    const regularListeners = this.listeners.get(eventName);
    if (regularListeners) {
      regularListeners.delete(listener);
      if (regularListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }

    const onceListeners = this.onceListeners.get(eventName);
    if (onceListeners) {
      onceListeners.delete(listener);
      if (onceListeners.size === 0) {
        this.onceListeners.delete(eventName);
      }
    }
  }

  /**
   * Remove all listeners for an event or all events
   */
  public removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
      this.onceListeners.delete(eventName);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  public getListenerCount(eventName: string): number {
    const regularCount = this.listeners.get(eventName)?.size || 0;
    const onceCount = this.onceListeners.get(eventName)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * Set maximum number of listeners per event
   */
  public setMaxListeners(max: number): void {
    this.maxListeners = max;
  }

  /**
   * Get all event names that have listeners
   */
  public getEventNames(): string[] {
    const names = new Set<string>();
    for (const name of this.listeners.keys()) {
      names.add(name);
    }
    for (const name of this.onceListeners.keys()) {
      names.add(name);
    }
    return Array.from(names);
  }

  /**
   * Create a promise that resolves when a specific event is emitted
   */
  public waitFor<T>(eventName: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const subscription = this.once<T>(eventName, (data) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          reject(new Error(`Timeout waiting for event '${eventName}' after ${timeout}ms`));
        }, timeout);
      }
    });
  }
}

/**
 * Global event emitter instance
 */
export const globalEventEmitter = new TypedEventEmitter('GlobalEvents');

/**
 * Typed event emitter for application events
 */
export class AppEventEmitter extends TypedEventEmitter {
  constructor() {
    super('AppEvents');
  }

  // Type-safe event emission methods
  public emitAIModelSelected(data: AppEvents['ai:model:selected']) {
    return this.emit('ai:model:selected', data);
  }

  public emitAIModelFallback(data: AppEvents['ai:model:fallback']) {
    return this.emit('ai:model:fallback', data);
  }

  public emitNotificationScheduled(data: AppEvents['notification:scheduled']) {
    return this.emit('notification:scheduled', data);
  }

  public emitNotificationDelivered(data: AppEvents['notification:delivered']) {
    return this.emit('notification:delivered', data);
  }

  public emitErrorOccurred(data: AppEvents['error:occurred']) {
    return this.emit('error:occurred', data);
  }

  public emitHealthDataReceived(data: AppEvents['health:data:received']) {
    return this.emit('health:data:received', data);
  }

  // Type-safe listener registration methods
  public onAIModelSelected(listener: EventListener<AppEvents['ai:model:selected']>) {
    return this.on('ai:model:selected', listener);
  }

  public onNotificationClicked(listener: EventListener<AppEvents['notification:clicked']>) {
    return this.on('notification:clicked', listener);
  }

  public onErrorOccurred(listener: EventListener<AppEvents['error:occurred']>) {
    return this.on('error:occurred', listener);
  }

  public onHealthDataReceived(listener: EventListener<AppEvents['health:data:received']>) {
    return this.on('health:data:received', listener);
  }
}

/**
 * Global app event emitter instance
 */
export const appEvents = new AppEventEmitter();

/**
 * Event middleware for logging and debugging
 */
export class EventLogger {
  private eventEmitter: EventEmitter;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(eventEmitter: EventEmitter, logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.eventEmitter = eventEmitter;
    this.logLevel = logLevel;
    this.setupLogging();
  }

  private setupLogging(): void {
    // Log all events if debug level
    if (this.logLevel === 'debug') {
      const originalEmit = this.eventEmitter.emit.bind(this.eventEmitter);
      this.eventEmitter.emit = async (eventName: string, data: any) => {
        console.debug(`[EventLogger] Event emitted: ${eventName}`, data);
        return originalEmit(eventName, data);
      };
    }

    // Log error events
    this.eventEmitter.on('error:occurred', (data) => {
      console.error(`[EventLogger] Error event:`, data);
    });

    // Log performance warnings
    this.eventEmitter.on('system:performance:warning', (data) => {
      console.warn(`[EventLogger] Performance warning:`, data);
    });
  }
}

/**
 * Event analytics for monitoring event patterns
 */
export class EventAnalytics {
  private eventCounts = new Map<string, number>();
  private eventTimes = new Map<string, number[]>();
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.setupAnalytics();
  }

  private setupAnalytics(): void {
    const originalEmit = this.eventEmitter.emit.bind(this.eventEmitter);
    this.eventEmitter.emit = async (eventName: string, data: any) => {
      // Record event count
      this.eventCounts.set(eventName, (this.eventCounts.get(eventName) || 0) + 1);
      
      // Record event time
      const times = this.eventTimes.get(eventName) || [];
      times.push(Date.now());
      
      // Keep only last 100 timestamps per event
      if (times.length > 100) {
        times.splice(0, times.length - 100);
      }
      
      this.eventTimes.set(eventName, times);

      return originalEmit(eventName, data);
    };
  }

  public getEventStats(): Record<string, { count: number; frequency: number; lastEmitted?: Date }> {
    const stats: Record<string, { count: number; frequency: number; lastEmitted?: Date }> = {};
    
    for (const [eventName, count] of this.eventCounts) {
      const times = this.eventTimes.get(eventName) || [];
      const lastEmitted = times.length > 0 ? new Date(times[times.length - 1]) : undefined;
      
      // Calculate frequency (events per minute over last hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentTimes = times.filter(time => time > oneHourAgo);
      const frequency = recentTimes.length / 60; // per minute
      
      stats[eventName] = {
        count,
        frequency,
        lastEmitted,
      };
    }
    
    return stats;
  }

  public getMostFrequentEvents(limit: number = 10): Array<{ eventName: string; count: number; frequency: number }> {
    const stats = this.getEventStats();
    
    return Object.entries(stats)
      .map(([eventName, data]) => ({ eventName, ...data }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }
}

/**
 * Factory function for creating event emitters
 */
export function createEventEmitter(context?: string): EventEmitter {
  return new TypedEventEmitter(context);
}

/**
 * Setup global event logging and analytics
 */
export function setupEventMonitoring(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
  new EventLogger(appEvents, logLevel);
  const analytics = new EventAnalytics(appEvents);
  
  // Expose analytics globally for debugging
  (globalThis as any).__eventAnalytics = analytics;
  
  return analytics;
}