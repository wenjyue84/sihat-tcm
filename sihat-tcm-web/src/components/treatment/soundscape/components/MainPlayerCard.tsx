"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Moon, Music, Waves, Wind, Droplets, Loader2, Info } from "lucide-react";
import { getElementDescription, SoundscapeConfig } from "@/lib/soundscapeUtils";
import { VolumeState, VolumeKey } from "../types";

interface MainPlayerCardProps {
  config: SoundscapeConfig;
  language: string;
  isPlaying: boolean;
  isInitialized: boolean;
  error: string | null;
  volumes: VolumeState;
  onPlay: () => void;
  onPause: () => void;
  onUpdateVolume: (key: VolumeKey, volume: number) => void;
}

export function MainPlayerCard({
  config,
  language,
  isPlaying,
  isInitialized,
  error,
  volumes,
  onPlay,
  onPause,
  onUpdateVolume,
}: MainPlayerCardProps) {
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-slate-600" />
              Help me Sleep
            </CardTitle>
            <CardDescription>Custom soundscape tailored to your constitution</CardDescription>
          </div>
          <Button
            size="lg"
            onClick={isPlaying ? onPause : onPlay}
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
          <VolumeSlider
            icon={<Music className="w-4 h-4 text-slate-500" />}
            label={getElementDescription(config.primary, language as "en" | "zh" | "ms")}
            sublabel={
              config.primary === "water" ? "Nourishes Kidney Yin, calms spirit for sleep" : undefined
            }
            value={volumes.primary}
            onChange={(v) => onUpdateVolume("primary", v)}
          />

          {/* Secondary Element */}
          {config.secondary && (
            <VolumeSlider
              icon={<Music className="w-4 h-4 text-slate-500" />}
              label={getElementDescription(config.secondary, language as "en" | "zh" | "ms")}
              value={volumes.secondary}
              onChange={(v) => onUpdateVolume("secondary", v)}
            />
          )}

          {/* Ambient Sound */}
          {config.ambient && config.ambient !== "none" && (
            <VolumeSlider
              icon={getAmbientIcon()}
              label={`${config.ambient.charAt(0).toUpperCase() + config.ambient.slice(1)} Sounds`}
              sublabel={
                config.ambient === "rain" || config.ambient === "water"
                  ? "Calms Shen, promotes deep sleep"
                  : undefined
              }
              value={volumes.ambient}
              onChange={(v) => onUpdateVolume("ambient", v)}
            />
          )}

          {/* Guqin Melody */}
          {config.includeGuqin && (
            <VolumeSlider
              icon={<Music className="w-4 h-4 text-slate-500" />}
              label="Guqin Melody (古琴)"
              value={volumes.guqin}
              onChange={(v) => onUpdateVolume("guqin", v)}
            />
          )}

          {/* Meditation Guidance */}
          {config.includeMeditation && (
            <VolumeSlider
              icon={<Moon className="w-4 h-4 text-slate-500" />}
              label="Body Scan Meditation"
              value={volumes.meditation}
              onChange={(v) => onUpdateVolume("meditation", v)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface VolumeSliderProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: number;
  onChange: (value: number) => void;
}

function VolumeSlider({ icon, label, sublabel, value, onChange }: VolumeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {sublabel && <span className="text-xs text-blue-600 italic">{sublabel}</span>}
          </div>
        </div>
        <span className="text-xs text-slate-500">{Math.round(value * 100)}%</span>
      </div>
      <Slider
        value={[value * 100]}
        max={100}
        step={1}
        onValueChange={(vals) => onChange(vals[0] / 100)}
        className="w-full"
      />
    </div>
  );
}
