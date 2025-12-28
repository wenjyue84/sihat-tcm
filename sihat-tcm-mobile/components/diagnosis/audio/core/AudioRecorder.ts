/**
 * Audio Recorder Core
 * 
 * Core audio recording functionality with platform-specific implementations
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

import {
  AudioRecordingOptions,
  AudioRecordingStatus,
  AudioRecorderState,
  AudioRecorderCallbacks,
  AudioPermissionStatus,
} from '../interfaces/AudioInterfaces';

import { AUDIO_CONFIG } from '../../../../constants';
import { ErrorFactory, AudioError } from '../../../../lib/errors/AppError';

export class AudioRecorder {
  private recording?: Audio.Recording;
  private state: AudioRecorderState;
  private callbacks: AudioRecorderCallbacks;
  private amplitudeTimer?: NodeJS.Timeout;
  private qualityTimer?: NodeJS.Timeout;

  constructor(callbacks: AudioRecorderCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      hasPermission: false,
      duration: 0,
      amplitude: 0,
      quality: 'poor',
    };
  }

  /**
   * Initialize audio recorder
   */
  async initialize(): Promise<void> {
    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Check permissions
      const permission = await this.checkPermissions();
      this.state.hasPermission = permission.granted;

      if (!permission.granted) {
        throw new AudioError('Audio recording permission not granted');
      }
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'initialize'
      });
    }
  }
  /**
   * Check audio recording permissions
   */
  async checkPermissions(): Promise<AudioPermissionStatus> {
    try {
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'checkPermissions'
      });
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      if (this.state.isRecording) {
        throw new AudioError('Recording already in progress');
      }

      if (!this.state.hasPermission) {
        const permission = await this.checkPermissions();
        if (!permission.granted) {
          throw new AudioError('Audio recording permission required');
        }
        this.state.hasPermission = true;
      }

      // Create recording
      this.recording = new Audio.Recording();
      
      const options = this.getRecordingOptions();
      await this.recording.prepareToRecordAsync(options);
      
      await this.recording.startAsync();

      // Update state
      this.state.isRecording = true;
      this.state.isPaused = false;
      this.state.duration = 0;

      // Start monitoring
      this.startAmplitudeMonitoring();
      this.startQualityMonitoring();

      // Callback
      this.callbacks.onRecordingStart?.();

    } catch (error) {
      this.state.isRecording = false;
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'startRecording'
      });
    }
  }
  /**
   * Stop recording
   */
  async stopRecording(): Promise<string> {
    try {
      if (!this.state.isRecording || !this.recording) {
        throw new AudioError('No active recording to stop');
      }

      // Stop monitoring
      this.stopAmplitudeMonitoring();
      this.stopQualityMonitoring();

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new AudioError('Failed to get recording URI');
      }

      // Update state
      this.state.isRecording = false;
      this.state.isPaused = false;
      this.state.recordingUri = uri;

      // Callback
      this.callbacks.onRecordingStop?.(uri);

      return uri;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'stopRecording'
      });
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.state.isRecording || !this.recording) {
        throw new AudioError('No active recording to pause');
      }

      await this.recording.pauseAsync();
      this.state.isPaused = true;

      this.callbacks.onRecordingPause?.();
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'pauseRecording'
      });
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.state.isRecording || !this.recording || !this.state.isPaused) {
        throw new AudioError('No paused recording to resume');
      }

      await this.recording.startAsync();
      this.state.isPaused = false;

      this.callbacks.onRecordingResume?.();
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'resumeRecording'
      });
    }
  }
  /**
   * Get current recording status
   */
  async getStatus(): Promise<AudioRecordingStatus> {
    try {
      if (!this.recording) {
        return {
          canRecord: this.state.hasPermission,
          isRecording: false,
          isDoneRecording: false,
          durationMillis: 0,
        };
      }

      const status = await this.recording.getStatusAsync();
      
      return {
        canRecord: status.canRecord,
        isRecording: status.isRecording,
        isDoneRecording: status.isDoneRecording,
        durationMillis: status.durationMillis,
        metering: status.metering,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioRecorder',
        action: 'getStatus'
      });
    }
  }

  /**
   * Get current state
   */
  getState(): AudioRecorderState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.stopAmplitudeMonitoring();
      this.stopQualityMonitoring();

      if (this.recording) {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
        this.recording = undefined;
      }

      this.state.isRecording = false;
      this.state.isPaused = false;
    } catch (error) {
      console.error('[AudioRecorder] Cleanup failed:', error);
    }
  }
  // Private helper methods

  /**
   * Get platform-specific recording options
   */
  private getRecordingOptions(): AudioRecordingOptions {
    const baseOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
        numberOfChannels: AUDIO_CONFIG.CHANNELS,
        bitRate: AUDIO_CONFIG.BIT_RATE,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
        numberOfChannels: AUDIO_CONFIG.CHANNELS,
        bitRate: AUDIO_CONFIG.BIT_RATE,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: AUDIO_CONFIG.BIT_RATE,
      },
    };

    return baseOptions;
  }

  /**
   * Start amplitude monitoring
   */
  private startAmplitudeMonitoring(): void {
    this.amplitudeTimer = setInterval(async () => {
      try {
        if (this.recording) {
          const status = await this.recording.getStatusAsync();
          if (status.metering !== undefined) {
            this.state.amplitude = Math.abs(status.metering);
            this.callbacks.onAmplitudeUpdate?.(this.state.amplitude);
          }
          
          // Update duration
          this.state.duration = status.durationMillis;
        }
      } catch (error) {
        console.warn('[AudioRecorder] Amplitude monitoring error:', error);
      }
    }, 100); // Update every 100ms
  }

  /**
   * Stop amplitude monitoring
   */
  private stopAmplitudeMonitoring(): void {
    if (this.amplitudeTimer) {
      clearInterval(this.amplitudeTimer);
      this.amplitudeTimer = undefined;
    }
  }
  /**
   * Start quality monitoring
   */
  private startQualityMonitoring(): void {
    this.qualityTimer = setInterval(() => {
      try {
        // Calculate quality based on amplitude and duration
        const quality = this.calculateQuality();
        if (quality !== this.state.quality) {
          this.state.quality = quality;
          this.callbacks.onQualityUpdate?.(quality);
        }
      } catch (error) {
        console.warn('[AudioRecorder] Quality monitoring error:', error);
      }
    }, 1000); // Update every second
  }

  /**
   * Stop quality monitoring
   */
  private stopQualityMonitoring(): void {
    if (this.qualityTimer) {
      clearInterval(this.qualityTimer);
      this.qualityTimer = undefined;
    }
  }

  /**
   * Calculate recording quality based on current metrics
   */
  private calculateQuality(): 'poor' | 'fair' | 'good' | 'excellent' {
    const { amplitude, duration } = this.state;
    
    // Quality scoring based on amplitude and duration
    let score = 0;
    
    // Amplitude scoring (0-40 points)
    if (amplitude > 0.7) score += 40;
    else if (amplitude > 0.5) score += 30;
    else if (amplitude > 0.3) score += 20;
    else if (amplitude > 0.1) score += 10;
    
    // Duration scoring (0-30 points)
    if (duration > 10000) score += 30; // 10+ seconds
    else if (duration > 5000) score += 20; // 5+ seconds
    else if (duration > 2000) score += 10; // 2+ seconds
    
    // Consistency scoring (0-30 points)
    // This would be more sophisticated in a real implementation
    score += 15; // Baseline consistency score
    
    // Convert score to quality rating
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
}