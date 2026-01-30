/**
 * Hook for checking profile completeness and auto-filling form data
 * Extracted from BasicInfoForm.tsx to improve maintainability
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import type { BasicInfoData } from "../types";

interface UseProfileCompletenessOptions {
  /**
   * Whether to skip to step 2 if profile is complete
   */
  autoSkipToStep2?: boolean;
  /**
   * Current step number (for auto-skip logic)
   */
  currentStep?: number;
  /**
   * Callback when step should change
   */
  onStepChange?: (step: number, direction: number) => void;
  /**
   * Translation function
   */
  t?: any;
  /**
   * Whether to only check for patients (skip for admins/doctors)
   */
  patientsOnly?: boolean;
}

interface UseProfileCompletenessResult {
  /**
   * Whether profile completeness has been checked
   */
  hasCheckedProfile: boolean;
  /**
   * Whether the profile is complete
   */
  isProfileComplete: boolean;
  /**
   * Auto-filled form data from profile (if complete)
   */
  autoFilledData: Partial<BasicInfoData> | null;
  /**
   * Function to manually check profile completeness
   */
  checkProfile: () => void;
}

/**
 * Checks if a profile has all required fields for basic info
 */
export function validateProfileCompleteness(profile: any): boolean {
  return !!(
    profile?.full_name &&
    profile?.age &&
    profile?.gender &&
    profile?.height &&
    profile?.weight
  );
}

/**
 * Extracts basic info data from a profile
 */
export function extractProfileData(profile: Record<string, unknown> | null | undefined): Partial<BasicInfoData> {
  if (!profile) return {};
  return {
    name: (profile.full_name as string) || "",
    age: profile.age?.toString() || "",
    gender: (profile.gender as string) || "",
    weight: profile.weight?.toString() || "",
    height: profile.height?.toString() || "",
  };
}

/**
 * Hook for managing profile completeness check and auto-fill
 */
export function useProfileCompleteness(
  options: UseProfileCompletenessOptions = {}
): UseProfileCompletenessResult {
  const {
    autoSkipToStep2 = true,
    currentStep = 1,
    onStepChange,
    t,
    patientsOnly = true,
  } = options;

  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [autoFilledData, setAutoFilledData] = useState<Partial<BasicInfoData> | null>(null);

  const checkProfile = useCallback(() => {
    if (authLoading || !user || !profile) {
      return;
    }

    // Only perform profile completeness check for patients
    if (patientsOnly && profile.role !== "patient") {
      setHasCheckedProfile(true);
      setIsProfileComplete(false);
      setAutoFilledData(null);
      return;
    }

    const complete = validateProfileCompleteness(profile);

    if (complete) {
      const extracted = extractProfileData(profile as unknown as Record<string, unknown>);
      setAutoFilledData(extracted);
      setIsProfileComplete(true);

      // Auto-skip to step 2 if enabled and currently on step 1
      if (autoSkipToStep2 && currentStep === 1 && onStepChange) {
        onStepChange(2, 1);
      }
    } else {
      setIsProfileComplete(false);
      setAutoFilledData(null);

      // Profile incomplete - Prompt patient to complete it
      // We use a small timeout to ensure UI is ready
      setTimeout(() => {
        if (
          confirm(
            t.basicInfo?.lockedProfile?.profileIncomplete ||
            "Your profile is incomplete. Please complete your details in the Patient Portal first."
          )
        ) {
          router.push("/patient");
        }
      }, 500);
    }

    setHasCheckedProfile(true);
  }, [
    authLoading,
    user,
    profile,
    patientsOnly,
    autoSkipToStep2,
    currentStep,
    onStepChange,
    t,
    router,
  ]);

  // Auto-check on mount and when dependencies change
  useEffect(() => {
    if (!hasCheckedProfile && !authLoading && user && profile) {
      checkProfile();
    }
  }, [hasCheckedProfile, authLoading, user, profile, checkProfile]);

  return {
    hasCheckedProfile,
    isProfileComplete,
    autoFilledData,
    checkProfile,
  };
}

