"use client";

import { Check } from "lucide-react";

interface RecordingTipsProps {
  title: string;
  tips: string[];
}

/**
 * Recording Tips - Tips for better audio recording
 */
export function RecordingTips({ title, tips }: RecordingTipsProps) {
  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💡</span>
        <span className="font-semibold text-amber-800 text-sm">{title}</span>
      </div>
      <ul className="text-sm text-amber-700 space-y-1">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
