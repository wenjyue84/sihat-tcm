import { useEffect, useState, useCallback } from "react";

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

export function useSystemLogs(logLevelFilter: string = "all") {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLogsLoading(true);
      try {
        const levelParam = logLevelFilter !== "all" ? `&level=${logLevelFilter}` : "";
        const res = await fetch(`/api/logs?limit=100${levelParam}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setSystemLogs(data.logs || []);
        setLogsError(null);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogsError(err instanceof Error ? err.message : "Failed to fetch logs");
      } finally {
        setLogsLoading(false);
      }
    },
    [logLevelFilter]
  );

  useEffect(() => {
    fetchLogs();
    // Auto-refresh logs every 5 seconds
    const logsInterval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(logsInterval);
  }, [fetchLogs]);

  return {
    systemLogs,
    logsLoading,
    logsError,
    fetchLogs,
  };
}

