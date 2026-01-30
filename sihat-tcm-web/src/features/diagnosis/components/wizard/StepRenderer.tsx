/**
 * Step Renderer Component
 * Renders the appropriate step component based on current step
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 */

import React from "react";
import type { DiagnosisStep } from "@/hooks/useDiagnosisWizard";
import type { DiagnosisWizardData } from "@/types/diagnosis";

// Step Components
import { BasicInfoForm } from "../BasicInfoForm";
import { InquiryWizard } from "../InquiryWizard";
import { AudioRecorder } from "../AudioRecorder";
import { PulseCheck } from "../PulseCheck";
import { SmartConnectStep } from "../SmartConnectStep";
import { DiagnosisSummary } from "../DiagnosisSummary";
import { ImageAnalysisStepRenderer } from "./ImageAnalysisStepRenderer";

interface StepRendererProps {
  step: DiagnosisStep;
  data: DiagnosisWizardData;
  setData: React.Dispatch<React.SetStateAction<DiagnosisWizardData>>;
  isAnalyzing: boolean;
  analysisResult: any;
  setAnalysisResult: (result: any) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onComplete: () => void;
  onBack: () => void;
  onSkipAnalysis?: () => void;
  analyzeImage?: (type: string, image: string) => Promise<void>;
  t: any;
}

/**
 * Renders the appropriate step component based on the current step
 */
export function StepRenderer({
  step,
  data,
  setData,
  isAnalyzing,
  analysisResult,
  setAnalysisResult,
  onNextStep,
  onPrevStep,
  onComplete,
  onBack,
  onSkipAnalysis,
  analyzeImage,
  t,
}: StepRendererProps) {
  switch (step) {
    case "basic_info":
      return (
        <BasicInfoForm
          onComplete={(basicInfo) => {
            setData((prev) => ({ ...prev, basic_info: basicInfo }));
            onNextStep();
          }}
          initialData={data.basic_info}
        />
      );

    case "tongue":
      return (
        <ImageAnalysisStepRenderer
          type="tongue"
          title={t.diagnosis?.tongueTitle || "Tongue Analysis"}
          instruction={t.diagnosis?.tongueInstruction || "Take a photo of your tongue"}
          required={true}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_tongue}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("tongue", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_tongue: undefined }));
          }}
          onContinue={() => {
            if (data.wang_tongue) {
              onNextStep();
            }
          }}
          onSkip={onSkipAnalysis}
          onBack={onBack}
        />
      );

    case "face":
      return (
        <ImageAnalysisStepRenderer
          type="face"
          title={t.diagnosis?.faceTitle || "Face Analysis"}
          instruction={t.diagnosis?.faceInstruction || "Take a photo of your face"}
          required={false}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_face}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("face", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_face: undefined }));
          }}
          onContinue={() => {
            onNextStep();
          }}
          onSkip={onSkipAnalysis}
          onBack={onBack}
        />
      );

    case "body":
      return (
        <ImageAnalysisStepRenderer
          type="body"
          title={t.diagnosis?.bodyTitle || "Body Part Analysis"}
          instruction={t.diagnosis?.bodyInstruction || "Take a photo of the affected body part"}
          required={false}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_part}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("body", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_part: undefined }));
          }}
          onContinue={() => {
            onNextStep();
          }}
          onSkip={onSkipAnalysis}
          onBack={onBack}
        />
      );

    case "inquiry":
      return (
        <InquiryWizard
          basicInfo={data.basic_info}
          initialData={{
            reportFiles: data.reportFiles || [],
            medicineFiles: data.medicineFiles || [],
            chatHistory: data.wen_chat?.chat || [],
            summary: data.wen_inquiry?.inquiryText || "",
          }}
          onComplete={(inquiryData) => {
            setData((prev) => ({
              ...prev,
              wen_inquiry: {
                inquiryText: inquiryData.summary,
              },
              wen_chat: {
                chat: inquiryData.chatHistory,
              },
              reportFiles: inquiryData.reportFiles,
              medicineFiles: inquiryData.medicineFiles,
            }));
            onNextStep();
          }}
          onBack={onBack}
        />
      );

    case "audio":
      return (
        <AudioRecorder
          onComplete={(audioData) => {
            setData((prev) => ({
              ...prev,
              wen_audio: audioData,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.wen_audio}
        />
      );

    case "pulse":
      return (
        <PulseCheck
          onComplete={(pulseData) => {
            setData((prev) => ({
              ...prev,
              qie: pulseData,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.qie}
        />
      );

    case "smart_connect":
      return (
        <SmartConnectStep
          onComplete={(smartData) => {
            setData((prev) => ({
              ...prev,
              smart_connect: smartData,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.smart_connect}
        />
      );

    case "summary":
      return (
        <DiagnosisSummary
          data={data}
          onConfirm={(summaries, options, additionalInfo) => {
            setData((prev) => ({
              ...prev,
              verified_summaries: summaries,
              report_options: options,
              additional_info: additionalInfo,
            }));
            onComplete();
          }}
          onBack={onBack}
        />
      );

    default:
      return null;
  }
}



