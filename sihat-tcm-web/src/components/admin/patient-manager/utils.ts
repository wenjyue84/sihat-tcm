import { BMI_THRESHOLDS, BMI_CATEGORIES } from "./constants";
import type { BMICategory, Patient } from "./types";

export function calculateBMI(height?: number, weight?: number): string | null {
  if (!height || !weight) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return bmi.toFixed(1);
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < BMI_THRESHOLDS.UNDERWEIGHT) return BMI_CATEGORIES.UNDERWEIGHT;
  if (bmi < BMI_THRESHOLDS.NORMAL) return BMI_CATEGORIES.NORMAL;
  if (bmi < BMI_THRESHOLDS.OVERWEIGHT) return BMI_CATEGORIES.OVERWEIGHT;
  return BMI_CATEGORIES.OBESE;
}

export function filterPatients(patients: Patient[], searchQuery: string): Patient[] {
  const query = searchQuery.toLowerCase();
  return patients.filter(
    (patient) =>
      patient.full_name?.toLowerCase().includes(query) ||
      patient.gender?.toLowerCase().includes(query) ||
      patient.medical_history?.toLowerCase().includes(query)
  );
}

export function paginatePatients(
  patients: Patient[],
  currentPage: number,
  itemsPerPage: number
): Patient[] {
  return patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
}

export function calculatePatientStats(patients: Patient[]): {
  total: number;
  male: number;
  female: number;
  avgAge: number;
} {
  const male = patients.filter((p) => p.gender?.toLowerCase() === "male").length;
  const female = patients.filter((p) => p.gender?.toLowerCase() === "female").length;
  const totalAge = patients.reduce((sum, p) => sum + (p.age || 0), 0);
  const avgAge = patients.length > 0 ? Math.round(totalAge / patients.length) : 0;

  return { total: patients.length, male, female, avgAge };
}
