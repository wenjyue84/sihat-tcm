/**
 * Store Orchestrator
 *
 * Central orchestrator for managing all application stores with
 * cross-store synchronization and lifecycle management.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/lib/clientLogger";
import type {
  AuthStore,
  LanguageStore,
  DiagnosisProgressStore,
  AccessibilityStore,
  OnboardingStore,
  DeveloperStore,
  StoreOrchestrator as IStoreOrchestrator,
  StoreState,
  StoreActions,
  CrossStoreEvent,
  StoreSubscription,
  StoreMetrics,
  StoreConfig,
} from "../interfaces/StoreInterfaces";

/**
 * Store orchestrator implementation
 */
export class StoreOrchestrator implements IStoreOrchestrator {
  private stores: Map<string, any> = new Map();
  private subscriptions: Map<string, StoreSubscription[]> = new Map();
  private eventHistory: CrossStoreEvent[] = [];
  private config: StoreConfig;
  private metrics: StoreMetrics = {
    totalStores: 0,
    activeSubscriptions: 0,
    eventsProcessed: 0,
    lastEventTime: 0,
    averageEventProcessingTime: 0,
    errorCount: 0,
  };

  constructor(config: Partial<StoreConfig> = {}) {
    this.config = {
      enableCrossStoreSync: true,
      enableMetrics: true,
      enableEventHistory: true,
      maxEventHistory: 1000,
      enableDebugLogging: process.env.NODE_ENV === "development",
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize the orchestrator
   */
  private initialize(): void {
    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "Initializing store orchestrator", {
        config: this.config,
      });
    }

    // Setup cleanup on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.cleanup();
      });
    }
  }

  /**
   * Register a store with the orchestrator
   */
  public registerStore<T>(name: string, store: T, dependencies: string[] = []): void {
    if (this.stores.has(name)) {
      logger.warn("StoreOrchestrator", "Store already registered", { name });
      return;
    }

    this.stores.set(name, store);
    this.subscriptions.set(name, []);
    this.metrics.totalStores++;

    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "Store registered", {
        name,
        dependencies,
        totalStores: this.metrics.totalStores,
      });
    }

    // Setup cross-store synchronization if enabled
    if (this.config.enableCrossStoreSync) {
      this.setupCrossStoreSync(name, dependencies);
    }

    // Emit registration event
    this.emitEvent({
      type: "store:registered",
      storeName: name,
      timestamp: Date.now(),
      data: { dependencies },
    });
  }

  /**
   * Unregister a store
   */
  public unregisterStore(name: string): void {
    if (!this.stores.has(name)) {
      logger.warn("StoreOrchestrator", "Store not found for unregistration", { name });
      return;
    }

    // Clean up subscriptions
    const subscriptions = this.subscriptions.get(name) || [];
    subscriptions.forEach((sub) => {
      if (sub.unsubscribe) {
        sub.unsubscribe();
      }
    });

    this.stores.delete(name);
    this.subscriptions.delete(name);
    this.metrics.totalStores--;
    this.metrics.activeSubscriptions -= subscriptions.length;

    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "Store unregistered", {
        name,
        totalStores: this.metrics.totalStores,
      });
    }

    // Emit unregistration event
    this.emitEvent({
      type: "store:unregistered",
      storeName: name,
      timestamp: Date.now(),
      data: {},
    });
  }

  /**
   * Get a registered store
   */
  public getStore<T>(name: string): T | null {
    return this.stores.get(name) || null;
  }

  /**
   * Subscribe to cross-store events
   */
  public subscribe(
    eventType: string,
    callback: (event: CrossStoreEvent) => void,
    storeName?: string
  ): () => void {
    const subscription: StoreSubscription = {
      id: `sub-${Date.now()}-${Math.random()}`,
      eventType,
      callback,
      storeName,
      createdAt: Date.now(),
    };

    const targetStore = storeName || "global";
    const storeSubscriptions = this.subscriptions.get(targetStore) || [];
    storeSubscriptions.push(subscription);
    this.subscriptions.set(targetStore, storeSubscriptions);
    this.metrics.activeSubscriptions++;

    if (this.config.enableDebugLogging) {
      logger.debug("StoreOrchestrator", "Subscription created", {
        subscriptionId: subscription.id,
        eventType,
        storeName: targetStore,
      });
    }

    // Return unsubscribe function
    return () => {
      const subscriptions = this.subscriptions.get(targetStore) || [];
      const index = subscriptions.findIndex((sub) => sub.id === subscription.id);

      if (index !== -1) {
        subscriptions.splice(index, 1);
        this.subscriptions.set(targetStore, subscriptions);
        this.metrics.activeSubscriptions--;

        if (this.config.enableDebugLogging) {
          logger.debug("StoreOrchestrator", "Subscription removed", {
            subscriptionId: subscription.id,
          });
        }
      }
    };
  }

  /**
   * Emit a cross-store event
   */
  public emitEvent(event: Omit<CrossStoreEvent, "id">): void {
    const startTime = performance.now();

    const fullEvent: CrossStoreEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random()}`,
    };

    // Add to event history if enabled
    if (this.config.enableEventHistory) {
      this.eventHistory.push(fullEvent);

      // Trim history if it exceeds max size
      if (this.eventHistory.length > this.config.maxEventHistory) {
        this.eventHistory.shift();
      }
    }

    // Notify global subscribers
    const globalSubscriptions = this.subscriptions.get("global") || [];
    this.notifySubscribers(globalSubscriptions, fullEvent);

    // Notify store-specific subscribers
    if (event.storeName) {
      const storeSubscriptions = this.subscriptions.get(event.storeName) || [];
      this.notifySubscribers(storeSubscriptions, fullEvent);
    }

    // Update metrics
    const processingTime = performance.now() - startTime;
    this.metrics.eventsProcessed++;
    this.metrics.lastEventTime = Date.now();
    this.metrics.averageEventProcessingTime =
      (this.metrics.averageEventProcessingTime * (this.metrics.eventsProcessed - 1) +
        processingTime) /
      this.metrics.eventsProcessed;

    if (this.config.enableDebugLogging) {
      logger.debug("StoreOrchestrator", "Event emitted", {
        eventId: fullEvent.id,
        type: fullEvent.type,
        storeName: fullEvent.storeName,
        processingTime: `${processingTime.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Notify subscribers of an event
   */
  private notifySubscribers(subscriptions: StoreSubscription[], event: CrossStoreEvent): void {
    subscriptions.forEach((subscription) => {
      if (subscription.eventType === "*" || subscription.eventType === event.type) {
        try {
          subscription.callback(event);
        } catch (error) {
          this.metrics.errorCount++;
          logger.error("StoreOrchestrator", "Error in event callback", {
            subscriptionId: subscription.id,
            eventType: event.type,
            error,
          });
        }
      }
    });
  }

  /**
   * Setup cross-store synchronization
   */
  private setupCrossStoreSync(storeName: string, dependencies: string[]): void {
    // This would be implemented based on specific store synchronization needs
    // For now, we'll set up basic event forwarding

    dependencies.forEach((depName) => {
      const depStore = this.stores.get(depName);
      if (depStore && typeof depStore.subscribe === "function") {
        // Subscribe to dependency store changes
        const unsubscribe = depStore.subscribe((state: any) => {
          this.emitEvent({
            type: "store:state:changed",
            storeName: depName,
            timestamp: Date.now(),
            data: { newState: state },
          });
        });

        // Store the unsubscribe function
        const subscriptions = this.subscriptions.get(storeName) || [];
        subscriptions.push({
          id: `sync-${storeName}-${depName}`,
          eventType: "store:state:changed",
          callback: () => {},
          storeName: depName,
          createdAt: Date.now(),
          unsubscribe,
        });
        this.subscriptions.set(storeName, subscriptions);
      }
    });
  }

  /**
   * Get orchestrator metrics
   */
  public getMetrics(): StoreMetrics {
    return { ...this.metrics };
  }

  /**
   * Get event history
   */
  public getEventHistory(limit?: number): CrossStoreEvent[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Clear event history
   */
  public clearEventHistory(): void {
    this.eventHistory = [];

    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "Event history cleared");
    }
  }

  /**
   * Get all registered store names
   */
  public getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Check if a store is registered
   */
  public hasStore(name: string): boolean {
    return this.stores.has(name);
  }

  /**
   * Reset all stores to their initial state
   */
  public resetAllStores(): void {
    this.stores.forEach((store, name) => {
      if (store && typeof store.reset === "function") {
        try {
          store.reset();

          this.emitEvent({
            type: "store:reset",
            storeName: name,
            timestamp: Date.now(),
            data: {},
          });
        } catch (error) {
          logger.error("StoreOrchestrator", "Error resetting store", {
            storeName: name,
            error,
          });
        }
      }
    });

    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "All stores reset");
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((subscriptions, storeName) => {
      subscriptions.forEach((sub) => {
        if (sub.unsubscribe) {
          sub.unsubscribe();
        }
      });
    });

    this.subscriptions.clear();
    this.stores.clear();
    this.eventHistory = [];

    this.metrics = {
      totalStores: 0,
      activeSubscriptions: 0,
      eventsProcessed: 0,
      lastEventTime: 0,
      averageEventProcessingTime: 0,
      errorCount: 0,
    };

    if (this.config.enableDebugLogging) {
      logger.info("StoreOrchestrator", "Orchestrator cleaned up");
    }
  }
}

