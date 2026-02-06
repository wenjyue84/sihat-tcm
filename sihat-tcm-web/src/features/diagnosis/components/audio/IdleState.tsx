"use client";

import { Mic } from "lucide-react";

interface IdleStateProps {
  onStartRecording: () => void;
  readyText: string;
}

/**
 * Idle state - Ready to record with tap-to-start UI
 */
export function IdleState({ onStartRecording, readyText }: IdleStateProps) {
  return (
    <div
      className="text-gray-400 flex flex-col items-center gap-3 cursor-pointer group"
      onClick={onStartRecording}
    >
      <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-dashed border-green-200 transition-all group-hover:border-green-400 group-hover:shadow-lg group-hover:scale-105">
        <Mic className="w-8 h-8 text-green-400 group-hover:text-green-500 transition-colors" />
      </div>
      <span className="text-sm font-medium group-hover:text-green-600 transition-colors">
        {readyText}
      </span>
    </div>
  );
}
