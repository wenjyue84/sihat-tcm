/**
 * Enhanced Audio Recorder Component - Refactored Version
 * 
 * Modular audio recording component for TCM voice diagnosis
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AudioRecorder } from './core/AudioRecorder';
import { AudioAnalyzer } from './analysis/AudioAnalyzer';
import {
  AudioRecorderProps,
  AudioRecorderState,
  VoiceAnalysisData,
  AudioPermissionStatus,
} from './interfaces/AudioInterfaces';

import { useTheme } from '../../../hooks/useTheme';
import { AUDIO_CONFIG } from '../../../constants';

export const EnhancedAudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onError,
  maxDuration = AUDIO_CONFIG.MAX_DURATION,
  minDuration = AUDIO_CONFIG.MIN_DURATION,
  enableAnalysis = true,
  theme: customTheme,
  style,
}) => {
  // Hooks
  const theme = useTheme();
  const finalTheme = customTheme || theme;

  // State
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    isProcessing: false,
    hasPermission: false,
    duration: 0,
    amplitude: 0,
    quality: 'poor',
  });
  const [permissionStatus, setPermissionStatus] = useState<AudioPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: 'undetermined',
  });

  // Refs
  const audioRecorder = useRef<AudioRecorder>();
  const audioAnalyzer = useRef<AudioAnalyzer>();
  const amplitudeAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Initialize components
  useEffect(() => {
    initializeComponents();
    return () => {
      cleanup();
    };
  }, []);

  // Animation effects
  useEffect(() => {
    if (recorderState.isRecording) {
      startPulseAnimation();
      updateAmplitudeAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [recorderState.isRecording, recorderState.amplitude]);

  /**
   * Initialize audio components
   */
  const initializeComponents = async () => {
    try {
      // Initialize audio recorder
      audioRecorder.current = new AudioRecorder({
        onRecordingStart: () => {
          setRecorderState(prev => ({ ...prev, isRecording: true }));
        },
        onRecordingStop: handleRecordingStop,
        onRecordingPause: () => {
          setRecorderState(prev => ({ ...prev, isPaused: true }));
        },
        onRecordingResume: () => {
          setRecorderState(prev => ({ ...prev, isPaused: false }));
        },
        onAmplitudeUpdate: (amplitude) => {
          setRecorderState(prev => ({ ...prev, amplitude }));
        },
        onQualityUpdate: (quality) => {
          setRecorderState(prev => ({ ...prev, quality: quality as any }));
        },
        onError: (error) => {
          onError?.(error);
          setRecorderState(prev => ({ ...prev, error }));
        },
      });

      // Initialize audio analyzer
      if (enableAnalysis) {
        audioAnalyzer.current = new AudioAnalyzer();
      }

      // Initialize recorder
      await audioRecorder.current.initialize();
      
      // Check permissions
      const permission = await audioRecorder.current.checkPermissions();
      setPermissionStatus(permission);
      setRecorderState(prev => ({ ...prev, hasPermission: permission.granted }));

    } catch (error) {
      console.error('[EnhancedAudioRecorder] Initialization failed:', error);
      onError?.(error instanceof Error ? error.message : 'Initialization failed');
    }
  };
  /**
   * Handle recording stop
   */
  const handleRecordingStop = async (uri: string) => {
    try {
      setRecorderState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isProcessing: enableAnalysis,
        recordingUri: uri 
      }));

      if (enableAnalysis && audioAnalyzer.current) {
        // Analyze the recording
        const analysis = await audioAnalyzer.current.analyzeAudio(uri);
        setRecorderState(prev => ({ ...prev, isProcessing: false }));
        onRecordingComplete(uri, analysis);
      } else {
        // Return without analysis
        const basicAnalysis: VoiceAnalysisData = {
          pitch: [150],
          tone: 'normal',
          rhythm: 'regular',
          clarity: 75,
          energy: 50,
          breathPattern: 'normal',
          tcmIndicators: {
            qiDeficiency: false,
            yangDeficiency: false,
            yinDeficiency: false,
            dampness: false,
            heatSigns: false,
          },
        };
        onRecordingComplete(uri, basicAnalysis);
      }
    } catch (error) {
      console.error('[EnhancedAudioRecorder] Recording processing failed:', error);
      setRecorderState(prev => ({ ...prev, isProcessing: false }));
      onError?.(error instanceof Error ? error.message : 'Processing failed');
    }
  };

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      if (!audioRecorder.current) {
        throw new Error('Audio recorder not initialized');
      }

      if (!recorderState.hasPermission) {
        const permission = await audioRecorder.current.checkPermissions();
        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Microphone access is required for voice recording.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {/* Open settings */} },
            ]
          );
          return;
        }
        setRecorderState(prev => ({ ...prev, hasPermission: true }));
      }

      await audioRecorder.current.startRecording();
      
      // Auto-stop after max duration
      setTimeout(() => {
        if (recorderState.isRecording) {
          stopRecording();
        }
      }, maxDuration);

    } catch (error) {
      console.error('[EnhancedAudioRecorder] Start recording failed:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = async () => {
    try {
      if (!audioRecorder.current) {
        throw new Error('Audio recorder not initialized');
      }

      // Check minimum duration
      if (recorderState.duration < minDuration) {
        Alert.alert(
          'Recording Too Short',
          `Please record for at least ${minDuration / 1000} seconds.`
        );
        return;
      }

      await audioRecorder.current.stopRecording();
    } catch (error) {
      console.error('[EnhancedAudioRecorder] Stop recording failed:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  };
  /**
   * Toggle recording (start/stop)
   */
  const toggleRecording = () => {
    if (recorderState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /**
   * Start pulse animation
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Stop pulse animation
   */
  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  /**
   * Update amplitude animation
   */
  const updateAmplitudeAnimation = () => {
    Animated.timing(amplitudeAnimation, {
      toValue: recorderState.amplitude,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  /**
   * Cleanup resources
   */
  const cleanup = async () => {
    try {
      if (audioRecorder.current) {
        await audioRecorder.current.cleanup();
      }
      if (audioAnalyzer.current) {
        audioAnalyzer.current.clearCache();
      }
    } catch (error) {
      console.error('[EnhancedAudioRecorder] Cleanup failed:', error);
    }
  };

  /**
   * Format duration for display
   */
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get quality color
   */
  const getQualityColor = (): string => {
    switch (recorderState.quality) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return finalTheme.text.secondary;
    }
  };
  // Render permission request if needed
  if (!recorderState.hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.permissionContainer}>
          <Ionicons 
            name="mic-off" 
            size={64} 
            color={finalTheme.text.secondary} 
          />
          <Text style={[styles.permissionText, { color: finalTheme.text.secondary }]}>
            Microphone access is required for voice recording and TCM analysis.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: finalTheme.accent.primary }]}
            onPress={startRecording}
          >
            <Text style={styles.permissionButtonText}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Processing Overlay */}
      {recorderState.isProcessing && (
        <View style={[styles.processingOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.processingContainer, { backgroundColor: finalTheme.surface.elevated }]}>
            <Text style={[styles.processingText, { color: finalTheme.text.primary }]}>
              Analyzing voice...
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: finalTheme.text.primary }]}>
          Voice Recording
        </Text>
        <Text style={[styles.subtitle, { color: finalTheme.text.secondary }]}>
          Speak clearly for TCM voice analysis
        </Text>
      </View>

      {/* Recording Visualizer */}
      <View style={styles.visualizerContainer}>
        <Animated.View
          style={[
            styles.recordingButton,
            {
              backgroundColor: recorderState.isRecording 
                ? '#F44336' 
                : finalTheme.accent.primary,
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.recordingButtonInner}
            onPress={toggleRecording}
            disabled={recorderState.isProcessing}
          >
            <Ionicons
              name={recorderState.isRecording ? 'stop' : 'mic'}
              size={32}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Amplitude Visualizer */}
        {recorderState.isRecording && (
          <View style={styles.amplitudeContainer}>
            {[...Array(5)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.amplitudeBar,
                  {
                    height: amplitudeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 40],
                    }),
                    backgroundColor: finalTheme.accent.primary,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
      {/* Status Information */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: finalTheme.text.secondary }]}>
            Duration:
          </Text>
          <Text style={[styles.statusValue, { color: finalTheme.text.primary }]}>
            {formatDuration(recorderState.duration)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: finalTheme.text.secondary }]}>
            Quality:
          </Text>
          <View style={styles.qualityContainer}>
            <View style={[styles.qualityBar, { backgroundColor: finalTheme.border.default }]}>
              <View
                style={[
                  styles.qualityFill,
                  {
                    backgroundColor: getQualityColor(),
                    width: `${Math.max(25, recorderState.amplitude * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.qualityText, { color: getQualityColor() }]}>
              {recorderState.quality.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: finalTheme.surface.elevated }]}
          onPress={() => {/* Reset/Clear */}}
          disabled={recorderState.isRecording || recorderState.isProcessing}
        >
          <Ionicons name="refresh" size={20} color={finalTheme.text.primary} />
          <Text style={[styles.secondaryButtonText, { color: finalTheme.text.primary }]}>
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: finalTheme.accent.primary }]}
          onPress={toggleRecording}
          disabled={recorderState.isProcessing}
        >
          <Ionicons
            name={recorderState.isRecording ? 'stop' : 'mic'}
            size={20}
            color="#ffffff"
          />
          <Text style={styles.primaryButtonText}>
            {recorderState.isRecording ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  visualizerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amplitudeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  amplitudeBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  statusContainer: {
    marginBottom: 32,
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityBar: {
    width: 100,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 3,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default EnhancedAudioRecorder;