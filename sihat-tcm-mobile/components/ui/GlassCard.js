/**
 * GlassCard Component
 * 
 * A reusable glassmorphism card with gradient background.
 * Used in authentication screens and other premium UI elements.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} props.style - Additional styles to apply
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_COLORS } from '../../constants/AuthColors';

export function GlassCard({ children, style }) {
    return (
        <View style={[styles.glassCardContainer, style]}>
            <LinearGradient
                colors={[AUTH_COLORS.glassBg, AUTH_COLORS.glassBg]}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Explicitly fallback for Android stability */}
            {/* <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} /> */}
            <View style={styles.glassInner}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    glassCardContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: AUTH_COLORS.glassBorder,
        marginBottom: 30,
    },
    glassInner: {
        backgroundColor: AUTH_COLORS.glassBg,
        padding: 24,
    },
});

export default GlassCard;
