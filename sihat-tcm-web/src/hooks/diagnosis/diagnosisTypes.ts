/**
 * Diagnosis Wizard Type Definitions
 * 
 * Type definitions specific to the diagnosis wizard hook
 */

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


