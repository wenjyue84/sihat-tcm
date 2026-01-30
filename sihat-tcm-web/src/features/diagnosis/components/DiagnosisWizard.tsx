"use client";

import React, { useEffect } from "react";
import { useDiagnosisWizard } from "../hooks/useDiagnosisWizard";
import type { DiagnosisStep } from "../hooks/diagnosisTypes";
import { generateMockReport } from "../hooks/diagnosisUtils";
import { useDeveloper } from "@/stores/useAppStore";
import { MOCK_PROFILES } from "@/data/mockProfiles";
import { generateMockTestData } from "@/data/mockTestData";
import type { DiagnosisWizardData } from "@/types/diagnosis";

// UI Components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressStepper } from "./ProgressStepper";
import { PhaseCompleteAnimation, DiagnosisPhase } from "./PhaseCompleteAnimation";
import { AnalysisLoadingScreen } from "./AnalysisLoadingScreen";
import { DiagnosisReport } from "./DiagnosisReport";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Step Components
import { BasicInfoForm } from "./BasicInfoForm";
import { InquiryWizard } from "./InquiryWizard";
import { AudioRecorder } from "./AudioRecorder";
import { PulseCheck } from "./PulseCheck";
import { SmartConnectStep } from "./SmartConnectStep";
import { DiagnosisSummary } from "./DiagnosisSummary";
import { ResumeProgressDialog } from "./ResumeProgressDialog";

// Extracted Wizard Sub-Components
import { DeveloperModePanel, TestProfilesModal, ImageAnalysisStepRenderer } from "./wizard";
import { useTestDataHandlers } from "./wizard/hooks/useTestDataHandlers";
import { createDefaultReportOptions } from "./wizard/utils/reportOptions";
import { ProcessingStep } from "./wizard/components/ProcessingStep";

