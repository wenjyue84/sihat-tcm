"use server";

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
} from "./actions/diagnosis";

// ============================================================================
// PATIENT HISTORY ACTIONS
// ============================================================================
export {
    getPatientHistory,
    getHealthTrends,
    getLastSymptoms,
    getLastMedicines,
} from "./actions/patient-history";

// ============================================================================
// MEDICAL REPORTS ACTIONS
// ============================================================================
export {
    getMedicalReports,
    saveMedicalReport,
    deleteMedicalReport,
    seedMedicalReports,
} from "./actions/medical-reports";

// ============================================================================
// PATIENT MEDICINES ACTIONS
// ============================================================================
export {
    getPatientMedicines,
    savePatientMedicine,
    deletePatientMedicine,
} from "./actions/patient-medicines";

// ============================================================================
// FAMILY CARE ACTIONS
// ============================================================================
export {
    getFamilyMembers,
    addFamilyMember,
    deleteFamilyMember,
} from "./actions/family";

// ============================================================================
// TRANSLATION ACTIONS
// ============================================================================
export {
    translatePatientRecords,
    getPatientSessionIds,
    translateUserProfile,
    translateDiagnosisSession,
} from "./actions/translation";

// ============================================================================
// SHARED UTILITIES
// Re-export for any code that imports these from actions
// ============================================================================
export {
    getMockSymptomsForDiagnosis,
    getMockMedicinesForDiagnosis,
} from "./actions/shared";
