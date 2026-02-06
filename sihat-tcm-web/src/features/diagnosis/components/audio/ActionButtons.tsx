"use client";

import { Button } from "@/components/ui/button";
import { Circle, Square, Upload } from "lucide-react";
import type { RecordingState } from "./hooks";

interface ActionButtonsTranslations {
  startRecording: string;
  stopAndContinue: string;
  recordAgain: string;
  uploadAudio: string;
  or?: string;
  debugSkip?: string;
}

interface ActionButtonsProps {
  recordingState: RecordingState;
  connectionStatus: string;
  translations: ActionButtonsTranslations;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetake: () => void;
  onContinue: () => void;
  onUpload: () => void;
  onDebugSkip?: () => void;
  variant: "desktop" | "mobile";
}

/**
 * Action Buttons - Desktop and mobile button layouts
 */
export function ActionButtons({
  recordingState,
  connectionStatus,
  translations: t,
  onStartRecording,
  onStopRecording,
  onRetake,
  onContinue,
  onUpload,
  onDebugSkip,
  variant,
}: ActionButtonsProps) {
  const isIdle = recordingState === "idle";
  const isInitializing = recordingState === "initializing";
  const isRecording = recordingState === "recording";
  const isRecorded = recordingState === "recorded" || recordingState === "playing";

  if (variant === "desktop") {
    return (
      <div className="hidden md:flex mt-6 flex-col gap-3">
        <div className="flex gap-3">
          {/* Idle/Initializing state */}
          {(isIdle || isInitializing) && (
            <Button
              onClick={onStartRecording}
              disabled={isInitializing}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md disabled:opacity-80"
            >
              {isInitializing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {connectionStatus}
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2 fill-current" />
                  {t.startRecording}
                </>
              )}
            </Button>
          )}

          {/* Recording state */}
          {isRecording && (
            <Button
              onClick={onStopRecording}
              variant="destructive"
              className="flex-1 h-12 text-base font-semibold bg-red-500 hover:bg-red-600 shadow-md"
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              {t.stopAndContinue}
            </Button>
          )}

          {/* Recorded state */}
          {isRecorded && (
            <>
              <Button
                variant="outline"
                onClick={onRetake}
                className="h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                Retake
              </Button>
              <Button
                onClick={onContinue}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
              >
                Continue →
              </Button>
            </>
          )}
        </div>

        {/* Upload option in idle state */}
        {isIdle && (
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              onClick={onUpload}
              className="text-sm text-gray-500 hover:text-green-600 hover:bg-green-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.or} {t.uploadAudio}
            </Button>
            {onDebugSkip && (
              <Button
                variant="ghost"
                onClick={onDebugSkip}
                className="text-sm text-gray-500 hover:text-green-600 hover:bg-green-50"
              >
                {t.debugSkip}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Mobile variant
  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm px-4 py-3">
      <div className="flex gap-3">
        {/* Idle/Initializing state */}
        {(isIdle || isInitializing) && (
          <>
            <Button
              onClick={onStartRecording}
              disabled={isInitializing}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md disabled:opacity-80"
            >
              {isInitializing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {connectionStatus}
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2 fill-current" />
                  {t.startRecording}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onUpload}
              disabled={isInitializing}
              className="h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.uploadAudio}
            </Button>
          </>
        )}

        {/* Recording state */}
        {isRecording && (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="flex-1 h-12 text-base font-semibold bg-red-500 hover:bg-red-600 shadow-md"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            {t.stopAndContinue}
          </Button>
        )}

        {/* Recorded state */}
        {isRecorded && (
          <Button
            variant="outline"
            onClick={onRetake}
            className="flex-1 h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            {t.recordAgain}
          </Button>
        )}
      </div>
    </div>
  );
}
