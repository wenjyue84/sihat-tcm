/**
 * Shared Auth Components
 *
 * Reusable UI components for the authentication flow:
 * - FloatingLabelInput - Animated input with floating label
 * - GlassCard - Glassmorphism card container
 * - COLORS - Auth screen color palette
 * - MOCKED_ACCOUNTS - Development test accounts
 *
 * @module screens/auth/AuthComponents
 */

import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

/**
 * Auth screen color palette
 */
export const COLORS = {
    emeraldDeep: "#022c22",
    emeraldDark: "#064e3b",
    emeraldMedium: "#10b981",
    amberStart: "#fbbf24",
    amberEnd: "#d97706",
    white: "#ffffff",
    glassBorder: "rgba(255, 255, 255, 0.2)",
    glassBg: "rgba(255, 255, 255, 0.1)",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    inputBg: "rgba(0, 0, 0, 0.2)",
};

/**
 * Mock accounts for development testing
 */
export const MOCKED_ACCOUNTS = [
    { label: "Pt", role: "Patient", email: "patient@sihat.tcm", pass: "Patient123" },
    { label: "Dr", role: "Doctor", email: "doctor@sihat.tcm", pass: "Doctor123" },
    { label: "Adm", role: "Admin", email: "admin@sihat.tcm", pass: "Admin123" },
    { label: "Dev", role: "Developer", email: "dev@sihat.tcm", pass: "Dev123" },
];

/**
 * FloatingLabelInput - Animated input field with floating label
 *
 * Features:
 * - Animated floating label on focus/value
 * - Glowing border animation when focused
 * - Password visibility toggle
 * - Shake animation on error
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Input label text
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Value change handler
 * @param {boolean} props.secureTextEntry - Enable password mode
 * @param {string} props.icon - Ionicons icon name
 * @param {string} props.keyboardType - Keyboard type
 * @param {string} props.autoCapitalize - Auto-capitalize mode
 * @param {Function} props.onFocus - Focus handler
 * @param {Function} props.onBlur - Blur handler
 * @param {boolean} props.hasError - Show error state
 */
export const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    secureTextEntry,
    icon,
    keyboardType,
    autoCapitalize,
    onFocus,
    onBlur,
    hasError,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const iconPulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: isFocused || value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    // Glowing border animation when focused
    useEffect(() => {
        if (isFocused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            ).start();

            // Icon pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(iconPulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(iconPulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            glowAnim.setValue(0);
            iconPulseAnim.setValue(1);
        }
    }, [isFocused]);

    // Shake animation for errors
    useEffect(() => {
        if (hasError) {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }, [hasError]);

    const labelStyle = {
        position: "absolute",
        left: 48,
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.textSecondary, COLORS.amberStart],
        }),
        fontWeight: isFocused ? "600" : "400",
    };

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.amberStart, COLORS.amberEnd],
    });

    const shadowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    const iconColor = isFocused ? COLORS.amberStart : COLORS.textSecondary;
    const isSecure = secureTextEntry && !showPassword;

    return (
        <Animated.View
            style={[
                styles.inputContainer,
                {
                    borderColor: isFocused ? borderColor : "transparent",
                    transform: [{ translateX: shakeAnim }],
                },
                isFocused && {
                    shadowColor: COLORS.amberStart,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: shadowOpacity,
                    shadowRadius: 10,
                    elevation: 5,
                },
            ]}
        >
            <Animated.View style={{ transform: [{ scale: iconPulseAnim }] }}>
                <Ionicons name={icon} size={20} color={iconColor} style={styles.inputIcon} />
            </Animated.View>
            <Animated.Text style={labelStyle}>{label}</Animated.Text>
            <TextInput
                style={[styles.input, secureTextEntry && { paddingRight: 40 }]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => {
                    setIsFocused(true);
                    if (onFocus) onFocus();
                }}
                onBlur={() => {
                    setIsFocused(false);
                    if (onBlur) onBlur();
                }}
                secureTextEntry={isSecure}
                placeholderTextColor="transparent"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                {...props}
            />
            {secureTextEntry && (
                <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => {
                        setShowPassword(!showPassword);
                        Haptics.selectionAsync();
                    }}
                >
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

/**
 * GlassCard - Glassmorphism card container
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} props.style - Additional styles
 */
export const GlassCard = ({ children, style }) => (
    <View style={[styles.glassCardContainer, style]}>
        <LinearGradient colors={[COLORS.glassBg, COLORS.glassBg]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.glassInner}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: "100%",
        color: COLORS.white,
        fontSize: 16,
        paddingTop: 16, // Space for floating label
    },
    passwordToggle: {
        position: "absolute",
        right: 12,
        padding: 8,
    },
    glassCardContainer: {
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        marginBottom: 30,
    },
    glassInner: {
        backgroundColor: COLORS.glassBg,
        padding: 24,
    },
});
