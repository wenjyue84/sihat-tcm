/**
 * Diagnosis Wizard Constants
 * 
 * Constants and configuration for the diagnosis wizard flow
 */

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

export const STEP_PROGRESS: Record<string, number> = {
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

