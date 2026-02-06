/**
 * Store Factory
 *
 * Factory for creating and configuring application stores with
 * proper initialization, validation, and dependency injection.
 */

import { logger } from "@/lib/clientLogger";
import type {
  AuthStore,
  LanguageStore,
  DiagnosisProgressStore,
  AccessibilityStore,
  OnboardingStore,
  DeveloperStore,
  StoreConfig,
  StoreFactoryConfig,
  StoreType,
  StoreInstance,
} from "../interfaces/StoreInterfaces";

/**
 * Store factory configuration
 */
export interface StoreFactoryOptions {
  enableLogging?: boolean;
  enableValidation?: boolean;
  enableMetrics?: boolean;
  defaultConfig?: Partial<StoreConfig>;
}

/**
 * Store factory implementation
 */
export class StoreFactory {
  private config: StoreFactoryOptions;
  private createdStores: Map<string, StoreInstance> = new Map();
  private storeConfigs: Map<StoreType, StoreFactoryConfig> = new Map();

  constructor(options: StoreFactoryOptions = {}) {
    this.config = {
      enableLogging: process.env.NODE_ENV === "development",
      enableValidation: true,
      enableMetrics: true,
      ...options,
    };

    this.initializeStoreConfigs();
  }

  /**
   * Initialize store configurations
   */
  private initializeStoreConfigs(): void {
    // Auth Store Configuration
    this.storeConfigs.set("auth", {
      name: "auth",
      dependencies: [],
      initialState: {
        user: null,
        session: null,
        profile: null,
        authLoading: true,
      },
      validation: {
        required: ["user", "session", "profile", "authLoading"],
        types: {
          user: ["object", "null"],
          session: ["object", "null"],
          profile: ["object", "null"],
          authLoading: "boolean",
        },
      },
      lifecycle: {
        onInit: "initializeAuth",
        onDestroy: "cleanup",
      },
    });

    // Language Store Configuration
    this.storeConfigs.set("language", {
      name: "language",
      dependencies: ["auth"],
      initialState: {
        language: "en",
        languageLoaded: false,
      },
      validation: {
        required: ["language", "languageLoaded"],
        types: {
          language: "string",
          languageLoaded: "boolean",
        },
        constraints: {
          language: ["en", "zh", "ms"],
        },
      },
      lifecycle: {
        onInit: "initializeLanguage",
      },
    });

    // Diagnosis Progress Store Configuration
    this.storeConfigs.set("diagnosisProgress", {
      name: "diagnosisProgress",
      dependencies: [],
      initialState: {
        diagnosisProgress: 0,
        diagnosisStepIndex: 0,
        diagnosisFormProgress: {},
        diagnosisNavigationState: {},
      },
      validation: {
        required: [
          "diagnosisProgress",
          "diagnosisStepIndex",
          "diagnosisFormProgress",
          "diagnosisNavigationState",
        ],
        types: {
          diagnosisProgress: "number",
          diagnosisStepIndex: "number",
          diagnosisFormProgress: "object",
          diagnosisNavigationState: "object",
        },
        constraints: {
          diagnosisProgress: { min: 0, max: 100 },
          diagnosisStepIndex: { min: 0 },
        },
      },
    });

    // Accessibility Store Configuration
    this.storeConfigs.set("accessibility", {
      name: "accessibility",
      dependencies: ["auth"],
      initialState: {
        accessibilityManager: null,
        accessibilityPreferences: {
          highContrast: false,
          reducedMotion: false,
          screenReaderEnabled: false,
          keyboardNavigation: true,
          fontSize: "medium",
          focusIndicatorStyle: "default",
          announcements: true,
          colorBlindnessSupport: false,
          autoplayMedia: false,
          animationSpeed: "normal",
          textSpacing: "normal",
        },
      },
      validation: {
        required: ["accessibilityManager", "accessibilityPreferences"],
        types: {
          accessibilityManager: ["object", "null"],
          accessibilityPreferences: "object",
        },
      },
      lifecycle: {
        onInit: "initializeAccessibility",
      },
    });

    // Onboarding Store Configuration
    this.storeConfigs.set("onboarding", {
      name: "onboarding",
      dependencies: ["auth"],
      initialState: {
        hasCompletedOnboarding: false,
        onboardingLoading: false,
      },
      validation: {
        required: ["hasCompletedOnboarding", "onboardingLoading"],
        types: {
          hasCompletedOnboarding: "boolean",
          onboardingLoading: "boolean",
        },
      },
      lifecycle: {
        onInit: "initializeOnboarding",
      },
    });

    // Developer Store Configuration
    this.storeConfigs.set("developer", {
      name: "developer",
      dependencies: [],
      initialState: {
        isDeveloperMode: false,
      },
      validation: {
        required: ["isDeveloperMode"],
        types: {
          isDeveloperMode: "boolean",
        },
      },
      lifecycle: {
        onInit: "initializeDeveloper",
      },
    });
  }

