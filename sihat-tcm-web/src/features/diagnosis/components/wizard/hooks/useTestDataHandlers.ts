/**
 * Hook for managing test data fill/clear event handlers
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 */

import { useEffect } from "react";
import { generateMockTestData } from "@/data/mockTestData";
import type { DiagnosisWizardData } from "@/types/diagnosis";
import type { DiagnosisStep } from "@/hooks/useDiagnosisWizard";

interface UseTestDataHandlersOptions {
  setData: (fn: (prev: DiagnosisWizardData) => DiagnosisWizardData) => void;
  setStep: (step: DiagnosisStep) => void;
  setAnalysisResult: (result: any) => void;
  setCompletion: (completion: string) => void;
}

/**
 * Hook for handling test data fill and clear events
 */
export function useTestDataHandlers({
  setData,
  setStep,
  setAnalysisResult,
  setCompletion,
}: UseTestDataHandlersOptions) {
  useEffect(() => {
    const handleFillTestData = () => {
      const mockData = generateMockTestData();

      // Fill ALL diagnosis data across all steps
      setData((prev) => ({
        ...prev,
        basic_info: {
          ...mockData.basic_info,
          age: Number(mockData.basic_info.age) || undefined,
          height: Number(mockData.basic_info.height) || undefined,
          weight: Number(mockData.basic_info.weight) || undefined,
        },
        wen_inquiry: mockData.wen_inquiry,
        wang_tongue: mockData.wang_tongue,
        wang_face: mockData.wang_face,
        wang_part: mockData.wang_part,
        wen_audio: mockData.wen_audio,
        wen_chat: mockData.wen_inquiry.chatHistory.map((msg, idx) => ({
          id: `mock-${idx}`,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        qie: mockData.qie,
        smart_connect: {
          connected: true,
          device_type: "wearable",
          data: mockData.smart_connect,
        },
      }));

      console.log("[DiagnosisWizard] Test data filled:", mockData);
    };

    const handleClearTestData = () => {
      // Reset all diagnosis data
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

      // Reset to first step
      setStep("basic_info");
      setAnalysisResult(null);
      setCompletion("");

      console.log("[DiagnosisWizard] Test data cleared");
    };

    window.addEventListener("fill-test-data", handleFillTestData);
    window.addEventListener("clear-test-data", handleClearTestData);

    return () => {
      window.removeEventListener("fill-test-data", handleFillTestData);
      window.removeEventListener("clear-test-data", handleClearTestData);
    };
  }, [setData, setStep, setAnalysisResult, setCompletion]);
}


