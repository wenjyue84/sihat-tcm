import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

/**
 * AuroraBackground - A premium, slow-moving glow effect for "Emerald Glassmorphism"
 * Creates a deep Emerald-to-Midnight atmosphere with drifting light pockets.
 */
export const AuroraBackground = ({ isDark, theme }) => {
    // Animation drivers for drifting blobs
    const blob1Pos = useRef(new Animated.ValueXY({ x: -100, y: -100 })).current;
    const blob2Pos = useRef(new Animated.ValueXY({ x: width + 100, y: height / 2 })).current;
    const blob3Pos = useRef(new Animated.ValueXY({ x: width / 2, y: height + 100 })).current;

    const createDriftAnimation = (value, targetX, targetY, duration) => {
        return Animated.loop(
            Animated.sequence([
                Animated.timing(value, {
                    toValue: { x: targetX, y: targetY },
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(value, {
                    toValue: { x: value.x._value, y: value.y._value },
                    duration,
                    useNativeDriver: true,
                }),
            ])
        );
    };

    useEffect(() => {
        const animations = [
            createDriftAnimation(blob1Pos, width / 2, height / 3, 15000),
            createDriftAnimation(blob2Pos, -50, height * 0.8, 18000),
            createDriftAnimation(blob3Pos, width * 0.7, -100, 20000),
        ];

        animations.forEach(anim => anim.start());
        return () => animations.forEach(anim => anim.stop());
    }, []);

    const colors = isDark
        ? ['#022c22', '#064e3b', '#000000'] // Emerald Deep to Midnight
        : ['#ecfdf5', '#d1fae5', '#f8fafc'];

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />

            {/* Drifting Chi Blobs */}
            <Animated.View style={[
                styles.blob,
                {
                    backgroundColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(12,148,110,0.15)',
                    transform: blob1Pos.getTranslateTransform()
                }
            ]} />
            <Animated.View style={[
                styles.blob,
                {
                    backgroundColor: isDark ? 'rgba(251,191,36,0.2)' : 'rgba(217,119,6,0.1)',
                    transform: blob2Pos.getTranslateTransform(),
                    width: 400,
                    height: 400,
                }
            ]} />
            <Animated.View style={[
                styles.blob,
                {
                    backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.1)',
                    transform: blob3Pos.getTranslateTransform()
                }
            ]} />

            {/* Global Blur to soften the blobs into actual 'Glows' - iOS only for stability */}
            {Platform.OS === 'ios' && (
                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        // filter: 'blur(80px)', // Note: standard RN doesn't support filter, but expo-blur/skia does. 
        // We'll use large opacity/blur via props if available, or just large soft shapes.
        opacity: 0.5,
    }
});
