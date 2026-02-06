/**
 * Feature Flag Manager for Gradual Rollout
 * Enables safe deployment of refactored components
 */

import { AppError, ERROR_CODES } from "../errors/AppError";
import { EventSystem } from "../events/EventSystem";
import type { BaseEvent } from "../events/interfaces/EventInterfaces";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: "development" | "staging" | "production";
  description: string;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaultEnabled: boolean;
  environment: string;
}

export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  customAttributes?: Record<string, any>;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private eventSystem: EventSystem;
  private config: FeatureFlagConfig;

  constructor(config: FeatureFlagConfig, eventSystem: EventSystem) {
    this.config = config;
    this.eventSystem = eventSystem;
    this.initializeFlags();
  }

  /**
   * Emit event helper
   */
  private emitEvent(type: string, data?: Record<string, unknown>): void {
    this.eventSystem
      .emit({
        type,
        timestamp: new Date(),
        source: "FeatureFlagManager",
        id: `ffm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data,
      })
      .catch(() => {
        /* fire-and-forget */
      });
  }

  /**
   * Initialize feature flags from configuration
   */
  private initializeFlags(): void {
    try {
      Object.entries(this.config.flags).forEach(([key, flag]) => {
        this.flags.set(key, {
          ...flag,
          key,
          createdAt: flag.createdAt || new Date(),
          updatedAt: flag.updatedAt || new Date(),
        });
      });

      this.emitEvent("featureFlags:initialized", {
        flagCount: this.flags.size,
        environment: this.config.environment,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.CONFIGURATION_ERROR, "Failed to initialize feature flags", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Check if a feature flag is enabled for the given context
   */
  isEnabled(flagKey: string, context?: FeatureFlagContext): boolean {
    try {
      const flag = this.flags.get(flagKey);

      if (!flag) {
        this.emitEvent("featureFlags:flagNotFound", { flagKey });
        return this.config.defaultEnabled;
      }

      // Check basic enabled status
      if (!flag.enabled) {
        return false;
      }

      // Check environment
      if (flag.environment !== this.config.environment) {
        return false;
      }

      // Check dependencies
      if (flag.dependencies) {
        const dependenciesMet = flag.dependencies.every((dep) => this.isEnabled(dep, context));
        if (!dependenciesMet) {
          return false;
        }
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const hash = this.generateHash(flagKey, context);
        const enabled = hash < flag.rolloutPercentage;

        this.emitEvent("featureFlags:rolloutCheck", {
          flagKey,
          rolloutPercentage: flag.rolloutPercentage,
          hash,
          enabled,
          context,
        });

        return enabled;
      }

      return true;
    } catch (error) {
      this.emitEvent("featureFlags:error", {
        flagKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return this.config.defaultEnabled;
    }
  }

  /**
   * Generate consistent hash for rollout percentage
   */
  private generateHash(flagKey: string, context?: FeatureFlagContext): number {
    const identifier = context?.userId || context?.sessionId || "anonymous";
    const combined = `${flagKey}:${identifier}`;

    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash) % 100;
  }

  /**
   * Update a feature flag
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    try {
      const existingFlag = this.flags.get(flagKey);
      if (!existingFlag) {
        throw new AppError(ERROR_CODES.NOT_FOUND, `Feature flag '${flagKey}' not found`);
      }

      const updatedFlag: FeatureFlag = {
        ...existingFlag,
        ...updates,
        key: flagKey,
        updatedAt: new Date(),
      };

      this.flags.set(flagKey, updatedFlag);

      this.emitEvent("featureFlags:updated", {
        flagKey,
        previousFlag: existingFlag,
        updatedFlag,
        updates,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.OPERATION_FAILED, `Failed to update feature flag '${flagKey}'`, {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Add a new feature flag
   */
  addFlag(flag: Omit<FeatureFlag, "createdAt" | "updatedAt">): void {
    try {
      if (this.flags.has(flag.key)) {
        throw new AppError(ERROR_CODES.ALREADY_EXISTS, `Feature flag '${flag.key}' already exists`);
      }

      const newFlag: FeatureFlag = {
        ...flag,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.flags.set(flag.key, newFlag);

      this.emitEvent("featureFlags:added", {
        flag: newFlag,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.OPERATION_FAILED, `Failed to add feature flag '${flag.key}'`, {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagKey: string): void {
    try {
      const flag = this.flags.get(flagKey);
      if (!flag) {
        throw new AppError(ERROR_CODES.NOT_FOUND, `Feature flag '${flagKey}' not found`);
      }

      this.flags.delete(flagKey);

      this.emitEvent("featureFlags:removed", {
        flagKey,
        removedFlag: flag,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.OPERATION_FAILED, `Failed to remove feature flag '${flagKey}'`, {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get feature flag by key
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Get flags enabled for context
   */
  getEnabledFlags(context?: FeatureFlagContext): string[] {
    return Array.from(this.flags.keys()).filter((key) => this.isEnabled(key, context));
  }

  /**
   * Bulk update rollout percentages
   */
  updateRolloutPercentages(updates: Record<string, number>): void {
    try {
      const updatedFlags: string[] = [];

      Object.entries(updates).forEach(([flagKey, percentage]) => {
        if (percentage < 0 || percentage > 100) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid rollout percentage for '${flagKey}': ${percentage}`
          );
        }

        const flag = this.flags.get(flagKey);
        if (flag) {
          this.updateFlag(flagKey, { rolloutPercentage: percentage });
          updatedFlags.push(flagKey);
        }
      });

      this.emitEvent("featureFlags:bulkRolloutUpdate", {
        updatedFlags,
        updates,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.OPERATION_FAILED, "Failed to update rollout percentages", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Export configuration for backup/sync
   */
  exportConfig(): FeatureFlagConfig {
    const flags: Record<string, FeatureFlag> = {};
    this.flags.forEach((flag, key) => {
      flags[key] = flag;
    });

    return {
      ...this.config,
      flags,
    };
  }

  /**
   * Import configuration from backup/sync
   */
  importConfig(config: FeatureFlagConfig): void {
    try {
      this.config = config;
      this.flags.clear();
      this.initializeFlags();

      this.emitEvent("featureFlags:configImported", {
        flagCount: this.flags.size,
        environment: config.environment,
      });
    } catch (error) {
      throw new AppError(
        ERROR_CODES.OPERATION_FAILED,
        "Failed to import feature flag configuration",
        { metadata: { error: error instanceof Error ? error.message : "Unknown error" } }
      );
    }
  }
}
