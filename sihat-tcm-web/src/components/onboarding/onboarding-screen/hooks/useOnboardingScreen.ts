"use client";

import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/stores/useAppStore";
import { useOnboarding } from "@/stores/useAppStore";
import { SLIDES, ONBOARDING_TEXT } from "../constants";
import type { OnboardingTranslations, SupportedLanguage } from "../types";

export function useOnboardingScreen() {
  const { language, setLanguage } = useLanguage();
  const { completeOnboarding } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);

  const t: OnboardingTranslations =
    ONBOARDING_TEXT[language as SupportedLanguage] || ONBOARDING_TEXT.en;
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleStart = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleLanguageChange = useCallback(
    (lang: SupportedLanguage) => {
      setLanguage(lang);
    },
    [setLanguage]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentIndex < SLIDES.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, handleSkip]);

  return {
    currentIndex,
    t,
    language: language as SupportedLanguage,
    isLastSlide,
    totalSlides: SLIDES.length,
    handleNext,
    handleSkip,
    handleStart,
    handleLanguageChange,
  };
}
