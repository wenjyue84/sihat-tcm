/**
 * Hook for managing profile data in UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
// Profile type from useAuth hook
type UserProfile = {
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  medical_history?: string | null;
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
};

interface ProfileData {
  full_name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  medical_history: string;
}

interface UseUnifiedDashboardProfileReturn {
  profileData: ProfileData;
  editingProfile: boolean;
  savingProfile: boolean;
  setEditingProfile: (editing: boolean) => void;
  handleSaveProfile: () => Promise<void>;
  handleUpdateProfileField: (field: string, value: string) => Promise<void>;
}

export function useUnifiedDashboardProfile(
  userId: string | undefined,
  profile: UserProfile | null | undefined,
  refreshProfile: () => Promise<void>
): UseUnifiedDashboardProfileReturn {
  const [profileData, setProfileData] = useState<ProfileData>({
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

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setSavingProfile(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          age: parseInt(profileData.age) || null,
          gender: profileData.gender,
          height: parseFloat(profileData.height) || null,
          weight: parseFloat(profileData.weight) || null,
          medical_history: profileData.medical_history,
        })
        .eq("id", userId);

      if (error) throw error;

      setEditingProfile(false);
      await refreshProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle individual field update (for inline editing)
  const handleUpdateProfileField = async (field: string, value: string) => {
    if (!userId) return;

    try {
      // Update local state immediately for optimistic update
      setProfileData((prev) => ({ ...prev, [field]: value }));

      // Prepare update object
      const updateData: Record<string, unknown> = { [field]: value };

      // Convert numeric fields
      if (field === "age") {
        updateData.age = parseInt(value) || null;
      } else if (field === "height" || field === "weight") {
        updateData[field] = parseFloat(value) || null;
      }

      // Update in database
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      // Refresh profile to get latest data
      await refreshProfile();
    } catch (error) {
      console.error("Error updating profile field:", error);
      // Revert on error
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
      alert("Failed to update. Please try again.");
    }
  };

  return {
    profileData,
    editingProfile,
    savingProfile,
    setEditingProfile,
    handleSaveProfile,
    handleUpdateProfileField,
  };
}

