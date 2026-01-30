"use client";

import { useState, useEffect, useCallback } from "react";
import type { SystemHealthDashboardData } from "@/types/monitoring";
import { AUTO_REFRESH_INTERVAL_MS } from "../constants";

export function useSystemHealth() {
  const [dashboardData, setDashboardData] = useState<SystemHealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showResolvedErrors, setShowResolvedErrors] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/system-health");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toggleErrorResolved = useCallback(
    async (errorId: string) => {
      console.log("Toggle resolved status for error:", errorId);
      await fetchDashboardData();
    },
    [fetchDashboardData]
  );

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  const toggleShowResolvedErrors = useCallback(() => {
    setShowResolvedErrors((prev) => !prev);
  }, []);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, AUTO_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh]);

  return {
    dashboardData,
    loading,
    error,
    refreshing,
    autoRefresh,
    showResolvedErrors,
    handleRefresh,
    toggleAutoRefresh,
    toggleShowResolvedErrors,
    toggleErrorResolved,
  };
}
