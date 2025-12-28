import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getGenAI, API_CONFIG } from '../../lib/googleAI';
import { SUMMARY_PROMPT } from '../../constants/SystemPrompts';

// Progress steps
const PROGRESS_STEPS = [
    { key: 'connecting', label: 'Connecting', icon: 'wifi-outline' },
    { key: 'analyzing', label: 'Analyzing', icon: 'document-text-outline' },
    { key: 'generating', label: 'Generating', icon: 'sparkles-outline' },
];



export default function InquirySummaryStep({ data, onUpdate, onNext, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const [summary, setSummary] = useState(data.inquirySummary || '');
    const [isLoading, setIsLoading] = useState(!data.inquirySummary);
    const [progressStep, setProgressStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Start timer
    const startTimer = () => {
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 100);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Animate progress
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressStep / (PROGRESS_STEPS.length - 1),
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progressStep]);

    // Generate summary on mount
    useEffect(() => {
        // Fix: Use inquiryChat instead of chatHistory (mismatch with InquiryStep data)
        const chatHistory = data.inquiryChat || data.chatHistory;

        if (!data.inquirySummary) {
            if (chatHistory?.length > 0) {
                generateSummary();
            } else {
                // Fix: Prevent hang if no history is available
                // console.log('No chat history found, skipping summary generation');
                setSummary('No consultation details available to summarize.');
                setIsLoading(false);
            }
        }
        return () => stopTimer();
    }, []);

    const generateSummary = async () => {
        setIsLoading(true);
        setError(null);
        setProgressStep(0);
        startTimer();

        try {
            // Fix: Use inquiryChat
            const chatHistory = data.inquiryChat || data.chatHistory || [];

            // Step 1: Connecting
            setProgressStep(0);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 2: Analyzing
            setProgressStep(1);

            // Build the prompt with chat history
            const chatText = chatHistory
                .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
                .join('\n\n') || 'No conversation history';

            const patientInfo = `
Patient: ${data.name || 'Anonymous'}
Age: ${data.age || 'Unknown'}
Gender: ${data.gender || 'Unknown'}
Main Concern: ${data.mainConcern || 'Not specified'}
`;

            const medicineInfo = data.medicines?.length > 0
                ? `Current Medications:\n${data.medicines.map(m => `- ${m.name || m.content}`).join('\n')}`
                : '';

            const fullPrompt = `${patientInfo}\n${medicineInfo}\n\nConsultation History:\n${chatText}\n\nPlease summarize this consultation.`;

            // Step 3: Generating
            setProgressStep(2);

            const model = getGenAI().getGenerativeModel({
                model: data.doctor?.doctorLevel?.model || API_CONFIG.DEFAULT_MODEL,
                systemInstruction: SUMMARY_PROMPT,
            });

            const result = await model.generateContent(fullPrompt);
            const generatedSummary = result.response.text();

            stopTimer();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setSummary(generatedSummary);
            onUpdate({ ...data, inquirySummary: generatedSummary });

        } catch (err) {
            console.error('Summary generation error:', err);
            stopTimer();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError({
                title: 'Failed to Generate Summary',
                message: err.message || 'An error occurred while generating the summary.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => generateSummary();

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUpdate({ ...data, inquirySummary: summary });
        if (onNext) onNext();
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="document-text" size={32} color={theme.accent.primary} />
                        </View>
                        <Text style={styles.title}>Generating Summary</Text>
                        <Text style={styles.subtitle}>
                            Analyzing your consultation to create a comprehensive summary
                        </Text>
                    </View>

                    {/* Timer */}
                    <View style={styles.timerContainer}>
                        <Ionicons name="time-outline" size={18} color={theme.accent.primary} />
                        <Text style={styles.timerText}>{elapsedTime}s</Text>
                    </View>

                    {/* Progress Steps */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                        </View>
                        <View style={styles.stepsRow}>
                            {PROGRESS_STEPS.map((step, index) => {
                                const isActive = index === progressStep;
                                const isComplete = index < progressStep;
                                return (
                                    <View key={step.key} style={styles.stepItem}>
                                        <View style={[
                                            styles.stepDot,
                                            isComplete && styles.stepDotComplete,
                                            isActive && styles.stepDotActive,
                                        ]}>
                                            {isComplete ? (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            ) : (
                                                <Ionicons
                                                    name={step.icon}
                                                    size={14}
                                                    color={isActive ? theme.accent.primary : theme.text.tertiary}
                                                />
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.stepLabel,
                                            isActive && styles.stepLabelActive
                                        ]}>
                                            {step.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <ActivityIndicator size="large" color={theme.accent.primary} style={{ marginTop: 30 }} />
                </View>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.errorContainer}>
                    <View style={styles.errorIconContainer}>
                        <Ionicons name="alert-circle" size={48} color="#f59e0b" />
                    </View>
                    <Text style={styles.errorTitle}>{error.title}</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>

                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh" size={20} color={theme.accent.primary} />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>or enter summary manually:</Text>

                    <TextInput
                        style={styles.manualInput}
                        value={summary}
                        onChangeText={setSummary}
                        placeholder="Enter your consultation summary here..."
                        placeholderTextColor={theme.text.tertiary}
                        multiline
                        textAlignVertical="top"
                    />

                    {summary.trim().length > 0 && (
                        <TouchableOpacity onPress={handleConfirm}>
                            <LinearGradient
                                colors={theme.gradients.accent}
                                style={styles.confirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.confirmButtonText}>Continue with Manual Summary</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        );
    }

    // Success state with editable summary
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={32} color={theme.accent.primary} />
                    </View>
                    <Text style={styles.title}>Review Summary</Text>
                    <Text style={styles.subtitle}>
                        Please review and edit if needed before continuing
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Ionicons name="document-text" size={20} color={theme.accent.primary} />
                        <Text style={styles.summaryHeaderText}>Consultation Summary</Text>
                        <View style={styles.editBadge}>
                            <Ionicons name="create-outline" size={14} color={theme.accent.secondary} />
                            <Text style={styles.editBadgeText}>Editable</Text>
                        </View>
                    </View>

                    <TextInput
                        style={styles.summaryInput}
                        value={summary}
                        onChangeText={(text) => {
                            setSummary(text);
                            onUpdate({ ...data, inquirySummary: text });
                        }}
                        multiline
                        textAlignVertical="top"
                        placeholder="Summary will appear here..."
                        placeholderTextColor={theme.text.tertiary}
                    />
                </View>

                <TouchableOpacity onPress={handleConfirm} disabled={!summary.trim()}>
                    <LinearGradient
                        colors={summary.trim() ? theme.gradients.accent : [theme.surface.disabled, theme.surface.disabled]}
                        style={styles.confirmButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.regenerateButton} onPress={handleRetry}>
                    <Ionicons name="refresh" size={18} color={theme.text.secondary} />
                    <Text style={styles.regenerateButtonText}>Regenerate Summary</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    headerSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.accent.primary,
        fontFamily: 'monospace',
    },
    progressContainer: {
        width: '100%',
        maxWidth: 300,
    },
    progressTrack: {
        height: 6,
        backgroundColor: theme.surface.default,
        borderRadius: 3,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.accent.primary,
        borderRadius: 3,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: theme.border.default,
    },
    stepDotActive: {
        borderColor: theme.accent.primary,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    },
    stepDotComplete: {
        backgroundColor: theme.accent.primary,
        borderColor: theme.accent.primary,
    },
    stepLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        fontWeight: '500',
    },
    stepLabelActive: {
        color: theme.accent.primary,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 30,
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: theme.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: theme.accent.primary,
        marginBottom: 24,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.accent.primary,
    },
    orText: {
        fontSize: 14,
        color: theme.text.tertiary,
        marginBottom: 16,
    },
    manualInput: {
        width: '100%',
        minHeight: 150,
        backgroundColor: theme.input.background,
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: theme.text.primary,
        borderWidth: 1,
        borderColor: theme.border.default,
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: theme.surface.elevated,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    summaryHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text.primary,
        flex: 1,
    },
    editBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: isDark ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.1)',
    },
    editBadgeText: {
        fontSize: 12,
        color: theme.accent.secondary,
        fontWeight: '500',
    },
    summaryInput: {
        minHeight: 250,
        backgroundColor: theme.input.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: theme.text.primary,
        lineHeight: 22,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 30,
        marginBottom: 16,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        marginBottom: 40,
    },
    regenerateButtonText: {
        fontSize: 14,
        color: theme.text.secondary,
        fontWeight: '500',
    },
});