  /**
   * Create a store of the specified type
   */
  public createStore<T extends StoreInstance>(
    type: StoreType,
    customConfig?: Partial<StoreFactoryConfig>
  ): T {
    const storeId = `${type}-${Date.now()}`;

    if (this.config.enableLogging) {
      logger.info("StoreFactory", "Creating store", { type, storeId });
    }

    // Get store configuration
    const baseConfig = this.storeConfigs.get(type);
    if (!baseConfig) {
      throw new Error(`Unknown store type: ${type}`);
    }

    const config = { ...baseConfig, ...customConfig };

    // Validate configuration
    if (this.config.enableValidation) {
      this.validateStoreConfig(config);
    }

    // Create the store based on type
    let store: T;

    try {
      switch (type) {
        case "auth":
          store = this.createAuthStore(config) as T;
          break;
        case "language":
          store = this.createLanguageStore(config) as T;
          break;
        case "diagnosisProgress":
          store = this.createDiagnosisProgressStore(config) as T;
          break;
        case "accessibility":
          store = this.createAccessibilityStore(config) as T;
          break;
        case "onboarding":
          store = this.createOnboardingStore(config) as T;
          break;
        case "developer":
          store = this.createDeveloperStore(config) as T;
          break;
        default:
          throw new Error(`Unsupported store type: ${type}`);
      }

      // Initialize the store if it has an initialization method
      if (
        config.lifecycle?.onInit &&
        typeof (store as any)[config.lifecycle.onInit] === "function"
      ) {
        const initResult = (store as any)[config.lifecycle.onInit]();

        // Handle async initialization
        if (initResult && typeof initResult.then === "function") {
          initResult.catch((error: Error) => {
            logger.error("StoreFactory", "Store initialization failed", {
              type,
              storeId,
              error,
            });
          });
        }
      }

      // Cache the created store
      this.createdStores.set(storeId, store);

      if (this.config.enableLogging) {
        logger.info("StoreFactory", "Store created successfully", {
          type,
          storeId,
          dependencies: config.dependencies,
        });
      }

      return store;
    } catch (error) {
      logger.error("StoreFactory", "Failed to create store", {
        type,
        storeId,
        error,
      });
      throw error;
    }
  }

  /**
   * Create auth store
   */
  private createAuthStore(config: StoreFactoryConfig): AuthStore {
    // This would import and create the actual auth store
    // For now, we'll return a mock implementation
    const { useAuthStore } = require("../auth/AuthStore");
    return useAuthStore;
  }

  /**
   * Create language store
   */
  private createLanguageStore(config: StoreFactoryConfig): LanguageStore {
    const { useLanguageStore } = require("../language/LanguageStore");
    return useLanguageStore;
  }

  /**
   * Create diagnosis progress store
   */
  private createDiagnosisProgressStore(config: StoreFactoryConfig): DiagnosisProgressStore {
    const { useDiagnosisProgressStore } = require("../diagnosis/DiagnosisProgressStore");
    return useDiagnosisProgressStore;
  }

  /**
   * Create accessibility store
   */
  private createAccessibilityStore(config: StoreFactoryConfig): AccessibilityStore {
    // This would be implemented when we create the accessibility store
    throw new Error("Accessibility store not yet implemented");
  }

