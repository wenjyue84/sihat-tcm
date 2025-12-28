/**
 * Event history management
 */

import { AppEvent } from '../interfaces/EventInterfaces';

export class EventHistory {
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize: number;
  private readonly context = 'EventHistory';

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add event to history
   */
  public addEvent(event: AppEvent): void {
    this.eventHistory.push(event);

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history with optional filtering
   */
  public getHistory(
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
    console.log(`[${this.context}] Event history cleared`);
  }

  /**
   * Get history statistics
   */
  public getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    oldestEvent?: Date;
    newestEvent?: Date;
  } {
    const eventsByType: Record<string, number> = {};
    
    for (const event of this.eventHistory) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      oldestEvent: this.eventHistory[0]?.timestamp,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.timestamp,
    };
  }

  /**
   * Get events within time range
   */
  public getEventsByTimeRange(startTime: Date, endTime: Date): AppEvent[] {
    return this.eventHistory.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get recent events
   */
  public getRecentEvents(minutes: number = 60): AppEvent[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.eventHistory.filter(event => event.timestamp >= cutoffTime);
  }
}