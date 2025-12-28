/**
 * Type definitions for UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

export type ViewType = "table" | "list" | "gallery";
export type SortField = "date" | "score" | "diagnosis";
export type SortDirection = "asc" | "desc";

export type DashboardSection =
  | "journey"
  | "profile"
  | "documents"
  | "meals"
  | "snore"
  | "qi-dose"
  | "vitality"
  | "community"
  | "family"
  | "settings"
  | "five-elements"
  | "heart-companion"
  | "communication";

