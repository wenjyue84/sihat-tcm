import { useState, useEffect } from "react";
import { useAuth } from "@/stores/useAppStore";
import { DiagnosisSession, MedicalReport } from "@/types/database";
import {
  getPatientHistory,
  getHealthTrends,
  getMedicalReports,
} from "@/lib/actions";

export type ViewType = "table" | "list" | "gallery";
export type SortField = "date" | "score" | "diagnosis";
export type SortDirection = "asc" | "desc";
export type ActiveSection =
  | "journey"
  | "profile"
  | "documents"
  | "meals"
  | "snore"
  | "qi-dose"
  | "vitality"
  | "community"
  | "family"
  | "settings"
  | "five-elements"
  | "heart-companion"
  | "communication";

/**
 * Custom hook for managing patient dashboard state
 * Extracted from UnifiedDashboard to improve maintainability
 */
export function usePatientDashboardState() {
  const { user, profile, updatePreferences } = useAuth();

  // Health Journey State
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // View & Sort State
  const [viewType, setViewTypeState] = useState<ViewType>("table");
  const [sortField, setSortFieldState] = useState<SortField>("date");
  const [sortDirection, setSortDirectionState] = useState<SortDirection>("desc");

  // Active Section
  const [activeSection, setActiveSectionState] = useState<ActiveSection>("journey");
  const [mealSubSection, setMealSubSection] = useState<"plan" | "checker">("plan");

  // Initialize from profile preferences
  useEffect(() => {
    if (profile?.preferences) {
      if (profile.preferences.viewType) setViewTypeState(profile.preferences.viewType as ViewType);
      if (profile.preferences.sortField)
        setSortFieldState(profile.preferences.sortField as SortField);
      if (profile.preferences.sortDirection)
        setSortDirectionState(profile.preferences.sortDirection as SortDirection);
      if (profile.preferences.activeSection)
        setActiveSectionState(profile.preferences.activeSection as ActiveSection);
    }
  }, [profile]);

  // Wrappers to update state and sync preferences
  const setViewType = (type: ViewType) => {
    setViewTypeState(type);
    updatePreferences({ viewType: type });
  };

  const setSortField = (field: SortField) => {
    setSortFieldState(field);
    updatePreferences({ sortField: field });
  };

  const setSortDirection = (dir: SortDirection) => {
    setSortDirectionState(dir);
    updatePreferences({ sortDirection: dir });
  };

  const setActiveSection = (section: ActiveSection) => {
    setActiveSectionState(section);
    updatePreferences({ activeSection: section });
  };

  // Load health journey data
  useEffect(() => {
    async function loadHealthData() {
      if (!user) return;

      try {
        setLoadingSessions(true);
        const [historyResult, trendsResult] = await Promise.all([
          getPatientHistory(50, 0),
          getHealthTrends(30),
        ]);

        if (historyResult.success && historyResult.data) {
          setSessions(historyResult.data);
        } else if (historyResult.success && !historyResult.data) {
          setSessions([]);
        } else {
          console.error("[UnifiedDashboard] Failed to load history:", historyResult.error);
          setSessions([]);
        }

        if (trendsResult.success && trendsResult.data) {
          setTrendData(trendsResult.data);
        }
      } catch (err) {
        console.error("[UnifiedDashboard] Error loading health data:", err);
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadHealthData();
  }, [user]);

  return {
    // State
    sessions,
    trendData,
    loadingSessions,
    viewType,
    sortField,
    sortDirection,
    activeSection,
    mealSubSection,
    // Setters
    setSessions,
    setTrendData,
    setViewType,
    setSortField,
    setSortDirection,
    setActiveSection,
    setMealSubSection,
  };
}


