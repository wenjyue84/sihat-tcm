import { CONFIG } from "./config";
import type { BPMCalculationResult, FrequencyAnalysisResult } from "./types";

/**
 * Extract the Green channel mean from ImageData
 * Green channel is most sensitive to blood flow changes
 */
export function extractGreenChannelMean(imageData: ImageData): number {
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
export function movingAverage(signal: number[], windowSize: number): number[] {
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
export function detrend(signal: number[]): number[] {
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
export function bandpassFilter(
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
export function calculateVariance(signal: number[]): number {
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
export function findDominantFrequency(
  signal: number[],
  sampleRate: number
): FrequencyAnalysisResult {
  const n = signal.length;
  const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));

  // Pad signal to power of 2
  const padded = [...signal];
  while (padded.length < paddedLength) {
    padded.push(0);
  }

  // Apply Hanning window
  const windowed = padded.map(
    (val, i) => val * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
  );

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
export function calculateBPM(
  signalBuffer: number[],
  sampleRate: number
): BPMCalculationResult {
  if (signalBuffer.length < CONFIG.STABILIZATION_WINDOW) {
    return { bpm: null, quality: 0 };
  }

  // Detrend the signal
  const detrended = detrend(signalBuffer);

  // Check signal quality (variance)
  const variance = calculateVariance(detrended);
  if (variance < CONFIG.SIGNAL_QUALITY_THRESHOLD) {
    return {
      bpm: null,
      quality: Math.min(50, (variance / CONFIG.SIGNAL_QUALITY_THRESHOLD) * 50),
    };
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

/**
 * Get filtered signal for visualization
 */
export function getFilteredSignal(signalBuffer: number[], sampleRate: number): number[] {
  const recentSignal = signalBuffer.slice(-60);
  return bandpassFilter(
    detrend(recentSignal),
    sampleRate,
    CONFIG.MIN_FREQUENCY,
    CONFIG.MAX_FREQUENCY
  );
}
