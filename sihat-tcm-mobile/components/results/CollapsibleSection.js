import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Collapsible Section Component
 * A glass-morphism styled collapsible section with animated expand/collapse
 */
export default function CollapsibleSection({
    title,
    icon,
    accentColor,
    children,
    defaultOpen = false,
    theme,
    styles,
    index,
    animValue
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const animatedHeight = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

    const toggleSection = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const toValue = isOpen ? 0 : 1;
        Animated.timing(animatedHeight, {
            toValue,
            duration: 250,
            useNativeDriver: false,
        }).start();
        setIsOpen(!isOpen);
    };

    const heightInterpolate = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1000], // Max height
    });

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    return (
        <Animated.View style={[
            styles.sectionCardContainer,
            { opacity: animValue, transform: [{ translateY }] }
        ]}>
            <BlurView intensity={30} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.glassBlur}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.glassGradient}
                >
                    <TouchableOpacity
                        style={[styles.sectionHeader, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}
                        onPress={toggleSection}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: `${accentColor}20` }]}>
                                <Ionicons name={icon} size={20} color={accentColor} />
                            </View>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                        <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.text.tertiary}
                        />
                    </TouchableOpacity>
                    <Animated.View style={[styles.sectionContent, { maxHeight: heightInterpolate, opacity: animatedHeight }]}>
                        {children}
                    </Animated.View>
                </LinearGradient>
            </BlurView>
        </Animated.View>
    );
}
