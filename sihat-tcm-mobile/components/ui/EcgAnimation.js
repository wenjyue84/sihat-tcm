import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Medically-accurate PQRST waveform path - Hospital-grade ECG
// Path width: 100 units = 1 cardiac cycle, baseline at y=50
const ECG_PATH = `
M 0,50
L 10,50
C 13,50 15,47 18,43
C 21,39 23,39 25,43
C 27,47 29,50 32,50
L 38,50
L 40,53
L 42,15
L 44,80
L 46,8
L 48,50
L 55,50
C 60,50 63,44 68,38
C 73,32 76,32 80,38
C 84,44 87,50 92,50
L 100,50
`.trim().replace(/\n/g, ' ');

const PATH_WIDTH = 100;

export default function EcgAnimation({
    bpm = null,
    isActive = true,
    height = 80,
    lineColor = null,
    style = {}
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const pulseOpacity = useRef(new Animated.Value(1)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;

    // Duration for one complete cardiac cycle based on BPM
    const cycleDuration = bpm && bpm > 0 ? (60 / bpm) * 1000 : 1000;

    // Hospital ECG green (phosphor color) - Match Web exactly
    const color = lineColor || '#00ff41';

    // Status indicator color based on BPM
    const statusColor = (!bpm) ? '#00ff41' : (bpm < 60 ? '#3b82f6' : (bpm > 100 ? '#ef4444' : '#00ff41'));

    // Generate waveforms - 6 waves to fill screen width
    const waveCount = 6;
    const pathOffsets = useMemo(() => {
        return Array.from({ length: waveCount }, (_, i) => i * PATH_WIDTH);
    }, []);

    useEffect(() => {
        if (isActive && bpm && bpm > 0) {
            translateX.setValue(0);

            const scrollAnim = Animated.loop(
                Animated.timing(translateX, {
                    toValue: -PATH_WIDTH,
                    duration: cycleDuration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );

            // Pulse indicator animation
            const pulseAnim = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseOpacity, { toValue: 0.3, duration: cycleDuration * 0.1, useNativeDriver: true }),
                        Animated.timing(pulseScale, { toValue: 1.3, duration: cycleDuration * 0.1, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseOpacity, { toValue: 1, duration: cycleDuration * 0.9, useNativeDriver: true }),
                        Animated.timing(pulseScale, { toValue: 1, duration: cycleDuration * 0.9, useNativeDriver: true }),
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
        }
    }, [bpm, isActive, cycleDuration]);

    if (!isActive || !bpm || bpm <= 0) {
        return (
            <View style={[styles.container, { height }, style]}>
                {/* Background Grid */}
                <View style={styles.gridBackground}>
                    <Svg height="100%" width="100%" style={styles.absolute}>
                        <Defs>
                            <SvgLinearGradient id="gridGradH" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#0d2810" stopOpacity="0.8" />
                                <Stop offset="1" stopColor="#0d2810" stopOpacity="0.8" />
                            </SvgLinearGradient>
                        </Defs>
                        {/* Render Grid Lines manually for crispness */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Line key={`h${i}`} x1="0" y1={i * 20 + "%"} x2="100%" y2={i * 20 + "%"} stroke="#0d2810" strokeWidth="1" />
                        ))}
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Line key={`v${i}`} x1={i * 10 + "%"} y1="0" x2={i * 10 + "%"} y2="100%" stroke="#0d2810" strokeWidth="1" />
                        ))}
                    </Svg>
                </View>
                <Svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                    <Line x1="0" y1="50" x2="200" y2="50" stroke={color} strokeWidth="2" opacity={0.3} />
                </Svg>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.absolute}
                    pointerEvents="none"
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }, style]}>
            {/* Hospital ECG Paper Grid Background - SVG for sharpness */}
            <View style={styles.gridBackground}>
                <Svg height="100%" width="100%" style={styles.absolute}>
                    {/* Major Grid Lines (Dark Green) */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Line key={`h${i}`} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="#0d2810" strokeWidth="1.5" />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Line key={`v${i}`} x1={`${i * 12.5}%`} y1="0" x2={`${i * 12.5}%`} y2="100%" stroke="#0d2810" strokeWidth="1.5" />
                    ))}
                    {/* Minor Grid Lines (More subtle) */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Line key={`hm${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#091a09" strokeWidth="0.5" />
                    ))}
                </Svg>
            </View>

            {/* Animated ECG Waveform */}
            <Animated.View
                style={[
                    styles.svgContainer,
                    { transform: [{ translateX: translateX }] }
                ]}
            >
                <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 200 100"
                    preserveAspectRatio="none"
                >
                    <Defs>
                        {/* Gradient for fading edges */}
                        <SvgLinearGradient id="ecgFadeMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor={color} stopOpacity="0" />
                            <Stop offset="5%" stopColor={color} stopOpacity="1" />
                            <Stop offset="95%" stopColor={color} stopOpacity="1" />
                            <Stop offset="100%" stopColor={color} stopOpacity="0" />
                        </SvgLinearGradient>
                    </Defs>

                    {/* GLOW SIMULATION: Layer multiple transparent paths */}

                    {/* 1. Outer Bloom (Wide, very transparent) */}
                    <G>
                        {pathOffsets.map((offset, index) => (
                            <Path
                                key={`glow1-${index}`}
                                d={ECG_PATH}
                                fill="none"
                                stroke={color}
                                strokeWidth="8"
                                strokeOpacity="0.15"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={`translate(${offset}, 0)`}
                            />
                        ))}
                    </G>

                    {/* 2. Inner Bloom (Medium, semi-transparent) */}
                    <G>
                        {pathOffsets.map((offset, index) => (
                            <Path
                                key={`glow2-${index}`}
                                d={ECG_PATH}
                                fill="none"
                                stroke={color}
                                strokeWidth="4"
                                strokeOpacity="0.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={`translate(${offset}, 0)`}
                            />
                        ))}
                    </G>

                    {/* 3. Core Line (Sharp, bright) */}
                    <G>
                        {pathOffsets.map((offset, index) => (
                            <Path
                                key={`core-${index}`}
                                d={ECG_PATH}
                                fill="none"
                                stroke={`url(#ecgFadeMobile)`}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={`translate(${offset}, 0)`}
                            />
                        ))}
                    </G>
                </Svg>
            </Animated.View>

            {/* BPM Display - Hospital monitor style */}
            <View style={styles.bpmDisplay}>
                <Animated.View
                    style={[
                        styles.bpmIndicator,
                        {
                            backgroundColor: statusColor,
                            opacity: pulseOpacity,
                            transform: [{ scale: pulseScale }],
                        }
                    ]}
                />
                <Text style={[styles.bpmText, { color: statusColor }]}>
                    {bpm}
                </Text>
            </View>

            {/* Vignette overlay for monitor effect - Darker corners */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.absolute}
                pointerEvents="none"
            />
            {/* Top/Bottom vignette */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.3)']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.absolute}
                pointerEvents="none"
            />

            {/* CRT scanlines pattern */}
            <View style={styles.scanlines} pointerEvents="none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <View key={i} style={styles.scanLineRow} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    absolute: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    gridBackground: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    svgContainer: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: '300%', // Wide container for waves
    },
    bpmDisplay: {
        position: 'absolute',
        top: 8,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
    },
    bpmIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    bpmText: {
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    vignette: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'transparent',
    },
    scanlines: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'space-between',
        opacity: 0.1,
    },
    scanLineRow: {
        height: 1,
        backgroundColor: '#000',
        width: '100%',
    }
});
