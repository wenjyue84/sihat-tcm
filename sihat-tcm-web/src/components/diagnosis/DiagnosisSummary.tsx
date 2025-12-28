"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Check,
  User,
  FileText,
  Activity,
  Stethoscope,
  ClipboardList,
  FileOutput,
} from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnosisProgress } from "@/stores/useAppStore";

// Extracted Sub-Components
import {
  ObservationsSection,
  InquirySection,
  OptionsSection,
} from "./summary";
// Extracted utilities and hooks
import { transformDiagnosisDataToSummaries } from "./summary/utils/summaryDataTransformers";
import { useReportOptions, type ReportOptions } from "./summary/hooks/useReportOptions";

interface DiagnosisSummaryProps {
  data: any;
  onConfirm: (
    confirmedData: Record<string, unknown>,
    options: Record<string, unknown>,
    additionalInfo?: Record<string, unknown>
  ) => void;
  onBack: () => void;
}

// Re-export ReportOptions type for external use (if needed)
// export type { ReportOptions } from "./summary/hooks/useReportOptions";

type WizardStep = "observations" | "inquiry" | "options";

/**
 * STABILITY NOTE: This component interacts with DiagnosisProgressContext
 * which can trigger parent re-renders. ALL objects/arrays used in
 * useEffect dependencies or passed to Context MUST be memoized.
 * See fix.md for the infinite loop incident (Dec 14, 2025).
 */
export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
  const { t } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();
  const [currentStep, setCurrentStep] = useState<WizardStep>("observations");
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [additionalInfo, setAdditionalInfo] = useState({
    address: "",
    contact: "",
    emergencyContact: "",
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    patientInfo: true,
    vitalSigns: false,
    medicalHistory: false,
    recommendations: true,
    reportExtras: false,
  });
  // Use extracted hook for report options management
  const { options, handleOptionChange } = useReportOptions();

  // Initialize summaries from data using extracted utility
  useEffect(() => {
    const initialSummaries = transformDiagnosisDataToSummaries(data, t);
    setSummaries(initialSummaries);
  }, [data, t]);

  // FIX: Memoize handlers to prevent unnecessary re-renders
  // Using functional updaters means no dependencies needed
  const handleSummaryChange = useCallback((key: string, value: string) => {
    setSummaries((prev) => ({ ...prev, [key]: value }));
  }, []);

  // handleOptionChange is now provided by useReportOptions hook

  const handleConfirm = useCallback(() => {
    onConfirm(summaries, options, additionalInfo);
  }, [onConfirm, summaries, options, additionalInfo]);

  // FIX: Memoize steps to prevent infinite re-render loop caused by unstable dependencies updating Context
  const steps = useMemo(
    () => [
      { id: "observations", title: t.diagnosisSummary.sections.wangTongue, icon: Stethoscope }, // Using Tongue title as representative for observations
      { id: "inquiry", title: t.diagnosisSummary.sections.wenInquiry, icon: ClipboardList },
      { id: "options", title: t.diagnosisSummary.reportOptions.title, icon: FileOutput },
    ],
    [t]
  );

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Refs to store the latest versions of handlers to avoid stale closures
  const onBackRef = useRef(onBack);
  const onConfirmRef = useRef(onConfirm);
  const summariesRef = useRef(summaries);
  const optionsRef = useRef(options);
  const additionalInfoRef = useRef(additionalInfo);

  // Keep refs up to date
  useEffect(() => {
    onBackRef.current = onBack;
    onConfirmRef.current = onConfirm;
    summariesRef.current = summaries;
    optionsRef.current = options;
    additionalInfoRef.current = additionalInfo;
  }, [onBack, onConfirm, summaries, options, additionalInfo]);

  const handleNext = useCallback(() => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id as WizardStep);
    } else {
      onConfirmRef.current(summariesRef.current, optionsRef.current, additionalInfoRef.current);
    }
  }, [currentStep, steps]);

  const handleBack = useCallback(() => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id as WizardStep);
    } else {
      onBackRef.current();
    }
  }, [currentStep, steps]);

  // Sync with global navigation bar (for mobile)
  useEffect(() => {
    setNavigationState({
      onNext: handleNext,
      onBack: handleBack,
      onSkip: undefined, // No skip for summary steps
      showNext: true,
      showBack: true,
      showSkip: false,
    });
  }, [setNavigationState, handleNext, handleBack]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAdditionalInfoChange = useCallback((key: string, value: string) => {
    setAdditionalInfo((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Card className="p-4 md:p-6 space-y-6 pb-6 max-w-3xl mx-auto bg-white/80 backdrop-blur-md shadow-xl border-emerald-100/50 mb-20 md:mb-0">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
          {t.diagnosisSummary.title}
        </h2>
        <p className="text-slate-600 text-sm md:text-base">{t.diagnosisSummary.subtitle}</p>
      </div>

      {/* Progress Steps */}
      <div className="relative flex justify-between items-center px-2 md:px-4 py-6">
        <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-100 -z-10" />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm px-2 rounded-full"
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive ? "#10b981" : isCompleted ? "#10b981" : "#e2e8f0",
                  backgroundColor: isActive ? "#ecfdf5" : isCompleted ? "#10b981" : "#ffffff",
                }}
                className={`
                                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-colors shadow-sm
                                    ${isActive ? "text-emerald-600" : isCompleted ? "text-white" : "text-slate-400"}
                                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </motion.div>
              <span
                className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isActive ? "text-emerald-600" : "text-slate-400"} hidden md:block`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="min-h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="px-1"
          >
            {currentStep === "observations" && (
              <ObservationsSection
                summaries={summaries}
                data={data}
                onSummaryChange={handleSummaryChange}
                t={t}
              />
            )}
            {currentStep === "inquiry" && (
              <InquirySection
                summaries={summaries}
                onSummaryChange={handleSummaryChange}
                t={t}
              />
            )}
            {currentStep === "options" && (
              <OptionsSection
                options={options}
                onOptionChange={handleOptionChange}
                additionalInfo={additionalInfo}
                onAdditionalInfoChange={handleAdditionalInfoChange}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                t={t}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