  /**
   * Create onboarding store
   */
  private createOnboardingStore(config: StoreFactoryConfig): OnboardingStore {
    // This would be implemented when we create the onboarding store
    throw new Error("Onboarding store not yet implemented");
  }

  /**
   * Create developer store
   */
  private createDeveloperStore(config: StoreFactoryConfig): DeveloperStore {
    // This would be implemented when we create the developer store
    throw new Error("Developer store not yet implemented");
  }

  /**
   * Validate store configuration
   */
  private validateStoreConfig(config: StoreFactoryConfig): void {
    if (!config.name) {
      throw new Error("Store configuration must have a name");
    }

    if (!config.initialState || typeof config.initialState !== "object") {
      throw new Error("Store configuration must have an initial state");
    }

    if (config.validation) {
      this.validateStoreState(config.initialState, config.validation);
    }
  }

  /**
   * Validate store state against validation rules
   */
  private validateStoreState(state: any, validation: any): void {
    // Check required fields
    if (validation.required) {
      for (const field of validation.required) {
        if (!(field in state)) {
          throw new Error(`Required field '${field}' is missing from store state`);
        }
      }
    }

    // Check types
    if (validation.types) {
      for (const [field, expectedType] of Object.entries(validation.types)) {
        const value = state[field];
        const actualType = Array.isArray(value) ? "array" : typeof value;

        if (Array.isArray(expectedType)) {
          if (!expectedType.includes(actualType)) {
            throw new Error(
              `Field '${field}' has type '${actualType}', expected one of: ${expectedType.join(", ")}`
            );
          }
        } else if (actualType !== expectedType) {
          throw new Error(`Field '${field}' has type '${actualType}', expected '${expectedType}'`);
        }
      }
    }

    // Check constraints
    if (validation.constraints) {
      for (const [field, constraint] of Object.entries(validation.constraints)) {
        const value = state[field];

        if (Array.isArray(constraint)) {
          // Enum constraint
          if (!constraint.includes(value)) {
            throw new Error(
              `Field '${field}' has value '${value}', expected one of: ${constraint.join(", ")}`
            );
          }
        } else if (typeof constraint === "object" && constraint !== null) {
          // Range constraint
          const { min, max } = constraint as any;
          if (typeof value === "number") {
            if (min !== undefined && value < min) {
              throw new Error(`Field '${field}' has value ${value}, expected >= ${min}`);
            }
            if (max !== undefined && value > max) {
              throw new Error(`Field '${field}' has value ${value}, expected <= ${max}`);
            }
          }
        }
      }
    }
  }

  /**
   * Get store configuration
   */
  public getStoreConfig(type: StoreType): StoreFactoryConfig | undefined {
    return this.storeConfigs.get(type);
  }

  /**
   * Get all created stores
   */
  public getCreatedStores(): Map<string, StoreInstance> {
    return new Map(this.createdStores);
  }

  /**
   * Clear created stores cache
   */
  public clearCache(): void {
    this.createdStores.clear();

    if (this.config.enableLogging) {
      logger.info("StoreFactory", "Store cache cleared");
    }
  }

  /**
   * Get factory metrics
   */
  public getMetrics(): {
    totalStoresCreated: number;
    storeTypes: string[];
    cacheSize: number;
  } {
    return {
      totalStoresCreated: this.createdStores.size,
      storeTypes: Array.from(this.storeConfigs.keys()),
      cacheSize: this.createdStores.size,
    };
  }
}

/**
 * Default store factory instance
 */
export const defaultStoreFactory = new StoreFactory({
  enableLogging: process.env.NODE_ENV === "development",
  enableValidation: true,
  enableMetrics: true,
});

/**
 * Create a new store factory with custom configuration
 */
export function createStoreFactory(options: StoreFactoryOptions = {}): StoreFactory {
  return new StoreFactory(options);
}

/**
 * Convenience functions for the default factory
 */
export const createStore = defaultStoreFactory.createStore.bind(defaultStoreFactory);
export const getStoreConfig = defaultStoreFactory.getStoreConfig.bind(defaultStoreFactory);
export const getFactoryMetrics = defaultStoreFactory.getMetrics.bind(defaultStoreFactory);