/**
 * Default store orchestrator instance
 */
export const defaultStoreOrchestrator = new StoreOrchestrator({
  enableCrossStoreSync: true,
  enableMetrics: true,
  enableEventHistory: true,
  maxEventHistory: 1000,
  enableDebugLogging: process.env.NODE_ENV === "development",
});

/**
 * Create a new store orchestrator with custom configuration
 */
export function createStoreOrchestrator(config: Partial<StoreConfig> = {}): StoreOrchestrator {
  return new StoreOrchestrator(config);
}

/**
 * Convenience functions for the default orchestrator
 */
export const registerStore = defaultStoreOrchestrator.registerStore.bind(defaultStoreOrchestrator);
export const unregisterStore =
  defaultStoreOrchestrator.unregisterStore.bind(defaultStoreOrchestrator);
export const getStore = defaultStoreOrchestrator.getStore.bind(defaultStoreOrchestrator);
export const subscribeToStoreEvents =
  defaultStoreOrchestrator.subscribe.bind(defaultStoreOrchestrator);
export const emitStoreEvent = defaultStoreOrchestrator.emitEvent.bind(defaultStoreOrchestrator);
export const getStoreMetrics = defaultStoreOrchestrator.getMetrics.bind(defaultStoreOrchestrator);
export const getStoreEventHistory =
  defaultStoreOrchestrator.getEventHistory.bind(defaultStoreOrchestrator);
export const resetAllStores =
  defaultStoreOrchestrator.resetAllStores.bind(defaultStoreOrchestrator);
