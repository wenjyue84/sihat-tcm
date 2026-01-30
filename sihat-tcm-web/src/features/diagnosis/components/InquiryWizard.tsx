"use client";

import { useAuth } from "@/stores/useAppStore";
import { BasicInfoData } from "./BasicInfoForm";
import { FileData } from "./UploadReportsStep";
import { useInquiryWizardState } from "./inquiry/hooks/useInquiryWizardState";
import { InquiryStepRenderer } from "./inquiry/components/InquiryStepRenderer";

// ChatMessage type - matches the type used in InquiryChatStep
interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface InquiryWizardProps {
  basicInfo?: BasicInfoData;
  initialData?: {
    reportFiles?: FileData[];
    medicineFiles?: FileData[];
    chatHistory?: ChatMessage[];
    summary?: string;
  };
  onComplete: (result: {
    inquiryText: string;
    chatHistory: ChatMessage[];
    files: FileData[];
    reportFiles?: FileData[];
    medicineFiles?: FileData[];
  }) => void;
  onBack?: () => void;
}

export function InquiryWizard({ basicInfo, initialData, onComplete, onBack }: InquiryWizardProps) {
  const { profile } = useAuth();
  const diagnosisMode = profile?.preferences?.diagnosisMode || "simple";

  // Use extracted hook for state management
  const {
    step,
    data,
    setStep,
    updateReportFiles,
    updateMedicineFiles,
    updateChatHistory,
    updateSummary,
    nextStep,
    prevStep,
  } = useInquiryWizardState({ initialData });

  const handleReportsComplete = (files: FileData[]) => {
    updateReportFiles(files);
    setStep("upload_medicine");
  };

  const handleMedicineComplete = (files: FileData[]) => {
    updateMedicineFiles(files);
    setStep("chat");
  };

  const handleChatComplete = (history: ChatMessage[]) => {
    updateChatHistory(history);

    if (diagnosisMode === "simple") {
      // In Simple Mode, skip the summary review step
      onComplete({
        inquiryText: "Chat consultation completed (Analysis pending)",
        chatHistory: history,
        reportFiles: data.reportFiles,
        medicineFiles: data.medicineFiles,
        files: [...data.reportFiles, ...data.medicineFiles],
      });
    } else {
      setStep("summary");
    }
  };

  const handleSummaryComplete = (summary: string) => {
    updateSummary(summary);

    // Combine all data for the final result
    onComplete({
      inquiryText: summary,
      chatHistory: data.chatHistory,
      reportFiles: data.reportFiles,
      medicineFiles: data.medicineFiles,
      files: [...data.reportFiles, ...data.medicineFiles],
    });
  };

  return (
    <InquiryStepRenderer
      step={step}
      data={data}
      basicInfo={basicInfo}
      diagnosisMode={diagnosisMode}
      onReportsComplete={handleReportsComplete}
      onMedicineComplete={handleMedicineComplete}
      onChatComplete={handleChatComplete}
      onSummaryComplete={handleSummaryComplete}
      onSkipReports={() => setStep("upload_medicine")}
      onSkipMedicine={() => setStep("chat")}
      onBackToReports={() => setStep("upload_reports")}
      onBackToMedicine={() => setStep("upload_medicine")}
      onBackToChat={() => setStep("chat")}
      onBack={onBack}
    />
  );
}
