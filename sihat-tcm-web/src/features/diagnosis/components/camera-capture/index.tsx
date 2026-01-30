import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRef, useState, useCallback, useEffect } from "react";
import { Camera } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { ScientificResearchModal } from "../ScientificResearchModal";
import { getImageQualityValidator, ImageQualityResult } from "@/lib/imageQualityValidator";

import { useCamera } from "./useCamera";
import { ImageQualityOverlay } from "./ImageQualityOverlay";
import { CompositionGuideOverlay } from "./CompositionGuideOverlay";
import { AccessibilityFeedback } from "./AccessibilityFeedback";
import { CameraControls } from "./CameraControls";
import { CameraPreview } from "./CameraPreview";

interface CameraCaptureData {
  image?: string;
  quality?: ImageQualityResult;
}

interface CameraCaptureProps {
  onComplete?: (data: CameraCaptureData) => void;
  onCapture?: (data: { image?: string }) => void;
  onSkip?: () => void;
  title?: string;
  instruction?: string;
  required?: boolean;
  mode?: "tongue" | "face" | "body";
  type?: "tongue" | "face" | "body";
  onBack?: () => void;
  initialFacingMode?: "user" | "environment";
}

export function CameraCapture({
  onComplete,
  onCapture,
  onSkip,
  title,
  instruction,
  required = false,
  mode,
  type,
  onBack,
  initialFacingMode = "user",
}: CameraCaptureProps) {
  const { t } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();

  // Support both mode and type props
  const captureMode = mode || type || "face";

  // Custom Hooks
  const { stream, error, isLoading, startCamera, stopCamera, toggleCamera, facingMode } =
    useCamera(initialFacingMode);

  // Local UI State
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [showQualityOverlay, setShowQualityOverlay] = useState(true);
  const [showCompositionGuide, setShowCompositionGuide] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Refs
  const onCompleteRef = useRef(onComplete);
  const onCaptureRef = useRef(onCapture);
  const onSkipRef = useRef(onSkip);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCaptureRef.current = onCapture;
    onSkipRef.current = onSkip;
    onBackRef.current = onBack;
  }, [onComplete, onCapture, onSkip, onBack]);

  // Quality Assessment Logic
  const startQualityAssessment = useCallback(
    (video: HTMLVideoElement) => {
      if (qualityCheckIntervalRef.current) clearInterval(qualityCheckIntervalRef.current);

      activeVideoRef.current = video;

      const assessQuality = async () => {
        try {
          const validator = getImageQualityValidator();
          const result = await validator.assessVideoFrame(video, captureMode);
          setQualityResult(result);
        } catch (error) {
          console.warn("[Quality] Assessment failed:", error);
        }
      };

      assessQuality();
      qualityCheckIntervalRef.current = setInterval(assessQuality, 2000);
    },
    [captureMode]
  );

  const stopQualityAssessment = useCallback(() => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
      qualityCheckIntervalRef.current = null;
    }
    setQualityResult(null);
  }, []);

  // Capture Logic
  const captureImage = useCallback(async () => {
    const video = activeVideoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      try {
        const validator = getImageQualityValidator();
        const finalQuality = await validator.analyzeImage(imageData, captureMode);

        stopCamera();
        stopQualityAssessment();

        // Support both onCapture (simplified) and onComplete (legacy)
        if (onCaptureRef.current) {
          onCaptureRef.current({ image: imageData });
        } else if (onCompleteRef.current) {
          onCompleteRef.current({
            image: imageData,
            quality: finalQuality,
          });
        }
      } catch (error) {
        console.warn("[Quality] Final assessment failed:", error);
        stopCamera();
        stopQualityAssessment();
        if (onCaptureRef.current) {
          onCaptureRef.current({ image: imageData });
        } else if (onCompleteRef.current) {
          onCompleteRef.current({ image: imageData });
        }
      }
    }
  }, [captureMode, stopCamera, stopQualityAssessment]);

  // Cleanup
  useEffect(() => {
    return () => stopQualityAssessment();
  }, [stopQualityAssessment]);

  // Navigation Wiring
  const handleNext = useCallback(() => {
    const canSkip = !required || process.env.NODE_ENV === "development";
    if (canSkip) {
      if (onSkipRef.current) {
        onSkipRef.current();
      } else if (onCompleteRef.current) {
        onCompleteRef.current({ image: undefined });
      }
    } else {
      alert(t.camera.cameraError);
    }
  }, [required, t]);

  useEffect(() => {
    const canSkip = !required || process.env.NODE_ENV === "development";
    const handleSkipNav = () => {
      if (onSkipRef.current) {
        onSkipRef.current();
      } else if (onCompleteRef.current) {
        onCompleteRef.current({ image: undefined });
      }
    };
    setNavigationState({
      onNext: handleNext,
      onBack: onBackRef.current,
      onSkip: canSkip ? handleSkipNav : undefined,
      showNext: true,
      showBack: !!onBackRef.current,
      showSkip: canSkip,
      canNext: true,
    });
  }, [required, handleNext, setNavigationState]);

  const displayTitle = title || t.camera.takePhoto;
  const displayInstruction = instruction || t.camera.preparingCamera;

  return (
    <Card className="p-4 md:p-6 space-y-4 pb-36 md:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="text-center md:text-left flex-1">
          <h2 className="text-xl font-semibold text-emerald-800">{displayTitle}</h2>
          <p className="text-stone-600 text-sm mt-1">{displayInstruction}</p>
        </div>
        {mode === "tongue" && (
          <div className="self-center md:self-auto">
            <ScientificResearchModal />
          </div>
        )}
      </div>

      <div className="relative h-96 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
        {!hasStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
            <Button
              onClick={() => {
                setHasStarted(true);
                startCamera(); // facingMode handled in hook
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Camera className="w-6 h-6 mr-2" />
              {t.camera.startCamera}
            </Button>
            <p className="mt-4 text-sm text-stone-500">{t.camera.permissionRequired}</p>
          </div>
        ) : (
          <>
            <CameraPreview
              stream={stream}
              error={error}
              isLoading={isLoading}
              onRetry={startCamera}
              onVideoReady={startQualityAssessment}
              t={t}
            />

            <CameraControls
              onSwitchCamera={toggleCamera}
              onToggleQuality={() => setShowQualityOverlay(!showQualityOverlay)}
              onToggleGuide={() => setShowCompositionGuide(!showCompositionGuide)}
              showQualityOverlay={showQualityOverlay}
            />

            <ImageQualityOverlay qualityResult={qualityResult} isVisible={showQualityOverlay} />

            <CompositionGuideOverlay isVisible={showCompositionGuide} mode={captureMode} />

            <AccessibilityFeedback qualityResult={qualityResult} isEnabled={accessibilityMode} />

            {/* Capture Button Overlay */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
              <Button
                onClick={captureImage}
                className="w-16 h-16 rounded-full border-4 border-white bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                title={t.camera.takePhoto || "Take Photo"}
              >
                <Camera className="w-8 h-8 text-white" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
