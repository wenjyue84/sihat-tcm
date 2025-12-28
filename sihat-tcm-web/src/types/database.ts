/**
 * Database Model Types
 *
 * Type definitions for database tables and JSONB fields
 * Used throughout the application for type safety
 */

// ============================================================================
// Diagnosis Sessions (diagnosis_sessions table)
// ============================================================================

export interface VitalSigns {
  bmi?: number | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  temperature?: number | null;
}

export interface PatientSummary {
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  vital_signs?: VitalSigns;
}

export interface DiagnosisPattern {
  primary_pattern: string;
  secondary_patterns?: string[];
  affected_organs?: string[];
  pathomechanism?: string;
}

export interface Constitution {
  type: string;
  description?: string;
}

export interface KeyFindings {
  from_inquiry?: string;
  from_visual?: string;
  from_pulse?: string;
}

export interface Analysis {
  summary: string;
  key_findings?: KeyFindings;
  five_elements?: FiveElementsAnalysis;
}

export interface FoodTherapy {
  beneficial?: string[];
  recipes?: string[];
  avoid?: string[];
}

export interface FiveElementsAnalysis {
  scores: {
    liver: number;
    heart: number;
    spleen: number;
    lung: number;
    kidney: number;
  };
  justifications: {
    liver: string;
    heart: string;
    spleen: string;
    lung: string;
    kidney: string;
  };
}

export interface HerbalFormula {
  name: string;
  ingredients?: string[];
  dosage?: string;
  purpose?: string;
}

export interface Recommendations {
  food_therapy?: FoodTherapy;
  food?: string[];
  avoid?: string[];
  lifestyle?: string[];
  acupoints?: string[];
  exercise?: string[];
  sleep_guidance?: string;
  emotional_care?: string;
  herbal_formulas?: HerbalFormula[];
  doctor_consultation?: string;
  general?: string[];
}

export interface Precautions {
  warning_signs?: string[];
  contraindications?: string[];
  special_notes?: string;
}

export interface FollowUp {
  timeline?: string;
  expected_improvement?: string;
  next_steps?: string;
}

export interface PatientProfile {
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
}

/**
 * Full diagnosis report structure (stored in full_report JSONB column)
 * This matches the structure returned by /api/consult
 */
export interface DiagnosisReport {
  patient_summary?: PatientSummary;
  diagnosis: DiagnosisPattern | string;
  constitution: Constitution | string;
  analysis: Analysis;
  recommendations: Recommendations;
  precautions?: Precautions;
  follow_up?: FollowUp;
  disclaimer?: string;
  timestamp?: string;
  patient_profile?: PatientProfile;
  input_data?: {
    medicines?: string[];
  };
}

// ============================================================================
// Input Data Types (Phase 1: Diagnosis Data Recording)
// ============================================================================

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface FileMetadata {
  name: string;
  url: string;
  type: string;
  size?: number;
  extracted_text?: string;
}

export interface TongueAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  tcm_indicators?: string[];
  pattern_suggestions?: string[];
  potential_issues?: string[];
}

export interface FaceAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  tcm_indicators?: string[];
  potential_issues?: string[];
}

export interface BodyAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  potential_issues?: string[];
}

export interface AudioAnalysisData {
  audio_url?: string;
  observation?: string;
  potential_issues?: string[];
}

export interface PulseData {
  bpm?: number;
  quality?: string;
  rhythm?: string;
  strength?: string;
  notes?: string;
}

/**
 * Database row type for diagnosis_sessions table
 */
