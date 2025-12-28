/**
 * Audio Module Exports
 * 
 * Centralized exports for the enhanced audio recording system
 */

// Main component
export { default as EnhancedAudioRecorder } from './EnhancedAudioRecorder';

// Core classes
export { AudioRecorder } from './core/AudioRecorder';
export { AudioAnalyzer } from './analysis/AudioAnalyzer';

// Interfaces
export type {
  AudioRecordingOptions,
  AudioRecordingStatus,
  AudioAnalysisResult,
  VoiceAnalysisData,
  AudioRecorderState,
  AudioRecorderCallbacks,
  AudioRecorderProps,
  AudioPermissionStatus,
  AudioQualityMetrics,
} from './interfaces/AudioInterfaces';