"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  determineSoundscape,
  getElementAudioPath,
  getAmbientAudioPath,
  getGuqinAudioPath,
  getMeditationAudioPath,
  SoundscapeConfig,
} from "@/lib/soundscapeUtils";
import { DiagnosisSession } from "@/types/database";
import { AudioLayer, VolumeState, VolumeKey } from "../types";
import { DEFAULT_VOLUMES } from "../constants";

interface UseSoundscapeOptions {
  latestDiagnosis: DiagnosisSession | null | undefined;
  language: string;
}

export function useSoundscape({ latestDiagnosis, language }: UseSoundscapeOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SoundscapeConfig | null>(null);
  const [volumes, setVolumes] = useState<VolumeState>(DEFAULT_VOLUMES);

  const layersRef = useRef<Map<string, AudioLayer>>(new Map());

  // Initialize soundscape configuration
  useEffect(() => {
    const soundscapeConfig = determineSoundscape(latestDiagnosis || null);
    setConfig(soundscapeConfig);
  }, [latestDiagnosis]);

  // Initialize audio layers
  const initializeAudio = useCallback(async () => {
    if (!config || isInitialized) return;

    try {
      setError(null);
      const newLayers = new Map<string, AudioLayer>();

      // Primary element
      const primaryPath = getElementAudioPath(config.primary);
      const primaryAudio = new Audio(primaryPath);
      primaryAudio.loop = true;
      primaryAudio.volume = volumes.primary;
      newLayers.set("primary", {
        element: "primary",
        audio: primaryAudio,
        volume: volumes.primary,
        isPlaying: false,
      });

      // Secondary element (if specified)
      if (config.secondary) {
        const secondaryPath = getElementAudioPath(config.secondary);
        const secondaryAudio = new Audio(secondaryPath);
        secondaryAudio.loop = true;
        secondaryAudio.volume = volumes.secondary;
        newLayers.set("secondary", {
          element: "secondary",
          audio: secondaryAudio,
          volume: volumes.secondary,
          isPlaying: false,
        });
      }

      // Ambient sound (if specified)
      if (config.ambient && config.ambient !== "none") {
        const ambientPath = getAmbientAudioPath(config.ambient);
        if (ambientPath) {
          const ambientAudio = new Audio(ambientPath);
          ambientAudio.loop = true;
          ambientAudio.volume = volumes.ambient;
          newLayers.set("ambient", {
            element: "ambient",
            audio: ambientAudio,
            volume: volumes.ambient,
            isPlaying: false,
          });
        }
      }

      // Guqin melody (if enabled)
      if (config.includeGuqin) {
        const guqinPath = getGuqinAudioPath();
        const guqinAudio = new Audio(guqinPath);
        guqinAudio.loop = true;
        guqinAudio.volume = volumes.guqin;
        newLayers.set("guqin", {
          element: "guqin",
          audio: guqinAudio,
          volume: volumes.guqin,
          isPlaying: false,
        });
      }

      // Meditation guidance (if enabled)
      if (config.includeMeditation) {
        const meditationPath = getMeditationAudioPath(language as "en" | "zh" | "ms");
        const meditationAudio = new Audio(meditationPath);
        meditationAudio.loop = false;
        meditationAudio.volume = volumes.meditation;
        newLayers.set("meditation", {
          element: "meditation",
          audio: meditationAudio,
          volume: volumes.meditation,
          isPlaying: false,
        });
      }

      // Wait for all audio to be ready
      const loadPromises = Array.from(newLayers.values()).map((layer) => {
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Audio load timeout: ${layer.element}`));
          }, 10000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            layer.audio.removeEventListener("canplay", onCanPlay);
            layer.audio.removeEventListener("error", onError);
            resolve();
          };

          const onError = () => {
            clearTimeout(timeout);
            layer.audio.removeEventListener("canplay", onCanPlay);
            layer.audio.removeEventListener("error", onError);
            reject(new Error(`Failed to load audio: ${layer.element}`));
          };

          layer.audio.addEventListener("canplay", onCanPlay, { once: true });
          layer.audio.addEventListener("error", onError, { once: true });
          layer.audio.load();
        });
      });

      await Promise.all(loadPromises);
      layersRef.current = newLayers;
      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load audio files. Please ensure audio files are available.";
      setError(errorMessage);
      setIsInitialized(false);
    }
  }, [config, volumes, language, isInitialized]);

  // Play all layers
  const playAll = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }

    try {
      const playPromises = Array.from(layersRef.current.values()).map(async (layer) => {
        try {
          await layer.audio.play();
          layer.isPlaying = true;
        } catch (err) {
          console.warn(`Failed to play ${layer.element}:`, err);
        }
      });

      await Promise.all(playPromises);
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
      setError("Failed to play audio. Please check your browser's audio permissions.");
    }
  }, [isInitialized, initializeAudio]);

  // Pause all layers
  const pauseAll = useCallback(() => {
    layersRef.current.forEach((layer) => {
      layer.audio.pause();
      layer.isPlaying = false;
    });
    setIsPlaying(false);
  }, []);

  // Stop all layers (used when switching to individual track)
  const stopAll = useCallback(() => {
    layersRef.current.forEach((layer) => {
      layer.audio.pause();
      layer.isPlaying = false;
    });
    setIsPlaying(false);
  }, []);

  // Update volume for a specific layer
  const updateVolume = useCallback((layerKey: VolumeKey, newVolume: number) => {
    const layer = layersRef.current.get(layerKey);
    if (layer) {
      layer.audio.volume = newVolume;
      layer.volume = newVolume;
    }
    setVolumes((prev) => ({
      ...prev,
      [layerKey]: newVolume,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      layersRef.current.forEach((layer) => {
        layer.audio.pause();
        layer.audio.src = "";
      });
      layersRef.current.clear();
    };
  }, []);

  // Handle meditation audio end
  useEffect(() => {
    const meditationLayer = layersRef.current.get("meditation");
    if (meditationLayer && config?.includeMeditation) {
      const handleEnded = () => {
        // Let meditation end naturally
      };
      meditationLayer.audio.addEventListener("ended", handleEnded);
      return () => {
        meditationLayer.audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [config, isInitialized]);

  return {
    isPlaying,
    isInitialized,
    error,
    config,
    volumes,
    playAll,
    pauseAll,
    stopAll,
    updateVolume,
  };
}
