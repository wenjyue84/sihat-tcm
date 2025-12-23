/**
 * Onboarding Screen for First-Time Users
 * 
 * A 4-slide carousel showcasing Sihat TCM's key value propositions:
 * 1. Multi-modal diagnosis (tongue, pulse, voice)
 * 2. Backed by real TCM practitioners
 * 3. AI triage + shareable reports
 * 4. Language selection + Get Started
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

// Color palette matching App.js
const COLORS = {
    emeraldDeep: '#064E3B',
    emeraldDark: '#065F46',
    emeraldMedium: '#10B981',
    amberStart: '#F59E0B',
    amberEnd: '#D97706',
    white: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary: 'rgba(255,255,255,0.5)',
};

// Enhanced onboarding content with marketer's perspective
const SLIDES = [
    {
        id: '1',
        titleKey: 'multiModal',
        subtitleKey: 'multiModalSub',
        // Multi-modal icons: eye (tongue), hand (pulse), ear (voice)
        icons: ['eye-outline', 'hand-left-outline', 'ear-outline'],
        iconLabels: ['tongueLabel', 'pulseLabel', 'voiceLabel'],
        trustBadge: 'chatGptCant',
    },
    {
        id: '2',
        icon: 'shield-checkmark-outline',
        titleKey: 'realDoctors',
        subtitleKey: 'realDoctorsSub',
        // Key differentiator: Real doctors review edge cases
        bulletPoints: ['doctorReview', 'guidedQuestions', 'notScraped'],
        badgeIcon: 'medical-outline',
        badgeTextKey: 'practitionerBacked',
    },
    {
        id: '3',
        icon: 'clipboard-outline',
        titleKey: 'triage',
        subtitleKey: 'triageSub',
        features: ['triageFeature', 'reportFeature', 'saveFeature'],
        featureIcons: ['help-circle-outline', 'share-social-outline', 'wallet-outline'],
    },
    {
        id: '4',
        icon: 'rocket-outline',
        titleKey: 'getStarted',
        subtitleKey: 'getStartedSub',
        isLanguageSlide: true,
    },
];

// Enhanced translations with marketing copy
const ONBOARDING_TEXT = {
    en: {
        // Slide 1: Multi-modal (ChatGPT can't do this)
        multiModal: 'See What ChatGPT Can\'t',
        multiModalSub: 'AI-powered diagnosis using your tongue, pulse, and voice — not just text',
        chatGptCant: 'Beyond Text Chat',
        tongueLabel: 'Tongue',
        pulseLabel: 'Pulse',
        voiceLabel: 'Voice',

        // Slide 2: Trust & Credibility (MOST IMPORTANT)
        realDoctors: 'Real Doctors. Real Trust.',
        realDoctorsSub: 'Unlike generic AI, we\'re built WITH TCM practitioners',
        doctorReview: '✓ Real TCM doctors review edge cases',
        guidedQuestions: '✓ Guided questions prevent confusion',
        notScraped: '✓ Not scraped from random internet sources',
        practitionerBacked: 'Practitioner-Backed AI',

        // Slide 3: Triage & Reports
        triage: '"Is This Serious?"',
        triageSub: 'Get instant clarity before your clinic visit',
        triageFeature: 'AI triage in seconds',
        reportFeature: 'Shareable health reports',
        saveFeature: 'Save RM100+ per visit',

        // Slide 4: Get Started
        getStarted: 'Ready to Begin?',
        getStartedSub: 'Choose your preferred language',

        // Navigation
        skip: 'Skip',
        next: 'Next',
        start: 'Start My Diagnosis',
    },
    zh: {
        // Slide 1
        multiModal: 'ChatGPT做不到的',
        multiModalSub: 'AI智能诊断——通过舌象、脉象和声音，不仅仅是文字',
        chatGptCant: '超越文字聊天',
        tongueLabel: '舌象',
        pulseLabel: '脉象',
        voiceLabel: '声音',

        // Slide 2
        realDoctors: '真正的医生，真正的信任',
        realDoctorsSub: '与普通AI不同，我们与中医师共同打造',
        doctorReview: '✓ 真正中医师审核疑难病例',
        guidedQuestions: '✓ 引导式问诊避免遗漏',
        notScraped: '✓ 非网络随意抓取资料',
        practitionerBacked: '中医师支持的AI',

        // Slide 3
        triage: '"这严重吗？"',
        triageSub: '就诊前获得即时分诊建议',
        triageFeature: '秒级AI分诊',
        reportFeature: '可分享健康报告',
        saveFeature: '每次省下RM100+',

        // Slide 4
        getStarted: '准备好了吗？',
        getStartedSub: '选择您的首选语言',

        skip: '跳过',
        next: '下一步',
        start: '开始我的诊断',
    },
    ms: {
        // Slide 1
        multiModal: 'Apa ChatGPT Tak Boleh',
        multiModalSub: 'Diagnosis AI menggunakan lidah, nadi, dan suara — bukan sekadar teks',
        chatGptCant: 'Melangkaui Sembang Teks',
        tongueLabel: 'Lidah',
        pulseLabel: 'Nadi',
        voiceLabel: 'Suara',

        // Slide 2
        realDoctors: 'Doktor Sebenar. Kepercayaan Sebenar.',
        realDoctorsSub: 'Tidak seperti AI biasa, kami dibina BERSAMA pengamal TCM',
        doctorReview: '✓ Doktor TCM sebenar menyemak kes sukar',
        guidedQuestions: '✓ Soalan berpandu elak kekeliruan',
        notScraped: '✓ Bukan dari sumber internet rawak',
        practitionerBacked: 'AI Disokong Pengamal',

        // Slide 3
        triage: '"Adakah Ini Serius?"',
        triageSub: 'Dapatkan kejelasan segera sebelum lawatan klinik',
        triageFeature: 'Triaj AI dalam saat',
        reportFeature: 'Laporan kesihatan boleh kongsi',
        saveFeature: 'Jimat RM100+ setiap lawatan',

        // Slide 4
        getStarted: 'Sedia Bermula?',
        getStartedSub: 'Pilih bahasa pilihan anda',

        skip: 'Langkau',
        next: 'Seterusnya',
        start: 'Mula Diagnosis Saya',
    },
};

// Language options
const LANGUAGE_OPTIONS = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'ms', flag: '🇲🇾', name: 'Bahasa Malaysia' },
];

// Individual slide component with enhanced visuals
function OnboardingSlide({ item, t, language, setLanguage, onStart }) {
    // Button Pulse Animation
    const buttonPulse = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Staggered animation for feature cards (Slide 3)
    const cardAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const slide3IconPulse = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (item.id === '4') { // Only animate on the last slide
            Animated.loop(
                Animated.sequence([
                    Animated.timing(buttonPulse, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(buttonPulse, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }

        if (item.id === '3') { // Slide 3 animations
            // Staggered cards entrance
            Animated.stagger(200, cardAnims.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                })
            )).start();

            // Icon Pulse for urgency feeling
            Animated.loop(
                Animated.sequence([
                    Animated.timing(slide3IconPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(slide3IconPulse, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        }
    }, [item.id]);

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Language selection slide (Slide 4)
    if (item.isLanguageSlide) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Rocket icon for excitement */}
                    <View style={[styles.iconContainer, { width: 90, height: 90, borderRadius: 45, marginBottom: 24, backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Ionicons name={item.icon} size={45} color={COLORS.amberStart} />
                    </View>

                    <Text style={[styles.slideTitle, { fontSize: 28, marginBottom: 8 }]}>{t[item.titleKey]}</Text>
                    <Text style={[styles.slideSubtitle, { marginBottom: 24 }]}>{t[item.subtitleKey]}</Text>

                    {/* Language Picker */}
                    <View style={styles.languageContainer}>
                        {LANGUAGE_OPTIONS.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageOption,
                                    language === lang.code && styles.languageOptionSelected,
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setLanguage(lang.code);
                                }}
                            >
                                <Text style={styles.languageFlag}>{lang.flag}</Text>
                                <Text style={[
                                    styles.languageName,
                                    language === lang.code && styles.languageNameSelected,
                                ]}>
                                    {lang.name}
                                </Text>
                                {language === lang.code && (
                                    <Ionicons name="checkmark-circle" size={22} color={COLORS.emeraldMedium} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Premium Start Button */}
                    <Animated.View style={{ width: '100%', transform: [{ scale: buttonPulse }] }}>
                        <TouchableOpacity
                            style={styles.startButtonContainer}
                            onPress={onStart}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonShadowLayer} />
                            <LinearGradient
                                colors={['#FFD700', '#F59E0B', '#D97706']}
                                style={styles.startButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            >
                                {/* Inner Top Highlight (Bevel) */}
                                <View style={styles.buttonBevelTop} />

                                <View style={styles.buttonContent}>
                                    <Text style={styles.startButtonText}>{t.start.toUpperCase()}</Text>
                                    <Ionicons name="arrow-forward-circle" size={28} color={COLORS.emeraldDeep} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        );
    }

    // Slide 1: Multi-modal diagnosis
    if (item.icons) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Trust Badge at top */}
                    {item.trustBadge && (
                        <View style={styles.trustBadge}>
                            <Ionicons name="sparkles" size={14} color={COLORS.amberStart} />
                            <Text style={styles.trustBadgeText}>{t[item.trustBadge]}</Text>
                        </View>
                    )}

                    {/* Main Title */}
                    <Text style={styles.slideTitle}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>

                    {/* Triple icon display */}
                    <View style={styles.multiIconRow}>
                        {item.icons.map((icon, index) => (
                            <View key={icon} style={styles.multiIconItem}>
                                <View style={styles.multiIconCircle}>
                                    <Ionicons name={icon} size={32} color={COLORS.white} />
                                </View>
                                <Text style={styles.multiIconLabel}>{t[item.iconLabels[index]]}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        );
    }

    // Slide 2: Real Doctors (Trust slide with bullet points)
    if (item.bulletPoints) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Shield icon for trust */}
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={60} color={COLORS.emeraldMedium} />
                    </View>

                    <Text style={styles.slideTitle}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>

                    {/* Bullet points (the key trust builders) */}
                    <View style={styles.bulletContainer}>
                        {item.bulletPoints.map((point, index) => (
                            <View key={index} style={styles.bulletItem}>
                                <Text style={styles.bulletText}>{t[point]}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Practitioner-backed badge */}
                    <View style={styles.credentialBadge}>
                        <Ionicons name={item.badgeIcon} size={20} color={COLORS.emeraldMedium} />
                        <Text style={styles.credentialText}>{t[item.badgeTextKey]}</Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    // Slide 3: Triage & Reports (Feature cards)
    if (item.features) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Main icon with pulse */}
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: slide3IconPulse }] }]}>
                        <Ionicons name={item.icon} size={60} color={COLORS.emeraldMedium} />
                    </Animated.View>

                    <Text style={[styles.slideTitle, styles.seriousTitle]}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>

                    {/* Feature cards with stagger animation */}
                    <View style={styles.featureContainer}>
                        {item.features.map((feature, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.featureCard,
                                    index === 2 && styles.featureCardHighlight,
                                    {
                                        opacity: cardAnims[index],
                                        transform: [
                                            {
                                                translateX: cardAnims[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [50, 0]
                                                })
                                            }
                                        ]
                                    }
                                ]}
                            >
                                <Ionicons
                                    name={item.featureIcons[index]}
                                    size={24}
                                    color={index === 2 ? COLORS.amberStart : COLORS.emeraldMedium}
                                />
                                <Text style={[
                                    styles.featureText,
                                    index === 2 && styles.featureTextHighlight
                                ]}>
                                    {t[feature]}
                                </Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        );
    }

    // Fallback for any other slides
    return (
        <View style={styles.slide}>
            <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon || 'information-circle-outline'} size={60} color={COLORS.emeraldMedium} />
                </View>
                <Text style={styles.slideTitle}>{t[item.titleKey]}</Text>
                <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>
            </Animated.View>
        </View>
    );
}

