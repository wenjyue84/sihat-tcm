import { ExternalLink, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiGroup, useApiMonitor } from "@/hooks/useApiMonitor";

interface ApiMonitorTabProps {
  initialGroups: ApiGroup[];
}

export function ApiMonitorTab({ initialGroups }: ApiMonitorTabProps) {
  const { sortedGroups, sortConfig, setSortConfig, generateTroubleshootPrompt, getLatencyValue } =
    useApiMonitor(initialGroups);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">API Monitor</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          <select
            className="bg-[#0f0f11] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
            value={
              sortConfig.key === "default"
                ? "default"
                : `${sortConfig.key}-${sortConfig.direction}`
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "default") setSortConfig({ key: "default", direction: "asc" });
              else {
                const [key, dir] = val.split("-");
                setSortConfig({ key, direction: dir as "asc" | "desc" });
              }
            }}
          >
            <option value="default">Default Grouping</option>
            <option value="latency-desc">Highest Latency</option>
            <option value="latency-asc">Lowest Latency</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {sortedGroups.map((group, groupIndex) => (
          <Card
            key={groupIndex}
            className="bg-[#0f0f11] border-white/10 text-white overflow-hidden"
          >
            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-violet-100">
                    {group.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-1">
                    {group.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {group.endpoints.map((endpoint, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 w-64">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded w-16 text-center border ${
                            endpoint.method === "GET"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <p className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">
                          {endpoint.path}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                        {endpoint.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right w-20">
                        <p className="text-xs font-mono text-emerald-400">{endpoint.status}</p>
                      </div>
                      <div className="text-right w-20">
                        <p
                          className={`text-xs font-mono ${
                            getLatencyValue(endpoint.latency) > 1000
                              ? "text-amber-400"
                              : "text-gray-400"
                          }`}
                        >
                          {endpoint.latency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10"
                          onClick={() => generateTroubleshootPrompt(endpoint)}
                          title="Analyze"
                        >
                          <Wrench className="w-4 h-4" />
                        </Button>
                        <a
                          href={endpoint.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


