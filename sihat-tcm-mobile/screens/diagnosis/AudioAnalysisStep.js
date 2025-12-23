import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    ActivityIndicator,
    ScrollView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { COLORS } from '../../constants/themes';
import { API_CONFIG } from '../../lib/apiConfig';
import { LISTENING_ANALYSIS_PROMPT } from '../../constants/SystemPrompts';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_CONFIG.GOOGLE_API_KEY);

export default function AudioAnalysisStep({ onNext, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();

    // State
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, recorded, playing, analyzing
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [sound, setSound] = useState(null);
    const [audioUri, setAudioUri] = useState(null);
    const [duration, setDuration] = useState(0);
    const [metering, setMetering] = useState(-160);
    const [analysisData, setAnalysisData] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Timer Ref
    const timerRef = useRef(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (sound) {
                sound.unloadAsync();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Pulse Animation Effect based on Metering
    useEffect(() => {
        if (recordingStatus === 'recording') {
            // Map metering (-160 to 0) to scale (1 to 1.5)
            // Typical speech is around -20 to -5
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

    async function startRecording() {
        try {
            // Permission Check
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                const permission = await requestPermission();
                if (permission.status !== 'granted') {
                    Alert.alert(
                        t.audio?.permissionTitle || 'Permission Required',
                        t.audio?.permissionMessage || 'Please allow microphone access to use this feature.'
                    );
                    return;
                }
            }

            // CRITICAL: Clean up any existing recording first
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (cleanupErr) {
                    console.log('Cleanup of previous recording:', cleanupErr.message);
                }
                setRecording(null);
            }

            // Reset audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setErrorMsg(null);
            setAnalysisData(null);
            setDuration(0);

            // Start Recording
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setRecordingStatus('recording');
            setAudioUri(null);

            // Metering & Timer
            newRecording.setOnRecordingStatusUpdate((status) => {
                if (status.metering) setMetering(status.metering);
                setDuration(status.durationMillis / 1000);
            });

        } catch (err) {
            console.error('Failed to start recording', err);
            setErrorMsg(t.audio?.errorStart || 'Failed to start recording. Please try again.');
        }
    }

    async function stopRecording() {
        if (!recording) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRecordingStatus('recorded');

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri);
            setRecording(null);

            // Auto-analyze after stop for smoother UX? 
            // Better to let user review first or tap "Next/Analyze"
            // We'll let them play it back first.
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    }

    async function playSound() {
        if (!audioUri) return;

        try {
            if (sound) await sound.unloadAsync();

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
        } catch (err) {
            console.error('Playback failed', err);
            Alert.alert('Playback Error', 'Could not play audio.');
        }
    }

    async function analyzeAudio() {
        if (!audioUri) {
            console.error('[AudioAnalysis] No audioUri available');
            setErrorMsg('No recording found. Please record again.');
            return;
        }

        setRecordingStatus('analyzing');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            console.log('[AudioAnalysis] audioUri:', audioUri);

            console.log('[AudioAnalysis] Reading audio file...');
            // 1. Read file as Base64
            const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (!base64Audio || base64Audio.length === 0) {
                throw new Error('Failed to read audio file - empty data');
            }

            console.log('[AudioAnalysis] Audio base64 length:', base64Audio.length);

            // 2. Prepare Prompt
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = LISTENING_ANALYSIS_PROMPT;

            console.log('[AudioAnalysis] Sending to Gemini...');
            // 3. Send to Gemini
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: "audio/m4a" // Expo uses m4a format
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();
            console.log('[AudioAnalysis] Response received, length:', text?.length);
            console.log('[AudioAnalysis] Response preview:', text?.substring(0, 200));

            // 4. Parse JSON
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            const data = JSON.parse(jsonStr);
            console.log('[AudioAnalysis] Parsed successfully:', Object.keys(data));

            setAnalysisData(data);
            setRecordingStatus('recorded'); // Go back to recorded state but with data

            onUpdate({ audioAnalysis: data }); // Update parent state

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (err) {
            console.error('[AudioAnalysis] Error:', err.message || err);
            setRecordingStatus('recorded');
            setErrorMsg(t.audio?.errorAnalysis || 'Analysis failed. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }

    const handleNext = () => {
        if (analysisData) {
            onNext();
        } else if (audioUri) {
            analyzeAudio();
        } else {
            // Skip logic
            Alert.alert(
                t.audio?.skipTitle || 'Skip Audio Analysis?',
                t.audio?.skipMsg || 'This helps refine your diagnosis.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Skip', style: 'destructive', onPress: onNext }
                ]
            );
        }
    };

    // --- RENDER HELPERS ---

    const renderWaveform = () => (
        <View style={styles.waveformContainer}>
            <Animated.View
                style={[
                    styles.pulseCircle,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            />
            <View style={styles.micWrapper}>
                <Ionicons
                    name={recordingStatus === 'recording' ? "mic" : "mic-outline"}
                    size={48}
                    color="#ffffff"
                />
            </View>
            <Text style={styles.timerText}>
                {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
            </Text>
        </View>
    );

    const renderAnalysisResult = () => {
        if (!analysisData) return null;

        return (
            <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <Text style={styles.resultTitle}>{t.audio?.analysisComplete || 'Analysis Complete'}</Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>{t.audio?.voiceQuality || 'Voice'}</Text>
                    <Text style={styles.statValue}>{analysisData.voice_quality_analysis?.severity || 'Normal'}</Text>
                </View>

                <Text style={styles.summaryText}>
                    {analysisData.overall_observation}
                </Text>

                <TouchableOpacity
                    style={styles.retakeLink}
                    onPress={() => {
                        setAnalysisData(null);
                        setAudioUri(null);
                        setRecordingStatus('idle');
                    }}
                >
                    <Text style={styles.retakeText}>{t.audio?.retake || 'Discard & Retake'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t.audio?.title || 'Audio Diagnosis'}</Text>
                <Text style={styles.subtitle}>
                    {t.audio?.subtitle || 'Analyzing voice properties for health indicators.'}
                </Text>
            </View>

            {/* Error Banner */}
            {errorMsg && (
                <View style={styles.errorBox}>
                    <Ionicons name="warning" size={20} color={COLORS.error} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            )}

            {/* Main Action Area */}
            <View style={styles.actionArea}>
                {recordingStatus === 'analyzing' ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.accent.primary} />
                        <Text style={styles.loadingText}>{t.audio?.analyzing || 'Analyzing voice traits...'}</Text>
                    </View>
                ) : !analysisData ? (
                    renderWaveform()
                ) : (
                    renderAnalysisResult()
                )}
            </View>

            {/* Controls */}
            {!analysisData && recordingStatus !== 'analyzing' && (
                <View style={styles.controls}>
                    {recordingStatus === 'idle' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={startRecording}>
                            <Text style={styles.btnText}>{t.audio?.startRecord || 'Tap to Record'}</Text>
                        </TouchableOpacity>
                    )}

                    {recordingStatus === 'recording' && (
                        <TouchableOpacity style={[styles.primaryBtn, styles.stopBtn]} onPress={stopRecording}>
                            <View style={styles.stopIcon} />
                            <Text style={styles.btnText}>{t.audio?.stopRecord || 'Stop Recording'}</Text>
                        </TouchableOpacity>
                    )}

                    {recordingStatus === 'recorded' && (
                        <View style={styles.recordedControls}>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={playSound}>
                                <Ionicons name="play" size={20} color={theme.text.primary} />
                                <Text style={styles.secBtnText}>{t.audio?.play || 'Play'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryBtn} onPress={startRecording}>
                                <Ionicons name="refresh" size={20} color={theme.text.primary} />
                                <Text style={styles.secBtnText}>{t.audio?.retake || 'Retake'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 10 }]} onPress={analyzeAudio}>
                                <Ionicons name="scan" size={20} color="#fff" />
                                <Text style={styles.btnText}>{t.audio?.analyze || 'Analyze'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {recordingStatus === 'playing' && (
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => sound?.stopAsync().then(() => setRecordingStatus('recorded'))}>
                            <Ionicons name="square" size={20} color={theme.text.primary} />
                            <Text style={styles.secBtnText}>Stop</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Next Button logic handle in parent mostly, but we trigger onNext */}
            {analysisData && (
                <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
                    <Text style={styles.btnText}>{t.common?.next || 'Continue'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            )}

            <View style={styles.tips}>
                <Ionicons name="bulb-outline" size={16} color={theme.text.tertiary} />
                <Text style={styles.tipText}>
                    {t.audio?.tip || 'Tip: Read a short sentence or count 1-10 clearly.'}
                </Text>
            </View>

        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40
    },
    header: {
        alignItems: 'center',
        marginBottom: 32
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 22
    },
    actionArea: {
        height: 220,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32
    },
    waveformContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 200,
        height: 200
    },
    pulseCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
    },
    micWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    timerText: {
        marginTop: 16,
        fontSize: 18,
        fontVariant: ['tabular-nums'],
        color: theme.text.secondary,
        fontWeight: '600'
    },
    controls: {
        width: '100%',
        alignItems: 'center',
        gap: 16
    },
    primaryBtn: {
        backgroundColor: theme.accent.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        gap: 8,
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    stopBtn: {
        backgroundColor: COLORS.error,
        shadowColor: COLORS.error,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    stopIcon: {
        width: 16,
        height: 16,
        borderRadius: 4,
        backgroundColor: '#ffffff'
    },
    recordedControls: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: theme.surface.elevated,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 8,
        minWidth: 100
    },
    secBtnText: {
        color: theme.text.primary,
        fontSize: 16,
        fontWeight: '600'
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
    },
    loadingText: {
        color: theme.text.secondary,
        fontSize: 16
    },
    resultContainer: {
        width: '100%',
        backgroundColor: theme.surface.elevated,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border.default
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.subtle,
        marginBottom: 12
    },
    statLabel: {
        color: theme.text.secondary,
        fontSize: 15
    },
    statValue: {
        color: theme.text.primary,
        fontWeight: '600',
        fontSize: 15
    },
    summaryText: {
        color: theme.text.primary,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16
    },
    retakeLink: {
        alignItems: 'center',
        padding: 8
    },
    retakeText: {
        color: theme.accent.primary,
        fontSize: 14,
        fontWeight: '600'
    },
    errorBox: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
        alignItems: 'center'
    },
    errorText: {
        color: COLORS.error,
        flex: 1,
        fontSize: 14
    },
    tips: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        opacity: 0.8
    },
    tipText: {
        color: theme.text.tertiary,
        fontSize: 13
    }
});
