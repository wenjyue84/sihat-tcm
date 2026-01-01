import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle, G } from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Chi Balance Circle Component
 * A concentric circle visualization showing Qi, Blood, Yin, Yang balance
 */
export default function ChiBalanceCircle({ theme, styles, animValue }) {
    const { t } = useLanguage();

    // Mock balance data (would be derived from reportData in reality)
    const elements = [
        { label: t.report?.chi?.qi || 'Qi (气)', value: 85, color: theme.accent.primary, icon: 'flash-outline' },
        { label: t.report?.chi?.blood || 'Blood (血)', value: 72, color: theme.semantic.error, icon: 'water-outline' },
        { label: t.report?.chi?.yin || 'Yin (阴)', value: 65, color: theme.accent.tertiary, icon: 'moon-outline' },
        { label: t.report?.chi?.yang || 'Yang (阳)', value: 78, color: theme.accent.secondary, icon: 'sunny-outline' },
    ];

    const size = 200;
    const strokeWidth = 12;
    const radius = (size - strokeWidth * 6) / 2;
    const center = size / 2;

    return (
        <View style={styles.chiContainer}>
            <View style={styles.svgWrapper}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {elements.map((el, i) => {
                        const r = radius + (i * (strokeWidth + 4));
                        const circum = 2 * Math.PI * r;
                        const progress = (el.value / 100) * circum;

                        return (
                            <G key={i} rotation="-90" origin={`${center}, ${center}`}>
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={r}
                                    stroke={el.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${progress}, ${circum}`}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    opacity={0.8}
                                />
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={r}
                                    stroke={el.color}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    opacity={0.1}
                                />
                            </G>
                        );
                    })}
                </Svg>
                <View style={[styles.chiCenterBox, { borderColor: theme.accent.primary }]}>
                    <Text style={styles.chiCenterPercent}>75%</Text>
                    <Text style={styles.chiCenterLabel}>{t.report?.chi?.balance || 'Balance'}</Text>
                </View>
            </View>
            <View style={styles.chiLegend}>
                {elements.map((el, i) => (
                    <View key={i} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: el.color }]} />
                        <Text style={styles.legendText}>{el.label}</Text>
                        <Text style={styles.legendValue}>{el.value}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
