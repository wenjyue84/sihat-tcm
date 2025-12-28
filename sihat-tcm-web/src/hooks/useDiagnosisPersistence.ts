import { useCallback } from "react";
import { logger } from "@/lib/clientLogger";
import type { DiagnosisStep } from "./diagnosis/diagnosisTypes";

const STORAGE_KEY = "sihat-tcm-diagnosis-progress";

interface PersistedState {
  step: DiagnosisStep;
  data: any;
  timestamp: string;
}

/**
 * Hook for persisting diagnosis wizard progress to localStorage.
 * Allows users to resume their session if they accidentally close the browser.
 */
export function useDiagnosisPersistence() {
  const saveProgress = useCallback((step: DiagnosisStep, data: any) => {
    try {
      const state: PersistedState = {
        step,
        data,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      logger.error("useDiagnosisPersistence", "Failed to save progress", error);
    }
  }, []);

  const loadProgress = useCallback((): PersistedState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state: PersistedState = JSON.parse(stored);

      // Check if the saved state is older than 24 hours
      const savedTime = new Date(state.timestamp).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - savedTime > twentyFourHours) {
        // Clear stale data
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return state;
    } catch (error) {
      logger.error("useDiagnosisPersistence", "Failed to load progress", error);
      return null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error("useDiagnosisPersistence", "Failed to clear progress", error);
    }
  }, []);

  return {
    saveProgress,
    loadProgress,
    clearProgress,
  };
}
