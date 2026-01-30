"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SleepMusicTrack } from "../types";

interface UseTrackPlayerOptions {
  onStopOtherPlayers?: () => void;
}

export function useTrackPlayer(options: UseTrackPlayerOptions = {}) {
  const { onStopOtherPlayers } = options;

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [trackVolume, setTrackVolume] = useState(0.7);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = useCallback(
    async (track: SleepMusicTrack) => {
      // Stop currently playing track if different
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Notify parent to stop other players
      onStopOtherPlayers?.();

      setIsLoadingTrack(true);
      setSelectedTrackId(track.id);

      try {
        const audio = new Audio(track.audioPath);
        audio.loop = track.id !== "meditation";
        audio.volume = trackVolume;

        // Wait for audio to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Audio load timeout")), 10000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve();
          };

          const onError = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            reject(new Error("Failed to load audio"));
          };

          audio.addEventListener("canplay", onCanPlay, { once: true });
          audio.addEventListener("error", onError, { once: true });
          audio.load();
        });

        audio.addEventListener("ended", () => {
          setPlayingTrackId(null);
        });

        audioRef.current = audio;
        await audio.play();
        setPlayingTrackId(track.id);
        setIsLoadingTrack(false);

        return true;
      } catch (err) {
        console.error("Failed to play track:", err);
        setIsLoadingTrack(false);
        setPlayingTrackId(null);
        throw err;
      }
    },
    [trackVolume, onStopOtherPlayers]
  );

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    }
  }, []);

  const toggleTrack = useCallback(
    async (track: SleepMusicTrack) => {
      if (playingTrackId === track.id) {
        pauseTrack();
      } else {
        await playTrack(track);
      }
    },
    [playingTrackId, pauseTrack, playTrack]
  );

  const updateVolume = useCallback((newVolume: number) => {
    setTrackVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlayingTrackId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  return {
    selectedTrackId,
    playingTrackId,
    trackVolume,
    isLoadingTrack,
    playTrack,
    pauseTrack,
    toggleTrack,
    updateVolume,
    stopAll,
  };
}
