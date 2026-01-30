"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCameraHeartRate } from "@/hooks/useCameraHeartRate";
import {
  Camera,
  X,
  Flashlight,
  FlashlightOff,
  Heart,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraPulseSensorProps {
  onBpmDetected: (bpm: number) => void;
  onCancel: () => void;
  t: any; // Translations
}

export function CameraPulseSensor({ onBpmDetected, onCancel, t }: CameraPulseSensorProps) {
  const [confirmedBpm, setConfirmedBpm] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isActive,
    isInitializing,
    signalData,
    error,
    startMeasurement,
    stopMeasurement,
    videoRef,
    canvasRef,
  } = useCameraHeartRate({
    onBpmDetected: (bpm) => {
      // Only auto-confirm if signal is very stable
      if (signalData.isStable && signalData.signalQuality >= 80) {
        setConfirmedBpm(bpm);
      }
    },
    onError: (err) => {
      console.error("Camera heart rate error:", err);
    },
  });

  // Start measurement on mount
  useEffect(() => {
    startMeasurement();

    return () => {
      stopMeasurement();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [startMeasurement, stopMeasurement]);

  // Countdown timer when active
  useEffect(() => {
    if (isActive && !confirmedBpm) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isActive, confirmedBpm]);

  // Handle confirm button
  const handleConfirm = () => {
    if (signalData.bpm !== null) {
      onBpmDetected(signalData.bpm);
    }
  };

  // Handle confirmed BPM auto-submit
  useEffect(() => {
    if (confirmedBpm !== null) {
      // Small delay to show the confirmed state
      const timer = setTimeout(() => {
        onBpmDetected(confirmedBpm);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmedBpm, onBpmDetected]);

  // Translations with fallbacks
  const translations = {
    title: t.pulse?.cameraMeasurement?.title || "Measuring Heart Rate",
    placeFingerInstruction:
      t.pulse?.cameraMeasurement?.placeFingerInstruction ||
      "Place your finger over the camera lens",
    coverFlash:
      t.pulse?.cameraMeasurement?.coverFlash || "Cover the flash completely with your fingertip",
    holdStill: t.pulse?.cameraMeasurement?.holdStill || "Hold still for 10 seconds",
    detectingPulse: t.pulse?.cameraMeasurement?.detectingPulse || "Detecting pulse...",
    signalQuality: t.pulse?.cameraMeasurement?.signalQuality || "Signal Quality",
    weak: t.pulse?.cameraMeasurement?.weak || "Weak",
    good: t.pulse?.cameraMeasurement?.good || "Good",
    excellent: t.pulse?.cameraMeasurement?.excellent || "Excellent",
    stable: t.pulse?.cameraMeasurement?.stable || "Stable",
    useThisReading: t.pulse?.cameraMeasurement?.useThisReading || "Use This Reading",
    cancel: t.pulse?.cancel || "Cancel",
    flashUnavailable:
      t.pulse?.cameraMeasurement?.flashUnavailable || "Flash unavailable - please use manual mode",
    initializing: t.pulse?.cameraMeasurement?.initializing || "Initializing camera...",
    pressFingerHarder:
      t.pulse?.cameraMeasurement?.pressFingerHarder || "Press finger harder on camera",
    detected: t.pulse?.cameraMeasurement?.detected || "Detected!",
  };

  // Signal quality label
  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return translations.excellent;
    if (quality >= 60) return translations.good;
    return translations.weak;
  };

  // Signal quality color
  const getQualityColor = (quality: number) => {
    if (quality >= 80) return "text-emerald-500";
    if (quality >= 60) return "text-amber-500";
    return "text-red-400";
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold">{translations.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopMeasurement();
            onCancel();
          }}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/50 rounded-lg border border-red-700">
          <FlashlightOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-300">{translations.flashUnavailable}</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Initializing State */}
      {isInitializing && !error && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Flashlight className="w-12 h-12 text-amber-400" />
          </motion.div>
          <p className="text-slate-300">{translations.initializing}</p>
        </div>
      )}

      {/* Active Measurement */}
      {isActive && !error && (
        <div className="space-y-4">
          {/* Video Preview - Hidden but functional */}
          <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay with instructions */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Pulsing finger indicator */}
              <motion.div
                className="relative"
                animate={signalData.bpm ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  duration: signalData.bpm ? 60 / signalData.bpm : 1,
                  repeat: Infinity,
                }}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/50 to-red-600/50 flex items-center justify-center border-4 border-rose-400/50">
                  <Heart
                    className={`w-12 h-12 ${signalData.bpm ? "text-rose-300" : "text-slate-400"}`}
                    fill={signalData.bpm ? "currentColor" : "none"}
                  />
                </div>

                {/* Ripple animation when detecting */}
                {signalData.signalQuality > 30 && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-rose-400"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-rose-400"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </motion.div>

              {/* Instruction text */}
              <p className="mt-4 text-center text-sm text-slate-300 max-w-[200px]">
                {signalData.signalQuality < 30
                  ? translations.placeFingerInstruction
                  : signalData.signalQuality < 60
                    ? translations.pressFingerHarder
                    : translations.holdStill}
              </p>
            </div>
          </div>

          {/* Signal Quality Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{translations.signalQuality}</span>
              <span className={getQualityColor(signalData.signalQuality)}>
                {getQualityLabel(signalData.signalQuality)}
                {signalData.isStable && (
                  <span className="ml-2 text-emerald-400">✓ {translations.stable}</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  signalData.signalQuality >= 80
                    ? "bg-emerald-500"
                    : signalData.signalQuality >= 60
                      ? "bg-amber-500"
                      : "bg-red-400"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${signalData.signalQuality}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* BPM Display */}
          <AnimatePresence mode="wait">
            {signalData.bpm ? (
              <motion.div
                key="bpm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-4"
              >
                <div className="flex items-center justify-center gap-3">
                  <Activity className="w-8 h-8 text-rose-400" />
                  <span className="text-5xl font-bold text-rose-300">{signalData.bpm}</span>
                  <span className="text-xl text-slate-400">BPM</span>
                </div>

                {/* Confirmed indicator */}
                {signalData.isStable && signalData.signalQuality >= 70 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 mt-2 text-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">{translations.detected}</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="detecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Heart className="w-6 h-6" />
                  </motion.div>
                  <span>{translations.detectingPulse}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {countdown > 0 ? `${countdown}s` : "..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Signal Visualization */}
          {signalData.filteredSignal.length > 0 && (
            <div className="h-16 bg-slate-800/50 rounded-lg overflow-hidden relative">
              <svg viewBox="0 0 60 40" preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  points={signalData.filteredSignal
                    .map((val, i) => {
                      // Normalize to 0-40 range
                      const maxAbs = Math.max(...signalData.filteredSignal.map(Math.abs), 1);
                      const normalized = (val / maxAbs + 1) * 20;
                      return `${i},${normalized}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                stopMeasurement();
                onCancel();
              }}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {translations.cancel}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!signalData.bpm || signalData.signalQuality < 50}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {translations.useThisReading}
            </Button>
          </div>

          {/* Tips */}
          <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">{translations.coverFlash}</p>
          </div>
        </div>
      )}
    </div>
  );
}

