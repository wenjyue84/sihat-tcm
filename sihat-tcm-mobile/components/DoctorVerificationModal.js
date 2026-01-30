/**
 * DoctorVerificationModal.js
 * 
 * Native modal for requesting TCM practitioner verification of AI diagnosis.
 * Features: Glassmorphic design, 1-step UX, haptic feedback, multi-language.
 * 
 * Changes:
 * - Removed confirm step (1-step UX)
 * - Added info tooltip
 * - Added "What happens next?" expandable section
 * - Added response time indicator
 * - Added navigation choice after success (Go to Communication / Stay Here)
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

// Master Doctor - default option with enhanced display
const MASTER_DOCTOR = {
    id: 'master',
    name: 'Master Doctor',
    photo: null,
    clinic_name: 'Sihat TCM',
    specialties: ['General TCM'],
    address: 'Malaysia',
    phone: null,
    experience: '15 years',
    avg_response_time: 120, // 2 hours in minutes
    is_master: true,
};

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
        avg_response_time: 180,
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
        avg_response_time: 240,
    },
];

// Translations
const TRANSLATIONS = {
    en: {
        title: 'Request Doctor Verification',
        subtitle: 'Get your AI diagnosis reviewed by a qualified TCM practitioner',
        selectDoctor: 'Select Practitioner',
        defaultDoctor: 'Master Doctor',
        defaultDescription: 'Default recipient - fastest response',
        noOtherDoctors: 'No other verified doctors available',
        cancel: 'Cancel',
        sendRequest: 'Send Request',
        successTitle: 'Request Sent!',
        successMessage: 'The doctor will review your diagnosis and provide professional feedback.',
        successDetail: 'You can check the status anytime in the Communication page.',
        goToCommunication: 'Go to Communication',
        stayHere: 'Stay Here',
        errorTitle: 'Error',
        errorMessage: 'Could not send verification request. Please try again.',
        loading: 'Loading practitioners...',
        whatHappens: 'What happens next?',
        processStep1: 'Your diagnosis data is securely sent to the doctor',
        processStep2: 'The doctor reviews and provides professional feedback',
        processStep3: "You'll receive a notification when ready",
        responseTime: 'Avg. response',
        experience: ' yrs exp.',
        verified: 'Verified',
        infoTooltip: 'A qualified TCM practitioner will review your AI-generated diagnosis and provide professional medical feedback. Your data is handled securely.',
        noSelection: 'Send to Any Available Doctor',
    },
    zh: {
        title: '请求医生核实',
        subtitle: '让合格中医审核您的AI诊断',
        selectDoctor: '选择医生',
        defaultDoctor: '主治医生',
        defaultDescription: '默认接收者 - 最快响应',
        noOtherDoctors: '暂无其他已认证医生',
        cancel: '取消',
        sendRequest: '发送请求',
        successTitle: '请求已发送！',
        successMessage: '医生将审核您的诊断并提供专业反馈。',
        successDetail: '您可以随时在沟通页面查看状态。',
        goToCommunication: '前往沟通页面',
        stayHere: '留在此处',
        errorTitle: '错误',
        errorMessage: '无法发送验证请求。请重试。',
        loading: '加载医生列表...',
        whatHappens: '接下来会发生什么？',
        processStep1: '您的诊断数据将安全发送给医生',
        processStep2: '医生审核并提供专业反馈',
        processStep3: '准备好后您会收到通知',
        responseTime: '平均响应',
        experience: '年经验',
        verified: '已认证',
        infoTooltip: '合格的中医师将审核您的AI诊断结果，并提供专业的医学反馈。您的数据将被安全处理。',
        noSelection: '发送给任何可用医生',
    },
    ms: {
        title: 'Mohon Pengesahan Doktor',
        subtitle: 'Dapatkan diagnosis AI anda disemak oleh pengamal TCM',
        selectDoctor: 'Pilih Pengamal',
        defaultDoctor: 'Doktor Utama',
        defaultDescription: 'Penerima lalai - respons terpantas',
        noOtherDoctors: 'Tiada doktor lain yang disahkan',
        cancel: 'Batal',
        sendRequest: 'Hantar Permintaan',
        successTitle: 'Permintaan Dihantar!',
        successMessage: 'Doktor akan menyemak diagnosis anda dan memberikan maklum balas profesional.',
        successDetail: 'Anda boleh menyemak status pada bila-bila masa di halaman Komunikasi.',
        goToCommunication: 'Pergi ke Komunikasi',
        stayHere: 'Kekal Di Sini',
        errorTitle: 'Ralat',
        errorMessage: 'Tidak dapat menghantar permintaan pengesahan. Sila cuba lagi.',
        loading: 'Memuatkan pengamal...',
        whatHappens: 'Apa yang berlaku seterusnya?',
        processStep1: 'Data diagnosis anda dihantar dengan selamat kepada doktor',
        processStep2: 'Doktor menyemak dan memberikan maklum balas profesional',
        processStep3: 'Anda akan menerima pemberitahuan apabila siap',
        responseTime: 'Purata respons',
        experience: ' thn pengalaman',
        verified: 'Disahkan',
        infoTooltip: 'Pengamal TCM yang berkelayakan akan menyemak diagnosis AI anda dan memberikan maklum balas perubatan profesional.',
        noSelection: 'Hantar kepada Doktor tersedia',
    },
};

export default function DoctorVerificationModal({
    visible,
    onClose,
    onNavigateToCommunication,
    reportData,
    patientData,
    theme,
    isDark
}) {
    const { language } = useLanguage();
    const [practitioners, setPractitioners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(MASTER_DOCTOR);
    const [sending, setSending] = useState(false);
    const [step, setStep] = useState('select'); // 'select' | 'success' | 'error'
    const [showProcessInfo, setShowProcessInfo] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const successScale = useRef(new Animated.Value(0)).current;
    const processHeight = useRef(new Animated.Value(0)).current;

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const tt = TRANSLATIONS[language] || TRANSLATIONS.en;

    // Format response time
    const formatResponseTime = (minutes) => {
        if (!minutes) return null;
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

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
            setSelectedDoctor(MASTER_DOCTOR);
            setShowProcessInfo(false);
            setShowTooltip(false);
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            successScale.setValue(0);
            processHeight.setValue(0);
        }
    }, [visible]);

    // Animate process info
    useEffect(() => {
        Animated.timing(processHeight, {
            toValue: showProcessInfo ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [showProcessInfo]);

    const fetchPractitioners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tcm_practitioners')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                // Add response time to existing practitioners
                const enrichedData = data.map(p => ({
                    ...p,
                    avg_response_time: p.avg_response_time || 180,
                }));
                setPractitioners(enrichedData);
            } else {
                setPractitioners(FALLBACK_PRACTITIONERS);
            }
        } catch (error) {
            console.log('Error fetching practitioners:', error);
            setPractitioners(FALLBACK_PRACTITIONERS);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = (doctor) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDoctor(doctor);
    };

    const handleToggleProcessInfo = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowProcessInfo(!showProcessInfo);
    };

    const handleToggleTooltip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowTooltip(!showTooltip);
    };

    // Direct send - no confirm step
    const handleSendRequest = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setSending(true);

        try {
            // Create verification request in Supabase
            const verificationData = {
                symptoms: 'Request for Verification',
                diagnosis_report: {
                    type: 'verification_request',
                    status: 'pending',
                    messages: [],
                    patient_profile: {
                        name: patientData?.name || 'Anonymous',
                        email: patientData?.email || null,
                    },
                    ai_diagnosis: reportData?.diagnosis || null,
                    selected_doctor: selectedDoctor ? {
                        id: selectedDoctor.id,
                        name: selectedDoctor.is_master ? tt.defaultDoctor : selectedDoctor.name,
                        clinic_name: selectedDoctor.clinic_name,
                    } : null,
                    requested_at: new Date().toISOString(),
                },
                notes: `Verification request from ${patientData?.name || 'guest'}`,
            };

            const { data, error } = await supabase
                .from('inquiries')
                .insert([verificationData])
                .select();

            if (error) throw error;

            console.log('=== VERIFICATION REQUEST CREATED ===');
            console.log('Request ID:', data?.[0]?.id);
            console.log('Practitioner:', selectedDoctor?.name || 'Any Available');
            console.log('Patient:', patientData?.name || 'Anonymous');
            console.log('===================================');

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

        } catch (error) {
            console.error('Verification request error:', error);
            Alert.alert(tt.errorTitle, tt.errorMessage);
            setStep('error');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const handleGoToCommunication = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleClose();
        if (onNavigateToCommunication) {
            setTimeout(() => onNavigateToCommunication(), 300);
        }
    };

    const handleStayHere = () => {
        handleClose();
    };

    // Process step component
    const ProcessStep = ({ number, text }) => (
        <View style={styles.processStep}>
            <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>{number}</Text>
            </View>
            <Text style={styles.processStepText}>{text}</Text>
        </View>
    );

    // Doctor card component
    const renderDoctorCard = (doctor, isMaster = false) => {
        const isSelected = selectedDoctor?.id === doctor.id;
        const displayName = isMaster ? tt.defaultDoctor : doctor.name;
        const responseTime = formatResponseTime(doctor.avg_response_time);

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
                    {/* Avatar with verified badge */}
                    <View style={styles.avatarContainer}>
                        {doctor.photo ? (
                            <Image source={{ uri: doctor.photo }} style={styles.doctorPhoto} />
                        ) : (
                            <LinearGradient
                                colors={isMaster
                                    ? ['#F59E0B', '#EF6C00']
                                    : [theme.accent.primary, theme.accent.secondary]
                                }
                                style={styles.doctorAvatar}
                            >
                                {isMaster ? (
                                    <Ionicons name="ribbon" size={24} color="#ffffff" />
                                ) : (
                                    <Ionicons name="person" size={24} color="#ffffff" />
                                )}
                            </LinearGradient>
                        )}
                        {/* Verified badge */}
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={10} color="#ffffff" />
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.doctorInfo}>
                        <Text style={[styles.doctorName, isSelected && styles.doctorNameSelected]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <View style={styles.doctorMeta}>
                            {doctor.specialties && doctor.specialties.length > 0 && (
                                <Text style={styles.doctorSpecialty} numberOfLines={1}>
                                    {doctor.specialties[0]}
                                </Text>
                            )}
                            {doctor.experience && (
                                <>
                                    <Text style={styles.metaDot}>·</Text>
                                    <Text style={styles.doctorExperience}>
                                        {doctor.experience.replace(' years', tt.experience)}
                                    </Text>
                                </>
                            )}
                        </View>
                        {isMaster && (
                            <Text style={styles.defaultDescription}>{tt.defaultDescription}</Text>
                        )}
                    </View>

                    {/* Right side: Response time + Selection */}
                    <View style={styles.cardRight}>
                        {responseTime && (
                            <View style={styles.responseTimeChip}>
                                <Ionicons name="time-outline" size={10} color={theme.text.tertiary} />
                                <Text style={styles.responseTimeText}>~{responseTime}</Text>
                            </View>
                        )}
                        <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSelectStep = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerIconContainer}>
                        <LinearGradient
                            colors={theme.gradients.accent}
                            style={styles.headerIcon}
                        >
                            <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
                        </LinearGradient>
                    </View>
                    {/* Info tooltip button */}
                    <TouchableOpacity
                        style={styles.tooltipButton}
                        onPress={handleToggleTooltip}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="information-circle-outline" size={22} color={theme.text.secondary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>{tt.title}</Text>
                <Text style={styles.subtitle}>{tt.subtitle}</Text>

                {/* Tooltip */}
                {showTooltip && (
                    <View style={styles.tooltipContainer}>
                        <View style={styles.tooltipArrow} />
                        <View style={styles.tooltipContent}>
                            <Ionicons name="shield-checkmark" size={16} color={theme.accent.primary} />
                            <Text style={styles.tooltipText}>{tt.infoTooltip}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* What happens next - Expandable */}
            <View style={styles.processInfoSection}>
                <TouchableOpacity
                    style={styles.processInfoHeader}
                    onPress={handleToggleProcessInfo}
                    activeOpacity={0.7}
                >
                    <Text style={styles.processInfoTitle}>{tt.whatHappens}</Text>
                    <Ionicons
                        name={showProcessInfo ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.accent.primary}
                    />
                </TouchableOpacity>
                {showProcessInfo && (
                    <View style={styles.processStepsContainer}>
                        <ProcessStep number={1} text={tt.processStep1} />
                        <ProcessStep number={2} text={tt.processStep2} />
                        <ProcessStep number={3} text={tt.processStep3} />
                    </View>
                )}
            </View>

            {/* Doctor List */}
            <View style={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.accent.primary} />
                        <Text style={styles.loadingText}>{tt.loading}</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.doctorList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.doctorListContent}
                    >
                        {/* Master Doctor (Default) */}
                        {renderDoctorCard(MASTER_DOCTOR, true)}

                        {/* Other Practitioners */}
                        {practitioners.length > 0 && (
                            <Text style={styles.sectionLabel}>{tt.selectDoctor}</Text>
                        )}
                        {practitioners.map(doc => renderDoctorCard(doc, false))}

                        {practitioners.length === 0 && (
                            <Text style={styles.noOtherDoctors}>{tt.noOtherDoctors}</Text>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>{tt.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendRequest}
                    disabled={loading || sending}
                >
                    <LinearGradient
                        colors={theme.gradients.accent}
                        style={styles.sendButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={16} color="#ffffff" />
                                <Text style={styles.sendButtonText}>{tt.sendRequest}</Text>
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

            <Text style={styles.successTitle}>{tt.successTitle}</Text>
            <Text style={styles.successMessage}>{tt.successMessage}</Text>
            <Text style={styles.successDetail}>{tt.successDetail}</Text>

            {/* Navigation buttons */}
            <View style={styles.successActions}>
                <TouchableOpacity
                    style={styles.goToCommunicationButton}
                    onPress={handleGoToCommunication}
                >
                    <LinearGradient
                        colors={theme.gradients.accent}
                        style={styles.goToCommunicationGradient}
                    >
                        <Ionicons name="chatbubbles" size={18} color="#ffffff" />
                        <Text style={styles.goToCommunicationText}>{tt.goToCommunication}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.stayHereButton}
                    onPress={handleStayHere}
                >
                    <Text style={styles.stayHereText}>{tt.stayHere}</Text>
                </TouchableOpacity>
            </View>
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
                                {step === 'success' && renderSuccessStep()}
                            </View>
                        </BlurView>
                    ) : (
                        <View style={[styles.modalContent, styles.androidModal]}>
                            {step === 'select' && renderSelectStep()}
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
        maxHeight: SCREEN_HEIGHT * 0.88,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    blurContainer: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    androidModal: {
        backgroundColor: theme.surface.elevated,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.subtle,
    },
    headerTop: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerIconContainer: {
        alignItems: 'center',
    },
    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipButton: {
        position: 'absolute',
        right: 0,
        padding: 4,
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
        paddingHorizontal: 16,
    },
    tooltipContainer: {
        position: 'absolute',
        top: 70,
        right: 20,
        width: SCREEN_WIDTH - 80,
        zIndex: 100,
    },
    tooltipArrow: {
        position: 'absolute',
        top: -8,
        right: 20,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: theme.surface.elevated,
    },
    tooltipContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.surface.elevated,
        borderRadius: 12,
        padding: 14,
        gap: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    tooltipText: {
        flex: 1,
        fontSize: 13,
        color: theme.text.secondary,
        lineHeight: 19,
    },
    processInfoSection: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 8,
    },
    processInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.accent.primary + '15',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    processInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.accent.primary,
    },
    processStepsContainer: {
        paddingHorizontal: 8,
        paddingTop: 12,
        gap: 10,
    },
    processStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    processStepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.accent.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processStepNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accent.primary,
    },
    processStepText: {
        flex: 1,
        fontSize: 13,
        color: theme.text.secondary,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text.tertiary,
        marginTop: 12,
        marginBottom: 8,
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
    doctorList: {
        flex: 1,
    },
    doctorListContent: {
        paddingBottom: 16,
    },
    doctorCard: {
        marginBottom: 10,
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
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    doctorAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorPhoto: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.semantic.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.surface.default,
    },
    doctorInfo: {
        flex: 1,
        minWidth: 0,
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text.primary,
        marginBottom: 2,
    },
    doctorNameSelected: {
        color: theme.accent.primary,
    },
    doctorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    doctorSpecialty: {
        fontSize: 13,
        color: theme.text.secondary,
    },
    metaDot: {
        fontSize: 13,
        color: theme.text.tertiary,
        marginHorizontal: 4,
    },
    doctorExperience: {
        fontSize: 13,
        color: theme.text.tertiary,
    },
    defaultDescription: {
        fontSize: 12,
        color: theme.accent.primary,
        marginTop: 2,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    responseTimeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    responseTimeText: {
        fontSize: 11,
        color: theme.text.tertiary,
    },
    selectionIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.border.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: theme.accent.primary,
        borderColor: theme.accent.primary,
    },
    noOtherDoctors: {
        fontSize: 13,
        color: theme.text.tertiary,
        textAlign: 'center',
        paddingVertical: 16,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.surface.default,
        borderWidth: 1,
        borderColor: theme.border.default,
        minHeight: 50,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    sendButton: {
        flex: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
        minHeight: 50,
    },
    sendButtonGradient: {
        flex: 1,
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
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 24,
    },
    successIcon: {
        marginBottom: 20,
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
        marginBottom: 10,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 6,
    },
    successDetail: {
        fontSize: 13,
        color: theme.text.tertiary,
        textAlign: 'center',
        marginBottom: 28,
    },
    successActions: {
        width: '100%',
        gap: 12,
    },
    goToCommunicationButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    goToCommunicationGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    goToCommunicationText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    stayHereButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.surface.default,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    stayHereText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.secondary,
    },
});
