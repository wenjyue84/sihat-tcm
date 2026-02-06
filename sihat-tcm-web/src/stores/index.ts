/**
 * Store System - Main Export
 *
 * Centralized export for the complete store management system
 * with orchestration, factory patterns, and cross-store synchronization.
 */

// Local imports for convenience functions below
import {
  defaultStoreOrchestrator as _defaultStoreOrchestrator,
  createStoreOrchestrator as _createStoreOrchestrator,
  registerStore as _registerStore,
  getStoreMetrics as _getStoreMetrics,
} from "./core/StoreOrchestrator";
import {
  defaultStoreFactory as _defaultStoreFactory,
  createStoreFactory as _createStoreFactory,
} from "./core/StoreFactory";
import { useAuthStore as _useAuthStore } from "./auth/AuthStore";
import { useLanguageStore as _useLanguageStore } from "./language/LanguageStore";
import { useDiagnosisProgressStore as _useDiagnosisProgressStore } from "./diagnosis/DiagnosisProgressStore";
import type { StoreConfig as _StoreConfig } from "./interfaces/StoreInterfaces";

// Core Store System
export {
  StoreOrchestrator,
  defaultStoreOrchestrator,
  createStoreOrchestrator,
  registerStore,
  unregisterStore,
  getStore,
  subscribeToStoreEvents,
  emitStoreEvent,
  getStoreMetrics,
  getStoreEventHistory,
  resetAllStores,
} from "./core/StoreOrchestrator";

export {
  StoreFactory,
  defaultStoreFactory,
  createStoreFactory,
  createStore,
  getStoreConfig,
  getFactoryMetrics,
} from "./core/StoreFactory";

// Individual Stores
export {
  useAuthStore,
  useAuth,
  useUserRole,
  useIsAdmin,
  useIsDoctor,
  useIsPatient,
  useIsDeveloper,
} from "./auth/AuthStore";

export {
  useLanguageStore,
  useLanguage,
  useTranslation,
  useT,
  useLanguageSwitcher,
} from "./language/LanguageStore";

export {
  useDiagnosisProgressStore,
  useDiagnosisProgress,
  useDiagnosisProgressOptional,
  useStepProgress,
  useDiagnosisNavigation,
} from "./diagnosis/DiagnosisProgressStore";

// Store Interfaces and Types
export type {
  // Core Interfaces
  StoreOrchestrator as IStoreOrchestrator,
  CrossStoreEvent,
  StoreSubscription,
  StoreMetrics,
  StoreConfig,
  StoreType,
  StoreInstance,
  StoreValidation,
  StoreLifecycle,
  StoreFactoryConfig,
  StoreState,
  StoreActions,

  // Individual Store Interfaces
  AuthStore,
  AuthState,
  AuthActions,
  LanguageStore,
  LanguageState,
  LanguageActions,
  DiagnosisProgressStore,
  DiagnosisProgressState,
  DiagnosisProgressActions,
  AccessibilityStore,
  AccessibilityState,
  AccessibilityActions,
  OnboardingStore,
  OnboardingState,
  OnboardingActions,
  DeveloperStore,
  DeveloperState,
  DeveloperActions,

  // Shared Types
  Role,
  UIPreferences,
  Profile,
  NavigationState,
} from "./interfaces/StoreInterfaces";

// Constants
export {
  STORAGE_KEYS,
  STEP_WEIGHTS,
  STEP_BASE_PROGRESS,
  ADMIN_LEVEL_MAPPING,
} from "./interfaces/StoreInterfaces";

// Convenience Functions
export function initializeStoreSystem(): {
  orchestrator: typeof _defaultStoreOrchestrator;
  factory: typeof _defaultStoreFactory;
} {
  // Register all stores with the orchestrator
  _registerStore("auth", _useAuthStore, []);
  _registerStore("language", _useLanguageStore, ["auth"]);
  _registerStore("diagnosisProgress", _useDiagnosisProgressStore, []);

  return {
    orchestrator: _defaultStoreOrchestrator,
    factory: _defaultStoreFactory,
  };
}

/**
 * Create a complete store setup with all stores initialized
 */
export function createCompleteStoreSetup(config?: Partial<_StoreConfig>) {
  const orchestrator = _createStoreOrchestrator(config);
  const factory = _createStoreFactory();

  // Create and register all stores
  const authStore = factory.createStore("auth");
  const languageStore = factory.createStore("language");
  const diagnosisProgressStore = factory.createStore("diagnosisProgress");

  orchestrator.registerStore("auth", authStore, []);
  orchestrator.registerStore("language", languageStore, ["auth"]);
  orchestrator.registerStore("diagnosisProgress", diagnosisProgressStore, []);

  return {
    orchestrator,
    factory,
    stores: {
      auth: authStore,
      language: languageStore,
      diagnosisProgress: diagnosisProgressStore,
    },
  };
}

/**
 * Store system health check
 */
export function checkStoreSystemHealth(): {
  isHealthy: boolean;
  metrics: ReturnType<typeof _getStoreMetrics>;
  issues: string[];
} {
  const metrics = _getStoreMetrics();
  const issues: string[] = [];

  // Check for basic health indicators
  if (metrics.totalStores === 0) {
    issues.push("No stores registered");
  }

  if (metrics.errorCount > 0) {
    issues.push(`${metrics.errorCount} errors detected`);
  }

  if (metrics.averageEventProcessingTime > 100) {
    issues.push("High event processing time detected");
  }

  return {
    isHealthy: issues.length === 0,
    metrics,
    issues,
  };
}
