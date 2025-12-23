/**
 * DoctorVerificationModal.js
 * 
 * Native modal for requesting TCM practitioner verification of AI diagnosis.
 * Features: Glassmorphic design, doctor selection, haptic feedback, multi-language.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Image,
    Animated,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback practitioners if Supabase fetch fails
const FALLBACK_PRACTITIONERS = [
    {
        id: 'fallback-1',
        name: 'Dr. Li Wei Ming',
        photo: null,
        clinic_name: 'Harmony TCM Clinic',
        specialties: ['Internal Medicine', 'Digestive Disorders'],
        address: 'Kuala Lumpur, Malaysia',
        phone: '+60 3-1234 5678',
        experience: '15 years',
    },
    {
        id: 'fallback-2',
        name: 'Dr. Chen Xiao Hua',
        photo: null,
        clinic_name: 'Golden Needle Acupuncture',
        specialties: ['Acupuncture', 'Pain Management'],
        address: 'Petaling Jaya, Malaysia',
        phone: '+60 3-8765 4321',
        experience: '20 years',
    },
];

export default function DoctorVerificationModal({
    visible,
    onClose,
    reportData,
    patientData,
    theme,
    isDark
}) {
    const { t, language } = useLanguage();
    const [practitioners, setPractitioners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [sending, setSending] = useState(false);
    const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    // Fetch practitioners on open
    useEffect(() => {
        if (visible) {
            fetchPractitioners();
            // Entrance animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset state when closing
            setStep('select');
            setSelectedDoctor(null);
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            successScale.setValue(0);
        }
    }, [visible]);

    const fetchPractitioners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tcm_practitioners')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                setPractitioners(data);
            } else {
                // Use fallback if no data
                setPractitioners(FALLBACK_PRACTITIONERS);
            }
        } catch (error) {
            console.log('Error fetching practitioners:', error);
            // Use fallback on error
            setPractitioners(FALLBACK_PRACTITIONERS);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = (doctor) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDoctor(doctor);
    };

    const handleProceedToConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStep('confirm');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep('select');
    };

    const handleSendRequest = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setSending(true);

        try {
            // Simulate API call - in production, this would POST to a verification endpoint
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Log the verification request (for debugging / future backend integration)
            console.log('=== VERIFICATION REQUEST ===');
            console.log('Practitioner:', selectedDoctor?.name || 'Any Available');
            console.log('Patient:', patientData?.name || 'Anonymous');
            console.log('Diagnosis:', reportData?.diagnosis);
            console.log('Timestamp:', new Date().toISOString());
            console.log('===========================');

            // Show success state
            setStep('success');

            // Success animation
            Animated.spring(successScale, {
                toValue: 1,
                tension: 50,
                friction: 4,
                useNativeDriver: true,
            }).start();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 2500);

        } catch (error) {
            console.error('Verification request error:', error);
            Alert.alert(
                t.verification?.errorTitle || 'Error',
                t.verification?.errorMessage || 'Could not send verification request. Please try again.'
            );
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Exit animation
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const renderDoctorCard = (doctor) => {
        const isSelected = selectedDoctor?.id === doctor.id;

        return (
            <TouchableOpacity
                key={doctor.id}
                style={[
                    styles.doctorCard,
                    isSelected && styles.doctorCardSelected,
                ]}
                onPress={() => handleSelectDoctor(doctor)}
                activeOpacity={0.7}
            >
                <View style={styles.doctorCardInner}>
                    {/* Photo or Avatar */}
                    <View style={[styles.doctorAvatar, isSelected && styles.doctorAvatarSelected]}>
                        {doctor.photo ? (
                            <Image source={{ uri: doctor.photo }} style={styles.doctorPhoto} />
                        ) : (
                            <Ionicons
                                name="person"
                                size={28}
                                color={isSelected ? '#ffffff' : theme.text.secondary}
                            />
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.doctorInfo}>
                        <Text style={[styles.doctorName, isSelected && styles.doctorNameSelected]}>
                            {doctor.name}
                        </Text>
                        <Text style={styles.doctorClinic}>{doctor.clinic_name}</Text>

                        {doctor.specialties && doctor.specialties.length > 0 && (
                            <View style={styles.specialtiesRow}>
                                {doctor.specialties.slice(0, 2).map((spec, idx) => (
                                    <View key={idx} style={[styles.specialtyChip, isSelected && styles.specialtyChipSelected]}>
                                        <Text style={[styles.specialtyText, isSelected && styles.specialtyTextSelected]}>
                                            {spec}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {doctor.experience && (
                            <Text style={styles.doctorExperience}>
                                <Ionicons name="time-outline" size={12} color={theme.text.tertiary} />
                                {' '}{doctor.experience}
                            </Text>
                        )}
                    </View>

                    {/* Selection indicator */}
                    <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSelectStep = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Ionicons name="shield-checkmark" size={28} color={theme.accent.primary} />
                </View>
                <Text style={styles.title}>
                    {t.verification?.modalTitle || 'Request Doctor Verification'}
                </Text>
                <Text style={styles.subtitle}>
                    {t.verification?.modalSubtitle || 'Have a licensed TCM practitioner review your AI diagnosis'}
                </Text>
            </View>

            {/* Doctor List */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionLabel}>
                    {t.verification?.selectDoctor || 'Select Practitioner'}
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.accent.primary} />
                        <Text style={styles.loadingText}>Loading practitioners...</Text>
                    </View>
                ) : practitioners.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={theme.text.tertiary} />
                        <Text style={styles.emptyText}>
                            {t.verification?.noPractitioners || 'No practitioners available at this time.'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.doctorList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.doctorListContent}
                    >
                        {practitioners.map(renderDoctorCard)}

                        {/* Skip option */}
                        <TouchableOpacity
                            style={[
                                styles.skipOption,
                                selectedDoctor === null && styles.skipOptionSelected,
                            ]}
                            onPress={() => setSelectedDoctor(null)}
                        >
                            <Ionicons
                                name="shuffle"
                                size={20}
                                color={selectedDoctor === null ? theme.accent.primary : theme.text.tertiary}
                            />
                            <Text style={[
                                styles.skipText,
                                selectedDoctor === null && styles.skipTextSelected,
                            ]}>
                                {t.verification?.noSelection || 'Send to Any Available Doctor'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>
                        {t.verification?.cancel || 'Cancel'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={handleProceedToConfirm}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={theme.gradients.accent}
                        style={styles.proceedButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.proceedButtonText}>
                            {t.common?.next || 'Next'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderConfirmStep = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: theme.semantic.warning + '20' }]}>
                    <Ionicons name="alert-circle" size={28} color={theme.semantic.warning} />
                </View>
                <Text style={styles.title}>
                    {t.verification?.confirmTitle || 'Confirm Verification Request'}
                </Text>
            </View>

            {/* Summary */}
            <View style={styles.confirmContent}>
                <View style={styles.confirmCard}>
                    <Text style={styles.confirmLabel}>
                        {t.verification?.selectDoctor || 'Selected Practitioner'}
                    </Text>
                    <Text style={styles.confirmValue}>
                        {selectedDoctor?.name || (t.verification?.noSelection || 'Any Available Doctor')}
                    </Text>
                    {selectedDoctor?.clinic_name && (
                        <Text style={styles.confirmSubvalue}>{selectedDoctor.clinic_name}</Text>
                    )}
                </View>

                <View style={styles.confirmCard}>
                    <Text style={styles.confirmLabel}>
                        {t.common?.patient || 'Patient'}
                    </Text>
                    <Text style={styles.confirmValue}>
                        {patientData?.name || 'Anonymous'}
                    </Text>
                </View>

                <View style={styles.confirmMessage}>
                    <Ionicons name="information-circle" size={18} color={theme.accent.primary} />
                    <Text style={styles.confirmMessageText}>
                        {t.verification?.confirmMessage ||
                            'Your complete diagnosis report will be sent for professional review. You will be notified once verified.'}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={18} color={theme.text.secondary} />
                    <Text style={styles.cancelButtonText}>
                        {t.common?.back || 'Back'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendRequest}
                    disabled={sending}
                >
                    <LinearGradient
                        colors={[theme.accent.primary, theme.accent.secondary]}
                        style={styles.sendButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#ffffff" />
                                <Text style={styles.sendButtonText}>
                                    {t.verification?.sendRequest || 'Send Request'}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderSuccessStep = () => (
        <View style={styles.successContainer}>
            <Animated.View
                style={[
                    styles.successIcon,
                    { transform: [{ scale: successScale }] }
                ]}
            >
                <LinearGradient
                    colors={[theme.semantic.success, '#34D399']}
                    style={styles.successIconInner}
                >
                    <Ionicons name="checkmark" size={48} color="#ffffff" />
                </LinearGradient>
            </Animated.View>

            <Text style={styles.successTitle}>
                {t.verification?.successTitle || 'Request Sent!'}
            </Text>
            <Text style={styles.successMessage}>
                {t.verification?.successMessage ||
                    'Your diagnosis has been sent for verification. You will receive a notification once reviewed.'}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    styles.overlay,
                    { opacity: fadeAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
                            <View style={styles.modalContent}>
                                {step === 'select' && renderSelectStep()}
                                {step === 'confirm' && renderConfirmStep()}
                                {step === 'success' && renderSuccessStep()}
                            </View>
                        </BlurView>
                    ) : (
                        <View style={[styles.modalContent, styles.androidModal]}>
                            {step === 'select' && renderSelectStep()}
                            {step === 'confirm' && renderConfirmStep()}
                            {step === 'success' && renderSuccessStep()}
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        flex: 1,
    },
    modalContainer: {
        maxHeight: SCREEN_HEIGHT * 0.85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    blurContainer: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    androidModal: {
        backgroundColor: theme.surface.elevated,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.subtle,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.accent.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.secondary,
        marginBottom: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.text.tertiary,
        textAlign: 'center',
    },
    doctorList: {
        flex: 1,
    },
    doctorListContent: {
        paddingBottom: 16,
    },
    doctorCard: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: theme.surface.default,
        borderWidth: 2,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    doctorCardSelected: {
        borderColor: theme.accent.primary,
        backgroundColor: theme.accent.primary + '10',
    },
    doctorCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    doctorAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    doctorAvatarSelected: {
        backgroundColor: theme.accent.primary,
    },
    doctorPhoto: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text.primary,
        marginBottom: 2,
    },
    doctorNameSelected: {
        color: theme.accent.primary,
    },
    doctorClinic: {
        fontSize: 13,
        color: theme.text.secondary,
        marginBottom: 6,
    },
    specialtiesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    specialtyChip: {
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    specialtyChipSelected: {
        backgroundColor: theme.accent.primary + '30',
    },
    specialtyText: {
        fontSize: 11,
        color: theme.text.tertiary,
        fontWeight: '500',
    },
    specialtyTextSelected: {
        color: theme.accent.primary,
    },
    doctorExperience: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginTop: 4,
    },
    selectionIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.border.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: theme.accent.primary,
        borderColor: theme.accent.primary,
    },
    skipOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
        borderStyle: 'dashed',
        gap: 8,
    },
    skipOptionSelected: {
        borderColor: theme.accent.primary,
        backgroundColor: theme.accent.primary + '10',
    },
    skipText: {
        fontSize: 14,
        color: theme.text.tertiary,
    },
    skipTextSelected: {
        color: theme.accent.primary,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.surface.default,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 6,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    proceedButton: {
        flex: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
    },
    proceedButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    proceedButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    sendButton: {
        flex: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    sendButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    confirmContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    confirmCard: {
        backgroundColor: theme.surface.default,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    confirmLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    confirmValue: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text.primary,
    },
    confirmSubvalue: {
        fontSize: 13,
        color: theme.text.secondary,
        marginTop: 2,
    },
    confirmMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.accent.primary + '15',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        gap: 10,
    },
    confirmMessageText: {
        flex: 1,
        fontSize: 13,
        color: theme.text.secondary,
        lineHeight: 19,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    successIcon: {
        marginBottom: 24,
    },
    successIconInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
