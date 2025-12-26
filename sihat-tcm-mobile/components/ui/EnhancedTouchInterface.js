import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanGestureHandler,
    State,
    Animated,
    Dimensions,
} from 'react-native';
import { PanGestureHandler as RNGHPanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced Touch Interface for Mobile Diagnosis Workflow
 * Provides gesture controls, haptic feedback, and touch optimizations
 */

// Swipe Gesture Handler Component
export const SwipeGestureHandler = ({ 
    children, 
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown,
    swipeThreshold = 50,
    velocityThreshold = 500,
    enabled = true,
    theme,
    isDark 
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const [isGesturing, setIsGesturing] = useState(false);

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
        if (!enabled) return;

        const { state, translationX, translationY, velocityX, velocityY } = event.nativeEvent;

        if (state === State.BEGAN) {
            setIsGesturing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (state === State.END) {
            setIsGesturing(false);
            
            // Determine swipe direction based on translation and velocity
            const absX = Math.abs(translationX);
            const absY = Math.abs(translationY);
            const absVelX = Math.abs(velocityX);
            const absVelY = Math.abs(velocityY);

            // Check if gesture meets threshold requirements
            const meetsDistanceThreshold = absX > swipeThreshold || absY > swipeThreshold;
            const meetsVelocityThreshold = absVelX > velocityThreshold || absVelY > velocityThreshold;

            if (meetsDistanceThreshold || meetsVelocityThreshold) {
                // Determine primary direction
                if (absX > absY) {
                    // Horizontal swipe
                    if (translationX > 0 && onSwipeRight) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSwipeRight();
                    } else if (translationX < 0 && onSwipeLeft) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSwipeLeft();
                    }
                } else {
                    // Vertical swipe
                    if (translationY > 0 && onSwipeDown) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSwipeDown();
                    } else if (translationY < 0 && onSwipeUp) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSwipeUp();
                    }
                }
            }

            // Reset animations
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    return (
        <RNGHPanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            enabled={enabled}
        >
            <Animated.View
                style={[
                    { flex: 1 },
                    {
                        transform: [
                            { translateX: translateX },
                            { translateY: translateY },
                        ],
                    },
                    isGesturing && { opacity: 0.8 }
                ]}
            >
                {children}
            </Animated.View>
        </RNGHPanGestureHandler>
    );
};

// Enhanced Touch Button with Haptic Feedback
export const HapticTouchButton = ({
    onPress,
    onLongPress,
    children,
    style,
    hapticType = 'medium',
    longPressDelay = 500,
    disabled = false,
    theme,
    isDark,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isPressed, setIsPressed] = useState(false);

    const getHapticType = () => {
        switch (hapticType) {
            case 'light': return Haptics.ImpactFeedbackStyle.Light;
            case 'heavy': return Haptics.ImpactFeedbackStyle.Heavy;
            default: return Haptics.ImpactFeedbackStyle.Medium;
        }
    };

    const handlePressIn = () => {
        if (disabled) return;
        
        setIsPressed(true);
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
        
        Haptics.impactAsync(getHapticType());
    };

    const handlePressOut = () => {
        setIsPressed(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(getHapticType());
        onPress && onPress();
    };

    const handleLongPress = () => {
        if (disabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLongPress && onLongPress();
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={longPressDelay}
            disabled={disabled}
            activeOpacity={0.8}
            {...props}
        >
            <Animated.View
                style={[
                    style,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                    disabled && { opacity: 0.5 }
                ]}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// Gesture Indicator Component
export const GestureIndicator = ({ 
    visible, 
    direction, 
    text, 
    theme, 
    isDark 
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getIconName = () => {
        switch (direction) {
            case 'left': return 'chevron-back';
            case 'right': return 'chevron-forward';
            case 'up': return 'chevron-up';
            case 'down': return 'chevron-down';
            default: return 'hand-left';
        }
    };

    const getTransform = () => {
        const slideValue = slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
        });

        switch (direction) {
            case 'left':
                return [{ translateX: slideValue }];
            case 'right':
                return [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }];
            case 'up':
                return [{ translateY: slideValue }];
            case 'down':
                return [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }];
            default:
                return [{ scale: slideAnim }];
        }
    };

    const styles = createGestureIndicatorStyles(theme, isDark);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: getTransform(),
                },
            ]}
            pointerEvents="none"
        >
            <View style={styles.indicator}>
                <Ionicons 
                    name={getIconName()} 
                    size={24} 
                    color={theme.accent.primary} 
                />
                {text && (
                    <Text style={styles.text}>{text}</Text>
                )}
            </View>
        </Animated.View>
    );
};

// Touch Feedback Overlay
export const TouchFeedbackOverlay = ({ 
    touches, 
    theme, 
    isDark 
}) => {
    const styles = createTouchFeedbackStyles(theme, isDark);

    return (
        <View style={styles.overlay} pointerEvents="none">
            {touches.map((touch, index) => (
                <TouchRipple
                    key={`${touch.id}-${index}`}
                    x={touch.x}
                    y={touch.y}
                    theme={theme}
                    isDark={isDark}
                />
            ))}
        </View>
    );
};

// Individual Touch Ripple Effect
const TouchRipple = ({ x, y, theme, isDark }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const styles = createTouchRippleStyles(theme, isDark);

    return (
        <Animated.View
            style={[
                styles.ripple,
                {
                    left: x - 25,
                    top: y - 25,
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                },
            ]}
        />
    );
};

// Styles
const createGestureIndicatorStyles = (theme, isDark) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -30,
        marginLeft: -60,
        zIndex: 1000,
    },
    indicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.accent.primary + '40',
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    text: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
});

const createTouchFeedbackStyles = (theme, isDark) => StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
});

const createTouchRippleStyles = (theme, isDark) => StyleSheet.create({
    ripple: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.accent.primary + '40',
        borderWidth: 2,
        borderColor: theme.accent.primary + '80',
    },
});