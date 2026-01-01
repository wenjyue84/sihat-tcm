import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

/**
 * Result Card Component (non-collapsible)
 * A glass-morphism styled card for displaying result sections
 */
export default function ResultCard({
    title,
    icon,
    children,
    accentColor,
    highlight = false,
    theme,
    styles,
    index,
    animValue
}) {
    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    return (
        <Animated.View style={[
            styles.resultCardContainer,
            { opacity: animValue, transform: [{ translateY }] }
        ]}>
            <BlurView intensity={highlight ? 45 : 30} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.glassBlur}>
                <LinearGradient
                    colors={highlight ?
                        [theme.mode === 'dark' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)', 'rgba(5,150,105,0.05)'] :
                        ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                    style={styles.glassGradient}
                >
                    <View style={[styles.resultCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconContainer, { backgroundColor: `${accentColor}20` }]}>
                                <Ionicons name={icon} size={20} color={accentColor} />
                            </View>
                            <Text style={styles.cardTitle}>{title}</Text>
                        </View>
                        <View style={styles.cardContent}>{children}</View>
                    </View>
                </LinearGradient>
            </BlurView>
        </Animated.View>
    );
}
