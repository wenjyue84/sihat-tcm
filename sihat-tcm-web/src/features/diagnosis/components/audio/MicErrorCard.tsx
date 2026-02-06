"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Upload, ChevronLeft } from "lucide-react";
import type { MicErrorType } from "./hooks";

interface MicErrorTranslations {
  permissionDenied?: string;
  permissionDeniedDesc?: string;
  permissionDeniedTip?: string;
  notFound?: string;
  notFoundDesc?: string;
  notFoundTip?: string;
  busy?: string;
  busyDesc?: string;
  busyTip?: string;
  httpsRequired?: string;
  httpsRequiredDesc?: string;
  httpsRequiredTip?: string;
  generic?: string;
  genericDesc?: string;
  genericTip?: string;
  tryAgain?: string;
  uploadInstead?: string;
  skipVoiceAnalysis?: string;
  goBack?: string;
}

interface MicErrorCardProps {
  errorType: MicErrorType;
  translations: MicErrorTranslations;
  onRetry: () => void;
  onUpload: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

/**
 * Microphone Error Card - Enhanced error display with troubleshooting tips
 */
export function MicErrorCard({
  errorType,
  translations: t,
  onRetry,
  onUpload,
  onSkip,
  onBack,
}: MicErrorCardProps) {
  if (!errorType) return null;

  const errorConfig: Record<
    Exclude<MicErrorType, null>,
    { title?: string; desc?: string; tip?: string }
  > = {
    permission_denied: {
      title: t.permissionDenied,
      desc: t.permissionDeniedDesc,
      tip: t.permissionDeniedTip,
    },
    not_found: {
      title: t.notFound,
      desc: t.notFoundDesc,
      tip: t.notFoundTip,
    },
    busy: {
      title: t.busy,
      desc: t.busyDesc,
      tip: t.busyTip,
    },
    https_required: {
      title: t.httpsRequired,
      desc: t.httpsRequiredDesc,
      tip: t.httpsRequiredTip,
    },
    generic: {
      title: t.generic,
      desc: t.genericDesc,
      tip: t.genericTip,
    },
  };

  const config = errorConfig[errorType];

  return (
    <div
      id="mic-error-message"
      className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 space-y-4"
    >
      {/* Error Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-800">{config.title}</h3>
          <p className="text-sm text-red-700 mt-1">{config.desc}</p>
        </div>
      </div>

      {/* Tip Box */}
      <div className="bg-white/60 rounded-lg p-3 border border-red-100">
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-lg">💡</span>
          <p className="text-sm text-gray-700">{config.tip}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {errorType !== "https_required" && (
            <Button onClick={onRetry} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.tryAgain || "Try Again"}
            </Button>
          )}
          <Button
            onClick={onUpload}
            variant="outline"
            className="flex-1 border-green-600 text-green-700 hover:bg-green-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t.uploadInstead || "Upload Audio"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSkip}
            variant="ghost"
            className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            {t.skipVoiceAnalysis || "Skip Voice Analysis"}
          </Button>
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t.goBack || "Go Back"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
