import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTouchButton, SwipeGestureHandler, GestureIndicator } from '../ui/EnhancedTouchInterface';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Enhanced Audio Recorder Component for Mobile Diagnosis
 * Features:
 * - Real-time audio visualization
 * - Gesture controls for recording
 * - Voice activity detection
 * - Audio quality monitoring
 * - Multiple recording modes
 */

export default function EnhancedAudioRecorder({
    onAudioRecorded,
    onCancel,
    recordingMode = 'voice', // 'voice', 'breathing', 'cough'
    maxDuration = 30, // seconds
    enableGestures = true,
    showVisualization = true,
    theme,
    isDark,
    t = {}
}) {
    // Audio state
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, recorded, playing
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [sound, setSound] = useState(null);
    const [audioUri, setAudioUri] = useState(null);
    const [duration, setDuration] = useState(0);
    const [metering, setMetering] = useState(-160);
    
    // UI state
    const [showGestureHint, setShowGestureHint] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioQuality, setAudioQuality] = useState(0);
    const [voiceActivity, setVoiceActivity] = useState(false);
    
    // Refs
    const waveformData = useRef(new Array(50).fill(0));
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const recordingAnim = useRef(new Animated.Value(0)).current;
    const qualityAnim = useRef(new Animated.Value(0)).current;
    
    // Translations
    const translations = {
        title: t.audio?.title || 'Audio Recording',
        startRecording: t.audio?.startRecording || 'Start Recording',
        stopRecording: t.audio?.stopRecording || 'Stop Recording',
        playback: t.audio?.playback || 'Play Recording',
        retake: t.audio?.retake || 'Retake',
        useRecording: t.audio?.useRecording || 'Use Recording',
        gestureHint: t.audio?.gestureHint || 'Hold to record, release to stop',
        voiceMode: t.audio?.voiceMode || 'Voice Recording',
        breathingMode: t.audio?.breathingMode || 'Breathing Analysis',
        coughMode: t.audio?.coughMode || 'Cough Analysis',
        qualityGood: t.audio?.qualityGood || 'Good Quality',
        qualityPoor: t.audio?.qualityPoor || 'Poor Quality - Speak louder',
        voiceDetected: t.audio?.voiceDetected || 'Voice Detected',
        noVoice: t.audio?.noVoice || 'No Voice Detected',
        permissionRequired: t.audio?.permissionRequired || 'Microphone permission required',
        grantPermission: t.audio?.grantPermission || 'Grant Permission',
        processing: t.audio?.processing || 'Processing audio...',
    };

    const styles = createStyles(theme, isDark);

    // Request microphone permission on mount
    useEffect(() => {
        if (permissionResponse?.status !== 'granted') {
            requestPermission();
        }
    }, [permissionResponse, requestPermission]);

    // Show gesture hint on first load
    useEffect(() => {
        if (enableGestures && permissionResponse?.granted) {
            const timer = setTimeout(() => {
                setShowGestureHint(true);
                setTimeout(() => setShowGestureHint(false), 3000);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [enableGestures, permissionResponse?.granted]);

    // Recording animation
    useEffect(() => {
        if (recordingStatus === 'recording') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordingAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordingAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            recordingAnim.stopAnimation();
            recordingAnim.setValue(0);
        }
    }, [recordingStatus]);

    // Pulse animation based on metering
    useEffect(() => {
        if (recordingStatus === 'recording') {
            const scale = Math.max(1, 1 + (Math.max(metering, -60) + 60) / 100);
            Animated.timing(pulseAnim, {
                toValue: scale,
                duration: 100,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(pulseAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    }, [metering, recordingStatus]);

    // Quality animation
    useEffect(() => {
        Animated.timing(qualityAnim, {
            toValue: audioQuality / 100,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [audioQuality]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                const permission = await requestPermission();
                if (permission.status !== 'granted') {
                    Alert.alert(
                        translations.permissionRequired,
                        'Please allow microphone access to record audio.'
                    );
                    return;
                }
            }

            // Clean up any existing recording
            if (recording) {
                await recording.stopAndUnloadAsync();
                setRecording(null);
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                shouldDuckAndroid: true,
                interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // Configure recording options based on mode
            const recordingOptions = getRecordingOptions(recordingMode);
            
            const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
            
            setRecording(newRecording);
            setRecordingStatus('recording');
            setAudioUri(null);
            setDuration(0);
            setAudioQuality(0);
            setVoiceActivity(false);

            // Set up metering and status updates
            newRecording.setOnRecordingStatusUpdate((status) => {
                if (status.metering !== undefined) {
                    setMetering(status.metering);
                    updateWaveform(status.metering);
                    updateAudioQuality(status.metering);
                    detectVoiceActivity(status.metering);
                }
                if (status.durationMillis !== undefined) {
                    const durationSec = status.durationMillis / 1000;
                    setDuration(durationSec);
                    
                    // Auto-stop at max duration
                    if (durationSec >= maxDuration) {
                        stopRecording();
                    }
                }
            });

        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        }
    }, [permissionResponse, recording, recordingMode, maxDuration]);

    // Stop recording
    const stopRecording = useCallback(async () => {
        if (!recording) return;

        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRecordingStatus('recorded');

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri);
            setRecording(null);

            // Process audio for quality analysis
            await processAudioFile(uri);

        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Recording Error', 'Failed to stop recording.');
        }
    }, [recording]);

    // Get recording options based on mode
    const getRecordingOptions = (mode) => {
        const baseOptions = {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
            isMeteringEnabled: true,
        };

        switch (mode) {
            case 'breathing':
                return {
                    ...baseOptions,
                    android: {
                        ...baseOptions.android,
                        sampleRate: 22050, // Lower sample rate for breathing analysis
                        numberOfChannels: 1,
                        bitRate: 64000,
                    },
                    ios: {
                        ...baseOptions.ios,
                        sampleRate: 22050,
                        numberOfChannels: 1,
                        bitRate: 64000,
                    },
                };
            case 'cough':
                return {
                    ...baseOptions,
                    android: {
                        ...baseOptions.android,
                        sampleRate: 44100, // Higher sample rate for cough analysis
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    ios: {
                        ...baseOptions.ios,
                        sampleRate: 44100,
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                };
            default: // voice
                return baseOptions;
        }
    };

    // Update waveform visualization
    const updateWaveform = (meteringValue) => {
        const normalizedValue = Math.max(0, (meteringValue + 60) / 60); // Normalize -60 to 0 dB to 0-1
        waveformData.current.shift();
        waveformData.current.push(normalizedValue);
    };

    // Update audio quality assessment
    const updateAudioQuality = (meteringValue) => {
        // Simple quality assessment based on signal level
        let quality = 0;
        if (meteringValue > -30) {
            quality = 90; // Excellent
        } else if (meteringValue > -40) {
            quality = 70; // Good
        } else if (meteringValue > -50) {
            quality = 50; // Fair
        } else {
            quality = 20; // Poor
        }
        setAudioQuality(quality);
    };

    // Detect voice activity
    const detectVoiceActivity = (meteringValue) => {
        const threshold = recordingMode === 'voice' ? -40 : -50;
        setVoiceActivity(meteringValue > threshold);
    };

    // Process audio file for additional analysis
    const processAudioFile = async (uri) => {
        setIsProcessing(true);
        try {
            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(uri);
            console.log('Audio file info:', fileInfo);

            // Additional processing could be added here
            // e.g., noise reduction, format conversion, etc.

        } catch (error) {
            console.error('Audio processing error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Play recorded audio
    const playRecording = useCallback(async () => {
        if (!audioUri) return;

        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true }
            );

            setSound(newSound);
            setRecordingStatus('playing');

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setRecordingStatus('recorded');
                }
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        } catch (error) {
            console.error('Playback error:', error);
            Alert.alert('Playback Error', 'Failed to play recording.');
        }
    }, [audioUri, sound]);

    // Handle gesture recording (hold to record)
    const handleGestureRecording = useCallback(async (isPressed) => {
        if (!enableGestures) return;

        if (isPressed && recordingStatus === 'idle') {
            await startRecording();
        } else if (!isPressed && recordingStatus === 'recording') {
            await stopRecording();
        }
    }, [enableGestures, recordingStatus, startRecording, stopRecording]);

    // Confirm and use recording
    const confirmRecording = useCallback(() => {
        if (audioUri) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAudioRecorded({
                uri: audioUri,
                duration: duration,
                quality: audioQuality,
                mode: recordingMode,
                hasVoiceActivity: voiceActivity,
            });
        }
    }, [audioUri, duration, audioQuality, recordingMode, voiceActivity, onAudioRecorded]);

    // Retake recording
    const retakeRecording = useCallback(() => {
        setRecordingStatus('idle');
        setAudioUri(null);
        setDuration(0);
        setAudioQuality(0);
        setVoiceActivity(false);
        waveformData.current = new Array(50).fill(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Format duration display
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get quality color
    const getQualityColor = () => {
        if (audioQuality >= 70) return theme.semantic.success;
        if (audioQuality >= 50) return theme.semantic.warning;
        return theme.semantic.error;
    };

    // Permission not granted
    if (permissionResponse?.status !== 'granted') {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="mic-outline" size={64} color={theme.text.tertiary} />
                    <Text style={styles.permissionText}>{translations.permissionRequired}</Text>
                    <HapticTouchButton
                        style={styles.permissionButton}
                        onPress={requestPermission}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Text style={styles.permissionButtonText}>{translations.grantPermission}</Text>
                    </HapticTouchButton>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{translations.title}</Text>
                <HapticTouchButton
                    onPress={onCancel}
                    style={styles.closeButton}
                    theme={theme}
                    isDark={isDark}
                >
                    <Ionicons name="close" size={24} color={theme.text.primary} />
                </HapticTouchButton>
            </View>

            {/* Recording Mode Selector */}
            <View style={styles.modeSelector}>
                {['voice', 'breathing', 'cough'].map((mode) => (
                    <HapticTouchButton
                        key={mode}
                        onPress={() => setRecordingMode(mode)}
                        style={[
                            styles.modeButton,
                            recordingMode === mode && styles.modeButtonActive
                        ]}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Text style={[
                            styles.modeButtonText,
                            recordingMode === mode && styles.modeButtonTextActive
                        ]}>
                            {translations[`${mode}Mode`] || mode}
                        </Text>
                    </HapticTouchButton>
                ))}
            </View>

            {/* Waveform Visualization */}
            {showVisualization && (
                <View style={styles.visualizationContainer}>
                    <View style={styles.waveform}>
                        {waveformData.current.map((value, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.waveformBar,
                                    {
                                        height: Math.max(2, value * 60),
                                        backgroundColor: recordingStatus === 'recording' 
                                            ? theme.accent.primary 
                                            : theme.text.tertiary,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Recording Controls */}
            <SwipeGestureHandler
                onSwipeUp={() => recordingStatus === 'idle' && startRecording()}
                onSwipeDown={() => recordingStatus === 'recording' && stopRecording()}
                enabled={enableGestures}
                theme={theme}
                isDark={isDark}
            >
                <View style={styles.recordingContainer}>
                    {/* Status Display */}
                    <View style={styles.statusContainer}>
                        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
                        <Text style={styles.maxDurationText}>/ {formatDuration(maxDuration)}</Text>
                    </View>

                    {/* Main Recording Button */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <HapticTouchButton
                            onPressIn={() => handleGestureRecording(true)}
                            onPressOut={() => handleGestureRecording(false)}
                            onPress={recordingStatus === 'idle' ? startRecording : 
                                    recordingStatus === 'recording' ? stopRecording : 
                                    playRecording}
                            style={[
                                styles.recordButton,
                                recordingStatus === 'recording' && styles.recordButtonActive
                            ]}
                            hapticType="heavy"
                            theme={theme}
                            isDark={isDark}
                        >
                            <LinearGradient
                                colors={recordingStatus === 'recording' 
                                    ? ['#ef4444', '#dc2626'] 
                                    : theme.gradients.primary}
                                style={styles.recordButtonGradient}
                            >
                                <Ionicons 
                                    name={recordingStatus === 'idle' ? 'mic' :
                                          recordingStatus === 'recording' ? 'stop' :
                                          recordingStatus === 'recorded' ? 'play' : 'mic'}
                                    size={40} 
                                    color="#ffffff" 
                                />
                            </LinearGradient>
                        </HapticTouchButton>
                    </Animated.View>

                    {/* Recording Indicator */}
                    {recordingStatus === 'recording' && (
                        <Animated.View
                            style={[
                                styles.recordingIndicator,
                                {
                                    opacity: recordingAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                },
                            ]}
                        >
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>Recording...</Text>
                        </Animated.View>
                    )}
                </View>
            </SwipeGestureHandler>

            {/* Quality and Activity Indicators */}
            {recordingStatus === 'recording' && (
                <View style={styles.indicatorsContainer}>
                    {/* Audio Quality */}
                    <View style={styles.qualityContainer}>
                        <Text style={styles.qualityLabel}>Quality</Text>
                        <View style={styles.qualityBar}>
                            <Animated.View
                                style={[
                                    styles.qualityFill,
                                    {
                                        width: qualityAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                        backgroundColor: getQualityColor(),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.qualityText, { color: getQualityColor() }]}>
                            {audioQuality >= 70 ? translations.qualityGood : translations.qualityPoor}
                        </Text>
                    </View>

                    {/* Voice Activity */}
                    <View style={styles.activityContainer}>
                        <Ionicons 
                            name={voiceActivity ? 'volume-high' : 'volume-mute'} 
                            size={20} 
                            color={voiceActivity ? theme.semantic.success : theme.text.tertiary} 
                        />
                        <Text style={[
                            styles.activityText,
                            { color: voiceActivity ? theme.semantic.success : theme.text.tertiary }
                        ]}>
                            {voiceActivity ? translations.voiceDetected : translations.noVoice}
                        </Text>
                    </View>
                </View>
            )}

            {/* Gesture Hint */}
            <GestureIndicator
                visible={showGestureHint}
                direction="up"
                text={translations.gestureHint}
                theme={theme}
                isDark={isDark}
            />

            {/* Action Buttons */}
            {recordingStatus === 'recorded' && (
                <View style={styles.actionContainer}>
                    <HapticTouchButton
                        onPress={retakeRecording}
                        style={styles.secondaryButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Ionicons name="refresh" size={20} color={theme.text.primary} />
                        <Text style={styles.secondaryButtonText}>{translations.retake}</Text>
                    </HapticTouchButton>

                    <HapticTouchButton
                        onPress={confirmRecording}
                        style={styles.primaryButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Text style={styles.primaryButtonText}>{translations.useRecording}</Text>
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                    </HapticTouchButton>
                </View>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.processingContainer}>
                        <Text style={styles.processingText}>{translations.processing}</Text>
                    </BlurView>
                </View>
            )}
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 12,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: theme.surface.elevated,
        borderWidth: 1,
        borderColor: theme.border.default,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: theme.accent.primary + '20',
        borderColor: theme.accent.primary,
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.tertiary,
    },
    modeButtonTextActive: {
        color: theme.accent.primary,
    },
    visualizationContainer: {
        height: 80,
        marginBottom: 30,
        justifyContent: 'center',
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 2,
    },
    waveformBar: {
        width: 3,
        borderRadius: 1.5,
        minHeight: 2,
    },
    recordingContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    durationText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
        fontVariant: ['tabular-nums'],
    },
    maxDurationText: {
        fontSize: 16,
        color: theme.text.tertiary,
        marginLeft: 4,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    recordButtonActive: {
        elevation: 12,
        shadowOpacity: 0.5,
    },
    recordButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    recordingText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    indicatorsContainer: {
        marginBottom: 30,
        gap: 20,
    },
    qualityContainer: {
        alignItems: 'center',
        gap: 8,
    },
    qualityLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.tertiary,
        textTransform: 'uppercase',
    },
    qualityBar: {
        width: SCREEN_WIDTH * 0.6,
        height: 6,
        backgroundColor: theme.surface.elevated,
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
    activityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    activityText: {
        fontSize: 14,
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
        backgroundColor: theme.surface.elevated,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: theme.accent.primary,
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
        color: theme.text.primary,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        fontSize: 16,
        color: theme.text.secondary,
        textAlign: 'center',
        marginVertical: 20,
    },
    permissionButton: {
        backgroundColor: theme.accent.primary,
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