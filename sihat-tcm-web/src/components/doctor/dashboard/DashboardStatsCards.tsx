"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Clock } from "lucide-react";
import type { DashboardStats } from "../hooks/useDoctorDashboard";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const statsData = [
    {
      key: "patients",
      value: stats.uniquePatients,
      label: "Unique Patients",
      icon: Users,
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      key: "total",
      value: stats.total,
      label: "Total Inquiries",
      icon: Activity,
      color: "green",
      bgGradient: "from-green-500 to-emerald-600",
    },
    {
      key: "recent",
      value: stats.recent,
      label: "Last 7 Days",
      icon: Clock,
      color: "purple",
      bgGradient: "from-purple-500 to-indigo-600",
    },
  ];

  return (
    <div className="relative mb-6">
      {/* Mobile: Horizontal scroll | Desktop: Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        {statsData.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={stat.key}
              className={`min-w-[160px] sm:min-w-[180px] md:min-w-0 snap-center bg-white/90 backdrop-blur border-${stat.color}-100 shadow-sm hover:shadow-md transition-shadow shrink-0 md:shrink`}
            >
              <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.bgGradient} rounded-xl flex items-center justify-center shadow-sm`}
                >
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Scroll indicator gradient - mobile only */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none md:hidden" />
    </div>
  );
}
