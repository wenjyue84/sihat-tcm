"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================================
// Configuration Constants
// ============================================================================
const CONFIG = {
  BUFFER_SIZE: 300, // ~10 seconds at 30fps
  SAMPLE_RATE: 30, // Target FPS
  MIN_BPM: 42, // 0.7 Hz * 60
  MAX_BPM: 240, // 4.0 Hz * 60
  MIN_FREQUENCY: 0.7, // Hz (low cutoff for bandpass filter)
  MAX_FREQUENCY: 4.0, // Hz (high cutoff for bandpass filter)
  STABILIZATION_WINDOW: 90, // Frames before BPM is considered stable (~3 sec)
  SIGNAL_QUALITY_THRESHOLD: 0.15, // Minimum variance for valid signal
};

// ============================================================================
// Types
// ============================================================================
export interface CameraCapabilities {
  hasTorch: boolean;
  isMobile: boolean;
  isAndroidChrome: boolean;
  isSupported: boolean;
  unsupportedReason?: string;
}

export interface PPGSignalData {
  bpm: number | null;
  signalQuality: number; // 0-100
  isStable: boolean;
  rawSignal: number[]; // For visualization
  filteredSignal: number[]; // For visualization
}

export interface UseCameraHeartRateOptions {
  onBpmDetected?: (bpm: number) => void;
  onError?: (error: string) => void;
}

export interface UseCameraHeartRateReturn {
  // State
  isSupported: boolean;
  isActive: boolean;
  isInitializing: boolean;
  capabilities: CameraCapabilities | null;
  signalData: PPGSignalData;
  error: string | null;

  // Actions
  checkCapabilities: () => Promise<CameraCapabilities>;
  startMeasurement: () => Promise<void>;
  stopMeasurement: () => void;

  // Refs for component integration
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// ============================================================================
// Signal Processing Functions
// ============================================================================

/**
 * Extract the Green channel mean from ImageData
 * Green channel is most sensitive to blood flow changes
 */
function extractGreenChannelMean(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  let count = 0;

  // Sample every 4th pixel for performance (still accurate enough)
  for (let i = 1; i < data.length; i += 16) {
    sum += data[i]; // Green channel
    count++;
  }

  return sum / count;
}

/**
 * Simple moving average for noise reduction
 */
function movingAverage(signal: number[], windowSize: number): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;

    for (
      let j = Math.max(0, i - halfWindow);
      j <= Math.min(signal.length - 1, i + halfWindow);
      j++
    ) {
      sum += signal[j];
      count++;
    }

    result.push(sum / count);
  }

  return result;
}

/**
 * Detrend signal by removing linear trend
 */
function detrend(signal: number[]): number[] {
  const n = signal.length;
  if (n < 2) return signal;

  // Calculate linear regression coefficients
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += signal[i];
    sumXY += i * signal[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Remove linear trend
  return signal.map((val, i) => val - (slope * i + intercept));
}

/**
 * Bandpass filter using simple FIR approximation
 */
function bandpassFilter(
  signal: number[],
  sampleRate: number,
  lowCutoff: number,
  highCutoff: number
): number[] {
  // Normalize frequencies
  const nyquist = sampleRate / 2;
  const lowNorm = lowCutoff / nyquist;
  const highNorm = highCutoff / nyquist;

  // Simple bandpass: combine highpass and lowpass using moving averages
  const lowpassWindowSize = Math.max(3, Math.round(1 / highNorm));
  const highpassWindowSize = Math.max(5, Math.round(1 / lowNorm));

  // Apply lowpass first
  const lowpassed = movingAverage(signal, lowpassWindowSize);

  // Apply highpass by subtracting low-frequency component
  const lowFreqComponent = movingAverage(lowpassed, highpassWindowSize);

  return lowpassed.map((val, i) => val - lowFreqComponent[i]);
}

/**
 * Calculate signal variance for quality estimation
 */
function calculateVariance(signal: number[]): number {
  const n = signal.length;
  if (n < 2) return 0;

  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = signal.map((val) => Math.pow(val - mean, 2));

  return squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1);
}

/**
 * Simple FFT implementation for frequency analysis
 * Returns the dominant frequency in the signal
 */
function findDominantFrequency(
  signal: number[],
  sampleRate: number
): { frequency: number; magnitude: number } {
  const n = signal.length;
  const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));

  // Pad signal to power of 2
  const padded = [...signal];
  while (padded.length < paddedLength) {
    padded.push(0);
  }

  // Apply Hanning window
  const windowed = padded.map((val, i) => val * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))));

  // Simple DFT for the frequency range of interest
  const minBin = Math.floor((CONFIG.MIN_FREQUENCY * paddedLength) / sampleRate);
  const maxBin = Math.ceil((CONFIG.MAX_FREQUENCY * paddedLength) / sampleRate);

  let maxMagnitude = 0;
  let dominantBin = minBin;

  for (let k = minBin; k <= maxBin && k < paddedLength / 2; k++) {
    let real = 0;
    let imag = 0;

    for (let n = 0; n < paddedLength; n++) {
      const angle = (-2 * Math.PI * k * n) / paddedLength;
      real += windowed[n] * Math.cos(angle);
      imag += windowed[n] * Math.sin(angle);
    }

    const magnitude = Math.sqrt(real * real + imag * imag);

    if (magnitude > maxMagnitude) {
      maxMagnitude = magnitude;
      dominantBin = k;
    }
  }

  const dominantFrequency = (dominantBin * sampleRate) / paddedLength;

  return { frequency: dominantFrequency, magnitude: maxMagnitude };
}

