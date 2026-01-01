import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, LANGUAGE_OPTIONS } from './OnboardingConstants';

const { width } = Dimensions.get('window');

export default function OnboardingSlide({ item, t, language, setLanguage, onStart }) {
    // Animations
    const buttonPulse = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Staggered animation for feature cards (Slide 3)
    const cardAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const slide3IconPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
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
            Animated.stagger(200, cardAnims.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                })
            )).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(slide3IconPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(slide3IconPulse, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        }
    }, [item.id]);

    useEffect(() => {
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

    // Slide 4: Language Selection
    if (item.isLanguageSlide) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <View style={[styles.iconContainer, { width: 90, height: 90, borderRadius: 45, marginBottom: 24, backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Ionicons name={item.icon} size={45} color={COLORS.amberStart} />
                    </View>

                    <Text style={[styles.slideTitle, { fontSize: 28, marginBottom: 8 }]}>{t[item.titleKey]}</Text>
                    <Text style={[styles.slideSubtitle, { marginBottom: 24 }]}>{t[item.subtitleKey]}</Text>

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

    // Slide 1: Multi-modal
    if (item.icons) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {item.trustBadge && (
                        <View style={styles.trustBadge}>
                            <Ionicons name="sparkles" size={14} color={COLORS.amberStart} />
                            <Text style={styles.trustBadgeText}>{t[item.trustBadge]}</Text>
                        </View>
                    )}
                    <Text style={styles.slideTitle}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>
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

    // Slide 2: Real Doctors
    if (item.bulletPoints) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={60} color={COLORS.emeraldMedium} />
                    </View>
                    <Text style={styles.slideTitle}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>
                    <View style={styles.bulletContainer}>
                        {item.bulletPoints.map((point, index) => (
                            <View key={index} style={styles.bulletItem}>
                                <Text style={styles.bulletText}>{t[point]}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.credentialBadge}>
                        <Ionicons name={item.badgeIcon} size={20} color={COLORS.emeraldMedium} />
                        <Text style={styles.credentialText}>{t[item.badgeTextKey]}</Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    // Slide 3: Triage & Reports
    if (item.features) {
        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.slideContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: slide3IconPulse }] }]}>
                        <Ionicons name={item.icon} size={60} color={COLORS.emeraldMedium} />
                    </Animated.View>
                    <Text style={[styles.slideTitle, styles.seriousTitle]}>{t[item.titleKey]}</Text>
                    <Text style={styles.slideSubtitle}>{t[item.subtitleKey]}</Text>
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

const styles = StyleSheet.create({
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
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 20,
        gap: 6,
    },
    trustBadgeText: {
        color: COLORS.amberStart,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bulletContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    bulletItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bulletText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    credentialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: 0.8,
    },
    credentialText: {
        color: COLORS.emeraldMedium,
        fontSize: 13,
        fontWeight: '600',
    },
    featureContainer: {
        width: '100%',
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    featureCardHighlight: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    featureText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '500',
    },
    featureTextHighlight: {
        color: COLORS.amberStart,
        fontWeight: '700',
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
        borderRadius: 24,
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
    },
    startButtonGradient: {
        borderRadius: 30,
        padding: 1,
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
    },
});
