"use server";

/**
 * Diagnosis Session Actions
 *
 * Server actions for managing diagnosis sessions including:
 * - Creating and saving diagnosis sessions
 * - Guest session management and migration
 * - Session retrieval, update, and deletion
 * - Seeding development data
 *
 * @module actions/diagnosis
 */

import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import type {
    DiagnosisSession,
    SaveDiagnosisInput,
    GuestDiagnosisSession,
    ActionResult,
} from "@/types/database";
import {
    extractSymptomsFromReport,
    extractMedicinesFromReport,
    extractVitalSignsFromReport,
    extractTreatmentPlanFromReport,
} from "../utils/report-extraction";
import { getMockSymptomsForDiagnosis, getMockMedicinesForDiagnosis } from "./shared";

/**
 * Save a new diagnosis session to the database
 * Supports both authenticated users and guest sessions
 */
export async function saveDiagnosis(
    reportData: SaveDiagnosisInput
): Promise<ActionResult<DiagnosisSession | GuestDiagnosisSession>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        const isGuest = reportData.is_guest_session || (!user && !authError);

        if (isGuest) {
            const sessionToken = reportData.session_token || crypto.randomUUID();
            const symptoms = reportData.symptoms || extractSymptomsFromReport(reportData.full_report);
            const medicines = reportData.medicines || extractMedicinesFromReport(reportData.full_report);
            const vitalSigns = reportData.vital_signs || extractVitalSignsFromReport(reportData.full_report);
            const treatmentPlan = reportData.treatment_plan || extractTreatmentPlanFromReport(reportData.full_report);

            const { data, error } = await supabase
                .from("guest_diagnosis_sessions")
                .insert({
                    session_token: sessionToken,
                    guest_email: reportData.guest_email,
                    guest_name: reportData.guest_name,
                    primary_diagnosis: reportData.primary_diagnosis,
                    constitution: reportData.constitution,
                    overall_score: reportData.overall_score,
                    full_report: reportData.full_report,
                    notes: reportData.notes,
                    symptoms,
                    medicines,
                    vital_signs: vitalSigns,
                    clinical_notes: reportData.clinical_notes,
                    treatment_plan: treatmentPlan,
                    follow_up_date: reportData.follow_up_date,
                    inquiry_summary: reportData.inquiry_summary,
                    inquiry_chat_history: reportData.inquiry_chat_history,
                    inquiry_report_files: reportData.inquiry_report_files,
                    inquiry_medicine_files: reportData.inquiry_medicine_files,
                    tongue_analysis: reportData.tongue_analysis,
                    face_analysis: reportData.face_analysis,
                    body_analysis: reportData.body_analysis,
                    audio_analysis: reportData.audio_analysis,
                    pulse_data: reportData.pulse_data,
                })
                .select()
                .single();

            if (error) {
                devLog("error", "Actions", "[saveDiagnosis] Guest session error", { error });
                if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                    return {
                        success: false,
                        error: "Database migration required. Please run the migration file: supabase/migrations/20250102000001_add_diagnosis_input_data.sql",
                    };
                }
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data: { ...data, session_token: sessionToken } as GuestDiagnosisSession,
            };
        }

        if (authError || !user) {
            return { success: false, error: "Not authenticated. Please log in to save your diagnosis." };
        }

        const symptoms = reportData.symptoms || extractSymptomsFromReport(reportData.full_report);
        const medicines = reportData.medicines || extractMedicinesFromReport(reportData.full_report);
        const vitalSigns = reportData.vital_signs || extractVitalSignsFromReport(reportData.full_report);
        const treatmentPlan = reportData.treatment_plan || extractTreatmentPlanFromReport(reportData.full_report);

        const { data, error } = await supabase
            .from("diagnosis_sessions")
            .insert({
                user_id: reportData.user_id || user.id,
                patient_id: reportData.patient_id,
                primary_diagnosis: reportData.primary_diagnosis,
                constitution: reportData.constitution,
                overall_score: reportData.overall_score,
                full_report: reportData.full_report,
                notes: reportData.notes,
                symptoms,
                medicines,
                vital_signs: vitalSigns,
                clinical_notes: reportData.clinical_notes,
                treatment_plan: treatmentPlan,
                follow_up_date: reportData.follow_up_date,
                inquiry_summary: reportData.inquiry_summary,
                inquiry_chat_history: reportData.inquiry_chat_history,
                inquiry_report_files: reportData.inquiry_report_files,
                inquiry_medicine_files: reportData.inquiry_medicine_files,
                tongue_analysis: reportData.tongue_analysis,
                face_analysis: reportData.face_analysis,
                body_analysis: reportData.body_analysis,
                audio_analysis: reportData.audio_analysis,
                pulse_data: reportData.pulse_data,
                is_guest_session: false,
                guest_email: null,
                guest_name: null,
            })
            .select()
            .single();

        if (error) {
            devLog("error", "Actions", "[saveDiagnosis] Error", { error });
            if (error.message.includes("medicines") && (error.message.includes("does not exist") || error.message.includes("schema cache"))) {
                return {
                    success: false,
                    error: "Database migration required. Please run the migration file: supabase/migrations/20251226000001_add_doctor_record_fields.sql",
                };
            }
            return { success: false, error: error.message };
        }

        return { success: true, data: data as DiagnosisSession };
    } catch (error: unknown) {
        devLog("error", "Actions", "[saveDiagnosis] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to save diagnosis" };
    }
}

