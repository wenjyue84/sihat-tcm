/**
 * Hook for managing report options state
 * Extracted from DiagnosisSummary.tsx to improve maintainability
 */

import { useState, useCallback } from "react";

export interface ReportOptions {
  // Patient Information Section
  includePatientName: boolean;
  includePatientAge: boolean;
  includePatientGender: boolean;
  includePatientContact: boolean;
  includePatientAddress: boolean;
  includeEmergencyContact: boolean;

  // Vital Signs & Measurements
  includeVitalSigns: boolean;
  includeBMI: boolean;
  includeSmartConnectData: boolean;

  // Medical History
  includeMedicalHistory: boolean;
  includeAllergies: boolean;
  includeCurrentMedications: boolean;
  includePastDiagnoses: boolean;
  includeFamilyHistory: boolean;

  // TCM Recommendations
  suggestMedicine: boolean;
  suggestDoctor: boolean;
  includeDietary: boolean;
  includeLifestyle: boolean;
  includeAcupuncture: boolean;
  includeExercise: boolean;
  includeSleepAdvice: boolean;
  includeEmotionalWellness: boolean;

  // Report Extras
  includePrecautions: boolean;
  includeFollowUp: boolean;
  includeQRCode: boolean;
  includeTimestamp: boolean;
  includeDoctorSignature: boolean;
}

/**
 * Default report options
 */
export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  // Patient Information - defaults
  includePatientName: true,
  includePatientAge: true,
  includePatientGender: true,
  includePatientContact: false,
  includePatientAddress: false,
  includeEmergencyContact: false,

  // Vital Signs & Measurements
  includeVitalSigns: true,
  includeBMI: true,
  includeSmartConnectData: true,

  // Medical History
  includeMedicalHistory: false,
  includeAllergies: false,
  includeCurrentMedications: false,
  includePastDiagnoses: false,
  includeFamilyHistory: false,

  // TCM Recommendations
  suggestMedicine: true,
  suggestDoctor: true,
  includeDietary: true,
  includeLifestyle: true,
  includeAcupuncture: true,
  includeExercise: true,
  includeSleepAdvice: true,
  includeEmotionalWellness: false,

  // Report Extras
  includePrecautions: true,
  includeFollowUp: true,
  includeQRCode: false,
  includeTimestamp: true,
  includeDoctorSignature: false,
};

/**
 * Hook for managing report options
 */
export function useReportOptions(initialOptions?: Partial<ReportOptions>) {
  const [options, setOptions] = useState<ReportOptions>({
    ...DEFAULT_REPORT_OPTIONS,
    ...initialOptions,
  });

  const handleOptionChange = useCallback(
    (key: keyof ReportOptions, checked: boolean) => {
      setOptions((prev) => ({ ...prev, [key]: checked }));
    },
    []
  );

  const resetOptions = useCallback(() => {
    setOptions({ ...DEFAULT_REPORT_OPTIONS, ...initialOptions });
  }, [initialOptions]);

  return {
    options,
    setOptions,
    handleOptionChange,
    resetOptions,
  };
}


