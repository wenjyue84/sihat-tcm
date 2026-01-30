"use client";

/**
 * DashboardContent stub - this file is currently unused
 * The actual content is in dashboard/UnifiedDashboardContent.tsx
 *
 * Keeping this file as a stub to avoid breaking imports if any exist.
 */

import { ActiveSection } from "../hooks/usePatientDashboardState";

interface DashboardContentProps {
  activeSection: ActiveSection;
  mealSubSection?: "plan" | "checker";
  onMealSubSectionChange?: (section: "plan" | "checker") => void;
  [key: string]: unknown;
}

export function DashboardContent({ activeSection }: DashboardContentProps) {
  return (
    <div className="p-4">
      <p className="text-slate-500">Section: {activeSection}</p>
    </div>
  );
}
