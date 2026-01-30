export const CONFIG = {
  /** Buffer size for signal data (~10 seconds at 30fps) */
  BUFFER_SIZE: 300,
  /** Target frames per second */
  SAMPLE_RATE: 30,
  /** Minimum BPM (0.7 Hz * 60) */
  MIN_BPM: 42,
  /** Maximum BPM (4.0 Hz * 60) */
  MAX_BPM: 240,
  /** Low cutoff for bandpass filter (Hz) */
  MIN_FREQUENCY: 0.7,
  /** High cutoff for bandpass filter (Hz) */
  MAX_FREQUENCY: 4.0,
  /** Frames before BPM is considered stable (~3 sec) */
  STABILIZATION_WINDOW: 90,
  /** Minimum variance for valid signal */
  SIGNAL_QUALITY_THRESHOLD: 0.15,
  /** BPM calculation interval in frames */
  BPM_CALCULATION_INTERVAL: 10,
  /** Maximum BPM difference for stability */
  STABILITY_THRESHOLD: 5,
  /** Consecutive stable readings required */
  STABLE_COUNT_REQUIRED: 3,
  /** Video dimensions */
  VIDEO_WIDTH: 640,
  VIDEO_HEIGHT: 480,
} as const;

export type Config = typeof CONFIG;
