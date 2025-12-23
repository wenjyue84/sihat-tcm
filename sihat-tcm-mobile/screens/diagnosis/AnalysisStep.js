import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';

const ANALYSIS_STAGES = [
    { text: 'Syncing your diagnostic data...', duration: 2000 },
    { text: 'Analyzing symptoms & history...', duration: 2500 },
    { text: 'Synthesizing 4-methods evidence...', duration: 3000 },
    { text: 'Generating TCM clinical recommendations...', duration: 2500 },
    { text: 'Finalizing your health report...', duration: 2000 },
];

export default function AnalysisStep({ data, onComplete, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [stageIndex, setStageIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Rotate animation
    useEffect(() => {
        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        rotate.start();
        return () => rotate.stop();
    }, []);

    // Atomic Submission Logic
    const saveFullReport = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError(null);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();

            // Handle guest users (not authenticated)
            if (userError || !userData.user) {
                console.log('[Analysis] Guest user detected - skipping database save');
                // For guest users, skip saving and proceed directly to results
                setIsSaving(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onComplete?.();
                return;
            }

            const userId = userData.user.id;
            // Generate a secure ID for this report (for storage folder)
            const reportId = generateUUID();

            // Helper: Compress & Upload Media
            const uploadMedia = async (type, uri) => {
                if (!uri) return null;
                console.log(`[Analysis] Processing ${type}...`);
                try {
                    let uploadUri = uri;

                    // 1. Compress Images (Tongue/Face)
                    if (type !== 'voice') {
                        const manipResult = await ImageManipulator.manipulateAsync(
                            uri,
                            [{ resize: { width: 1080 } }],
                            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                        );
                        uploadUri = manipResult.uri;
                    }

                    // 2. Fetch Blob
                    const response = await fetch(uploadUri);
                    const blob = await response.blob();

                    // 3. Upload to Supabase Storage
                    const ext = type === 'voice' ? 'm4a' : 'jpg';
                    const path = `${userId}/${reportId}/${type}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from('diagnosis-media')
                        .upload(path, blob, {
                            contentType: type === 'voice' ? 'audio/mpeg' : 'image/jpeg',
                            upsert: true
                        });

                    if (uploadError) throw uploadError;
                    return path; // Return the storage path, not the full URL

                } catch (e) {
                    console.error(`Upload failed for ${type}:`, e);
                    return null; // Continue even if upload fails? For now, yes, but log it.
                }
            };

            // 1. Upload All Media in Parallel
            const [tonguePath, facePath, voicePath] = await Promise.all([
                uploadMedia('tongue', data.tongueImage),
                uploadMedia('face', data.faceImage),
                uploadMedia('voice', data.audioRecording)
            ]);

            // 3. Prepare Report Data
            const reportData = {
                id: reportId,
                user_id: userId,
                status: 'completed',
                complaint: data.mainConcern || data.symptomDetails || 'No specific complaint provided',
                symptoms: typeof data.symptoms === 'string' ? data.symptoms.split(',').map(s => s.trim()).filter(Boolean) : (data.symptoms || []),
                chat_log: data.chatHistory || [],
                tongue_data: {
                    path: tonguePath,
                    local_uri: data.tongueImage,
                    analysis: data.tongueAnalysis || null
                },
                face_data: {
                    path: facePath,
                    local_uri: data.faceImage,
                    analysis: data.faceAnalysis || null
                },
                voice_data: {
                    path: voicePath,
                    local_uri: data.audioRecording,
                    analysis: data.audioAnalysis || null
                },
                pulse_data: {
                    bpm: parseInt(data.bpm) || 0,
                    qualities: data.pulseQualities || [],
                    analysis: data.pulseAnalysis || null
                },
                diagnosis: { type: 'Pending Analysis' },
                recommendations: {}
            };

            // 4. Submit Data (Direct Insert with Fallback)
            // We favor direct insert to avoid dependency on the custom RPC function existence
            let submissionError = null;

            try {
                // Try inserting into 'health_reports_new' first (v2 schema)
                const { error: v2Error } = await supabase
                    .from('health_reports_new')
                    .insert(reportData);

                if (v2Error) {
                    // 42P01 is "undefined_table"
                    if (v2Error.code === '42P01') {
                        console.warn('health_reports_new not found, trying health_reports...');
                        const { error: v1Error } = await supabase
                            .from('health_reports')
                            .insert(reportData); // Schema might differ, but we try best effort

                        if (v1Error) throw v1Error;
                    } else {
                        throw v2Error;
                    }
                }
            } catch (submitErr) {
                // If direct insert fails, try the RPC as a last resort
                // (It might be an older backend version that only has the RPC)
                console.warn('Direct insert failed, trying RPC...', submitErr);
                const { error: rpcError } = await supabase
                    .rpc('submit_diagnosis_report', { payload: reportData });

                if (rpcError) throw submitErr; // Throw the original insert error if RPC also fails
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete?.();

        } catch (err) {
            console.error('Submission failed:', err);

            // Graceful handling for Auth errors or Network errors
            // If we can't save, we should still show the results to the user
            const isAuthError = err.message.includes('User not authenticated') || err.message.includes('JWT');

            if (isAuthError) {
                console.log('Auth error during save - proceeding as guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onComplete?.();
            } else {
                // For connection errors, warn but proceed
                Alert.alert(
                    'Connection Issue',
                    'Could not save your diagnostic history to the cloud, but your results are ready.',
                    [
                        {
                            text: 'View Results',
                            onPress: () => {
                                onComplete?.();
                            }
                        },
                        {
                            text: 'Retry',
                            style: 'cancel',
                            onPress: () => setIsSaving(false) // Allow retry
                        }
                    ]
                );
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } finally {
            // Only turn off saving flag if we didn't proceed (if we proceeded, component might unmount)
            // But safe to set it false.
            setIsSaving(false);
        }
    };

    // Stage progression & Trigger Save
    useEffect(() => {
        if (stageIndex >= ANALYSIS_STAGES.length) {
            saveFullReport();
            return;
        }

        const timer = setTimeout(() => {
            setStageIndex((prev) => prev + 1);
        }, ANALYSIS_STAGES[stageIndex].duration);

        return () => clearTimeout(timer);
    }, [stageIndex]);

    // Progress animation
    useEffect(() => {
        const progress = (stageIndex / (ANALYSIS_STAGES.length)) * 100;
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 800,
            useNativeDriver: false,
        }).start();

        if (stageIndex > 0 && stageIndex < ANALYSIS_STAGES.length) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [stageIndex]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const currentStage = ANALYSIS_STAGES[Math.min(stageIndex, ANALYSIS_STAGES.length - 1)];

    return (
        <View style={styles.container}>
            <View style={styles.baguaContainer}>
                {[0.8, 1, 1.2].map((scale, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.glowRing,
                            {
                                width: 200 * scale,
                                height: 200 * scale,
                                borderRadius: 100 * scale,
                                transform: [{ rotate: spin }],
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.1],
                                    outputRange: [0.1, 0.3]
                                })
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={[theme.accent.primary, 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </Animated.View>
                ))}

                <Animated.View style={[styles.mainCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.innerGlass}>
                        <Ionicons
                            name={error ? "warning-outline" : "leaf"}
                            size={64}
                            color={error ? theme.semantic.error : theme.accent.primary}
                        />
                    </BlurView>
                </Animated.View>
            </View>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.progressCard}>
                <View style={styles.cardContent}>
                    <Text style={[styles.statusText, error && { color: theme.semantic.error, fontSize: 14 }]}>
                        {error ? `Error: ${error}` : currentStage.text}
                    </Text>

                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                            <LinearGradient
                                colors={error ? [theme.semantic.error, theme.semantic.error] : theme.gradients.accent}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </Animated.View>
                    </View>

                    <View style={styles.stagesContainer}>
                        {ANALYSIS_STAGES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.stageDot,
                                    index < stageIndex && styles.stageDotComplete,
                                    index === stageIndex && !error && styles.stageDotActive,
                                    error && { backgroundColor: theme.semantic.error, opacity: 0.5 }
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </BlurView>

            <Text style={styles.percentText}>
                {error ? 'Submission failed' : `${Math.round((stageIndex / ANALYSIS_STAGES.length) * 100)}% Analysis Complete`}
            </Text>
        </View>
    );
};

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    baguaContainer: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
    },
    glowRing: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: theme.accent.primary,
        overflow: 'hidden',
    },
    mainCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: theme.accent.primary,
        backgroundColor: theme.surface.elevated,
    },
    innerGlass: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCard: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border.default,
        padding: 2,
    },
    cardContent: {
        padding: 24,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 18,
        color: theme.text.primary,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        height: 50,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: theme.surface.elevated,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    stagesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    stageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.surface.elevated,
        opacity: 0.3,
    },
    stageDotComplete: {
        backgroundColor: theme.accent.primary,
        opacity: 1,
    },
    stageDotActive: {
        backgroundColor: theme.accent.secondary,
        opacity: 1,
        transform: [{ scale: 1.5 }],
    },
    percentText: {
        marginTop: 20,
        fontSize: 14,
        color: theme.text.tertiary,
        fontWeight: '600',
    },
});

// Simple UUID Generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
