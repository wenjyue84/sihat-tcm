"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { User, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";

// Import sub-components from basic-info folder
import { BasicInfoData } from "./basic-info/types";
import { StepProgress } from "./basic-info/StepProgress";
import { PersonalInfoStep } from "./basic-info/PersonalInfoStep";
import { SymptomsStep } from "./basic-info/SymptomsStep";
// DoctorSelectionStep removed - model is now Admin-only controlled via DoctorContext

// Import hooks
import { useProfileCompleteness } from "./basic-info/hooks/useProfileCompleteness";
import { useAutoFillFormData } from "./basic-info/hooks/useAutoFillFormData";

// Re-export for external consumers
export type { BasicInfoData } from "./basic-info/types";

// Total number of wizard steps (reduced from 3 to 2 - doctor selection moved to admin-only)
const TOTAL_STEPS = 2;

// Animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function BasicInfoForm({
  onComplete,
  initialData,
}: {
  onComplete: (data: BasicInfoData) => void;
  initialData?: BasicInfoData;
}) {
  // Note: Model selection is now Admin-only. DoctorContext auto-loads the admin-configured default.
  const { t } = useLanguage();
  const { updateFormProgress, setNavigationState } = useDiagnosisProgress();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // Form data is now managed by useAutoFillFormData hook

  // Track which input was last focused to direct quick selections (for SymptomsStep)
  const [activeInput, setActiveInput] = useState<"main" | "other">("main");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Use profile completeness hook
  const { autoFilledData } = useProfileCompleteness({
    autoSkipToStep2: true,
    currentStep,
    onStepChange: (step, dir) => {
      setDirection(dir);
      setCurrentStep(step);
    },
    t,
    patientsOnly: true,
  });

  // Use auto-fill form data hook
  const { formData, setFormData, resetFormData } = useAutoFillFormData({
    initialData,
    profileData: autoFilledData,
    loadFromLocalStorage: true,
  });

  /**
   * ============================================================================
   * GRANULAR PROGRESS TRACKING
   * ============================================================================
   * Tracks form field completion and updates the header progress indicator.
   * The basic_info step contributes 14% to total progress.
   */
  useEffect(() => {
    if (!updateFormProgress) return;

    const fields = [
      formData.gender,
      formData.age,
      formData.height,
      formData.weight,
      formData.symptomDuration,
      formData.symptoms,
    ];

    const completedFields = fields.filter((field) => field && String(field).trim() !== "").length;
    const totalFields = fields.length;

    updateFormProgress("basic_info", completedFields, totalFields);
  }, [formData, updateFormProgress]);

  // Data loading and auto-fill is now handled by useAutoFillFormData hook

  // Listen for test data fill and clear events
  useEffect(() => {
    const handleFillTestData = () => {
      const testData: BasicInfoData = {
        name: "John Doe",
        age: "35",
        gender: "male",
        weight: "72",
        height: "175",
        symptoms: "Headache, Fatigue, feeling tired and dizzy for the past week",
        mainComplaint: "Headache",
        otherSymptoms: "Fatigue, feeling tired and dizzy for the past week",
        symptomDuration: "1-2-weeks",
      };
      setFormData(testData);
      setSelectedSymptoms(["headache", "fatigue"]);
    };

    const handleClearTestData = () => {
      setFormData({
        name: "anonymous",
        age: "",
        gender: "",
        weight: "",
        height: "",
        mainComplaint: "",
        otherSymptoms: "",
        symptoms: "",
        symptomDuration: "",
      });
      setSelectedSymptoms([]);
      setCurrentStep(1);
      setStepError(null);
    };

    window.addEventListener("fill-test-data", handleFillTestData);
    window.addEventListener("clear-test-data", handleClearTestData);
    return () => {
      window.removeEventListener("fill-test-data", handleFillTestData);
      window.removeEventListener("clear-test-data", handleClearTestData);
    };
  }, []);

  // Effect to sync mainComplaint/otherSymptoms to symptoms for backward compatibility
  useEffect(() => {
    const main = formData.mainComplaint || "";
    const other = formData.otherSymptoms || "";
    let combined = main;
    if (other) {
      combined = main ? `${main}. Other: ${other}` : other;
    }

    if (formData.symptoms !== combined) {
      setFormData((prev) => ({ ...prev, symptoms: combined }));
    }
  }, [formData.mainComplaint, formData.otherSymptoms]);

  // Helper function to scroll to and focus a field
  const scrollToAndFocusField = (elementId: string) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          element.focus();
          if (element.tagName === "BUTTON" && element.getAttribute("role") === "combobox") {
            element.click();
          }
        }, 300);
      }
    }, 100);
  };

  // Validate current step before proceeding
  const validateStep = (step: number, scrollToField: boolean = false): boolean => {
    setStepError(null);

    switch (step) {
      case 1:
        // Personal Info step - requires gender, age, height, weight
        if (!formData.gender) {
          setStepError(
            t.basicInfo.gender + " " + (t.errors?.requiredField || "This field is required")
          );
          return false;
        }
        if (!formData.age) {
          setStepError(
            t.basicInfo.age + " " + (t.errors?.requiredField || "This field is required")
          );
          if (scrollToField) scrollToAndFocusField("age");
          return false;
        }
        const ageNum = parseInt(formData.age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
          setStepError(
            t.basicInfo.age + " " + (t.errors?.invalidRange || "must be between 0 and 150")
          );
          if (scrollToField) scrollToAndFocusField("age");
          return false;
        }

        if (!formData.height) {
          setStepError(
            t.basicInfo.height + " " + (t.errors?.requiredField || "This field is required")
          );
          if (scrollToField) scrollToAndFocusField("height");
          return false;
        }
        const heightNum = parseFloat(formData.height);
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
          setStepError(
            t.basicInfo.height + " " + (t.errors?.invalidRange || "must be between 50 and 250")
          );
          if (scrollToField) scrollToAndFocusField("height");
          return false;
        }

        if (!formData.weight) {
          setStepError(
            t.basicInfo.weight + " " + (t.errors?.requiredField || "This field is required")
          );
          if (scrollToField) scrollToAndFocusField("weight");
          return false;
        }
        const weightNum = parseFloat(formData.weight);
        if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
          setStepError(
            t.basicInfo.weight + " " + (t.errors?.invalidRange || "must be between 20 and 300")
          );
          if (scrollToField) scrollToAndFocusField("weight");
          return false;
        }
        return true;
      case 2:
        // Symptoms step
        if (!formData.symptomDuration) {
          setStepError(
            t.basicInfo.duration + " " + (t.errors?.requiredField || "This field is required")
          );
          if (scrollToField) scrollToAndFocusField("symptomDuration");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (validateStep(currentStep, false)) {
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } else {
      validateStep(currentStep, true);
    }
  };

  // Sync navigation state with BottomNavigation
  useEffect(() => {
    const canGoNext = validateStep(currentStep, false);
    const isLastStep = currentStep === TOTAL_STEPS;

    setNavigationState({
      onNext: () => {
        if (validateStep(currentStep, false)) {
          if (isLastStep) {
            onComplete(formData);
          } else {
            setDirection(1);
            setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
          }
        } else {
          validateStep(currentStep, true);
        }
      },
      onBack:
        currentStep > 1
          ? () => {
            setStepError(null);
            setDirection(-1);
            setCurrentStep((prev) => Math.max(prev - 1, 1));
          }
          : undefined,
      showNext: true,
      showBack: true,
      showSkip: false,
      canNext: canGoNext,
    });
  }, [currentStep, formData, setNavigationState]);

  const goToPreviousStep = () => {
    setStepError(null);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep, false)) {
      onComplete(formData);
    } else {
      validateStep(currentStep, true);
    }
  };

  // Get step title and subtitle
  const getStepInfo = (step: number) => {
    const stepInfo = {
      1: {
        title: t.basicInfo.wizardSteps?.step1Title || "Tell us about yourself",
        subtitle: t.basicInfo.wizardSteps?.step1Subtitle || "Your basic information for diagnosis",
      },
      2: {
        title: t.basicInfo.wizardSteps?.step4Title || "What's bothering you?",
        subtitle: t.basicInfo.wizardSteps?.step4Subtitle || "Describe your symptoms",
      },
    };
    return stepInfo[step as keyof typeof stepInfo] || { title: "", subtitle: "" };
  };

  // Render step content using imported sub-components
  const renderStepContent = () => {
    const stepInfo = getStepInfo(currentStep);

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="space-y-4"
        >
          {/* Step Header - Only show for steps 2 and 3, skip for Step 1 to save space */}
          {currentStep > 1 && (
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-stone-800 mb-2">{stepInfo.title}</h3>
              <p className="text-stone-500">{stepInfo.subtitle}</p>
            </div>
          )}

          {/* Step Content - Using imported sub-components */}
          {currentStep === 1 && <PersonalInfoStep formData={formData} setFormData={setFormData} />}

          {currentStep === 2 && (
            <SymptomsStep
              formData={formData}
              setFormData={setFormData}
              activeInput={activeInput}
              setActiveInput={setActiveInput}
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={setSelectedSymptoms}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">{t.basicInfo.title}</h2>
        </div>
        <p className="text-emerald-50 opacity-90">{t.basicInfo.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 pb-24 md:pb-6"
        noValidate
        suppressHydrationWarning
      >
        {/* Progress Indicator */}
        <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="min-h-[350px]">{renderStepContent()}</div>

        {/* Error Message */}
        <AnimatePresence>
          {stepError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"
            >
              {stepError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons - Hidden on mobile as handled by BottomNavigation */}
        <div className="hidden md:block md:mt-8">
          <div className="flex gap-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                className="flex-1 h-12 text-stone-600 border-stone-200 hover:bg-stone-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t.common.back}
              </Button>
            )}

            {/* Next / Submit Button */}
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300"
              >
                {t.common.next}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t.basicInfo.startDiagnosis}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
