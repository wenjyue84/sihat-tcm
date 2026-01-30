"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateMealPlan,
  getActiveMealPlan,
  DietaryPreferences,
} from "@/app/actions/meal-planner";
import { GENERATING_MESSAGES, MESSAGE_ROTATION_INTERVAL_MS } from "../constants";
import type { MealPlan, DiagnosisData } from "../types";

interface UseMealPlanWizardProps {
  latestDiagnosis?: DiagnosisData;
  externalPreferences?: DietaryPreferences | null;
}

export function useMealPlanWizard({
  latestDiagnosis,
  externalPreferences,
}: UseMealPlanWizardProps) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(
    externalPreferences || null
  );
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update preferences when external preferences change
  useEffect(() => {
    if (externalPreferences) {
      setDietaryPreferences(externalPreferences);
    }
  }, [externalPreferences]);

  // Load existing plan on mount
  useEffect(() => {
    async function loadData() {
      try {
        const planResult = await getActiveMealPlan();
        if (planResult.success && planResult.data) {
          setMealPlan(planResult.data);
        }
      } catch (err) {
        console.error("[MealPlanWizard] Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!latestDiagnosis) {
      setError("Please complete a TCM diagnosis first to generate a personalized meal plan.");
      return;
    }

    setGenerating(true);
    setError(null);

    let messageIndex = 0;
    setLoadingMessage(`${GENERATING_MESSAGES[0].emoji} ${GENERATING_MESSAGES[0].text}`);

    intervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % GENERATING_MESSAGES.length;
      const msg = GENERATING_MESSAGES[messageIndex];
      setLoadingMessage(`${msg.emoji} ${msg.text}`);
    }, MESSAGE_ROTATION_INTERVAL_MS);

    try {
      const result = await generateMealPlan({
        diagnosisReport: latestDiagnosis,
        sessionId: latestDiagnosis?.id || latestDiagnosis?.session_id,
        dietaryPreferences: dietaryPreferences || undefined,
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (result.success) {
        setMealPlan(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to generate meal plan");
      }
    } catch (err: unknown) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [latestDiagnosis, dietaryPreferences]);

  const handlePreferencesSaved = useCallback((prefs: DietaryPreferences) => {
    setDietaryPreferences(prefs);
    setShowPreferencesForm(false);
  }, []);

  const clearMealPlan = useCallback(() => {
    setMealPlan(null);
  }, []);

  return {
    // State
    mealPlan,
    loading,
    generating,
    loadingMessage,
    error,
    dietaryPreferences,
    showPreferencesForm,
    // Actions
    setShowPreferencesForm,
    handleGenerate,
    handlePreferencesSaved,
    clearMealPlan,
  };
}
