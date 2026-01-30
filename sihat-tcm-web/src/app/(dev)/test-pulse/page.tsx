"use client";

import { useState } from "react";
import { PulseCheck } from "@/features/diagnosis/components/PulseCheck";
// Note: These providers are no longer needed - using Zustand store instead
// The StoreInitializer in providers.tsx handles initialization
import { PulseCheckData } from "@/features/diagnosis/components/pulse";

export default function TestPulsePage() {
  const [result, setResult] = useState<PulseCheckData | null>(null);

  // Providers are no longer needed - Zustand store is initialized globally
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-emerald-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">🔬 PulseCheck Component Test</h1>
          <p className="text-stone-600">Isolated test page for responsive verification</p>
        </div>

        {/* Responsive Breakpoint Indicator */}
        <div className="text-center text-xs text-stone-500 bg-white/50 rounded-lg py-2 px-4">
          <span className="md:hidden">📱 Mobile View</span>
          <span className="hidden md:inline lg:hidden">💻 Tablet / MD View</span>
          <span className="hidden lg:inline">🖥️ Desktop / LG View</span>
        </div>

        {/* PulseCheck Component */}
        <PulseCheck
          onComplete={(data) => {
            console.log("PulseCheck completed:", data);
            setResult(data);
          }}
          onBack={() => console.log("Back pressed")}
        />

        {/* Result Display */}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-emerald-800 mb-2">✅ Submission Result</h3>
            <pre className="text-sm text-stone-700 bg-white p-3 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Verification Checklist */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-3">📋 Verification Checklist</h3>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>
              ☐ <strong>Mobile:</strong> Pulse Quality grid shows 2 columns
            </li>
            <li>
              ☐ <strong>Tablet (md):</strong> Grid shows 3 columns
            </li>
            <li>
              ☐ <strong>Desktop (lg):</strong> Grid shows 4 columns
            </li>
            <li>
              ☐ <strong>Tap Button:</strong> Large touch target (min 44px)
            </li>
            <li>
              ☐ <strong>ECG Animation:</strong> Displays after BPM input
            </li>
            <li>
              ☐ <strong>Conflict Warning:</strong> Shows when selecting conflicting qualities
            </li>
            <li>
              ☐ <strong>Navigation:</strong> Back/Next buttons work correctly
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
