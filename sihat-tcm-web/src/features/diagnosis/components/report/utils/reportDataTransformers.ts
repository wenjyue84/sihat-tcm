/**
 * Data transformation utilities for DiagnosisReport
 * Extracted from DiagnosisReport.tsx to improve maintainability
 */

import type { DiagnosisReport } from "@/types/database";
import type { PDFGenerationData } from "@/types/pdf";

/**
 * Get food recommendations from report data
 */
export function getFoodRecommendations(data: DiagnosisReport | PDFGenerationData): string[] {
  if (data.recommendations?.food_therapy?.beneficial) {
    return data.recommendations.food_therapy.beneficial;
  }
  return data.recommendations?.food || [];
}

/**
 * Get foods to avoid from report data
 */
export function getFoodsToAvoid(data: DiagnosisReport | PDFGenerationData): string[] {
  if (data.recommendations?.food_therapy?.avoid) {
    return data.recommendations.food_therapy.avoid;
  }
  return data.recommendations?.avoid || [];
}

/**
 * Get recipes from report data
 */
export function getRecipes(data: DiagnosisReport | PDFGenerationData): any[] {
  return data.recommendations?.food_therapy?.recipes || [];
}

