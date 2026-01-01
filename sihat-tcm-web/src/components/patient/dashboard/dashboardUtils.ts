/**
 * Utility functions for UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DiagnosisSession } from "@/types/database";
import type { ViewType, SortField, SortDirection } from "./dashboardTypes";

export function getScoreBadge(score: number | undefined | null, t: Record<string, unknown>) {
  if (score === undefined || score === null) return null;
  if (score >= 75)
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: (t.patientDashboard?.historyTable?.good as string) || "Good",
      Icon: TrendingUp,
    };
  if (score >= 50)
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: (t.patientDashboard?.historyTable?.fair as string) || "Fair",
      Icon: Minus,
    };
  return {
    bg: "bg-red-100",
    text: "text-red-700",
    label: (t.patientDashboard?.historyTable?.needsAttention as string) || "Needs Attention",
    Icon: TrendingDown,
  };
}

export function sortSessions(
  sessions: DiagnosisSession[],
  sortField: SortField,
  sortDirection: SortDirection
): DiagnosisSession[] {
  return [...sessions].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "score":
        comparison = (a.overall_score || 0) - (b.overall_score || 0);
        break;
      case "diagnosis":
        comparison = (a.primary_diagnosis || "").localeCompare(b.primary_diagnosis || "");
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
}

export function getSectionTitle(
  activeSection: string,
  t: Record<string, unknown>
): string {
  switch (activeSection) {
    case "journey":
      return (t.patientDashboard?.tabs?.healthJourney as string) || "Health Journey";
    case "five-elements":
      return (t.patientDashboard?.tabs?.fiveElements as string) || "Circle of Health";
    case "meals":
      return (t.patientDashboard?.tabs?.mealPlanner as string) || "Dietary Therapy";
    case "snore":
      return (t.patientDashboard?.tabs?.snoreAnalysis as string) || "Sleep Cultivation";
    case "qi-dose":
      return (t.patientDashboard?.tabs?.qiDose as string) || "Guided Exercise";
    case "vitality":
      return (t.patientDashboard?.tabs?.vitalityRhythm as string) || "Meridian Clock";
    case "community":
      return (t.patientDashboard?.tabs?.community as string) || "Community";
    case "family":
      return (
        (t.familyManagement?.title as string) ||
        (t.patientDashboard?.tabs?.family as string) ||
        "Family Care"
      );
    case "profile":
      return (t.patientDashboard?.tabs?.profile as string) || "Profile";
    case "documents":
      return (t.patientDashboard?.tabs?.documents as string) || "Documents";
    case "settings":
      return (t.patientDashboard?.tabs?.settings as string) || "Settings";
    case "heart-companion":
      return (
        (t.patientDashboard?.tabs?.heartCompanion as string) ||
        (t.heartCompanion?.title as string) ||
        "Heart Companion"
      );
    case "communication":
      return "Communication";
    default:
      return (t.patientDashboard?.tabs?.healthJourney as string) || "Health Journey";
  }
}