export interface DiagnosisSession {
  id: string;
  user_id?: string | null;
  patient_id?: string | null;
  primary_diagnosis: string;
  constitution?: string | null;
  overall_score?: number | null;
  full_report: DiagnosisReport;
  notes?: string | null;
  // Doctor record fields
  symptoms?: string[] | null;
  medicines?: string[] | null;
  vital_signs?: VitalSigns | null;
  clinical_notes?: string | null;
  treatment_plan?: string | null;
  follow_up_date?: string | null;
  // Family care link
  family_member_id?: string | null;
  // Phase 1: Input data fields
  inquiry_summary?: string | null;
  inquiry_chat_history?: ChatMessage[] | null;
  inquiry_report_files?: FileMetadata[] | null;
  inquiry_medicine_files?: FileMetadata[] | null;
  tongue_analysis?: TongueAnalysisData | null;
  face_analysis?: FaceAnalysisData | null;
  body_analysis?: BodyAnalysisData | null;
  audio_analysis?: AudioAnalysisData | null;
  pulse_data?: PulseData | null;
  // Guest session fields
  is_guest_session?: boolean | null;
  guest_email?: string | null;
  guest_name?: string | null;
  is_hidden?: boolean | null;
  flag?: PatientFlag | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for saving a diagnosis session
 */
export interface SaveDiagnosisInput {
  primary_diagnosis: string;
  constitution?: string;
  overall_score?: number;
  full_report: DiagnosisReport;
  notes?: string;
  // Doctor record fields
  symptoms?: string[];
  medicines?: string[];
  vital_signs?: VitalSigns;
  clinical_notes?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  // Phase 1: Input data fields
  inquiry_summary?: string;
  inquiry_chat_history?: ChatMessage[];
  inquiry_report_files?: FileMetadata[];
  inquiry_medicine_files?: FileMetadata[];
  tongue_analysis?: TongueAnalysisData;
  face_analysis?: FaceAnalysisData;
  body_analysis?: BodyAnalysisData;
  audio_analysis?: AudioAnalysisData;
  pulse_data?: PulseData;
  // Guest session fields
  is_guest_session?: boolean;
  guest_email?: string;
  guest_name?: string;
  // Link to specific patient record
  patient_id?: string;
  user_id?: string;
}

// ============================================================================
// Guest Diagnosis Sessions (guest_diagnosis_sessions table)
// ============================================================================

export interface GuestDiagnosisSession {
  id: string;
  session_token: string;
  guest_email?: string | null;
  guest_name?: string | null;
  primary_diagnosis: string;
  constitution?: string | null;
  overall_score?: number | null;
  full_report: DiagnosisReport;
  notes?: string | null;
  symptoms?: string[] | null;
  medicines?: string[] | null;
  vital_signs?: VitalSigns | null;
  clinical_notes?: string | null;
  treatment_plan?: string | null;
  follow_up_date?: string | null;
  inquiry_summary?: string | null;
  inquiry_chat_history?: ChatMessage[] | null;
  inquiry_report_files?: FileMetadata[] | null;
  inquiry_medicine_files?: FileMetadata[] | null;
  tongue_analysis?: TongueAnalysisData | null;
  face_analysis?: FaceAnalysisData | null;
  body_analysis?: BodyAnalysisData | null;
  audio_analysis?: AudioAnalysisData | null;
  pulse_data?: PulseData | null;
  created_at: string;
  updated_at: string;
  migrated_to_user_id?: string | null;
  migrated_at?: string | null;
}

export interface SaveGuestDiagnosisInput {
  session_token: string;
  guest_email?: string;
  guest_name?: string;
  primary_diagnosis: string;
  constitution?: string;
  overall_score?: number;
  full_report: DiagnosisReport;
  notes?: string;
  symptoms?: string[];
  medicines?: string[];
  vital_signs?: VitalSigns;
  clinical_notes?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  inquiry_summary?: string;
  inquiry_chat_history?: ChatMessage[];
  inquiry_report_files?: FileMetadata[];
  inquiry_medicine_files?: FileMetadata[];
  tongue_analysis?: TongueAnalysisData;
  face_analysis?: FaceAnalysisData;
  body_analysis?: BodyAnalysisData;
  audio_analysis?: AudioAnalysisData;
  pulse_data?: PulseData;
}

// ============================================================================
// Medical Reports (medical_reports table)
// ============================================================================

export interface MedicalReport {
  id: string;
  user_id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  file_url?: string | null;
  extracted_text?: string | null;
  created_at: string;
}

export interface SaveMedicalReportInput {
  name: string;
  date: string;
  size: string;
  type: string;
  file_url?: string;
  extracted_text?: string;
}

// ============================================================================
// Patient Medicines (patient_medicines table)
// ============================================================================

export interface PatientMedicine {
  id: string;
  user_id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  is_active: boolean;
  notes?: string | null;
  start_date?: string | null;
  stop_date?: string | null;
  purpose?: string | null;
  specialty?: string | null;
  chinese_name?: string | null;
  edited_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavePatientMedicineInput {
  name: string;
  dosage?: string;
  frequency?: string;
  is_active?: boolean;
  notes?: string;
  start_date?: string;
  stop_date?: string;
  purpose?: string;
  specialty?: string;
  chinese_name?: string;
  edited_by?: string;
}

// ============================================================================
// Health Trends
// ============================================================================

export interface HealthTrends {
  sessionCount: number;
  averageScore: number | null;
  improvement: number | null;
  diagnosisCounts: Record<string, number>;
  sessions: Array<{
    score: number | null;
    date: string;
  }>;
}

// ============================================================================
// Action Response Types
// ============================================================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

// ============================================================================
// Family Members (family_members table)
// ============================================================================

export type FamilyRelationship =
  | "self"
  | "mother"
  | "father"
  | "spouse"
  | "child"
  | "sibling"
  | "other";

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: FamilyRelationship;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  medical_history: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberWithDiagnosis extends FamilyMember {
  lastDiagnosis?: {
    date: string;
    diagnosis: string;
    score?: number;
  } | null;
}

export interface SaveFamilyMemberInput {
  name: string;
  relationship: FamilyRelationship;
  gender?: "male" | "female" | "other";
  date_of_birth?: string;
  height?: number;
  weight?: number;
  medical_history?: string;
  avatar_url?: string;
}

export interface UpdateFamilyMemberInput extends Partial<SaveFamilyMemberInput> {
  id: string;
}

// ============================================================================
// Patients (patients table)
// ============================================================================

export type PatientStatus = 'active' | 'archived' | 'pending_invite';
export type PatientType = 'managed' | 'registered' | 'guest';

export interface Patient {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name?: string | null;
  ic_no?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  status: PatientStatus;
  type: PatientType;
  user_id?: string | null;
  created_by?: string | null;
  clinical_summary?: {
    summary: string;
    generated_at: string;
    last_diagnosis_id?: string;
  } | null;
  flag?: PatientFlag | null;
}

export type PatientFlag = 'Critical' | 'High Priority' | 'Watch' | 'Normal' | null;



// ============================================================================
// Appointments
// ============================================================================

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type AppointmentType = "consultation" | "treatment" | "follow_up";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
}

// ============================================================================
// Treatment Records
// ============================================================================

// Derived view for the Treatment Dashboard
export interface TreatmentRecord {
  id: string; // usually diagnosis_session_id
  patient_name: string;
  diagnosis: string;
  treatment_plan: string;
  date: string;
  status: "active" | "completed" | "pending";
  flag?: PatientFlag | null;
}
