/**
 * VoiceEnabledDiagnosisWizard - Enhanced diagnosis wizard with voice command integration
 *
 * This component wraps the existing DiagnosisWizard with:
 * - Voice command navigation
 * - Voice feedback for accessibility
 * - Voice-to-text input for symptoms
 * - Multi-language voice support
 */

"use client";

import React, { useEffect, useCallback } from "react";
import DiagnosisWizard from "./DiagnosisWizard";
import { VoiceCommandProvider } from "@/components/ui/VoiceCommandProvider";
import { VoiceCommandIndicator } from "@/components/ui/VoiceCommandIndicator";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useAccessibilityContext } from "@/stores/useAppStore";

interface VoiceEnabledDiagnosisWizardProps {
  enableVoiceCommands?: boolean;
  enableVoiceFeedback?: boolean;
  showVoiceIndicator?: boolean;
  voiceIndicatorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function VoiceEnabledDiagnosisWizard({
  enableVoiceCommands = true,
  enableVoiceFeedback = true,
  showVoiceIndicator = true,
  voiceIndicatorPosition = "top-right",
}: VoiceEnabledDiagnosisWizardProps) {
  const { navigationState } = useDiagnosisProgress();
  const { language } = useLanguage();
  const { isScreenReaderEnabled, announce } = useAccessibilityContext();

  // Handle voice navigation commands
  const handleVoiceNavigation = useCallback(
    (action: string) => {
      switch (action) {
        case "next":
          if (navigationState?.onNext && navigationState.canNext) {
            navigationState.onNext();
            announce("Moving to next step", "polite");
          } else {
            announce("Cannot proceed to next step at this time", "assertive");
          }
          break;

        case "back":
          if (navigationState?.onBack) {
            navigationState.onBack();
            announce("Going back to previous step", "polite");
          } else {
            announce("Cannot go back from this step", "assertive");
          }
          break;

        case "skip":
          if (navigationState?.onSkip) {
            navigationState.onSkip();
            announce("Skipping current step", "polite");
          } else {
            announce("Cannot skip this step", "assertive");
          }
          break;

        default:
          console.warn("[VoiceEnabledDiagnosisWizard] Unknown navigation action:", action);
      }
    },
    [navigationState, announce]
  );

  // Handle general voice actions (for audio recording, etc.)
  useEffect(() => {
    const handleVoiceAction = (event: CustomEvent) => {
      const { action } = event.detail;

      switch (action) {
        case "start_recording":
          // Trigger audio recording start if on audio step
          const startRecordingEvent = new CustomEvent("audio-start-recording");
          window.dispatchEvent(startRecordingEvent);
          break;

        case "stop_recording":
          // Trigger audio recording stop if on audio step
          const stopRecordingEvent = new CustomEvent("audio-stop-recording");
          window.dispatchEvent(stopRecordingEvent);
          break;

        default:
          console.log("[VoiceEnabledDiagnosisWizard] Unhandled voice action:", action);
      }
    };

    window.addEventListener("voice-action", handleVoiceAction as EventListener);

    return () => {
      window.removeEventListener("voice-action", handleVoiceAction as EventListener);
    };
  }, []);

  // Announce step changes for accessibility
  useEffect(() => {
    if (isScreenReaderEnabled && enableVoiceFeedback) {
      // This would be enhanced to provide step-specific announcements
      const stepNames: Record<string, string> = {
        basic_info: "Basic Information Step",
        wen_inquiry: "Medical Inquiry Step",
        wang_tongue: "Tongue Examination Step",
        wang_face: "Face Examination Step",
        wang_part: "Body Part Examination Step",
        wen_audio: "Voice Analysis Step",
        qie: "Pulse Examination Step",
        smart_connect: "Smart Device Connection Step",
        summary: "Diagnosis Summary Step",
        processing: "Processing Results",
        report: "Diagnosis Report",
      };

      // This would need to be connected to the actual step state from the wizard
      // For now, it's a placeholder for the integration
    }
  }, [isScreenReaderEnabled, enableVoiceFeedback, language]);

  return (
    <VoiceCommandProvider
      enabled={enableVoiceCommands}
      enableFeedback={enableVoiceFeedback && isScreenReaderEnabled}
      enableCommands={enableVoiceCommands}
      enableDictation={true}
      onNavigationCommand={handleVoiceNavigation}
    >
      <div className="relative">
        {/* Original Diagnosis Wizard */}
        <DiagnosisWizard />

        {/* Voice Command Indicator */}
        {showVoiceIndicator && enableVoiceCommands && (
          <VoiceCommandIndicator
            position={voiceIndicatorPosition}
            showHelp={true}
            showSettings={true}
            compact={false}
          />
        )}
      </div>
    </VoiceCommandProvider>
  );
}

export default VoiceEnabledDiagnosisWizard;
