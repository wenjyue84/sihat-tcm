/**
 * Utility functions for transforming diagnosis data into summary strings
 * Extracted from DiagnosisSummary.tsx to improve maintainability
 */

import type { DiagnosisWizardData } from "@/types/diagnosis";

export interface SummaryData {
  summaries: Record<string, string>;
}

/**
 * Formats basic info summary from diagnosis data
 */
export function formatBasicInfoSummary(
  basicInfo: DiagnosisWizardData["basic_info"],
  t: any
): string {
  if (!basicInfo) return "";

  let symptomDisplay = "";
  if (basicInfo.mainComplaint) {
    symptomDisplay += `${t.basicInfo.mainConcern}: ${basicInfo.mainComplaint}`;
  }
  if (basicInfo.otherSymptoms) {
    if (symptomDisplay) symptomDisplay += "\n";
    symptomDisplay += `${t.basicInfo.otherSymptoms}: ${basicInfo.otherSymptoms}`;
  }
  if (!symptomDisplay) {
    symptomDisplay = basicInfo.symptoms || t.common.none;
  }

  return `${t.basicInfo.fullName}: ${basicInfo.name}\n${t.basicInfo.age}: ${basicInfo.age}\n${t.basicInfo.gender}: ${basicInfo.gender}\n${t.basicInfo.height}: ${basicInfo.height}cm\n${t.basicInfo.weight}: ${basicInfo.weight}kg\n\n${symptomDisplay}`;
}

/**
 * Formats inquiry summary from diagnosis data
 */
export function formatInquirySummary(
  wenInquiry: DiagnosisWizardData["wen_inquiry"],
  t: any
): string {
  if (!wenInquiry) return "";
  return wenInquiry.summary || t.diagnosisSummary.defaultMessages.inquiryCompleted;
}

/**
 * Formats observation summary (tongue, face, body part)
 */
export function formatObservationSummary(
  observation: string | undefined,
  t: any
): string {
  return observation || t.diagnosisSummary.defaultMessages.noObservation;
}

/**
 * Formats audio summary from diagnosis data
 */
export function formatAudioSummary(
  wenAudio: DiagnosisWizardData["wen_audio"],
  t: any
): string {
  if (!wenAudio) return "";
  return (
    wenAudio.transcription ||
    wenAudio.analysis ||
    t.diagnosisSummary.defaultMessages.audioCompleted
  );
}

/**
 * Formats pulse summary from diagnosis data
 */
export function formatPulseSummary(
  qie: DiagnosisWizardData["qie"],
  t: any
): string {
  if (!qie) return "";
  const qualities =
    qie.pulseQualities?.map((q: any) => q.nameEn).join(", ") || t.common.none;
  return `BPM: ${qie.bpm}\n${t.pulse.tcmPulseQualities}: ${qualities}`;
}

/**
 * Formats smart connect summary from diagnosis data
 */
export function formatSmartConnectSummary(
  smartConnect: DiagnosisWizardData["smart_connect"],
  t: any
): string {
  if (!smartConnect) return "";
  const metrics = [];
  if (smartConnect.pulseRate)
    metrics.push(`${t.pulse.pulseRate}: ${smartConnect.pulseRate} BPM`);
  if (smartConnect.bloodPressure)
    metrics.push(`${t.pulse.bloodPressure}: ${smartConnect.bloodPressure} mmHg`);
  if (smartConnect.bloodOxygen)
    metrics.push(`${t.pulse.bloodOxygen}: ${smartConnect.bloodOxygen}%`);
  if (smartConnect.bodyTemp)
    metrics.push(`${t.pulse.bodyTemperature}: ${smartConnect.bodyTemp}°C`);
  if (smartConnect.hrv) metrics.push(`${t.pulse.hrv}: ${smartConnect.hrv} ms`);
  if (smartConnect.stressLevel)
    metrics.push(`${t.pulse.stressLevel}: ${smartConnect.stressLevel}`);
  return metrics.length > 0
    ? metrics.join("\n")
    : t.diagnosisSummary.defaultMessages.noDeviceData;
}

/**
 * Transforms diagnosis data into summary strings
 */
export function transformDiagnosisDataToSummaries(
  data: DiagnosisWizardData,
  t: any
): Record<string, string> {
  const summaries: Record<string, string> = {};

  // Basic Info
  if (data.basic_info) {
    summaries["basic_info"] = formatBasicInfoSummary(data.basic_info, t);
  }

  // Inquiry
  if (data.wen_inquiry) {
    summaries["wen_inquiry"] = formatInquirySummary(data.wen_inquiry, t);
  }

  // Tongue
  if (data.wang_tongue) {
    summaries["wang_tongue"] = formatObservationSummary(
      data.wang_tongue.observation,
      t
    );
  }

  // Face
  if (data.wang_face) {
    summaries["wang_face"] = formatObservationSummary(
      data.wang_face.observation,
      t
    );
  }

  // Body Part
  if (data.wang_part) {
    summaries["wang_part"] = formatObservationSummary(
      data.wang_part.observation,
      t
    );
  }

  // Audio
  if (data.wen_audio) {
    summaries["wen_audio"] = formatAudioSummary(data.wen_audio, t);
  }

  // Pulse
  if (data.qie) {
    summaries["qie"] = formatPulseSummary(data.qie, t);
  }

  // Smart Connect
  if (data.smart_connect) {
    summaries["smart_connect"] = formatSmartConnectSummary(
      data.smart_connect,
      t
    );
  }

  return summaries;
}

