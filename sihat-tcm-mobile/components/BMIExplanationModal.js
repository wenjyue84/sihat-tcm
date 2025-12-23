import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * BMI Explanation Modal
 * 
 * Displays a detailed breakdown of the user's BMI with:
 * - Large color-coded BMI value
 * - Animated visual scale bar with position indicator
 * - Formula explanation
 * - Category legend (Underweight, Normal, Overweight, Obese)
 */
export default function BMIExplanationModal({ visible, onClose, bmi, height, weight, theme, isDark }) {
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    // Animation for the BMI indicator position
    const indicatorAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Calculate indicator position (scale: 15 to 35 BMI)
    const minScale = 15;
    const maxScale = 35;
    const percentage = Math.min(Math.max(((bmi - minScale) / (maxScale - minScale)) * 100, 0), 100);

    // Get BMI category with colors
    const getBMICategory = (value) => {
        const categories = t.basicInfo?.bmiExplanation || {};
        if (value < 18.5) {
            return {
                label: categories.underweight || 'Underweight',
                color: '#3b82f6',
                bgColor: '#eff6ff',
                icon: 'arrow-down-outline',
            };
        }
        if (value < 25) {
            return {
                label: categories.normal || 'Normal',
                color: '#10b981',
                bgColor: '#ecfdf5',
                icon: 'checkmark-circle-outline',
            };
        }
        if (value < 30) {
            return {
                label: categories.overweight || 'Overweight',
                color: '#f59e0b',
                bgColor: '#fffbeb',
                icon: 'warning-outline',
            };
        }
        return {
            label: categories.obese || 'Obese',
            color: '#ef4444',
            bgColor: '#fef2f2',
            icon: 'alert-circle-outline',
        };
    };

    const category = getBMICategory(bmi);

    // Animate on modal open
    useEffect(() => {
        if (visible) {
            // Trigger haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Reset and animate
            indicatorAnim.setValue(0);
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(indicatorAnim, {
                    toValue: percentage,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: false,
                    delay: 200,
                }),
            ]).start();
        }
    }, [visible, percentage]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const translations = t.basicInfo?.bmiExplanation || {};
    const heightInMeters = (height / 100).toFixed(2);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <Animated.View
                            style={[
                                styles.modalContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <BlurView
                                intensity={isDark ? 40 : 60}
                                tint={isDark ? 'dark' : 'light'}
                                style={styles.blurContainer}
                            >
                                {/* Header */}
                                <View style={styles.header}>
                                    <View style={styles.headerTitleRow}>
                                        <View style={[styles.iconContainer, { backgroundColor: theme.accent.primary + '20' }]}>
                                            <Ionicons name="calculator-outline" size={22} color={theme.accent.primary} />
                                        </View>
                                        <Text style={styles.title}>
                                            {translations.title || 'Your BMI'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color={theme.text.secondary} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.description}>
                                    {translations.description || 'Body Mass Index is a measure of body fat based on height and weight.'}
                                </Text>

                                {/* BMI Value Display */}
                                <View style={styles.bmiValueCard}>
                                    <Text style={styles.bmiLabel}>
                                        {translations.yourBmi || 'Your BMI'}
                                    </Text>
                                    <Text style={[styles.bmiValue, { color: category.color }]}>
                                        {bmi.toFixed(1)}
                                    </Text>
                                    <View style={[styles.categoryBadge, { backgroundColor: category.bgColor }]}>
                                        <Ionicons name={category.icon} size={16} color={category.color} />
                                        <Text style={[styles.categoryText, { color: category.color }]}>
                                            {category.label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Visual Scale Bar */}
                                <View style={styles.scaleContainer}>
                                    <View style={styles.scaleBar}>
                                        {/* Underweight segment */}
                                        <View style={[styles.scaleSegment, styles.underweightSegment]} />
                                        {/* Normal segment */}
                                        <View style={[styles.scaleSegment, styles.normalSegment, { flex: 1.5 }]} />
                                        {/* Overweight segment */}
                                        <View style={[styles.scaleSegment, styles.overweightSegment]} />
                                        {/* Obese segment */}
                                        <View style={[styles.scaleSegment, styles.obeseSegment, { borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />

                                        {/* Animated Indicator */}
                                        <Animated.View
                                            style={[
                                                styles.indicator,
                                                {
                                                    left: indicatorAnim.interpolate({
                                                        inputRange: [0, 100],
                                                        outputRange: ['0%', '100%'],
                                                    }),
                                                },
                                            ]}
                                        />
                                    </View>

                                    {/* Scale Labels */}
                                    <View style={styles.scaleLabels}>
                                        <Text style={styles.scaleLabel}>15</Text>
                                        <Text style={styles.scaleLabel}>18.5</Text>
                                        <Text style={styles.scaleLabel}>25</Text>
                                        <Text style={styles.scaleLabel}>30</Text>
                                        <Text style={styles.scaleLabel}>35+</Text>
                                    </View>
                                </View>

                                {/* Formula Explanation */}
                                <View style={styles.formulaCard}>
                                    <View style={styles.formulaHeader}>
                                        <Ionicons name="information-circle-outline" size={18} color={theme.accent.primary} />
                                        <Text style={styles.formulaTitle}>
                                            {translations.howItIsCalculated || 'How is it calculated?'}
                                        </Text>
                                    </View>
                                    <View style={styles.formulaContent}>
                                        <View style={styles.formulaFraction}>
                                            <Text style={styles.formulaNumerator}>{weight} kg</Text>
                                            <View style={styles.formulaDivider} />
                                            <Text style={styles.formulaDenominator}>({heightInMeters} m)²</Text>
                                        </View>
                                        <Text style={styles.formulaEquals}>=</Text>
                                        <Text style={[styles.formulaResult, { color: category.color }]}>
                                            {bmi.toFixed(1)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Categories Legend */}
                                <View style={styles.legendGrid}>
                                    <View style={[styles.legendItem, { backgroundColor: '#eff6ff' }]}>
                                        <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                                        <View style={styles.legendTextContainer}>
                                            <Text style={[styles.legendLabel, { color: '#1e40af' }]}>
                                                {translations.underweight || 'Underweight'}
                                            </Text>
                                            <Text style={[styles.legendRange, { color: '#3b82f6' }]}>
                                                {'< 18.5'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.legendItem, { backgroundColor: '#ecfdf5' }]}>
                                        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                                        <View style={styles.legendTextContainer}>
                                            <Text style={[styles.legendLabel, { color: '#065f46' }]}>
                                                {translations.normal || 'Normal'}
                                            </Text>
                                            <Text style={[styles.legendRange, { color: '#10b981' }]}>
                                                18.5 - 24.9
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.legendItem, { backgroundColor: '#fffbeb' }]}>
                                        <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                                        <View style={styles.legendTextContainer}>
                                            <Text style={[styles.legendLabel, { color: '#92400e' }]}>
                                                {translations.overweight || 'Overweight'}
                                            </Text>
                                            <Text style={[styles.legendRange, { color: '#f59e0b' }]}>
                                                25 - 29.9
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.legendItem, { backgroundColor: '#fef2f2' }]}>
                                        <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                                        <View style={styles.legendTextContainer}>
                                            <Text style={[styles.legendLabel, { color: '#991b1b' }]}>
                                                {translations.obese || 'Obese'}
                                            </Text>
                                            <Text style={[styles.legendRange, { color: '#ef4444' }]}>
                                                {'≥ 30'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </BlurView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: SCREEN_WIDTH - 40,
        maxWidth: 400,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    blurContainer: {
        padding: 24,
        backgroundColor: isDark ? 'rgba(30, 30, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    closeButton: {
        padding: 8,
        marginRight: -8,
    },
    description: {
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    bmiValueCard: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    bmiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    bmiValue: {
        fontSize: 56,
        fontWeight: 'bold',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scaleContainer: {
        marginBottom: 20,
    },
    scaleBar: {
        height: 16,
        borderRadius: 8,
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    scaleSegment: {
        flex: 1,
    },
    underweightSegment: {
        backgroundColor: '#93c5fd',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    normalSegment: {
        backgroundColor: '#6ee7b7',
    },
    overweightSegment: {
        backgroundColor: '#fcd34d',
    },
    obeseSegment: {
        backgroundColor: '#fca5a5',
    },
    indicator: {
        position: 'absolute',
        top: -4,
        bottom: -4,
        width: 4,
        backgroundColor: theme.text.primary,
        borderRadius: 2,
        marginLeft: -2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 2,
    },
    scaleLabel: {
        fontSize: 11,
        color: theme.text.tertiary,
        fontWeight: '500',
    },
    formulaCard: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
    },
    formulaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    formulaTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    formulaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 16,
    },
    formulaFraction: {
        alignItems: 'center',
    },
    formulaNumerator: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 4,
    },
    formulaDivider: {
        width: 80,
        height: 2,
        backgroundColor: theme.text.tertiary,
        marginVertical: 4,
    },
    formulaDenominator: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
        marginTop: 4,
    },
    formulaEquals: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.accent.primary,
    },
    formulaResult: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    legendItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    legendRange: {
        fontSize: 11,
        marginTop: 2,
    },
});
