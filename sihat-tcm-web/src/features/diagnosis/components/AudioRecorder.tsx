"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AudioAnalysisLoader } from "./AudioAnalysisLoader";
import { AudioAnalysisResult } from "./AudioAnalysisResult";
import { useLanguage, useAppStore } from "@/stores/useAppStore";

// Import extracted components and hooks
import {
  useAudioRecording,
  useAudioPlayback,
  useAudioAnalysis,
  IdleState,
  InitializingState,
  RecordingState,
  RecordedState,
  MicErrorCard,
  ActionButtons,
  AudioIcon,
  EducationalContent,
  RecordingTips,
  type AudioAnalysisData,
} from "./audio";

interface AudioRecorderData {
  audio?: string | null;
  analysis?: AudioAnalysisData | null;
  analysisSkipped?: boolean;
  skipCelebration?: boolean;
  note?: string;
}

interface AudioRecorderProps {
  onComplete: (data: AudioRecorderData) => void;
  onBack?: () => void;
  initialData?: Partial<AudioRecorderData>;
}

export function AudioRecorder({
  onComplete,
  onBack,
  initialData,
}: AudioRecorderProps) {
  const { t, language } = useLanguage();
  // Use direct Zustand selector for stable function reference (avoids infinite loops)
  const setNavigationState = useAppStore((state) => state.setDiagnosisNavigationState);

  // Custom hooks for audio functionality
  const recording = useAudioRecording({ initialAudio: initialData?.audio });
  const analysis = useAudioAnalysis({ initialAnalysis: initialData?.analysis });

  // Playback needs to update recording state
  const handlePlaybackStateChange = useCallback((state: typeof recording.recordingState) => {
    // This is handled internally by the recording hook now
  }, []);

  const playback = useAudioPlayback({
    audioUrl: recording.audioUrl,
    onStateChange: handlePlaybackStateChange,
  });

  // UI state
  const [isSkipPromptOpen, setIsSkipPromptOpen] = useState(false);

  // Refs for navigation callbacks to avoid infinite loops
  const onCompleteRef = useRef(onComplete);
  const onBackRef = useRef(onBack);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onBackRef.current = onBack;
  }, [onComplete, onBack]);

  // Stable navigation handler for skip
  const handleSkipAnalysis = useCallback(() => {
    analysis.reset();
    onCompleteRef.current({
      audio: recording.audioData || null,
      analysisSkipped: true,
      skipCelebration: true,
      note: recording.audioData
        ? "Analysis skipped - will be processed with final diagnosis"
        : "Voice analysis skipped",
    });
  }, [analysis, recording.audioData]);

  // Retake recording
  const handleRetake = useCallback(() => {
    playback.reset();
    recording.reset();
    analysis.reset();
  }, [playback, recording, analysis]);

  // Continue with current recording - starts analysis
  const handleContinue = useCallback(() => {
    if (recording.audioData) {
      analysis.analyze(recording.audioData);
    }
  }, [recording.audioData, analysis]);

  // Continue after analysis result
  const handleContinueWithResult = useCallback((overriddenAnalysis?: AudioAnalysisData) => {
    if (recording.audioData) {
      onCompleteRef.current({
        audio: recording.audioData,
        analysis: overriddenAnalysis || analysis.analysisResult,
      });
    }
  }, [recording.audioData, analysis.analysisResult]);

  // Stable next handler
  const handleNext = useCallback(() => {
    if (analysis.analysisResult) {
      handleContinueWithResult();
    } else if (recording.audioData || recording.recordingState === "recorded") {
      handleContinue();
    } else {
      setIsSkipPromptOpen(true);
    }
  }, [analysis.analysisResult, recording.audioData, recording.recordingState, handleContinueWithResult, handleContinue]);

  // Stable back handler
  const handleBack = useCallback(() => {
    onBackRef.current?.();
  }, []);

  // Debug skip handler
  const handleDebugSkip = useCallback(() => {
    onComplete({
      audio: "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      skipCelebration: true,
    });
  }, [onComplete]);

  // Refs for navigation callbacks to avoid triggering useEffect on every render
  const handleNextRef = useRef(handleNext);
  const handleBackRef = useRef(handleBack);
  const handleSkipAnalysisRef = useRef(handleSkipAnalysis);

  // Keep callback refs updated
  useEffect(() => {
    handleNextRef.current = handleNext;
    handleBackRef.current = handleBack;
    handleSkipAnalysisRef.current = handleSkipAnalysis;
  });

  // Update global navigation state - only re-run when primitive values change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setNavigationState({
      onNext: () => handleNextRef.current(),
      onBack: onBack ? () => handleBackRef.current() : undefined,
      onSkip: () => handleSkipAnalysisRef.current(),
      showNext: true,
      showBack: !!onBack,
      showSkip: true,
      canNext: !analysis.isAnalyzing,
    });
  }, [setNavigationState, !!onBack, analysis.isAnalyzing]);

  // Show analysis loader while analyzing
  if (analysis.isAnalyzing) {
    return <AudioAnalysisLoader onSkip={handleSkipAnalysis} />;
  }

  // Show analysis result after analysis is complete
  if (analysis.analysisResult) {
    return (
      <AudioAnalysisResult
        analysisData={analysis.analysisResult as AudioAnalysisData}
        onRetake={handleRetake}
        onUpload={recording.triggerFileUpload}
        onContinue={handleContinueWithResult}
      />
    );
  }

  // Prepare translations for error card
  const errorTranslations = {
    permissionDenied: t.audio.errors?.permissionDenied,
    permissionDeniedDesc: t.audio.errors?.permissionDeniedDesc,
    permissionDeniedTip: t.audio.errors?.permissionDeniedTip,
    notFound: t.audio.errors?.notFound,
    notFoundDesc: t.audio.errors?.notFoundDesc,
    notFoundTip: t.audio.errors?.notFoundTip,
    busy: t.audio.errors?.busy,
    busyDesc: t.audio.errors?.busyDesc,
    busyTip: t.audio.errors?.busyTip,
    httpsRequired: t.audio.errors?.httpsRequired,
    httpsRequiredDesc: t.audio.errors?.httpsRequiredDesc,
    httpsRequiredTip: t.audio.errors?.httpsRequiredTip,
    generic: t.audio.errors?.generic,
    genericDesc: t.audio.errors?.genericDesc,
    genericTip: t.audio.errors?.genericTip,
    tryAgain: t.audio.errors?.tryAgain,
    uploadInstead: t.audio.errors?.uploadInstead,
    skipVoiceAnalysis: t.audio.errors?.skipVoiceAnalysis,
    goBack: t.audio.errors?.goBack,
  };

  // Prepare translations for action buttons
  const buttonTranslations = {
    startRecording: t.audio.startRecording,
    stopAndContinue: t.audio.stopAndContinue,
    recordAgain: t.audio.recordAgain,
    uploadAudio: t.camera.uploadAudio,
    or: t.camera.or,
    debugSkip: t.audio.debugSkip,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recording Section */}
      <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-green-50/50 border-green-100 pb-36 md:pb-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AudioIcon />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t.audio.title}</h2>
              <p className="text-sm text-gray-500">{t.audio.listeningDiagnosis}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <p className="text-gray-700 font-medium mb-2">{t.audio.instructionsShort}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{t.audio.sayAhhh}</p>
        </div>

        {/* Recording Area - State-based views */}
        <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex flex-col items-center justify-center overflow-hidden relative border border-green-100 shadow-inner">
          {recording.recordingState === "idle" && (
            <IdleState
              onStartRecording={recording.startRecording}
              readyText={t.audio.readyToRecord}
            />
          )}

          {recording.recordingState === "initializing" && (
            <InitializingState connectionStatus={recording.connectionStatus} />
          )}

          {recording.recordingState === "recording" && (
            <RecordingState duration={recording.recordingDuration} />
          )}

          {(recording.recordingState === "recorded" || recording.recordingState === "playing") && (
            <RecordedState
              isPlaying={playback.isPlaying}
              playbackProgress={playback.playbackProgress}
              duration={recording.recordingDuration}
              onPlay={playback.play}
              onPause={playback.pause}
            />
          )}
        </div>

        {/* Microphone Error Card */}
        {recording.micError && recording.micErrorType && (
          <MicErrorCard
            errorType={recording.micErrorType}
            translations={errorTranslations}
            onRetry={() => {
              recording.clearError();
              recording.startRecording();
            }}
            onUpload={recording.triggerFileUpload}
            onSkip={handleSkipAnalysis}
            onBack={onBack ? handleBack : undefined}
          />
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={recording.fileInputRef}
          onChange={recording.handleFileUpload}
          accept="audio/*"
          className="hidden"
        />

        {/* Desktop Action Buttons */}
        <ActionButtons
          variant="desktop"
          recordingState={recording.recordingState}
          connectionStatus={recording.connectionStatus}
          translations={buttonTranslations}
          onStartRecording={recording.startRecording}
          onStopRecording={recording.stopRecording}
          onRetake={handleRetake}
          onContinue={handleContinue}
          onUpload={recording.triggerFileUpload}
          onDebugSkip={handleDebugSkip}
        />

        {/* Mobile Action Buttons */}
        <ActionButtons
          variant="mobile"
          recordingState={recording.recordingState}
          connectionStatus={recording.connectionStatus}
          translations={buttonTranslations}
          onStartRecording={recording.startRecording}
          onStopRecording={recording.stopRecording}
          onRetake={handleRetake}
          onContinue={handleContinue}
          onUpload={recording.triggerFileUpload}
        />

        {/* Recording Tips */}
        <RecordingTips
          title={t.audio.tipsForBetterRecording}
          tips={t.audio.tips}
        />
      </Card>

      {/* Educational Content Section */}
      <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-100 overflow-hidden">
        <EducationalContent
          title={t.audio.learnAboutWen}
          subtitle={t.audio.traditionalChineseMedicine}
          intro={t.audio.educationalIntro}
          sections={t.audio.sections}
          clickToLearnMore={t.audio.clickToLearnMore}
          didYouKnow={t.audio.didYouKnow}
          didYouKnowContent={t.audio.didYouKnowContent}
        />
      </Card>

      {/* Skip Prompt Dialog */}
      <Dialog open={isSkipPromptOpen} onOpenChange={setIsSkipPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "zh"
                ? "未提供语音录音"
                : language === "ms"
                  ? "Tiada Rakaman Suara"
                  : "No Voice Recording"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh"
                ? "您尚未录制语音。语音分析有助于更准确的诊断。您确定要跳过吗？"
                : language === "ms"
                  ? "Anda belum merakam suara anda. Analisis suara membantu diagnosis yang lebih tepat. Adakah anda pasti mahu melangkau?"
                  : "You haven't recorded your voice. Voice analysis helps with more accurate diagnosis. Do you want to record or skip?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsSkipPromptOpen(false)}
            >
              {language === "zh" ? "录制语音" : language === "ms" ? "Rakam Suara" : "Record Voice"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSkipPromptOpen(false);
                handleSkipAnalysis();
              }}
            >
              {language === "zh" ? "跳过" : language === "ms" ? "Langkau" : "Skip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
