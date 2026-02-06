/**
 * Doctor Level Constants
 *
 * Moved from doctorLevels.ts for better organization
 */

export type DoctorLevel = "master" | "expert" | "physician";

export const DOCTOR_LEVELS = {
  master: {
    id: "master",
    name: "Master",
    nameZh: "名医大师",
    description: "Most experienced, renowned doctor",
    model: "gemini-1.5-flash", // Most advanced stable model for Master level (gemini-1.5-pro deprecated)
    icon: "👨‍⚕️",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    textColor: "text-amber-800",
  },
  expert: {
    id: "expert",
    name: "Expert",
    nameZh: "专家医师",
    description: "Experienced specialist doctor",
    model: "gemini-1.5-flash", // Fast and capable model for Expert level
    icon: "🩺",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-800",
  },
  physician: {
    id: "physician",
    name: "Doctor",
    nameZh: "医师",
    description: "Standard practitioner",
    model: "gemini-2.0-flash", // Reliable and fast model for Doctor level
    icon: "💊",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    textColor: "text-blue-800",
  },
} as const;
