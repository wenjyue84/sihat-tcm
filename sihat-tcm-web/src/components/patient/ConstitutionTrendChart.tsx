"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DiagnosisSession } from "@/types/database";
import { extractConstitutionTrend } from "@/lib/utils/trend-data";

interface ConstitutionTrendChartProps {
  sessions?: DiagnosisSession[];
  loading?: boolean;
}

const ELEMENT_COLORS = {
  wood: "#10b981", // Green
  fire: "#ef4444", // Red
  earth: "#eab308", // Yellow
  metal: "#6b7280", // Gray
  water: "#3b82f6", // Blue
};

export function ConstitutionTrendChart({
  sessions = [],
  loading = false,
}: ConstitutionTrendChartProps) {
  // Show loading skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] w-full animate-pulse">
        <div className="h-full w-full bg-slate-100 rounded-md" />
      </div>
    );
  }

  // Transform session data into chart-ready format
  const trendData = extractConstitutionTrend(sessions);

  // Show empty state if insufficient data
  if (trendData.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center px-4">
        <svg
          className="w-16 h-16 text-slate-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-muted-foreground text-sm">
          Complete at least 2 diagnoses to see your constitution trends
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="wood" stroke={ELEMENT_COLORS.wood} name="Wood (木)" />
        <Line type="monotone" dataKey="fire" stroke={ELEMENT_COLORS.fire} name="Fire (火)" />
        <Line type="monotone" dataKey="earth" stroke={ELEMENT_COLORS.earth} name="Earth (土)" />
        <Line type="monotone" dataKey="metal" stroke={ELEMENT_COLORS.metal} name="Metal (金)" />
        <Line type="monotone" dataKey="water" stroke={ELEMENT_COLORS.water} name="Water (水)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
