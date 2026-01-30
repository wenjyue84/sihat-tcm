"use client";

import { Badge } from "@/components/ui/badge";
import { SEVERITY_CONFIG } from "../constants";
import type { ErrorSeverity } from "@/types/monitoring";

interface SeverityBadgeProps {
  severity: ErrorSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return <Badge className={`${config.color} text-xs`}>{config.label}</Badge>;
}