/**
 * Migrate a guest diagnosis session to an authenticated user account
 */
export async function migrateGuestSessionToUser(
    sessionToken: string,
    userId: string
): Promise<ActionResult<DiagnosisSession>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user || user.id !== userId) {
            return { success: false, error: "Not authenticated or user mismatch." };
        }

        const { data: guestSession, error: fetchError } = await supabase
            .from("guest_diagnosis_sessions")
            .select("*")
            .eq("session_token", sessionToken)
            .is("migrated_to_user_id", null)
            .single();

        if (fetchError || !guestSession) {
            return { success: false, error: "Guest session not found or already migrated." };
        }

        const { data: newSession, error: insertError } = await supabase
            .from("diagnosis_sessions")
            .insert({
                user_id: userId,
                primary_diagnosis: guestSession.primary_diagnosis,
                constitution: guestSession.constitution,
                overall_score: guestSession.overall_score,
                full_report: guestSession.full_report,
                notes: guestSession.notes,
                symptoms: guestSession.symptoms,
                medicines: guestSession.medicines,
                vital_signs: guestSession.vital_signs,
                clinical_notes: guestSession.clinical_notes,
                treatment_plan: guestSession.treatment_plan,
                follow_up_date: guestSession.follow_up_date,
                inquiry_summary: guestSession.inquiry_summary,
                inquiry_chat_history: guestSession.inquiry_chat_history,
                inquiry_report_files: guestSession.inquiry_report_files,
                inquiry_medicine_files: guestSession.inquiry_medicine_files,
                tongue_analysis: guestSession.tongue_analysis,
                face_analysis: guestSession.face_analysis,
                body_analysis: guestSession.body_analysis,
                audio_analysis: guestSession.audio_analysis,
                pulse_data: guestSession.pulse_data,
                is_guest_session: false,
            })
            .select()
            .single();

        if (insertError) {
            devLog("error", "Actions", "[migrateGuestSessionToUser] Insert error", { error: insertError });
            return { success: false, error: insertError.message };
        }

        await supabase
            .from("guest_diagnosis_sessions")
            .update({ migrated_to_user_id: userId, migrated_at: new Date().toISOString() })
            .eq("id", guestSession.id);

        return { success: true, data: newSession as DiagnosisSession };
    } catch (error: unknown) {
        devLog("error", "Actions", "[migrateGuestSessionToUser] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to migrate guest session" };
    }
}

/**
 * Get a single diagnosis session by ID
 */
export async function getSessionById(sessionId: string): Promise<ActionResult<DiagnosisSession>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated. Please log in to view this session." };
        }

        const { data, error } = await supabase
            .from("diagnosis_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (error) {
            devLog("error", "Actions", "[getSessionById] Error", { error });
            return { success: false, error: error.code === "PGRST116" ? "Session not found" : error.message };
        }

        return { success: true, data: data as DiagnosisSession };
    } catch (error: unknown) {
        devLog("error", "Actions", "[getSessionById] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch session" };
    }
}

