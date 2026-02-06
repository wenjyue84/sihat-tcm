/**
 * Refactored Event System - Main orchestrator
 *
 * This is the new modular version that delegates to specialized components.
 * The original large file has been broken down into focused modules.
 */

import { AppEvent, EventListener, EventSystemStats } from "./interfaces/EventInterfaces";
import { EventEmitter } from "./core/EventEmitter";
import { EventHistory } from "./core/EventHistory";
import { ScopedEmitter } from "./utils/ScopedEmitter";
import { ErrorFactory } from "../errors/AppError";

export class EventSystem {
  private static instance: EventSystem;
  private emitter: EventEmitter;
  private history: EventHistory;
  private readonly context = "EventSystem";

  constructor() {
    this.emitter = new EventEmitter(this.context);
    this.history = new EventHistory(1000);
  }

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
    eventType: T["type"],
    listener: EventListener<T>,
    options: {
      once?: boolean;
      priority?: number;
      source?: string;
    } = {}
  ): string {
    return this.emitter.on(eventType, listener, options);
  }

  /**
   * Subscribe to an event once
   */
  public once<T extends AppEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    options: {
      priority?: number;
      source?: string;
    } = {}
  ): () => void {
    return this.emitter.once(eventType, listener, options);
  }

  /**
   * Emit an event to all listeners
   */
  public async emit<T extends AppEvent>(event: T): Promise<void> {
    try {
      // Add to history
      this.history.addEvent(event);

      // Emit through emitter
      await this.emitter.emit(event);
    } catch (error) {
      console.error(`[${this.context}] Failed to emit event: ${event.type}`, error);
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: "emit",
        metadata: { eventType: event.type },
      });
    }
  }

  /**
   * Remove all listeners for an event type
   */
  public off(eventType: string): void {
    this.emitter.off(eventType);
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }

  /**
   * Get event history
   */
  public getEventHistory(eventType?: string, limit?: number): AppEvent[] {
    return this.history.getHistory(eventType, limit);
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.history.clearHistory();
  }

  /**
   * Get system statistics
   */
  public getStats(): EventSystemStats {
    const listenerStats = this.emitter.getListenerStats();
    const historyStats = this.history.getStats();

    return {
      totalListeners: listenerStats.totalListeners,
      eventTypes: listenerStats.eventTypes,
      listenersByType: listenerStats.listenersByType,
      historySize: historyStats.totalEvents,
    };
  }

  /**
   * Create a scoped event emitter for a specific component
   */
  public createScopedEmitter(source: string): ScopedEmitter {
    return new ScopedEmitter(this.emitter, source);
  }
}

// Re-export key components for convenience
export { EventEmitter } from "./core/EventEmitter";
export { EventHistory } from "./core/EventHistory";
export { ScopedEmitter } from "./utils/ScopedEmitter";

// Re-export interfaces
export * from "./interfaces/EventInterfaces";

// Convenience functions for global event system
export function getEventSystem(): EventSystem {
  return EventSystem.getInstance();
}

export function on<T extends AppEvent>(
  eventType: T["type"],
  listener: EventListener<T>,
  options?: { once?: boolean; priority?: number; source?: string }
): () => void {
  return EventSystem.getInstance().on(eventType, listener, options);
}

export function once<T extends AppEvent>(
  eventType: T["type"],
  listener: EventListener<T>,
  options?: { priority?: number; source?: string }
): () => void {
  return EventSystem.getInstance().once(eventType, listener, options);
}

export function emit<T extends AppEvent>(event: T): Promise<void> {
  return EventSystem.getInstance().emit(event);
}

export function createEventEmitter(source: string): ScopedEmitter {
  return EventSystem.getInstance().createScopedEmitter(source);
}

// Default instance
export const defaultEventSystem = EventSystem.getInstance();
