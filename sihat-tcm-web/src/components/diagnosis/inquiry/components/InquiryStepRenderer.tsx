/**
 * Inquiry Step Renderer Component
 * Renders the appropriate step component with animations
 * Extracted from InquiryWizard.tsx to improve maintainability
 */

import { motion, AnimatePresence } from "framer-motion";
import { UploadReportsStep, FileData } from "../../UploadReportsStep";
import { UploadMedicineStep } from "../../UploadMedicineStep";
import { InquiryChatStep } from "../../InquiryChatStep";
import { InquirySummaryStep } from "../../InquirySummaryStep";
import type { BasicInfoData } from "../../BasicInfoForm";
import type { InquiryStepType, InquiryWizardData } from "../hooks/useInquiryWizardState";
import type { ChatMessage } from "@/types/diagnosis";

interface InquiryStepRendererProps {
  step: InquiryStepType;
  data: InquiryWizardData;
  basicInfo?: BasicInfoData;
  diagnosisMode?: string;
  onReportsComplete: (files: FileData[]) => void;
  onMedicineComplete: (files: FileData[]) => void;
  onChatComplete: (history: ChatMessage[]) => void;
  onSummaryComplete: (summary: string) => void;
  onSkipReports: () => void;
  onSkipMedicine: () => void;
  onBackToReports: () => void;
  onBackToMedicine: () => void;
  onBackToChat: () => void;
  onBack?: () => void;
}

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Renders the appropriate inquiry step with animations
 */
export function InquiryStepRenderer({
  step,
  data,
  basicInfo,
  diagnosisMode,
  onReportsComplete,
  onMedicineComplete,
  onChatComplete,
  onSummaryComplete,
  onSkipReports,
  onSkipMedicine,
  onBackToReports,
  onBackToMedicine,
  onBackToChat,
  onBack,
}: InquiryStepRendererProps) {
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "upload_reports" && (
          <motion.div
            key="upload_reports"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <UploadReportsStep
              initialFiles={data.reportFiles}
              onComplete={onReportsComplete}
              onSkip={onSkipReports}
              onBack={onBack}
            />
          </motion.div>
        )}

        {step === "upload_medicine" && (
          <motion.div
            key="upload_medicine"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <UploadMedicineStep
              initialFiles={data.medicineFiles}
              onComplete={onMedicineComplete}
              onSkip={onSkipMedicine}
              onBack={onBackToReports}
            />
          </motion.div>
        )}

        {step === "chat" && (
          <motion.div
            key="chat"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <InquiryChatStep
              basicInfo={basicInfo}
              uploadedFiles={[...data.reportFiles, ...data.medicineFiles]}
              reportFiles={data.reportFiles}
              medicineFiles={data.medicineFiles}
              onComplete={onChatComplete}
              onBack={onBackToMedicine}
              diagnosisMode={diagnosisMode}
            />
          </motion.div>
        )}

        {step === "summary" && (
          <motion.div
            key="summary"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <InquirySummaryStep
              data={{
                chatHistory: data.chatHistory,
                reportFiles: data.reportFiles,
                medicineFiles: data.medicineFiles,
                basicInfo: basicInfo,
              }}
              onComplete={onSummaryComplete}
              onBack={onBackToChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

