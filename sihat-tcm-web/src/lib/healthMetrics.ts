/**
 * Health metrics utilities for calculating BMI and health indicators
 */

export interface BMIResult {
  value: number;
  category: "underweight" | "normal" | "overweight" | "obese";
  color: string;
  label: string;
}

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export function calculateBMI(height: number, weight: number): BMIResult | null {
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null;
  }

  // Convert height from cm to meters
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const roundedBMI = Math.round(bmi * 10) / 10;

  let category: BMIResult["category"];
  let color: string;
  let label: string;

  if (bmi < 18.5) {
    category = "underweight";
    color = "#3b82f6"; // blue
    label = "Underweight";
  } else if (bmi < 25) {
    category = "normal";
    color = "#10b981"; // emerald
    label = "Normal";
  } else if (bmi < 30) {
    category = "overweight";
    color = "#f59e0b"; // amber
    label = "Overweight";
  } else {
    category = "obese";
    color = "#ef4444"; // red
    label = "Obese";
  }

  return {
    value: roundedBMI,
    category,
    color,
    label,
  };
}

/**
 * Get BMI percentage for visualization (0-100)
 */
export function getBMIPercentage(bmi: number): number {
  // Normalize BMI to 0-100 scale
  // Underweight: 0-18.5 (0-46%)
  // Normal: 18.5-25 (46-62%)
  // Overweight: 25-30 (62-75%)
  // Obese: 30+ (75-100%)
  if (bmi < 18.5) {
    return (bmi / 18.5) * 46;
  } else if (bmi < 25) {
    return 46 + ((bmi - 18.5) / (25 - 18.5)) * 16;
  } else if (bmi < 30) {
    return 62 + ((bmi - 25) / (30 - 25)) * 13;
  } else {
    return Math.min(75 + ((bmi - 30) / 10) * 25, 100);
  }
}
