import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { COLORS } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_CONFIG } from '../../lib/apiConfig';
import { getSystemPrompt } from '../../lib/supabase';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(API_CONFIG.GOOGLE_API_KEY);

// TCM Tongue Analysis Prompt
const TONGUE_ANALYSIS_PROMPT = `You are an expert Traditional Chinese Medicine (TCM) practitioner specializing in tongue diagnosis (舌诊).

Analyze this tongue image and provide a TCM-based assessment:

1. **Tongue Body Color** (舌色): Pale, Pink, Red, Deep Red, Purple, Blue-ish
2. **Tongue Shape** (舌形): Thin, Swollen, Teeth marks, Cracked, Stiff, Flaccid
3. **Tongue Coating** (舌苔): Thin white, Thick white, Yellow, Gray/Black, Peeled/No coating
4. **Moisture** (润燥): Moist, Dry, Slimy

Based on these observations, provide:
- **Overall Observation**: A brief TCM assessment in plain language
- **Potential Patterns**: List 2-3 possible TCM patterns/syndromes this may indicate
- **Confidence**: Your confidence level (0-100) in the analysis

Respond in JSON format:
{
  "observation": "Brief TCM assessment...",
  "tongue_color": "color observed",
  "tongue_shape": "shape characteristics",
  "tongue_coating": "coating description",
  "moisture": "moisture level",
  "potential_issues": ["Pattern 1", "Pattern 2"],
  "confidence": 85,
  "is_valid_image": true
}

If the image is NOT a tongue, set is_valid_image to false and explain what you see instead.`;

