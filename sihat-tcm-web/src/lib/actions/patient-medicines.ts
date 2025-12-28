"use server";

/**
 * Patient Medicines Actions
 *
 * Server actions for managing patient's current medications (Basic Profile).
 *
 * @module actions/patient-medicines
 */

import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import type { PatientMedicine, SavePatientMedicineInput, ActionResult } from "@/types/database";

/**
 * Get all medicines currently in use for the patient (Basic Profile)
 */
export async function getPatientMedicines(): Promise<ActionResult<PatientMedicine[]>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data, error } = await supabase
            .from("patient_medicines")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            devLog("error", "Actions", "[getPatientMedicines] Error", { error });
            return { success: false, error: error.message };
        }

        return { success: true, data: data as PatientMedicine[] };
    } catch (error: unknown) {
        devLog("error", "Actions", "[getPatientMedicines] Error", { error });
        return { success: false, error: "Failed to fetch medicines" };
    }
}

/**
 * Save or update a patient medicine
 */
export async function savePatientMedicine(
    medicine: SavePatientMedicineInput & { id?: string }
): Promise<ActionResult<PatientMedicine>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const medicineData = {
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            is_active: medicine.is_active,
            notes: medicine.notes,
            start_date: medicine.start_date,
            stop_date: medicine.stop_date,
            purpose: medicine.purpose,
            specialty: medicine.specialty,
            chinese_name: medicine.chinese_name,
            edited_by: medicine.edited_by,
            user_id: user.id,
        };

        if (medicine.id) {
            const { data, error } = await supabase
                .from("patient_medicines")
                .update(medicineData)
                .eq("id", medicine.id)
                .eq("user_id", user.id)
                .select()
                .single();

            if (error) return { success: false, error: error.message };
            return { success: true, data: data as PatientMedicine };
        } else {
            const { data, error } = await supabase
                .from("patient_medicines")
                .insert(medicineData)
                .select()
                .single();

            if (error) return { success: false, error: error.message };
            return { success: true, data: data as PatientMedicine };
        }
    } catch (error: unknown) {
        devLog("error", "Actions", "[savePatientMedicine] Error", { error });
        return { success: false, error: "Failed to save medicine" };
    }
}

/**
 * Delete a patient medicine
 */
export async function deletePatientMedicine(medicineId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error } = await supabase
            .from("patient_medicines")
            .delete()
            .eq("id", medicineId)
            .eq("user_id", user.id);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[deletePatientMedicine] Error", { error });
        return { success: false, error: "Failed to delete medicine" };
    }
}
