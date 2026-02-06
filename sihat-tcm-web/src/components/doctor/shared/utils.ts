"use client";

import { differenceInYears } from "date-fns";
import type { Inquiry, MockPatientProfile } from "@/lib/mock/doctorDashboard";
import type { PatientFlag } from "@/types/database";

export interface ResolvedProfile {
  id?: string;
  full_name: string;
  age: number | string;
  gender: string;
  flag?: PatientFlag;
  isManaged?: boolean;
}

/**
 * Resolves patient identity prioritizing specific sources:
 * 1. diagnosis_report.patient_profile (entered by doctor)
 * 2. profiles (linked registered users)
 * 3. patients (doctor-managed patients)
 */
export function resolvePatientProfile(inquiry: Inquiry): ResolvedProfile {
  const dbProfile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
  const dbPatient = Array.isArray(inquiry.patients) ? inquiry.patients[0] : inquiry.patients;
  const diagnosis = inquiry.diagnosis_report;

  if (diagnosis?.patient_profile) {
    return {
      full_name: diagnosis.patient_profile.name,
      age: diagnosis.patient_profile.age,
      gender: diagnosis.patient_profile.gender,
      flag: (dbProfile as MockPatientProfile)?.flag || (dbPatient as MockPatientProfile)?.flag,
    };
  }

  if (dbProfile) {
    return {
      id: dbProfile.id,
      full_name: dbProfile.full_name,
      age: dbProfile.age,
      gender: dbProfile.gender,
      flag: (dbProfile as MockPatientProfile).flag,
    };
  }

  if (dbPatient) {
    const p = dbPatient as any;
    return {
      id: p.id,
      full_name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.full_name,
      age: p.birth_date ? differenceInYears(new Date(), new Date(p.birth_date)) : p.age || "N/A",
      gender: p.gender,
      flag: p.flag,
      isManaged: true,
    };
  }

  return { full_name: "Anonymous Patient", age: "?", gender: "Unknown" };
}
