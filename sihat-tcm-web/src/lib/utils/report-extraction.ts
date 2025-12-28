/**
 * Report Data Extraction Utilities
 * 
 * Helper functions for extracting structured data from diagnosis reports.
 * These utilities handle various report formats and extract common fields.
 */

import type { DiagnosisReport } from "@/types/database";

/**
 * Extract symptoms from diagnosis report
 * 
 * Looks for symptoms in:
 * - analysis.key_findings.from_inquiry (text parsing)
 * - input_data.symptoms (structured)
 * 
 * @param report - Diagnosis report
 * @returns Array of symptom strings, or null if none found
 */
export function extractSymptomsFromReport(report: DiagnosisReport): string[] | null {
  const symptoms: string[] = [];

  // First, check structured input_data
  if (report.input_data?.symptoms && Array.isArray(report.input_data.symptoms)) {
    return report.input_data.symptoms;
  }

  // Extract from analysis key_findings - parse common symptom keywords
  if (report.analysis?.key_findings?.from_inquiry) {
    const inquiryText = report.analysis.key_findings.from_inquiry.toLowerCase();

    // Common symptom keywords to look for
    const symptomKeywords: Record<string, string> = {
      headache: "Headache",
      fatigue: "Fatigue",
      dizziness: "Dizziness",
      nausea: "Nausea",
      insomnia: "Insomnia",
      "night sweats": "Night sweats",
      "dry mouth": "Dry mouth",
      "chest tightness": "Chest tightness",
      bloating: "Bloating",
      palpitations: "Palpitations",
      "shortness of breath": "Shortness of breath",
      "back pain": "Back pain",
      "joint pain": "Joint pain",
      "cold extremities": "Cold extremities",
      "hot flashes": "Hot flashes",
    };

    // Check for each symptom keyword
    for (const [keyword, symptom] of Object.entries(symptomKeywords)) {
      if (inquiryText.includes(keyword) && !symptoms.includes(symptom)) {
        symptoms.push(symptom);
      }
    }
  }

  return symptoms.length > 0 ? symptoms : null;
}

/**
 * Extract medicines from diagnosis report
 * 
 * Looks for medicines in:
 * - input_data.medicines (most reliable)
 * - recommendations.herbal_formulas
 * 
 * @param report - Diagnosis report
 * @returns Array of medicine names, or null if none found
 */
export function extractMedicinesFromReport(report: DiagnosisReport): string[] | null {
  // Check input_data first (most reliable)
  if (report.input_data?.medicines && report.input_data.medicines.length > 0) {
    return report.input_data.medicines;
  }

  // Extract from herbal_formulas in recommendations
  const medicines: string[] = [];
  if (report.recommendations?.herbal_formulas) {
    report.recommendations.herbal_formulas.forEach((formula) => {
      if (formula.name) {
        medicines.push(formula.name);
      }
    });
  }

  return medicines.length > 0 ? medicines : null;
}

/**
 * Extract vital signs from diagnosis report
 * 
 * Checks multiple locations:
 * - patient_summary.vital_signs (preferred)
 * - input_data (pulse, temperature, blood_pressure, respiratory_rate)
 * 
 * @param report - Diagnosis report
 * @returns Vital signs object, or null if none found
 */
export function extractVitalSignsFromReport(
  report: DiagnosisReport
): VitalSigns | null {
  // First check patient_summary (most reliable)
  if (report.patient_summary?.vital_signs) {
    return report.patient_summary.vital_signs;
  }

  // Fallback to input_data
  const vitalSigns: {
    pulse?: number;
    temperature?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    respiratoryRate?: number;
  } = {};

  if (report.input_data?.pulse) {
    vitalSigns.pulse = typeof report.input_data.pulse === "number" 
      ? report.input_data.pulse 
      : parseFloat(String(report.input_data.pulse));
  }

  if (report.input_data?.temperature) {
    vitalSigns.temperature = typeof report.input_data.temperature === "number"
      ? report.input_data.temperature
      : parseFloat(String(report.input_data.temperature));
  }

  if (report.input_data?.blood_pressure) {
    const bp = report.input_data.blood_pressure;
    if (typeof bp === "object" && bp !== null) {
      vitalSigns.bloodPressure = {
        systolic: typeof bp.systolic === "number" ? bp.systolic : parseFloat(String(bp.systolic || 0)),
        diastolic: typeof bp.diastolic === "number" ? bp.diastolic : parseFloat(String(bp.diastolic || 0)),
      };
    }
  }

  if (report.input_data?.respiratory_rate) {
    vitalSigns.respiratoryRate = typeof report.input_data.respiratory_rate === "number"
      ? report.input_data.respiratory_rate
      : parseFloat(String(report.input_data.respiratory_rate));
  }

  return Object.keys(vitalSigns).length > 0 ? vitalSigns : null;
}

/**
 * Extract treatment plan summary from diagnosis report
 * 
 * Combines dietary, lifestyle, and herbal recommendations into a summary string.
 * 
 * @param report - Diagnosis report
 * @returns Treatment plan summary string, or null if none found
 */
export function extractTreatmentPlanFromReport(report: DiagnosisReport): string | null {
  const planParts: string[] = [];

  if (report.recommendations) {
    const rec = report.recommendations;

    // Dietary recommendations
    if (rec.food_therapy?.beneficial && rec.food_therapy.beneficial.length > 0) {
      planParts.push(`Diet: ${rec.food_therapy.beneficial.slice(0, 3).join(", ")}`);
    } else if (rec.food && rec.food.length > 0) {
      planParts.push(`Diet: ${rec.food.slice(0, 3).join(", ")}`);
    }

    // Lifestyle recommendations
    if (rec.lifestyle && rec.lifestyle.length > 0) {
      planParts.push(`Lifestyle: ${rec.lifestyle.slice(0, 2).join(", ")}`);
    }

    // Herbal formulas
    if (rec.herbal_formulas && rec.herbal_formulas.length > 0) {
      const formulaNames = rec.herbal_formulas.map((f) => f.name).join(", ");
      planParts.push(`Herbs: ${formulaNames}`);
    }
  }

  return planParts.length > 0 ? planParts.join(" | ") : null;
}

/**
 * Extract diagnosis pattern from report
 * 
 * @param report - Diagnosis report
 * @returns Primary diagnosis pattern, or null
 */
export function extractDiagnosisPattern(report: DiagnosisReport): string | null {
  if (report.diagnosis?.primary_pattern) {
    return typeof report.diagnosis.primary_pattern === "string"
      ? report.diagnosis.primary_pattern
      : String(report.diagnosis.primary_pattern);
  }

  if (report.analysis?.summary) {
    // Try to extract pattern from summary text
    const summary = String(report.analysis.summary);
    const patternMatch = summary.match(/(?:pattern|syndrome|deficiency|excess):\s*([^,.\n]+)/i);
    if (patternMatch) {
      return patternMatch[1].trim();
    }
  }

  return null;
}

