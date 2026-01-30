export function calculateBMI(height?: number, weight?: number): number | null {
  if (!height || !weight) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return bmi;
}

export interface BMICategory {
  label: string;
  color: string;
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-100 text-blue-700" };
  if (bmi < 25) return { label: "Normal", color: "bg-green-100 text-green-700" };
  if (bmi < 30) return { label: "Overweight", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Obese", color: "bg-red-100 text-red-700" };
}
