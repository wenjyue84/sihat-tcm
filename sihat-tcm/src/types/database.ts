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
  bmi?: number | null
  blood_pressure?: string | null
  heart_rate?: number | null
  temperature?: number | null
}

export interface PatientSummary {
  name?: string | null
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  vital_signs?: VitalSigns
}

export interface DiagnosisPattern {
  primary_pattern: string
  secondary_patterns?: string[]
  affected_organs?: string[]
  pathomechanism?: string
}

export interface Constitution {
  type: string
  description?: string
}

export interface KeyFindings {
  from_inquiry?: string
  from_visual?: string
  from_pulse?: string
}

export interface Analysis {
  summary: string
  key_findings?: KeyFindings
}

export interface FoodTherapy {
  beneficial?: string[]
  recipes?: string[]
  avoid?: string[]
}

export interface HerbalFormula {
  name: string
  ingredients?: string[]
  dosage?: string
  purpose?: string
}

export interface Recommendations {
  food_therapy?: FoodTherapy
  food?: string[]
  avoid?: string[]
  lifestyle?: string[]
  acupoints?: string[]
  exercise?: string[]
  sleep_guidance?: string
  emotional_care?: string
  herbal_formulas?: HerbalFormula[]
  doctor_consultation?: string
  general?: string[]
}

export interface Precautions {
  warning_signs?: string[]
  contraindications?: string[]
  special_notes?: string
}

export interface FollowUp {
  timeline?: string
  expected_improvement?: string
  next_steps?: string
}

export interface PatientProfile {
  name?: string
  age?: number
  gender?: string
  height?: number
  weight?: number
}

/**
 * Full diagnosis report structure (stored in full_report JSONB column)
 * This matches the structure returned by /api/consult
 */
export interface DiagnosisReport {
  patient_summary?: PatientSummary
  diagnosis: DiagnosisPattern | string
  constitution: Constitution | string
  analysis: Analysis
  recommendations: Recommendations
  precautions?: Precautions
  follow_up?: FollowUp
  disclaimer?: string
  timestamp?: string
  patient_profile?: PatientProfile
  input_data?: {
    medicines?: string[]
  }
}

/**
 * Database row type for diagnosis_sessions table
 */
export interface DiagnosisSession {
  id: string
  user_id: string
  primary_diagnosis: string
  constitution?: string | null
  overall_score?: number | null
  full_report: DiagnosisReport
  notes?: string | null
  // Doctor record fields
  symptoms?: string[] | null
  medicines?: string[] | null
  vital_signs?: VitalSigns | null
  clinical_notes?: string | null
  treatment_plan?: string | null
  follow_up_date?: string | null
  // Family care link
  family_member_id?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input type for saving a diagnosis session
 */
export interface SaveDiagnosisInput {
  primary_diagnosis: string
  constitution?: string
  overall_score?: number
  full_report: DiagnosisReport
  notes?: string
  // Doctor record fields
  symptoms?: string[]
  medicines?: string[]
  vital_signs?: VitalSigns
  clinical_notes?: string
  treatment_plan?: string
  follow_up_date?: string
}

// ============================================================================
// Medical Reports (medical_reports table)
// ============================================================================

export interface MedicalReport {
  id: string
  user_id: string
  name: string
  date: string
  size: string
  type: string
  file_url?: string | null
  extracted_text?: string | null
  created_at: string
}

export interface SaveMedicalReportInput {
  name: string
  date: string
  size: string
  type: string
  file_url?: string
  extracted_text?: string
}

// ============================================================================
// Health Trends
// ============================================================================

export interface HealthTrends {
  sessionCount: number
  averageScore: number | null
  improvement: number | null
  diagnosisCounts: Record<string, number>
  sessions: Array<{
    score: number | null
    date: string
  }>
}

// ============================================================================
// Action Response Types
// ============================================================================

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  total?: number
}

// ============================================================================
// Family Members (family_members table)
// ============================================================================

export type FamilyRelationship = 'self' | 'mother' | 'father' | 'spouse' | 'child' | 'sibling' | 'other'

export interface FamilyMember {
  id: string
  user_id: string
  name: string
  relationship: FamilyRelationship
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  height: number | null
  weight: number | null
  medical_history: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMemberWithDiagnosis extends FamilyMember {
  lastDiagnosis?: {
    date: string
    diagnosis: string
    score?: number
  } | null
}

export interface SaveFamilyMemberInput {
  name: string
  relationship: FamilyRelationship
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  height?: number
  weight?: number
  medical_history?: string
  avatar_url?: string
}

export interface UpdateFamilyMemberInput extends Partial<SaveFamilyMemberInput> {
  id: string
}

