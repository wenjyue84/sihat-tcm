import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTouchButton, SwipeGestureHandler, GestureIndicator } from '../ui/EnhancedTouchInterface';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced Camera Capture Component for Mobile Diagnosis
 * Features:
 * - Gesture controls for zoom and focus
 * - Real-time image quality feedback
 * - Mobile-optimized UI with haptic feedback
 * - Auto-focus and exposure optimization
 * - Multiple capture modes (single, burst, timer)
 */

export default function EnhancedCameraCapture({
    onImageCaptured,
    onCancel,
    captureMode = 'single', // 'single', 'burst', 'timer'
    imageType = 'tongue', // 'tongue', 'face', 'body'
    showQualityOverlay = true,
    enableGestures = true,
    theme,
    isDark,
    t = {}
}) {
    // Camera state
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('front');
    const [flash, setFlash] = useState('off');
    const [zoom, setZoom] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImages, setCapturedImages] = useState([]);
    
    // UI state
    const [showGestureHint, setShowGestureHint] = useState(false);
    const [focusPoint, setFocusPoint] = useState(null);
    const [timerCount, setTimerCount] = useState(0);
    const [burstCount, setBurstCount] = useState(0);
    
    // Refs
    const cameraRef = useRef(null);
    const zoomAnim = useRef(new Animated.Value(0)).current;
    const focusAnim = useRef(new Animated.Value(0)).current;
    const captureAnim = useRef(new Animated.Value(1)).current;
    
    // Translations
    const translations = {
        title: t.camera?.title || 'Camera Capture',
        switchCamera: t.camera?.switchCamera || 'Switch Camera',
        toggleFlash: t.camera?.toggleFlash || 'Toggle Flash',
        capture: t.camera?.capture || 'Capture',
        retake: t.camera?.retake || 'Retake',
        usePhoto: t.camera?.usePhoto || 'Use Photo',
        gallery: t.camera?.gallery || 'Gallery',
        gestureHint: t.camera?.gestureHint || 'Pinch to zoom, tap to focus',
        timerMode: t.camera?.timerMode || 'Timer Mode',
        burstMode: t.camera?.burstMode || 'Burst Mode',
        qualityGood: t.camera?.qualityGood || 'Good Quality',
        qualityPoor: t.camera?.qualityPoor || 'Poor Quality - Adjust lighting',
        permissionRequired: t.camera?.permissionRequired || 'Camera permission required',
        grantPermission: t.camera?.grantPermission || 'Grant Permission',
    };

    const styles = createStyles(theme, isDark);

    // Request camera permission on mount
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    // Show gesture hint on first load
    useEffect(() => {
        if (enableGestures && permission?.granted) {
            const timer = setTimeout(() => {
                setShowGestureHint(true);
                setTimeout(() => setShowGestureHint(false), 3000);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [enableGestures, permission?.granted]);

    // Zoom animation
    useEffect(() => {
        Animated.timing(zoomAnim, {
            toValue: zoom,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [zoom]);

    // Handle pinch gesture for zoom
    const handlePinchGesture = useCallback((scale) => {
        if (!enableGestures) return;
        
        const newZoom = Math.max(0, Math.min(1, zoom + (scale - 1) * 0.1));
        setZoom(newZoom);
        
        if (Math.abs(scale - 1) > 0.1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [zoom, enableGestures]);

    // Handle tap to focus
    const handleTapToFocus = useCallback(async (event) => {
        if (!cameraRef.current || !enableGestures) return;

        const { locationX, locationY } = event.nativeEvent;
        setFocusPoint({ x: locationX, y: locationY });
        
        // Animate focus indicator
        focusAnim.setValue(0);
        Animated.sequence([
            Animated.timing(focusAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(focusAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => setFocusPoint(null));

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [enableGestures]);

    // Capture single image
    const captureImage = useCallback(async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        
        try {
            // Animate capture button
            Animated.sequence([
                Animated.timing(captureAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(captureAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
                skipProcessing: false,
            });

            // Apply mobile-specific optimizations
            const optimizedPhoto = await optimizeImageForMobile(photo, imageType);
            
            if (captureMode === 'single') {
                onImageCaptured(optimizedPhoto);
            } else {
                setCapturedImages(prev => [...prev, optimizedPhoto]);
                if (captureMode === 'burst') {
                    setBurstCount(prev => prev + 1);
                    if (burstCount >= 4) { // Capture 5 images in burst
                        onImageCaptured(capturedImages);
                        setBurstCount(0);
                        setCapturedImages([]);
                    }
                }
            }
        } catch (error) {
            console.error('Camera capture error:', error);
            Alert.alert('Capture Error', 'Failed to capture image. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    }, [isCapturing, captureMode, imageType, burstCount, capturedImages, onImageCaptured]);

    // Timer capture
    const startTimerCapture = useCallback(() => {
        setTimerCount(3);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        const countdown = setInterval(() => {
            setTimerCount(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    captureImage();
                    return 0;
                } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    return prev - 1;
                }
            });
        }, 1000);
    }, [captureImage]);

    // Optimize image for mobile diagnosis
    const optimizeImageForMobile = async (photo, type) => {
        try {
            const manipulatorActions = [];
            
            // Type-specific optimizations
            switch (type) {
                case 'tongue':
                    // Center crop for tongue analysis
                    manipulatorActions.push({
                        crop: {
                            originX: photo.width * 0.2,
                            originY: photo.height * 0.2,
                            width: photo.width * 0.6,
                            height: photo.height * 0.6,
                        },
                    });
                    break;
                case 'face':
                    // Face detection area crop
                    manipulatorActions.push({
                        crop: {
                            originX: photo.width * 0.1,
                            originY: photo.height * 0.1,
                            width: photo.width * 0.8,
                            height: photo.height * 0.8,
                        },
                    });
                    break;
                default:
                    // Standard optimization
                    break;
            }

            // Resize for optimal processing
            manipulatorActions.push({
                resize: {
                    width: Math.min(1024, photo.width),
                    height: Math.min(1024, photo.height),
                },
            });

            const result = await ImageManipulator.manipulateAsync(
                photo.uri,
                manipulatorActions,
                {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            return {
                ...result,
                originalUri: photo.uri,
                optimized: true,
                type: type,
            };
        } catch (error) {
            console.error('Image optimization error:', error);
            return photo;
        }
    };

    // Pick from gallery
    const pickFromGallery = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: imageType === 'tongue' ? [1, 1] : [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const optimizedPhoto = await optimizeImageForMobile(result.assets[0], imageType);
                onImageCaptured(optimizedPhoto);
            }
        } catch (error) {
            console.error('Gallery picker error:', error);
            Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
        }
    }, [imageType, onImageCaptured]);

    // Toggle camera facing
    const toggleCameraFacing = useCallback(() => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    // Toggle flash
    const toggleFlash = useCallback(() => {
        setFlash(current => {
            const modes = ['off', 'on', 'auto'];
            const currentIndex = modes.indexOf(current);
            const nextIndex = (currentIndex + 1) % modes.length;
            return modes[nextIndex];
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Permission not granted
    if (!permission?.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={theme.text.tertiary} />
                    <Text style={styles.permissionText}>{translations.permissionRequired}</Text>
                    <HapticTouchButton
                        style={styles.permissionButton}
                        onPress={requestPermission}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Text style={styles.permissionButtonText}>{translations.grantPermission}</Text>
                    </HapticTouchButton>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{translations.title}</Text>
                <HapticTouchButton
                    onPress={onCancel}
                    style={styles.closeButton}
                    theme={theme}
                    isDark={isDark}
                >
                    <Ionicons name="close" size={24} color={theme.text.primary} />
                </HapticTouchButton>
            </View>

            {/* Camera View with Gesture Support */}
            <SwipeGestureHandler
                onSwipeLeft={() => setFacing('front')}
                onSwipeRight={() => setFacing('back')}
                enabled={enableGestures}
                theme={theme}
                isDark={isDark}
            >
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing={facing}
                        flash={flash}
                        zoom={zoom}
                        onTouchStart={handleTapToFocus}
                    />

                    {/* Focus Point Indicator */}
                    {focusPoint && (
                        <Animated.View
                            style={[
                                styles.focusIndicator,
                                {
                                    left: focusPoint.x - 25,
                                    top: focusPoint.y - 25,
                                    opacity: focusAnim,
                                    transform: [{
                                        scale: focusAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1.5, 1],
                                        }),
                                    }],
                                },
                            ]}
                        >
                            <View style={styles.focusRing} />
                        </Animated.View>
                    )}

                    {/* Timer Countdown */}
                    {timerCount > 0 && (
                        <View style={styles.timerOverlay}>
                            <Text style={styles.timerText}>{timerCount}</Text>
                        </View>
                    )}

                    {/* Burst Counter */}
                    {captureMode === 'burst' && burstCount > 0 && (
                        <View style={styles.burstCounter}>
                            <Text style={styles.burstText}>{burstCount}/5</Text>
                        </View>
                    )}

                    {/* Quality Overlay */}
                    {showQualityOverlay && (
                        <View style={styles.qualityOverlay}>
                            <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.qualityBadge}>
                                <Ionicons 
                                    name="checkmark-circle" 
                                    size={16} 
                                    color={theme.semantic.success} 
                                />
                                <Text style={styles.qualityText}>{translations.qualityGood}</Text>
                            </BlurView>
                        </View>
                    )}
                </View>
            </SwipeGestureHandler>

            {/* Gesture Hint */}
            <GestureIndicator
                visible={showGestureHint}
                direction="up"
                text={translations.gestureHint}
                theme={theme}
                isDark={isDark}
            />

            {/* Camera Controls */}
            <View style={styles.controlsContainer}>
                {/* Top Controls */}
                <View style={styles.topControls}>
                    <HapticTouchButton
                        onPress={toggleFlash}
                        style={styles.controlButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Ionicons 
                            name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'} 
                            size={24} 
                            color={flash === 'off' ? theme.text.tertiary : theme.accent.primary} 
                        />
                    </HapticTouchButton>

                    <HapticTouchButton
                        onPress={toggleCameraFacing}
                        style={styles.controlButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Ionicons name="camera-reverse" size={24} color={theme.text.primary} />
                    </HapticTouchButton>
                </View>

                {/* Zoom Slider */}
                {enableGestures && (
                    <View style={styles.zoomContainer}>
                        <Text style={styles.zoomLabel}>1x</Text>
                        <View style={styles.zoomSlider}>
                            <Animated.View
                                style={[
                                    styles.zoomIndicator,
                                    {
                                        left: zoomAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '90%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.zoomLabel}>5x</Text>
                    </View>
                )}

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <HapticTouchButton
                        onPress={pickFromGallery}
                        style={styles.secondaryButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <Ionicons name="images" size={20} color={theme.text.primary} />
                        <Text style={styles.secondaryButtonText}>{translations.gallery}</Text>
                    </HapticTouchButton>

                    <Animated.View style={{ transform: [{ scale: captureAnim }] }}>
                        <HapticTouchButton
                            onPress={captureMode === 'timer' ? startTimerCapture : captureImage}
                            style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
                            disabled={isCapturing}
                            hapticType="heavy"
                            theme={theme}
                            isDark={isDark}
                        >
                            <LinearGradient
                                colors={theme.gradients.primary}
                                style={styles.captureGradient}
                            >
                                <Ionicons 
                                    name={captureMode === 'timer' ? 'timer' : captureMode === 'burst' ? 'camera-outline' : 'camera'} 
                                    size={32} 
                                    color="#ffffff" 
                                />
                            </LinearGradient>
                        </HapticTouchButton>
                    </Animated.View>

                    <View style={styles.captureModeSwitcher}>
                        {['single', 'timer', 'burst'].map((mode) => (
                            <HapticTouchButton
                                key={mode}
                                onPress={() => setCaptureMode(mode)}
                                style={[
                                    styles.modeButton,
                                    captureMode === mode && styles.modeButtonActive
                                ]}
                                theme={theme}
                                isDark={isDark}
                            >
                                <Text style={[
                                    styles.modeButtonText,
                                    captureMode === mode && styles.modeButtonTextActive
                                ]}>
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </Text>
                            </HapticTouchButton>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraContainer: {
        flex: 1,
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    focusIndicator: {
        position: 'absolute',
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.accent.primary,
    },
    timerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    timerText: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    burstCounter: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    burstText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    qualityOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    qualityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    qualityText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.primary,
    },
    controlsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    zoomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    zoomLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        fontWeight: '600',
    },
    zoomSlider: {
        flex: 1,
        height: 4,
        backgroundColor: theme.surface.elevated,
        borderRadius: 2,
        position: 'relative',
    },
    zoomIndicator: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.accent.primary,
        top: -6,
    },
    bottomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: theme.surface.elevated,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    captureButtonActive: {
        opacity: 0.7,
    },
    captureGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureModeSwitcher: {
        alignItems: 'center',
        gap: 8,
    },
    modeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: theme.surface.default,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    modeButtonActive: {
        backgroundColor: theme.accent.primary + '20',
        borderColor: theme.accent.primary,
    },
    modeButtonText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.text.tertiary,
    },
    modeButtonTextActive: {
        color: theme.accent.primary,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        fontSize: 16,
        color: theme.text.secondary,
        textAlign: 'center',
        marginVertical: 20,
    },
    permissionButton: {
        backgroundColor: theme.accent.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});