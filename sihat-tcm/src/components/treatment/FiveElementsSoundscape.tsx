"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DiagnosisSession } from "@/types/database";
import {
  determineSoundscape,
  getElementAudioPath,
  getAmbientAudioPath,
  getGuqinAudioPath,
  getMeditationAudioPath,
  getElementDescription,
  SoundscapeConfig,
  ElementType,
} from "@/lib/soundscapeUtils";
import { useLanguage } from "@/stores/useAppStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Moon,
  Music,
  Waves,
  Wind,
  Droplets,
  Loader2,
  Info,
  TreePine,
  Flame,
  Mountain,
  Coins,
  CloudRain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FiveElementsSoundscapeProps {
  latestDiagnosis?: DiagnosisSession | null;
}

interface AudioLayer {
  element: "primary" | "secondary" | "ambient" | "guqin" | "meditation";
  audio: HTMLAudioElement;
  volume: number;
  isPlaying: boolean;
}

// Sleep music track definitions
interface SleepMusicTrack {
  id: string;
  name: string;
  nameZh: string;
  nameMs: string;
  description: string;
  descriptionZh: string;
  descriptionMs: string;
  icon: React.ReactNode;
  audioPath: string;
  color: string;
  gradient: string;
}

const SLEEP_MUSIC_TRACKS: SleepMusicTrack[] = [
  {
    id: "water",
    name: "Flowing Water",
    nameZh: "流水声",
    nameMs: "Air Mengalir",
    description: "Calming water sounds to nourish Kidney Yin",
    descriptionZh: "滋养肾阴的流水声",
    descriptionMs: "Bunyi air yang menenangkan untuk menyuburkan Yin Buah Pinggang",
    icon: <Waves className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/water/stream_water.ogg",
    color: "text-blue-600",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "rain",
    name: "Gentle Rain",
    nameZh: "细雨声",
    nameMs: "Hujan Renyai",
    description: "Rain sounds to calm the Shen (spirit)",
    descriptionZh: "安神养心的雨声",
    descriptionMs: "Bunyi hujan untuk menenangkan Shen (roh)",
    icon: <CloudRain className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
    color: "text-sky-600",
    gradient: "from-sky-500/20 to-slate-500/20",
  },
  {
    id: "earth",
    name: "Earth Drums",
    nameZh: "大地鼓声",
    nameMs: "Gendang Bumi",
    description: "Steady rhythms to ground the Spleen",
    descriptionZh: "稳定脾胃的鼓点节奏",
    descriptionMs: "Irama mantap untuk mengukuhkan Limpa",
    icon: <Mountain className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/nature/nature_sounds_night.ogg",
    color: "text-amber-600",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "fire",
    name: "Warm Tones",
    nameZh: "温暖音调",
    nameMs: "Nada Hangat",
    description: "Gentle warmth to support Yang energy",
    descriptionZh: "温养阳气的舒缓音调",
    descriptionMs: "Kehangatan lembut untuk menyokong tenaga Yang",
    icon: <Flame className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/ambiences/fire.ogg",
    color: "text-red-500",
    gradient: "from-red-500/20 to-orange-500/20",
  },
  {
    id: "metal",
    name: "Crystal Bowls",
    nameZh: "水晶钵音",
    nameMs: "Mangkuk Kristal",
    description: "Clear metallic tones to ease the Lung Qi",
    descriptionZh: "疏通肺气的清澈金属音",
    descriptionMs: "Nada logam yang jernih untuk melegakan Qi Paru-paru",
    icon: <Coins className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/alarms/temple_bell.ogg",
    color: "text-slate-500",
    gradient: "from-slate-400/20 to-gray-500/20",
  },
  {
    id: "wood",
    name: "Forest Breeze",
    nameZh: "林间微风",
    nameMs: "Angin Hutan",
    description: "Gentle winds through trees to soothe the Liver",
    descriptionZh: "疏肝解郁的林间风声",
    descriptionMs: "Angin lembut melalui pokok untuk menenangkan Hati",
    icon: <TreePine className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/nature/forest_wind.ogg",
    color: "text-green-600",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "guqin",
    name: "Guqin Melody",
    nameZh: "古琴曲",
    nameMs: "Melodi Guqin",
    description: "Traditional Chinese zither for deep relaxation",
    descriptionZh: "古琴悠扬，深度放松",
    descriptionMs: "Kecapi tradisional Cina untuk relaksasi mendalam",
    icon: <Music className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/relax/meditation.ogg",
    color: "text-purple-600",
    gradient: "from-purple-500/20 to-indigo-500/20",
  },
  {
    id: "meditation",
    name: "Meditation Music",
    nameZh: "冥想音乐",
    nameMs: "Muzik Meditasi",
    description: "Relaxing music for sleep preparation",
    descriptionZh: "助眠的放松音乐",
    descriptionMs: "Muzik santai untuk persediaan tidur",
    icon: <Moon className="w-5 h-5" />,
    audioPath: "https://actions.google.com/sounds/v1/relax/meditation.ogg",
    color: "text-indigo-600",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
];

export function FiveElementsSoundscape({ latestDiagnosis }: FiveElementsSoundscapeProps) {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Individual track player state
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [trackVolume, setTrackVolume] = useState(0.7);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const selectedTrackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio layers
  const layersRef = useRef<Map<string, AudioLayer>>(new Map());
  const [volumes, setVolumes] = useState({
    primary: 0.6,
    secondary: 0.4,
    ambient: 0.3,
    guqin: 0.5,
    meditation: 0.7,
  });

  // Soundscape configuration
  const [config, setConfig] = useState<SoundscapeConfig | null>(null);

  // Initialize soundscape configuration
  useEffect(() => {
    const soundscapeConfig = determineSoundscape(latestDiagnosis || null);
    setConfig(soundscapeConfig);
  }, [latestDiagnosis]);

  // Get track name and description based on language
  const getTrackName = useCallback((track: SleepMusicTrack) => {
    switch (language) {
      case "zh": return track.nameZh;
      case "ms": return track.nameMs;
      default: return track.name;
    }
  }, [language]);

  const getTrackDescription = useCallback((track: SleepMusicTrack) => {
    switch (language) {
      case "zh": return track.descriptionZh;
      case "ms": return track.descriptionMs;
      default: return track.description;
    }
  }, [language]);

  // Play individual track
  const playTrack = useCallback(async (track: SleepMusicTrack) => {
    // Stop currently playing track if different
    if (selectedTrackAudioRef.current) {
      selectedTrackAudioRef.current.pause();
      selectedTrackAudioRef.current.src = "";
    }

    // Also stop the combined soundscape if playing
    if (isPlaying) {
      layersRef.current.forEach((layer) => {
        layer.audio.pause();
        layer.isPlaying = false;
      });
      setIsPlaying(false);
    }

    setIsLoadingTrack(true);
    setSelectedTrackId(track.id);

    try {
      // Use the pre-configured remote audio path
      const audioPath = track.audioPath;

      const audio = new Audio(audioPath);
      audio.loop = track.id !== "meditation"; // Meditation doesn't loop
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

      // Handle audio end event
      audio.addEventListener("ended", () => {
        setPlayingTrackId(null);
      });

      selectedTrackAudioRef.current = audio;
      await audio.play();
      setPlayingTrackId(track.id);
      setIsLoadingTrack(false);
    } catch (err) {
      console.error("Failed to play track:", err);
      setError("Failed to play audio. Please try again.");
      setIsLoadingTrack(false);
      setPlayingTrackId(null);
    }
  }, [isPlaying, language, trackVolume]);

  // Pause individual track
  const pauseTrack = useCallback(() => {
    if (selectedTrackAudioRef.current) {
      selectedTrackAudioRef.current.pause();
      setPlayingTrackId(null);
    }
  }, []);

  // Toggle track play/pause
  const toggleTrack = useCallback((track: SleepMusicTrack) => {
    if (playingTrackId === track.id) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  }, [playingTrackId, pauseTrack, playTrack]);

  // Update track volume
  const updateTrackVolume = useCallback((newVolume: number) => {
    setTrackVolume(newVolume);
    if (selectedTrackAudioRef.current) {
      selectedTrackAudioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup individual track audio on unmount
  useEffect(() => {
    return () => {
      if (selectedTrackAudioRef.current) {
        selectedTrackAudioRef.current.pause();
        selectedTrackAudioRef.current.src = "";
      }
    };
  }, []);

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
        meditationAudio.loop = false; // Meditation guidance typically doesn't loop
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

          const onError = (e: any) => {
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
    } catch (err: any) {
      console.error("Failed to initialize audio:", err);
      setError(
        err.message || "Failed to load audio files. Please ensure audio files are available."
      );
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
    } catch (err: any) {
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

  // Update volume for a specific layer
  const updateVolume = useCallback(
    (layerKey: string, newVolume: number) => {
      const layer = layersRef.current.get(layerKey);
      if (layer) {
        layer.audio.volume = newVolume;
        layer.volume = newVolume;
        setVolumes((prev) => ({
          ...prev,
          [layerKey]: newVolume,
        }));
      }
    },
    []
  );

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

  // Handle meditation audio end (restart if needed)
  useEffect(() => {
    const meditationLayer = layersRef.current.get("meditation");
    if (meditationLayer && config?.includeMeditation) {
      const handleEnded = () => {
        // Optionally restart meditation or just let it end
        // For now, we'll let it end naturally
      };
      meditationLayer.audio.addEventListener("ended", handleEnded);
      return () => {
        meditationLayer.audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [config, isInitialized]);

  if (!config) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">Preparing your soundscape...</p>
      </Card>
    );
  }

  const getAmbientIcon = () => {
    if (!config.ambient || config.ambient === "none") return null;
    switch (config.ambient) {
      case "rain":
        return <Droplets className="w-4 h-4" />;
      case "wind":
        return <Wind className="w-4 h-4" />;
      case "water":
        return <Waves className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Five Elements Soundscape
          </h2>
          <p className="text-base text-slate-600 font-light">
            Personalized musical medicine based on your TCM profile
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-500 hover:text-slate-700"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* Info Card */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="pt-6">
                <p className="text-sm text-emerald-900 leading-relaxed">
                  Based on your TCM diagnosis, this soundscape combines Five Elements theory with
                  therapeutic sounds. Each element corresponds to specific organs and can help
                  restore balance through sound frequencies.
                </p>

                {/* TCM Sleep Connection */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    TCM & Sleep Connection
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed mb-2">
                    <strong>Water Element (肾, Kidney):</strong> In TCM, the Kidney (Water element) governs sleep and rest.
                    Water sounds help calm the Shen (spirit) and promote deep, restorative sleep by nourishing Yin energy.
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Rain Sounds:</strong> Rain creates white noise that masks disturbances and aligns with Water's
                    cooling, calming nature. The steady rhythm helps regulate the Heart-Kidney axis, essential for quality sleep.
                  </p>
                </div>

                {config && (
                  <div className="mt-4 space-y-2 text-sm text-emerald-800">
                    <p>
                      <strong>Primary:</strong> {getElementDescription(config.primary, language as "en" | "zh" | "ms")}
                    </p>
                    {config.secondary && (
                      <p>
                        <strong>Secondary:</strong>{" "}
                        {getElementDescription(config.secondary, language as "en" | "zh" | "ms")}
                      </p>
                    )}
                    {config.ambient && config.ambient !== "none" && (
                      <p>
                        <strong>Ambient:</strong> {config.ambient.charAt(0).toUpperCase() + config.ambient.slice(1)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selectable Sleep Music Tracks */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5 text-indigo-600" />
            {language === "zh" ? "选择助眠音乐" : language === "ms" ? "Pilih Muzik Tidur" : "Choose Sleep Music"}
          </CardTitle>
          <CardDescription>
            {language === "zh"
              ? "点击播放个别音乐曲目"
              : language === "ms"
                ? "Klik untuk memainkan trek muzik individu"
                : "Click to play individual music tracks"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {/* Track Volume Control */}
          {playingTrackId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateTrackVolume(trackVolume > 0 ? 0 : 0.7)}
                  className="p-2"
                >
                  {trackVolume > 0 ? (
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
                <Slider
                  value={[trackVolume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updateTrackVolume(vals[0] / 100)}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 text-right">
                  {Math.round(trackVolume * 100)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Track Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SLEEP_MUSIC_TRACKS.map((track) => {
              const isCurrentlyPlaying = playingTrackId === track.id;
              const isLoading = isLoadingTrack && selectedTrackId === track.id;

              return (
                <motion.div
                  key={track.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => toggleTrack(track)}
                    disabled={isLoading}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                      ${isCurrentlyPlaying
                        ? `bg-gradient-to-r ${track.gradient} border-indigo-300 shadow-lg`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2.5 rounded-xl transition-colors
                        ${isCurrentlyPlaying
                          ? 'bg-white/60 shadow-sm'
                          : 'bg-slate-100'}
                      `}>
                        <span className={track.color}>
                          {track.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium truncate ${isCurrentlyPlaying ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {getTrackName(track)}
                          </h4>
                          <div className="flex-shrink-0">
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : isCurrentlyPlaying ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1"
                              >
                                <Pause className="w-5 h-5 text-indigo-600" />
                              </motion.div>
                            ) : (
                              <Play className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${isCurrentlyPlaying ? 'text-indigo-700' : 'text-slate-500'}`}>
                          {getTrackDescription(track)}
                        </p>

                        {/* Playing indicator */}
                        {isCurrentlyPlaying && (
                          <motion.div
                            className="flex items-center gap-1 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <span className="flex gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <motion.span
                                  key={i}
                                  className="w-1 bg-indigo-500 rounded-full"
                                  animate={{
                                    height: [4, 12, 4],
                                  }}
                                  transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                  }}
                                />
                              ))}
                            </span>
                            <span className="text-xs text-indigo-600 ml-1">
                              {language === "zh" ? "播放中" : language === "ms" ? "Sedang dimainkan" : "Playing"}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Player Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-slate-600" />
                Help me Sleep
              </CardTitle>
              <CardDescription>
                Custom soundscape tailored to your constitution
              </CardDescription>
            </div>
            <Button
              size="lg"
              onClick={isPlaying ? pauseAll : playAll}
              disabled={!isInitialized && !error}
              className="gap-2"
            >
              {!isInitialized && !error ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : error ? (
                <>
                  <Info className="w-4 h-4" />
                  Error
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{error}</p>
              <p className="text-xs text-amber-600 mt-2">
                Note: Audio files need to be placed in the public/audio directory. See documentation
                for file structure.
              </p>
            </div>
          )}

          {/* Audio Layers Controls */}
          <div className="space-y-4">
            {/* Primary Element */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">
                      {getElementDescription(config.primary, language as "en" | "zh" | "ms")}
                    </span>
                    {config.primary === "water" && (
                      <span className="text-xs text-blue-600 italic">
                        Nourishes Kidney Yin, calms spirit for sleep
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {Math.round(volumes.primary * 100)}%
                </span>
              </div>
              <Slider
                value={[volumes.primary * 100]}
                max={100}
                step={1}
                onValueChange={(vals) => updateVolume("primary", vals[0] / 100)}
                className="w-full"
              />
            </div>

            {/* Secondary Element */}
            {config.secondary && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {getElementDescription(config.secondary, language as "en" | "zh" | "ms")}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(volumes.secondary * 100)}%
                  </span>
                </div>
                <Slider
                  value={[volumes.secondary * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updateVolume("secondary", vals[0] / 100)}
                  className="w-full"
                />
              </div>
            )}

            {/* Ambient Sound */}
            {config.ambient && config.ambient !== "none" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAmbientIcon()}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {config.ambient} Sounds
                      </span>
                      {(config.ambient === "rain" || config.ambient === "water") && (
                        <span className="text-xs text-blue-600 italic">
                          Calms Shen, promotes deep sleep
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(volumes.ambient * 100)}%
                  </span>
                </div>
                <Slider
                  value={[volumes.ambient * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updateVolume("ambient", vals[0] / 100)}
                  className="w-full"
                />
              </div>
            )}

            {/* Guqin Melody */}
            {config.includeGuqin && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Guqin Melody (古琴)</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(volumes.guqin * 100)}%
                  </span>
                </div>
                <Slider
                  value={[volumes.guqin * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updateVolume("guqin", vals[0] / 100)}
                  className="w-full"
                />
              </div>
            )}

            {/* Meditation Guidance */}
            {config.includeMeditation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Body Scan Meditation
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(volumes.meditation * 100)}%
                  </span>
                </div>
                <Slider
                  value={[volumes.meditation * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updateVolume("meditation", vals[0] / 100)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

