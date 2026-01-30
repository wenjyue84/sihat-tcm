"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SleepMusicTrack } from "../types";
import { SLEEP_MUSIC_TRACKS } from "../constants";

interface SleepMusicGridProps {
  language: string;
  playingTrackId: string | null;
  selectedTrackId: string | null;
  isLoadingTrack: boolean;
  trackVolume: number;
  onToggleTrack: (track: SleepMusicTrack) => void;
  onUpdateVolume: (volume: number) => void;
}

function getTrackName(track: SleepMusicTrack, language: string): string {
  switch (language) {
    case "zh":
      return track.nameZh;
    case "ms":
      return track.nameMs;
    default:
      return track.name;
  }
}

function getTrackDescription(track: SleepMusicTrack, language: string): string {
  switch (language) {
    case "zh":
      return track.descriptionZh;
    case "ms":
      return track.descriptionMs;
    default:
      return track.description;
  }
}

export function SleepMusicGrid({
  language,
  playingTrackId,
  selectedTrackId,
  isLoadingTrack,
  trackVolume,
  onToggleTrack,
  onUpdateVolume,
}: SleepMusicGridProps) {
  const getTitle = () => {
    switch (language) {
      case "zh":
        return "选择助眠音乐";
      case "ms":
        return "Pilih Muzik Tidur";
      default:
        return "Choose Sleep Music";
    }
  };

  const getDescription = () => {
    switch (language) {
      case "zh":
        return "点击播放个别音乐曲目";
      case "ms":
        return "Klik untuk memainkan trek muzik individu";
      default:
        return "Click to play individual music tracks";
    }
  };

  const getPlayingText = () => {
    switch (language) {
      case "zh":
        return "播放中";
      case "ms":
        return "Sedang dimainkan";
      default:
        return "Playing";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5 text-indigo-600" />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {/* Volume Control */}
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
                onClick={() => onUpdateVolume(trackVolume > 0 ? 0 : 0.7)}
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
                onValueChange={(vals) => onUpdateVolume(vals[0] / 100)}
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
              <motion.div key={track.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => onToggleTrack(track)}
                  disabled={isLoading}
                  className={`
                    w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                    ${
                      isCurrentlyPlaying
                        ? `bg-gradient-to-r ${track.gradient} border-indigo-300 shadow-lg`
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        p-2.5 rounded-xl transition-colors
                        ${isCurrentlyPlaying ? "bg-white/60 shadow-sm" : "bg-slate-100"}
                      `}
                    >
                      <span className={track.color}>{track.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`font-medium truncate ${isCurrentlyPlaying ? "text-indigo-900" : "text-slate-800"}`}
                        >
                          {getTrackName(track, language)}
                        </h4>
                        <div className="flex-shrink-0">
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          ) : isCurrentlyPlaying ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Pause className="w-5 h-5 text-indigo-600" />
                            </motion.div>
                          ) : (
                            <Play className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${isCurrentlyPlaying ? "text-indigo-700" : "text-slate-500"}`}
                      >
                        {getTrackDescription(track, language)}
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
                                animate={{ height: [4, 12, 4] }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </span>
                          <span className="text-xs text-indigo-600 ml-1">{getPlayingText()}</span>
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
  );
}
