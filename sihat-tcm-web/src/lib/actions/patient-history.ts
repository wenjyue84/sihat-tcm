"use server";

/**
 * Patient History Actions
 *
 * Server actions for retrieving patient history and health trends.
 *
 * @module actions/patient-history
 */

import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import type {
  DiagnosisSession,
  ActionResult,
  HealthTrends,
  DiagnosisReport,
} from "@/types/database";

/**
 * Get all diagnosis sessions for the current user (paginated, newest first)
 */
export async function getPatientHistory(
  limit: number = 50,
  offset: number = 0,
  lightweight: boolean = false
): Promise<ActionResult<DiagnosisSession[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated. Please log in to view your history." };
    }

    const selectColumns = lightweight
      ? "id, created_at, symptoms, primary_diagnosis, clinical_notes, constitution, user_id, is_hidden"
      : "*";

    const { data: allRecords, count: allCount } = await supabase
      .from("diagnosis_sessions")
      .select("id, is_hidden", { count: "exact" })
      .eq("user_id", user.id);

    devLog("info", "Actions", "[getPatientHistory] Debug check", {
      userId: user.id,
      totalRecords: allCount || 0,
      hiddenRecords: allRecords?.filter((r) => r.is_hidden === true).length || 0,
      visibleRecords:
        allRecords?.filter((r) => r.is_hidden === false || r.is_hidden === null).length || 0,
    });

    const { data, error, count } = await supabase
      .from("diagnosis_sessions")
      .select(selectColumns, { count: "exact" })
      .eq("user_id", user.id)
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      devLog("error", "Actions", "[getPatientHistory] Error", { error, userId: user.id });
      return { success: false, error: error.message };
    }

    devLog("info", "Actions", "[getPatientHistory] Success", {
      userId: user.id,
      returnedCount: data?.length || 0,
      totalCount: count || 0,
    });

    return {
      success: true,
      data: data as unknown as DiagnosisSession[],
      total: count || 0,
    };
  } catch (error: unknown) {
    devLog("error", "Actions", "[getPatientHistory] Unexpected error", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch history",
    };
  }
}

/**
 * Calculate health trend statistics for the dashboard
 */
export async function getHealthTrends(days: number = 30): Promise<ActionResult<HealthTrends>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated." };
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { data, error } = await supabase
      .from("diagnosis_sessions")
      .select("overall_score, primary_diagnosis, created_at")
      .eq("user_id", user.id)
      .gte("created_at", dateThreshold.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      devLog("error", "Actions", "[getHealthTrends] Error", { error });
      return { success: false, error: error.message };
    }

    const sessions = data || [];
    const scores = sessions
      .map((s) => s.overall_score)
      .filter((s): s is number => s !== null && s !== undefined);

    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const improvement = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null;

    const diagnosisCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      diagnosisCounts[s.primary_diagnosis] = (diagnosisCounts[s.primary_diagnosis] || 0) + 1;
    });

    return {
      success: true,
      data: {
        sessionCount: sessions.length,
        averageScore: avgScore,
        improvement,
        diagnosisCounts,
        sessions: sessions.map((s) => ({ score: s.overall_score, date: s.created_at })),
      },
    };
  } catch (error: unknown) {
    devLog("error", "Actions", "[getHealthTrends] Unexpected error", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate trends",
    };
  }
}

/**
 * Get the symptoms from the last inquiry for the current user
 */
export async function getLastSymptoms(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated. Please log in to import symptoms." };
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("symptoms")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      devLog("error", "Actions", "[getLastSymptoms] Error", { error });
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "No previous symptoms found." };
    }

    return { success: true, data: data.symptoms || "" };
  } catch (error: unknown) {
    devLog("error", "Actions", "[getLastSymptoms] Unexpected error", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch symptoms",
    };
  }
}

/**
 * Get the medicines from the last diagnosis for the current user
 * Checks Basic Profile (patient_medicines) first
 */
export async function getLastMedicines(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated. Please log in to import medicines." };
    }

    // 1. Try to get medicines from Basic Profile (patient_medicines)
    const { data: portfolioMedicines, error: portfolioError } = await supabase
      .from("patient_medicines")
      .select("name")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!portfolioError && portfolioMedicines && portfolioMedicines.length > 0) {
      return { success: true, data: portfolioMedicines.map((m) => m.name) };
    }

    // 2. Fallback: Fetch last diagnosis session
    const { data, error } = await supabase
      .from("diagnosis_sessions")
      .select("full_report")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      devLog("error", "Actions", "[getLastMedicines] Error", { error });
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "No previous medicines found." };
    }

    const report = data.full_report as DiagnosisReport;
    const medicines = report.input_data?.medicines || [];

    return { success: true, data: medicines };
  } catch (error: unknown) {
    devLog("error", "Actions", "[getLastMedicines] Unexpected error", { error });
    return { success: false, error: "Failed to fetch medicines" };
  }
}
