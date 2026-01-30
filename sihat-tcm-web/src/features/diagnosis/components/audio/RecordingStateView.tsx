"use client";

import { formatDuration } from "./utils";

interface RecordingStateProps {
    duration: number;
}

/**
 * Recording state - Active recording with duration timer and REC badge
 */
export function RecordingStateView({ duration }: RecordingStateProps) {
    return (
        <div className="flex flex-col items-center gap-4">
            {/* Animated recording indicator */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="white"
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    </svg>
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50" />
            </div>

            <div className="text-center">
                <p className="text-2xl font-mono font-bold text-red-600">
                    {formatDuration(duration)}
                </p>
                <p className="text-sm text-gray-500">Recording...</p>
            </div>

            {/* Recording indicator badge */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-white">REC</span>
            </div>
        </div>
    );
}
