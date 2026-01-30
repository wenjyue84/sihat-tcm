"use client";

// Re-export from modular structure for backward compatibility
export { useCameraHeartRate, CONFIG } from "./camera-heart-rate";
export {
  extractGreenChannelMean,
  movingAverage,
  detrend,
  bandpassFilter,
  calculateVariance,
  findDominantFrequency,
  calculateBPM,
  getFilteredSignal,
} from "./camera-heart-rate";
export { generateMockPPGSignal, testBPMCalculation } from "./camera-heart-rate";
export type {
  CameraCapabilities,
  PPGSignalData,
  UseCameraHeartRateOptions,
  UseCameraHeartRateReturn,
  BPMCalculationResult,
  FrequencyAnalysisResult,
} from "./camera-heart-rate";
