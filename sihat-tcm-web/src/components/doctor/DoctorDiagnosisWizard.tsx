"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { differenceInYears } from "date-fns";
import { toast } from "sonner";
import { User, Stethoscope, Camera, MessageSquare, FileText, Pill } from "lucide-react";

// Stores and Hooks
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorDiagnosis } from "@/features/doctor";
import { DoctorDiagnosisData, initialData } from "@/features/doctor";
import { useDiagnosisSubmission } from "@/features/doctor";
import { useFileUpload, useMedicineChips, useWizardState, SectionId } from "./hooks";

// UI Components
import { WizardHeader, SavedDraftNotice, ReportViewerDialog, SubmitButton } from "./ui";
import { CollapsibleSection } from "./CollapsibleSection";
import { QuickSelectInquiry } from "./QuickSelectInquiry";

// Section Components
import {
  PatientInfoSection,
  SymptomsSection,
  ImageCaptureSection,
  ReportsSection,
  MedicinesSection,
  ClinicalNotesSection,
} from "./sections";

// Section configuration (order defines step sequence)
const SECTIONS = [
  { id: "patient-info" as const, title: "Patient Information", icon: User },
  { id: "symptoms" as const, title: "Symptoms & Chief Complaints", icon: Stethoscope },
  { id: "tongue" as const, title: "Tongue Analysis", icon: Camera },
  { id: "face" as const, title: "Face Analysis", icon: Camera },
  { id: "tcm-inquiry" as const, title: "TCM Inquiry", icon: MessageSquare },
  { id: "reports" as const, title: "Upload Reports", icon: FileText },
  { id: "medicines" as const, title: "Current Medicines", icon: Pill },
  { id: "clinical-notes" as const, title: "Clinical Notes & Treatment", icon: FileText },
];

const VALID_STEP_IDS = new Set(SECTIONS.map((s) => s.id));
const DEFAULT_STEP: SectionId = "patient-info";

