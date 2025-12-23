import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ECG waveform path - realistic PQRST wave pattern
const ECG_PATH = "M 0,50 L 8,50 L 10,48 L 12,50 L 14,50 L 16,50 L 18,55 L 19,20 L 20,85 L 21,5 L 22,50 L 24,50 L 26,45 L 30,50 L 35,50";
const PATH_WIDTH = 35; // Width of each ECG segment

/**
 * EcgAnimation - Animated ECG/心电图 component
 * @param {number|null} bpm - Current heart rate in BPM
 * @param {boolean} isActive - Whether the animation is active
 * @param {number} height - Height of the component
 * @param {string} lineColor - Override line color
 * @param {object} style - Additional styles
 */
export default function EcgAnimation({
    bpm = null,
    isActive = true,
    height = 60,
    lineColor = null,
    style = {}
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(1)).current;

    // Calculate animation duration based on BPM - REALISTIC TIMING
    // At 60 BPM: 1 beat per second, animation takes ~4 seconds
    // At 120 BPM: 2 beats per second, animation takes ~2 seconds
    const getAnimationDuration = (bpmValue) => {
        if (!bpmValue || bpmValue <= 0) return 4000; // Default slow (ms)

        const beatDuration = 60 / bpmValue; // seconds per beat
        return beatDuration * 4 * 1000; // Show about 4 heartbeats worth in ms
    };

    // Dynamic color based on BPM range
    const getLineColor = (bpmValue) => {
        if (lineColor) return lineColor;
        if (!bpmValue) return '#10b981'; // emerald-500 default
        if (bpmValue < 60) return '#3b82f6'; // blue-500 for bradycardia
        if (bpmValue > 100) return '#ef4444'; // red-500 for tachycardia
        return '#10b981'; // emerald-500 for normal
    };

    const color = getLineColor(bpm);
    const animationDuration = getAnimationDuration(bpm);

    // Pulse duration matches actual heart rate
    const pulseDuration = bpm && bpm > 0 ? (60 / bpm) * 1000 : 1000; // ms per beat

    // Number of paths for seamless scrolling
    const pathCount = 16;
    const totalWidth = PATH_WIDTH * pathCount;

    useEffect(() => {
        if (isActive && bpm && bpm > 0) {
            // Reset animation
            translateX.setValue(totalWidth);

            // Create the scrolling animation
            const scrollAnim = Animated.loop(
                Animated.timing(translateX, {
                    toValue: -totalWidth,
                    duration: animationDuration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );

            // Create the pulse animation (dot beats with heart rate)
            const pulseAnim = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseScale, {
                            toValue: 1.8,
                            duration: pulseDuration * 0.15,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseOpacity, {
                            toValue: 0.6,
                            duration: pulseDuration * 0.15,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseScale, {
                            toValue: 1,
                            duration: pulseDuration * 0.85,
                            easing: Easing.in(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseOpacity, {
                            toValue: 1,
                            duration: pulseDuration * 0.85,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );

            scrollAnim.start();
            pulseAnim.start();

            return () => {
                scrollAnim.stop();
                pulseAnim.stop();
            };
        } else {
            translateX.setValue(0);
            pulseScale.setValue(1);
            pulseOpacity.setValue(1);
        }
    }, [bpm, isActive, animationDuration, pulseDuration, totalWidth]);

    // Generate path offsets for multiple waves
    const pathOffsets = useMemo(() => {
        return Array.from({ length: pathCount }, (_, i) => i * PATH_WIDTH);
    }, []);

    // Inactive state - flat line
    if (!isActive || !bpm || bpm <= 0) {
        return (
            <View style={[styles.container, { height }, style]}>
                <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 200 100"
                    preserveAspectRatio="none"
                >
                    <Line
                        x1="0"
                        y1="50"
                        x2="200"
                        y2="50"
                        stroke="#d1d5db"
                        strokeWidth="2"
                        opacity={0.3}
                    />
                </Svg>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }, style]}>
            {/* Background grid effect */}
            <View style={styles.gridContainer}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <View
                        key={`h-${i}`}
                        style={[
                            styles.gridLineHorizontal,
                            { top: `${(i + 1) * 20}%`, backgroundColor: color + '15' }
                        ]}
                    />
                ))}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <View
                        key={`v-${i}`}
                        style={[
                            styles.gridLineVertical,
                            { left: `${(i + 1) * 10}%`, backgroundColor: color + '15' }
                        ]}
                    />
                ))}
            </View>

            {/* Animated ECG Wave */}
            <Animated.View
                style={[
                    styles.svgContainer,
                    {
                        transform: [{
                            translateX: translateX.interpolate({
                                inputRange: [-totalWidth, totalWidth],
                                outputRange: [-totalWidth * 1.5, totalWidth * 1.5],
                            })
                        }]
                    }
                ]}
            >
                <Svg
                    width={totalWidth * 3}
                    height="100%"
                    viewBox={`0 0 ${totalWidth * 1.5} 100`}
                    preserveAspectRatio="none"
                >
                    <Defs>
                        <LinearGradient id="ecgGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <Stop offset="20%" stopColor={color} stopOpacity="1" />
                            <Stop offset="80%" stopColor={color} stopOpacity="1" />
                            <Stop offset="100%" stopColor={color} stopOpacity="0.2" />
                        </LinearGradient>
                    </Defs>

                    {pathOffsets.map((offset, index) => (
                        <Path
                            key={index}
                            d={ECG_PATH}
                            fill="none"
                            stroke={color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            transform={`translate(${offset}, 0)`}
                        />
                    ))}
                </Svg>
            </Animated.View>

            {/* Pulsing indicator dot - beats with actual heart rate */}
            <Animated.View
                style={[
                    styles.pulseDot,
                    {
                        backgroundColor: color,
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                        shadowColor: color,
                    }
                ]}
            />

            {/* Scan line effect */}
            <View style={[styles.scanLine, { backgroundColor: color }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    svgContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
    },
    pulseDot: {
        position: 'absolute',
        right: 12,
        top: '50%',
        marginTop: -6,
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
    },
    scanLine: {
        position: 'absolute',
        right: 28,
        top: 0,
        bottom: 0,
        width: 2,
        opacity: 0.3,
    },
});
