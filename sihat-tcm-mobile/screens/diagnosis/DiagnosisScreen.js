import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, BackHandler, Alert, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraBackground } from '../../components/AuroraBackground';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../constants/themes';

// Step Components
import BasicInfoStep from './BasicInfoStep';
import ProfileSummaryStep from './ProfileSummaryStep';
import SymptomsStep from './SymptomsStep';
import InquiryStep from './InquiryStep';
import TongueStep from './TongueStep';
import FaceStep from './FaceStep';
import AudioAnalysisStep from './AudioAnalysisStep';
import PulseStep from './PulseStep';
import SmartConnectStep from './SmartConnectStep';
import UploadReportsStep from './UploadReportsStep';
import AnalysisStep from './AnalysisStep';
import ResultsStep from './ResultsStep';
import UploadMedicineStep from './UploadMedicineStep';
import ChooseDoctorStep from './ChooseDoctorStep';
import InquirySummaryStep from './InquirySummaryStep';

const { width } = Dimensions.get('window');

// Phase-based Progress Stepper
const ProgressStepper = ({ steps, currentStep, theme, isDark }) => {
    // Define Phases with step IDs that belong to each phase
    const phases = useMemo(() => [
        { id: 'profile', label: 'Profile', icon: 'person', stepIds: ['basic_info', 'profile_summary'] },
        { id: 'history', label: 'History', icon: 'document-text', stepIds: ['symptoms', 'upload_reports', 'upload_medicine', 'select_doctor'] },
        { id: 'inquiry', label: 'Inquiry', icon: 'chatbubbles', stepIds: ['inquiry', 'inquiry_summary'] },
        { id: 'vitals', label: 'Vitals', icon: 'heart', stepIds: ['tongue', 'face', 'audio', 'pulse', 'smart_connect'] },
        { id: 'analysis', label: 'Results', icon: 'analytics', stepIds: ['analysis'] },
    ], []);

    // Find current phase based on step ID
    const currentStepId = steps[currentStep]?.id;
    const currentPhaseIndex = phases.findIndex(p => p.stepIds.includes(currentStepId));
    const currentPhase = phases[currentPhaseIndex] || phases[0];

    // Calculate overall progress for the bar
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Calculate progress based on Phases, not steps, for the main bar? 
        // Or keep granular progress but display phases?
        // Let's do granular progress relative to the total flow 
        // to give a sense of "Real" forward movement
        Animated.timing(progressAnim, {
            toValue: (currentStep) / (steps.length - 1),
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentStep, steps.length]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const styles = createStepperStyles(theme, isDark);

    return (
        <View style={styles.stepperContainer}>
            {/* Main Progress Track (Background) */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {/* Phases Row */}
            <View style={styles.stepsRow}>
                {phases.map((phase, index) => {
                    const isActive = index === currentPhaseIndex;
                    const isComplete = index < currentPhaseIndex;

                    return (
                        <View key={phase.id} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepDot,
                                    isComplete && styles.stepDotComplete,
                                    isActive && styles.stepDotActive,
                                ]}
                            >
                                <Ionicons
                                    name={isComplete ? "checkmark" : phase.icon}
                                    size={isActive ? 16 : 14}
                                    color={
                                        isComplete ? (isDark ? theme.background.primary : '#ffffff') :
                                            isActive ? (isDark ? theme.background.primary : '#ffffff') :
                                                theme.text.tertiary
                                    }
                                />
                            </View>

                            {/* Label only for active or adjacent? Or all if they fit? 
                                5 items should fit with small text. 
                            */}
                            <Text
                                style={[
                                    styles.stepLabel,
                                    isActive && styles.stepLabelActive,
                                    isComplete && styles.stepLabelComplete
                                ]}
                                numberOfLines={1}
                            >
                                {phase.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Sub-step indicator text e.g. "Step 2 of 4" */}
            <View style={styles.subStepContainer}>
                <Text style={styles.subStepText}>
                    {steps[currentStep]?.label || 'Loading...'}
                    {/* Optional: Show granular count inside phase */}
                    {/* <Text style={styles.subStepCount}> ({currentStep + 1}/{steps.length})</Text> */}
                </Text>
            </View>
        </View>
    );
};

// Navigation Buttons Component
const NavigationButtons = ({ currentStep, steps, onBack, onNext, canProceed, theme, isDark, styles }) => {
    // Get current step ID
    const currentStepId = steps[currentStep]?.id;

    // Hide nav buttons for analysis and results steps
    if (currentStepId === 'analysis' || currentStep >= steps.length) {
        return null;
    }

    // Check if next step is analysis to show "Analyze"
    const nextStepId = steps[currentStep + 1]?.id;
    const isNextAnalysis = nextStepId === 'analysis';

    return (
        <View style={styles.navContainer}>
            {currentStep > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="chevron-back" size={20} color={theme.text.primary} />
                    <Text style={styles.backButtonText}>{styles.backLabel || 'Back'}</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[
                    styles.nextButton,
                    !canProceed && styles.nextButtonDisabled,
                    currentStep === 0 && { marginLeft: 0 }
                ]}
                onPress={onNext}
                disabled={!canProceed}
            >
                <LinearGradient
                    colors={canProceed ? theme.gradients.accent : (isDark ? ['#334155', '#1e293b'] : ['#e2e8f0', '#cbd5e1'])}
                    style={styles.nextButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
                        {isNextAnalysis ? (styles.analyzeLabel || 'Analyze') : (styles.nextLabel || 'Next')}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={canProceed ? '#ffffff' : theme.text.tertiary}
                    />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

export default function DiagnosisScreen({ isLoggedIn = false, onExitToDashboard, onExitToLogin }) {
    const { theme, isDark } = useTheme();
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [currentStep, setCurrentStep] = useState(0);

    // Dynamic Steps with Translations
    // LOGGED IN ORDER: BasicInfo(0) -> ProfileSummary(1) -> Symptoms(2) -> Reports(3) -> Medicine(4) -> Doctor(5) -> Inquiry(6) -> Summary(7) -> Tongue(8) -> Face(9) -> Audio(10) -> Pulse(11) -> SmartConnect(12) -> Analysis(13) -> Results(14)
    // GUEST ORDER: BasicInfo(0) -> Symptoms(1) -> Reports(2) -> Medicine(3) -> Doctor(4) -> Inquiry(5) -> Summary(6) -> Tongue(7) -> Face(8) -> Audio(9) -> Pulse(10) -> SmartConnect(11) -> Analysis(12) -> Results(13)
    const steps = useMemo(() => {
        const baseSteps = [
            { id: 'basic_info', label: t.steps.basicInfo, icon: 'person-outline' },
        ];

        // Only include ProfileSummary for logged-in users
        if (isLoggedIn) {
            baseSteps.push({ id: 'profile_summary', label: t.profileSummary?.title || 'Summary', icon: 'checkmark-circle-outline' });
        }

        // Add remaining steps
        baseSteps.push(
            { id: 'symptoms', label: t.steps.symptoms, icon: 'thermometer-outline' },
            { id: 'upload_reports', label: t.steps.uploadReports, icon: 'document-text-outline' },
            { id: 'upload_medicine', label: t.steps.uploadMedicine, icon: 'medkit-outline' },
            { id: 'select_doctor', label: t.steps.chooseDoctor, icon: 'people-outline' },
            { id: 'inquiry', label: t.steps.inquiry, icon: 'chatbubbles-outline' },
            { id: 'inquiry_summary', label: 'Summary', icon: 'document-text-outline' },
            { id: 'tongue', label: t.steps.tongue, icon: 'camera-outline' },
            { id: 'face', label: t.steps.face, icon: 'scan-outline' },
            { id: 'audio', label: t.steps.audio, icon: 'mic-outline' },
            { id: 'pulse', label: t.steps.pulse, icon: 'heart-outline' },
            { id: 'smart_connect', label: t.steps.smartConnect, icon: 'watch-outline' },
            { id: 'analysis', label: t.steps.analysis, icon: 'analytics-outline' },
        );

        return baseSteps;
    }, [t, isLoggedIn]);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        symptoms: '',
        symptomDetails: '',
        // New fields
        tongueImage: null,
        faceImage: null,
        audioRecording: null,
        bpm: '', // for PulseStep
        smartConnectData: null,
        medicines: [],
        duration: '',
        files: [],
    });

    // Animation for step transitions
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (direction, callback) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: direction === 'next' ? -50 : 50,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
            slideAnim.setValue(direction === 'next' ? 50 : -50);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const goToNext = () => {
        // Allow going to index 8 (Results) which is steps.length
        if (currentStep < steps.length) {
            animateTransition('next', () => {
                setCurrentStep((prev) => prev + 1);
            });
        }
    };

    const goToPrevious = () => {
        if (currentStep > 0) {
            animateTransition('prev', () => {
                setCurrentStep((prev) => prev - 1);
            });
        }
    };

    const startNewAssessment = () => {
        setFormData({
            name: '',
            age: '',
            gender: '',
            height: '',
            weight: '',
            symptoms: [],
            symptomDetails: '',
            tongueImage: null,
            faceImage: null,
            audioRecording: null,
            bpm: '',
            smartConnectData: null,
            medicines: [],
            duration: '',
            files: [],
        });
        animateTransition('prev', () => {
            setCurrentStep(0);
        });
    };

    const canProceed = () => {
        // Check if current step can proceed using step ID
        const currentStepId = steps[currentStep]?.id;

        switch (currentStepId) {
            case 'basic_info':
                return formData.name.trim() !== '' && formData.age.trim() !== '' && formData.gender !== '';
            case 'profile_summary': // Only for logged-in users (navigation handled internally)
                return true;
            case 'symptoms':
                return formData.mainConcern && formData.mainConcern !== '';
            case 'upload_reports': // Optional
                return true;
            case 'upload_medicine': // Optional
                return true;
            case 'select_doctor': // Handled by internal button
                return true;
            case 'inquiry':
                return true;
            case 'inquiry_summary': // Has internal confirm button
                return true;
            case 'tongue':
                return true;
            case 'face':
                return true;
            case 'audio':
                return true;
            case 'pulse':
                return true;
            case 'smart_connect':
                return true;
            case 'analysis':
                return true;
            default:
                return true;
        }
    };

    const renderStep = () => {
        const stepProps = {
            data: formData,
            onUpdate: setFormData,
            theme,
            isDark
        };

        // Get current step ID for dynamic rendering
        const currentStepId = steps[currentStep]?.id;

        // Handle results step (one past the last step in array)
        if (currentStep >= steps.length) {
            return (
                <ResultsStep
                    data={formData}
                    onStartNew={startNewAssessment}
                    onExit={() => {
                        if (isLoggedIn) {
                            onExitToDashboard();
                        } else {
                            onExitToLogin();
                        }
                    }}
                    theme={theme}
                    isDark={isDark}
                />
            );
        }

        // Render based on step ID (works for both logged-in and guest flows)
        switch (currentStepId) {
            case 'basic_info':
                return <BasicInfoStep {...stepProps} />;
            case 'profile_summary':
                return <ProfileSummaryStep
                    {...stepProps}
                    onNext={goToNext}
                    onBack={goToPrevious}
                />;
            case 'symptoms':
                return <SymptomsStep {...stepProps} />;
            case 'upload_reports':
                return <UploadReportsStep {...stepProps} />;
            case 'upload_medicine':
                return <UploadMedicineStep {...stepProps} />;
            case 'select_doctor':
                return <ChooseDoctorStep
                    onNext={(doctorData) => {
                        setFormData(prev => ({ ...prev, doctor: doctorData }));
                        goToNext();
                    }}
                    theme={theme}
                    isDark={isDark}
                />;
            case 'inquiry':
                return <InquiryStep {...stepProps} />;
            case 'inquiry_summary':
                return <InquirySummaryStep
                    {...stepProps}
                    onNext={goToNext}
                />;
            case 'tongue':
                return <TongueStep {...stepProps} />;
            case 'face':
                return <FaceStep {...stepProps} />;
            case 'audio':
                return <AudioAnalysisStep
                    onNext={goToNext}
                    onUpdate={(data) => setFormData(prev => ({ ...prev, ...data }))}
                    initialData={formData}
                    theme={theme}
                    isDark={isDark}
                />;
            case 'pulse':
                return <PulseStep {...stepProps} />;
            case 'smart_connect':
                return <SmartConnectStep {...stepProps} />;
            case 'analysis':
                return <AnalysisStep {...stepProps} onComplete={goToNext} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <AuroraBackground isDark={isDark} theme={theme} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.exitButton}
                    onPress={() => {
                        Alert.alert(
                            t.common.confirm || 'Confirm',
                            t.confirm.exitDiagnosis || 'Exit diagnosis? Progress will be lost.',
                            [
                                { text: t.common.cancel || 'Cancel', style: 'cancel' },
                                {
                                    text: t.common.confirm || 'Confirm',
                                    onPress: () => {
                                        if (isLoggedIn) {
                                            // Logged-in user: go to dashboard
                                            onExitToDashboard();
                                        } else {
                                            // Guest user: go back to login/signup page
                                            onExitToLogin();
                                        }
                                    },
                                    style: 'destructive'
                                }
                            ]
                        );
                    }}
                >
                    <Ionicons name="close" size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.welcome.startDiagnosis || 'Health Assessment'}</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Progress Stepper - hidden on results */}
            {currentStep < steps.length && (
                <ProgressStepper steps={steps} currentStep={currentStep} theme={theme} isDark={isDark} />
            )}

            <Animated.View
                style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <ErrorBoundary
                    fallbackTitle="Step Error"
                    fallbackMessage="This step encountered an issue. Please go back to the previous step or try again."
                    onBack={currentStep > 0 ? goToPrevious : undefined}
                    onRetry={() => {
                        // Force re-render by toggling step
                        const currentStepValue = currentStep;
                        setCurrentStep(-1);
                        setTimeout(() => setCurrentStep(currentStepValue), 50);
                    }}
                    showBackButton={currentStep > 0}
                    showRetryButton={true}
                    theme={theme}
                    isDark={isDark}
                >
                    {renderStep()}
                </ErrorBoundary>
            </Animated.View>

            <NavigationButtons
                currentStep={currentStep}
                steps={steps}
                onBack={goToPrevious}
                onNext={goToNext}
                canProceed={canProceed()}
                theme={theme}
                isDark={isDark}
                styles={{
                    ...styles,
                    backLabel: t.common.back,
                    nextLabel: t.common.next,
                    analyzeLabel: t.steps.analysis // Pass translated labels via styles object as a workaround or prop
                }}
            />
        </SafeAreaView>
    );
}

const createStepperStyles = (theme, isDark) => StyleSheet.create({
    stepperContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    progressTrack: {
        height: 6,
        backgroundColor: theme.surface.default,
        borderRadius: 3,
        marginBottom: 12, // Reduced margin
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
        paddingHorizontal: 0, // maximize width
        marginBottom: 12,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
        // Ensure items don't overlap too much, though flex:1 handles distribution
    },
    stepDot: {
        width: 28, // Slightly larger for icons
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    stepDotActive: {
        backgroundColor: theme.accent.secondary,
        borderColor: theme.accent.secondary,
        width: 32, // More prominent active state
        height: 32,
        borderRadius: 16,
        transform: [{ scale: 1.1 }],
    },
    stepDotComplete: {
        backgroundColor: theme.accent.primary,
        borderColor: theme.accent.primary,
    },
    stepLabel: {
        fontSize: 9,
        color: theme.text.tertiary,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 2,
    },
    stepLabelActive: {
        color: theme.accent.secondary,
        fontWeight: 'bold',
        fontSize: 10,
    },
    stepLabelComplete: {
        color: theme.accent.primary,
    },
    subStepContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        paddingVertical: 4,
        backgroundColor: theme.surface.default,
        borderRadius: 8,
        marginHorizontal: 40, // Centered pill
    },
    subStepText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    subStepCount: {
        color: theme.text.tertiary,
        fontSize: 11,
    }
});

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    exitButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    headerSpacer: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border.default,
        backgroundColor: theme.surface.default,
        gap: 6,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },
    nextButton: {
        flex: 1,
        marginLeft: 12,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: theme.accent.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonDisabled: {
        opacity: 0.5,
        elevation: 0,
        shadowOpacity: 0,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    nextButtonTextDisabled: {
        color: theme.text.tertiary,
    },
});
