import type { DietaryPreferences } from "@/app/actions/meal-planner";

export interface MealPlanWizardProps {
  latestDiagnosis?: DiagnosisData;
  dietaryPreferences?: DietaryPreferences | null;
}

export interface DiagnosisData {
  id?: string;
  session_id?: string;
  constitution?: {
    name?: string;
  } | string;
  progress?: number;
}

export interface MealPlan {
  id?: string;
  progress?: number;
  days?: MealPlanDay[];
}

export interface MealPlanDay {
  date: string;
  meals: Meal[];
}

export interface Meal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description?: string;
  tcmProperties?: string[];
}

export type WizardState = "loading" | "preferences" | "ready" | "generating" | "complete";

export interface GeneratingMessage {
  emoji: string;
  text: string;
}
