/**
 * Hook for managing InquiryWizard state
 * Extracted from InquiryWizard.tsx to improve maintainability
 */

import { useState, useEffect } from "react";
import type { FileData } from "../../UploadReportsStep";

// ChatMessage type - matches the type used in InquiryWizard
export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export type InquiryStepType = "upload_reports" | "upload_medicine" | "chat" | "summary";

export interface InquiryWizardData {
  reportFiles: FileData[];
  medicineFiles: FileData[];
  chatHistory: ChatMessage[];
  summary: string;
}

interface UseInquiryWizardStateOptions {
  initialData?: {
    reportFiles?: FileData[];
    medicineFiles?: FileData[];
    chatHistory?: ChatMessage[];
    summary?: string;
  };
}

interface UseInquiryWizardStateResult {
  step: InquiryStepType;
  data: InquiryWizardData;
  setStep: (step: InquiryStepType) => void;
  setData: React.Dispatch<React.SetStateAction<InquiryWizardData>>;
  updateReportFiles: (files: FileData[]) => void;
  updateMedicineFiles: (files: FileData[]) => void;
  updateChatHistory: (history: ChatMessage[]) => void;
  updateSummary: (summary: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

/**
 * Hook for managing inquiry wizard state and navigation
 */
export function useInquiryWizardState(
  options: UseInquiryWizardStateOptions = {}
): UseInquiryWizardStateResult {
  const { initialData } = options;

  const [step, setStep] = useState<InquiryStepType>("upload_reports");
  const [data, setData] = useState<InquiryWizardData>({
    reportFiles: initialData?.reportFiles || [],
    medicineFiles: initialData?.medicineFiles || [],
    chatHistory: initialData?.chatHistory || [],
    summary: initialData?.summary || "",
  });

  // Update state if initialData changes (e.g. when loading a test profile)
  useEffect(() => {
    if (initialData) {
      setData({
        reportFiles: initialData.reportFiles || [],
        medicineFiles: initialData.medicineFiles || [],
        chatHistory: initialData.chatHistory || [],
        summary: initialData.summary || "",
      });
    }
  }, [initialData]);

  const updateReportFiles = (files: FileData[]) => {
    setData((prev) => ({ ...prev, reportFiles: files }));
  };

  const updateMedicineFiles = (files: FileData[]) => {
    setData((prev) => ({ ...prev, medicineFiles: files }));
  };

  const updateChatHistory = (history: ChatMessage[]) => {
    setData((prev) => ({ ...prev, chatHistory: history }));
  };

  const updateSummary = (summary: string) => {
    setData((prev) => ({ ...prev, summary }));
  };

  const nextStep = () => {
    const stepOrder: InquiryStepType[] = [
      "upload_reports",
      "upload_medicine",
      "chat",
      "summary",
    ];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const stepOrder: InquiryStepType[] = [
      "upload_reports",
      "upload_medicine",
      "chat",
      "summary",
    ];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  return {
    step,
    data,
    setStep,
    setData,
    updateReportFiles,
    updateMedicineFiles,
    updateChatHistory,
    updateSummary,
    nextStep,
    prevStep,
  };
}

