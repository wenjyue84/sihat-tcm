import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorLevel } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { useDiagnosisPersistence } from "@/hooks/useDiagnosisPersistence";
import { logger } from "@/lib/clientLogger";
import type { DiagnosisReport } from "@/types/database";
import type {
  DiagnosisWizardData,
  BasicInfo,
  AnalysisResult,
  PendingResumeState,
} from "@/types/diagnosis";

// Type definitions
export type DiagnosisStep =
  | "basic_info"
  | "wen_inquiry"
  | "wang_tongue"
  | "wang_face"
  | "wang_part"
  | "wen_audio"
  | "qie"
  | "smart_connect"
  | "summary"
  | "processing"
  | "report";
export type AnalysisType = "tongue" | "face" | "part";

export const STEPS_CONFIG = [
  { id: "basic_info", labelKey: "basics" },
  { id: "wen_inquiry", labelKey: "inquiry" },
  { id: "wang_tongue", labelKey: "tongue" },
  { id: "wang_face", labelKey: "face" },
  { id: "wen_audio", labelKey: "audio" },
  { id: "qie", labelKey: "pulse" },
  { id: "smart_connect", labelKey: "smartConnect" },
  { id: "summary", labelKey: "summary" },
];

// Helper for JSON repair
export function repairJSON(jsonString: string): string {
  try {
    let current = jsonString;
    const regexSummary = /("summary"\s*:\s*"(?:[^"\\]|\\.)*")\s*,\s*"(?:[^"\\]|\\.)*"\s*(?!:)/;
    const regexObjectOrphan = /(\})\s*,\s*"(?:[^"\\]|\\.)*"\s*(?!:)/;

    let iterations = 0;
    while (iterations < 20) {
      let changed = false;
      if (current.match(regexSummary)) {
        current = current.replace(regexSummary, "$1");
        changed = true;
      }
      if (current.match(regexObjectOrphan)) {
        current = current.replace(regexObjectOrphan, "$1");
        changed = true;
      }
      if (!changed) break;
      iterations++;
    }
    return current;
  } catch (e) {
    logger.error("repairJSON", "Error repairing JSON", e);
    return jsonString;
  }
}

export const generateMockReport = (data: DiagnosisWizardData): DiagnosisReport => {
  // Basic mock logic identical to original
  const name = data.basic_info?.name || "";
  // ... (rest of mock generation logic would go here ideally, but for brevity we can externalize or keep simplified)
  // For now we will return a minimal valid structure to save space in Hook
  return {
    diagnosis: {
      primary_pattern: "Mock Pattern",
      secondary_patterns: [],
      affected_organs: ["Spleen"],
      pathomechanism: "Mock mechanism",
    },
    constitution: { type: "Mock Type", description: "Mock Description" },
    analysis: { summary: "Mock Analysis", key_findings: {} },
    recommendations: { food: [], avoid: [], lifestyle: [] },
    patient_summary: { name: name },
    timestamp: new Date().toISOString(),
  };
};

