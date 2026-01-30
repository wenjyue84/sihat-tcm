"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tcmPulseQualities, pulseQualityConflicts, PulseCheckData } from "./types";

interface UsePulseCheckOptions {
  initialData?: Partial<PulseCheckData>;
  onComplete: (data: PulseCheckData) => void;
  onBack?: () => void;
  t: any; // Language translations
}

// Camera PPG capability detection
async function checkCameraCapability(): Promise<boolean> {
  // Quick checks for known unsupported environments
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid;

  console.log("[Camera PPG] Device check:", { isIOS, isAndroid, isMobile, userAgent });

  // iOS doesn't support torch
  if (isIOS) {
    console.log("[Camera PPG] iOS detected - torch not supported");
    return false;
  }

  // Desktop webcams don't have flash
  if (!isMobile) {
    console.log("[Camera PPG] Desktop detected - no flash available");
    return false;
  }

  // Check for secure context (HTTPS required for camera on non-localhost)
  if (typeof window !== "undefined" && !window.isSecureContext) {
    console.log(
      "[Camera PPG] Not a secure context (HTTPS required for camera on network addresses)"
    );
    return false;
  }

  // Check for camera and torch capability
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("[Camera PPG] MediaDevices API not available");
      return false;
    }

    // Try to get camera access to check capabilities
    console.log("[Camera PPG] Requesting camera access...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();

    // Stop the stream immediately
    stream.getTracks().forEach((t) => t.stop());

    // Check if torch is available
    const hasTorch = !!(capabilities && "torch" in capabilities);
    console.log("[Camera PPG] Torch capability:", hasTorch, capabilities);

    return hasTorch;
  } catch (err) {
    console.log("[Camera PPG] Camera access error:", err);
    return false;
  }
}

export function usePulseCheck({ initialData, onComplete, onBack, t }: UsePulseCheckOptions) {
  // BPM State
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(initialData?.bpm || null);
  const [manualBpm, setManualBpm] = useState<string>(
    initialData?.bpm ? String(initialData.bpm) : ""
  );
  const [inputMode, setInputMode] = useState<"tap" | "manual" | "camera">("manual");

  // Camera capability state
  const [showCameraOption, setShowCameraOption] = useState(false);
  const [isCheckingCamera, setIsCheckingCamera] = useState(true);

  // TCM Qualities State
  const [selectedPulseQualities, setSelectedPulseQualities] = useState<string[]>(
    initialData?.pulseQualities?.map((q) => q.id) || []
  );
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Wizard State
  const [wizardStep, setWizardStep] = useState<"bpm" | "qualities">("bpm");

  // Refs for stable callbacks (avoid stale closures in navigation handlers)
  const bpmRef = useRef(bpm);
  const manualBpmRef = useRef(manualBpm);
  const inputModeRef = useRef(inputMode);
  const selectedPulseQualitiesRef = useRef(selectedPulseQualities);
  const wizardStepRef = useRef(wizardStep);

  useEffect(() => {
    bpmRef.current = bpm;
    manualBpmRef.current = manualBpm;
    inputModeRef.current = inputMode;
    selectedPulseQualitiesRef.current = selectedPulseQualities;
    wizardStepRef.current = wizardStep;
  }, [bpm, manualBpm, inputMode, selectedPulseQualities, wizardStep]);

  // Check camera capability on mount
  useEffect(() => {
    let mounted = true;

    checkCameraCapability().then((hasCamera) => {
      if (mounted) {
        setShowCameraOption(hasCamera);
        setIsCheckingCamera(false);
        // Debug log for troubleshooting
        console.log("[Camera PPG] Capability check result:", {
          hasCamera,
          isSecureContext: typeof window !== "undefined" && window.isSecureContext,
          protocol: typeof window !== "undefined" && window.location.protocol,
          userAgent: typeof navigator !== "undefined" && navigator.userAgent,
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Tap Handler for BPM calculation
  const handleTap = useCallback(() => {
    const now = Date.now();
    setTaps((prev) => {
      const newTaps = [...prev, now];
      if (newTaps.length > 2) {
        const intervals: number[] = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.round(60000 / avgInterval));
      }
      return newTaps;
    });
  }, []);

  const resetTaps = useCallback(() => {
    setTaps([]);
    setBpm(null);
  }, []);

  const handleManualInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) <= 200)) {
      setManualBpm(value);
    }
  }, []);

  // Handle BPM detected from camera
  const handleCameraBpm = useCallback((detectedBpm: number) => {
    setBpm(detectedBpm);
    setManualBpm(String(detectedBpm));
    setInputMode("manual"); // Switch back to manual mode to show the result
  }, []);

  // Pulse Quality Toggle with Conflict Detection
  const togglePulseQuality = useCallback(
    (id: string) => {
      setConflictWarning(null);

      setSelectedPulseQualities((prev) => {
        if (prev.includes(id)) {
          return prev.filter((q) => q !== id);
        }

        const conflictingId = pulseQualityConflicts[id]?.find((c) => prev.includes(c));

        if (conflictingId) {
          // Generate warning message
          const warningKey = [id, conflictingId].sort().join("_");
          const warningMsg =
            t.pulse?.conflicts?.[warningKey] || `Cannot select conflicting pulse qualities.`;
          setConflictWarning(warningMsg);
          return prev;
        }

        return [...prev, id];
      });
    },
    [t]
  );

  // Finish handler - submits final data
  const finish = useCallback(() => {
    const inputMode = inputModeRef.current;
    const manualBpm = manualBpmRef.current;
    const bpm = bpmRef.current;
    const selectedPulseQualities = selectedPulseQualitiesRef.current;

    const finalBpm = inputMode === "manual" ? parseInt(manualBpm) || 70 : bpm || 70;
    const qualities = selectedPulseQualities
      .map((id) => {
        const quality = tcmPulseQualities.find((q) => q.id === id);
        return quality ? { id, nameZh: quality.nameZh, nameEn: quality.nameEn } : null;
      })
      .filter(Boolean) as { id: string; nameZh: string; nameEn: string }[];

    onComplete({
      bpm: finalBpm,
      pulseQualities: qualities,
    });
  }, [onComplete]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    const wizardStep = wizardStepRef.current;
    const inputMode = inputModeRef.current;
    const manualBpm = manualBpmRef.current;
    const bpm = bpmRef.current;

    if (wizardStep === "bpm") {
      const isBpmComplete = inputMode === "manual" ? manualBpm !== "" : bpm !== null;
      if (isBpmComplete) {
        setWizardStep("qualities");
      } else {
        setInputMode("manual");
      }
    } else {
      finish();
    }
  }, [finish]);

  const handleBack = useCallback(() => {
    const wizardStep = wizardStepRef.current;
    if (wizardStep === "qualities") {
      setWizardStep("bpm");
    } else {
      onBack?.();
    }
  }, [onBack]);

  return {
    // BPM State
    taps,
    bpm,
    manualBpm,
    inputMode,
    setInputMode,
    handleTap,
    resetTaps,
    handleManualInput,

    // Camera State
    showCameraOption,
    isCheckingCamera,
    handleCameraBpm,

    // Qualities State
    selectedPulseQualities,
    conflictWarning,
    togglePulseQuality,

    // Wizard State
    wizardStep,
    setWizardStep,

    // Navigation
    handleNext,
    handleBack,
    finish,
  };
}
