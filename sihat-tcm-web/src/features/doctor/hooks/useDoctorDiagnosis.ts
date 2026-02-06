"use client";

import { useState, useEffect, useCallback } from "react";
import type { FileData } from "@/types/diagnosis";

// Re-export for backwards compatibility
export type { FileData };

export interface DoctorDiagnosisData {
  patientInfo: {
    name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
  };
  selectedSymptoms: string[];
  otherSymptoms: string;
  tongueImage: string;
  faceImage: string;
  inquiryAnswers: Record<string, string[]>;
  uploadedReports: FileData[];
  currentMedicines: string;
  clinicalNotes: string;
  treatmentPlan: string;
}

const STORAGE_KEY = "doctor-diagnosis-draft";

export const initialData: DoctorDiagnosisData = {
  patientInfo: {
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  },
  selectedSymptoms: [],
  otherSymptoms: "",
  tongueImage: "",
  faceImage: "",
  inquiryAnswers: {},
  uploadedReports: [],
  currentMedicines: "",
  clinicalNotes: "",
  treatmentPlan: "",
};

export function useDoctorDiagnosis() {
  const [data, setData] = useState<DoctorDiagnosisData>(initialData);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        setHasSavedDraft(true);
      }
    } catch (error) {
      console.error("Error restoring doctor diagnosis draft:", error);
    }
    setIsInitialized(true);
  }, []);

  // Auto-save to localStorage on data change
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // Check if data is different from initial (non-empty)
      const hasData =
        data.patientInfo.name ||
        data.patientInfo.age ||
        data.selectedSymptoms.length > 0 ||
        data.otherSymptoms ||
        data.tongueImage ||
        data.faceImage ||
        Object.keys(data.inquiryAnswers).length > 0 ||
        data.currentMedicines;

      if (hasData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error saving doctor diagnosis draft:", error);
    }
  }, [data, isInitialized]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setData(initialData);
      setHasSavedDraft(false);
    } catch (error) {
      console.error("Error clearing doctor diagnosis draft:", error);
    }
  }, []);

  return {
    data,
    setData,
    clearDraft,
    hasSavedDraft,
    isInitialized,
  };
}
