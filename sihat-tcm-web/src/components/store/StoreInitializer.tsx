"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Component that initializes all store state on mount
 * This replaces the need for multiple context providers
 */
export function StoreInitializer() {
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const initializeDoctorLevel = useAppStore((state) => state.initializeDoctorLevel);
  const initializeLanguage = useAppStore((state) => state.initializeLanguage);
  const initializeAccessibility = useAppStore((state) => state.initializeAccessibility);
  const initializeOnboarding = useAppStore((state) => state.initializeOnboarding);
  const initializeDeveloper = useAppStore((state) => state.initializeDeveloper);
  const profile = useAppStore((state) => state.profile);

  // Initialize all stores that don't depend on profile
  useEffect(() => {
    const cleanupAuth = initializeAuth();
    initializeDoctorLevel();
    initializeAccessibility();
    initializeOnboarding();

    // Return cleanup function for auth subscription
    return cleanupAuth;
  }, [initializeAuth, initializeDoctorLevel, initializeAccessibility, initializeOnboarding]);

  // Initialize language after profile is loaded or changes
  useEffect(() => {
    initializeLanguage();
  }, [profile, initializeLanguage]);

  // Initialize developer mode when profile changes
  useEffect(() => {
    initializeDeveloper();
  }, [profile, initializeDeveloper]);

  return null;
}
