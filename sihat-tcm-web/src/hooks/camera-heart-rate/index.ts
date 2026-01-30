export { useCameraHeartRate } from "./useCameraHeartRate";
export { CONFIG } from "./config";
export {
  extractGreenChannelMean,
  movingAverage,
  detrend,
  bandpassFilter,
  calculateVariance,
  findDominantFrequency,
  calculateBPM,
  getFilteredSignal,
} from "./signal-processing";
export { generateMockPPGSignal, testBPMCalculation } from "./test-utils";
export type {
  CameraCapabilities,
  PPGSignalData,
  UseCameraHeartRateOptions,
  UseCameraHeartRateReturn,
  BPMCalculationResult,
  FrequencyAnalysisResult,
} from "./types";
