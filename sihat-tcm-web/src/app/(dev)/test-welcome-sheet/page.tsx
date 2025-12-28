"use client";

import { useState } from "react";
import { MobileWelcomeSheet } from "@/components/landing/MobileWelcomeSheet";

/**
 * TEST PAGE: Mobile Welcome Sheet
 *
 * This page allows testing the MobileWelcomeSheet component in isolation.
 * Access at: http://localhost:3000/test-welcome-sheet
 *
 * VERIFICATION CHECKLIST:
 * ✅ Sheet appears on mobile viewport (resize browser or use DevTools)
 * ✅ Sheet is hidden on desktop (lg: breakpoint and above)
 * ✅ Animated entrance (slide up from bottom)
 * ✅ Status badge with pulsing indicator
 * ✅ Stats cards display correctly
 * ✅ CTA button dismisses the sheet
 * ✅ Close (X) button dismisses the sheet
 * ✅ Clicking backdrop dismisses the sheet
 * ✅ After dismissal, sheet doesn't reappear on page reload
 * ✅ "Reset" button on this test page clears localStorage and reloads
 */

export default function TestWelcomeSheetPage() {
  const [key, setKey] = useState(0);

  const handleReset = () => {
    try {
      localStorage.removeItem("sihat-tcm-welcome-seen");
    } catch {
      // Ignore
    }
    // Force re-mount the component
    setKey((prev) => prev + 1);
  };

  const handleHardReset = () => {
    try {
      localStorage.removeItem("sihat-tcm-welcome-seen");
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-emerald-400">🧪 Test: Mobile Welcome Sheet</h1>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold text-lg mb-2">📝 Instructions</h2>
          <ul className="text-slate-300 text-sm space-y-2">
            <li>1. Open DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)</li>
            <li>2. Select a mobile device (iPhone, Pixel, etc.)</li>
            <li>3. If you've already seen the sheet, click "Reset & Reload" below</li>
            <li>4. The welcome sheet should appear with a slide-up animation</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-colors"
          >
            🔄 Reset (Component Only)
          </button>
          <button
            onClick={handleHardReset}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            🔄 Reset & Reload Page
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold text-lg mb-3 text-emerald-400">✅ Verification Checklist</h2>
          <div className="grid gap-2 text-sm">
            {[
              "Sheet appears on mobile viewport",
              "Sheet is hidden on desktop (lg: and above)",
              "Animated entrance (slide up)",
              "Status badge with pulsing indicator",
              "Stats cards (3-min, 95%) display correctly",
              "CTA button dismisses the sheet",
              "Close (X) button works",
              "Clicking backdrop dismisses sheet",
              "Sheet doesn't reappear after dismiss + reload",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" className="w-4 h-4 rounded accent-emerald-500" />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-500">Component Key: {key} (changes on reset)</p>
        </div>
      </div>

      {/* The actual component being tested */}
      <MobileWelcomeSheet key={key} />
    </div>
  );
}
