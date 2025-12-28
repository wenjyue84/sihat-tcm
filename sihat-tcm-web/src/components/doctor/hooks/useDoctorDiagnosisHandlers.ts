import { useCallback } from "react";
import { toast } from "sonner";
import { DoctorDiagnosisData, FileData } from "@/hooks/useDoctorDiagnosis";

/**
 * Custom hook for DoctorDiagnosisWizard event handlers
 * Extracted from DoctorDiagnosisWizard component
 */
export function useDoctorDiagnosisHandlers(
    data: DoctorDiagnosisData,
    setData: (updater: (prev: DoctorDiagnosisData) => DoctorDiagnosisData) => void,
    clearDraft: () => void,
    setExtractingFiles: (updater: (prev: Set<string>) => Set<string>) => void,
    setMedicineInput: (value: string) => void
) {
    // Fill test data
    const handleFillTestData = useCallback(() => {
        setData({
            patientInfo: {
                name: "Test Patient",
                age: "45",
                gender: "male",
                height: "170",
                weight: "70",
            },
            selectedSymptoms: ["Headache", "Fatigue", "Insomnia"],
            otherSymptoms: "Occasional dizziness when standing up quickly",
            tongueImage: "",
            faceImage: "",
            inquiryAnswers: {},
            uploadedReports: [],
            currentMedicines: "Vitamin C, Omega-3",
            clinicalNotes: "Patient presents with classic Spleen Qi deficiency. Pulse is weak and thready. Tongue is pale with tooth marks.",
            treatmentPlan: "Herbal formula: Si Jun Zi Tang. Acupuncture: ST36, SP6, CV12. Avoid cold foods.",
        });
        toast.success("Test data filled");
    }, [setData]);

    // Clear all data
    const handleClearData = useCallback(() => {
        clearDraft();
        toast.success("Form cleared");
    }, [clearDraft]);

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
    }, [setData, setExtractingFiles]);

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
    }, [setData, setExtractingFiles, extractTextInBackground]);

    // Remove report
    const removeReport = useCallback((index: number) => {
        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            uploadedReports: prev.uploadedReports.filter((_: FileData, i: number) => i !== index),
        }));
    }, [setData]);

    // Medicine chip handlers
    const addMedicine = useCallback(() => {
        if (!medicineInput.trim()) return;

        const medsList = data.currentMedicines
            ? data.currentMedicines.split(",").map((m: string) => m.trim())
            : [];

        if (medsList.includes(medicineInput.trim())) {
            toast.error("Medicine already added");
            return;
        }

        const newMeds = [...medsList, medicineInput.trim()].join(", ");
        setData((prev: DoctorDiagnosisData) => ({ ...prev, currentMedicines: newMeds }));
        setMedicineInput("");
    }, [data.currentMedicines, medicineInput, setData, setMedicineInput]);

    const removeMedicine = useCallback((medToRemove: string) => {
        const medsList = data.currentMedicines
            .split(",")
            .map((m: string) => m.trim())
            .filter((m: string) => m !== medToRemove);

        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            currentMedicines: medsList.join(", ")
        }));
    }, [data.currentMedicines, setData]);

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
        handleFillTestData,
        handleClearData,
        handleFileChange,
        removeReport,
        addMedicine,
        removeMedicine,
        getCompletionPercentage,
    };
}

