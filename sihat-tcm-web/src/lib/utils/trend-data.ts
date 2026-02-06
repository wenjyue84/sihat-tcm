/**
 * Trend Data Transformation Utilities
 *
 * Functions to transform diagnosis session data into chart-ready formats
 */

import { DiagnosisSession } from "@/types/database";

export interface TrendDataPoint {
  date: string;
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

/**
 * Extracts Five Elements constitution trend data from diagnosis sessions
 *
 * Maps organ scores to element scores:
 * - Liver → Wood (木)
 * - Heart → Fire (火)
 * - Spleen → Earth (土)
 * - Lung → Metal (金)
 * - Kidney → Water (水)
 *
 * @param sessions - Array of diagnosis sessions
 * @returns Array of trend data points (up to last 10 sessions)
 */
export function extractConstitutionTrend(sessions: DiagnosisSession[]): TrendDataPoint[] {
  return sessions
    .filter((session) => {
      // Only include sessions with valid Five Elements scores
      const scores = session.full_report?.analysis?.five_elements?.scores;
      return (
        scores &&
        typeof scores.liver === "number" &&
        typeof scores.heart === "number" &&
        typeof scores.spleen === "number" &&
        typeof scores.lung === "number" &&
        typeof scores.kidney === "number"
      );
    })
    .sort((a, b) => {
      // Sort by creation date ascending (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(-10) // Take last 10 sessions
    .map((session) => {
      const scores = session.full_report.analysis.five_elements!.scores;
      const date = new Date(session.created_at);

      // Format date as "MMM d" (e.g., "Jan 1")
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return {
        date: formattedDate,
        wood: scores.liver,
        fire: scores.heart,
        earth: scores.spleen,
        metal: scores.lung,
        water: scores.kidney,
      };
    });
}