/**
 * Calculate BPM from signal buffer
 */
function calculateBPM(
  signalBuffer: number[],
  sampleRate: number
): { bpm: number | null; quality: number } {
  if (signalBuffer.length < CONFIG.STABILIZATION_WINDOW) {
    return { bpm: null, quality: 0 };
  }

  // Detrend the signal
  const detrended = detrend(signalBuffer);

  // Check signal quality (variance)
  const variance = calculateVariance(detrended);
  if (variance < CONFIG.SIGNAL_QUALITY_THRESHOLD) {
    return { bpm: null, quality: Math.min(50, (variance / CONFIG.SIGNAL_QUALITY_THRESHOLD) * 50) };
  }

  // Apply bandpass filter
  const filtered = bandpassFilter(
    detrended,
    sampleRate,
    CONFIG.MIN_FREQUENCY,
    CONFIG.MAX_FREQUENCY
  );

  // Find dominant frequency using FFT
  const { frequency, magnitude } = findDominantFrequency(filtered, sampleRate);

  // Convert frequency to BPM
  const bpm = Math.round(frequency * 60);

  // Validate BPM range
  if (bpm < CONFIG.MIN_BPM || bpm > CONFIG.MAX_BPM) {
    return { bpm: null, quality: 30 };
  }

  // Calculate quality score based on magnitude and variance
  const quality = Math.min(
    100,
    Math.round((magnitude / (variance * signalBuffer.length)) * 100 * 2)
  );

  return { bpm, quality: Math.max(50, quality) };
}

// ============================================================================
// Main Hook
// ============================================================================
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
      const capabilities = track.getCapabilities?.();

      // Check if torch is available
      if (capabilities && "torch" in capabilities) {
        result.hasTorch = true;
        result.isSupported = true;
      } else {
        result.unsupportedReason = "Device camera does not support torch/flash";
      }

      // Stop the test stream
      testStream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      result.unsupportedReason = "Camera access denied or unavailable";
    }

    setCapabilities(result);
    setIsSupported(result.isSupported);

    return result;
  }, []);

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
          width: { ideal: 640 },
          height: { ideal: 480 },
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
  }, [capabilities, checkCapabilities, onError]);

  /**
   * Process a single video frame
   */
  const processFrame = useCallback(() => {
    if (!isActive && !isInitializing) return;

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
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

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

    // Calculate BPM every 10 frames after stabilization period
    if (
      frameCountRef.current % 10 === 0 &&
      signalBufferRef.current.length >= CONFIG.STABILIZATION_WINDOW
    ) {
      const { bpm, quality } = calculateBPM(signalBufferRef.current, CONFIG.SAMPLE_RATE);

      // Check stability
      let isStable = false;
      if (bpm !== null && lastBpmRef.current !== null) {
        if (Math.abs(bpm - lastBpmRef.current) <= 5) {
          stableCountRef.current++;
          isStable = stableCountRef.current >= 3;
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
    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isActive, isInitializing, onBpmDetected]);

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

  // Start processing loop when active
  useEffect(() => {
    if (isActive && !animationFrameRef.current) {
      processFrame();
    }
  }, [isActive, processFrame]);

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

// ============================================================================
// Test Utilities (for unit testing)
// ============================================================================

/**
 * Generate a mock PPG signal for testing
 */
export function generateMockPPGSignal(
  bpm: number,
  sampleRate: number = 30,
  durationSeconds: number = 10,
  noiseLevel: number = 0.1
): number[] {
  const numSamples = sampleRate * durationSeconds;
  const frequency = bpm / 60; // Convert BPM to Hz
  const signal: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Base sine wave at heart rate frequency
    const baseSignal = Math.sin(2 * Math.PI * frequency * t);
    // Add some harmonics for realistic PPG
    const harmonic = 0.3 * Math.sin(4 * Math.PI * frequency * t);
    // Add noise
    const noise = noiseLevel * (Math.random() - 0.5);
    // Add baseline wander
    const baseline = 0.1 * Math.sin(2 * Math.PI * 0.1 * t);

    signal.push(128 + 10 * (baseSignal + harmonic + noise + baseline));
  }

  return signal;
}

/**
 * Test the BPM calculation with a mock signal
 */
export function testBPMCalculation(targetBpm: number): {
  calculatedBpm: number | null;
  quality: number;
  error: number;
} {
  const mockSignal = generateMockPPGSignal(targetBpm, CONFIG.SAMPLE_RATE, 10);
  const { bpm, quality } = calculateBPM(mockSignal, CONFIG.SAMPLE_RATE);

  return {
    calculatedBpm: bpm,
    quality,
    error: bpm !== null ? Math.abs(bpm - targetBpm) : -1,
  };
}