export default function TongueAnalysisStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();
    const [image, setImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const scanAnim = useRef(new Animated.Value(0)).current;

    const startScanningAnim = () => {
        scanAnim.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    };

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t.common.error || 'Permission Required',
                t.errors.cameraPermission || 'Camera permission is needed to take tongue photos for analysis.',
                [{ text: t.common.ok || 'OK' }]
            );
            return false;
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                cameraType: 'front',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setImage(asset);
                setAnalysisResult(null);
                setError(null);

                // Auto-analyze after capture
                analyzeImage(asset.base64);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError(t.errors.cameraError || 'Failed to open camera. Please try again.');
        }
    };

    const pickFromGallery = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setImage(asset);
                setAnalysisResult(null);
                setError(null);

                // Auto-analyze after selection
                analyzeImage(asset.base64);
            }
        } catch (err) {
            console.error('Gallery error:', err);
            setError(t.errors.galleryError || 'Failed to open gallery. Please try again.');
        }
    };

    const analyzeImage = async (base64Image) => {
        setIsAnalyzing(true);
        setError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startScanningAnim();

        try {
            // Fetch prompt from Admin Dashboard (Supabase)
            const basePrompt = await getSystemPrompt('doctor_tongue', TONGUE_ANALYSIS_PROMPT);

            const model = genAI.getGenerativeModel({ model: API_CONFIG.DEFAULT_MODEL });

            const result = await model.generateContent([
                basePrompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image,
                    },
                },
            ]);

            const responseText = result.response.text();

            // Parse JSON response
            const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            if (!analysis.is_valid_image) {
                setError(t.errors.invalidImage || 'This image does not appear to be a tongue. Please take a clear photo of your tongue.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
                setAnalysisResult(analysis);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Update form data
                onUpdate({
                    ...data,
                    tongueImage: image?.uri,
                    tongueAnalysis: analysis,
                });
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(t.errors.analysisError || 'Failed to analyze image. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const retakePhoto = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setImage(null);
        setAnalysisResult(null);
        setError(null);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.1)' }]}>
                    <Text style={styles.iconEmoji}>👅</Text>
                </View>
                <Text style={styles.title}>{t.tongue.title || 'Tongue Diagnosis'}</Text>
                <Text style={styles.subtitle}>
                    {t.tongue.subtitle || '舌诊 - Traditional tongue examination'}
                </Text>
            </View>

            {/* Image Preview or Capture Area */}
            {image ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />

                    {isAnalyzing && (
                        <View style={styles.analyzingOverlay}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    {
                                        transform: [{
                                            translateY: scanAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 280]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <LinearGradient
                                    colors={['transparent', theme.accent.primary, 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                />
                            </Animated.View>
                            <View style={styles.analyzingBadge}>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text style={styles.analyzingText}>{t.tongue.analyzing || 'Scanning Chi Patterns...'}</Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                        <BlurView intensity={30} tint="dark" style={styles.retakeBlur}>
                            <Ionicons name="camera-reverse" size={20} color="#ffffff" />
                            <Text style={styles.retakeText}>{t.common.retake || 'Retake'}</Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.captureArea}>
                    <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                        <LinearGradient
                            colors={isDark ? ['rgba(16,185,129,0.1)', 'rgba(6,78,59,0.2)'] : ['rgba(16,185,129,0.05)', 'rgba(16,185,129,0.1)']}
                            style={styles.cameraGradient}
                        >
                            <View style={styles.lensCircle}>
                                <Ionicons name="camera" size={48} color={theme.accent.primary} />
                            </View>
                            <Text style={styles.cameraText}>{t.tongue.capture || 'Capture Tongue Image'}</Text>
                            <Text style={styles.cameraSubtext}>{t.tongue.captureHint || 'For AI-powered TCM analysis'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                        <Ionicons name="images-outline" size={20} color={theme.text.tertiary} />
                        <Text style={styles.galleryText}>{t.common.gallery || 'Import from Gallery'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Error Display */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={20} color={theme.semantic.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Analysis Results */}
            {analysisResult && (
                <View style={styles.resultsContainer}>
                    <View style={styles.resultHeader}>
                        <View style={styles.successBadge}>
                            <Ionicons name="sparkles" size={18} color={theme.accent.primary} />
                            <Text style={styles.resultTitle}>{t.tongue.complete || 'Vision Insight Complete'}</Text>
                        </View>
                        <View style={styles.confidenceBadge}>
                            <Text style={styles.confidenceLabel}>{t.common.confidence || 'Confidence'}</Text>
                            <Text style={styles.confidenceText}>{analysisResult.confidence}%</Text>
                        </View>
                    </View>

                    {/* Observation */}
                    <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.resultCard}>
                        <LinearGradient
                            colors={isDark ? ['rgba(255,255,255,0.05)', 'transparent'] : ['rgba(0,0,0,0.02)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                        />
                        <Text style={styles.resultLabel}>{t.tongue.observation || 'Analysis Summary'}</Text>
                        <Text style={styles.resultValue}>{analysisResult.observation}</Text>
                    </BlurView>

                    {/* Tongue Characteristics Grid */}
                    <View style={styles.characteristicsGrid}>
                        {[
                            { label: t.tongue.color || 'Color', value: analysisResult.tongue_color, icon: 'color-palette-outline' },
                            { label: t.tongue.shape || 'Shape', value: analysisResult.tongue_shape, icon: 'body-outline' },
                            { label: t.tongue.coating || 'Coating', value: analysisResult.tongue_coating, icon: 'layers-outline' },
                            { label: t.tongue.moisture || 'Moisture', value: analysisResult.moisture, icon: 'water-outline' },
                        ].map((item, idx) => (
                            <BlurView key={idx} intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.charItem}>
                                <Ionicons name={item.icon} size={14} color={theme.accent.primary} style={{ marginBottom: 4 }} />
                                <Text style={styles.charLabel}>{item.label}</Text>
                                <Text style={styles.charValue}>{item.value}</Text>
                            </BlurView>
                        ))}
                    </View>

                    {/* Potential Patterns */}
                    {analysisResult.potential_issues?.length > 0 && (
                        <View style={styles.issuesContainer}>
                            <Text style={styles.issuesLabel}>{t.tongue.issues || 'TCM Pattern Correlation'}</Text>
                            <View style={styles.issuesList}>
                                {analysisResult.potential_issues.map((issue, index) => (
                                    <View key={index} style={styles.issueTag}>
                                        <LinearGradient
                                            colors={theme.gradients.primary}
                                            style={styles.tagGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Ionicons name="leaf" size={14} color="#ffffff" />
                                            <Text style={styles.issueText}>{issue}</Text>
                                        </LinearGradient>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Tips */}
            {!image && (
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>{t.tongue.tipsTitle || '📋 Photo Tips'}</Text>
                    <Text style={styles.tipItem}>• {t.tongue.tip1 || "Stick tongue out naturally, don't curl"}</Text>
                    <Text style={styles.tipItem}>• {t.tongue.tip2 || "Use natural daylight if possible"}</Text>
                    <Text style={styles.tipItem}>• {t.tongue.tip3 || "Avoid eating colored foods beforehand"}</Text>
                    <Text style={styles.tipItem}>• {t.tongue.tip4 || "Keep mouth open wide"}</Text>
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24, paddingVertical: 10 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: theme.accent.primary + '30',
    },
    iconEmoji: { fontSize: 36 },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.text.secondary },
    captureArea: { alignItems: 'center', marginBottom: 24 },
    cameraButton: {
        width: '100%',
        height: 220,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.accent.primary + '40',
        marginBottom: 20,
    },
    cameraGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    lensCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.accent.primary,
        marginBottom: 16,
    },
    cameraText: { color: theme.text.primary, fontSize: 18, fontWeight: 'bold' },
    cameraSubtext: { color: theme.text.tertiary, fontSize: 13, marginTop: 4 },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    galleryText: { color: theme.text.tertiary, fontSize: 14, fontWeight: '600' },
    previewContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border.default,
        marginBottom: 24,
        height: 300,
    },
    previewImage: { width: '100%', height: '100%' },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 10,
    },
    analyzingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.accent.primary,
    },
    analyzingText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
    retakeButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    retakeBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    retakeText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.semantic.error + '15',
        marginBottom: 16,
    },
    errorText: { flex: 1, color: theme.semantic.error, fontSize: 14 },
    resultsContainer: { marginBottom: 24 },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text.primary },
    confidenceBadge: {
        alignItems: 'flex-end',
    },
    confidenceLabel: { fontSize: 10, color: theme.text.tertiary, textTransform: 'uppercase' },
    confidenceText: { fontSize: 16, fontWeight: 'bold', color: theme.accent.primary },
    resultCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        overflow: 'hidden',
        marginBottom: 16,
    },
    resultLabel: { fontSize: 11, color: theme.text.tertiary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
    resultValue: { fontSize: 15, color: theme.text.primary, lineHeight: 22 },
    characteristicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    charItem: {
        flex: 1,
        minWidth: '45%',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        overflow: 'hidden',
    },
    charLabel: { fontSize: 10, color: theme.text.tertiary, marginBottom: 4, fontWeight: '600' },
    charValue: { fontSize: 14, color: theme.text.primary, fontWeight: 'bold' },
    issuesContainer: { marginTop: 8 },
    issuesLabel: { fontSize: 11, color: theme.text.tertiary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
    issuesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    issueTag: { borderRadius: 12, overflow: 'hidden' },
    tagGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    issueText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
    tipsContainer: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: isDark ? 'rgba(251,191,36,0.05)' : 'rgba(251,191,36,0.02)',
        borderWidth: 1,
        borderColor: theme.accent.secondary + '30',
    },
    tipsTitle: { fontSize: 15, fontWeight: 'bold', color: theme.accent.secondary, marginBottom: 12 },
    tipItem: { fontSize: 13, color: theme.text.secondary, marginBottom: 8, lineHeight: 20 },
});