/**
 * Update notes for a diagnosis session
 */
export async function updateSessionNotes(sessionId: string, notes: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated. Please log in to update notes." };
        }

        const { error } = await supabase
            .from("diagnosis_sessions")
            .update({ notes })
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (error) {
            devLog("error", "Actions", "[updateSessionNotes] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[updateSessionNotes] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to update notes" };
    }
}

/**
 * Delete a diagnosis session
 */
export async function deleteSession(sessionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated. Please log in to delete sessions." };
        }

        const { error } = await supabase
            .from("diagnosis_sessions")
            .delete()
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (error) {
            devLog("error", "Actions", "[deleteSession] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[deleteSession] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete session" };
    }
}

/**
 * Hide a diagnosis session (soft delete)
 */
export async function hideSession(sessionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated. Please log in to hide sessions." };
        }

        const { error } = await supabase
            .from("diagnosis_sessions")
            .update({ is_hidden: true })
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (error) {
            devLog("error", "Actions", "[hideSession] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[hideSession] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to hide session" };
    }
}

/**
 * Seed the patient's history with comprehensive mock diagnosis sessions
 */
export async function seedPatientHistory(): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated." };
        }

        const now = new Date();
        const mockSessions = [
            {
                primary_diagnosis: "Yin Deficiency with Empty Heat",
                constitution: "Yin Deficiency Constitution",
                overall_score: 68,
                notes: "Noticed improvement in sleep after following diet recommendations.",
                daysAgo: 2,
                full_report: {
                    diagnosis: { primary_pattern: "Yin Deficiency with Empty Heat" },
                    recommendations: { food: ["Black sesame", "Goji berries"], herbal_formulas: [{ name: "Liu Wei Di Huang Wan" }] },
                },
            },
            {
                primary_diagnosis: "Liver Qi Stagnation",
                constitution: "Qi Stagnation Constitution",
                overall_score: 62,
                notes: "Very stressful week at work.",
                daysAgo: 7,
                full_report: {
                    diagnosis: { primary_pattern: "Liver Qi Stagnation" },
                    recommendations: { food: ["Green vegetables", "Citrus"], herbal_formulas: [{ name: "Xiao Yao San" }] },
                },
            },
            {
                primary_diagnosis: "Spleen Qi Deficiency",
                constitution: "Qi Deficiency Constitution",
                overall_score: 65,
                notes: "Started eating congee for breakfast.",
                daysAgo: 14,
                full_report: {
                    diagnosis: { primary_pattern: "Spleen Qi Deficiency" },
                    recommendations: { food: ["Congee", "Chinese yam"], herbal_formulas: [{ name: "Si Jun Zi Tang" }] },
                },
            },
        ];

        const sessions = mockSessions.map((session) => {
            const date = new Date(now);
            date.setDate(date.getDate() - session.daysAgo);
            const symptoms = getMockSymptomsForDiagnosis(session.primary_diagnosis);
            const medicines = getMockMedicinesForDiagnosis(session.primary_diagnosis);

            return {
                user_id: user.id,
                primary_diagnosis: session.primary_diagnosis,
                constitution: session.constitution,
                overall_score: session.overall_score,
                full_report: session.full_report,
                notes: session.notes,
                symptoms,
                medicines,
                vital_signs: { bpm: 70 + Math.floor(Math.random() * 20) },
                treatment_plan: "Dietary adjustments | Lifestyle modifications | Herbal support",
                clinical_notes: `Patient presented with ${symptoms?.slice(0, 2).join(" and ")}. Recommended ${medicines?.[0]} for treatment.`,
                created_at: date.toISOString(),
            };
        });

        const { error } = await supabase.from("diagnosis_sessions").insert(sessions);

        if (error) {
            devLog("error", "Actions", "[seedPatientHistory] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[seedPatientHistory] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to seed patient history" };
    }
}
