import { User, Stethoscope, Shield, UserCog, Terminal } from "lucide-react";

export const ITEMS_PER_PAGE = 10;

export const ROLE_CONFIG = {
  patient: {
    label: "Patient",
    icon: User,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bgColor: "bg-emerald-50",
    ringColor: "ring-emerald-400",
    hoverBg: "hover:bg-emerald-50",
  },
  doctor: {
    label: "Doctor",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
    ringColor: "ring-blue-400",
    hoverBg: "hover:bg-blue-50",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    bgColor: "bg-amber-50",
    ringColor: "ring-amber-400",
    hoverBg: "hover:bg-amber-50",
  },
  developer: {
    label: "Developer",
    icon: Terminal,
    color: "bg-violet-100 text-violet-700 border-violet-200",
    bgColor: "bg-violet-50",
    ringColor: "ring-violet-400",
    hoverBg: "hover:bg-violet-50",
  },
} as const;

export type RoleKey = keyof typeof ROLE_CONFIG;
