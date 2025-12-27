"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, ChevronRight, Eye, Brain, Sparkles } from "lucide-react";

interface ImageAnalysisLoaderProps {
  type: "tongue" | "face" | "part";
  onSkip: () => void;
}

import { useDiagnosisProgress } from "@/stores/useAppStore";

const ANALYSIS_TIPS = [
  { icon: Eye, text: "Examining visual characteristics..." },
  { icon: Brain, text: "Analyzing TCM patterns..." },
  { icon: Sparkles, text: "Identifying health indicators..." },
  { icon: Eye, text: "Checking color and texture..." },
  { icon: Brain, text: "Evaluating body constitution..." },
  { icon: Sparkles, text: "Processing diagnostic markers..." },
];

const TYPE_NAMES = {
  tongue: "Tongue",
  face: "Face",
  part: "Specific Area",
};

export function ImageAnalysisLoader({ type, onSkip }: ImageAnalysisLoaderProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Starting advanced analysis...");
  const { setNavigationState } = useDiagnosisProgress();

  // Hide global navigation during analysis
  useEffect(() => {
    setNavigationState({
      showNext: false,
      showBack: false,
      showSkip: false,
      hideBottomNav: true,
    });
  }, [setNavigationState]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate tips every 3 seconds
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % ANALYSIS_TIPS.length);
    }, 3000);
    return () => clearInterval(tipTimer);
  }, []);

  // Update status message based on time elapsed
  useEffect(() => {
    if (elapsedSeconds < 5) {
      setStatusMessage("Starting advanced analysis...");
    } else if (elapsedSeconds < 15) {
      setStatusMessage("Using deep analysis mode...");
    } else if (elapsedSeconds < 25) {
      setStatusMessage("Switching to faster analysis...");
    } else if (elapsedSeconds < 35) {
      setStatusMessage("Trying alternative method...");
    } else {
      setStatusMessage("Still working, please wait...");
    }
  }, [elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

  const CurrentTipIcon = ANALYSIS_TIPS[currentTipIndex].icon;

  return (
    <Card className="p-8 md:p-12">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        {/* Main loader */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          </div>
          {/* Timer badge */}
          <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-semibold text-emerald-800">
            Analyzing {TYPE_NAMES[type]}...
          </h3>
          <p className="text-stone-500 mt-1 text-sm">{statusMessage}</p>
        </div>

        {/* Rotating tips */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 w-full max-w-sm transition-all duration-500">
          <div className="flex items-center justify-center space-x-3">
            <CurrentTipIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800 text-sm">{ANALYSIS_TIPS[currentTipIndex].text}</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2">
          {ANALYSIS_TIPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentTipIndex ? "bg-emerald-600" : "bg-emerald-200"
              }`}
            />
          ))}
        </div>

        {/* Skip button */}
        <div className="pt-4 border-t border-stone-200 w-full">
          <p className="text-xs text-stone-400 mb-3">
            Don't want to wait? You can proceed and view results in the final report.
          </p>
          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Skip & Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
