/**
 * Diagnosis Service
 *
 * Encapsulates all Supabase operations for diagnosis_sessions table.
 */

import type {
    DiagnosisSession,
    GuestDiagnosisSession,
    SaveDiagnosisInput,
    PatientFlag,
} from "@/types/database";
import type { ServiceResult, SupabaseInstance, PaginationOptions, SortOptions } from "./types";
import { toServiceError } from "./types";

export interface DiagnosisListOptions extends PaginationOptions, Partial<SortOptions> {
    userId?: string;
    patientId?: string;
    includeHidden?: boolean;
    includeGuest?: boolean;
}

export interface DiagnosisService {
    getById(id: string): Promise<ServiceResult<DiagnosisSession>>;
    getByIdWithoutAuth(id: string): Promise<ServiceResult<DiagnosisSession>>;
    list(options?: DiagnosisListOptions): Promise<ServiceResult<DiagnosisSession[]>>;
    listByUserId(userId: string, options?: DiagnosisListOptions): Promise<ServiceResult<DiagnosisSession[]>>;
    listByPatientId(patientId: string, options?: DiagnosisListOptions): Promise<ServiceResult<DiagnosisSession[]>>;
    create(data: Omit<SaveDiagnosisInput, "is_guest_session"> & { user_id?: string }): Promise<ServiceResult<DiagnosisSession>>;
    createGuestSession(data: SaveDiagnosisInput & { session_token: string }): Promise<ServiceResult<GuestDiagnosisSession>>;
    update(id: string, data: Partial<DiagnosisSession>): Promise<ServiceResult<DiagnosisSession>>;
    updateNotes(id: string, notes: string): Promise<ServiceResult<void>>;
    updateFlag(id: string, flag: PatientFlag): Promise<ServiceResult<void>>;
    hide(id: string): Promise<ServiceResult<void>>;
    delete(id: string): Promise<ServiceResult<void>>;
    getGuestSession(sessionToken: string): Promise<ServiceResult<GuestDiagnosisSession>>;
    migrateGuestToUser(sessionToken: string, userId: string): Promise<ServiceResult<DiagnosisSession>>;
    count(userId?: string): Promise<ServiceResult<number>>;
}

