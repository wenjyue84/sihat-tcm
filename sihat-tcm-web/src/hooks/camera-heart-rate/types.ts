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

export interface BPMCalculationResult {
  bpm: number | null;
  quality: number;
}

export interface FrequencyAnalysisResult {
  frequency: number;
  magnitude: number;
}
