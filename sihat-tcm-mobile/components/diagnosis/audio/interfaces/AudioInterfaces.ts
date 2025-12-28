/**
 * Audio Recording Interfaces
 * 
 * Type definitions for the enhanced audio recording system
 */

export interface AudioRecordingOptions {
  android: {
    extension: string;
    outputFormat: number;
    audioEncoder: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
  };
  ios: {
    extension: string;
    outputFormat: string;
    audioQuality: string;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth: number;
    linearPCMIsBigEndian: boolean;
    linearPCMIsFloat: boolean;
  };
  web: {
    mimeType: string;
    bitsPerSecond: number;
  };
}

export interface AudioRecordingStatus {
  canRecord: boolean;
  isRecording: boolean;
  isDoneRecording: boolean;
  durationMillis: number;
  metering?: number;
}

export interface AudioAnalysisResult {
  duration: number;
  averageAmplitude: number;
  peakAmplitude: number;
  silenceRatio: number;
  qualityScore: number;
  recommendations: string[];
}

export interface VoiceAnalysisData {
  pitch: number[];
  tone: string;
  rhythm: string;
  clarity: number;
  energy: number;
  breathPattern: string;
  tcmIndicators: {
    qiDeficiency: boolean;
    yangDeficiency: boolean;
    yinDeficiency: boolean;
    dampness: boolean;
    heatSigns: boolean;
  };
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  hasPermission: boolean;
  recordingUri?: string;
  duration: number;
  amplitude: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  error?: string;
}

export interface AudioRecorderCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (uri: string) => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  onAmplitudeUpdate?: (amplitude: number) => void;
  onQualityUpdate?: (quality: string) => void;
  onError?: (error: string) => void;
  onAnalysisComplete?: (analysis: VoiceAnalysisData) => void;
}

export interface AudioRecorderProps {
  onRecordingComplete: (uri: string, analysis: VoiceAnalysisData) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  minDuration?: number;
  enableAnalysis?: boolean;
  theme?: any;
  style?: any;
}

export interface AudioPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface AudioQualityMetrics {
  signalToNoise: number;
  dynamicRange: number;
  frequency: number;
  clarity: number;
  overall: number;
}