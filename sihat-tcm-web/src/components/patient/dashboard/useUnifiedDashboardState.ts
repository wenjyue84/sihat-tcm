/**
 * Hook for managing UnifiedDashboard state
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState, useEffect } from "react";
import type { DashboardSection, ViewType, SortField, SortDirection } from "./dashboardTypes";

interface UseUnifiedDashboardStateOptions {
  updatePreferences: (prefs: Record<string, unknown>) => void;
  profilePreferences?: Record<string, unknown>;
}

interface UseUnifiedDashboardStateReturn {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  viewType: ViewType;
  setViewType: (type: ViewType) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (dir: SortDirection) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function useUnifiedDashboardState({
  updatePreferences,
  profilePreferences,
}: UseUnifiedDashboardStateOptions): UseUnifiedDashboardStateReturn {
  const [viewType, setViewTypeState] = useState<ViewType>("table");
  const [sortField, setSortFieldState] = useState<SortField>("date");
  const [sortDirection, setSortDirectionState] = useState<SortDirection>("desc");
  const [activeSection, setActiveSectionState] = useState<DashboardSection>("journey");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize from profile preferences
  useEffect(() => {
    if (profilePreferences) {
      if (profilePreferences.viewType)
        setViewTypeState(profilePreferences.viewType as ViewType);
      if (profilePreferences.sortField)
        setSortFieldState(profilePreferences.sortField as SortField);
      if (profilePreferences.sortDirection)
        setSortDirectionState(profilePreferences.sortDirection as SortDirection);
      if (profilePreferences.activeSection)
        setActiveSectionState(profilePreferences.activeSection as DashboardSection);
    }
  }, [profilePreferences]);

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

  const setActiveSection = (section: DashboardSection) => {
    setActiveSectionState(section);
    updatePreferences({ activeSection: section });
  };

  return {
    activeSection,
    setActiveSection,
    viewType,
    setViewType,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  };
}


