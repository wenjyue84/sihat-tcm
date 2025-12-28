/**
 * FloatingLabelInput Component
 * 
 * An animated text input with floating label, glow effects, and shake animation.
 * Features:
 * - Label floats up when focused or has value
 * - Glowing border animation when focused
 * - Icon pulse animation when focused
 * - Shake animation on error
 * - Password visibility toggle for secure fields
 * 
 * @param {Object} props
 * @param {string} props.label - Placeholder/label text
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Value change handler
 * @param {boolean} props.secureTextEntry - Password field toggle
 * @param {string} props.icon - Ionicons icon name
 * @param {string} props.keyboardType - Keyboard type
 * @param {string} props.autoCapitalize - Auto-capitalization behavior
 * @param {Function} props.onFocus - Focus handler
 * @param {Function} props.onBlur - Blur handler
 * @param {boolean} props.hasError - Shows shake animation when true
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AUTH_COLORS } from '../../constants/AuthColors';

export function FloatingLabelInput({
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
}) {
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
        position: 'absolute',
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
            outputRange: [AUTH_COLORS.textSecondary, AUTH_COLORS.amberStart],
        }),
        fontWeight: isFocused ? '600' : '400',
    };

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [AUTH_COLORS.amberStart, AUTH_COLORS.amberEnd],
    });

    const shadowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    const iconColor = isFocused ? AUTH_COLORS.amberStart : AUTH_COLORS.textSecondary;
    const isSecure = secureTextEntry && !showPassword;

    return (
        <Animated.View
            style={[
                styles.inputContainer,
                {
                    borderColor: isFocused ? borderColor : 'transparent',
                    transform: [{ translateX: shakeAnim }],
                },
                isFocused && {
                    shadowColor: AUTH_COLORS.amberStart,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: shadowOpacity,
                    shadowRadius: 10,
                    elevation: 5,
                }
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
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={AUTH_COLORS.textSecondary}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: AUTH_COLORS.inputBg,
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
        height: '100%',
        color: AUTH_COLORS.white,
        fontSize: 16,
        paddingTop: 16, // Space for floating label
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
});

export default FloatingLabelInput;
