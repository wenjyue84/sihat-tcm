/**
 * Step Renderer Component
 * Renders the appropriate step component based on current step
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 *
 * Note: This component bridges between the wizard's DiagnosisWizardData types
 * and each step component's local types. Type assertions are intentional at
 * these boundaries where the data is structurally compatible at runtime.
 */

import React from "react";
import type { DiagnosisWizardData } from "@/types/diagnosis";

// Step Components
import { BasicInfoForm } from "../BasicInfoForm";
import { InquiryWizard } from "../InquiryWizard";
import { AudioRecorder } from "../AudioRecorder";
import { PulseCheck } from "../PulseCheck";
import { SmartConnectStep } from "../SmartConnectStep";
import { DiagnosisSummary } from "../DiagnosisSummary";
import { ImageAnalysisStepRenderer } from "./ImageAnalysisStepRenderer";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface StepRendererProps {
  step: string;
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
  analyzeImage?: (type: string, image: any) => Promise<void>;
  t: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const noop = () => {};

  switch (step) {
    case "basic_info":
      return (
        <BasicInfoForm
          onComplete={(basicInfo) => {
            setData((prev) => ({ ...prev, basic_info: basicInfo as never }));
            onNextStep();
          }}
          initialData={data.basic_info as never}
        />
      );

    case "tongue":
      return (
        <ImageAnalysisStepRenderer
          type="tongue"
          title={t?.diagnosis?.tongueTitle || "Tongue Analysis"}
          instruction={t?.diagnosis?.tongueInstruction || "Take a photo of your tongue"}
          required={true}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_tongue as never}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("tongue", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_tongue: null }));
          }}
          onContinue={() => {
            if (data.wang_tongue) {
              onNextStep();
            }
          }}
          onSkip={onSkipAnalysis || noop}
          onBack={onBack}
        />
      );

    case "face":
      return (
        <ImageAnalysisStepRenderer
          type="face"
          title={t?.diagnosis?.faceTitle || "Face Analysis"}
          instruction={t?.diagnosis?.faceInstruction || "Take a photo of your face"}
          required={false}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_face as never}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("face", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_face: null }));
          }}
          onContinue={() => {
            onNextStep();
          }}
          onSkip={onSkipAnalysis || noop}
          onBack={onBack}
        />
      );

    case "body":
      return (
        <ImageAnalysisStepRenderer
          type={"part" as never}
          title={t?.diagnosis?.bodyTitle || "Body Part Analysis"}
          instruction={t?.diagnosis?.bodyInstruction || "Take a photo of the affected body part"}
          required={false}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          existingData={data.wang_part as never}
          onCapture={async (image) => {
            if (analyzeImage) {
              await analyzeImage("body", image);
            }
          }}
          onRetake={() => {
            setAnalysisResult(null);
            setData((prev) => ({ ...prev, wang_part: null }));
          }}
          onContinue={() => {
            onNextStep();
          }}
          onSkip={onSkipAnalysis || noop}
          onBack={onBack}
        />
      );

    case "inquiry":
      return (
        <InquiryWizard
          basicInfo={data.basic_info as never}
          initialData={{
            reportFiles: data.reportFiles || [],
            medicineFiles: data.medicineFiles || [],
            chatHistory: data.wen_chat || [],
            summary: data.wen_inquiry?.inquiryText || "",
          } as never}
          onComplete={(inquiryData: Record<string, unknown>) => {
            setData((prev) => ({
              ...prev,
              wen_inquiry: {
                inquiryText: inquiryData.summary as string,
              } as never,
              wen_chat: inquiryData.chatHistory as never,
              reportFiles: inquiryData.reportFiles as never,
              medicineFiles: inquiryData.medicineFiles as never,
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
              wen_audio: audioData as never,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.wen_audio as never}
        />
      );

    case "pulse":
      return (
        <PulseCheck
          onComplete={(pulseData) => {
            setData((prev) => ({
              ...prev,
              qie: pulseData as never,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.qie as never}
        />
      );

    case "smart_connect":
      return (
        <SmartConnectStep
          onComplete={(smartData) => {
            setData((prev) => ({
              ...prev,
              smart_connect: smartData as never,
            }));
            onNextStep();
          }}
          onBack={onBack}
          initialData={data.smart_connect ?? undefined}
        />
      );

    case "summary":
      return (
        <DiagnosisSummary
          data={data}
          onConfirm={(confirmedData: Record<string, unknown>, options: Record<string, unknown>, additionalInfo?: Record<string, unknown>) => {
            setData((prev) => ({
              ...prev,
              verified_summaries: confirmedData as Record<string, string>,
              report_options: options,
              additional_info: additionalInfo ? JSON.stringify(additionalInfo) : undefined,
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
