/**
 * AuthScreen - Main Authentication Screen
 *
 * A premium, animated authentication experience featuring:
 * - Glassmorphism UI design
 * - Animated logo with glowing ring
 * - Progressive disclosure login flow
 * - Multi-language support (EN/ZH/MS)
 * - Biometric authentication support
 * - Guest mode access
 *
 * @module screens/auth/AuthScreen
 */

import React, { useRef, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";

import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";
import { LoginForm } from "./LoginForm";
import { COLORS } from "./AuthComponents";

const { width, height } = Dimensions.get("window");

/**
 * AuthScreen Component
 *
 * @param {Object} props - Component props
 * @param {Function} props.onAuthSuccess - Called with user data on successful auth
 * @param {Function} props.onGuestMode - Called when user chooses guest mode
 */
export const AuthScreen = ({ onAuthSuccess, onGuestMode }) => {
    const { language } = useLanguage();
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    // Animation values
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const ringRotation = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const stepAnim = useRef(new Animated.Value(1)).current;

    // Check biometric availability on mount
    useEffect(() => {
        checkBiometricAvailability();
        startAnimations();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(compatible && enrolled);
        } catch (error) {
            console.log("Biometric check error:", error);
            setBiometricAvailable(false);
        }
    };

    const startAnimations = () => {
        // Logo entrance animation
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(logoRotate, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
        ]).start();

        // Content fade in
        Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 600,
            delay: 300,
            useNativeDriver: true,
        }).start();

        // Continuous ring rotation
        Animated.loop(
            Animated.timing(ringRotation, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    // Handle biometric authentication
    const handleBiometricAuth = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage:
                    language === "zh"
                        ? "使用生物识别登录"
                        : language === "ms"
                            ? "Log masuk dengan biometrik"
                            : "Login with biometrics",
                fallbackLabel:
                    language === "zh" ? "使用密码" : language === "ms" ? "Guna kata laluan" : "Use Password",
                disableDeviceFallback: false,
            });

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // In a real app, you would retrieve stored credentials here
                // For now, we'll just show success feedback
                console.log("Biometric auth successful");
            }
        } catch (error) {
            console.log("Biometric auth error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Handle guest mode
    const handleGuestContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onGuestMode?.();
    };

    // Interpolated animations
    const logoRotation = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["-180deg", "0deg"],
    });

    const ringRotate = ringRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Background watermark */}
                <View style={styles.watermarkContainer}>
                    <Image
                        source={require("../../assets/sihat-logo.png")}
                        style={styles.watermark}
                        resizeMode="contain"
                    />
                </View>

                {/* Language selector button */}
                <TouchableOpacity
                    style={styles.headerLanguageButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowLanguageSelector(true);
                    }}
                >
                    <Text style={styles.languageText}>
                        {language === "zh" ? "中文" : language === "ms" ? "BM" : "EN"} ▾
                    </Text>
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.contentContainer}
                >
                    {/* Header with animated logo */}
                    <View style={styles.header}>
                        <Animated.View
                            style={[
                                styles.logoWrapper,
                                {
                                    transform: [{ scale: logoScale }, { rotate: logoRotation }],
                                },
                            ]}
                        >
                            {/* Rotating gradient ring */}
                            <Animated.View
                                style={[styles.ringContainer, { transform: [{ rotate: ringRotate }] }]}
                            >
                                <LinearGradient
                                    colors={[COLORS.amberStart, COLORS.amberEnd, COLORS.amberStart]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientRing}
                                />
                                <View style={styles.ringMask} />
                            </Animated.View>

                            {/* Logo */}
                            <Image source={require("../../assets/sihat-logo.png")} style={styles.logo} />
                        </Animated.View>

                        <Animated.View style={[styles.headerTextContainer, { opacity: contentOpacity }]}>
                            <Text style={styles.welcomeTitle}>
                                {language === "zh"
                                    ? "诗哈中医"
                                    : language === "ms"
                                        ? "Sihat TCM"
                                        : "Sihat TCM"}
                            </Text>
                            <Text style={styles.tagline}>
                                {language === "zh"
                                    ? "传统智慧，现代健康"
                                    : language === "ms"
                                        ? "Kebijaksanaan Tradisional, Kesihatan Moden"
                                        : "Traditional Wisdom, Modern Wellness"}
                            </Text>
                        </Animated.View>
                    </View>

                    {/* Login Form */}
                    <Animated.View style={{ opacity: contentOpacity }}>
                        <LoginForm
                            language={language}
                            onLoginSuccess={onAuthSuccess}
                            onGuestContinue={handleGuestContinue}
                            onBiometricAuth={handleBiometricAuth}
                            showBiometric={biometricAvailable}
                            stepAnim={stepAnim}
                        />
                    </Animated.View>
                </KeyboardAvoidingView>

                {/* Language Selector Modal */}
                <LanguageSelector
                    visible={showLanguageSelector}
                    onClose={() => setShowLanguageSelector(false)}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.emeraldDeep,
    },
    watermarkContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 0,
    },
    watermark: {
        width: width * 1.5,
        height: width * 1.5,
        opacity: 0.05,
        tintColor: COLORS.white,
    },
    headerLanguageButton: {
        marginTop: 50,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    languageText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "600",
    },
    contentContainer: {
        flex: 1,
        zIndex: 10,
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    logoWrapper: {
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    ringContainer: {
        position: "absolute",
        width: 150,
        height: 150,
        justifyContent: "center",
        alignItems: "center",
    },
    gradientRing: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: "hidden",
        shadowColor: COLORS.amberStart,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    ringMask: {
        position: "absolute",
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: COLORS.emeraldDeep,
    },
    logo: {
        width: 110,
        height: 110,
        borderRadius: 55,
        resizeMode: "contain",
        shadowColor: COLORS.amberStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    headerTextContainer: {
        alignItems: "center",
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.white,
        marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: "center",
        opacity: 0.8,
    },
});
