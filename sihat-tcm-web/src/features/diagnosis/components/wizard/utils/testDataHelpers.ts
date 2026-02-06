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
    wen_audio: mockData.wen_audio as never,
    wen_chat: mockData.wen_inquiry.chatHistory?.map(
      (msg: { role: string; content: string }, idx: number) => ({
        id: `mock-${idx}`,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })
    ) || [],
    qie: mockData.qie,
    smart_connect: mockData.smart_connect,
  };
}

/**
 * Clears all diagnosis data
 */
export function clearTestData(): Partial<DiagnosisWizardData> {
  return {
    basic_info: null,
    wen_inquiry: null,
    wang_tongue: null,
    wang_face: null,
    wang_part: null,
    wen_audio: null,
    wen_chat: [],
    qie: null,
    smart_connect: null,
  };
}
