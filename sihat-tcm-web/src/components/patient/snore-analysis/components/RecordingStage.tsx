"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "../utils";

interface RecordingStageProps {
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  translations: {
    recording: string;
    uploadAudio: string;
  };
}

export function RecordingStage({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onFileUploadClick,
  fileInputRef,
  onFileUpload,
  translations,
}: RecordingStageProps) {
  return (
    <motion.div
      key="record"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="text-center space-y-8"
    >
      <div className="relative inline-block">
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-red-100 rounded-full -m-4"
              />
              <div className="relative text-6xl font-mono font-black text-slate-800 tracking-tighter">
                {formatDuration(recordingDuration)}
              </div>
            </div>
            <Button
              onClick={onStopRecording}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-20 w-20 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
            >
              <MicOff className="w-8 h-8" />
            </Button>
            <p className="mt-4 text-red-500 font-bold animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {translations.recording}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Button
              onClick={onStartRecording}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full h-32 w-32 flex flex-col items-center justify-center shadow-2xl hover:scale-105 transition-all group"
            >
              <Mic className="w-10 h-10 mb-2 group-hover:animate-bounce" />
              <span className="font-bold text-xs uppercase tracking-widest">Start</span>
            </Button>
          </div>
        )}
      </div>

      {!isRecording && (
        <div className="flex flex-col items-center pt-4">
          <div className="h-px w-32 bg-slate-200 mb-6" />
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            onChange={onFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            onClick={onFileUploadClick}
            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            {translations.uploadAudio}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