// Calculate an overall health score from the diagnosis report (0-100)
function calculateOverallScore(reportData: DiagnosisReport | Partial<DiagnosisReport>): number {
  try {
    // Default to 70 (neutral/fair) if we can't calculate
    let score = 70;

    // Extract diagnosis text - can be string or object with primary_pattern
    let diagnosisText = "";
    if (typeof reportData.diagnosis === "string") {
      diagnosisText = reportData.diagnosis;
    } else if (
      reportData.diagnosis &&
      typeof reportData.diagnosis === "object" &&
      "primary_pattern" in reportData.diagnosis
    ) {
      diagnosisText = reportData.diagnosis.primary_pattern;
    } else if (
      reportData.diagnosis &&
      typeof reportData.diagnosis === "object" &&
      "pattern" in reportData.diagnosis
    ) {
      diagnosisText = String((reportData.diagnosis as any).pattern);
    }

    // Factor 1: Severity keywords in diagnosis (lower score for severe conditions)
    const diagnosisLower = diagnosisText.toLowerCase();
    if (diagnosisLower.includes("severe") || diagnosisLower.includes("deficiency")) {
      score -= 15;
    } else if (diagnosisLower.includes("mild") || diagnosisLower.includes("minor")) {
      score += 10;
    }

    // Factor 2: Number of affected organs/systems (more = lower score)
    const diagnosisObj =
      typeof reportData.diagnosis === "object" && reportData.diagnosis !== null
        ? reportData.diagnosis
        : null;
    const affectedOrgans =
      diagnosisObj &&
      "affected_organs" in diagnosisObj &&
      Array.isArray(diagnosisObj.affected_organs)
        ? diagnosisObj.affected_organs.length
        : 0;
    score -= Math.min(affectedOrgans * 5, 20);

    // Extract constitution text - can be string or object with type property
    let constitutionText = "";
    if (typeof reportData.constitution === "string") {
      constitutionText = reportData.constitution;
    } else if (
      reportData.constitution &&
      typeof reportData.constitution === "object" &&
      "type" in reportData.constitution
    ) {
      constitutionText = reportData.constitution.type;
    }

    // Factor 3: Constitution balance
    const constitutionLower = constitutionText.toLowerCase();
    if (constitutionLower.includes("balanced") || constitutionLower.includes("harmonious")) {
      score += 15;
    } else if (constitutionLower.includes("deficient") || constitutionLower.includes("stagnant")) {
      score -= 10;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (e) {
    logger.error("calculateOverallScore", "Error calculating overall score", e);
    return 70; // Default neutral score
  }
}

export function useDiagnosisWizard() {
  // Context Hooks
  const { getModel } = useDoctorLevel();
  const { t, language } = useLanguage();
  const { setProgress: setGlobalProgress, setNavigationState } = useDiagnosisProgress();
  const { user, profile } = useAuth();
  const { saveProgress, loadProgress, clearProgress } = useDiagnosisPersistence();

  // Determine if we should include summary step
  // Mode is 'advanced' ONLY if user is logged in AND has 'advanced' setting
  // Using explicit check for 'advanced' to default to 'simple' for everyone else (including guests)
  const isAdvancedMode = profile?.preferences?.diagnosisMode === "advanced";

  // Filter steps based on mode
  const activeStepsConfig = useMemo(() => {
    if (isAdvancedMode) {
      return STEPS_CONFIG;
    }
    return STEPS_CONFIG.filter((s) => s.id !== "summary"); // Hide summary for Simple Mode / Guests
  }, [isAdvancedMode]);

  // Local State
  const [step, setStep] = useState<DiagnosisStep>("basic_info");
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [data, setData] = useState<DiagnosisWizardData>({
    basic_info: null,
    wen_inquiry: null,
    wang_tongue: null,
    wang_face: null,
    wang_part: null,
    wen_audio: null,
    wen_chat: [],
    qie: null,
    smart_connect: null,
  });

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<{
    type: AnalysisType;
    image: string;
  } | null>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<AnalysisType>("tongue");

  // Submit State
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<string | null>(null);

  // Persistence Check State
  const [hasCheckedPersistence, setHasCheckedPersistence] = useState(false);
  // Pending resume state - stored here for dialog to use
  const [pendingResumeState, setPendingResumeState] = useState<PendingResumeState | null>(null);

  // 1. Load Persistence on Mount
  useEffect(() => {
    if (hasCheckedPersistence) return;

    const savedState = loadProgress();
    if (savedState && savedState.step !== "basic_info") {
      // Don't auto-apply - store for dialog
      setPendingResumeState({
        step: savedState.step,
        data: savedState.data,
        timestamp: savedState.timestamp,
      });
    }
    setHasCheckedPersistence(true);
  }, [loadProgress, hasCheckedPersistence]);

  // 2. Seed Data from Profile (runs when profile loads, if no saved state found/resumed)
  useEffect(() => {
    if (hasCheckedPersistence && profile && !data.basic_info && !pendingResumeState) {
      setData((prev) => ({
        ...prev,
        basic_info: {
          name: profile.full_name || undefined,
          age: profile.age || undefined,
          gender: profile.gender ? profile.gender.toLowerCase() : undefined,
          height: profile.height || undefined,
          weight: profile.weight || undefined,
        },
      }));
    }
  }, [hasCheckedPersistence, profile, data.basic_info, pendingResumeState]);

  // Handler to resume saved progress (called from dialog)
  const handleResumeProgress = useCallback(() => {
    if (!pendingResumeState) return;

    let targetStep = pendingResumeState.step;

    // Redirect if trying to access Summary in Simple Mode (e.g. Guest resumed session)
    if (
      !isAdvancedMode &&
      (targetStep === "summary" || targetStep === "processing" || targetStep === "report")
    ) {
      targetStep = "smart_connect";
    } else if (targetStep === "processing" || targetStep === "report") {
      targetStep = "summary"; // Advanced mode resumes at summary if near end
    }

    setData(pendingResumeState.data);
    setStep(targetStep as DiagnosisStep);

    // Restore max step
    let restoredStepId = targetStep;
    if (targetStep === "wang_part") restoredStepId = "wang_face";

    const restoredIndex = activeStepsConfig.findIndex((s) => s.id === restoredStepId);
    if (restoredIndex > 0) {
      setMaxStepReached(restoredIndex);
    }

    setPendingResumeState(null);
  }, [pendingResumeState, activeStepsConfig, isAdvancedMode]);

  // Handler to start new (discard saved progress)
  const handleStartNew = useCallback(() => {
    clearProgress();
    setPendingResumeState(null);
    // Seed from profile if available
    if (profile) {
      setData((prev) => ({
        ...prev,
        basic_info: {
          name: profile.full_name || undefined,
          age: profile.age || undefined,
          gender: profile.gender ? profile.gender.toLowerCase() : undefined,
          height: profile.height || undefined,
          weight: profile.weight || undefined,
        },
      }));
    }
  }, [clearProgress, profile]);

  // 2. Save Persistence on Update
  useEffect(() => {
    if (!hasCheckedPersistence) return;
    const hasData = data.basic_info || data.wen_inquiry || data.wang_tongue;
    if (hasData) {
      const timer = setTimeout(() => {
        saveProgress(step, data);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, step, saveProgress, hasCheckedPersistence]);

  // 3. Progress Tracking
  useEffect(() => {
    if (step === "basic_info") return; // Handled by form

    const stepProgress: Record<DiagnosisStep, number> = {
      basic_info: 0,
      wen_inquiry: 15,
      wang_tongue: 29,
      wang_face: 43,
      wang_part: 50,
      wen_audio: 57,
      qie: 71,
      smart_connect: 85,
      summary: 95,
      processing: 98,
      report: 100,
    };
    setGlobalProgress(stepProgress[step] ?? 0);

    // Update Max Step Reached for Stepper UI
    let currentStepperId = step;
    if (step === "wang_part") currentStepperId = "wang_face";
    else if (step === "processing" || step === "report") currentStepperId = "smart_connect";

    const currentIndex = activeStepsConfig.findIndex((s) => s.id === currentStepperId);
    if (currentIndex > maxStepReached) {
      setMaxStepReached(currentIndex);
    }
  }, [step, setGlobalProgress]);

  // 4. Submit Consultation Logic
  const submitConsultation = useCallback(async () => {
    logger.info("useDiagnosisWizard", "Submitting consultation...");
    setIsLoading(true);
    setError(null);
    setCompletion("");

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Analyze this patient data and provide TCM diagnosis",
          data: data,
          model: getModel(),
          language: language,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      // Stream Reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }
      setCompletion(fullText);

      // Auto-Save Logic
      try {
        let cleanJson = fullText.replace(/```json\n?|\n?```/g, "").trim();
        let resultData;
        try {
          resultData = JSON.parse(cleanJson);
        } catch {
          const repairedJson = repairJSON(cleanJson);
          resultData = JSON.parse(repairedJson);
        }

        const reportWithProfile = {
          ...resultData,
          patient_profile: {
            name: data.basic_info?.name || "Anonymous",
            age: data.basic_info?.age,
            gender: data.basic_info?.gender,
            height: data.basic_info?.height,
            weight: data.basic_info?.weight,
          },
          input_data: {
            medicines:
              data.wen_inquiry?.medicineFiles?.map((f: any) => f.extractedText).filter(Boolean) ||
              [],
          },
        };

        // Save to legacy inquiries table (for backward compatibility) - only for authenticated users
        if (user) {
          await supabase.from("inquiries").insert({
            user_id: user.id,
            symptoms: data.basic_info?.symptoms || "Not provided",
            diagnosis_report: reportWithProfile,
            created_at: new Date().toISOString(),
          });
        }

        // Save to diagnosis_sessions table (Health Passport) - supports both authenticated and guest users
        const { saveDiagnosis } = await import("@/lib/actions");
        const { generateGuestSessionToken, saveGuestSessionToken } =
          await import("@/lib/guestSession");

        // Extract primary diagnosis string from object or use as-is if string
        let primaryDiagnosis = "Diagnosis pending";
        if (typeof resultData.diagnosis === "string") {
          primaryDiagnosis = resultData.diagnosis;
        } else if (resultData.diagnosis?.primary_pattern) {
          primaryDiagnosis = resultData.diagnosis.primary_pattern;
        } else if (resultData.diagnosis?.pattern) {
          primaryDiagnosis = resultData.diagnosis.pattern;
        }

        // Extract constitution string from object or use as-is if string
        let constitutionValue = undefined;
        if (typeof resultData.constitution === "string") {
          constitutionValue = resultData.constitution;
        } else if (resultData.constitution?.type) {
          constitutionValue = resultData.constitution.type;
        }

        // Extract symptoms from basic_info
        // Build symptoms array from mainComplaint and otherSymptoms
        const symptomsArray: string[] = [];
        if (data.basic_info?.mainComplaint?.trim()) {
          symptomsArray.push(data.basic_info.mainComplaint.trim());
        }
        if (data.basic_info?.otherSymptoms?.trim()) {
          // Split otherSymptoms by comma and add each one
          const otherSymptoms = data.basic_info.otherSymptoms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          symptomsArray.push(...otherSymptoms);
        }
        const symptoms = symptomsArray.length > 0 ? symptomsArray : undefined;

        // Extract medicines from medicineFiles
        const medicines =
          data.wen_inquiry?.medicineFiles?.map((f: any) => f.extractedText).filter(Boolean) ||
          undefined;

        // Phase 1: Collect all input data
        const inputData = {
          // Inquiry data
          inquiry_summary: data.wen_inquiry?.inquiryText || data.wen_inquiry?.summary,
          inquiry_chat_history: data.wen_inquiry?.chatHistory || data.wen_chat || [],
          inquiry_report_files:
            data.wen_inquiry?.reportFiles
              ?.map((f: any) => ({
                name: f.name || "Unknown",
                url: f.url || f.publicUrl || "",
                type: f.type || "application/octet-stream",
                size: f.size,
                extracted_text: f.extractedText,
              }))
              .filter((f: any) => f.url) || [],
          inquiry_medicine_files:
            data.wen_inquiry?.medicineFiles
              ?.map((f: any) => ({
                name: f.name || "Unknown",
                url: f.url || f.publicUrl || "",
                type: f.type || "application/octet-stream",
                size: f.size,
                extracted_text: f.extractedText,
              }))
              .filter((f: any) => f.url) || [],

          // Visual analysis
          tongue_analysis: data.wang_tongue
            ? {
                image_url: data.wang_tongue.image,
                observation: data.wang_tongue.observation,
                analysis_tags: data.wang_tongue.analysis_tags,
                tcm_indicators: data.wang_tongue.tcm_indicators,
                pattern_suggestions: data.wang_tongue.pattern_suggestions,
                potential_issues: data.wang_tongue.potential_issues,
              }
            : undefined,

          face_analysis: data.wang_face
            ? {
                image_url: data.wang_face.image,
                observation: data.wang_face.observation,
                analysis_tags: data.wang_face.analysis_tags,
                tcm_indicators: data.wang_face.tcm_indicators,
                potential_issues: data.wang_face.potential_issues,
              }
            : undefined,

          body_analysis: data.wang_part
            ? {
                image_url: data.wang_part.image,
                observation: data.wang_part.observation,
                analysis_tags: data.wang_part.analysis_tags,
                potential_issues: data.wang_part.potential_issues,
              }
            : undefined,

          // Audio analysis
          audio_analysis: data.wen_audio
            ? {
                audio_url: data.wen_audio.audio,
                observation: data.wen_audio.observation,
                potential_issues: data.wen_audio.potential_issues,
              }
            : undefined,

          // Pulse data
          pulse_data: data.qie
            ? {
                bpm: data.qie.bpm,
                quality: data.qie.quality,
                rhythm: data.qie.rhythm,
                strength: data.qie.strength,
                notes: data.qie.notes,
              }
            : undefined,
        };

        // Determine if this is a guest session
        const isGuest = !user;
        let guestSessionToken: string | undefined = undefined;

        if (isGuest) {
          // Generate and save guest session token
          guestSessionToken = generateGuestSessionToken();
          saveGuestSessionToken(guestSessionToken);
        }

        const saveResult = await saveDiagnosis({
          primary_diagnosis: primaryDiagnosis,
          constitution: constitutionValue,
          overall_score: calculateOverallScore(resultData),
          full_report: reportWithProfile,
          symptoms: symptoms,
          medicines: medicines,
          // Phase 1: Add all input data
          ...inputData,
          // Guest session fields
          is_guest_session: isGuest,
          guest_email: isGuest ? data.basic_info?.email : undefined,
          guest_name: isGuest ? data.basic_info?.name : undefined,
        });

        if (saveResult.success) {
          if (isGuest) {
            logger.info("useDiagnosisWizard", "Saved guest session", saveResult.data?.id);
          } else {
            logger.info("useDiagnosisWizard", "Saved to Health Passport", saveResult.data?.id);
          }
        } else {
          logger.error("useDiagnosisWizard", "Failed to save diagnosis", saveResult.error);
        }

        setIsSaved(true);
      } catch (e) {
        logger.error("useDiagnosisWizard", "Failed to auto-save", e);
      }
    } catch (err: unknown) {
      logger.error("useDiagnosisWizard", "Error during consultation submission", err);
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [data, getModel, language, user]);

  // 5. Navigation Logic
  const nextStep = useCallback(
    (current: DiagnosisStep, skipCelebration: boolean = false) => {
      // Animation trigger
      if (!skipCelebration) {
        const stepToCelebration: Record<DiagnosisStep, string | null> = {
          basic_info: "basics",
          wen_inquiry: "inquiry",
          wang_tongue: "tongue",
          wang_face: "face", // Part merged
          wang_part: "face",
          wen_audio: "audio",
          qie: "pulse",
          smart_connect: "smartConnect",
          summary: null,
          processing: null,
          report: null,
        };
        // Logic to set celebration could go here if keeping animation
      }

      const diagnosisMode = profile?.preferences?.diagnosisMode || "simple";

      // State Machine
      switch (current) {
        case "basic_info":
          setStep("wen_inquiry");
          break;
        case "wen_inquiry":
          setStep("wang_tongue");
          break;
        case "wang_tongue":
          setStep("wang_face");
          break;
        case "wang_face":
          setStep("wang_part");
          break;
        case "wang_part":
          setStep("wen_audio");
          break; // Correct flow
        case "wen_audio":
          if (diagnosisMode === "simple") {
            setStep("smart_connect"); // Skip Pulse in Simple Mode
          } else {
            setStep("qie");
          }
          break;
        case "qie":
          setStep("smart_connect");
          break;
        case "smart_connect":
          if (diagnosisMode === "simple") {
            setStep("processing"); // Skip Summary in Simple Mode
            submitConsultation();
          } else {
            setStep("summary");
          }
          break;
        case "summary":
          setStep("processing");
          submitConsultation();
          break;
        default:
          break;
      }
    },
    [submitConsultation, profile]
  );

  const prevStep = useCallback(
    (current: DiagnosisStep) => {
      const diagnosisMode = profile?.preferences?.diagnosisMode || "simple";

      switch (current) {
        case "wen_inquiry":
          setStep("basic_info");
          break;
        case "wang_tongue":
          setStep("wen_inquiry");
          break;
        case "wang_face":
          setStep("wang_tongue");
          break;
        case "wang_part":
          setStep("wang_face");
          break;
        case "wen_audio":
          setStep("wang_part");
          break; // Back to parts from audio
        case "qie":
          setStep("wen_audio");
          break;
        case "smart_connect":
          if (diagnosisMode === "simple") {
            setStep("wen_audio"); // Back to Audio, skipping Qie
          } else {
            setStep("qie");
          }
          break;
        case "summary":
          setStep("smart_connect");
          break;
        default:
          break;
      }
    },
    [profile]
  );

  // 6. Navigation Sync Effect
  useEffect(() => {
    const customNavSteps = [
      "basic_info",
      "wen_inquiry",
      "qie",
      "wang_tongue",
      "wang_face",
      "wang_part",
      "wen_audio",
    ];
    if (customNavSteps.includes(step)) return;

    const showBack = step !== "report";
    const showNext = step !== "processing" && step !== "report";

    setNavigationState({
      onNext: () => nextStep(step),
      onBack: () => prevStep(step),
      onSkip: undefined,
      showNext,
      showBack,
      showSkip: false,
    });
  }, [step, setNavigationState, nextStep, prevStep]);

  // 7. Image Analysis Logic
  const analyzeImage = async (image: string, type: AnalysisType) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCurrentAnalysisType(type);
    setPendingAnalysis({ type, image });
    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          type,
          symptoms: data.basic_info?.symptoms || data.basic_info?.otherSymptoms,
          mainComplaint: data.basic_info?.mainComplaint,
        }),
      });
      const result = await response.json();

      const dataKey =
        type === "tongue" ? "wang_tongue" : type === "face" ? "wang_face" : "wang_part";
      setData((prev) => ({
        ...prev,
        [dataKey]: {
          ...prev[dataKey],
          observation: result.observation,
          potential_issues: result.potential_issues || [],
        },
      }));

      if (!result.observation) {
        setAnalysisResult({
          observation: "Analysis pending.",
          potential_issues: [],
        });
      } else {
        setAnalysisResult(result);
      }
    } catch (error) {
      logger.error("useDiagnosisWizard", "Image analysis failed", error);
      setAnalysisResult({
        observation: "Analysis failed, will be reviewed in final report.",
        potential_issues: [],
      });
    } finally {
      setIsAnalyzing(false);
      setPendingAnalysis(null);
    }
  };

  const handleSkipAnalysis = (currentStep: AnalysisType) => {
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setPendingAnalysis(null);
    const dataKey =
      currentStep === "tongue" ? "wang_tongue" : currentStep === "face" ? "wang_face" : "wang_part";
    setData((prev) => ({
      ...prev,
      [dataKey]: {
        ...prev[dataKey],
        observation: "Analysis skipped",
        skipped: true,
      },
    }));
    // Map analysis type back to DiagnosisStep for navigation
    const stepMap: Record<AnalysisType, DiagnosisStep> = {
      tongue: "wang_tongue",
      face: "wang_face",
      part: "wang_part",
    };
    nextStep(stepMap[currentStep]);
  };

  // Return Interface
  return {
    // State
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

    // Resume Progress State & Actions
    pendingResumeState,
    handleResumeProgress,
    handleStartNew,

    // Actions
    nextStep,
    prevStep,
    analyzeImage,
    handleSkipAnalysis,
    submitConsultation,

    // Helpers
    STEPS: activeStepsConfig.map((s) => ({
      id: s.id,
      label: (t.steps as Record<string, string>)[s.labelKey],
    })),
    language,
    t,
  };
}
