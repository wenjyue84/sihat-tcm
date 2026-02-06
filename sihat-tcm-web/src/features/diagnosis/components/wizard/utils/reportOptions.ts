/**
 * Report options utilities
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 */

/**
 * Create default report options
 */
export function createDefaultReportOptions() {
  return {
    includePatientName: true,
    includePatientAge: true,
    includePatientGender: true,
    includePatientContact: true,
    includePatientAddress: true,
    includeEmergencyContact: true,
    includeVitalSigns: true,
    includeBMI: true,
    includeSmartConnectData: true,
    suggestMedicine: true,
    suggestDoctor: true,
    includeDietary: true,
    includeLifestyle: true,
    includeAcupuncture: true,
    includeExercise: true,
    includeSleepAdvice: true,
    includeEmotionalWellness: true,
    includePrecautions: true,
    includeFollowUp: true,
    includeTimestamp: true,
    includeQRCode: true,
    includeDoctorSignature: true,
  };
}
