"use client";

import { User, UserCog, Stethoscope, Shield, Terminal } from "lucide-react";
import { UserStats, RoleFilter } from "../types";

interface StatsOverviewProps {
  stats: UserStats;
  roleFilter: RoleFilter;
  onRoleFilterChange: (role: RoleFilter) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  role: RoleFilter;
  currentFilter: RoleFilter;
  ringColor: string;
  hoverBg: string;
  textColor: string;
  onClick: () => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  role,
  currentFilter,
  ringColor,
  hoverBg,
  textColor,
  onClick,
}: StatCardProps) {
  const isActive = currentFilter === role;

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isActive ? `ring-2 ${ringColor}` : hoverBg
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${textColor}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

export function StatsOverview({ stats, roleFilter, onRoleFilterChange }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="All Users"
        value={stats.total}
        icon={UserCog}
        role="all"
        currentFilter={roleFilter}
        ringColor="ring-stone-400"
        hoverBg="hover:bg-stone-50"
        textColor="text-stone-700"
        onClick={() => onRoleFilterChange("all")}
      />
      <StatCard
        label="Patients"
        value={stats.patients}
        icon={User}
        role="patient"
        currentFilter={roleFilter}
        ringColor="ring-emerald-400"
        hoverBg="hover:bg-emerald-50"
        textColor="text-emerald-600"
        onClick={() => onRoleFilterChange("patient")}
      />
      <StatCard
        label="Doctors"
        value={stats.doctors}
        icon={Stethoscope}
        role="doctor"
        currentFilter={roleFilter}
        ringColor="ring-blue-400"
        hoverBg="hover:bg-blue-50"
        textColor="text-blue-600"
        onClick={() => onRoleFilterChange("doctor")}
      />
      <StatCard
        label="Admins"
        value={stats.admins}
        icon={Shield}
        role="admin"
        currentFilter={roleFilter}
        ringColor="ring-amber-400"
        hoverBg="hover:bg-amber-50"
        textColor="text-amber-600"
        onClick={() => onRoleFilterChange("admin")}
      />
      <StatCard
        label="Developers"
        value={stats.developers}
        icon={Terminal}
        role="developer"
        currentFilter={roleFilter}
        ringColor="ring-violet-400"
        hoverBg="hover:bg-violet-50"
        textColor="text-violet-600"
        onClick={() => onRoleFilterChange("developer")}
      />
    </div>
  );
}
