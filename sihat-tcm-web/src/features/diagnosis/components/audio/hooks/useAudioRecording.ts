/**
 * Hook for managing audio recording state and operations
 * Handles MediaRecorder setup, stream handling, and recording lifecycle
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "initializing" | "recording" | "recorded" | "playing";

export type MicErrorType = "permission_denied" | "not_found" | "busy" | "https_required" | "generic" | null;

interface UseAudioRecordingOptions {
  initialAudio?: string | null;
}

interface UseAudioRecordingResult {
  // State
  recordingState: RecordingState;
  audioUrl: string | null;
  audioData: string | null;
  recordingDuration: number;
  connectionStatus: string;
  micError: string | null;
  micErrorType: MicErrorType;
  showTroubleshoot: boolean;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  clearError: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // For external access
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileUpload: () => void;
}

// Helper to get supported MIME type
function getSupportedMimeType(): string {
  const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

/**
 * Hook for managing audio recording
 */
export function useAudioRecording(
  options: UseAudioRecordingOptions = {}
): UseAudioRecordingResult {
  const { initialAudio } = options;

  // State
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(initialAudio || null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const [micError, setMicError] = useState<string | null>(null);
  const [micErrorType, setMicErrorType] = useState<MicErrorType>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    setRecordingState("initializing");
    setConnectionStatus("Checking device...");
    setMicError(null);
    setMicErrorType(null);
    setShowTroubleshoot(false);
    setRecordingDuration(0);

    let permissionTimeout: NodeJS.Timeout | null = null;

    try {
      // Check if mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("MediaDevices API not available. Make sure you're using HTTPS.");
        setMicError("Microphone access not available. Please use HTTPS or localhost.");
        setMicErrorType("https_required");
        setShowTroubleshoot(true);
        setRecordingState("idle");
        return;
      }

      setConnectionStatus("Requesting access...");

      // Set a timeout to encourage user if the browser prompt is delayed
      permissionTimeout = setTimeout(() => {
        setConnectionStatus('Please tap "Allow"...');
      }, 1000);

      // Request microphone access with basic constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (permissionTimeout) clearTimeout(permissionTimeout);
      setConnectionStatus("Starting audio...");

      streamRef.current = stream;

      // Create MediaRecorder with supported format
      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Collect data chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }

        // Create blob and URL for playback
        const mimeTypeToUse = mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeTypeToUse });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to base64 for storage/analysis
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioData(base64data);
        };

        // Clean up stream
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState("recorded");
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState("recording");

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (permissionTimeout) clearTimeout(permissionTimeout);
      setRecordingState("idle");
      console.error("Error accessing microphone:", err);

      // Provide user-friendly error messages
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicError("Microphone permission denied. Please allow microphone access.");
        setMicErrorType("permission_denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMicError("No microphone found. Please connect a microphone.");
        setMicErrorType("not_found");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setMicError("Microphone is busy. Please close other apps using it.");
        setMicErrorType("busy");
      } else {
        setMicError("Could not access microphone. Please check your settings.");
        setMicErrorType("generic");
      }
      setShowTroubleshoot(true);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioData(null);
    setRecordingState("idle");
    setRecordingDuration(0);
    setMicError(null);
    setMicErrorType(null);
    setShowTroubleshoot(false);
  }, [audioUrl]);

  // Clear error state
  const clearError = useCallback(() => {
    setMicError(null);
    setMicErrorType(null);
    setShowTroubleshoot(false);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setMicError("Please upload a valid audio file.");
      return;
    }

    setMicError(null);
    setMicErrorType(null);
    setShowTroubleshoot(false);

    // Create URL for playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setAudioData(base64data);
      setRecordingState("recorded");
    };
  }, []);

  // Trigger file input click
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // State
    recordingState,
    audioUrl,
    audioData,
    recordingDuration,
    connectionStatus,
    micError,
    micErrorType,
    showTroubleshoot,

    // Actions
    startRecording,
    stopRecording,
    reset,
    clearError,
    handleFileUpload,

    // Refs
    fileInputRef,
    triggerFileUpload,
  };
}


