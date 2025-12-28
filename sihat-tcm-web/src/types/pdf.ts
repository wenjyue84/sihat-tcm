/**
 * PDF Generation Types
 * 
 * Type definitions for PDF generation utilities
 */

import type { DiagnosisReport } from "./database";
import type { BasicInfo } from "./diagnosis";

/**
 * Patient information for PDF generation
 */
export interface PDFPatientInfo {
  name?: string;
  age?: number | string;
  gender?: string;
  height?: number;
  weight?: number;
  contact?: string;
  address?: string;
  emergencyContact?: string;
}

/**
 * PDF report options
 */
export interface PDFReportOptions {
  includePatientName?: boolean;
  includePatientAge?: boolean;
  includePatientGender?: boolean;
  includePatientContact?: boolean;
  includePatientAddress?: boolean;
  includeEmergencyContact?: boolean;
  includeBMI?: boolean;
  includeDetailedAnalysis?: boolean;
  includeDietaryRecommendations?: boolean;
  includeLifestyleRecommendations?: boolean;
  includeHerbalFormulas?: boolean;
  includeAcupoints?: boolean;
  includePrecautions?: boolean;
  includeFollowUp?: boolean;
}

/**
 * PDF generation data structure
 */
export interface PDFGenerationData {
  diagnosis?: DiagnosisReport["diagnosis"];
  constitution?: DiagnosisReport["constitution"];
  analysis?: DiagnosisReport["analysis"];
  recommendations?: DiagnosisReport["recommendations"];
  precautions?: DiagnosisReport["precautions"];
  follow_up?: DiagnosisReport["follow_up"];
}

