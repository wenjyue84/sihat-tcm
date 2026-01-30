"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { QuickFix, DeskRoutine } from "../types";

interface UseExerciseTimerOptions {
  onComplete?: () => void;
}

export function useExerciseTimer(options: UseExerciseTimerOptions = {}) {
  const { onComplete } = options;

  const [isExercising, setIsExercising] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isExercising && !isPaused && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsExercising(false);
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isExercising, isPaused, countdown, onComplete]);

  const initializeForRoutine = useCallback((routine: QuickFix | DeskRoutine) => {
    setCountdown(routine.duration);
    setIsExercising(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentStep(0);
  }, []);

  const startExercise = useCallback((duration: number) => {
    setIsExercising(true);
    setIsPaused(false);
    setCountdown(duration);
    setCurrentStep(0);
  }, []);

  const pauseResume = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const cancel = useCallback((duration: number) => {
    setIsExercising(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentStep(0);
    setCountdown(duration);
  }, []);

  const reset = useCallback(() => {
    setIsExercising(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentStep(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const nextStep = useCallback((maxSteps: number) => {
    setCurrentStep((prev) => Math.min(maxSteps - 1, prev + 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
    };
  }, []);

  return {
    isExercising,
    isPaused,
    countdown,
    isCompleted,
    currentStep,
    initializeForRoutine,
    startExercise,
    pauseResume,
    cancel,
    reset,
    nextStep,
    prevStep,
    formatTime,
  };
}
