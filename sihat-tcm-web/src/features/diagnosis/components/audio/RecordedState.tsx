"use client";

import { Play, Pause } from "lucide-react";
import { formatDuration } from "./utils";

interface RecordedStateProps {
  isPlaying: boolean;
  playbackProgress: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
}

/**
 * Recorded state - Playback controls with progress bar
 */
export function RecordedState({
  isPlaying,
  playbackProgress,
  duration,
  onPlay,
  onPause,
}: RecordedStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full px-6">
      {/* Playback controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-all hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" fill="white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${playbackProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
          <span className="text-xs text-green-600 font-medium">✓ Recording complete</span>
        </div>
      </div>
    </div>
  );
}