export function DoctorDiagnosisWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const stepParam = searchParams.get("step");
  const currentStep: SectionId = (VALID_STEP_IDS.has(stepParam as SectionId)
    ? stepParam
    : DEFAULT_STEP) as SectionId;
  const stepIndex = SECTIONS.findIndex((s) => s.id === currentStep);
  const supabase = createClient();
  const { t } = useLanguage();

  // Normalize URL when step is missing or invalid (keeps patientId)
  useEffect(() => {
    if (stepParam !== currentStep) {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", currentStep);
      router.replace(`/doctor/diagnose?${q.toString()}`, { scroll: false });
    }
  }, [currentStep, stepParam, searchParams, router]);

  const goToStep = useCallback(
    (stepId: SectionId) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", stepId);
      if (patientId) q.set("patientId", patientId);
      router.push(`/doctor/diagnose?${q.toString()}`, { scroll: false });
    },
    [patientId, searchParams, router]
  );

  // Form data state
  const { data, setData, clearDraft, hasSavedDraft, isInitialized } = useDoctorDiagnosis();
  const [patient, setPatient] = useState<any>(null);

  // Custom hooks for wizard functionality
  const wizardState = useWizardState({ data });
  const fileUpload = useFileUpload({ setData });
  const medicineChips = useMedicineChips({
    currentMedicines: data.currentMedicines,
    setData,
  });
  const { submitDiagnosis, isSubmitting } = useDiagnosisSubmission();

  // Fetch patient data if patientId is present
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !isInitialized) return;

      try {
        const { data: patientData, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single();

        if (error) {
          console.error("Error fetching patient:", error);
          return;
        }

        if (patientData) {
          setPatient(patientData);
          const age = patientData.birth_date
            ? differenceInYears(new Date(), new Date(patientData.birth_date)).toString()
            : "";
          const newName = `${patientData.first_name} ${patientData.last_name || ""}`.trim();
          const newGender = patientData.gender || "";

          setData((prev: DoctorDiagnosisData) => {
            // If we have data for a different patient, clear it and start fresh
            if (prev.patientInfo.name && prev.patientInfo.name !== newName) {
              return {
                ...initialData,
                patientInfo: {
                  ...initialData.patientInfo,
                  name: newName,
                  age: age,
                  gender: newGender,
                },
              };
            }

            return {
              ...prev,
              patientInfo: {
                ...prev.patientInfo,
                name: newName,
                age: age,
                gender: newGender || prev.patientInfo.gender,
              },
            };
          });

          toast.success(`Loaded profile: ${patientData.first_name}`);
        }
      } catch (err) {
        console.error("Error loading patient data:", err);
      }
    };

    fetchPatientData();
  }, [patientId, supabase, setData, isInitialized]);

  // Update handlers
  const updatePatientInfo = useCallback(
    (field: keyof DoctorDiagnosisData["patientInfo"], value: string) => {
      setData((prev: DoctorDiagnosisData) => ({
        ...prev,
        patientInfo: { ...prev.patientInfo, [field]: value },
      }));
    },
    [setData]
  );

  const toggleSymptom = useCallback(
    (symptom: string) => {
      setData((prev: DoctorDiagnosisData) => {
        const symptoms = prev.selectedSymptoms.includes(symptom)
          ? prev.selectedSymptoms.filter((s: string) => s !== symptom)
          : [...prev.selectedSymptoms, symptom];
        return { ...prev, selectedSymptoms: symptoms };
      });
    },
    [setData]
  );

  const handleTongueCapture = useCallback(
    (result: { image?: string }) => {
      if (result.image) {
        setData((prev: DoctorDiagnosisData) => ({ ...prev, tongueImage: result.image || "" }));
        wizardState.setShowTongueCamera(false);
        toast.success("Tongue image captured");
      }
    },
    [setData, wizardState]
  );

  const handleFaceCapture = useCallback(
    (result: { image?: string }) => {
      if (result.image) {
        setData((prev: DoctorDiagnosisData) => ({ ...prev, faceImage: result.image || "" }));
        wizardState.setShowFaceCamera(false);
        toast.success("Face image captured");
      }
    },
    [setData, wizardState]
  );

  const handleInquiryUpdate = useCallback(
    (answers: Record<string, string[]>) => {
      setData((prev: DoctorDiagnosisData) => ({ ...prev, inquiryAnswers: answers }));
    },
    [setData]
  );

  // Fill test data
  const handleFillTestData = useCallback(() => {
    setData({
      patientInfo: {
        name: "Test Patient",
        age: "45",
        gender: "male",
        height: "170",
        weight: "70",
      },
      selectedSymptoms: ["Headache", "Fatigue", "Insomnia"],
      otherSymptoms: "Occasional dizziness when standing up quickly",
      tongueImage: "",
      faceImage: "",
      inquiryAnswers: {},
      uploadedReports: [],
      currentMedicines: "Vitamin C, Omega-3",
      clinicalNotes:
        "Patient presents with classic Spleen Qi deficiency. Pulse is weak and thready. Tongue is pale with tooth marks.",
      treatmentPlan:
        "Herbal formula: Si Jun Zi Tang. Acupuncture: ST36, SP6, CV12. Avoid cold foods.",
    });
    toast.success("Test data filled");
  }, [setData]);

  // Clear all data
  const handleClearData = useCallback(() => {
    clearDraft();
    toast.success("Form cleared");
  }, [clearDraft]);

  // Submit diagnosis
  const handleSubmit = useCallback(async () => {
    // Validation - navigate to first incomplete section
    if (!data.patientInfo.name || !data.patientInfo.age || !data.patientInfo.gender) {
      goToStep("patient-info");
      return;
    }
    if (data.selectedSymptoms.length === 0 && !data.otherSymptoms) {
      goToStep("symptoms");
      return;
    }

    await submitDiagnosis(
      data,
      patient ? { id: patient.id, user_id: patient.user_id } : undefined,
      {
        onClearDraft: clearDraft,
        redirectPath: "/doctor",
      }
    );
  }, [data, patient, clearDraft, submitDiagnosis, goToStep]);

  // Helper function to get completion status for sections
  const getSectionStatus = (sectionId: SectionId): "complete" | "incomplete" | "partial" => {
    switch (sectionId) {
      case "patient-info":
        return data.patientInfo.name && data.patientInfo.age && data.patientInfo.gender
          ? "complete"
          : "incomplete";
      case "symptoms":
        return data.selectedSymptoms.length > 0 || data.otherSymptoms ? "complete" : "incomplete";
      case "tongue":
        return data.tongueImage ? "complete" : "incomplete";
      case "face":
        return data.faceImage ? "complete" : "incomplete";
      case "tcm-inquiry":
        return Object.keys(data.inquiryAnswers).length > 0 ? "complete" : "incomplete";
      case "reports":
        return data.uploadedReports.length > 0 ? "complete" : "incomplete";
      case "medicines":
        return data.currentMedicines ? "complete" : "incomplete";
      case "clinical-notes":
        return data.clinicalNotes || data.treatmentPlan ? "complete" : "incomplete";
      default:
        return "incomplete";
    }
  };

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(SECTIONS[stepIndex - 1].id);
    } else {
      router.push("/doctor");
    }
  }, [stepIndex, goToStep, router]);

  const handleNext = useCallback(() => {
    if (stepIndex < SECTIONS.length - 1) {
      goToStep(SECTIONS[stepIndex + 1].id);
    }
  }, [stepIndex, goToStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <WizardHeader
        completionPercentage={wizardState.getCompletionPercentage()}
        currentStepIndex={stepIndex}
        totalSteps={SECTIONS.length}
        onBack={handleBack}
        onNext={stepIndex < SECTIONS.length - 1 ? handleNext : undefined}
        onFillTestData={handleFillTestData}
        onClearData={handleClearData}
      />

      <SavedDraftNotice show={hasSavedDraft} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4">
        {/* Patient Information Section */}
        <CollapsibleSection
          id="patient-info"
          title="Patient Information"
          icon={User}
          isExpanded={currentStep === "patient-info"}
          onToggle={() => goToStep("patient-info")}
          completionStatus={getSectionStatus("patient-info")}
        >
          <PatientInfoSection patientInfo={data.patientInfo} onUpdateField={updatePatientInfo} />
        </CollapsibleSection>

        {/* Symptoms Section */}
        <CollapsibleSection
          id="symptoms"
          title="Symptoms & Chief Complaints"
          icon={Stethoscope}
          isExpanded={currentStep === "symptoms"}
          onToggle={() => goToStep("symptoms")}
          completionStatus={getSectionStatus("symptoms")}
        >
          <SymptomsSection
            selectedSymptoms={data.selectedSymptoms}
            otherSymptoms={data.otherSymptoms}
            onToggleSymptom={toggleSymptom}
            onOtherSymptomsChange={(value) =>
              setData((prev: DoctorDiagnosisData) => ({ ...prev, otherSymptoms: value }))
            }
          />
        </CollapsibleSection>

        {/* Tongue Analysis Section */}
        <CollapsibleSection
          id="tongue"
          title="Tongue Analysis"
          icon={Camera}
          isExpanded={currentStep === "tongue"}
          onToggle={() => goToStep("tongue")}
          completionStatus={getSectionStatus("tongue")}
        >
          <ImageCaptureSection
            type="tongue"
            image={data.tongueImage}
            showCamera={wizardState.showTongueCamera}
            onShowCamera={wizardState.setShowTongueCamera}
            onCapture={handleTongueCapture}
            onClear={() => setData((prev: DoctorDiagnosisData) => ({ ...prev, tongueImage: "" }))}
          />
        </CollapsibleSection>

        {/* Face Analysis Section */}
        <CollapsibleSection
          id="face"
          title="Face Analysis"
          icon={Camera}
          isExpanded={currentStep === "face"}
          onToggle={() => goToStep("face")}
          completionStatus={getSectionStatus("face")}
        >
          <ImageCaptureSection
            type="face"
            image={data.faceImage}
            showCamera={wizardState.showFaceCamera}
            onShowCamera={wizardState.setShowFaceCamera}
            onCapture={handleFaceCapture}
            onClear={() => setData((prev: DoctorDiagnosisData) => ({ ...prev, faceImage: "" }))}
          />
        </CollapsibleSection>

        {/* TCM Inquiry Section */}
        <CollapsibleSection
          id="tcm-inquiry"
          title="TCM Inquiry"
          icon={MessageSquare}
          isExpanded={currentStep === "tcm-inquiry"}
          onToggle={() => goToStep("tcm-inquiry")}
          completionStatus={getSectionStatus("tcm-inquiry")}
        >
          <QuickSelectInquiry
            patientInfo={data.patientInfo}
            symptoms={[...data.selectedSymptoms, data.otherSymptoms].filter(Boolean).join(", ")}
            answers={data.inquiryAnswers}
            onAnswersChange={handleInquiryUpdate}
          />
        </CollapsibleSection>

        {/* Upload Reports Section */}
        <CollapsibleSection
          id="reports"
          title="Upload Reports"
          icon={FileText}
          isExpanded={currentStep === "reports"}
          onToggle={() => goToStep("reports")}
          completionStatus={getSectionStatus("reports")}
        >
          <ReportsSection
            uploadedReports={data.uploadedReports}
            extractingFiles={fileUpload.extractingFiles}
            onFileChange={fileUpload.handleFileChange}
            onRemoveReport={fileUpload.removeReport}
            onViewReport={wizardState.setViewingReport}
          />
        </CollapsibleSection>

        {/* Current Medicines Section */}
        <CollapsibleSection
          id="medicines"
          title="Current Medicines"
          icon={Pill}
          isExpanded={currentStep === "medicines"}
          onToggle={() => goToStep("medicines")}
          completionStatus={getSectionStatus("medicines")}
        >
          <MedicinesSection
            currentMedicines={data.currentMedicines}
            medicineInput={medicineChips.medicineInput}
            onMedicineInputChange={medicineChips.setMedicineInput}
            onAddMedicine={medicineChips.addMedicine}
            onRemoveMedicine={medicineChips.removeMedicine}
            onCurrentMedicinesChange={(value) =>
              setData((prev: DoctorDiagnosisData) => ({ ...prev, currentMedicines: value }))
            }
          />
        </CollapsibleSection>

        {/* Clinical Notes & Treatment Plan */}
        <CollapsibleSection
          id="clinical-notes"
          title="Clinical Notes & Treatment"
          icon={FileText}
          isExpanded={currentStep === "clinical-notes"}
          onToggle={() => goToStep("clinical-notes")}
          completionStatus={getSectionStatus("clinical-notes")}
        >
          <ClinicalNotesSection
            clinicalNotes={data.clinicalNotes}
            treatmentPlan={data.treatmentPlan}
            onClinicalNotesChange={(value) =>
              setData((prev: DoctorDiagnosisData) => ({ ...prev, clinicalNotes: value }))
            }
            onTreatmentPlanChange={(value) =>
              setData((prev: DoctorDiagnosisData) => ({ ...prev, treatmentPlan: value }))
            }
          />
        </CollapsibleSection>

        {/* Submit Button */}
        <SubmitButton isSubmitting={isSubmitting} onClick={handleSubmit} />
      </main>

      {/* Report Viewer Dialog */}
      <ReportViewerDialog
        report={wizardState.viewingReport}
        onClose={() => wizardState.setViewingReport(null)}
      />
    </div>
  );
}
