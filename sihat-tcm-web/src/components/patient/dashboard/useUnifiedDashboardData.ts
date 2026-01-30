/**
 * Hook for managing UnifiedDashboard data fetching
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState, useEffect } from "react";
import { getPatientHistory, getHealthTrends } from "@/lib/actions";
import type { DiagnosisSession } from "@/types/database";

interface UseUnifiedDashboardDataReturn {
  sessions: DiagnosisSession[];
  trendData: unknown;
  loadingSessions: boolean;
}

export function useUnifiedDashboardData(userId: string | undefined): UseUnifiedDashboardDataReturn {
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [trendData, setTrendData] = useState<unknown>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    async function loadHealthData() {
      if (!userId) return;

      try {
        setLoadingSessions(true);
        const [historyResult, trendsResult] = await Promise.all([
          getPatientHistory(50, 0),
          getHealthTrends(30),
        ]);

        // Debug logging
        console.log("[UnifiedDashboard] Health data fetch result:", {
          historySuccess: historyResult.success,
          historyDataLength: historyResult.data?.length || 0,
          historyError: historyResult.error,
          userId,
        });

        if (historyResult.success && historyResult.data) {
          setSessions(historyResult.data);
          console.log("[UnifiedDashboard] Loaded sessions:", historyResult.data.length);
        } else if (historyResult.success && !historyResult.data) {
          // Success but no data - this is normal for new users
          setSessions([]);
          console.log("[UnifiedDashboard] No sessions found (user may be new)");
        } else {
          // Error case
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
  }, [userId]);

  return {
    sessions,
    trendData,
    loadingSessions,
  };
}



