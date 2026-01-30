/**
 * Hook for auto-filling form data from various sources
 * Extracted from BasicInfoForm.tsx to improve maintainability
 */

import { useEffect, useState, useCallback } from "react";
import type { BasicInfoData } from "../types";

interface UseAutoFillFormDataOptions {
  /**
   * Initial form data
   */
  initialData?: BasicInfoData;
  /**
   * Auto-filled data from profile
   */
  profileData?: Partial<BasicInfoData> | null;
  /**
   * Whether to load from localStorage
   */
  loadFromLocalStorage?: boolean;
}

interface UseAutoFillFormDataResult {
  /**
   * Current form data
   */
  formData: BasicInfoData;
  /**
   * Function to update form data
   */
  setFormData: React.Dispatch<React.SetStateAction<BasicInfoData>>;
  /**
   * Function to reset form data to defaults
   */
  resetFormData: () => void;
}

const DEFAULT_FORM_DATA: BasicInfoData = {
  name: "anonymous",
  age: "",
  gender: "",
  weight: "",
  height: "",
  mainComplaint: "",
  otherSymptoms: "",
  symptoms: "",
  symptomDuration: "",
};

/**
 * Hook for managing form data with auto-fill from multiple sources
 */
export function useAutoFillFormData(
  options: UseAutoFillFormDataOptions = {}
): UseAutoFillFormDataResult {
  const { initialData, profileData, loadFromLocalStorage = true } = options;

  const [formData, setFormData] = useState<BasicInfoData>(
    initialData || DEFAULT_FORM_DATA
  );

  const resetFormData = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  // Load from localStorage (e.g., from Patient Portal redirect)
  useEffect(() => {
    if (!loadFromLocalStorage) return;

    const savedProfileData = localStorage.getItem("patientProfileData");
    if (savedProfileData) {
      try {
        const profileData = JSON.parse(savedProfileData);
        setFormData((prev) => ({
          ...prev,
          name: profileData.name ?? prev.name ?? "",
          age: profileData.age ?? prev.age ?? "",
          gender: profileData.gender ?? prev.gender ?? "",
          weight: profileData.weight ?? prev.weight ?? "",
          height: profileData.height ?? prev.height ?? "",
        }));
        localStorage.removeItem("patientProfileData");
      } catch (e) {
        console.error("Error loading profile data:", e);
      }
    }
  }, [loadFromLocalStorage]);

  // Auto-fill from profile data
  useEffect(() => {
    if (profileData) {
      setFormData((prev) => ({
        ...prev,
        name: profileData.name || prev.name,
        age: profileData.age || prev.age,
        gender: profileData.gender || prev.gender,
        weight: profileData.weight || prev.weight,
        height: profileData.height || prev.height,
      }));
    }
  }, [profileData]);

  // Sync with initialData changes (e.g., when profile loads or test data is set)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        name: initialData.name ?? prev.name ?? "",
        age: initialData.age ?? prev.age ?? "",
        gender: (initialData.gender ?? prev.gender ?? "").toLowerCase(),
        weight: initialData.weight ?? prev.weight ?? "",
        height: initialData.height ?? prev.height ?? "",
        symptoms: initialData.symptoms ?? prev.symptoms ?? "",
        symptomDuration: initialData.symptomDuration ?? prev.symptomDuration ?? "",
      }));
    }
  }, [initialData]);

  return {
    formData,
    setFormData,
    resetFormData,
  };
}



