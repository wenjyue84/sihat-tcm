"use server";

/**
 * Translation Actions
 *
 * Server actions for translating patient records to different languages.
 *
 * @module actions/translation
 */

import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { ActionResult } from "@/types/database";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese",
  ms: "Malay",
};

/**
 * Translate patient records to target language
 */
export async function translatePatientRecords(
  userId: string,
  targetLanguage: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const model = google("gemini-2.0-flash");
    const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    // Translate Profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (profile && profile.medical_history) {
      try {
        const { object } = await generateObject({
          model,
          schema: z.object({ medical_history: z.string() }),
          prompt: `Translate the following medical history to ${langName}. Keep medical terms accurate. Only return the translated text.\nHistory: ${profile.medical_history}`,
        });
        await supabase
          .from("profiles")
          .update({ medical_history: object.medical_history })
          .eq("id", userId);
      } catch (e) {
        devLog("error", "Translation", "Profile translation failed", { error: e });
      }
    }

    // Translate Sessions (Limit 20)
    const { data: sessions } = await supabase
      .from("diagnosis_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (sessions) {
      for (const session of sessions) {
        try {
          const payload = {
            primary_diagnosis: session.primary_diagnosis,
            constitution: session.constitution,
            symptoms: session.symptoms,
            medicines: session.medicines,
            clinical_notes: session.clinical_notes,
            treatment_plan: session.treatment_plan,
          };

          const { object } = await generateObject({
            model,
            schema: z.object({
              primary_diagnosis: z.string().nullable().optional(),
              constitution: z.string().nullable().optional(),
              symptoms: z.array(z.string()).nullable().optional(),
              medicines: z.array(z.string()).nullable().optional(),
              clinical_notes: z.string().nullable().optional(),
              treatment_plan: z.string().nullable().optional(),
            }),
            prompt: `Translate the values in this medical record to ${langName}. Return null for null inputs. Maintain Markdown formatting in notes.\nInput: ${JSON.stringify(payload)}`,
          });

          await supabase
            .from("diagnosis_sessions")
            .update({
              primary_diagnosis: object.primary_diagnosis ?? session.primary_diagnosis,
              constitution: object.constitution ?? session.constitution,
              symptoms: object.symptoms ?? session.symptoms,
              medicines: object.medicines ?? session.medicines,
              clinical_notes: object.clinical_notes ?? session.clinical_notes,
              treatment_plan: object.treatment_plan ?? session.treatment_plan,
            })
            .eq("id", session.id);
        } catch (e) {
          devLog("error", "Translation", `Session ${session.id} translation failed`, { error: e });
        }
      }
    }

    return { success: true };
  } catch (error: unknown) {
    devLog("error", "Actions", "[translatePatientRecords] Error", { error });
    return { success: false, error: error instanceof Error ? error.message : "Translation failed" };
  }
}

/**
 * Get patient session IDs for granular translation
 */
export async function getPatientSessionIds(userId: string): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("diagnosis_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data.map((s) => s.id) };
  } catch {
    return { success: false, error: "Failed to fetch session IDs" };
  }
}

/**
 * Translate user profile only
 */
export async function translateUserProfile(
  userId: string,
  targetLanguage: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const model = google("gemini-2.0-flash");
    const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (profile && profile.medical_history) {
      const { object } = await generateObject({
        model,
        schema: z.object({ medical_history: z.string() }),
        prompt: `Translate the following medical history to ${langName}. Keep medical terms accurate. Only return the translated text.\nHistory: ${profile.medical_history}`,
      });
      await supabase
        .from("profiles")
        .update({ medical_history: object.medical_history })
        .eq("id", userId);
    }
    return { success: true };
  } catch {
    return { success: false, error: "Profile translation failed" };
  }
}

/**
 * Translate a single diagnosis session
 */
export async function translateDiagnosisSession(
  sessionId: string,
  targetLanguage: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const model = google("gemini-2.0-flash");
    const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    const { data: session } = await supabase
      .from("diagnosis_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (session) {
      const payload = {
        primary_diagnosis: session.primary_diagnosis,
        constitution: session.constitution,
        symptoms: session.symptoms,
        medicines: session.medicines,
        clinical_notes: session.clinical_notes,
        treatment_plan: session.treatment_plan,
      };

      const { object } = await generateObject({
        model,
        schema: z.object({
          primary_diagnosis: z.string().nullable().optional(),
          constitution: z.string().nullable().optional(),
          symptoms: z.array(z.string()).nullable().optional(),
          medicines: z.array(z.string()).nullable().optional(),
          clinical_notes: z.string().nullable().optional(),
          treatment_plan: z.string().nullable().optional(),
        }),
        prompt: `Translate the values in this medical record to ${langName}. Return null for null inputs. Maintain Markdown formatting in notes.
        IMPORTANT: Translate strictly to ${langName}. Do not keep English unless it is a proper noun without translation.
        Input: ${JSON.stringify(payload)}`,
      });

      await supabase
        .from("diagnosis_sessions")
        .update({
          primary_diagnosis: object.primary_diagnosis ?? session.primary_diagnosis,
          constitution: object.constitution ?? session.constitution,
          symptoms: object.symptoms ?? session.symptoms,
          medicines: object.medicines ?? session.medicines,
          clinical_notes: object.clinical_notes ?? session.clinical_notes,
          treatment_plan: object.treatment_plan ?? session.treatment_plan,
        })
        .eq("id", sessionId);
    }

    return { success: true };
  } catch (error) {
    devLog("error", "Translation", `Session ${sessionId} failed`, { error });
    return { success: false, error: "Session translation failed" };
  }
}
