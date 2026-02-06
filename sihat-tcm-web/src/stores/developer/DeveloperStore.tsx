/**
 * Developer Store
 *
 * Manages developer mode and debugging features
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/lib/clientLogger";
import { DeveloperStore, STORAGE_KEYS } from "../interfaces/StoreInterfaces";

export const useDeveloperStore = create<DeveloperStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    isDeveloperMode: false,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    toggleDeveloperMode: () => {
      const { isDeveloperMode } = get();
      const newValue = !isDeveloperMode;

      set({ isDeveloperMode: newValue });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.developer, JSON.stringify(newValue));
      }

      logger.info("DeveloperStore", "Developer mode toggled", {
        oldValue: isDeveloperMode,
        newValue,
      });
    },

    initializeDeveloper: () => {
      // Note: This method should be called after auth is initialized
      // to check if user has developer role

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEYS.developer);

        if (stored) {
          try {
            const isDeveloperMode = JSON.parse(stored);
            set({ isDeveloperMode });

            logger.info("DeveloperStore", "Developer mode loaded from localStorage", {
              isDeveloperMode,
            });
          } catch (e) {
            logger.warn("DeveloperStore", "Failed to parse isDeveloperMode from localStorage", e);
            set({ isDeveloperMode: false });
            localStorage.setItem(STORAGE_KEYS.developer, "false");
          }
        } else {
          // Default to false if not stored
          set({ isDeveloperMode: false });
          localStorage.setItem(STORAGE_KEYS.developer, "false");

          logger.debug("DeveloperStore", "Developer mode initialized to false (no stored value)");
        }
      } else {
        // Server-side: default to false
        set({ isDeveloperMode: false });
        logger.debug("DeveloperStore", "Developer mode initialized (server-side)");
      }
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export const useDeveloper = () => {
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);
  const toggleDeveloperMode = useDeveloperStore((state) => state.toggleDeveloperMode);

  return {
    isDeveloperMode,
    toggleDeveloperMode,
    isEnabled: isDeveloperMode,
  };
};

// ============================================================================
// DEVELOPER FEATURE HOOKS
// ============================================================================

/**
 * Hook for developer-only features
 */
export const useDeveloperFeatures = () => {
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);

  const showDebugInfo = isDeveloperMode;
  const showPerformanceMetrics = isDeveloperMode;
  const enableExperimentalFeatures = isDeveloperMode;
  const showInternalLogs = isDeveloperMode;

  return {
    isDeveloperMode,
    showDebugInfo,
    showPerformanceMetrics,
    enableExperimentalFeatures,
    showInternalLogs,
  };
};

/**
 * Hook for conditional developer rendering
 */
export const useDevOnly = () => {
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);

  const DevOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return isDeveloperMode ? <>{children}</> : null;
  };

  return {
    isDeveloperMode,
    DevOnly,
  };
};

/**
 * Hook for developer debugging utilities
 */
export const useDeveloperDebug = () => {
  const isDeveloperMode = useDeveloperStore((state) => state.isDeveloperMode);

  const debugLog = (message: string, data?: any) => {
    if (isDeveloperMode) {
      console.log(`[DEV] ${message}`, data);
    }
  };

  const debugWarn = (message: string, data?: any) => {
    if (isDeveloperMode) {
      console.warn(`[DEV] ${message}`, data);
    }
  };

  const debugError = (message: string, data?: any) => {
    if (isDeveloperMode) {
      console.error(`[DEV] ${message}`, data);
    }
  };

  const debugTable = (data: any) => {
    if (isDeveloperMode) {
      console.table(data);
    }
  };

  const debugTime = (label: string) => {
    if (isDeveloperMode) {
      console.time(`[DEV] ${label}`);
    }
  };

  const debugTimeEnd = (label: string) => {
    if (isDeveloperMode) {
      console.timeEnd(`[DEV] ${label}`);
    }
  };

  return {
    isDeveloperMode,
    debugLog,
    debugWarn,
    debugError,
    debugTable,
    debugTime,
    debugTimeEnd,
  };
};
