/**
 * Hook for managing DiagnosisReport actions
 * Extracted from DiagnosisReport.tsx to improve maintainability
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClientServices } from "@/lib/services";
import { useAuth } from "@/stores/useAppStore";
import { generateDiagnosisPDF } from "../utils/pdfGenerator";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";
import type { DiagnosisReport } from "@/types/database";
import type { PDFPatientInfo, PDFReportOptions, PDFGenerationData } from "@/types/pdf";

interface UseDiagnosisReportActionsOptions {
  data: DiagnosisReport | PDFGenerationData;
  patientInfo?: PDFPatientInfo;
  reportOptions?: PDFReportOptions;
  smartConnectData?: Record<string, unknown>;
  language: string;
  translations: Record<string, any>;
  setIsSaving: (saving: boolean) => void;
  setHasSaved: (saved: boolean) => void;
  setIsVerificationModalOpen?: (open: boolean) => void;
}

interface UseDiagnosisReportActionsResult {
  downloadPDF: (languageKey?: string) => Promise<void>;
  shareReport: () => Promise<void>;
  handleSaveToHistory: () => Promise<void>;
  handleRequestVerification: () => void;
}

/**
 * Hook for managing diagnosis report actions
 */
export function useDiagnosisReportActions({
  data,
  patientInfo,
  reportOptions,
  smartConnectData,
  language,
  translations,
  setIsSaving,
  setHasSaved,
  setIsVerificationModalOpen,
}: UseDiagnosisReportActionsOptions): UseDiagnosisReportActionsResult {
  const { user, profile } = useAuth();
  const router = useRouter();

  const diagnosisText = extractDiagnosisTitle(data.diagnosis ?? "");
  const constitutionText = extractConstitutionType(data.constitution ?? "");

  const downloadPDF = useCallback(
    async (languageKey = "en") => {
      const tPdf = translations[languageKey as keyof typeof translations];
      await generateDiagnosisPDF({
        data,
        translations: tPdf,
        languageKey,
      });
    },
    [data, translations]
  );

  const shareReport = useCallback(async () => {
    const shareText = `TCM Diagnosis: ${diagnosisText}\nConstitution: ${constitutionText}\n\nView Full Report at https://sihat-tcm.vercel.app`;

    // Try native share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "TCM Report",
          text: shareText,
          url: "https://sihat-tcm.vercel.app",
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fall through to clipboard
        console.error("Share failed:", e);
      }
    }

    // Try clipboard API
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert(language === "zh" ? "报告链接已复制！" : "Report link copied!");
        return;
      } catch (e) {
        console.error("Clipboard API failed:", e);
      }
    }

    // Fallback: use deprecated execCommand (for older browsers/non-secure contexts)
    try {
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        alert(language === "zh" ? "报告链接已复制！" : "Report link copied!");
        return;
      }
    } catch (e) {
      console.error("execCommand fallback failed:", e);
    }

    // Final fallback: inform user
    alert(language === "zh" ? "无法复制，请手动复制链接。" : "Unable to copy. Please copy the link manually.");
  }, [diagnosisText, constitutionText, language]);

  const handleSaveToHistory = useCallback(async () => {
    if (!user) {
      localStorage.setItem(
        "pendingDiagnosisSave",
        JSON.stringify({ data, patientInfo, reportOptions, smartConnectData })
      );
      router.push("/login?redirect=save-diagnosis");
      return;
    }
    setIsSaving(true);
    try {
      const reportWithProfile = {
        ...data,
        patient_profile: {
          name: patientInfo?.name,
          age: patientInfo?.age,
          gender: patientInfo?.gender,
          height: patientInfo?.height,
          weight: patientInfo?.weight,
        },
        saved_by_role: profile?.role || "patient",
        saved_at: new Date().toISOString(),
      };
      const { error } = await createClientServices().inquiries.create({
        user_id: user.id,
        message: patientInfo?.symptoms || "Not provided",
        diagnosis_session_id: undefined,
      });
      if (error) throw new Error(error.message);
      setHasSaved(true);
      alert(language === "zh" ? "已保存！" : "Saved!");
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    data,
    patientInfo,
    reportOptions,
    smartConnectData,
    profile,
    router,
    language,
    setIsSaving,
    setHasSaved,
  ]);

  const handleRequestVerification = useCallback(() => {
    if (setIsVerificationModalOpen) {
      setIsVerificationModalOpen(true);
    } else {
      // Fallback for backwards compatibility
      alert(language === "zh" ? "请选择医生核实" : "Please select a doctor for verification");
    }
  }, [language, setIsVerificationModalOpen]);

  return {
    downloadPDF,
    shareReport,
    handleSaveToHistory,
    handleRequestVerification,
  };
}

