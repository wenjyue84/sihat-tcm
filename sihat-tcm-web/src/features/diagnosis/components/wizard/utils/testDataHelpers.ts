/**
 * Test Data Helpers
 * Utilities for filling and clearing test data in DiagnosisWizard
 * Extracted from DiagnosisWizard.tsx to improve maintainability
 */

import type { DiagnosisWizardData } from "@/types/diagnosis";
import { generateMockTestData } from "@/data/mockTestData";

/**
 * Generates mock test data for all diagnosis steps
 */
export function generateTestData(): DiagnosisWizardData {
  const mockData = generateMockTestData();

  return {
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
    wen_chat: {
      chat: mockData.wen_inquiry.chatHistory.map((msg, idx) => ({
        id: `mock-${idx}`,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date().toISOString(),
      })),
    },
    qie: mockData.qie,
    smart_connect: mockData.smart_connect,
  };
}

/**
 * Clears all diagnosis data
 */
export function clearTestData(): Partial<DiagnosisWizardData> {
  return {
    basic_info: {
      name: "anonymous",
      age: "",
      gender: "",
      weight: "",
      height: "",
      mainComplaint: "",
      otherSymptoms: "",
      symptoms: "",
      symptomDuration: "",
    },
    wen_inquiry: undefined,
    wang_tongue: undefined,
    wang_face: undefined,
    wang_part: undefined,
    wen_audio: undefined,
    wen_chat: undefined,
    qie: undefined,
    smart_connect: undefined,
  };
}



