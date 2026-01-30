"use client";

import { SIZE_CLASSES, STATUS_CONFIG } from "../constants";
import type { StatusIndicatorProps } from "../types";

export function StatusIndicator({ status, size = "md" }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bg}`}>
      <Icon className={`${SIZE_CLASSES[size]} ${config.color}`} />
      <span className={`text-sm font-medium capitalize ${config.color}`}>{status}</span>
    </div>
  );
}
