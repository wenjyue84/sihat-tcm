"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // For testing purposes
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = "sihat-tcm-onboarding-completed";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize onboarding state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setHasCompletedOnboarding(completed === "true");
    setIsLoading(false);
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  // Reset onboarding (for testing)
  const resetOnboarding = useCallback(() => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isLoading,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
