"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface BackgroundMusicProps {
  enabled?: boolean;
  url?: string;
  initialVolume?: number;
}

export function BackgroundMusic({
  enabled = false,
  url,
  initialVolume = 0.5,
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const playAttemptedRef = useRef(false);

  // Play audio function with proper closure
  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled || !url || isMuted) return;
    if (playAttemptedRef.current && isPlaying) return; // Already playing

    playAttemptedRef.current = true;

    try {
      // Wait for audio to be ready
      if (audio.readyState < 2) {
        audio.load();
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Audio load timeout"));
          }, 10000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            reject(e);
          };

          audio.addEventListener("canplay", onCanPlay, { once: true });
          audio.addEventListener("error", onError, { once: true });
        });
      }

      // Play the audio
      await audio.play();
      setIsPlaying(true);
      console.log("[BackgroundMusic] Music started playing");
    } catch (error: any) {
      console.warn("[BackgroundMusic] Failed to play audio:", error);
      setIsPlaying(false);
      playAttemptedRef.current = false; // Allow retry
    }
  }, [enabled, url, isMuted, isPlaying]);

  // Initialize audio element and set up user interaction listeners
  useEffect(() => {
    if (!enabled || !url) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      playAttemptedRef.current = false;
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = isMuted ? 0 : volume;
    audio.loop = true;
    audio.preload = "auto";

    // Handle user interaction - play immediately when user interacts ANYWHERE on the page
    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // Play immediately on first interaction
        playAudio();
      }
    };

    // Add global event listeners for user interaction (anywhere on the page)
    const events = ["click", "keydown", "touchstart", "mousedown", "pointerdown"];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    // If user already interacted, try to play
    if (userInteracted && !isMuted) {
      playAudio();
    }

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [enabled, url, userInteracted, isMuted, playAudio]);

  // Handle mute/unmute and volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled || !url) return;

    audio.volume = isMuted ? 0 : volume;

    if (isMuted) {
      audio.pause();
      setIsPlaying(false);
      playAttemptedRef.current = false;
    } else if (userInteracted && !isPlaying) {
      // If unmuted and user has interacted, play
      playAudio();
    }
  }, [isMuted, volume, enabled, url, userInteracted, isPlaying, playAudio]);

  if (!enabled || !url) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 print:hidden">
      <audio ref={audioRef} src={url} loop />

      <div
        className={`bg-background/80 backdrop-blur-sm border rounded-full shadow-lg transition-all duration-300 flex items-center overflow-hidden ${showControls ? "w-48 p-2 pl-3" : "w-10 h-10 p-0 justify-center"}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {showControls ? (
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(vals) => setVolume(vals[0] / 100)}
              className="w-24"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-full h-full flex items-center justify-center text-primary transition-colors ${isPlaying ? "animate-pulse hover:animate-none" : ""}`}
          >
            {isMuted ? <VolumeX size={18} /> : <Music size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
