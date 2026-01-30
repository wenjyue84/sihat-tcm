/**
 * Processing Step Component
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 */

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisLoadingScreen } from "../../AnalysisLoadingScreen";
import { DiagnosisReport } from "../../DiagnosisReport";
import { repairJSON } from "@/features/diagnosis/hooks/diagnosisUtils";
import type { DiagnosisWizardData } from "@/types/diagnosis";
import type { DiagnosisStep } from "@/features/diagnosis/hooks/diagnosisTypes";

interface ProcessingStepProps {
  isLoading: boolean;
  error: string | null;
  completion: number;
  data: Record<string, unknown>;
  isSaved: boolean;
  setData: (fn: (prev: DiagnosisWizardData) => DiagnosisWizardData) => void;
  setStep: (step: DiagnosisStep) => void;
  setIsSaved: (saved: boolean) => void;
  submitConsultation: () => void;
  t: Record<string, unknown>;
}

export function ProcessingStep({
  isLoading,
  error,
  completion,
  data,
  isSaved,
  setData,
  setStep,
  setIsSaved,
  submitConsultation,
  t,
}: ProcessingStepProps) {
  const errors = t.errors as Record<string, string>;
  const common = t.common as Record<string, string>;

  // Auto-trigger submission if we land here without state (e.g. refresh or resume)
  // Only trigger if we have basic info (ensure data is loaded)
  useEffect(() => {
    if (!isLoading && !error && completion === 0 && data.basic_info) {
      submitConsultation();
    }
  }, [isLoading, error, completion, data.basic_info, submitConsultation]);

  if (isLoading || (!error && completion < 100)) {
    return <AnalysisLoadingScreen basicInfo={data.basic_info as any} />;
  }

  if (error) {
    return (
      <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100">
          <h3 className="font-bold text-lg mb-2">{errors.apiError}</h3>
          <p className="mb-2">{errors.connectionFailed}</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setStep("processing");
              submitConsultation();
            }}
            className="mr-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {common.retry}
          </Button>
          <Button
            onClick={() => setStep("basic_info")}
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
          >
            {common.reset}
          </Button>
        </div>
      </Card>
    );
  }

  // Parse and render report
  try {
    const reportJson = data.diagnosis_report as string;
    if (!reportJson) {
      throw new Error("No report data available");
    }
    let cleanJson = reportJson.replace(/```json\n?|\n?```/g, "").trim();
    let resultData;
    try {
      resultData = JSON.parse(cleanJson);
    } catch {
      // Try to repair malformed JSON
      const repaired = repairJSON(cleanJson);
      resultData = JSON.parse(repaired);
    }

    return (
      <DiagnosisReport
        data={resultData}
        patientInfo={data.basic_info as any}
        reportOptions={data.report_options as any}
        smartConnectData={data.smart_connect as any}
        onRestart={() => {
          setData(() => ({
            basic_info: null,
            wen_inquiry: null,
            wang_tongue: null,
            wang_face: null,
            wang_part: null,
            wen_audio: null,
            wen_chat: [],
            qie: null,
            smart_connect: null,
          }));
          setStep("basic_info");
          setIsSaved(false);
        }}
        saved={isSaved}
      />
    );
  } catch (parseError) {
    return (
      <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100">
          <h3 className="font-bold text-lg mb-2">{errors.parseError || "Parse Error"}</h3>
          <p className="mb-2">{errors.invalidResponse || "Invalid response format"}</p>
          <p className="text-sm text-yellow-600 mb-4">{String(parseError)}</p>
          <Button
            onClick={() => {
              setStep("processing");
              submitConsultation();
            }}
            className="mr-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {common.retry}
          </Button>
        </div>
      </Card>
    );
  }
}

