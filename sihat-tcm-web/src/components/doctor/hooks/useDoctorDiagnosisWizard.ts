import { useState, useCallback } from "react";
import { DoctorDiagnosisData } from "@/hooks/useDoctorDiagnosis";

type SectionId = 
    | "patient-info"
    | "symptoms"
    | "tongue"
    | "face"
    | "tcm-inquiry"
    | "reports"
    | "medicines"
    | "clinical-notes";

/**
 * Custom hook for managing DoctorDiagnosisWizard state
 * Extracted from DoctorDiagnosisWizard component
 */
export function useDoctorDiagnosisWizard() {
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(["patient-info"])
    );
    const [showTongueCamera, setShowTongueCamera] = useState(false);
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [extractingFiles, setExtractingFiles] = useState<Set<string>>(new Set());
    const [viewingReport, setViewingReport] = useState<any>(null);
    const [medicineInput, setMedicineInput] = useState("");

    const toggleSection = useCallback((sectionId: SectionId) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    }, []);

    const expandSection = useCallback((sectionId: SectionId) => {
        setExpandedSections((prev) => new Set([...prev, sectionId]));
    }, []);

    return {
        expandedSections,
        showTongueCamera,
        showFaceCamera,
        extractingFiles,
        viewingReport,
        medicineInput,
        setExpandedSections,
        setShowTongueCamera,
        setShowFaceCamera,
        setExtractingFiles,
        setViewingReport,
        setMedicineInput,
        toggleSection,
        expandSection,
    };
}

