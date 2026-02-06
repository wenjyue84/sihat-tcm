/**
 * Scoped event emitter for component-specific event handling
 */

import { AppEvent, EventListener } from "../interfaces/EventInterfaces";
import { EventEmitter } from "../core/EventEmitter";

export class ScopedEmitter {
  private emitter: EventEmitter;
  private readonly source: string;

  constructor(emitter: EventEmitter, source: string) {
    this.emitter = emitter;
    this.source = source;
  }

  /**
   * Emit event with automatic source assignment
   */
  public emit<T extends AppEvent>(event: Omit<T, "source" | "timestamp">): Promise<void> {
    return this.emitter.emit({
      ...event,
      source: this.source,
      timestamp: new Date(),
    } as T);
  }

  /**
   * Subscribe to events with automatic source assignment
   */
  public on<T extends AppEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    options?: { once?: boolean; priority?: number }
  ): () => void {
    return this.emitter.on(eventType, listener, { ...options, source: this.source });
  }

  /**
   * Subscribe to event once with automatic source assignment
   */
  public once<T extends AppEvent>(
    eventType: T["type"],
    listener: EventListener<T>,
    options?: { priority?: number }
  ): () => void {
    return this.emitter.once(eventType, listener, { ...options, source: this.source });
  }

  /**
   * Remove all listeners for event type
   */
  public off(eventType: string): void {
    this.emitter.off(eventType);
  }

  /**
   * Get source identifier
   */
  public getSource(): string {
    return this.source;
  }
}
