"use server";

/**
 * Family Care Actions
 *
 * Server actions for managing family members and their diagnoses.
 *
 * @module actions/family
 */

import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/systemLogger";
import type {
    FamilyMember,
    FamilyMemberWithDiagnosis,
    SaveFamilyMemberInput,
    ActionResult,
} from "@/types/database";

/**
 * Get all family members for the current user
 * Includes their latest diagnosis summary
 */
export async function getFamilyMembers(): Promise<ActionResult<FamilyMemberWithDiagnosis[]>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data: members, error } = await supabase
            .from("family_members")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        // For each member, fetch latest diagnosis
        const membersWithDiagnosis = await Promise.all(
            (members || []).map(async (member) => {
                const { data: diagnosis } = await supabase
                    .from("diagnosis_sessions")
                    .select("created_at, primary_diagnosis, overall_score")
                    .eq("family_member_id", member.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...member,
                    lastDiagnosis: diagnosis
                        ? {
                            date: diagnosis.created_at,
                            diagnosis: diagnosis.primary_diagnosis,
                            score: diagnosis.overall_score,
                        }
                        : null,
                } as FamilyMemberWithDiagnosis;
            })
        );

        return { success: true, data: membersWithDiagnosis };
    } catch (error: unknown) {
        devLog("error", "Actions", "[getFamilyMembers] Error", { error });
        return { success: false, error: "Failed to fetch family members" };
    }
}

/**
 * Add a new family member
 */
export async function addFamilyMember(
    data: SaveFamilyMemberInput
): Promise<ActionResult<FamilyMember>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data: member, error } = await supabase
            .from("family_members")
            .insert({ ...data, user_id: user.id })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: member as FamilyMember };
    } catch (error: unknown) {
        devLog("error", "Actions", "[addFamilyMember] Error", { error });
        return { success: false, error: "Failed to add family member" };
    }
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(id: string): Promise<ActionResult> {
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
            .from("family_members")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        devLog("error", "Actions", "[deleteFamilyMember] Error", { error });
        return { success: false, error: "Failed to delete family member" };
    }
}
