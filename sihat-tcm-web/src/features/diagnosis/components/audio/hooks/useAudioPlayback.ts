/**
 * Hook for managing audio playback
 * Handles audio element management, play/pause, and progress tracking
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { RecordingState } from "./useAudioRecording";

interface UseAudioPlaybackOptions {
  audioUrl: string | null;
  onStateChange: (state: RecordingState) => void;
}

interface UseAudioPlaybackResult {
  playbackProgress: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Hook for managing audio playback
 */
export function useAudioPlayback({
  audioUrl,
  onStateChange,
}: UseAudioPlaybackOptions): UseAudioPlaybackResult {
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio element on unmount or URL change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Play recorded audio
  const play = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
        onStateChange("recorded");
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setPlaybackProgress(isNaN(progress) ? 0 : progress);
        }
      };
    }

    audioRef.current.play();
    setIsPlaying(true);
    onStateChange("playing");
  }, [audioUrl, onStateChange]);

  // Pause audio playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onStateChange("recorded");
    }
  }, [onStateChange]);

  // Reset playback state
  const reset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaybackProgress(0);
    setIsPlaying(false);
  }, []);

  return {
    playbackProgress,
    isPlaying,
    play,
    pause,
    reset,
  };
}
