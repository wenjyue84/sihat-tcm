/**
 * Hook for diagnosis wizard consultation submission
 * 
 * Handles submitting consultation data, streaming responses, and saving to database
 */

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorLevel } from "@/stores/useAppStore";
import { logger } from "@/lib/clientLogger";
import { repairJSON, calculateOverallScore } from "./diagnosisUtils";
import type { DiagnosisWizardData } from "@/types/diagnosis";

interface UseDiagnosisSubmissionOptions {
  data: DiagnosisWizardData;
}

interface UseDiagnosisSubmissionReturn {
  completion: string;
  setCompletion: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  error: Error | null;
  isSaved: boolean;
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
  submitConsultation: () => Promise<void>;
}

/**
 * Hook for managing diagnosis consultation submission
 */
export function useDiagnosisSubmission({
  data,
}: UseDiagnosisSubmissionOptions): UseDiagnosisSubmissionReturn {
  const { getModel } = useDoctorLevel();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const submitConsultation = useCallback(async () => {
    logger.info("useDiagnosisSubmission", "Submitting consultation...");
    setIsLoading(true);
    setError(null);
    setCompletion("");

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Analyze this patient data and provide TCM diagnosis",
          data: data,
          model: getModel(),
          language: language,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      // Stream Reader
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
      setCompletion(fullText);

      // Auto-Save Logic
      try {
        let cleanJson = fullText.replace(/```json\n?|\n?```/g, "").trim();
        let resultData;
        try {
          resultData = JSON.parse(cleanJson);
        } catch {
          const repairedJson = repairJSON(cleanJson);
          resultData = JSON.parse(repairedJson);
        }

        const reportWithProfile = {
          ...resultData,
          patient_profile: {
            name: data.basic_info?.name || "Anonymous",
            age: data.basic_info?.age,
            gender: data.basic_info?.gender,
            height: data.basic_info?.height,
            weight: data.basic_info?.weight,
          },
          input_data: {
            medicines:
              data.wen_inquiry?.medicineFiles?.map((f: any) => f.extractedText).filter(Boolean) ||
              [],
          },
        };

        // Save to legacy inquiries table (for backward compatibility) - only for authenticated users
        if (user) {
          await supabase.from("inquiries").insert({
            user_id: user.id,
            symptoms: data.basic_info?.symptoms || "Not provided",
            diagnosis_report: reportWithProfile,
            created_at: new Date().toISOString(),
          });
        }

        // Save to diagnosis_sessions table (Health Passport) - supports both authenticated and guest users
        const { saveDiagnosis } = await import("@/lib/actions");
        const { generateGuestSessionToken, saveGuestSessionToken } =
          await import("@/lib/guestSession");

        // Extract primary diagnosis string from object or use as-is if string
        let primaryDiagnosis = "Diagnosis pending";
        if (typeof resultData.diagnosis === "string") {
          primaryDiagnosis = resultData.diagnosis;
        } else if (resultData.diagnosis?.primary_pattern) {
          primaryDiagnosis = resultData.diagnosis.primary_pattern;
        } else if (resultData.diagnosis?.pattern) {
          primaryDiagnosis = resultData.diagnosis.pattern;
        }

        // Extract constitution string from object or use as-is if string
        let constitutionValue = undefined;
        if (typeof resultData.constitution === "string") {
          constitutionValue = resultData.constitution;
        } else if (resultData.constitution?.type) {
          constitutionValue = resultData.constitution.type;
        }

        // Extract symptoms from basic_info
        // Build symptoms array from mainComplaint and otherSymptoms
        const symptomsArray: string[] = [];
        if (data.basic_info?.mainComplaint?.trim()) {
          symptomsArray.push(data.basic_info.mainComplaint.trim());
        }
        if (data.basic_info?.otherSymptoms?.trim()) {
          // Split otherSymptoms by comma and add each one
          const otherSymptoms = data.basic_info.otherSymptoms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          symptomsArray.push(...otherSymptoms);
        }
        const symptoms = symptomsArray.length > 0 ? symptomsArray : undefined;

        // Extract medicines from medicineFiles
        const medicines =
          data.wen_inquiry?.medicineFiles?.map((f: any) => f.extractedText).filter(Boolean) ||
          undefined;

        // Phase 1: Collect all input data
        const inputData = {
          // Inquiry data
          inquiry_summary: data.wen_inquiry?.inquiryText || data.wen_inquiry?.summary,
          inquiry_chat_history: data.wen_inquiry?.chat || data.wen_chat || [],
          inquiry_report_files:
            data.wen_inquiry?.reportFiles
              ?.map((f: any) => ({
                name: f.name || "Unknown",
                url: f.url || f.publicUrl || "",
                type: f.type || "application/octet-stream",
                size: f.size,
                extracted_text: f.extractedText,
              }))
              .filter((f: any) => f.url) || [],
          inquiry_medicine_files:
            data.wen_inquiry?.medicineFiles
              ?.map((f: any) => ({
                name: f.name || "Unknown",
                url: f.url || f.publicUrl || "",
                type: f.type || "application/octet-stream",
                size: f.size,
                extracted_text: f.extractedText,
              }))
              .filter((f: any) => f.url) || [],

          // Visual analysis
          tongue_analysis: data.wang_tongue
            ? {
                image_url: data.wang_tongue.image,
                observation: data.wang_tongue.observation,
                analysis_tags: data.wang_tongue.analysis_tags?.map((tag) => tag.title || tag.description || "").filter(Boolean),
                tcm_indicators: data.wang_tongue.tcm_indicators?.map((indicator) => indicator.pattern || indicator.description || "").filter(Boolean),
                pattern_suggestions: data.wang_tongue.pattern_suggestions?.map((pattern) => pattern.name || pattern.reasoning || "").filter(Boolean),
                potential_issues: data.wang_tongue.potential_issues,
              }
            : undefined,

          face_analysis: data.wang_face
            ? {
                image_url: data.wang_face.image,
                observation: data.wang_face.observation,
                analysis_tags: data.wang_face.analysis_tags?.map((tag) => tag.title || tag.description || "").filter(Boolean),
                tcm_indicators: data.wang_face.tcm_indicators?.map((indicator) => indicator.pattern || indicator.description || "").filter(Boolean),
                potential_issues: data.wang_face.potential_issues,
              }
            : undefined,

          body_analysis: data.wang_part
            ? {
                image_url: data.wang_part.image,
                observation: data.wang_part.observation,
                analysis_tags: data.wang_part.analysis_tags?.map((tag) => tag.title || tag.description || "").filter(Boolean),
                potential_issues: data.wang_part.potential_issues,
              }
            : undefined,

          // Audio analysis
          audio_analysis: data.wen_audio
            ? {
                audio_url: data.wen_audio.audio,
                observation: data.wen_audio.observation,
                potential_issues: data.wen_audio.potential_issues,
              }
            : undefined,

          // Pulse data
          pulse_data: data.qie
            ? {
                bpm: data.qie.bpm,
                quality: data.qie.quality,
                rhythm: data.qie.rhythm,
                strength: data.qie.strength,
                notes: data.qie.notes,
              }
            : undefined,
        };

        // Determine if this is a guest session
        const isGuest = !user;
        let guestSessionToken: string | undefined = undefined;

        if (isGuest) {
          // Generate and save guest session token
          guestSessionToken = generateGuestSessionToken();
          saveGuestSessionToken(guestSessionToken);
        }

        const saveResult = await saveDiagnosis({
          primary_diagnosis: primaryDiagnosis,
          constitution: constitutionValue,
          overall_score: calculateOverallScore(resultData),
          full_report: reportWithProfile,
          symptoms: symptoms,
          medicines: medicines,
          // Phase 1: Add all input data
          ...inputData,
          // Guest session fields
          is_guest_session: isGuest,
          guest_email: undefined, // Email not available in BasicInfo
          guest_name: isGuest ? data.basic_info?.name : undefined,
        });

        if (saveResult.success) {
          if (isGuest) {
            logger.info("useDiagnosisSubmission", "Saved guest session", saveResult.data?.id);
          } else {
            logger.info("useDiagnosisSubmission", "Saved to Health Passport", saveResult.data?.id);
          }
        } else {
          logger.error("useDiagnosisSubmission", "Failed to save diagnosis", saveResult.error);
        }

        setIsSaved(true);
      } catch (e) {
        logger.error("useDiagnosisSubmission", "Failed to auto-save", e);
      }
    } catch (err: unknown) {
      logger.error("useDiagnosisSubmission", "Error during consultation submission", err);
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [data, getModel, language, user]);

  return {
    completion,
    setCompletion,
    isLoading,
    error,
    isSaved,
    setIsSaved,
    submitConsultation,
  };
}


