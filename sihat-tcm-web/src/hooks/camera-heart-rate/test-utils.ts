import { CONFIG } from "./config";
import { calculateBPM } from "./signal-processing";

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