// Main Onboarding Screen
export default function OnboardingScreen({ onComplete }) {
    const { language, setLanguage } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT.en;

    const handleNext = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex]);

    const handleSkip = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        onComplete();
    }, [onComplete]);

    const handleStart = useCallback(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        onComplete();
    }, [onComplete]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const renderItem = useCallback(({ item }) => (
        <OnboardingSlide
            item={item}
            t={t}
            language={language}
            setLanguage={setLanguage}
            onStart={handleStart}
        />
    ), [t, language, setLanguage, handleStart]);

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={[COLORS.emeraldDeep, COLORS.emeraldDark, '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Skip Button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>{t.skip}</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                scrollEventThrottle={16}
            />

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const dotOpacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        width: dotWidth,
                                        opacity: dotOpacity,
                                        backgroundColor: index === currentIndex ? COLORS.emeraldMedium : COLORS.white,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Next Button (hidden on last slide) */}
                {!isLastSlide && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>{t.next}</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.emeraldDeep,
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    slideContent: {
        alignItems: 'center',
        maxWidth: 340,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    multiIconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 32,
    },
    multiIconItem: {
        alignItems: 'center',
        gap: 8,
    },
    multiIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.emeraldMedium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    multiIconLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 16,
    },
    seriousTitle: {
        fontSize: 32,
        color: COLORS.amberStart,
        textShadowColor: 'rgba(245, 158, 11, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    slideSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    highlightText: {
        color: COLORS.amberStart,
        fontWeight: 'bold',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    badgeEmoji: {
        fontSize: 20,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    languageContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 20,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 24, // More pill-like
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 14,
    },
    languageOptionSelected: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: COLORS.emeraldMedium,
    },
    languageFlag: {
        fontSize: 28,
    },
    languageName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: COLORS.white,
    },
    languageNameSelected: {
        color: COLORS.emeraldMedium,
    },
    startButtonContainer: {
        width: '100%',
        marginVertical: 10,
    },
    buttonShadowLayer: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        bottom: -4,
        backgroundColor: COLORS.amberStart,
        borderRadius: 30,
        opacity: 0.5,
        shadowColor: COLORS.amberStart,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 12,
    },
    startButtonGradient: {
        borderRadius: 30,
        padding: 1, // For inner border effect
        overflow: 'hidden',
    },
    buttonBevelTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.emeraldDeep,
        letterSpacing: 1.5,
        textShadowColor: 'rgba(255,255,255,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    bottomNav: {
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? 50 : 32,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    nextButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },

    // Trust badge (top of slide 1)
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    trustBadgeText: {
        color: COLORS.amberStart,
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Bullet points (slide 2 - trust slide)
    bulletContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    bulletItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.emeraldMedium,
    },
    bulletText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
    },

    // Credential badge (bottom of slide 2)
    credentialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    credentialText: {
        color: COLORS.emeraldMedium,
        fontSize: 14,
        fontWeight: '600',
    },

    // Feature cards (slide 3)
    featureContainer: {
        width: '100%',
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    featureCardHighlight: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        shadowColor: COLORS.amberStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    featureText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    featureTextHighlight: {
        color: COLORS.amberStart,
        fontWeight: '700',
    },
});
