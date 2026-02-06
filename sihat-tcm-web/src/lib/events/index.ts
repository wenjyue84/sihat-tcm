/**
 * Event System - Main Export
 *
 * Centralized exports for the event system with clean architecture.
 * Provides easy access to all event system components.
 */

// Core interfaces
export * from "./interfaces/EventInterfaces";

// Core implementations
export * from "./core/EventEmitter";
export * from "./core/EventHistory";

// Main event system
export * from "./EventSystem";

// Re-export commonly used types and functions
export type {
  BaseEvent,
  EventEmitter,
  EventHistoryManager,
  EventListener,
  EventEmissionResult,
  EventStatistics,
  DomainEvent,
} from "./interfaces/EventInterfaces";

export { createEventEmitter, defaultEventEmitter } from "./core/EventEmitter";

export { createEventHistoryManager, defaultEventHistoryManager } from "./core/EventHistory";

export {
  createEventSystem,
  defaultEventSystem,
  emit,
  on,
  once,
  off,
  createScopedEmitter,
} from "./EventSystem";
