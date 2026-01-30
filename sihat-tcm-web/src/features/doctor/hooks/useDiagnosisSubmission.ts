"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DoctorDiagnosisData } from "./useDoctorDiagnosis";
import { saveDiagnosis } from "@/lib/actions";
import { repairJSON } from "./useDiagnosisWizard";
import type { DiagnosisReport, SaveDiagnosisInput } from "@/types/database";

/**
 * Patient data for linking diagnosis
 */
export interface PatientLink {
    id?: string;
    user_id?: string;
}

/**
 * Options for diagnosis submission
 */
export interface SubmissionOptions {
    /** Navigate to this path after successful submission */
    redirectPath?: string;
    /** Callback to clear form draft */
    onClearDraft?: () => void;
    /** Language for AI analysis */
    language?: "en" | "zh" | "ms";
    /** AI model to use */
    model?: string;
}

/**
 * Hook for handling diagnosis submission to AI and database.
 * 
 * Separates the complex submission logic from UI components:
 * - Validates form data
 * - Prepares AI input payload
 * - Calls consultation API with streaming
 * - Parses JSON response (with repair for malformed JSON)
 * - Saves to Supabase via server action
 * 
 * @example
 * ```tsx
 * const { submitDiagnosis, isSubmitting, error } = useDiagnosisSubmission();
 * 
 * const handleSubmit = () => {
 *   submitDiagnosis(formData, patient, { redirectPath: "/doctor" });
 * };
 * ```
 */
export function useDiagnosisSubmission() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Validate required fields before submission
     */
    const validateData = useCallback((data: DoctorDiagnosisData): string | null => {
        if (!data.patientInfo.name || !data.patientInfo.age || !data.patientInfo.gender) {
            return "Please fill in patient information";
        }
        if (data.selectedSymptoms.length === 0 && !data.otherSymptoms) {
            return "Please add at least one symptom";
        }
        return null;
    }, []);

    /**
     * Prepare data payload for AI consultation API
     */
    const prepareAIPayload = useCallback((data: DoctorDiagnosisData) => {
        return {
            basic_info: {
                name: data.patientInfo.name,
                age: parseInt(data.patientInfo.age),
                gender: data.patientInfo.gender,
                height: data.patientInfo.height ? parseInt(data.patientInfo.height) : undefined,
                weight: data.patientInfo.weight ? parseInt(data.patientInfo.weight) : undefined,
                symptoms: [...data.selectedSymptoms, ...(data.otherSymptoms ? [data.otherSymptoms] : [])].join(", "),
            },
            wang_tongue: data.tongueImage ? { image: data.tongueImage } : undefined,
            wang_face: data.faceImage ? { image: data.faceImage } : undefined,
            wen_inquiry: { inquiryText: JSON.stringify(data.inquiryAnswers) },
            report_options: {
                includePatientName: true,
                includePatientAge: true,
                includePatientGender: true,
                includeVitalSigns: true,
                suggestMedicine: true,
                includeDietary: true,
                includeLifestyle: true,
                includeAcupuncture: true,
            }
        };
    }, []);

    /**
     * Call AI API and stream response
     * Returns raw JSON from AI - structure varies based on model/prompt
     */
    const callConsultationAPI = useCallback(async (
        payload: ReturnType<typeof prepareAIPayload>,
        model: string,
        language: string
    ): Promise<Record<string, unknown>> => {
        const response = await fetch("/api/consult", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: payload,
                model,
                language,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        // Read stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
            }
        }

        // Clean and parse JSON
        const cleanJson = fullText.replace(/```json\n?|\n?```/g, "").trim();

        try {
            return JSON.parse(cleanJson);
        } catch {
            return JSON.parse(repairJSON(cleanJson));
        }
    }, []);

    /**
     * Save diagnosis result to database
     * Extracts standardized fields from raw AI response
     */
    const saveToDB = useCallback(async (
        data: DoctorDiagnosisData,
        result: Record<string, unknown>,
        patient?: PatientLink
    ) => {
        // Extract diagnosis pattern - handle both object and string formats
        const diagnosisValue = result.diagnosis as { primary_pattern?: string } | string | undefined;
        const primaryDiagnosis = typeof diagnosisValue === 'object'
            ? diagnosisValue?.primary_pattern || "TCM Pattern"
            : (diagnosisValue as string) || "TCM Pattern";

        // Extract constitution - handle both object and string formats
        const constitutionValue = result.constitution as { type?: string } | string | undefined;
        const constitution = typeof constitutionValue === 'object'
            ? constitutionValue?.type || "Balanced"
            : (constitutionValue as string) || "Balanced";

        // Extract treatment plan from recommendations
        const recommendations = result.recommendations as { general?: string[] } | undefined;
        const treatmentPlan = Array.isArray(recommendations?.general)
            ? recommendations.general.join(" | ")
            : "Follow recommendations";

        // Cast the raw result to DiagnosisReport for database storage
        // The AI response structure aligns with DiagnosisReport but TypeScript can't verify runtime data
        return saveDiagnosis({
            primary_diagnosis: primaryDiagnosis,
            constitution,
            full_report: result as unknown as DiagnosisReport,
            patient_id: patient?.id,
            user_id: patient?.user_id,
            symptoms: [...data.selectedSymptoms, ...(data.otherSymptoms ? [data.otherSymptoms] : [])],
            medicines: data.currentMedicines ? [data.currentMedicines] : [],
            clinical_notes: data.clinicalNotes,
            treatment_plan: treatmentPlan,
            inquiry_summary: JSON.stringify(data.inquiryAnswers),
            tongue_analysis: data.tongueImage ? { image_url: data.tongueImage } : undefined,
            face_analysis: data.faceImage ? { image_url: data.faceImage } : undefined,
        });
    }, []);

    /**
     * Submit diagnosis - validates, calls AI, saves to DB, navigates
     */
    const submitDiagnosis = useCallback(async (
        data: DoctorDiagnosisData,
        patient?: PatientLink,
        options: SubmissionOptions = {}
    ): Promise<boolean> => {
        const {
            redirectPath = "/doctor",
            onClearDraft,
            language = "en",
            model = "gemini-1.5-pro"
        } = options;

        setError(null);

        // Validate
        const validationError = validateData(data);
        if (validationError) {
            toast.error(validationError);
            setError(validationError);
            return false;
        }

        setIsSubmitting(true);

        try {
            // 1. Prepare and call AI
            const payload = prepareAIPayload(data);
            const result = await callConsultationAPI(payload, model, language);

            // 2. Save to database
            const saveResult = await saveToDB(data, result, patient);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }

            // 3. Clear draft
            onClearDraft?.();

            // 4. Success feedback
            toast.success("Diagnosis submitted successfully and saved to Health Passport");

            // 5. Navigate
            router.push(redirectPath);

            return true;
        } catch (err: any) {
            const errorMessage = err.message || "Failed to submit diagnosis";
            console.error("Error submitting diagnosis:", err);
            toast.error(`Failed to submit: ${errorMessage}`);
            setError(errorMessage);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [validateData, prepareAIPayload, callConsultationAPI, saveToDB, router]);

    return {
        submitDiagnosis,
        isSubmitting,
        error,
        validateData,
    };
}
