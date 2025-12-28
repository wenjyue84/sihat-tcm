/**
 * Hook for managing audio recording state and operations
 * Extracted from AudioRecorder.tsx to improve maintainability
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "initializing" | "recording" | "recorded" | "playing";

interface UseAudioRecordingOptions {
  initialAudio?: string | null;
}

interface UseAudioRecordingResult {
  recordingState: RecordingState;
  audioUrl: string | null;
  audioData: string | null;
  recordingDuration: number;
  playbackProgress: number;
  micError: string | null;
  micErrorType: "permission_denied" | "not_found" | "busy" | "https_required" | "generic" | null;
  setRecordingState: (state: RecordingState) => void;
  setAudioUrl: (url: string | null) => void;
  setAudioData: (data: string | null) => void;
  setRecordingDuration: (duration: number) => void;
  setPlaybackProgress: (progress: number) => void;
  setMicError: (error: string | null) => void;
  setMicErrorType: (type: "permission_denied" | "not_found" | "busy" | "https_required" | "generic" | null) => void;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  chunksRef: React.MutableRefObject<Blob[]>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  durationIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Hook for managing audio recording state
 */
export function useAudioRecording(
  options: UseAudioRecordingOptions = {}
): UseAudioRecordingResult {
  const { initialAudio } = options;

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(initialAudio || null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [micErrorType, setMicErrorType] = useState<
    "permission_denied" | "not_found" | "busy" | "https_required" | "generic" | null
  >(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  return {
    recordingState,
    audioUrl,
    audioData,
    recordingDuration,
    playbackProgress,
    micError,
    micErrorType,
    setRecordingState,
    setAudioUrl,
    setAudioData,
    setRecordingDuration,
    setPlaybackProgress,
    setMicError,
    setMicErrorType,
    mediaRecorderRef,
    chunksRef,
    streamRef,
    audioRef,
    durationIntervalRef,
  };
}