export default function DiagnosisWizard() {
  // 1. Controller Logic (Hook)
  const {
    step,
    setStep,
    data,
    setData,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    completion,
    setCompletion,
    isLoading,
    error,
    isSaved,
    setIsSaved,
    maxStepReached,
    celebrationPhase,
    setCelebrationPhase,
    pendingResumeState,
    handleResumeProgress,
    handleStartNew,
    nextStep,
    prevStep,
    analyzeImage,
    handleSkipAnalysis,
    submitConsultation,
    STEPS,
    t,
  } = useDiagnosisWizard();

  const { isDeveloperMode } = useDeveloper();
  const [showTestProfiles, setShowTestProfiles] = React.useState(false);

  // Use extracted hook for test data handlers
  useTestDataHandlers({
    setData,
    setStep,
    setAnalysisResult,
    setCompletion,
  });

  // Helper to determine current stepper ID (e.g., grouping face parts)
  const getCurrentStepperId = () => {
    if (step === "wang_part") return "wang_face";
    if (step === "processing" || step === "report") return "smart_connect";
    return step;
  };

  // Helper to create image step handlers
  const createImageStepHandlers = (
    stepKey: "wang_tongue" | "wang_face" | "wang_part",
    type: "tongue" | "face" | "part"
  ) => ({
    onCapture: (result: { image?: string }) => {
      setData((prev) => ({ ...prev, [stepKey]: result }));
      if (result.image) {
        analyzeImage(result.image, type);
      } else {
        setTimeout(() => nextStep(stepKey, true), 0);
      }
    },
    onRetake: () => {
      setAnalysisResult(null);
      setData((prev) => ({ ...prev, [stepKey]: null }));
    },
    onContinue: (editedData?: { observation: string; potentialIssues: string[] }) => {
      if (editedData) {
        setData((prev) => ({
          ...prev,
          [stepKey]: {
            ...(prev[stepKey] as any),
            observation: editedData.observation,
            potential_issues: editedData.potentialIssues,
          },
        }));
      }
      setAnalysisResult(null);
      setTimeout(() => nextStep(stepKey), 0);
    },
    onSkip: () => handleSkipAnalysis(type),
    onBack: () => prevStep(stepKey),
  });

  // Handler for mock report viewing
  const handleFillAndViewMockReport = () => {
    const mockData = MOCK_PROFILES[0].data;
    setData((prev) => ({
      ...prev,
      ...mockData,
      report_options: createDefaultReportOptions(),
      verified_summaries: {
        inquiry: (mockData.wen_inquiry as any)?.summary,
        tongue: (mockData.wang_tongue as any)?.observation,
        face: (mockData.wang_face as any)?.observation,
        pulse: "Pulse analysis completed",
      },
    }));

    // Generate mock report and skip directly to report step
    // Note: In dev mode, we bypass processing and go straight to report
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generateMockReport(mockData as any);
    setCompletion(100); // Mark as complete
    setStep("report");
  };

  // Handler for test profile selection
  const handleSelectTestProfile = (profileData: DiagnosisWizardData) => {
    const newData = {
      ...data,
      ...profileData,
      report_options: createDefaultReportOptions(),
      verified_summaries: {
        inquiry: (profileData.wen_inquiry as any)?.summary || "Inquiry completed",
        tongue: (profileData.wang_tongue as any)?.observation || "Tongue analysis completed",
        face: (profileData.wang_face as any)?.observation || "Face analysis completed",
        pulse: "Pulse analysis completed",
      },
    };
    setData(newData);
    if (step === "processing" || step === "report") {
      // For test profiles, just mark as complete
      setCompletion(100);
    }
  };

  return (
    <div className="w-full px-5 md:px-6 md:max-w-4xl md:mx-auto p-3 md:p-6 pb-24">
      {/* Resume Progress Dialog */}
      <ResumeProgressDialog
        isOpen={pendingResumeState !== null}
        savedStep={pendingResumeState?.step || "basic_info"}
        savedTimestamp={pendingResumeState?.timestamp || ""}
        onResume={handleResumeProgress}
        onStartNew={handleStartNew}
      />

      {/* Phase completion celebration animation */}
      <PhaseCompleteAnimation
        isVisible={celebrationPhase !== null}
        phase={(celebrationPhase as DiagnosisPhase) || "basics"}
        onComplete={() => setCelebrationPhase(null)}
        duration={1500}
      />

      {/* Progress Stepper */}
      {step !== "processing" && step !== "report" && (
        <ProgressStepper
          currentStep={getCurrentStepperId()}
          steps={STEPS}
          maxStepIndex={maxStepReached}
          onStepClick={(stepId) => {
            const targetIndex = STEPS.findIndex((s) => s.id === stepId);
            if (targetIndex !== -1 && targetIndex <= maxStepReached) {
              setStep(stepId as DiagnosisStep);
            }
          }}
          promptType={
            step === "wen_inquiry"
              ? "chat"
              : step === "wang_tongue" || step === "wang_face" || step === "wang_part"
                ? "image"
                : step === "wen_audio"
                  ? "audio"
                  : step === "summary"
                    ? "final"
                    : undefined
          }
        />
      )}

      {/* Main Content Render Switch */}
      <div className="relative min-h-[400px] md:min-h-[600px]">
        {/* 1. Basic Info */}
        {step === "basic_info" && (
          <div key="basic_info">
            <BasicInfoForm
              initialData={data.basic_info as any}
              onComplete={(result) => {
                setData((prev) => ({
                  ...prev,
                  basic_info: {
                    ...result,
                    age: Number(result.age) || undefined,
                    height: Number(result.height) || undefined,
                    weight: Number(result.weight) || undefined,
                  },
                }));
                setTimeout(() => nextStep("basic_info"), 0);
              }}
            />
          </div>
        )}

        {/* 2. Inquiry */}
        {step === "wen_inquiry" && (
          <div key="wen_inquiry">
            <InquiryWizard
              basicInfo={data.basic_info as any}
              initialData={data.wen_inquiry as any}
              onComplete={(result) => {
                setData((prev) => ({
                  ...prev,
                  wen_inquiry: result as any,
                  wen_chat: (result.chatHistory || []) as any,
                }));
                setTimeout(() => nextStep("wen_inquiry"), 0);
              }}
              onBack={() => prevStep("wen_inquiry")}
            />
          </div>
        )}

        {/* 3. Tongue Analysis - Using extracted component */}
        {step === "wang_tongue" && (
          <div key="wang_tongue">
            <ImageAnalysisStepRenderer
              type="tongue"
              title={t.tongue.title}
              instruction={t.tongue.instructions}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult as any}
              existingData={data.wang_tongue as any | null}
              {...createImageStepHandlers("wang_tongue", "tongue")}
            />
          </div>
        )}

        {/* 4. Face Analysis - Using extracted component */}
        {step === "wang_face" && (
          <div key="wang_face">
            <ImageAnalysisStepRenderer
              type="face"
              title={t.face.title}
              instruction={t.face.instructions}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult as any}
              existingData={data.wang_face as any | null}
              {...createImageStepHandlers("wang_face", "face")}
            />
          </div>
        )}

        {/* 5. Body Part Analysis - Using extracted component */}
        {step === "wang_part" && (
          <div key="wang_part">
            <ImageAnalysisStepRenderer
              type="part"
              title={t.bodyPart.title}
              instruction={t.bodyPart.instructions}
              required={false}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult as any}
              existingData={data.wang_part as any | null}
              {...createImageStepHandlers("wang_part", "part")}
            />
          </div>
        )}

        {/* 6. Audio Analysis */}
        {step === "wen_audio" && (
          <div key="wen_audio">
            <AudioRecorder
              initialData={data.wen_audio as any}
              onComplete={(result) => {
                setData((prev) => ({ ...prev, wen_audio: result as any }));
                setTimeout(() => nextStep("wen_audio", result.skipCelebration), 0);
              }}
              onBack={() => prevStep("wen_audio")}
            />
          </div>
        )}

        {/* 7. Pulse Check */}
        {step === "qie" && (
          <div key="qie">
            <PulseCheck
              initialData={data.qie as any}
              onComplete={(result) => {
                setData((prev) => ({ ...prev, qie: result }));
                nextStep("qie");
              }}
              onBack={() => prevStep("qie")}
            />
          </div>
        )}

        {/* 8. Smart Connect */}
        {step === "smart_connect" && (
          <div key="smart_connect">
            <SmartConnectStep
              initialData={(data.smart_connect as any) || {}}
              onComplete={(result) => {
                setData((prev) => ({
                  ...prev,
                  smart_connect: {
                    connected: true,
                    device_type: "wearable",
                    data: result as Record<string, unknown>,
                  },
                }));
                nextStep("smart_connect");
              }}
              onBack={() => prevStep("smart_connect")}
            />
          </div>
        )}

        {/* 9. Summary Review */}
        {step === "summary" && (
          <div key="summary">
            <ErrorBoundary
              showDetails={true}
              onError={(error) => console.error("Diagnosis Wizard Error:", error)}
            >
              <DiagnosisSummary
                data={data}
                onConfirm={(summaries, options, additionalInfo) => {
                  setData((prev) => ({
                    ...prev,
                    verified_summaries: summaries,
                    report_options: options,
                    basic_info: {
                      ...(prev.basic_info as any),
                      ...additionalInfo,
                    },
                  }));
                  nextStep("summary");
                }}
                onBack={() => prevStep("summary")}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* 10. Processing & Report */}
        {step === "processing" && (
          <div key="processing">
            <ProcessingStep
              isLoading={isLoading}
              error={error}
              completion={completion}
              data={data as any}
              isSaved={isSaved}
              setData={setData}
              setStep={setStep}
              setIsSaved={setIsSaved}
              submitConsultation={submitConsultation}
              t={t}
            />
          </div>
        )}
      </div>

      {/* Developer Mode Controls - Using extracted component */}
      {isDeveloperMode && (
        <DeveloperModePanel
          currentStep={step}
          steps={STEPS}
          onStepChange={(stepId) => setStep(stepId as DiagnosisStep)}
          onOpenTestProfiles={() => setShowTestProfiles(true)}
          onFillAndViewMockReport={handleFillAndViewMockReport}
          onOpenTestRunner={() => window.open("/test-runner", "_blank")}
        />
      )}

      {/* Test Profiles Modal - Using extracted component */}
      <TestProfilesModal
        isOpen={showTestProfiles}
        onClose={() => setShowTestProfiles(false)}
        onSelectProfile={(profileData) =>
          handleSelectTestProfile(profileData as unknown as DiagnosisWizardData)
        }
      />
    </div>
  );
}
