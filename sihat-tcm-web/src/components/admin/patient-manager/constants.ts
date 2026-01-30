export const ITEMS_PER_PAGE = 10;

export const INITIAL_FORM_DATA = {
  full_name: "",
  age: undefined,
  gender: "",
  height: undefined,
  weight: undefined,
  medical_history: "",
  role: "patient" as const,
};

export const BMI_THRESHOLDS = {
  UNDERWEIGHT: 18.5,
  NORMAL: 25,
  OVERWEIGHT: 30,
} as const;

export const BMI_CATEGORIES = {
  UNDERWEIGHT: { label: "Underweight", color: "bg-blue-100 text-blue-700" },
  NORMAL: { label: "Normal", color: "bg-green-100 text-green-700" },
  OVERWEIGHT: { label: "Overweight", color: "bg-yellow-100 text-yellow-700" },
  OBESE: { label: "Obese", color: "bg-red-100 text-red-700" },
} as const;

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
] as const;
