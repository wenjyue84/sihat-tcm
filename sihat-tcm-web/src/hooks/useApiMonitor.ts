import { useState, useMemo } from "react";

export interface ApiEndpoint {
  path: string;
  method: string;
  type: string;
  status: number;
  latency: string;
}

export interface ApiGroup {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const getLatencyValue = (str: string) => {
  if (str.endsWith("ms")) return parseInt(str);
  if (str.endsWith("s")) return parseFloat(str) * 1000;
  return 0;
};

export function useApiMonitor(initialGroups: ApiGroup[]) {
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>(initialGroups);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "default",
    direction: "asc",
  });

  const sortedGroups = useMemo(() => {
    return [...apiGroups].map((group) => {
      if (sortConfig.key === "default") return group;

      const sortedEndpoints = [...group.endpoints].sort((a, b) => {
        if (sortConfig.key === "latency") {
          const valA = getLatencyValue(a.latency);
          const valB = getLatencyValue(b.latency);
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });

      return { ...group, endpoints: sortedEndpoints };
    });
  }, [apiGroups, sortConfig]);

  const generateTroubleshootPrompt = (endpoint: ApiEndpoint) => {
    const prompt = `Act as a senior software engineer. The API route \`${endpoint.path}\` is experiencing issues or requires optimization.
        
Current Status:
- Method: ${endpoint.method}
- Response Code: ${endpoint.status}
- Latency: ${endpoint.latency}
- Type: ${endpoint.type}

Please analyze the implementation of this route (likely in \`src/app${endpoint.path}/route.ts\`) and suggest improvements for error handling, performance optimization, and robustness. If there are known issues with this status code, provide a fix.`;

    navigator.clipboard.writeText(prompt);
    alert("Troubleshoot prompt copied to clipboard!");
  };

  return {
    sortedGroups,
    sortConfig,
    setSortConfig,
    generateTroubleshootPrompt,
    getLatencyValue,
  };
}

