import { Terminal, RefreshCw, Bug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSystemLogs, SystemLog } from "@/hooks/useSystemLogs";
import { useState } from "react";

export function LogsTab() {
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const { systemLogs, logsLoading, logsError, fetchLogs } = useSystemLogs(logLevelFilter);

  return (
    <div className="h-[calc(100vh-10rem)] animate-in fade-in-50">
      <Card className="bg-[#0f0f11] border-white/10 text-white font-mono h-full flex flex-col">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-3 px-4 shrink-0 bg-[#0a0a0b]">
          <CardTitle className="text-xs uppercase tracking-widest text-violet-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Terminal Output
          </CardTitle>
          <div className="flex items-center gap-3">
            <select
              className="bg-[#0f0f11] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => fetchLogs()}
            >
              <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-gray-500">Auto-refresh</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden flex-1 relative bg-[#0a0a0b]/50">
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-1.5 text-xs leading-relaxed font-mono">
            {logsLoading && systemLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-sm">Loading system logs...</span>
              </div>
            ) : logsError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                <Bug className="w-6 h-6" />
                <span className="text-sm">Error: {logsError}</span>
                <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                  Retry
                </Button>
              </div>
            ) : systemLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Terminal className="w-8 h-8 text-gray-600" />
                <span className="text-sm">No logs yet</span>
                <p className="text-xs text-gray-600 max-w-xs text-center">
                  Logs will appear here as you interact with the application. Try running a
                  diagnosis or uploading an image.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  --- System Logs ({systemLogs.length} entries) ---
                </p>
                {systemLogs.map((log) => {
                  const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                  });
                  const levelColor =
                    {
                      info: "text-emerald-400",
                      warn: "text-amber-400",
                      error: "text-red-400",
                      debug: "text-blue-400",
                    }[log.level] || "text-gray-400";

                  return (
                    <p key={log.id} className={levelColor}>
                      <span className="text-gray-700">[{time}]</span>{" "}
                      <span className="text-gray-500">[{log.category}]</span> {log.message}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="text-gray-600 ml-2">{JSON.stringify(log.metadata)}</span>
                      )}
                    </p>
                  );
                })}
                <div className="h-4 w-2 bg-violet-500 animate-pulse mt-2"></div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
