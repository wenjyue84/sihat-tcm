import { useState, useEffect } from "react";
import { useAuth } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";

/**
 * Custom hook for managing profile state and operations
 * Extracted from UnifiedDashboard to improve maintainability
 */
export function useProfileManagement() {
  const { profile, refreshProfile } = useAuth();

  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    medical_history: "",
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        age: profile.age?.toString() || "",
        gender: profile.gender || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        medical_history: profile.medical_history || "",
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSavingProfile(true);
    try {
      const updates: Record<string, unknown> = {};

      if (profileData.full_name) updates.full_name = profileData.full_name;
      if (profileData.age) updates.age = parseInt(profileData.age) || null;
      if (profileData.gender) updates.gender = profileData.gender;
      if (profileData.height) updates.height = parseInt(profileData.height) || null;
      if (profileData.weight) updates.weight = parseFloat(profileData.weight) || null;
      if (profileData.medical_history !== undefined)
        updates.medical_history = profileData.medical_history;

      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      setEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateProfileField = async (field: string, value: string) => {
    if (!profile) return;

    setProfileData((prev) => ({ ...prev, [field]: value }));

    // Auto-save after a short delay
    const timeoutId = setTimeout(async () => {
      try {
        const updates: Record<string, unknown> = { [field]: value };

        // Convert numeric fields
        if (field === "age" || field === "height") {
          updates[field] = value ? parseInt(value) || null : null;
        } else if (field === "weight") {
          updates[field] = value ? parseFloat(value) || null : null;
        }

        const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);

        if (error) throw error;
        await refreshProfile();
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  return {
    profileData,
    editingProfile,
    savingProfile,
    setProfileData,
    setEditingProfile,
    handleSaveProfile,
    handleUpdateProfileField,
  };
}
