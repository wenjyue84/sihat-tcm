"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Moon, Mic, Activity, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/stores/useAppStore";
import { translateConstitution } from "@/lib/translations";
import { extractConstitutionType } from "@/lib/tcm-utils";
import { FiveElementsSoundscape } from "@/components/treatment/FiveElementsSoundscape";

import { useSnoreRecording, useSnoreAnalysis } from "./hooks";
import {
  RecordingStage,
  ReadyForAnalysisStage,
  AnalyzingStage,
  AnalysisResults,
  SidebarCards,
  ErrorToast,
} from "./components";
import { SnoreAnalysisTabProps, TCMContext } from "./types";

// Re-export types for backward compatibility
export type { SnoreAnalysisResult, SnoreAnalysisTabProps } from "./types";

export function SnoreAnalysisTab({ sessions = [] }: SnoreAnalysisTabProps) {
  const { t } = useLanguage();
  const snoreT = t?.patientDashboard?.snoreAnalysis;
  const [activeSubSection, setActiveSubSection] = useState<"analysis" | "soundscape">("analysis");

  // Extract TCM context for the AI
  const latestSession = sessions[0];
  const tcmContext: TCMContext | null = latestSession
    ? {
        constitution: latestSession.constitution || latestSession.analysis_results?.constitution,
        symptoms: latestSession.symptoms || [],
        primary_diagnosis: latestSession.primary_diagnosis,
        has_fatigue:
          latestSession.symptoms?.some(
            (s: string) => s.toLowerCase().includes("fatigue") || s.toLowerCase().includes("tired")
          ) || latestSession.primary_diagnosis?.toLowerCase().includes("fatigue"),
      }
    : null;

  // Use custom hooks
  const recording = useSnoreRecording({
    microphoneDenied: snoreT?.errors?.microphoneDenied || "Microphone access denied",
  });

  const analysis = useSnoreAnalysis({
    analysisFailed: snoreT?.errors?.analysisFailed || "Analysis failed",
  });

  if (!snoreT) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Loading snore analysis content...</p>
      </div>
    );
  }

  const handleAnalyze = () => {
    if (recording.audioBlob) {
      analysis.analyzeAudio(recording.audioBlob, recording.recordingDuration, tcmContext);
    }
  };

  const handleReset = () => {
    recording.resetRecording();
    analysis.resetAnalysis();
  };

  const combinedError = recording.error || analysis.error;

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Redesigned Header with TCM Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden group">
            <Moon className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-900">
              {snoreT.title}
            </h2>
            <p className="text-slate-500 font-medium">{snoreT.subtitle}</p>
          </div>
        </div>

        {tcmContext?.constitution && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              Current Constitution:{" "}
              {translateConstitution(extractConstitutionType(tcmContext.constitution), t)}
            </span>
          </div>
        )}
      </div>

      {/* Sub-section Switcher */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveSubSection("analysis")}
          className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
            activeSubSection === "analysis"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            {snoreT.title || "Sleep Analysis"}
          </span>
        </button>
        <button
          onClick={() => setActiveSubSection("soundscape")}
          className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
            activeSubSection === "soundscape"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Moon className="w-4 h-4" />
            {t.patientDashboard?.tabs?.soundscape || "Soundscape"}
          </span>
        </button>
      </div>

      {/* Sub-section Content */}
      {activeSubSection === "soundscape" ? (
        <FiveElementsSoundscape latestDiagnosis={latestSession || null} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interaction Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-100 pb-8">
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  {recording.isRecording ? "Capturing Vital Sounds..." : "Sleep Sound Analysis"}
                </CardTitle>
                <CardDescription className="text-slate-500 max-w-lg">
                  Using advanced sound patterns to identify TCM disharmonies and sleep quality.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-10">
                <AnimatePresence mode="wait">
                  {/* Recording Stage */}
                  {!recording.audioBlob && !analysis.analysisResult && (
                    <RecordingStage
                      isRecording={recording.isRecording}
                      recordingDuration={recording.recordingDuration}
                      onStartRecording={recording.startRecording}
                      onStopRecording={recording.stopRecording}
                      onFileUploadClick={() => recording.fileInputRef.current?.click()}
                      fileInputRef={recording.fileInputRef}
                      onFileUpload={recording.handleFileUpload}
                      translations={{
                        recording: snoreT.recording,
                        uploadAudio: snoreT.uploadAudio,
                      }}
                    />
                  )}

                  {/* Ready for Analysis Stage */}
                  {recording.audioBlob && !analysis.analysisResult && !analysis.isAnalyzing && (
                    <ReadyForAnalysisStage
                      recordingDuration={recording.recordingDuration}
                      audioUrl={recording.audioUrl}
                      audioRef={recording.audioRef}
                      onAnalyze={handleAnalyze}
                      onReset={handleReset}
                      onPlaybackEnd={() => recording.setIsPlaying(false)}
                    />
                  )}

                  {/* Analyzing Stage */}
                  {analysis.isAnalyzing && <AnalyzingStage />}

                  {/* Result Stage */}
                  {analysis.analysisResult && (
                    <AnalysisResults
                      result={analysis.analysisResult}
                      onReset={handleReset}
                      translations={{ severityLevels: snoreT.severityLevels }}
                    />
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Cards */}
          <SidebarCards translations={{ tips: snoreT.tips }} />
        </div>
      )}

      {/* Error Toast */}
      <ErrorToast
        error={combinedError}
        onDismiss={() => {
          recording.setError(null);
          analysis.setError(null);
        }}
      />
    </div>
  );
}
