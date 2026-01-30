"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CONFIG } from "./config";
import {
  extractGreenChannelMean,
  calculateBPM,
  bandpassFilter,
  detrend,
} from "./signal-processing";
import type {
  CameraCapabilities,
  PPGSignalData,
  UseCameraHeartRateOptions,
  UseCameraHeartRateReturn,
} from "./types";

export function useCameraHeartRate(
  options: UseCameraHeartRateOptions = {}
): UseCameraHeartRateReturn {
  const { onBpmDetected, onError } = options;

  // State
  const [isSupported, setIsSupported] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signalData, setSignalData] = useState<PPGSignalData>({
    bpm: null,
    signalQuality: 0,
    isStable: false,
    rawSignal: [],
    filteredSignal: [],
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const signalBufferRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastBpmRef = useRef<number | null>(null);
  const stableCountRef = useRef(0);

  /**
   * Check device capabilities for torch/flash support
   */
  const checkCapabilities = useCallback(async (): Promise<CameraCapabilities> => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = isAndroid || isIOS;

    const result: CameraCapabilities = {
      hasTorch: false,
      isMobile,
      isAndroidChrome: isAndroid && isChrome,
      isSupported: false,
    };

    // iOS Safari doesn't support torch
    if (isIOS) {
      result.unsupportedReason = "iOS Safari does not support flash/torch control";
      setCapabilities(result);
      setIsSupported(false);
      return result;
    }

    // Desktop webcams typically don't have flash
    if (!isMobile) {
      result.unsupportedReason = "Desktop webcams do not have flash capability";
      setCapabilities(result);
      setIsSupported(false);
      return result;
    }

    // Check for torch capability
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        result.unsupportedReason = "Camera API not available";
        setCapabilities(result);
        setIsSupported(false);
        return result;
      }

      // Request camera access to check capabilities
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const track = testStream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();

      // Check if torch is available
      if (caps && "torch" in caps) {
        result.hasTorch = true;
        result.isSupported = true;
      } else {
        result.unsupportedReason = "Device camera does not support torch/flash";
      }

      // Stop the test stream
      testStream.getTracks().forEach((t) => t.stop());
    } catch {
      result.unsupportedReason = "Camera access denied or unavailable";
    }

    setCapabilities(result);
    setIsSupported(result.isSupported);

    return result;
  }, []);

  /**
   * Process a single video frame
   */
  const processFrame = useCallback(() => {
    if (!streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth || CONFIG.VIDEO_WIDTH;
    canvas.height = video.videoHeight || CONFIG.VIDEO_HEIGHT;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Extract green channel from center region (most likely finger placement)
    const centerX = canvas.width / 4;
    const centerY = canvas.height / 4;
    const sampleWidth = canvas.width / 2;
    const sampleHeight = canvas.height / 2;

    const imageData = ctx.getImageData(centerX, centerY, sampleWidth, sampleHeight);
    const greenMean = extractGreenChannelMean(imageData);

    // Add to signal buffer
    signalBufferRef.current.push(greenMean);

    // Keep buffer at max size
    if (signalBufferRef.current.length > CONFIG.BUFFER_SIZE) {
      signalBufferRef.current.shift();
    }

    frameCountRef.current++;

    // Calculate BPM every N frames after stabilization period
    if (
      frameCountRef.current % CONFIG.BPM_CALCULATION_INTERVAL === 0 &&
      signalBufferRef.current.length >= CONFIG.STABILIZATION_WINDOW
    ) {
      const { bpm, quality } = calculateBPM(signalBufferRef.current, CONFIG.SAMPLE_RATE);

      // Check stability
      let isStable = false;
      if (bpm !== null && lastBpmRef.current !== null) {
        if (Math.abs(bpm - lastBpmRef.current) <= CONFIG.STABILITY_THRESHOLD) {
          stableCountRef.current++;
          isStable = stableCountRef.current >= CONFIG.STABLE_COUNT_REQUIRED;
        } else {
          stableCountRef.current = 0;
        }
      }
      lastBpmRef.current = bpm;

      // Update state
      const filteredSignal =
        bpm !== null
          ? bandpassFilter(
              detrend(signalBufferRef.current.slice(-60)),
              CONFIG.SAMPLE_RATE,
              CONFIG.MIN_FREQUENCY,
              CONFIG.MAX_FREQUENCY
            )
          : [];

      setSignalData({
        bpm,
        signalQuality: quality,
        isStable,
        rawSignal: signalBufferRef.current.slice(-60),
        filteredSignal,
      });

      // Notify callback if stable BPM detected
      if (isStable && bpm !== null) {
        onBpmDetected?.(bpm);
      }
    }

    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [onBpmDetected]);

  /**
   * Start the camera and begin PPG measurement
   */
  const startMeasurement = useCallback(async () => {
    setError(null);
    setIsInitializing(true);

    try {
      // Check capabilities first if not already done
      let caps = capabilities;
      if (!caps) {
        caps = await checkCapabilities();
      }

      if (!caps.isSupported) {
        throw new Error(caps.unsupportedReason || "Camera PPG not supported on this device");
      }

      // Request camera with torch
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: CONFIG.VIDEO_WIDTH },
          height: { ideal: CONFIG.VIDEO_HEIGHT },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];

      // Turn on torch
      try {
        await track.applyConstraints({
          advanced: [{ torch: true } as MediaTrackConstraintSet],
        });
      } catch {
        throw new Error("Failed to turn on flash. Please ensure flash is available.");
      }

      // Connect video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Reset signal processing state
      signalBufferRef.current = [];
      frameCountRef.current = 0;
      lastBpmRef.current = null;
      stableCountRef.current = 0;

      setSignalData({
        bpm: null,
        signalQuality: 0,
        isStable: false,
        rawSignal: [],
        filteredSignal: [],
      });

      setIsActive(true);
      setIsInitializing(false);

      // Start frame processing
      processFrame();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to start camera";
      setError(errorMsg);
      setIsInitializing(false);
      onError?.(errorMsg);
    }
  }, [capabilities, checkCapabilities, onError, processFrame]);

  /**
   * Stop measurement and cleanup
   */
  const stopMeasurement = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        // Turn off torch before stopping
        track
          .applyConstraints({
            advanced: [{ torch: false } as MediaTrackConstraintSet],
          })
          .catch(() => {});
        track.stop();
      });
      streamRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMeasurement();
    };
  }, [stopMeasurement]);

  return {
    isSupported,
    isActive,
    isInitializing,
    capabilities,
    signalData,
    error,
    checkCapabilities,
    startMeasurement,
    stopMeasurement,
    videoRef,
    canvasRef,
  };
}
