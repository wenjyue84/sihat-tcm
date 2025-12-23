import React, { useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

/**
 * ProfileSummaryStep
 * 
 * A confirmation step showing the user's profile data before proceeding.
 * Features:
 * - Glassmorphic card with user avatar
 * - 2x2 grid showing Gender, Age, Height, Weight
 * - BMI calculation with category indicator
 * - Profile completeness check
 * - Animated entry with staggered fade-in
 */
export default function ProfileSummaryStep({ data, onUpdate, onNext, onBack, theme, isDark }) {
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    // Animation values
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const avatarScale = useRef(new Animated.Value(0.8)).current;

    // Start animations on mount
    useEffect(() => {
        Animated.stagger(100, [
            Animated.parallel([
                Animated.timing(headerAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(avatarScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Check profile completeness
    const isProfileComplete = !!(
        data.name && data.name.trim() !== '' &&
        data.age && data.age.trim() !== '' &&
        data.gender && data.gender.trim() !== '' &&
        data.height && data.height.trim() !== '' &&
        data.weight && data.weight.trim() !== ''
    );

    // Calculate BMI
    const calculateBMI = () => {
        const heightM = parseFloat(data.height) / 100;
        const weightKg = parseFloat(data.weight);
        if (heightM > 0 && weightKg > 0) {
            return (weightKg / (heightM * heightM)).toFixed(1);
        }
        return null;
    };

    const bmi = calculateBMI();

    // Get BMI category
    const getBMICategory = (bmiValue) => {
        const val = parseFloat(bmiValue);
        if (val < 18.5) {
            return {
                label: t.basicInfo?.bmiCategories?.underweight || 'Underweight',
                color: '#EAB308', // yellow
                gradientColors: ['#FEF3C7', '#FDE68A'],
            };
        } else if (val < 25) {
            return {
                label: t.basicInfo?.bmiCategories?.normal || 'Normal',
                color: '#22C55E', // green
                gradientColors: ['#DCFCE7', '#BBF7D0'],
            };
        } else if (val < 30) {
            return {
                label: t.basicInfo?.bmiCategories?.overweight || 'Overweight',
                color: '#F97316', // orange
                gradientColors: ['#FFEDD5', '#FED7AA'],
            };
        }
        return {
            label: t.basicInfo?.bmiCategories?.obese || 'Obese',
            color: '#EF4444', // red
            gradientColors: ['#FEE2E2', '#FECACA'],
        };
    };

    const bmiInfo = bmi ? getBMICategory(bmi) : null;

    // Get gender display
    const getGenderDisplay = (gender) => {
        if (!gender) return '-';
        const genderKey = gender.toLowerCase();
        if (genderKey === 'male') return t.basicInfo?.male || 'Male';
        if (genderKey === 'female') return t.basicInfo?.female || 'Female';
        return t.basicInfo?.other || 'Other';
    };

    const getGenderIcon = (gender) => {
        if (!gender) return '❓';
        const genderKey = gender.toLowerCase();
        if (genderKey === 'male') return '♂️';
        if (genderKey === 'female') return '♀️';
        return '⚧️';
    };

    // Handle continue button
    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (onNext) {
            onNext();
        }
    };

    // Handle edit button
    const handleEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onBack) {
            onBack();
        }
    };

    // Get user initial for avatar
    const userInitial = data.name ? data.name.charAt(0).toUpperCase() : 'P';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Section */}
            <Animated.View
                style={[
                    styles.headerSection,
                    {
                        opacity: headerAnim,
                        transform: [{
                            translateY: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 0],
                            }),
                        }],
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { transform: [{ scale: avatarScale }] },
                    ]}
                >
                    <LinearGradient
                        colors={theme.gradients.accent}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="person" size={32} color="#FFFFFF" />
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.headerTitle}>
                    {t.profileSummary?.title || 'Profile Summary'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {t.profileSummary?.subtitle || 'Please confirm your information'}
                </Text>
            </Animated.View>

            {/* Profile Card */}
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        opacity: cardAnim,
                        transform: [{
                            translateY: cardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        }],
                    },
                ]}
            >
                <BlurView
                    intensity={isDark ? 40 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurCard}
                >
                    <View style={styles.cardContent}>
                        {/* Avatar & Name Section */}
                        <View style={styles.avatarSection}>
                            <LinearGradient
                                colors={['#10B981', '#14B8A6']}
                                style={styles.avatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.avatarText}>{userInitial}</Text>
                            </LinearGradient>
                            <View style={styles.nameSection}>
                                <Text style={styles.userName}>
                                    {data.name || t.profileSummary?.anonymous || 'Patient'}
                                </Text>
                                <Text style={styles.profileLabel}>
                                    {t.profileSummary?.title || 'Profile Summary'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editIconButton}
                                onPress={handleEdit}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color={theme.text.secondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Info Grid */}
                        <View style={styles.infoGrid}>
                            {/* Gender */}
                            <View style={[styles.infoCard, { backgroundColor: theme.surface.elevated }]}>
                                <Text style={styles.infoIcon}>{getGenderIcon(data.gender)}</Text>
                                <Text style={styles.infoLabel}>{t.basicInfo?.gender || 'Gender'}</Text>
                                <Text style={styles.infoValue}>{getGenderDisplay(data.gender)}</Text>
                            </View>

                            {/* Age */}
                            <View style={[styles.infoCard, { backgroundColor: theme.surface.elevated }]}>
                                <Ionicons name="calendar-outline" size={24} color="#10B981" />
                                <Text style={styles.infoLabel}>{t.basicInfo?.age || 'Age'}</Text>
                                <Text style={styles.infoValue}>
                                    {data.age ? `${data.age} ${t.profileSummary?.yearsOld || 'yrs'}` : '-'}
                                </Text>
                            </View>

                            {/* Height */}
                            <View style={[styles.infoCard, { backgroundColor: theme.surface.elevated }]}>
                                <Ionicons name="resize-outline" size={24} color="#3B82F6" />
                                <Text style={styles.infoLabel}>{t.basicInfo?.height || 'Height'} (cm)</Text>
                                <Text style={styles.infoValue}>
                                    {data.height || '-'}
                                </Text>
                            </View>

                            {/* Weight */}
                            <View style={[styles.infoCard, { backgroundColor: theme.surface.elevated }]}>
                                <Ionicons name="scale-outline" size={24} color="#F97316" />
                                <Text style={styles.infoLabel}>{t.basicInfo?.weight || 'Weight'} (kg)</Text>
                                <Text style={styles.infoValue}>
                                    {data.weight || '-'}
                                </Text>
                            </View>
                        </View>

                        {/* BMI Section */}
                        {bmi && bmiInfo && (
                            <LinearGradient
                                colors={isDark ? [theme.surface.elevated, theme.surface.default] : bmiInfo.gradientColors}
                                style={styles.bmiSection}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.bmiLeft}>
                                    <Text style={styles.bmiLabel}>
                                        {t.basicInfo?.bmi || 'BMI'}
                                    </Text>
                                    <Text style={styles.bmiValue}>{bmi}</Text>
                                </View>
                                <View style={[styles.bmiCategory, { backgroundColor: bmiInfo.color + '20' }]}>
                                    <Text style={[styles.bmiCategoryText, { color: bmiInfo.color }]}>
                                        {bmiInfo.label}
                                    </Text>
                                </View>
                            </LinearGradient>
                        )}

                        {/* Status Banner */}
                        <View
                            style={[
                                styles.statusBanner,
                                isProfileComplete ? styles.statusComplete : styles.statusIncomplete,
                            ]}
                        >
                            <View
                                style={[
                                    styles.statusIconContainer,
                                    isProfileComplete ? styles.statusIconComplete : styles.statusIconIncomplete,
                                ]}
                            >
                                <Ionicons
                                    name={isProfileComplete ? 'checkmark' : 'alert'}
                                    size={16}
                                    color="#FFFFFF"
                                />
                            </View>
                            <View style={styles.statusTextContainer}>
                                <Text
                                    style={[
                                        styles.statusText,
                                        isProfileComplete ? styles.statusTextComplete : styles.statusTextIncomplete,
                                    ]}
                                >
                                    {isProfileComplete
                                        ? (t.profileSummary?.profileReady || 'Profile information is complete')
                                        : (t.profileSummary?.profileIncomplete || 'Please complete your profile')
                                    }
                                </Text>
                                {!isProfileComplete && (
                                    <Text style={styles.missingFieldsText}>
                                        {t.profileSummary?.missingFields || 'Some information is missing'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View
                style={[
                    styles.buttonSection,
                    {
                        opacity: buttonAnim,
                        transform: [{
                            translateY: buttonAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            }),
                        }],
                    },
                ]}
            >
                {isProfileComplete ? (
                    <>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10B981', '#14B8A6']}
                                style={styles.continueButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.continueButtonText}>
                                    {t.profileSummary?.continueToSymptoms || 'Continue to Symptoms'}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.editLinkButton}
                            onPress={handleEdit}
                        >
                            <Text style={styles.editLinkText}>
                                {t.profileSummary?.wantToEdit || 'Want to update your profile?'}{' '}
                                <Text style={styles.editLinkTextUnderline}>
                                    {t.profileSummary?.editProfile || 'Edit Profile'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.incompleteButton}
                        onPress={handleEdit}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.continueButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.continueButtonText}>
                                {t.profileSummary?.completeProfile || 'Complete My Profile'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },

    // Header
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: theme.text.secondary,
        textAlign: 'center',
    },

    // Card
    cardWrapper: {
        marginBottom: 24,
    },
    blurCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    cardContent: {
        padding: 20,
    },

    // Avatar Section
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    nameSection: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 2,
    },
    profileLabel: {
        fontSize: 13,
        color: theme.text.secondary,
    },
    editIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Info Grid - 2x2 田字 layout
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    infoCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginBottom: 4,
        marginTop: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },

    // BMI Section
    bmiSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    bmiLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bmiLabel: {
        fontSize: 14,
        color: isDark ? theme.text.secondary : '#6B7280',
    },
    bmiValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? theme.text.primary : '#1F2937',
    },
    bmiCategory: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bmiCategoryText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Status Banner
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
    },
    statusComplete: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    },
    statusIncomplete: {
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
    },
    statusIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusIconComplete: {
        backgroundColor: '#10B981',
    },
    statusIconIncomplete: {
        backgroundColor: '#F59E0B',
    },
    statusTextContainer: {
        flex: 1,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusTextComplete: {
        color: '#10B981',
    },
    statusTextIncomplete: {
        color: '#F59E0B',
    },
    missingFieldsText: {
        fontSize: 12,
        color: isDark ? 'rgba(245, 158, 11, 0.8)' : '#D97706',
        marginTop: 2,
    },

    // Buttons
    buttonSection: {
        alignItems: 'center',
    },
    continueButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    incompleteButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    editLinkButton: {
        marginTop: 16,
        padding: 8,
    },
    editLinkText: {
        fontSize: 14,
        color: theme.text.secondary,
        textAlign: 'center',
    },
    editLinkTextUnderline: {
        color: theme.accent.primary,
        textDecorationLine: 'underline',
    },
});
