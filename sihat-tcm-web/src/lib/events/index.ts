/**
 * Event System - Modular Architecture
 * 
 * This is the new modular approach to event system.
 * Use these exports for new code instead of the monolithic EventSystem.ts
 */

// Main event system
export { EventSystem, defaultEventSystem } from './EventSystem';

// Core interfaces
export type {
  BaseEvent,
  AppEvent,
  EventListener,
  EventListenerEntry,
  EventSystemStats,
  AIModelSelectedEvent,
  AIRequestStartedEvent,
  AIRequestCompletedEvent,
  AIPerformanceEvent,
  NotificationScheduledEvent,
  NotificationDeliveredEvent,
  NotificationClickedEvent,
  SystemErrorEvent,
  SystemPerformanceEvent
} from './interfaces/EventInterfaces';

// Core components
export { EventEmitter } from './core/EventEmitter';
export { EventHistory } from './core/EventHistory';
export { ScopedEmitter } from './utils/ScopedEmitter';

// Convenience functions
export {
  getEventSystem,
  on,
  once,
  emit,
  createEventEmitter
} from './EventSystem';

// Convenience function for quick setup
export function createEventSystem(): EventSystem {
  return EventSystem.getInstance();
}