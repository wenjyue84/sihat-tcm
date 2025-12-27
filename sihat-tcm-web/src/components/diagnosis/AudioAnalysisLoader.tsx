"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/stores/useAppStore";
import { Mic, Volume2, Wind, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface AudioAnalysisLoaderProps {
  onSkip: () => void;
}

const analysisSteps = [
  { icon: Volume2, label: "Analyzing voice quality...", color: "from-blue-500 to-indigo-500" },
  { icon: Wind, label: "Detecting breathing patterns...", color: "from-cyan-500 to-teal-500" },
  {
    icon: MessageSquare,
    label: "Evaluating speech patterns...",
    color: "from-violet-500 to-purple-500",
  },
  { icon: Mic, label: "Listening for cough sounds...", color: "from-rose-500 to-pink-500" },
];

export function AudioAnalysisLoader({ onSkip }: AudioAnalysisLoaderProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSkipOption, setShowSkipOption] = useState(false);

  useEffect(() => {
    // Cycle through analysis steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % analysisSteps.length);
    }, 2000);

    // Show skip option after 5 seconds
    const skipTimer = setTimeout(() => {
      setShowSkipOption(true);
    }, 5000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(skipTimer);
    };
  }, []);

  const CurrentIcon = analysisSteps[currentStep].icon;

  return (
    <Card className="p-8 bg-gradient-to-br from-white to-green-50/50 border-green-100">
      <div className="flex flex-col items-center space-y-6">
        {/* Main Animated Icon */}
        <div className="relative">
          {/* Outer pulsing ring */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-ping opacity-20"
            style={{ animationDuration: "2s" }}
          />

          {/* Middle rotating ring */}
          <div
            className="absolute -inset-2 rounded-full border-2 border-dashed border-green-300 animate-spin"
            style={{ animationDuration: "8s" }}
          />

          {/* Icon container */}
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${analysisSteps[currentStep].color} flex items-center justify-center shadow-xl relative z-10`}
          >
            <CurrentIcon className="w-9 h-9 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-800">Analyzing Your Recording</h3>
          <p className="text-gray-500 text-sm">闻诊 (Wén Zhěn) - Listening Diagnosis</p>
        </div>

        {/* Current Step Indicator */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm w-full max-w-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
            <span className="text-gray-700 font-medium">{analysisSteps[currentStep].label}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2">
          {analysisSteps.map((step, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "bg-green-500 scale-125"
                  : idx < currentStep
                    ? "bg-green-300"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Analysis Categories Being Processed */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          {analysisSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center ${
                    isActive ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span
                  className={`text-xs ${isActive ? "text-green-700 font-medium" : "text-gray-500"}`}
                >
                  {step.label.replace("...", "")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skip Option */}
        {showSkipOption && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center space-y-3 pt-2">
            <p className="text-sm text-gray-500">
              Taking too long? You can skip and view the analysis later.
            </p>
            <Button
              variant="outline"
              onClick={onSkip}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Skip & View Later
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
