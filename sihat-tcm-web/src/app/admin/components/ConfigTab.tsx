"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Mic, Loader2 } from "lucide-react";

interface ConfigTabProps {
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  musicUrl: string;
  setMusicUrl: (url: string) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  isTestPlaying: boolean;
  handleTestMusic: () => void;
  handleSaveMusicConfig: () => void;
  saving: string | null;
}

export function ConfigTab({
  musicEnabled,
  setMusicEnabled,
  musicUrl,
  setMusicUrl,
  musicVolume,
  setMusicVolume,
  isTestPlaying,
  handleTestMusic,
  handleSaveMusicConfig,
  saving,
}: ConfigTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" /> Environment Ambience
          </CardTitle>
          <CardDescription>
            Configure background audio for the waiting room experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Music Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
              <Label className="text-base">Background Music</Label>
              <p className="text-sm text-slate-500">Enable soothing audio for patients.</p>
            </div>
            <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} />
          </div>

          {/* Audio URL Input */}
          <div className="space-y-3">
            <Label>Audio Stream URL (MP3)</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={musicUrl}
                onChange={(e) => setMusicUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="https://..."
              />
              <Button variant="outline" size="icon" onClick={handleTestMusic}>
                {isTestPlaying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Default Volume</Label>
              <span className="text-sm text-slate-500">{Math.round(musicVolume * 100)}%</span>
            </div>
            <Slider
              value={[musicVolume]}
              max={1}
              step={0.01}
              onValueChange={(val) => setMusicVolume(val[0])}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end p-4">
          <Button
            onClick={handleSaveMusicConfig}
            disabled={saving === "config_music"}
            className="bg-slate-900"
          >
            {saving === "config_music" ? "Saving..." : "Save Audio Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
