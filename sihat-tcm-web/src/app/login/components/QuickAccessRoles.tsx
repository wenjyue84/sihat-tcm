"use client";

import { PatientIcon, DoctorIcon, AdminIcon, DeveloperIcon } from "./RoleIcons";
import { getColorClasses } from "../constants";

interface QuickAccessRolesProps {
  onQuickLogin: (role: "patient" | "doctor" | "admin" | "developer") => void;
  loading: boolean;
  translations: {
    quickAccess: string;
    roles: {
      patient: { title: string; titleZh: string };
      doctor: { title: string; titleZh: string };
      admin: { title: string; titleZh: string };
      developer: { title: string; titleZh: string };
    };
  };
}

export function QuickAccessRoles({ onQuickLogin, loading, translations }: QuickAccessRolesProps) {
  const roles = [
    {
      id: "patient" as const,
      title: translations.roles.patient.title,
      chinese: translations.roles.patient.titleZh,
      icon: PatientIcon,
      color: "emerald",
    },
    {
      id: "doctor" as const,
      title: translations.roles.doctor.title,
      chinese: translations.roles.doctor.titleZh,
      icon: DoctorIcon,
      color: "amber",
    },
    {
      id: "admin" as const,
      title: translations.roles.admin.title,
      chinese: translations.roles.admin.titleZh,
      icon: AdminIcon,
      color: "slate",
    },
    {
      id: "developer" as const,
      title: translations.roles.developer.title,
      chinese: translations.roles.developer.titleZh,
      icon: DeveloperIcon,
      color: "violet",
    },
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
        {translations.quickAccess}
      </h3>
      <div className="space-y-3">
        {roles.map((role) => {
          const colorClasses = getColorClasses(role.color);
          return (
            <button
              key={role.id}
              onClick={() => onQuickLogin(role.id)}
              disabled={loading}
              className="w-full group relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-3 transition-all duration-200 flex items-center gap-4"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg ${colorClasses.iconBg} flex items-center justify-center text-white`}
              >
                <role.icon />
              </div>
              <div className="flex-grow text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 text-sm">{role.title}</span>
                  <span className="text-xs text-gray-400">{role.chinese}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
