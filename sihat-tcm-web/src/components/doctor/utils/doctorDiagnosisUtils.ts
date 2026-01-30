import { DoctorDiagnosisData } from "@/features/doctor";

/**
 * Utility functions for DoctorDiagnosisWizard
 * Extracted from main component
 */

export const COMMON_SYMPTOMS = [
    "Headache", "Fatigue", "Insomnia", "Dizziness", "Back Pain",
    "Digestive Issues", "Anxiety", "Cold/Flu", "Joint Pain", "Cough",
    "Nausea", "Skin Issues", "Menstrual Issues", "Heart Palpitations",
] as const;

export const SECTIONS = [
    { id: "patient-info", title: "Patient Information", icon: "User" },
    { id: "symptoms", title: "Symptoms & Chief Complaints", icon: "Stethoscope" },
    { id: "tongue", title: "Tongue Analysis", icon: "Camera" },
    { id: "face", title: "Face Analysis", icon: "Camera" },
    { id: "tcm-inquiry", title: "TCM Inquiry", icon: "MessageSquare" },
    { id: "reports", title: "Upload Reports", icon: "FileText" },
    { id: "medicines", title: "Current Medicines", icon: "Pill" },
    { id: "clinical-notes", title: "Clinical Notes & Treatment", icon: "FileText" },
] as const;

export type SectionId = typeof SECTIONS[number]["id"];

/**
 * Calculate completion percentage for diagnosis form
 */
export function calculateCompletionPercentage(data: DoctorDiagnosisData): number {
    let completed = 0;
    const total = 7;

    if (data.patientInfo.name && data.patientInfo.age && data.patientInfo.gender) completed++;
    if (data.selectedSymptoms.length > 0 || data.otherSymptoms) completed++;
    if (data.tongueImage) completed++;
    if (data.faceImage) completed++;
    if (Object.keys(data.inquiryAnswers).length > 0) completed++;
    if (data.uploadedReports.length > 0) completed++;
    if (data.currentMedicines) completed++;

    return Math.round((completed / total) * 100);
}



