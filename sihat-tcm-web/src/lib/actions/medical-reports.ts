"use server";

/**
 * Medical Reports Actions
 *
 * Server actions for managing uploaded medical reports.
 *
 * @module actions/medical-reports
 */

import { createClient } from "@/lib/supabase/server";
import { mockMedicalReports } from "@/lib/mockMedicalReports";
import { devLog } from "@/lib/systemLogger";
import type { MedicalReport, SaveMedicalReportInput, ActionResult } from "@/types/database";

/**
 * Get all medical reports for the current user
 */
export async function getMedicalReports(): Promise<ActionResult<MedicalReport[]>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated." };
        }

        const { data, error } = await supabase
            .from("medical_reports")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            devLog("error", "Actions", "[getMedicalReports] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true, data: data as MedicalReport[] };
    } catch (error: unknown) {
        devLog("error", "Actions", "[getMedicalReports] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch medical reports" };
    }
}

/**
 * Save a new medical report metadata to the database
 */
export async function saveMedicalReport(
    reportData: SaveMedicalReportInput
): Promise<ActionResult<MedicalReport>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated." };
        }

        const { data, error } = await supabase
            .from("medical_reports")
            .insert({
                user_id: user.id,
                name: reportData.name,
                date: reportData.date,
                size: reportData.size,
                type: reportData.type,
                file_url: reportData.file_url,
                extracted_text: reportData.extracted_text,
            })
            .select()
            .single();

        if (error) {
            devLog("error", "Actions", "[saveMedicalReport] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true, data: data as MedicalReport };
    } catch (error: unknown) {
        devLog("error", "Actions", "[saveMedicalReport] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to save medical report" };
    }
}

/**
 * Delete a medical report
 */
export async function deleteMedicalReport(reportId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated." };
        }

        const { error } = await supabase
            .from("medical_reports")
            .delete()
            .eq("id", reportId)
            .eq("user_id", user.id);

        if (error) {
            devLog("error", "Actions", "[deleteMedicalReport] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[deleteMedicalReport] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete medical report" };
    }
}

/**
 * Seed the patient's medical reports with mock documents
 */
export async function seedMedicalReports(): Promise<ActionResult> {
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
        const mockReports = [
            { name: "Blood Test Result.pdf", date: "2023-11-15", size: "245 KB", type: "application/pdf", daysAgo: 40 },
            { name: "X-Ray Report - Chest.pdf", date: "2023-10-20", size: "1.2 MB", type: "application/pdf", daysAgo: 66 },
            { name: "Annual Health Checkup.pdf", date: "2023-08-12", size: "520 KB", type: "application/pdf", daysAgo: 135 },
            { name: "MRI Scan Report.pdf", date: "2023-06-05", size: "3.8 MB", type: "application/pdf", daysAgo: 203 },
            { name: "Prescription History.pdf", date: "2023-05-20", size: "180 KB", type: "application/pdf", daysAgo: 219 },
        ];

        const reports = mockReports.map((report) => {
            const createdDate = new Date(now);
            createdDate.setDate(createdDate.getDate() - report.daysAgo);
            const extractedText = mockMedicalReports[report.name] || null;

            return {
                user_id: user.id,
                name: report.name,
                date: report.date,
                size: report.size,
                type: report.type,
                file_url: null,
                extracted_text: extractedText,
                created_at: createdDate.toISOString(),
            };
        });

        const { error } = await supabase.from("medical_reports").insert(reports);

        if (error) {
            devLog("error", "Actions", "[seedMedicalReports] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[seedMedicalReports] Unexpected error", { error });
        return { success: false, error: error instanceof Error ? error.message : "Failed to seed reports" };
    }
}
