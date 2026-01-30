import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const SIZE_CLASSES = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
} as const;

export const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  degraded: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-100" },
  unhealthy: { icon: XCircle, color: "text-red-500", bg: "bg-red-100" },
} as const;

export const SEVERITY_CONFIG = {
  low: { color: "bg-blue-100 text-blue-800", label: "Low" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
  high: { color: "bg-orange-100 text-orange-800", label: "High" },
  critical: { color: "bg-red-100 text-red-800", label: "Critical" },
} as const;

export const AUTO_REFRESH_INTERVAL_MS = 30000;

export const ERROR_THRESHOLDS = {
  LOW: 10,
  MEMORY_WARNING: 75,
  MEMORY_CRITICAL: 90,
} as const;
