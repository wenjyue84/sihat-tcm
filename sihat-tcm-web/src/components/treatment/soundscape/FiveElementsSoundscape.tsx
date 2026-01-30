"use client";

import { useState, useCallback } from "react";
import { DiagnosisSession } from "@/types/database";
import { useLanguage } from "@/stores/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react";
import { useSoundscape, useTrackPlayer } from "./hooks";
import { SleepMusicGrid, MainPlayerCard, InfoCard } from "./components";

interface FiveElementsSoundscapeProps {
  latestDiagnosis?: DiagnosisSession | null;
}

export function FiveElementsSoundscape({ latestDiagnosis }: FiveElementsSoundscapeProps) {
  const { language } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);

  // Soundscape (combined audio layers) hook
  const soundscape = useSoundscape({
    latestDiagnosis,
    language,
  });

  // Individual track player hook
  const trackPlayer = useTrackPlayer({
    onStopOtherPlayers: soundscape.stopAll,
  });

  // Handle track toggle - stop soundscape when playing individual track
  const handleToggleTrack = useCallback(
    async (track: Parameters<typeof trackPlayer.toggleTrack>[0]) => {
      try {
        await trackPlayer.toggleTrack(track);
      } catch (err) {
        console.error("Failed to toggle track:", err);
      }
    },
    [trackPlayer]
  );

  // Handle soundscape play - stop individual track when playing soundscape
  const handlePlaySoundscape = useCallback(() => {
    trackPlayer.stopAll();
    soundscape.playAll();
  }, [trackPlayer, soundscape]);

  // Loading state
  if (!soundscape.config) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">Preparing your soundscape...</p>
      </Card>
    );
  }

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
      <InfoCard show={showInfo} config={soundscape.config} language={language} />

      {/* Sleep Music Selection Grid */}
      <SleepMusicGrid
        language={language}
        playingTrackId={trackPlayer.playingTrackId}
        selectedTrackId={trackPlayer.selectedTrackId}
        isLoadingTrack={trackPlayer.isLoadingTrack}
        trackVolume={trackPlayer.trackVolume}
        onToggleTrack={handleToggleTrack}
        onUpdateVolume={trackPlayer.updateVolume}
      />

      {/* Main Player Card */}
      <MainPlayerCard
        config={soundscape.config}
        language={language}
        isPlaying={soundscape.isPlaying}
        isInitialized={soundscape.isInitialized}
        error={soundscape.error}
        volumes={soundscape.volumes}
        onPlay={handlePlaySoundscape}
        onPause={soundscape.pauseAll}
        onUpdateVolume={soundscape.updateVolume}
      />
    </div>
  );
}
