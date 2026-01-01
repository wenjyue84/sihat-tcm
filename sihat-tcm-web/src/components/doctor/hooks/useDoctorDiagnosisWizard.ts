"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DoctorDiagnosisData, FileData } from "@/hooks/useDoctorDiagnosis";

type SectionId =
    | "patient-info"
    | "symptoms"
    | "tongue"
    | "face"
    | "tcm-inquiry"
    | "reports"
    | "medicines"
    | "clinical-notes";

interface UseFileUploadParams {
    setData: (updater: (prev: DoctorDiagnosisData) => DoctorDiagnosisData) => void;
}

/**
 * Custom hook for managing file uploads and text extraction
 */
export function useFileUpload({ setData }: UseFileUploadParams) {
    const [extractingFiles, setExtractingFiles] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Background AI text extraction
    const extractTextInBackground = useCallback(async (file: File) => {
        const fileId = file.name + file.lastModified;
        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });

            // Call extraction API
            const response = await fetch("/api/extract-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    file: base64,
                    fileName: file.name,
                    fileType: file.type,
                    mode: "general",
                }),
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Update the file with extracted text
            setData((prev: DoctorDiagnosisData) => ({
                ...prev,
                uploadedReports: prev.uploadedReports.map((f: FileData) =>
                    f.name === file.name ? { ...f, extractedText: result.text || "" } : f
                ),
            }));
        } catch (error) {
            console.error("Background extraction error:", error);
            toast.error(`Failed to extract text from ${file.name}`);
        } finally {
            setExtractingFiles((prev) => {
                const next = new Set(prev);
                next.delete(fileId);
                return next;
            });
        }
    }, [setData]);

    // File upload handler
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;

        // Reset input
        e.target.value = "";

        for (const file of newFiles) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} too big (max 5MB)`);
                continue;
            }

            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });

                const fileId = file.name + file.lastModified;

                // Add file immediately
                setData((prev: DoctorDiagnosisData) => ({
                    ...prev,
                    uploadedReports: [
                        ...prev.uploadedReports,
                        {
                            name: file.name,
                            type: file.type,
                            data: base64,
                            extractedText: "",
                        },
                    ],
                }));

                // Start background extraction
                setExtractingFiles((prev) => new Set(prev).add(fileId));
                extractTextInBackground(file);

            } catch (error) {
                console.error("Error processing file:", error);
                toast.error(`Error processing ${file.name}`);
            }
        }
    }, [setData, extractTextInBackground]);

    // Remove report
    const removeReport = useCallback((index: number) => {
        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            uploadedReports: prev.uploadedReports.filter((_: FileData, i: number) => i !== index),
        }));
    }, [setData]);

    return {
        extractingFiles,
        fileInputRef,
        pdfInputRef,
        handleFileChange,
        removeReport,
    };
}

interface UseMedicineChipsParams {
    currentMedicines: string;
    setData: (updater: (prev: DoctorDiagnosisData) => DoctorDiagnosisData) => void;
}

/**
 * Custom hook for managing medicine chip input
 */
export function useMedicineChips({ currentMedicines, setData }: UseMedicineChipsParams) {
    const [medicineInput, setMedicineInput] = useState("");

    const addMedicine = useCallback(() => {
        if (!medicineInput.trim()) return;

        const medsList = currentMedicines
            ? currentMedicines.split(",").map((m: string) => m.trim())
            : [];

        if (medsList.includes(medicineInput.trim())) {
            toast.error("Medicine already added");
            return;
        }

        const newMeds = [...medsList, medicineInput.trim()].join(", ");
        setData((prev: DoctorDiagnosisData) => ({ ...prev, currentMedicines: newMeds }));
        setMedicineInput("");
    }, [currentMedicines, medicineInput, setData]);

    const removeMedicine = useCallback((medToRemove: string) => {
        const medsList = currentMedicines
            .split(",")
            .map((m: string) => m.trim())
            .filter((m: string) => m !== medToRemove);

        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            currentMedicines: medsList.join(", ")
        }));
    }, [currentMedicines, setData]);

    return {
        medicineInput,
        setMedicineInput,
        addMedicine,
        removeMedicine,
    };
}

interface UseWizardStateParams {
    data: DoctorDiagnosisData;
}

/**
 * Custom hook for managing wizard UI state (expanded sections, camera visibility, etc.)
 */
export function useWizardState({ data }: UseWizardStateParams) {
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(["patient-info"])
    );
    const [showTongueCamera, setShowTongueCamera] = useState(false);
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [viewingReport, setViewingReport] = useState<FileData | null>(null);

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

    // Calculate completion percentage
    const getCompletionPercentage = useCallback((): number => {
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
    }, [data]);

    return {
        expandedSections,
        showTongueCamera,
        showFaceCamera,
        viewingReport,
        setExpandedSections,
        setShowTongueCamera,
        setShowFaceCamera,
        setViewingReport,
        toggleSection,
        expandSection,
        getCompletionPercentage,
    };
}

export type { SectionId };

