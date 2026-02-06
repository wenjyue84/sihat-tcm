"use client";

import { useState } from "react";
import { X, Leaf } from "lucide-react";

const TIPS = [
  "Sunday: Rest well. The Spleen benefits from a calm mind and gentle movement.",
  "Monday: Start your week with warm water and lemon to support Liver Qi flow.",
  "Tuesday: Eat red foods like tomatoes or goji berries to nourish the Heart.",
  "Wednesday: Practice deep breathing to strengthen Lung Qi and immunity.",
  "Thursday: Massage your feet before bed to calm the Kidney meridian.",
  "Friday: Enjoy bitter greens to clear Heat and support digestion.",
  "Saturday: Take a mindful walk in nature to harmonize your body and spirit.",
];

const STORAGE_KEY = "sihat-wellness-tip-dismissed";

export function DailyWellnessTip(): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === today;
  });

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    setDismissed(true);
  };

  if (dismissed) return null;

  const tip = TIPS[new Date().getDay()];

  return (
    <div className="relative flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        <Leaf className="w-5 h-5 text-emerald-600" />
      </div>
      <p className="flex-1 text-sm text-emerald-800">{tip}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1.5 rounded-full hover:bg-emerald-100 transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="w-4 h-4 text-emerald-600" />
      </button>
    </div>
  );
}
