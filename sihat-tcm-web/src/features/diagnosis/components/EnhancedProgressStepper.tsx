/**
 * Enhanced Progress Stepper Component
 *
 * Enhanced version of the diagnosis progress stepper with:
 * - Estimated completion time calculation
 * - Step-by-step guidance tooltips
 * - Comprehensive accessibility features (WCAG 2.1 AA compliance)
 * - Auto-save integration
 * - Real-time progress updates
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  User,
  MessageCircle,
  Camera,
  Mic,
  Activity,
  FileText,
  Wifi,
  Clock,
  HelpCircle,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiagnosisSession } from "@/features/diagnosis/hooks/useDiagnosisSession";
import { useAccessibilityContext } from "@/stores/useAppStore";
import { AccessibleButton } from "@/components/ui/AccessibleButton";
import { Progress } from "@/components/ui/progress";

export interface StepDefinition {
  id: string;
  label: string;
  description: string;
  estimatedDuration: number; // in minutes
  isOptional?: boolean;
  prerequisites?: string[];
  guidance?: {
    title: string;
    content: string;
    tips?: string[];
  };
}

export interface EnhancedProgressStepperProps {
  currentStep: string;
  steps: StepDefinition[];
  onStepClick?: (stepId: string) => void;
  showTimeEstimate?: boolean;
  showGuidance?: boolean;
  showAutoSaveStatus?: boolean;
  className?: string;
  variant?: "default" | "compact" | "detailed";
  enableKeyboardNavigation?: boolean;
}

export function EnhancedProgressStepper({
  currentStep,
  steps,
  onStepClick,
  showTimeEstimate = true,
  showGuidance = true,
  showAutoSaveStatus = true,
  className,
  variant = "default",
  enableKeyboardNavigation = true,
}: EnhancedProgressStepperProps) {
  const [sessionState] = useDiagnosisSession();
  const { announce, manager } = useAccessibilityContext();
  const [showGuidanceTooltip, setShowGuidanceTooltip] = useState<string | null>(null);
  const [focusedStepIndex, setFocusedStepIndex] = useState<number>(-1);

  // Calculate progress and time estimates
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercentage = ((completedSteps + 1) / steps.length) * 100;

  const timeEstimates = useMemo(() => {
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const completedTime = steps
      .slice(0, completedSteps)
      .reduce((sum, step) => sum + step.estimatedDuration, 0);
    const remainingTime = totalTime - completedTime;

    return {
      total: totalTime,
      completed: completedTime,
      remaining: remainingTime,
      currentStepTime: steps[currentStepIndex]?.estimatedDuration || 0,
    };
  }, [steps, completedSteps, currentStepIndex]);

  // Format time display
  const formatTime = useCallback((minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  // Get step icon
  const getStepIcon = useCallback((stepId: string, isCompleted: boolean, isCurrent: boolean) => {
    const iconProps = {
      className: cn("transition-all duration-200", isCurrent ? "w-5 h-5" : "w-4 h-4"),
      "aria-hidden": true as const,
    };

    if (isCompleted) {
      return (
        <CheckCircle2 {...iconProps} className={cn(iconProps.className, "text-emerald-600")} />
      );
    }

    switch (stepId) {
      case "basic_info":
        return <User {...iconProps} />;
      case "wen_inquiry":
        return <MessageCircle {...iconProps} />;
      case "wang_tongue":
      case "wang_face":
      case "wang_part":
        return <Camera {...iconProps} />;
      case "wen_audio":
        return <Mic {...iconProps} />;
      case "qie":
        return <Activity {...iconProps} />;
      case "smart_connect":
        return <Wifi {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  }, []);

  // Handle step navigation
  const handleStepClick = useCallback(
    (stepId: string, index: number) => {
      if (index <= completedSteps && onStepClick) {
        onStepClick(stepId);
        announce(`Navigating to ${steps[index].label}`, "polite");
      }
    },
    [completedSteps, onStepClick, announce, steps]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, stepId: string, index: number) => {
      if (!enableKeyboardNavigation) return;

      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          handleStepClick(stepId, index);
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          if (index < steps.length - 1) {
            setFocusedStepIndex(index + 1);
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          if (index > 0) {
            setFocusedStepIndex(index - 1);
          }
          break;
        case "Home":
          event.preventDefault();
          setFocusedStepIndex(0);
          break;
        case "End":
          event.preventDefault();
          setFocusedStepIndex(steps.length - 1);
          break;
      }
    },
    [enableKeyboardNavigation, handleStepClick, steps.length]
  );

  // Show guidance tooltip
  const handleShowGuidance = useCallback(
    (stepId: string) => {
      setShowGuidanceTooltip(stepId);
      const step = steps.find((s) => s.id === stepId);
      if (step?.guidance) {
        announce(`Guidance for ${step.label}: ${step.guidance.content}`, "polite");
      }
    },
    [steps, announce]
  );

  // Auto-save status component
  const AutoSaveStatus = () => {
    if (!showAutoSaveStatus) return null;

    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {sessionState.isSaving ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600" />
            <span>Saving...</span>
          </>
        ) : sessionState.lastSaved ? (
          <>
            <Save className="w-3 h-3 text-emerald-600" />
            <span>Saved {sessionState.lastSaved.toLocaleTimeString()}</span>
          </>
        ) : null}

        {sessionState.saveError && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Save failed</span>
          </div>
        )}
      </div>
    );
  };

  // Time estimate component
  const TimeEstimate = () => {
    if (!showTimeEstimate) return null;

    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>
          {timeEstimates.remaining > 0
            ? `${formatTime(timeEstimates.remaining)} remaining`
            : "Complete"}
        </span>
      </div>
    );
  };

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={cn("w-full mb-4", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">{steps[currentStepIndex]?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <TimeEstimate />
            <AutoSaveStatus />
          </div>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2"
          aria-label={`Progress: ${Math.round(progressPercentage)}% complete`}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full mb-6", className)}>
      {/* Header with progress info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Diagnosis Progress</h2>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        <div className="flex items-center gap-4">
          <TimeEstimate />
          <AutoSaveStatus />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Progress
          value={progressPercentage}
          className="h-3"
          aria-label={`Diagnosis progress: ${Math.round(progressPercentage)}% complete`}
        />
      </div>

      {/* Steps */}
      <div className="relative" role="tablist" aria-label="Diagnosis steps">
        {/* Background line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Active line */}
        <motion.div
          className="absolute left-6 top-0 w-0.5 bg-emerald-500"
          initial={{ height: "0%" }}
          animate={{
            height: `${(completedSteps / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = index <= completedSteps && onStepClick;
          const isFocused = focusedStepIndex === index;

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex items-start gap-4 pb-6 last:pb-0",
                isClickable && "cursor-pointer group"
              )}
              role="tab"
              tabIndex={enableKeyboardNavigation ? (isFocused ? 0 : -1) : undefined}
              aria-selected={isCurrent}
              aria-controls={`step-panel-${step.id}`}
              onClick={() => isClickable && handleStepClick(step.id, index)}
              onKeyDown={(e) => handleKeyDown(e, step.id, index)}
              onFocus={() => setFocusedStepIndex(index)}
            >
              {/* Step indicator */}
              <motion.div
                className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200",
                  isCompleted || isCurrent
                    ? "bg-white border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-100"
                    : "bg-white border-gray-300 text-gray-400",
                  isCurrent && "ring-4 ring-emerald-100 scale-110",
                  isClickable && "group-hover:scale-105 group-hover:shadow-lg",
                  isFocused && "ring-2 ring-blue-500"
                )}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white bg-emerald-500 rounded-full p-1" />
                ) : (
                  getStepIcon(step.id, isCompleted, isCurrent)
                )}
              </motion.div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium transition-colors",
                        isCurrent ? "text-emerald-700" : "text-gray-900"
                      )}
                    >
                      {step.label}
                      {step.isOptional && (
                        <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                      )}
                    </h3>

                    {showGuidance && step.guidance && (
                      <AccessibleButton
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowGuidance(step.id);
                        }}
                        aria-label={`Show guidance for ${step.label}`}
                        announceOnClick={`Showing guidance for ${step.label}`}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </AccessibleButton>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {step.estimatedDuration > 0 && (
                      <span>{formatTime(step.estimatedDuration)}</span>
                    )}
                    {isClickable && (
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                {/* Prerequisites */}
                {step.prerequisites && step.prerequisites.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Prerequisites: {step.prerequisites.join(", ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidance tooltip */}
      <AnimatePresence>
        {showGuidanceTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowGuidanceTooltip(null)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const step = steps.find((s) => s.id === showGuidanceTooltip);
                if (!step?.guidance) return null;

                return (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.guidance.title}
                    </h3>
                    <p className="text-gray-700 mb-4">{step.guidance.content}</p>
                    {step.guidance.tips && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {step.guidance.tips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <AccessibleButton
                      onClick={() => setShowGuidanceTooltip(null)}
                      className="w-full"
                    >
                      Got it
                    </AccessibleButton>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedProgressStepper;
