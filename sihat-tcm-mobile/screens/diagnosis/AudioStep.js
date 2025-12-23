import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

const RECORDING_INSTRUCTIONS = [
    'Count from 1 to 10 clearly',
    'Read a short sentence aloud',
    'Take 3 deep breaths',
    'Say "Ahhh" for 5 seconds',
];

export default function AudioStep({ data, onUpdate }) {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecording, setHasRecording] = useState(!!data.audioRecording);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recording, setRecording] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentInstruction, setCurrentInstruction] = useState(0);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const durationTimer = useRef(null);

    useEffect(() => {
        if (isRecording) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
            // Wave animation
            Animated.loop(
                Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ).start();
        } else {
            pulseAnim.setValue(1);
            waveAnim.setValue(0);
        }
    }, [isRecording]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Microphone access needed.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(newRecording);
            setIsRecording(true);
            setRecordingDuration(0);

            durationTimer.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            Alert.alert('Error', 'Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        try {
            if (durationTimer.current) clearInterval(durationTimer.current);
            setIsRecording(false);

            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                setRecording(null);
                handleRecordingComplete(uri);
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const handleRecordingComplete = (uri) => {
        setIsAnalyzing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
            setIsAnalyzing(false);
            setHasRecording(true);
            onUpdate({
                ...data,
                audioRecording: uri,
                audioDuration: recordingDuration,
            });
        }, 2000);
    };

    const retakeRecording = () => {
        setHasRecording(false);
        setRecordingDuration(0);
        onUpdate({ ...data, audioRecording: null, audioDuration: null });
    };

    const cycleInstruction = () => {
        setCurrentInstruction(prev => (prev + 1) % RECORDING_INSTRUCTIONS.length);
    };

    const waveOpacity = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 0],
    });
    const waveScale = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="mic-outline" size={32} color={theme.accent.primary} />
                </View>
                <Text style={styles.title}>Voice Analysis</Text>
                <Text style={styles.description}>
                    Voice patterns can reveal health indicators in traditional medicine (闻诊).
                </Text>
            </View>

            {!hasRecording && !isAnalyzing ? (
                <View style={styles.recordingSection}>
                    {/* Instruction Card */}
                    <TouchableOpacity style={styles.instructionCard} onPress={cycleInstruction}>
                        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.instructionBlur}>
                            <Ionicons name="document-text-outline" size={18} color={theme.accent.secondary} />
                            <Text style={styles.instructionText}>
                                {RECORDING_INSTRUCTIONS[currentInstruction]}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
                        </BlurView>
                    </TouchableOpacity>

                    {/* Recording Button Container */}
                    <View style={styles.recordButtonContainer}>
                        {isRecording && (
                            <View style={styles.wavesWrapper}>
                                {[1, 2, 3].map((i) => (
                                    <Animated.View
                                        key={i}
                                        style={[
                                            styles.waveRing,
                                            {
                                                transform: [{ scale: waveScale }],
                                                opacity: waveOpacity,
                                                borderColor: theme.accent.primary,
                                                width: 120 + (i * 30),
                                                height: 120 + (i * 30),
                                                borderRadius: 60 + (i * 15),
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                                onPress={isRecording ? stopRecording : startRecording}
                            >
                                <LinearGradient
                                    colors={isRecording ? ['#ef4444', '#991b1b'] : theme.gradients.accent}
                                    style={styles.recordBtnGradient}
                                >
                                    <Ionicons
                                        name={isRecording ? 'stop' : 'mic'}
                                        size={36}
                                        color={theme.text.inverse}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <Text style={styles.recordHint}>
                        {isRecording ? 'Tap to stop' : 'Tap to start recording'}
                    </Text>

                    {isRecording && (
                        <View style={styles.durationDisplay}>
                            <View style={styles.recordingIndicator} />
                            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                        </View>
                    )}

                    {/* Sonic Waveform */}
                    <View style={styles.waveformContainer}>
                        {[...Array(12)].map((_, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.waveBar,
                                    {
                                        height: isRecording ? 20 + Math.random() * 40 : 10,
                                        backgroundColor: theme.accent.primary,
                                        opacity: isRecording ? 0.3 + Math.random() * 0.7 : 0.2,
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </View>
            ) : isAnalyzing ? (
                <View style={styles.analyzingSection}>
                    <View style={styles.baguaSpinner}>
                        <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: waveAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                            <Ionicons name="pulse" size={64} color={theme.accent.secondary} />
                        </Animated.View>
                    </View>
                    <Text style={styles.analyzingText}>Analyzing voice patterns...</Text>
                </View>
            ) : (
                <View style={styles.completeSection}>
                    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <LinearGradient colors={theme.gradients.primary} style={styles.iconGradient}>
                                <Ionicons name="checkmark" size={32} color={theme.text.inverse} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.successTitle}>Audio Captured</Text>
                        <View style={styles.summaryBadge}>
                            <Ionicons name="time-outline" size={14} color={theme.text.secondary} />
                            <Text style={styles.successDuration}>
                                {formatDuration(recordingDuration || data.audioDuration || 0)}
                            </Text>
                        </View>
                    </BlurView>

                    <TouchableOpacity style={styles.retakeButton} onPress={retakeRecording}>
                        <Ionicons name="refresh" size={18} color={theme.accent.secondary} />
                        <Text style={styles.retakeText}>Retake Analysis</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Tip Section */}
            <View style={styles.tipContainer}>
                <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tipBlur}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.text.secondary} />
                    <Text style={styles.tipText}>
                        Find a quiet environment for best results. Your privacy is protected.
                    </Text>
                </BlurView>
            </View>
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1, padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: {
        width: 72, height: 72, borderRadius: 36,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: theme.accent.primary + '30',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    description: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', lineHeight: 22 },
    recordingSection: { alignItems: 'center', flex: 1 },
    instructionCard: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    instructionBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    instructionText: { flex: 1, color: theme.text.primary, fontSize: 14, fontWeight: '600' },
    recordButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
        width: '100%',
    },
    wavesWrapper: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveRing: {
        position: 'absolute',
        borderWidth: 2,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    recordBtnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordHint: { color: theme.text.tertiary, fontSize: 14, marginTop: 12, fontWeight: '600' },
    durationDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    recordingIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
    durationText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
    waveformContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 40, height: 60,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
    },
    analyzingSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    baguaSpinner: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerRing: {
        padding: 20,
    },
    analyzingText: { color: theme.text.primary, fontSize: 18, fontWeight: '700', marginTop: 24 },
    completeSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successCard: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 32,
        marginBottom: 32,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.accent.primary + '20',
        overflow: 'hidden',
    },
    successIcon: {
        width: 80, height: 80, borderRadius: 40,
        marginBottom: 20,
        overflow: 'hidden',
    },
    iconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: { color: theme.text.primary, fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
    summaryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    successDuration: { color: theme.text.secondary, fontSize: 15, fontWeight: '600' },
    retakeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
    retakeText: { color: theme.accent.secondary, fontSize: 15, fontWeight: 'bold' },
    tipContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 'auto',
    },
    tipBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    tipText: { flex: 1, color: theme.text.tertiary, fontSize: 13, lineHeight: 18 },
});
