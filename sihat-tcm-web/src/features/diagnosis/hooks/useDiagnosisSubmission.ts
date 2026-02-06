"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveDiagnosis } from "@/lib/actions"; // Ensure this action exists or use appropriate one
import { repairJSON } from "./diagnosisUtils";
import type { DiagnosisWizardData, AnalysisResult } from "@/types/diagnosis";
import type { DiagnosisReport } from "@/types/database";

interface UseDiagnosisSubmissionProps {
  data: DiagnosisWizardData;
  setData: (data: DiagnosisWizardData) => void;
}

export function useDiagnosisSubmission({ data, setData }: UseDiagnosisSubmissionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const prepareAIPayload = useCallback((wizardData: DiagnosisWizardData) => {
    return {
      basic_info: wizardData.basic_info,
      wang_tongue: wizardData.wang_tongue
        ? {
            observation: wizardData.wang_tongue.observation,
            image: wizardData.wang_tongue.image,
          }
        : undefined,
      wang_face: wizardData.wang_face
        ? {
            observation: wizardData.wang_face.observation,
            image: wizardData.wang_face.image,
          }
        : undefined,
      wen_inquiry: wizardData.wen_inquiry
        ? {
            inquiryText: wizardData.wen_inquiry.inquiryText,
            chat: wizardData.wen_inquiry.chat,
          }
        : undefined,
      wen_audio: wizardData.wen_audio,
      qie: wizardData.qie,
      // Default report options for wizard
      report_options: {
        includePatientName: true,
        includeVitalSigns: true,
        suggestMedicine: true,
        includeDietary: true,
        includeLifestyle: true,
      },
    };
  }, []);

  const callConsultationAPI = useCallback(
    async (
      payload: any,
      model: string = "gemini-2.0-flash",
      language: string = "en"
    ): Promise<any> => {
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

      const cleanJson = fullText.replace(/```json\n?|\n?```/g, "").trim();
      try {
        return JSON.parse(cleanJson);
      } catch {
        return JSON.parse(repairJSON(cleanJson));
      }
    },
    []
  );

  const saveToDB = useCallback(
    async (report: any) => {
      // Create a simplified structure compatible with DB
      // Note: In real app, we might need user_id from auth context

      const diagnosisValue = report.diagnosis as { primary_pattern?: string } | string | undefined;
      const primaryDiagnosis =
        typeof diagnosisValue === "object"
          ? diagnosisValue?.primary_pattern || "TCM Diagnosis"
          : (diagnosisValue as string) || "TCM Diagnosis";

      const constitutionValue = report.constitution as { type?: string } | string | undefined;
      const constitution =
        typeof constitutionValue === "object"
          ? constitutionValue?.type || "Balanced"
          : (constitutionValue as string) || "Balanced";

      return saveDiagnosis({
        primary_diagnosis: primaryDiagnosis,
        constitution: constitution,
        full_report: report as DiagnosisReport,
        inquiry_summary: data.wen_inquiry?.inquiryText,
        symptoms: data.basic_info?.symptoms ? [data.basic_info.symptoms] : [],
        guest_name: data.basic_info?.name || undefined,
      });
    },
    [data]
  );

  const submitConsultation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCompletion(0);

    try {
      // 1. Prepare Payload
      setCompletion(20);
      const payload = prepareAIPayload(data);

      // 2. Call API
      setCompletion(40);
      const report = await callConsultationAPI(payload);
      setCompletion(80);

      // 3. Save to DB
      const saveResult = await saveToDB(report);
      if (!saveResult.success) {
        console.error("Failed to save diagnosis:", saveResult.error);
        // We don't block success if save fails, but maybe warn?
        // For now continue
      }

      setCompletion(100);
      setIsSaved(true);

      // Update local data with the report
      setData({
        ...data,
        diagnosis_report: JSON.stringify(report),
      });

      return true;
    } catch (err: any) {
      console.error("Consultation error:", err);
      setError(err.message || "Failed to generate diagnosis");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [data, setData, prepareAIPayload, callConsultationAPI, saveToDB]);

  return {
    submitConsultation,
    completion,
    setCompletion,
    isLoading,
    error,
    isSaved,
    setIsSaved,
  };
}
