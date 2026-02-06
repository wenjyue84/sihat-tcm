/**
 * Server Actions - Barrel Export
 *
 * This module re-exports all server actions from their domain-specific files
 * for backward compatibility with existing imports from '@/lib/actions'
 *
 * @module actions
 */

// ============================================================================
// DIAGNOSIS ACTIONS
// ============================================================================
export {
  saveDiagnosis,
  migrateGuestSessionToUser,
  getSessionById,
  updateSessionNotes,
  deleteSession,
  hideSession,
  seedPatientHistory,
} from "./diagnosis";

// ============================================================================
// PATIENT HISTORY ACTIONS
// ============================================================================
export {
  getPatientHistory,
  getHealthTrends,
  getLastSymptoms,
  getLastMedicines,
} from "./patient-history";

// ============================================================================
// MEDICAL REPORTS ACTIONS
// ============================================================================
export {
  getMedicalReports,
  saveMedicalReport,
  deleteMedicalReport,
  seedMedicalReports,
} from "./medical-reports";

// ============================================================================
// PATIENT MEDICINES ACTIONS
// ============================================================================
export {
  getPatientMedicines,
  savePatientMedicine,
  deletePatientMedicine,
} from "./patient-medicines";

// ============================================================================
// FAMILY CARE ACTIONS
// ============================================================================
export { getFamilyMembers, addFamilyMember, deleteFamilyMember } from "./family";

// ============================================================================
// TRANSLATION ACTIONS
// ============================================================================
export {
  translatePatientRecords,
  getPatientSessionIds,
  translateUserProfile,
  translateDiagnosisSession,
} from "./translation";

// ============================================================================
// SYMPTOM LOGS ACTIONS (PLACEHOLDER)
// ============================================================================
export {
  saveSymptomLog,
  getSymptomLogs,
  getSymptomLogById,
  getSymptomTrends,
  updateSymptomLog,
  deleteSymptomLog,
} from "./symptom-logs";

// ============================================================================
// SHARED UTILITIES
// Re-export for any code that imports these from actions
// ============================================================================
export { getMockSymptomsForDiagnosis, getMockMedicinesForDiagnosis } from "./shared";