export function createDiagnosisService(supabase: SupabaseInstance): DiagnosisService {
    return {
        async getById(id: string): Promise<ServiceResult<DiagnosisSession>> {
            const { data, error } = await supabase
                .from("diagnosis_sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as DiagnosisSession, error: null };
        },

        async getByIdWithoutAuth(id: string): Promise<ServiceResult<DiagnosisSession>> {
            // Same as getById but intended for admin/service-role usage
            const { data, error } = await supabase
                .from("diagnosis_sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as DiagnosisSession, error: null };
        },

        async list(options: DiagnosisListOptions = {}): Promise<ServiceResult<DiagnosisSession[]>> {
            const { page = 1, limit = 20, column = "created_at", ascending = false, includeHidden = false } = options;
            const offset = (page - 1) * limit;

            let query = supabase
                .from("diagnosis_sessions")
                .select("*")
                .order(column, { ascending })
                .range(offset, offset + limit - 1);

            if (!includeHidden) {
                query = query.or("is_hidden.is.null,is_hidden.eq.false");
            }

            const { data, error } = await query;

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as DiagnosisSession[], error: null };
        },

        async listByUserId(userId: string, options: DiagnosisListOptions = {}): Promise<ServiceResult<DiagnosisSession[]>> {
            const { page = 1, limit = 20, column = "created_at", ascending = false, includeHidden = false } = options;
            const offset = (page - 1) * limit;

            let query = supabase
                .from("diagnosis_sessions")
                .select("*")
                .eq("user_id", userId)
                .order(column, { ascending })
                .range(offset, offset + limit - 1);

            if (!includeHidden) {
                query = query.or("is_hidden.is.null,is_hidden.eq.false");
            }

            const { data, error } = await query;

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as DiagnosisSession[], error: null };
        },

        async listByPatientId(patientId: string, options: DiagnosisListOptions = {}): Promise<ServiceResult<DiagnosisSession[]>> {
            const { page = 1, limit = 20, column = "created_at", ascending = false } = options;
            const offset = (page - 1) * limit;

            const { data, error } = await supabase
                .from("diagnosis_sessions")
                .select("*")
                .eq("patient_id", patientId)
                .order(column, { ascending })
                .range(offset, offset + limit - 1);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as DiagnosisSession[], error: null };
        },

        async create(data): Promise<ServiceResult<DiagnosisSession>> {
            const { data: result, error } = await supabase
                .from("diagnosis_sessions")
                .insert({
                    ...data,
                    is_guest_session: false,
                })
                .select()
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as DiagnosisSession, error: null };
        },

        async createGuestSession(data): Promise<ServiceResult<GuestDiagnosisSession>> {
            const { data: result, error } = await supabase
                .from("guest_diagnosis_sessions")
                .insert({
                    session_token: data.session_token,
                    guest_email: data.guest_email,
                    guest_name: data.guest_name,
                    primary_diagnosis: data.primary_diagnosis,
                    constitution: data.constitution,
                    overall_score: data.overall_score,
                    full_report: data.full_report,
                    notes: data.notes,
                    symptoms: data.symptoms,
                    medicines: data.medicines,
                    vital_signs: data.vital_signs,
                    clinical_notes: data.clinical_notes,
                    treatment_plan: data.treatment_plan,
                    follow_up_date: data.follow_up_date,
                    inquiry_summary: data.inquiry_summary,
                    inquiry_chat_history: data.inquiry_chat_history,
                    inquiry_report_files: data.inquiry_report_files,
                    inquiry_medicine_files: data.inquiry_medicine_files,
                    tongue_analysis: data.tongue_analysis,
                    face_analysis: data.face_analysis,
                    body_analysis: data.body_analysis,
                    audio_analysis: data.audio_analysis,
                    pulse_data: data.pulse_data,
                })
                .select()
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as GuestDiagnosisSession, error: null };
        },

        async update(id: string, data: Partial<DiagnosisSession>): Promise<ServiceResult<DiagnosisSession>> {
            const { data: result, error } = await supabase
                .from("diagnosis_sessions")
                .update(data)
                .eq("id", id)
                .select()
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as DiagnosisSession, error: null };
        },

        async updateNotes(id: string, notes: string): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("diagnosis_sessions")
                .update({ notes })
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async updateFlag(id: string, flag: PatientFlag): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("diagnosis_sessions")
                .update({ flag })
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async hide(id: string): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("diagnosis_sessions")
                .update({ is_hidden: true })
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async delete(id: string): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("diagnosis_sessions")
                .delete()
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async getGuestSession(sessionToken: string): Promise<ServiceResult<GuestDiagnosisSession>> {
            const { data, error } = await supabase
                .from("guest_diagnosis_sessions")
                .select("*")
                .eq("session_token", sessionToken)
                .is("migrated_to_user_id", null)
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as GuestDiagnosisSession, error: null };
        },

        async migrateGuestToUser(sessionToken: string, userId: string): Promise<ServiceResult<DiagnosisSession>> {
            // First, get the guest session
            const { data: guestSession, error: fetchError } = await supabase
                .from("guest_diagnosis_sessions")
                .select("*")
                .eq("session_token", sessionToken)
                .is("migrated_to_user_id", null)
                .single();

            if (fetchError || !guestSession) {
                return { data: null, error: toServiceError(fetchError || { message: "Guest session not found or already migrated" }) };
            }

            // Create new session for user
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
                return { data: null, error: toServiceError(insertError) };
            }

            // Mark guest session as migrated
            await supabase
                .from("guest_diagnosis_sessions")
                .update({ migrated_to_user_id: userId, migrated_at: new Date().toISOString() })
                .eq("id", guestSession.id);

            return { data: newSession as DiagnosisSession, error: null };
        },

        async count(userId?: string): Promise<ServiceResult<number>> {
            let query = supabase.from("diagnosis_sessions").select("*", { count: "exact", head: true });

            if (userId) {
                query = query.eq("user_id", userId);
            }

            const { count, error } = await query;

            if (error) return { data: null, error: toServiceError(error) };
            return { data: count ?? 0, error: null };
        },
    };
}
