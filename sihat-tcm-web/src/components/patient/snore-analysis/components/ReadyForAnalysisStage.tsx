"use client";

import { motion } from "framer-motion";
import { Volume2, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../utils";

interface ReadyForAnalysisStageProps {
  recordingDuration: number;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onAnalyze: () => void;
  onReset: () => void;
  onPlaybackEnd: () => void;
}

export function ReadyForAnalysisStage({
  recordingDuration,
  audioUrl,
  audioRef,
  onAnalyze,
  onReset,
  onPlaybackEnd,
}: ReadyForAnalysisStageProps) {
  return (
    <motion.div
      key="ready"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
        <Volume2 className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-800">Sound Captured</h3>
        <p className="text-slate-500">
          Captured {formatDuration(recordingDuration)} of audio. Ready for AI-TCM analysis.
        </p>
      </div>

      {audioUrl && (
        <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={onPlaybackEnd}
            className="w-full h-10"
            controls
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          onClick={onAnalyze}
          size="lg"
          className="w-full sm:w-auto px-8 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 h-14 rounded-2xl shadow-lg font-bold text-lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          Analyze with TCM AI
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="h-14 px-8 border-slate-200 rounded-2xl text-slate-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-record
        </Button>
      </div>
    </motion.div>
  );
}
